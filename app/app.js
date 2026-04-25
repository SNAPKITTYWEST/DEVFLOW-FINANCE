const STORAGE_KEY = "devflow-crm-state";
const API_BASE_URL = 'http://localhost:5000';
const BIFROST_SYNC_ENDPOINT = `${API_BASE_URL}/api/finance/bifrost/sync`;
const REVENUE_API = `${API_BASE_URL}/api/revenue`;
const PLAID_API = `${API_BASE_URL}/api/plaid`;
const OPEN_COLLECTIVE_SLUG = "snapkitty";

let state = null;

const runtimeState = {
  collectiveSyncPending: false,
  plaidLinkToken: null,
  analyticsCache: { scs: 650, hash: "" },
  oracleRefreshPending: false,
  lastOracleRefresh: 0,
  reconciliationState: "OK"
};

async function fetchPlaidLinkToken() {
  try {
    var res = await fetch(PLAID_API + "/create-link-token", { method: "POST" });
    if (res.ok) {
      var data = await res.json();
      return data.link_token;
    }
  } catch (e) { console.log("[PLAID] Link token failed:", e.message); }
  return null;
}

async function exchangePlaidToken(publicToken) {
  try {
    var res = await fetch(PLAID_API + "/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken: publicToken })
    });
    return res.ok;
  } catch (e) { console.log("[PLAID] Exchange failed:", e.message); }
  return false;
}

async function fetchPlaidBalances() {
  try {
    var res = await fetch(PLAID_API + "/balances");
    if (res.ok) {
      var data = await res.json();
      return data.accounts || [];
    }
  } catch (e) { console.log("[PLAID] Balances failed:", e.message); }
  return [];
}

async function fetchRevenueFromAPI(endpoint) {
  try {
    var res = await fetch(endpoint);
    if (res.ok) {
      var data = await res.json();
      return data.contracts || data.invoices || data.payments || [];
    }
  } catch (e) { console.log("[REVENUE] API fetch failed:", e.message); }
  return [];
}

function syncRevenueData() {
  fetchRevenueFromAPI(REVENUE_API + "/contracts").then(function(contracts) {
    if (contracts && contracts.length > 0) state.contracts = contracts;
  }).catch(function(e) { console.log("[REVENUE] Contracts fetch failed, using local"); });
  fetchRevenueFromAPI(REVENUE_API + "/invoices").then(function(invoices) {
    if (invoices && invoices.length > 0) state.invoices = invoices;
  }).catch(function(e) { console.log("[REVENUE] Invoices fetch failed, using local"); });
  fetchRevenueFromAPI(REVENUE_API + "/payments").then(function(payments) {
    if (payments && payments.length > 0) state.payments = payments;
  }).catch(function(e) { console.log("[REVENUE] Payments fetch failed, using local"); });
}

const createSeedState = () => ({
  contacts: [
    { id: crypto.randomUUID(), name: "Maya Carter", company: "Northwind Labs", email: "maya@northwind.dev", status: "Qualified" },
    { id: crypto.randomUUID(), name: "Andre Bennett", company: "Verve Studio", email: "andre@vervestudio.io", status: "Lead" },
    { id: crypto.randomUUID(), name: "Lina Torres", company: "Peak Ledger", email: "lina@peakledger.com", status: "Customer" }
  ],
  deals: [
    { id: crypto.randomUUID(), title: "Northwind Retainer", owner: "Jessi", value: 18000, stage: "Proposal" },
    { id: crypto.randomUUID(), title: "Peak Ledger Expansion", owner: "Sam", value: 26000, stage: "Negotiation" },
    { id: crypto.randomUUID(), title: "Verve Discovery Sprint", owner: "Jessi", value: 6400, stage: "Discovery" },
    { id: crypto.randomUUID(), title: "Atlas Referral", owner: "Chris", value: 12500, stage: "Won" }
  ],
  // Revenue Flow - ASC 606
  contracts: [
    { id: crypto.randomUUID(), customer: "Northwind Labs", value: 18000, status: "active", startDate: "2024-01-15", endDate: "2025-01-14" },
    { id: crypto.randomUUID(), customer: "Peak Ledger", value: 26000, status: "active", startDate: "2024-02-01", endDate: "2025-01-31" }
  ],
  invoices: [
    { id: crypto.randomUUID(), contractId: null, customer: "Northwind Labs", amount: 18000, status: "paid", issuedAt: "2024-01-15", paidAt: "2024-01-20" },
    { id: crypto.randomUUID(), contractId: null, customer: "Peak Ledger", amount: 13000, status: "issued", issuedAt: "2024-02-15", dueDate: "2024-03-15" },
    { id: crypto.randomUUID(), contractId: null, customer: "Verve Studio", amount: 3200, status: "draft", issuedAt: null, dueDate: null }
  ],
  payments: [
    { id: crypto.randomUUID(), invoiceId: null, amount: 18000, method: "card", status: "completed", receivedAt: "2024-01-20" }
  ],
  // Procurement - Vendors / POs / Receipts
  vendors: [
    { id: crypto.randomUUID(), name: "AWS", email: "billing@aws.amazon.com", status: "active" },
    { id: crypto.randomUUID(), name: "Stripe", email: "support@stripe.com", status: "active" },
    { id: crypto.randomUUID(), name: "Google Cloud", email: "billing@cloud.google.com", status: "active" }
  ],
  purchaseOrders: [
    { id: crypto.randomUUID(), vendorId: null, poNumber: "PO-2024-0001", amount: 2500, status: "approved", dueDate: "2024-03-01" }
  ],
  receipts: [],
  tasks: [
    { id: crypto.randomUUID(), title: "Send proposal revision", owner: "Jessi", dueDate: offsetDate(2), priority: "High", completed: false },
    { id: crypto.randomUUID(), title: "Book discovery call", owner: "Sam", dueDate: offsetDate(4), priority: "Medium", completed: false },
    { id: crypto.randomUUID(), title: "Share onboarding checklist", owner: "Chris", dueDate: offsetDate(-1), priority: "Low", completed: true }
  ],
  activity: [
    { id: crypto.randomUUID(), text: "System initialized", time: timestampLabel() }
  ],
  funds: createDualLedgerState()
});

function createDualLedgerState() {
  return {
    canonicalLedger: {
      id: "canonical-primary",
      type: "PRIMARY",
      description: "Canonical Ledger - SOX Compliant Source of Truth",
      lastReconciled: null,
      reconciledBy: null
    },
    segmentLedgers: [
      {
        id: "digital-inclusion-fund",
        name: "Digital Inclusion Fund",
        type: "nonprofit",
        slug: "snapkitty",
        balance: 0,
        vault: 0,
        currency: "USD",
        lastSync: "Never",
        parentLedger: "canonical-primary"
      },
      {
        id: "operating-revenue",
        name: "Operating Revenue", 
        type: "bcorp",
        slug: "snapkitty",
        balance: 0,
        vault: 0,
        currency: "USD",
        lastSync: "Never",
        parentLedger: "canonical-primary"
      }
    ],
    activeEntityId: "digital-inclusion-fund",
    sovereignCreditScore: 650,
    finance: {
      nonProfitBalanceCents: 0,
      bCorpBalanceCents: 0,
      trustVaultCents: 0,
      lastBridgeSync: "Never"
    },
    asc606: {
      contracts: [],
      performanceObligations: [],
      recognitionSchedule: [],
      schemaVersion: "1.0.0",
      lastAuditTimestamp: null
    },
    syncBridge: {
      sourceSystem: "OpenCollective",
      destinationSystem: "CanonicalLedger",
      reconciliationRules: "BALANCE_MATCH",
      conflictResolutionPolicy: "PRIMARY_WINS",
      lastReconciliation: null,
      replaySafetyEnabled: true
    }
  };
}

let state = loadState();

const elements = {
  contactsCount: document.querySelector("#contacts-count"),
  openDealsCount: document.querySelector("#open-deals-count"),
  pipelineValue: document.querySelector("#pipeline-value"),
  dueTasksCount: document.querySelector("#due-tasks-count"),
  sovereigntyRatio: document.querySelector("#sovereignty-ratio"),
  fundBalance: document.querySelector("#fund-balance"),
  entitySelector: document.querySelector("#entity-selector"),
  entityType: document.querySelector("#entity-type"),
  difBalance: document.querySelector("#dif-balance"),
  opBalance: document.querySelector("#op-balance"),
  vaultBalance: document.querySelector("#vault-balance"),
  scsGauge: document.querySelector("#scs-gauge"),
  scsBadge: document.querySelector("#scs-badge"),
  totalLiquidity: document.querySelector("#total-liquidity"),
  totalLiquidityDisplay: document.querySelector("#total-liquidity-display"),
  pipelineExposure: document.querySelector("#pipeline-exposure"),
  netPosition: document.querySelector("#net-position"),
  vaultAnchor: document.querySelector("#vault-anchor"),
  scsIntel: document.querySelector("#scs-intel"),
  scsScore: document.querySelector("#scs-score"),
  scsRiskBadge: document.querySelector("#scs-risk-badge"),
  statusBadge: document.querySelector("#status-badge"),
  tradeVolume: document.querySelector("#trade-volume"),
  visaLimit: document.querySelector("#visa-limit"),
  issueCardBtn: document.querySelector("#issue-card-btn"),
  contactsList: document.querySelector("#contacts-list"),
  dealsBoard: document.querySelector("#deals-board"),
  tasksList: document.querySelector("#tasks-list"),
  activityList: document.querySelector("#activity-list"),
  sidebarHealth: document.querySelector("#sidebar-health"),
  sidebarHealthDetail: document.querySelector("#sidebar-health-detail"),
  contactForm: document.querySelector("#contact-form"),
  dealForm: document.querySelector("#deal-form"),
  taskForm: document.querySelector("#task-form"),
  seedButton: document.querySelector("#seed-button"),
  syncButton: document.querySelector("#sync-button"),
  heartbeatDot: document.querySelector(".heartbeat-dot"),
  heartbeatLabel: document.querySelector(".heartbeat-label")
};

elements.contactForm.addEventListener("submit", handleContactSubmit);
elements.dealForm.addEventListener("submit", handleDealSubmit);
elements.taskForm.addEventListener("submit", handleTaskSubmit);
elements.syncButton.addEventListener("click", syncOpenCollective);
elements.entitySelector.addEventListener("change", (e) => {
  switchActiveEntity(e.currentTarget.value);
});
if (elements.seedButton) {
  elements.seedButton.addEventListener("click", () => {
    state = createSeedState();
    persistState();
    render();
  });
}

if (elements.issueCardBtn) {
  var amount = prompt("Enter virtual card amount in USD:");
  if (amount && !isNaN(amount) && Number(amount) > 0) {
    issueVirtualCard(Number(amount));
  }
});

function issueVirtualCard(amountDollars) {
  var cardNumber = "4" + Math.floor(Math.random() * 1e15).toString().padStart(15, "0");
  var masked = "**** **** **** " + cardNumber.slice(-4);
  var expiry = (new Date().getFullYear()) + "-" + String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  
  console.log("[BaaS] Virtual Card Issued:", masked, "| Amount:", amountDollars);
  pushActivity("Issued virtual card " + masked + " for $" + amountDollars);
  alert("Virtual Card Issued!\nNumber: " + masked + "\nExpires: " + expiry + "\nAmount: $" + amountDollars);
  render();
}

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const seeded = createSeedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return normalizeState(JSON.parse(saved));
  } catch {
    const seeded = createSeedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function normalizeState(savedState) {
  var legacyBalance = 0;
  var legacyCurrency = "USD";
  var legacyLastSync = "Never";
  
  if (savedState) {
    if (savedState.collectiveStats && savedState.collectiveStats.balance) {
      legacyBalance = Number(savedState.collectiveStats.balance) / 100;
      legacyCurrency = String(savedState.collectiveStats.currency || "USD");
      legacyLastSync = String(savedState.collectiveStats.lastSync || "Never");
    } else if (savedState.finance && savedState.finance.collectiveBalanceCents) {
      legacyBalance = Number(savedState.finance.collectiveBalanceCents) / 100;
      legacyCurrency = String(savedState.finance.collectiveCurrency || "USD");
      if (savedState.finance.lastSyncedAt) {
        legacyLastSync = formatSyncLabel(savedState.finance.lastSyncedAt);
      }
    }
  }

  var hasEntities = false;
  if (savedState && savedState.funds && savedState.funds.entities && savedState.funds.entities.length > 0) {
    hasEntities = true;
  }

  return {
    contacts: Array.isArray(savedState && savedState.contacts) ? savedState.contacts : [],
    deals: Array.isArray(savedState && savedState.deals) ? savedState.deals : [],
    tasks: Array.isArray(savedState && savedState.tasks) ? savedState.tasks : [],
    activity: Array.isArray(savedState && savedState.activity) ? savedState.activity : [],
    funds: hasEntities ? savedState.funds : createDualLedgerState(legacyBalance, legacyCurrency, legacyLastSync)
  };
}

function createDualLedgerState(legacyBalance, legacyCurrency, legacyLastSync) {
  return {
    entities: [
      {
        id: "digital-inclusion-fund",
        name: "Digital Inclusion Fund",
        type: "nonprofit",
        slug: "snapkitty",
        balance: legacyBalance,
        currency: legacyCurrency,
        lastSync: legacyLastSync
      },
      {
        id: "operating-revenue",
        name: "Operating Revenue",
        type: "bcorp",
        slug: "snapkitty",
        balance: 0,
        currency: "USD",
        lastSync: "Never"
      }
    ],
    activeEntityId: "digital-inclusion-fund"
  };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function handleContactSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const contact = {
    id: crypto.randomUUID(),
    name: String(formData.get("name")).trim(),
    company: String(formData.get("company")).trim(),
    email: String(formData.get("email")).trim(),
    status: String(formData.get("status"))
  };

  state.contacts.unshift(contact);
  pushActivity(`Added contact ${contact.name} from ${contact.company}`);
  event.currentTarget.reset();
  persistState();
  render();
}

function handleDealSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const deal = {
    id: crypto.randomUUID(),
    title: String(formData.get("title")).trim(),
    owner: String(formData.get("owner")).trim(),
    value: Number(formData.get("value")),
    stage: String(formData.get("stage"))
  };

  state.deals.unshift(deal);
  pushActivity(`Created deal ${deal.title} for ${formatCurrency(deal.value)}`);
  event.currentTarget.reset();
  persistState();
  render();
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const task = {
    id: crypto.randomUUID(),
    title: String(formData.get("title")).trim(),
    owner: String(formData.get("owner")).trim(),
    dueDate: String(formData.get("dueDate")),
    priority: String(formData.get("priority")),
    completed: false
  };

  state.tasks.unshift(task);
  pushActivity(`Assigned task ${task.title} to ${task.owner}`);
  event.currentTarget.reset();
  persistState();
  render();
}

const EVENT_SCHEMA_VERSION = "1.0.0";

function pushActivity(text, eventType = "INFO") {
  var eventId = crypto.randomUUID();
  var timestamp = timestampLabel();
  
  state.activity.unshift({
    id: eventId,
    schemaVersion: EVENT_SCHEMA_VERSION,
    eventType: eventType,
    immutable: true,
    timestamp: Date.now(),
    text: text,
    time: timestamp
  });
  state.activity = state.activity.slice(0, 8);
  
  console.log("[EVENT_BUS] " + eventType + " v" + EVENT_SCHEMA_VERSION + " | " + eventId + " | " + timestamp);
}

function renderLedgerTimeline() {
  var timelineEl = document.getElementById("ledger-timeline");
  if (!timelineEl) return;
  
  if (!state.activity || state.activity.length === 0) {
    timelineEl.innerHTML = '<p class="empty">No ledger events recorded.</p>';
    return;
  }
  
  timelineEl.innerHTML = state.activity.map(function(entry) {
    var eventType = entry.eventType || "INFO";
    var schemaVersion = entry.schemaVersion || "1.0";
    var timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : entry.time;
    var isImmutable = entry.immutable ? "🔒" : "";
    
    return '<article class="timeline-event" data-event-id="' + entry.id + '">' +
      '<div class="event-header">' +
        '<span class="event-type badge ' + eventType.toLowerCase() + '">' + eventType + '</span>' +
        '<span class="event-version">v' + schemaVersion + '</span>' +
        '<span class="event-immutable">' + isImmutable + '</span>' +
        '<span class="event-time">' + timestamp + '</span>' +
      '</div>' +
      '<div class="event-text">' + escapeHtml(entry.text) + '</div>' +
      '<div class="event-id">ID: ' + entry.id + '</div>' +
    '</article>';
  }).join("");
  
  var events = timelineEl.querySelectorAll(".timeline-event");
  for (var i = 0; i < events.length; i++) {
    events[i].addEventListener("click", function() {
      var detailPanel = document.getElementById("ledger-details");
      var eventJson = document.getElementById("event-detail-json");
      var ledgerJson = document.getElementById("ledger-state-json");
      
      var eventId = this.getAttribute("data-event-id");
      var event = state.activity.find(function(e) { return e.id === eventId; });
      
      if (detailPanel && eventJson && ledgerJson) {
        detailPanel.style.display = "grid";
        eventJson.textContent = JSON.stringify(event, null, 2);
        ledgerJson.textContent = JSON.stringify(state.funds, null, 2);
      }
    });
  }
}

function renderTaxDashboard() {
  var deductibleEl = document.getElementById("tax-deductible");
  var liabilityEl = document.getElementById("tax-liability");
  var readinessEl = document.getElementById("audit-readiness-score");
  var flaggedEl = document.getElementById("tax-flagged-list");
  
  var totalRevenue = state.deals.filter(function(d) { return d.stage === "Won"; })
    .reduce(function(sum, d) { return sum + d.value; }, 0);
  
  var deductibleEstimate = Math.round(totalRevenue * 0.7);
  var liabilityEstimate = Math.round(totalRevenue * 0.25);
  
  var flaggedEvents = state.activity.filter(function(e) {
    return e.eventType === "RECONCILIATION_MISMATCH" || e.eventType === "ERROR";
  });
  
  if (readinessEl) {
    var score = flaggedEvents.length === 0 ? "100%" : (flaggedEvents.length === 1 ? "85%" : "70%");
    readinessEl.textContent = score;
    readinessEl.className = "value " + (score === "100%" ? "score-good" : (score === "85%" ? "score-warning" : "score-danger"));
  }
  
  if (deductibleEl) deductibleEl.textContent = formatCurrency(deductibleEstimate, "USD", 0);
  if (liabilityEl) liabilityEl.textContent = formatCurrency(liabilityEstimate, "USD", 0);
  
  if (flaggedEl) {
    if (flaggedEvents.length === 0) {
      flaggedEl.innerHTML = '<p class="empty">No flagged transactions.</p>';
    } else {
      flaggedEl.innerHTML = flaggedEvents.map(function(e) {
        return '<article class="flagged-item"><span>' + escapeHtml(e.text) + '</span><span>' + e.time + '</span></article>';
      }).join("");
    }
  }
}

function render() {
  try {
    syncRevenueData();
    renderStats();
    renderFinanceCard();
    renderLedgerTimeline();
    renderTaxDashboard();
    renderRevenueFlow();
    renderProcurement();
    renderContacts();
    renderDeals();
    renderTasks();
    renderActivity();
    runSovereignAnalytics();
    refreshOracles();
    initNavigation();
    console.log("🏛️ Sovereign UI Rendered Successfully");
  } catch (e) {
    console.error("CRITICAL RENDER ERROR:", e);
    document.body.innerHTML = `<h1 style="color:red;padding:20px">System Error: ${e.message}</h1><button onclick="localStorage.clear();location.reload()" style="padding:10px">Hard Reset System</button>`;
  }
}

function initNavigation() {
  var navItems = document.querySelectorAll('.nav-item[data-view]');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].addEventListener('click', function(e) {
      e.preventDefault();
      var view = this.getAttribute('data-view');
      switchView(view);
    });
  }
  
  var quickBtns = document.querySelectorAll('.quick-btn[data-query]');
  for (var j = 0; j < quickBtns.length; j++) {
    quickBtns[j].addEventListener('click', function() {
      var query = this.getAttribute('data-query');
      handleAIQuery(query);
    });
  }
}

function switchView(viewName) {
  var navItems = document.querySelectorAll('.nav-item[data-view]');
  for (var i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove('active');
  }
  
  var views = document.querySelectorAll('.view');
  for (var j = 0; j < views.length; j++) {
    views[j].classList.remove('active');
  }
  
  var activeNav = document.querySelector('.nav-item[data-view="' + viewName + '"]');
  var activeView = document.getElementById('view-' + viewName);
  
  if (activeNav) activeNav.classList.add('active');
  if (activeView) activeView.classList.add('active');
}

function handleAIQuery(query) {
  console.log("[AI] Query:", query);
  
  var responses = {
    "Why is revenue down?": "Revenue is down because several deals are stuck in 'Proposal' stage. Consider following up with 3 accounts that have been idle for 14+ days.",
    "Show risky accounts": "3 accounts show risk signals: Peak Ledger (payment overdue 30 days), Northwind Labs (health score dropped 40%), Verve Studio (no activity 45 days).",
    "Revenue forecast": "Based on current pipeline ($62,900), projected revenue next quarter is $48,500 if all deals close at current rate. SCS score supports $35,000 in credit."
  };
  
  var response = responses[query] || "Analyzing your revenue data... " + query;
  
  var aiResponse = document.getElementById('ai-response');
  if (aiResponse) {
    aiResponse.innerHTML = '<p>' + response + '</p>';
  }
}

function getAnalyticsHash() {
  var pipelineValue = getOpenPipelineValueDollars();
  var wonDealsValue = getWonDealsValue();
  var totalLiquid = 0;
  var totalVault = 0;
  
  if (state.funds && state.funds.segmentLedgers) {
    for (var i = 0; i < state.funds.segmentLedgers.length; i++) {
      var entity = state.funds.segmentLedgers[i];
      totalLiquid += entity.balance;
      totalVault += entity.vault || 0;
    }
  }
  
  return totalLiquid + "|" + totalVault + "|" + pipelineValue + "|" + wonDealsValue;
}

function runSovereignAnalytics() {
  var currentHash = getAnalyticsHash();
  
  if (currentHash === runtimeState.analyticsCache.hash && runtimeState.analyticsCache.scs) {
    console.log("[CACHE] SCS hit:", runtimeState.analyticsCache.scs);
    return;
  }
  
  runtimeState.analyticsCache.hash = currentHash;

  var pipelineValue = getOpenPipelineValueDollars();
  var wonDealsValue = getWonDealsValue();
  
  var totalLiquid = 0;
  var totalVault = 0;
  var nonProfitBalance = 0;
  var bCorpBalance = 0;
  
  if (state.funds && state.funds.segmentLedgers) {
    for (var i = 0; i < state.funds.segmentLedgers.length; i++) {
      var entity = state.funds.segmentLedgers[i];
      totalLiquid += entity.balance;
      totalVault += entity.vault || 0;
      if (entity.type === "nonprofit") {
        nonProfitBalance = entity.balance;
      } else if (entity.type === "bcorp") {
        bCorpBalance = entity.balance;
      }
    }
  }
  
  var totalAssets = totalLiquid + totalVault;
  var tradeVolume = wonDealsValue;
  
  var baseScore = 500;
  if (totalAssets > 0) {
    baseScore += Math.min(150, Math.round((totalAssets / (tradeVolume + 1)) * 50));
  }
  if (tradeVolume > 0) {
    baseScore += Math.min(100, Math.round(Math.log10(tradeVolume + 1) * 20));
  }
  
  var scs = Math.min(850, Math.max(300, baseScore));
  var newStatus = "EXPANDING";
  if (scs >= 700) {
    newStatus = "MINIMAL RISK";
  } else if (scs >= 600) {
    newStatus = "STABLE";
  } else if (scs >= 500) {
    newStatus = "GROWTH";
  }
  
  if (state.funds) {
    state.funds.sovereignCreditScore = scs;
  }
  
  console.log("[ANALYTICS] SCS:", scs, "| Status:", newStatus, "| Net:", totalLiquid - pipelineValue);
}

function renderStats() {
  var openDeals = getOpenDeals();
  var pipelineValue = getOpenPipelineValueDollars();
  var dueTasks = [];
  if (state.tasks) {
    for (var i = 0; i < state.tasks.length; i++) {
      var task = state.tasks[i];
      if (!task.completed && daysUntil(task.dueDate) <= 7) {
        dueTasks.push(task);
      }
    }
  }

  var totalLiquid = 0;
  var totalVault = 0;
  if (state.funds && state.funds.segmentLedgers) {
    for (var j = 0; j < state.funds.segmentLedgers.length; j++) {
      totalLiquid += state.funds.segmentLedgers[j].balance;
      totalVault += state.funds.segmentLedgers[j].vault || 0;
    }
  }

  var netPosition = totalLiquid - pipelineValue;
  var scs = state.funds && state.funds.sovereignCreditScore ? state.funds.sovereignCreditScore : 650;
  var statusLabel = "STABLE";
  if (netPosition > pipelineValue) {
    statusLabel = "SOVEREIGN";
  } else if (netPosition < 0) {
    statusLabel = "EXPANDING";
  }

  elements.contactsCount.textContent = String(state.contacts ? state.contacts.length : 0);
  elements.openDealsCount.textContent = String(openDeals.length);
  elements.pipelineValue.textContent = formatCurrency(pipelineValue);
  elements.dueTasksCount.textContent = String(dueTasks.length);

  elements.totalLiquidity.textContent = formatCurrency(totalLiquid, "USD", 0);
  elements.pipelineExposure.textContent = formatCurrency(pipelineValue, "USD", 0);
  elements.netPosition.textContent = formatCurrency(netPosition, "USD", 0);
  elements.vaultAnchor.textContent = formatCurrency(totalVault, "USD", 0);
  elements.scsIntel.textContent = String(scs);
  elements.statusBadge.textContent = statusLabel;

  if (dueTasks.length > 3) {
    elements.sidebarHealth.textContent = "Attention Needed";
    elements.sidebarHealthDetail.textContent = dueTasks.length + " tasks due within 7 days";
  } else if (openDeals.length >= 3) {
    elements.sidebarHealth.textContent = "Stable";
    elements.sidebarHealthDetail.textContent = openDeals.length + " active deals in motion";
  } else {
    elements.sidebarHealth.textContent = "Light Load";
    elements.sidebarHealthDetail.textContent = "Pipeline has room for more outreach";
  }
}

function renderFinanceCard() {
  var pipelineValue = getOpenPipelineValueDollars();
  var activeEntity = getActiveEntity();
  var entityBalance = activeEntity ? activeEntity.balance : 0;
  
  var totalLiquid = 0;
  var totalVault = 0;
  if (state.funds && state.funds.segmentLedgers) {
    for (var i = 0; i < state.funds.segmentLedgers.length; i++) {
      totalLiquid += state.funds.segmentLedgers[i].balance;
      totalVault += state.funds.segmentLedgers[i].vault || 0;
    }
  }
  
  var ratio = pipelineValue > 0 ? totalLiquid / pipelineValue : (pipelineValue === 0 && totalLiquid > 0 ? 1 : (totalLiquid > 0 ? 1 : 0));
  var operationalStatus = ratio > 1.0 ? "COVERED" : (ratio >= 0.5 ? "STABLE" : "EXPANDING");
  
  var scs = state.funds && state.funds.sovereignCreditScore ? state.funds.sovereignCreditScore : 650;
  var scsVersion = "v2.1";
  var scsLabel = " Expansionary ";
  var scsClass = "medium";
  if (scs >= 700) {
    scsLabel = " Minimal Risk ";
    scsClass = "low";
  } else if (scs < 600) {
    scsLabel = " Expansionary ";
    scsClass = "high";
  }
  
  elements.sovereigntyRatio.textContent = ratio.toFixed(2) + " (" + operationalStatus + ")";
  elements.fundBalance.textContent = formatCurrency(entityBalance, activeEntity ? activeEntity.currency : "USD", 2);
  elements.difBalance.textContent = formatCurrency(totalLiquid, "USD", 2);
  elements.opBalance.textContent = formatCurrency(totalVault, "USD", 2);
  elements.vaultBalance.textContent = formatCurrency(totalVault, "USD", 2);
  elements.scsGauge.textContent = String(scs);
  elements.scsBadge.textContent = scsLabel + " [" + scsVersion + "]";
  elements.scsBadge.title = "SCS " + scsVersion + " - Internal Operational Model Only - Non-Credit Scoring";
  elements.scsBadge.className = "badge " + scsClass;
  elements.entitySelector.value = state.funds ? state.funds.activeEntityId : "digital-inclusion-fund";
  elements.entityType.textContent = activeEntity && activeEntity.type === "nonprofit" ? "🏛️ Non-Profit" : "💼 B-Corp";

  elements.syncButton.disabled = runtimeState.collectiveSyncPending;
  elements.syncButton.textContent = runtimeState.collectiveSyncPending
    ? "Syncing..."
    : "🔄 Sync Bifrost Bridge";

  if (activeEntity && activeEntity.lastSync && activeEntity.lastSync !== "Never") {
    elements.syncButton.title = "Last synced " + activeEntity.lastSync;
  } else {
    elements.syncButton.removeAttribute("title");
  }
  
  runtimeState.analyticsCache.scs = scs;
  
  var plaidBtn = document.getElementById("plaid-connect-btn");
  if (plaidBtn) {
    plaidBtn.onclick = async function() {
      var linkToken = await fetchPlaidLinkToken();
      if (linkToken && window.Plaid) {
        var handler = window.Plaid.create({
          token: linkToken,
          onSuccess: async function(publicToken) {
            var ok = await exchangePlaidToken(publicToken);
            if (ok) {
              var accounts = await fetchPlaidBalances();
              state.funds.plaidAccounts = accounts;
              renderFinanceCard();
            }
          }
        });
        handler.open();
      }
    };
  }
}

function renderRevenueFlow() {
  var contractsEl = document.getElementById("pipeline-contracts");
  var invoicesEl = document.getElementById("pipeline-invoices");
  var paymentsEl = document.getElementById("pipeline-payments");
  var recognizedEl = document.getElementById("pipeline-recognized");
  
  if (contractsEl) {
    var contracts = state.contracts || [];
    contractsEl.innerHTML = contracts.map(function(c) {
      return '<article class="card"><h4>' + escapeHtml(c.customer) + '</h4><span class="badge">' + formatCurrency(c.value) + '</span><span class="badge ' + c.status + '">' + c.status + '</span></article>';
    }).join("") || '<p class="empty">No contracts</p>';
  }
  
  if (invoicesEl) {
    var invoices = state.invoices || [];
    invoicesEl.innerHTML = invoices.map(function(i) {
      var badgeClass = i.status === "paid" ? "success" : (i.status === "issued" ? "warning" : "draft");
      return '<article class="card"><h4>' + escapeHtml(i.customer) + '</h4><span class="badge">' + formatCurrency(i.amount) + '</span><span class="badge ' + badgeClass + '">' + i.status + '</span></article>';
    }).join("") || '<p class="empty">No invoices</p>';
  }
  
  if (paymentsEl) {
    var payments = state.payments || [];
    paymentsEl.innerHTML = payments.map(function(p) {
      return '<article class="card"><span>' + formatCurrency(p.amount) + '</span><span class="badge">' + p.method + '</span><span class="badge completed">' + p.status + '</span></article>';
    }).join("") || '<p class="empty">No payments</p>';
  }
  
  if (recognizedEl) {
    var totalRecognized = 0;
    if (state.payments) {
      for (var i = 0; i < state.payments.length; i++) {
        if (state.payments[i].status === "completed") {
          totalRecognized += state.payments[i].amount;
        }
      }
    }
    recognizedEl.innerHTML = '<article class="card"><span class="stat-value">' + formatCurrency(totalRecognized) + '</span><span class="meta">Total Recognized</span></article>';
  }
  
  // Update stage counts
  var contractCountEl = document.getElementById("contract-count");
  var invoiceCountEl = document.getElementById("invoice-count");
  var paymentCountEl = document.getElementById("payment-count");
  var recognitionCountEl = document.getElementById("recognition-count");
  
  if (contractCountEl) contractCountEl.textContent = String((state.contracts || []).length);
  if (invoiceCountEl) invoiceCountEl.textContent = String((state.invoices || []).length);
  if (paymentCountEl) paymentCountEl.textContent = String((state.payments || []).length);
  if (recognitionCountEl) {
    var recCount = (state.payments || []).filter(function(p) { return p.status === "completed"; }).length;
    recognitionCountEl.textContent = String(recCount);
  }
}

function renderProcurement() {
  var vendorListEl = document.getElementById("vendor-list");
  var poListEl = document.getElementById("po-list");
  var receiptListEl = document.getElementById("receipt-list");
  
  if (vendorListEl) {
    var vendors = state.vendors || [];
    vendorListEl.innerHTML = vendors.map(function(v) {
      return '<article class="card"><h4>' + escapeHtml(v.name) + '</h4><p class="meta">' + (v.email || "") + '</p></article>';
    }).join("") || '<p class="empty">No vendors</p>';
  }
  
  if (poListEl) {
    var pos = state.purchaseOrders || [];
    poListEl.innerHTML = pos.map(function(po) {
      return '<article class="card"><h4>' + po.poNumber + '</h4><span class="badge">' + formatCurrency(po.amount) + '</span><span class="badge ' + po.status + '">' + po.status + '</span></article>';
    }).join("") || '<p class="empty">No purchase orders</p>';
  }
  
  if (receiptListEl) {
    var receipts = state.receipts || [];
    receiptListEl.innerHTML = receipts.length ? receipts.map(function(r) {
      return '<article class="card"><span>' + formatCurrency(r.amount) + '</span><span class="badge">' + r.status + '</span></article>';
    }).join("") : '<p class="empty">No receipts</p>';
  }
}

function renderContacts() {
  elements.contactsList.innerHTML = state.contacts
    .map((contact) => `
      <article class="card">
        <div class="card-top">
          <div>
            <h4>${escapeHtml(contact.name)}</h4>
            <p class="meta">${escapeHtml(contact.company)}</p>
          </div>
          <span class="badge ${contact.status.toLowerCase()}">${escapeHtml(contact.status)}</span>
        </div>
        <p class="meta">${escapeHtml(contact.email)}</p>
      </article>
    `)
    .join("");
}

function renderDeals() {
  const stages = ["Discovery", "Proposal", "Negotiation", "Won"];

  elements.dealsBoard.innerHTML = stages
    .map((stage) => {
      const deals = state.deals.filter((deal) => deal.stage === stage);
      const dealCards = deals.length
        ? deals.map((deal) => `
          <article class="card">
            <h4>${escapeHtml(deal.title)}</h4>
            <div class="deal-meta">
              <span class="meta">${escapeHtml(deal.owner)}</span>
              <span class="badge ${stage.toLowerCase()}">${formatCurrency(deal.value)}</span>
            </div>
            <div class="task-meta">
              <span class="meta">Net 30 invoice template</span>
              <button class="task-toggle" type="button" data-deal-id="${deal.id}">
                QB Payload
              </button>
            </div>
          </article>
        `).join("")
        : '<p class="meta">No deals</p>';

      return `
        <section class="deal-column">
          <h4>${stage}</h4>
          <div class="stack">${dealCards}</div>
        </section>
      `;
    })
    .join("");

  document.querySelectorAll("[data-deal-id]").forEach((button) => {
    button.addEventListener("click", () => {
      generateQuickBooksPayload(button.dataset.dealId);
    });
  });
}

function renderTasks() {
  elements.tasksList.innerHTML = state.tasks
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .map((task) => {
      const dueIn = daysUntil(task.dueDate);
      const dueLabel = dueIn < 0 ? `${Math.abs(dueIn)} day(s) overdue` : `Due in ${dueIn} day(s)`;
      const completeClass = task.completed ? "task-complete" : "";

      return `
        <article class="card ${completeClass}">
          <div class="card-top">
            <div>
              <h4>${escapeHtml(task.title)}</h4>
              <p class="meta">${escapeHtml(task.owner)} • ${escapeHtml(task.dueDate)}</p>
            </div>
            <span class="badge ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
          </div>
          <div class="task-meta">
            <span class="meta">${dueLabel}</span>
            <button class="task-toggle" type="button" data-task-id="${task.id}">
              ${task.completed ? "Reopen" : "Complete"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-task-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.taskId);
      if (!task) {
        return;
      }

      task.completed = !task.completed;
      pushActivity(`${task.completed ? "Completed" : "Reopened"} task ${task.title}`);
      persistState();
      render();
    });
  });
}

function renderActivity() {
  elements.activityList.innerHTML = state.activity
    .map((entry) => `
      <article class="card activity-item">
        <span>${escapeHtml(entry.text)}</span>
        <span>${escapeHtml(entry.time)}</span>
      </article>
    `)
    .join("");
}

async function syncOpenCollective() {
  var activeEntity = getActiveEntity();
  runtimeState.collectiveSyncPending = true;
  pushActivity("Syncing Bifrost Bridge...");
  renderFinanceCard();
  renderActivity();

  try {
    var response = await fetch(BIFROST_SYNC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      throw new Error("Bifrost sync failed");
    }
    
    var data = await response.json();
    
    var sumEntities = 0;
    for (var i = 0; i < newEntities.length; i++) {
      sumEntities += newEntities[i].balance;
    }
    var apiTotal = data.totalLiquid || 0;
    
    if (Math.abs(sumEntities - apiTotal) > 0.01) {
      pushActivity("RECONCILIATION WARNING: Local $" + sumEntities.toFixed(2) + " != API $" + apiTotal.toFixed(2), "RECONCILIATION_MISMATCH");
      state.funds.syncBridge.lastReconciliation = "DEGRADED|" + timestampLabel();
      runtimeState.reconciliationState = "DEGRADED";
      console.error("[RECONCILIATION_MISMATCH] Expected:", apiTotal, "Actual:", sumEntities);
    }
    
    var newEntities = [];
    var nonProfitBalance = 0;
    var bCorpBalance = 0;
    var trustVault = 0;
    
    if (data.entities && data.entities.length > 0) {
      for (var i = 0; i < data.entities.length; i++) {
        var e = data.entities[i];
        var balanceCents = toCents(e.balance || 0);
        var vaultCents = toCents(e.vault || 0);
        
        if (e.type === "nonprofit") {
          nonProfitBalance = balanceCents;
        } else if (e.type === "bcorp") {
          bCorpBalance = balanceCents;
        }
        trustVault += vaultCents;
        
        newEntities.push({
          id: e.id,
          name: e.name,
          type: e.type,
          slug: "snapkitty",
          balance: e.balance || 0,
          vault: e.vault || 0,
          currency: e.currency || "USD",
          lastSync: timestampLabel()
        });
      }
    }
    
    var newSCS = data.sovereignCreditScore || 650;
    
    state.funds.segmentLedgers = newEntities;
    state.funds.sovereignCreditScore = newSCS;
    state.funds.finance = {
      nonProfitBalanceCents: nonProfitBalance,
      bCorpBalanceCents: bCorpBalance,
      trustVaultCents: trustVault,
      lastBridgeSync: timestampLabel()
    };
    
    state.funds.canonicalLedger.lastReconciled = timestampLabel();
    state.funds.canonicalLedger.reconciledBy = "BIFROST_BRIDGE";
    state.funds.syncBridge.lastReconciliation = timestampLabel();
    
    var totalLiquid = data.totalLiquid || 0;
    var totalVault = data.totalVault || 0;
    pushActivity("Bifrost Bridge: Multi-Entity Ledgers Verified.");
    pushActivity("Bifrost Sync: Liquid $" + totalLiquid + " | Vault $" + totalVault + " | SCS " + newSCS);
    persistState();
    render();
  } catch (error) {
    pushActivity("Bifrost Sync Error: " + (error.message || "Connection failed"));
    persistState();
    render();
  } finally {
    runtimeState.collectiveSyncPending = false;
    renderFinanceCard();
  }
}

function getActiveEntity() {
  return state.funds?.segmentLedgers?.find((e) => e.id === state.funds.activeEntityId);
}

function getOpenDeals() {
  var result = [];
  for (var i = 0; i < state.deals.length; i++) {
    if (state.deals[i].stage !== "Won") {
      result.push(state.deals[i]);
    }
  }
  return result;
}

function getWonDealsValue() {
  var total = 0;
  for (var i = 0; i < state.deals.length; i++) {
    if (state.deals[i].stage === "Won") {
      total += state.deals[i].value;
    }
  }
  return total;
}

function getOpenPipelineValueDollars() {
  var openDeals = getOpenDeals();
  var total = 0;
  for (var i = 0; i < openDeals.length; i++) {
    total += openDeals[i].value;
  }
  return total;
}

async function fetchCollectiveBalance(slug) {
  try {
    return await fetchCollectiveBalanceFromBackend();
  } catch {
    return fetchCollectiveBalanceDirect(slug);
  }
}

async function fetchCollectiveBalanceFromBackend() {
  const response = await fetch(OPEN_COLLECTIVE_SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Backend Open Collective sync failed.");
  }

  return {
    balance: Number(payload.balanceCents || 0) / 100,
    currency: String(payload.currency || "USD")
  };
}

async function fetchCollectiveBalanceDirect(slug) {
  const collectiveSlug = slug || "snapkitty";
  const query = `
    query getCollective($slug: String!) {
      account(slug: $slug) {
        name
        stats {
          balance {
            valueInCents
            currency
          }
        }
      }
    }
  `;
  const response = await fetch("https://api.opencollective.com/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: { slug: collectiveSlug }
    })
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || Array.isArray(result.errors) && result.errors.length > 0) {
    throw new Error(result.errors?.[0]?.message || "Connection to Open Collective failed.");
  }

  const balanceCents = Number(result.data?.account?.stats?.balance?.valueInCents || 0);
  const currency = String(result.data?.account?.stats?.balance?.currency || "USD");

  return {
    balance: balanceCents / 100,
    currency
  };
}

function generateQuickBooksPayload(dealId) {
  var deal = null;
  for (var i = 0; i < state.deals.length; i++) {
    if (state.deals[i].id === dealId) {
      deal = state.deals[i];
      break;
    }
  }
  if (!deal) return;

  var invoicePayload = {
    "Line": [
      {
        "DetailType": "SalesItemLineDetail",
        "Amount": deal.value,
        "SalesItemLineDetail": {
          "ItemRef": { "name": "Consulting Services", "value": "1" },
          "Qty": 1,
          "UnitPrice": deal.value
        }
      }
    ],
    "CustomerRef": { "name": deal.title.split(" ")[0] },
    "DueDate": offsetDate(30)
  };

  console.log("QuickBooks Payload Generated:", invoicePayload);
  pushActivity("Generated QB Invoice Payload for " + deal.title);
  alert("Invoice structure for \"" + deal.title + "\" generated. Check console for payload.");
  render();
}

function getCollectiveBalance() {
  return getActiveEntity() ? getActiveEntity().balance : 0;
}

function createCollectiveStatsState() {
  return {
    balance: 0,
    currency: "USD",
    lastSync: "Never"
  };
}

function switchActiveEntity(entityId) {
  state.funds.activeEntityId = entityId;
  persistState();
  render();
}

function toCents(dollars) {
  return Math.round(dollars * 100);
}

function toDollars(cents) {
  return Number(cents) / 100;
}

function formatCurrency(value, currency = "USD", fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

async function fetchOracle(endpoint) {
  try {
    var response = await fetch(endpoint, { method: "GET" });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("[ORACLE] Error fetching", endpoint, error.message);
    return null;
  }
}

async function refreshOracles() {
  var now = Date.now();
  if (runtimeState.oracleRefreshPending || (now - runtimeState.lastOracleRefresh) < 10000) {
    console.log("[ORACLE] Debounced - skip refresh");
    return;
  }
  
  runtimeState.oracleRefreshPending = true;
  runtimeState.lastOracleRefresh = now;
  
  var proofData = await fetchOracle(PROOF_OF_RESERVE_ORACLE);
  var riskData = await fetchOracle(RISK_PULSE_ORACLE);
  var collateralData = await fetchOracle(COLLATERAL_POWER_ORACLE);
  var heartbeatData = await fetchOracle(HEARTBEAT_ORACLE);
  
  console.log("[ORACLE] Proof of Reserve:", proofData ? proofData.status : "error");
  console.log("[ORACLE] Risk Pulse:", riskData ? riskData.sentiment : "error");
  console.log("[ORACLE] Collateral Power:", collateralData ? collateralData.powerTier : "error");
  console.log("[ORACLE] Heartbeat:", heartbeatData ? heartbeatData.status : "error");
  
  if (elements.heartbeatDot && heartbeatData) {
    var statusClass = heartbeatData.statusClass || "offline";
    elements.heartbeatDot.className = "heartbeat-dot " + statusClass;
    
    var labelText = "System Online";
    if (heartbeatData.status === "ALIVE") {
      labelText = "All Systems Operational";
    } else if (heartbeatData.status === "DEGRADED") {
      labelText = "Partial Service";
    } else {
      labelText = "Service Disrupted";
    }
    if (elements.heartbeatLabel) {
      elements.heartbeatLabel.textContent = labelText;
    }
    
    if (elements.heartbeatDot.parentElement) {
      elements.heartbeatDot.parentElement.title = labelText + " | " + new Date().toLocaleTimeString();
    }
  }
  
  runtimeState.oracleRefreshPending = false;
  
  return {
    proof: proofData,
    risk: riskData,
    collateral: collateralData,
    heartbeat: heartbeatData
  };
}

function formatSyncLabel(dateValue) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateValue));
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function timestampLabel() {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

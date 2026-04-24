const STORAGE_KEY = "devflow-crm-state";
const API_BASE_URL = "http://localhost:5000";
const BIFROST_SYNC_ENDPOINT = `${API_BASE_URL}/api/finance/bifrost/sync`;
const PROOF_OF_RESERVE_ORACLE = `${API_BASE_URL}/api/oracle/proof-of-reserve`;
const RISK_PULSE_ORACLE = `${API_BASE_URL}/api/oracle/risk-pulse`;
const COLLATERAL_POWER_ORACLE = `${API_BASE_URL}/api/oracle/collateral-power`;
const HEARTBEAT_ORACLE = `${API_BASE_URL}/api/oracle/heartbeat`;
const TRADELINE_ORACLE = `${API_BASE_URL}/api/oracle/report-tradeline`;
const OPEN_COLLECTIVE_SLUG = "snapkitty";

const runtimeState = {
  collectiveSyncPending: false
};

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
    entities: [
      {
        id: "digital-inclusion-fund",
        name: "Digital Inclusion Fund",
        type: "nonprofit",
        slug: "snapkitty",
        balance: 0,
        vault: 0,
        currency: "USD",
        lastSync: "Never"
      },
      {
        id: "operating-revenue",
        name: "Operating Revenue",
        type: "bcorp",
        slug: "snapkitty",
        balance: 0,
        vault: 0,
        currency: "USD",
        lastSync: "Never"
      }
    ],
    activeEntityId: "digital-inclusion-fund",
    sovereignCreditScore: 650,
    finance: {
      nonProfitBalanceCents: 0,
      bCorpBalanceCents: 0,
      trustVaultCents: 0,
      lastBridgeSync: "Never"
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
elements.seedButton.addEventListener("click", () => {
  state = createSeedState();
  persistState();
  render();
});

elements.issueCardBtn && elements.issueCardBtn.addEventListener("click", function() {
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

function pushActivity(text) {
  state.activity.unshift({
    id: crypto.randomUUID(),
    text,
    time: timestampLabel()
  });
  state.activity = state.activity.slice(0, 8);
}

function render() {
  renderStats();
  renderFinanceCard();
  renderContacts();
  renderDeals();
  renderTasks();
  renderActivity();
  runSovereignAnalytics();
  refreshOracles();
}

function runSovereignAnalytics() {
  var pipelineValue = getOpenPipelineValueDollars();
  var wonDealsValue = getWonDealsValue();
  
  var totalLiquid = 0;
  var totalVault = 0;
  var nonProfitBalance = 0;
  var bCorpBalance = 0;
  
  if (state.funds && state.funds.entities) {
    for (var i = 0; i < state.funds.entities.length; i++) {
      var entity = state.funds.entities[i];
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
  if (state.funds && state.funds.entities) {
    for (var j = 0; j < state.funds.entities.length; j++) {
      totalLiquid += state.funds.entities[j].balance;
      totalVault += state.funds.entities[j].vault || 0;
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
  if (state.funds && state.funds.entities) {
    for (var i = 0; i < state.funds.entities.length; i++) {
      totalLiquid += state.funds.entities[i].balance;
      totalVault += state.funds.entities[i].vault || 0;
    }
  }
  
  var ratio = pipelineValue > 0 ? totalLiquid / pipelineValue : (pipelineValue === 0 && totalLiquid > 0 ? 1 : (totalLiquid > 0 ? 1 : 0));
  var sovereigntyStatus = ratio > 1.0 ? "SOVEREIGN" : (ratio >= 0.5 ? "STABLE" : "EXPANDING");
  
  var scs = state.funds && state.funds.sovereignCreditScore ? state.funds.sovereignCreditScore : 650;
  var scsLabel = " Expansionary ";
  var scsClass = "medium";
  if (scs >= 700) {
    scsLabel = " Minimal Risk ";
    scsClass = "low";
  } else if (scs < 600) {
    scsLabel = " Expansionary ";
    scsClass = "high";
  }

  elements.sovereigntyRatio.textContent = ratio.toFixed(2) + " (" + sovereigntyStatus + ")";
  elements.fundBalance.textContent = formatCurrency(entityBalance, activeEntity ? activeEntity.currency : "USD", 2);
  elements.difBalance.textContent = formatCurrency(totalLiquid, "USD", 2);
  elements.opBalance.textContent = formatCurrency(totalVault, "USD", 2);
  elements.vaultBalance.textContent = formatCurrency(totalVault, "USD", 2);
  elements.scsGauge.textContent = String(scs);
  elements.scsBadge.textContent = scsLabel;
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
    
    var newEntities = [];
    var nonProfitBalance = 0;
    var bCorpBalance = 0;
    var trustVault = 0;
    
    if (data.entities && data.entities.length > 0) {
      for (var i = 0; i < data.entities.length; i++) {
        var e = data.entities[i];
        var balanceCents = Math.round((e.balance || 0) * 100);
        var vaultCents = Math.round((e.vault || 0) * 100);
        
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
    
    state.funds.entities = newEntities;
    state.funds.sovereignCreditScore = newSCS;
    state.funds.finance = {
      nonProfitBalanceCents: nonProfitBalance,
      bCorpBalanceCents: bCorpBalance,
      trustVaultCents: trustVault,
      lastBridgeSync: timestampLabel()
    };
    
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
  return state.funds?.entities?.find((e) => e.id === state.funds.activeEntityId);
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

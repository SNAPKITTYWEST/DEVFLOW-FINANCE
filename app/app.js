const STORAGE_KEY = "devflow-crm-state";
const API_BASE_URL = "http://localhost:5000";
const OPEN_COLLECTIVE_SYNC_ENDPOINT = `${API_BASE_URL}/api/finance/collective/sync`;
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
  collectiveStats: createCollectiveStatsState()
});

let state = loadState();

const elements = {
  contactsCount: document.querySelector("#contacts-count"),
  openDealsCount: document.querySelector("#open-deals-count"),
  pipelineValue: document.querySelector("#pipeline-value"),
  dueTasksCount: document.querySelector("#due-tasks-count"),
  sovereigntyRatio: document.querySelector("#sovereignty-ratio"),
  collectiveBalance: document.querySelector("#collective-balance"),
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
  syncButton: document.querySelector("#sync-button")
};

elements.contactForm.addEventListener("submit", handleContactSubmit);
elements.dealForm.addEventListener("submit", handleDealSubmit);
elements.taskForm.addEventListener("submit", handleTaskSubmit);
elements.syncButton.addEventListener("click", syncOpenCollective);
elements.seedButton.addEventListener("click", () => {
  state = createSeedState();
  persistState();
  render();
});

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
  const legacyBalance = Number(savedState?.finance?.collectiveBalanceCents || 0) / 100;
  const legacyLastSync = savedState?.finance?.lastSyncedAt
    ? formatSyncLabel(savedState.finance.lastSyncedAt)
    : "Never";

  return {
    contacts: Array.isArray(savedState?.contacts) ? savedState.contacts : [],
    deals: Array.isArray(savedState?.deals) ? savedState.deals : [],
    tasks: Array.isArray(savedState?.tasks) ? savedState.tasks : [],
    activity: Array.isArray(savedState?.activity) ? savedState.activity : [],
    collectiveStats: {
      ...createCollectiveStatsState(),
      ...(savedState?.collectiveStats && typeof savedState.collectiveStats === "object"
        ? savedState.collectiveStats
        : {}),
      balance: Number(savedState?.collectiveStats?.balance ?? legacyBalance ?? 0),
      currency: String(savedState?.collectiveStats?.currency || savedState?.finance?.collectiveCurrency || "USD"),
      lastSync: String(savedState?.collectiveStats?.lastSync || legacyLastSync)
    }
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
}

function renderStats() {
  const openDeals = getOpenDeals();
  const pipelineValue = getOpenPipelineValueDollars();
  const dueTasks = state.tasks.filter((task) => !task.completed && daysUntil(task.dueDate) <= 7);

  elements.contactsCount.textContent = String(state.contacts.length);
  elements.openDealsCount.textContent = String(openDeals.length);
  elements.pipelineValue.textContent = formatCurrency(pipelineValue);
  elements.dueTasksCount.textContent = String(dueTasks.length);

  if (dueTasks.length > 3) {
    elements.sidebarHealth.textContent = "Attention Needed";
    elements.sidebarHealthDetail.textContent = `${dueTasks.length} tasks due within 7 days`;
  } else if (openDeals.length >= 3) {
    elements.sidebarHealth.textContent = "Stable";
    elements.sidebarHealthDetail.textContent = `${openDeals.length} active deals in motion`;
  } else {
    elements.sidebarHealth.textContent = "Light Load";
    elements.sidebarHealthDetail.textContent = "Pipeline has room for more outreach";
  }
}

function renderFinanceCard() {
  const pipelineValue = getOpenPipelineValueDollars();
  const collectiveBalance = getCollectiveBalance();
  const ratio = pipelineValue > 0 ? collectiveBalance / pipelineValue : 1;

  elements.sovereigntyRatio.textContent = ratio.toFixed(2);
  elements.collectiveBalance.textContent = formatCurrency(
    collectiveBalance,
    state.collectiveStats.currency,
    2
  );
  elements.syncButton.disabled = runtimeState.collectiveSyncPending;
  elements.syncButton.textContent = runtimeState.collectiveSyncPending
    ? "Syncing Open Collective..."
    : "🔄 Sync Open Collective";

  if (state.collectiveStats.lastSync && state.collectiveStats.lastSync !== "Never") {
    elements.syncButton.title = `Last synced ${state.collectiveStats.lastSync}`;
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
  runtimeState.collectiveSyncPending = true;
  pushActivity("📡 Initiating Open Collective financial sync...");
  renderFinanceCard();
  renderActivity();

  try {
    const collectiveSnapshot = await fetchCollectiveBalance();

    state = {
      ...state,
      collectiveStats: {
        balance: collectiveSnapshot.balance,
        currency: collectiveSnapshot.currency,
        lastSync: timestampLabel()
      }
    };
    pushActivity(
      `✅ Sync Success: Liquid balance is ${formatCurrency(state.collectiveStats.balance, state.collectiveStats.currency, 2)}`
    );
    persistState();
    render();
  } catch (error) {
    pushActivity(`❌ Sync Error: ${error.message || "Connection to Open Collective failed"}`);
    persistState();
    render();
  } finally {
    runtimeState.collectiveSyncPending = false;
    renderFinanceCard();
  }
}

async function fetchCollectiveBalance() {
  try {
    return await fetchCollectiveBalanceFromBackend();
  } catch {
    return fetchCollectiveBalanceDirect();
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

async function fetchCollectiveBalanceDirect() {
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
      variables: { slug: OPEN_COLLECTIVE_SLUG }
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
  const deal = state.deals.find(d => d.id === dealId);
  if (!deal) return;

  const invoicePayload = {
    Line: [{
        DetailType: "SalesItemLineDetail",
        Amount: deal.value,
        SalesItemLineDetail: {
          ItemRef: { name: "Consulting Services", value: "1" },
          Qty: 1,
          UnitPrice: deal.value
        }
      }
    }],
    CustomerRef: { name: deal.title.split(" ")[0] }, // Fallback to title prefix
    DueDate: offsetDate(30) // Default Net 30
  };

  console.log("QuickBooks Payload Generated:", invoicePayload);
  pushActivity(`🧾 Generated QB Invoice Payload for ${deal.title}`);
  alert(`Invoice structure for "${deal.title}" generated. Check console for payload.`);
  render();
}

function getOpenDeals() {
  return state.deals.filter((deal) => deal.stage !== "Won");
}

function getOpenPipelineValueDollars() {
  return getOpenDeals().reduce((total, deal) => total + deal.value, 0);
}

function getCollectiveBalance() {
  return Number.isFinite(state.collectiveStats.balance)
    ? state.collectiveStats.balance
    : 0;
}

function createCollectiveStatsState() {
  return {
    balance: 0,
    currency: "USD",
    lastSync: "Never"
  };
}

function formatCurrency(value, currency = "USD", fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
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

const STORAGE_KEY = "devflow-crm-state";
const API_BASE_URL = "http://localhost:5000";
const OPEN_COLLECTIVE_SYNC_ENDPOINT = `${API_BASE_URL}/api/finance/collective/sync`;

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
    { id: crypto.randomUUID(), text: "Northwind Retainer moved to Proposal", time: timestampLabel() },
    { id: crypto.randomUUID(), text: "Lina Torres marked as Customer", time: timestampLabel() },
    { id: crypto.randomUUID(), text: "Proposal revision task assigned to Jessi", time: timestampLabel() }
  ],
  finance: createFinanceState()
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
elements.syncButton.addEventListener("click", handleCollectiveSync);
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
  return {
    contacts: Array.isArray(savedState?.contacts) ? savedState.contacts : [],
    deals: Array.isArray(savedState?.deals) ? savedState.deals : [],
    tasks: Array.isArray(savedState?.tasks) ? savedState.tasks : [],
    activity: Array.isArray(savedState?.activity) ? savedState.activity : [],
    finance: {
      ...createFinanceState(),
      ...(savedState?.finance && typeof savedState.finance === "object" ? savedState.finance : {})
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
  const pipelineValueCents = getOpenPipelineValueCents();
  const collectiveBalanceCents = getCollectiveBalanceCents();
  const ratio = pipelineValueCents > 0 ? collectiveBalanceCents / pipelineValueCents : 0;

  elements.sovereigntyRatio.textContent = ratio.toFixed(2);
  elements.collectiveBalance.textContent = formatCurrency(
    collectiveBalanceCents / 100,
    state.finance.collectiveCurrency,
    2
  );
  elements.syncButton.disabled = runtimeState.collectiveSyncPending;
  elements.syncButton.textContent = runtimeState.collectiveSyncPending
    ? "Syncing Open Collective..."
    : "🔄 Sync Open Collective";

  if (state.finance.lastSyncedAt) {
    elements.syncButton.title = `Last synced ${formatSyncLabel(state.finance.lastSyncedAt)}`;
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

  document.querySelectorAll(".task-toggle").forEach((button) => {
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

async function handleCollectiveSync() {
  runtimeState.collectiveSyncPending = true;
  renderFinanceCard();

  try {
    const response = await fetch(OPEN_COLLECTIVE_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Open Collective sync failed.");
    }

    state = {
      ...state,
      finance: {
        ...state.finance,
        collectiveBalanceCents: Number(payload.balanceCents) || 0,
        collectiveCurrency: String(payload.currency || "USD"),
        lastSyncedAt: String(payload.syncedAt || new Date().toISOString())
      }
    };
    pushActivity(
      `Synced Open Collective balance at ${formatCurrency(
        state.finance.collectiveBalanceCents / 100,
        state.finance.collectiveCurrency,
        2
      )}`
    );
    persistState();
    render();
  } catch (error) {
    pushActivity(`Open Collective sync warning: ${error.message}`);
    persistState();
    render();
  } finally {
    runtimeState.collectiveSyncPending = false;
    renderFinanceCard();
  }
}

function getOpenDeals() {
  return state.deals.filter((deal) => deal.stage !== "Won");
}

function getOpenPipelineValueDollars() {
  return getOpenDeals().reduce((total, deal) => total + deal.value, 0);
}

function getOpenPipelineValueCents() {
  return getOpenDeals().reduce((total, deal) => total + normalizeCurrencyToCents(deal.value), 0);
}

function getCollectiveBalanceCents() {
  return Number.isFinite(state.finance.collectiveBalanceCents)
    ? state.finance.collectiveBalanceCents
    : 0;
}

function createFinanceState() {
  return {
    collectiveBalanceCents: 0,
    collectiveCurrency: "USD",
    lastSyncedAt: ""
  };
}

function normalizeCurrencyToCents(value) {
  return Math.round(Number(value || 0) * 100);
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

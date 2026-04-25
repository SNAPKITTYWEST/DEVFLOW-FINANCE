/**
 * Bifrost Bridge - Modular Connector Framework
 * =====================================
 * Enterprise integration layer (MuleSoft-style connectors)
 * Supports: QuickBooks, Open Collective, Plaid, custom adapters
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ========================================
   BASE CONNECTOR INTERFACE
   ======================================== */

class BaseConnector {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.connected = false;
  }

  async connect() {
    throw new Error(`${this.name}: connect() not implemented`);
  }

  async disconnect() {
    this.connected = false;
  }

  async testConnection() {
    throw new Error(`${this.name}: testConnection() not implemented`);
  }

  async fetchTransactions(filters = {}) {
    throw new Error(`${this.name}: fetchTransactions() not implemented`);
  }

  async fetchAccounts() {
    throw new Error(`${this.name}: fetchAccounts() not implemented`);
  }

  async syncToLedger(entities) {
    throw new Error(`${this.name}: syncToLedger() not implemented`);
  }
}

/* ========================================
   QUICKBOOKS TRAILBLAZER CONNECTOR
   ======================================== */

class QuickBooksConnector extends BaseConnector {
  constructor(config) {
    super("QuickBooks", config);
    this.baseUrl = "https://quickbooks.api.intuit.com/v3/company";
    this.realmId = config.realmId;
    this.accessToken = config.accessToken;
  }

  async connect() {
    if (!this.accessToken) {
      throw new Error("QuickBooks: accessToken required");
    }
    this.connected = true;
    return this;
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/${this.realmId}/companyinfo/${this.realmId}`, {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Accept": "application/json"
        }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async fetchAccounts() {
    const query = encodeURIComponent("SELECT * FROM Account WHERE Active = true");
    const url = `${this.baseUrl}/${this.realmId}/query?query=${query}`;
    
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return { accounts: [] };
    }

    const data = await response.json();
    return {
      accounts: (data.QueryResponse?.Account || []).map(acc => ({
        id: acc.Id,
        name: acc.Name,
        type: acc.AccountType,
        balance: Number(acc.CurrentBalance || 0),
        currency: acc.CurrencyRef?.value || "USD"
      }))
    };
  }

  async fetchTransactions(startDate, endDate) {
    const query = encodeURIComponent(
      `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`
    );
    const url = `${this.baseUrl}/${this.realmId}/query?query=${query}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return { transactions: [] };
    }

    const data = await response.json();
    return {
      transactions: (data.QueryResponse?.Purchase || []).map(tx => ({
        id: tx.Id,
        date: tx.TxnDate,
        amount: Number(tx.TotalAmt),
        vendor: tx.VendorRef?.name,
        account: tx.AccountRef?.name,
        type: "expense"
      }))
    };
  }

  async fetchInvoices() {
    const query = encodeURIComponent("SELECT * FROM Invoice WHERE TxnDate >= '2024-01-01'");
    const url = `${this.baseUrl}/${this.realmId}/query?query=${query}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return { invoices: [] };
    }

    const data = await response.json();
    return {
      invoices: (data.QueryResponse?.Invoice || []).map(inv => ({
        id: inv.Id,
        number: inv.DocNumber,
        customer: inv.CustomerRef?.name,
        amount: Number(inv.TotalAmt),
        balance: Number(inv.Balance),
        dueDate: inv.DueDate,
        status: inv.Balance > 0 ? "unpaid" : "paid"
      }))
    };
  }

  async fetchBills() {
    const query = encodeURIComponent("SELECT * FROM Bill WHERE TxnDate >= '2024-01-01'");
    const url = `${this.baseUrl}/${this.realmId}/query?query=${query}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return { bills: [] };
    }

    const data = await response.json();
    return {
      bills: (data.QueryResponse?.Bill || []).map(bill => ({
        id: bill.Id,
        vendor: bill.VendorRef?.name,
        amount: Number(bill.TotalAmt),
        dueDate: bill.DueDate,
        status: "pending"
      }))
    };
  }
}

/* ========================================
   OPEN COLLECTIVE CONNECTOR
   ======================================== */

class OpenCollectiveConnector extends BaseConnector {
  constructor(config) {
    super("OpenCollective", config);
    this.slug = config.slug || "snapkitty";
    this.apiToken = config.apiToken;
    this.graphqlUrl = "https://api.opencollective.com/graphql/v2";
  }

  async connect() {
    this.connected = true;
    return this;
  }

  async testConnection() {
    try {
      const response = await fetch(this.graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query($slug: String!) { 
            account(slug: $slug) { 
              name 
              transactions(limit: 1) { nodes { id } } 
            } 
          }`,
          variables: { slug: this.slug }
        })
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async fetchAccounts() {
    const query = `
      query($slug: String!) {
        account(slug: $slug) {
          name
          type
          stats {
            balance { valueInCents currency }
          }
        }
      }
    `;

    try {
      const response = await fetch(this.graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { slug: this.slug } })
      });

      const data = await response.json();
      const account = data.data?.account;

      if (!account) {
        return { accounts: [] };
      }

      return {
        accounts: [{
          id: this.slug,
          name: account.name,
          type: account.type,
          balance: account.stats?.balance?.valueInCents / 100 || 0,
          currency: account.stats?.balance?.currency || "USD"
        }]
      };
    } catch (e) {
      return { accounts: [] };
    }
  }

  async fetchTransactions(limit = 100) {
    const query = `
      query($slug: String!, $limit: Int!) {
        account(slug: $slug) {
          transactions(limit: $limit) {
            nodes {
              id
              amount {
                valueInCents
                currency
              }
              type
              description
              createdAt
              fromAccount {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch(this.graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query, 
          variables: { slug: this.slug, limit } 
        })
      });

      const data = await response.json();
      const txNodes = data.data?.account?.transactions?.nodes || [];

      return {
        transactions: txNodes.map(tx => ({
          id: tx.id,
          amount: tx.amount?.valueInCents / 100 || 0,
          currency: tx.amount?.currency || "USD",
          type: tx.type,
          description: tx.description,
          date: tx.createdAt,
          counterparty: tx.fromAccount?.name
        }))
      };
    } catch (e) {
      return { transactions: [] };
    }
  }
}

/* ========================================
   PLAID CONNECTOR
   ======================================== */

class PlaidConnector extends BaseConnector {
  constructor(config) {
    super("Plaid", config);
    this.plaidClient = config.plaidClient;
  }

  async connect() {
    if (!this.plaidClient) {
      throw new Error("Plaid: plaidClient not configured");
    }
    this.connected = true;
    return this;
  }

  async fetchAccounts() {
    const connections = await prisma.bankConnection.findMany({
      where: { status: "active" }
    });

    let allAccounts = [];
    for (const conn of connections) {
      try {
        const accounts = await this.plaidClient.getAccountBalance(conn.accessToken);
        allAccounts = allAccounts.concat(accounts);
      } catch (e) {
        console.error(`Plaid: Balance fetch error for ${conn.id}`);
      }
    }

    return {
      accounts: allAccounts.map(acc => ({
        id: acc.account_id,
        name: acc.name,
        type: acc.type,
        balance: acc.balances.current || 0,
        currency: acc.balances.iso_currency_code || "USD"
      }))
    };
  }
}

/* ========================================
   BIFROST BRIDGE ORCHESTRATOR
   ======================================== */

class BifrostBridge {
  constructor() {
    this.connectors = new Map();
    this.syncHistory = [];
  }

  registerConnector(name, connector) {
    this.connectors.set(name, connector);
    console.log(`[BIFROST] Registered connector: ${name}`);
  }

  getConnector(name) {
    return this.connectors.get(name);
  }

  async connectAll() {
    const results = {};
    for (const [name, connector] of this.connectors) {
      try {
        await connector.connect();
        results[name] = { status: "connected" };
      } catch (e) {
        results[name] = { status: "error", message: e.message };
      }
    }
    return results;
  }

  async syncToLedger(options = {}) {
    const {
      source = "quickbooks",
      syncInvoices = true,
      syncBills = true,
      syncTransactions = true
    } = options;

    const connector = this.connectors.get(source);
    if (!connector) {
      throw new Error(`Bifrost: Connector ${source} not found`);
    }

    const syncResult = {
      source,
      timestamp: new Date().toISOString(),
      entities: [],
      invoices: [],
      bills: [],
      transactions: []
    };

    // Fetch entities/accounts
    const accountsResult = await connector.fetchAccounts();
    syncResult.entities = accountsResult.accounts || [];
    console.log(`[BIFROST] Synced ${syncResult.entities.length} entities from ${source}`);

    // Fetch invoices
    if (syncInvoices && connector.fetchInvoices) {
      const invoicesResult = await connector.fetchInvoices();
      syncResult.invoices = invoicesResult.invoices || [];
      console.log(`[BIFROST] Synced ${syncResult.invoices.length} invoices`);
    }

    // Fetch bills
    if (syncBills && connector.fetchBills) {
      const billsResult = await connector.fetchBills();
      syncResult.bills = billsResult.bills || [];
      console.log(`[BIFROST] Synced ${syncResult.bills.length} bills`);
    }

    // Store sync history
    this.syncHistory.push({
      ...syncResult,
      id: crypto.randomUUID()
    });

    return syncResult;
  }

  getSyncHistory(limit = 10) {
    return this.syncHistory.slice(-limit);
  }
}

/* ========================================
   BRIDGE FACTORY
   ======================================== */

function createBifrostBridge(customConnectors = {}) {
  const bridge = new BifrostBridge();

  // Register default connectors based on config
  if (process.env.QB_CLIENT_ID) {
    const qbConnector = new QuickBooksConnector({
      realmId: process.env.QB_REALM_ID,
      accessToken: process.env.QB_ACCESS_TOKEN
    });
    bridge.registerConnector("quickbooks", qbConnector);
  }

  if (process.env.OPEN_COLLECTIVE_TOKEN || process.env.OC_SLUG) {
    const ocConnector = new OpenCollectiveConnector({
      slug: process.env.OC_SLUG || "snapkitty",
      apiToken: process.env.OPEN_COLLECTIVE_TOKEN
    });
    bridge.registerConnector("opencollective", ocConnector);
  }

  // Register custom connectors
  for (const [name, connector] of Object.entries(customConnectors)) {
    bridge.registerConnector(name, connector);
  }

  return bridge;
}

/* ========================================
   EXPORTS
   ======================================== */

module.exports = {
  BaseConnector,
  QuickBooksConnector,
  OpenCollectiveConnector,
  PlaidConnector,
  BifrostBridge,
  createBifrostBridge
};

// Initialize bridge on require
if (require.main === module) {
  const bridge = createBifrostBridge();
  console.log("[BIFROST] Bridge initialized");
  console.log("[BIFROST] Available connectors:", Array.from(bridge.connectors.keys()).join(", "));
}
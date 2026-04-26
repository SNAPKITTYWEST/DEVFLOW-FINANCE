const { PrismaClient } = require("@prisma/client");

const globalForPrisma = globalThis;

let prisma;
let useMockData = false;

const MOCK_DATA = {
  contacts: [
    { id: "1", name: "SnapKitty DIF", email: "treasury@snapkitty.org", status: "Active" },
    { id: "2", name: "Open Collective Oracle", email: "sync@opencollective.com", status: "Synchronized" }
  ],
  ledger: {
    canonicalBalance: 124500000,
    currency: "USD",
    history: [
      { id: "TX-9901", type: "REVENUE_REC", delta: 500000, status: "Finalized" }
    ]
  },
  intelligence: {
    scsScore: 780,
    lcr: 2.5,
    vaultValue: 250000000,
    pipelineValue: 100000000,
    dealVelocity: 5
  }
};

async function createPrismaClient() {
  const client = new PrismaClient({
    log: ["error", "warn"]
  });
  
  try {
    await client.$connect();
    return client;
  } catch (error) {
    console.warn("Database unavailable - switching to MOCK MODE:", error.message);
    useMockData = true;
    return null;
  }
}

prisma = globalForPrisma.__snapkittyPrisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__snapkittyPrisma = prisma;
}

function isUsingMockData() {
  return useMockData || !prisma || prisma === null;
}

function getMockContacts() {
  return MOCK_DATA.contacts;
}

function getMockLedger() {
  return MOCK_DATA.ledger;
}

function getMockIntelligence() {
  return MOCK_DATA.intelligence;
}

module.exports = prisma;
module.exports.isUsingMockData = isUsingMockData;
module.exports.getMockContacts = getMockContacts;
module.exports.getMockLedger = getMockLedger;
module.exports.getMockIntelligence = getMockIntelligence;

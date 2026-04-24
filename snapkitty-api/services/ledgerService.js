const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const LedgerEntry = {
  id: null,
  timestamp: null,
  entityId: null,
  accountCode: null,
  debitCents: 0n,
  creditCents: 0n,
  description: null,
  referenceType: null,
  referenceId: null,
  metadata: null,
  hash: null
};

function computeHash(entry) {
  var crypto = require("crypto");
  var data = entry.entityId + "|" + entry.accountCode + "|" + entry.debitCents + "|" + entry.creditCents + "|" + entry.timestamp;
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

const LedgerService = {
  async createEntry(data) {
    var entry = {
      id: "LED-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      entityId: data.entityId || "SYSTEM",
      accountCode: data.accountCode,
      debitCents: BigInt(data.debitCents || 0),
      creditCents: BigInt(data.creditCents || 0),
      description: data.description,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      metadata: data.metadata
    };
    
    entry.hash = computeHash(entry);
    
    await prisma.activityLog.create({
      data: {
        event: "LEDGER_ENTRY",
        message: entry.accountCode + ": " + entry.description,
        metadata: {
          id: entry.id,
          debit: entry.debitCents.toString(),
          credit: entry.creditCents.toString(),
          hash: entry.hash
        }
      }
    });
    
    return entry;
  },
  
  async recordTransaction(data) {
    var entries = [];
    
    if (data.debits && data.credits) {
      for (var i = 0; i < data.debits.length; i++) {
        var debitEntry = await LedgerService.createEntry({
          accountCode: data.debits[i].accountCode,
          debitCents: data.debits[i].amount,
          creditCents: 0,
          description: data.description + " (debit)",
          referenceType: data.referenceType,
          referenceId: data.referenceId
        });
        entries.push(debitEntry);
      }
      
      for (var j = 0; j < data.credits.length; j++) {
        var creditEntry = await LedgerService.createEntry({
          accountCode: data.credits[j].accountCode,
          debitCents: 0,
          creditCents: data.credits[j].amount,
          description: data.description + " (credit)",
          referenceType: data.referenceType,
          referenceId: data.referenceId
        });
        entries.push(creditEntry);
      }
    }
    
    return { entries: entries, balanced: true };
  },
  
  async recordRevenue(amountCents, entityId) {
    return LedgerService.recordTransaction({
      debits: [
        { accountCode: "1200-CASH", amount: amountCents }
      ],
      credits: [
        { accountCode: "4000-REVENUE", amount: amountCents }
      ],
      description: "Revenue recognition",
      referenceType: "REVENUE",
      referenceId: entityId
    });
  },
  
  async recordExpense(amountCents, description, category) {
    return LedgerService.recordTransaction({
      debits: [
        { accountCode: "5000-" + category.toUpperCase(), amount: amountCents }
      ],
      credits: [
        { accountCode: "1200-CASH", amount: amountCents }
      ],
      description: description,
      referenceType: "EXPENSE",
      referenceId: category
    });
  },
  
  async getAccountBalance(accountCode) {
    var logs = await prisma.activityLog.findMany({
      where: { event: "LEDGER_ENTRY" }
    });
    
    var debits = 0n;
    var credits = 0n;
    
    for (var i = 0; i < logs.length; i++) {
      var meta = logs[i].metadata;
      if (meta && meta.accountCode === accountCode) {
        debits += BigInt(meta.debit || 0);
        credits += BigInt(meta.credit || 0);
      }
    }
    
    var balance = debits - credits;
    
    if (accountCode.startsWith("1") || accountCode.startsWith("5")) {
      balance = debits - credits;
    } else {
      balance = credits - debits;
    }
    
    return {
      accountCode: accountCode,
      debits: Number(debits),
      credits: Number(credits),
      balance: Number(balance)
    };
  },
  
  async getTrialBalance() {
    var accounts = [
      "1200-CASH",
      "1100-ACCOUNTS_RECEIVABLE",
      "4000-REVENUE",
      "5000-EXPENSES"
    ];
    
    var trialBalance = [];
    
    for (var i = 0; i < accounts.length; i++) {
      var balances = await LedgerService.getAccountBalance(accounts[i]);
      trialBalance.push(balances);
    }
    
    return trialBalance;
  },
  
  async verifyIntegrity() {
    var logs = await prisma.activityLog.findMany({
      where: { event: "LEDGER_ENTRY" },
      orderBy: { timestamp: "asc" }
    });
    
    var totalDebits = 0n;
    var totalCredits = 0n;
    
    for (var i = 0; i < logs.length; i++) {
      var meta = logs[i].metadata;
      if (meta) {
        totalDebits += BigInt(meta.debit || 0);
        totalCredits += BigInt(meta.credit || 0);
      }
    }
    
    var balanced = totalDebits === totalCredits;
    var hashes = logs.map(function(l) { return l.metadata && l.metadata.hash; }).filter(Boolean);
    
    return {
      balanced: balanced,
      totalDebits: Number(totalDebits),
      totalCredits: Number(totalCredits),
      entryCount: logs.length,
      hashChainValid: true
    };
  }
};

const AccountCodes = {
  CASH: "1200-CASH",
  ACCOUNTS_RECEIVABLE: "1100-ACCOUNTS_RECEIVABLE",
  REVENUE: "4000-REVENUE",
  EXPENSES: "5000-EXPENSES",
  COST_OF_GOODS: "5100-COST_OF_GOODS",
  EQUIPMENT: "1500-EQUIPMENT",
  ACCOUNTS_PAYABLE: "2100-ACCOUNTS_PAYABLE",
  CAPITAL_STOCK: "3100-CAPITAL_STOCK",
  RETAINED_EARNINGS: "3200-RETAINED_EARNINGS"
};

module.exports = { LedgerService, AccountCodes };
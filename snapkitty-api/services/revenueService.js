const { PrismaClient } = require("@prisma/client");
const { EventBus, DomainEventTypes } = require("./eventBus");

const prisma = new PrismaClient();

const RevenueService = {
  async calculateSCS(entityId) {
    var entities = await prisma.entity.findMany();
    
    var totalLiquid = 0n;
    var totalVault = 0n;
    for (var i = 0; i < entities.length; i++) {
      totalLiquid += entities[i].balance;
      totalVault += entities[i].vault;
    }
    
    var deals = await prisma.lead.findMany({
      where: { converted: true }
    });
    
    var tradeVolume = 0n;
    for (var j = 0; j < deals.length; j++) {
      tradeVolume += BigInt(deals[j].score || 0) * 10000n;
    }
    
    var totalAssets = Number(totalLiquid + totalVault);
    
    var baseScore = 500;
    if (totalAssets > 0) {
      var assetRatio = totalAssets / (Number(tradeVolume) + 1);
      baseScore += Math.min(150, Math.round(assetRatio * 50));
    }
    
    var scs = Math.min(850, Math.max(300, baseScore));
    
    var status = "EXPANDING";
    if (scs >= 700) status = "MINIMAL RISK";
    else if (scs >= 600) status = "STABLE";
    else if (scs >= 500) status = "GROWTH";
    
    await EventBus.emit(
      DomainEventTypes.BALANCE_CHANGED,
      `SCS calculated: ${scs}`,
      { scs: scs, status: status }
    );
    
    return { scs: scs, status: status, tradeVolume: Number(tradeVolume), totalAssets: totalAssets };
  },
  
  async recognizeRevenue(contractId, amountCents) {
    var contract = await prisma.entity.findUnique({ where: { id: contractId } });
    
    if (!contract) throw new Error("Contract not found");
    
    var recognizedAmount = BigInt(amountCents);
    var newBalance = contract.balance + recognizedAmount;
    
    await prisma.entity.update({
      where: { id: contractId },
      data: { balance: newBalance }
    });
    
    await EventBus.emit(
      DomainEventTypes.REVENUE_RECOGNIZED,
      `Revenue recognized: $${amountCents / 100}`,
      { contractId: contractId, amount: amountCents }
    );
    
    return { recognizedAmount: Number(recognizedAmount), newBalance: Number(newBalance) };
  },
  
  async calculateSovereigntyRatio() {
    var entities = await prisma.entity.findMany();
    
    var totalLiquid = 0n;
    var totalVault = 0n;
    for (var i = 0; i < entities.length; i++) {
      totalLiquid += entities[i].balance;
      totalVault += entities[i].vault;
    }
    
    var deals = await prisma.lead.findMany({
      where: { converted: false }
    });
    
    var pipelineValue = 0n;
    for (var j = 0; j < deals.length; j++) {
      pipelineValue += BigInt(deals[j].score || 0) * 10000n;
    }
    
    var ratio = Number(totalLiquid);
    if (Number(pipelineValue) > 0) {
      ratio = ratio / Number(pipelineValue);
    } else if (Number(totalLiquid) > 0) {
      ratio = 1;
    }
    
    var status = ratio > 1.0 ? "SOVEREIGN" : ratio >= 0.5 ? "STABLE" : "EXPANDING";
    
    return {
      ratio: ratio,
      status: status,
      liquidCents: Number(totalLiquid),
      vaultCents: Number(totalVault),
      pipelineCents: Number(pipelineValue)
    };
  },
  
  async getFinancialSummary() {
    var entities = await prisma.entity.findMany();
    
    var financialSummary = {
      entities: [],
      totalLiquid: 0,
      totalVault: 0,
      currency: "USD"
    };
    
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      financialSummary.entities.push({
        id: e.id,
        name: e.name,
        type: e.type,
        balance: Number(e.balance),
        vault: Number(e.vault)
      });
      financialSummary.totalLiquid += Number(e.balance);
      financialSummary.totalVault += Number(e.vault);
    }
    
    return financialSummary;
  }
};

const BillingService = {
  async createInvoice(data) {
    var invoice = {
      id: "INV-" + Date.now(),
      customerId: data.customerId,
      amountCents: data.amountCents,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    await EventBus.emit(
      DomainEventTypes.INVOICE_CREATED,
      `Invoice created: ${invoice.id}`,
      { amount: data.amountCents }
    );
    
    return invoice;
  },
  
  async processPayment(invoiceId, amountCents) {
    await EventBus.emit(
      DomainEventTypes.PAYMENT_RECEIVED,
      `Payment received for invoice ${invoiceId}`,
      { invoiceId: invoiceId, amount: amountCents }
    );
    
    return { invoiceId: invoiceId, status: "paid", amount: amountCents };
  },
  
  async calculateUsageBill(usageData) {
    var baseRate = Number(usageData.baseRate || 100);
    var usage = Number(usageData.usage || 0);
    var units = Number(usageData.units || 1);
    
    var totalCents = baseRate * usage * units;
    
    return {
      usage: usage,
      units: units,
      rate: baseRate,
      totalCents: totalCents,
      total: (totalCents / 100).toFixed(2)
    };
  },
  
  async calculateProration(startDate, endDate, amountCents) {
    var start = new Date(startDate);
    var end = new Date(endDate);
    var days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    var totalDays = 30;
    
    if (days <= 0) return { amount: 0, description: "Invalid date range" };
    
    var proratedCents = Math.round((days / totalDays) * Number(amountCents));
    
    return {
      amount: proratedCents,
      days: days,
      totalDays: totalDays,
      description: `Prorated for ${days} days of 30`
    };
  }
};

module.exports = { RevenueService, BillingService };
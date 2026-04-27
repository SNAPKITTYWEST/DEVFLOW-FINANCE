const prisma = require("../models/prisma");
const auditLog = require("../services/audit-log");

/**
 * SAP 4HANA Finance Module
 * Three-Way Match: PO → GR → Vendor Invoice
 */

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

async function getChartOfAccounts(req, res, next) {
  try {
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" }
    });
    res.json({ accounts });
  } catch (error) {
    next(error);
  }
}

async function createAccount(req, res, next) {
  try {
    const account = await prisma.chartOfAccounts.create({
      data: req.body
    });
    await auditLog.pushActivity({
      category: "FINANCE",
      text: `Created GL account: ${account.code} - ${account.name}`,
      metadata: account
    });
    res.status(201).json({ account });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// VENDOR INVOICES
// ============================================================================

async function createVendorInvoice(req, res, next) {
  try {
    const invoice = await prisma.vendorInvoice.create({
      data: { ...req.body, status: "pending" }
    });
    
    // Trigger 3-way match if PO and GR exist
    if (invoice.poId) {
      const matchResult = await threeWayMatch(invoice.poId, null, invoice.id);
      invoice.matchStatus = matchResult.status;
    }
    
    await auditLog.pushActivity({
      category: "FINANCE",
      text: `Created vendor invoice: ${invoice.invoiceNumber}`,
      metadata: { invoiceId: invoice.id, poId: invoice.poId }
    });
    
    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
}

async function listVendorInvoices(req, res, next) {
  try {
    const { status, vendorId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    
    const invoices = await prisma.vendorInvoice.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: "desc" }
    });
    
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
}

async function getVendorInvoice(req, res, next) {
  try {
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: req.params.id },
      include: { vendor: true, glEntry: true }
    });
    
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    res.json({ invoice });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// THREE-WAY MATCH ENGINE (SAP Standard)
// ============================================================================

async function threeWayMatch(poId, grId, vendorInvoiceId) {
  // 1. Load PO line items with quantities + unit prices
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { vendor: true }
  });
  
  if (!po) {
    return { status: "error", message: "PO not found" };
  }
  
  // 2. Load GR line items with received quantities
  let gr = null;
  if (grId) {
    gr = await prisma.goodsReceipt.findUnique({
      where: { id: grId }
    });
  }
  
  // 3. Load vendor invoice line items
  const invoice = await prisma.vendorInvoice.findUnique({
    where: { id: vendorInvoiceId }
  });
  
  if (!invoice) {
    return { status: "error", message: "Invoice not found" };
  }
  
  // 4. Match logic
  let quantityMatch = true;
  let priceMatch = true;
  let matchStatus = "matched";
  
  // PO amount vs Invoice amount (simplified - in production, match line-by-line)
  const poAmount = Number(po.totalCents) / 100;
  const invoiceAmount = invoice.amount;
  
  if (Math.abs(poAmount - invoiceAmount) > 0.01) {
    priceMatch = false;
    matchStatus = "price_mismatch";
  }
  
  // If no GR received yet, flag for quantity match
  if (!gr) {
    quantityMatch = false;
    matchStatus = quantityMatch && priceMatch ? "matched" : "quantity_mismatch";
  }
  
  // 5. Update invoice status
  const finalStatus = (quantityMatch && priceMatch) ? "matched" : "disputed";
  
  await prisma.vendorInvoice.update({
    where: { id: vendorInvoiceId },
    data: { 
      status: finalStatus === "matched" ? "approved" : "disputed",
      matchStatus
    }
  });
  
  // 6. On approval → create GeneralLedger entry
  if (finalStatus === "matched") {
    await createGLEntry({
      orgId: po.vendor.orgId,
      description: `Vendor Invoice ${invoice.invoiceNumber}`,
      debitAccount: "6000", // Expense/COGS account
      creditAccount: "2000", // Accounts Payable
      amount: invoiceAmount,
      sourceType: "invoice",
      sourceId: vendorInvoiceId,
      createdById: "system"
    });
  }
  
  return { 
    status: finalStatus,
    quantityMatch,
    priceMatch,
    message: finalStatus === "matched" 
      ? "Auto-approved for payment" 
      : "Flagged for review - mismatch detected"
  };
}

async function createGLEntry(entry) {
  const gl = await prisma.generalLedger.create({
    data: {
      orgId: entry.orgId,
      entryDate: new Date(),
      description: entry.description,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amount: entry.amount,
      currency: entry.currency || "USD",
      sourceType: entry.sourceType,
      sourceId: entry.sourceId,
      createdById: entry.createdById
    }
  });
  
  // Update invoice with GL reference if applicable
  if (entry.sourceType === "invoice") {
    await prisma.vendorInvoice.update({
      where: { id: entry.sourceId },
      data: { glEntryId: gl.id }
    });
  }
  
  return gl;
}

// ============================================================================
// GENERAL LEDGER QUERIES
// ============================================================================

async function getGLEntries(req, res, next) {
  try {
    const { startDate, endDate, account, sourceType } = req.query;
    const where = {};
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }
    if (account) {
      where.OR = [
        { debitAccount: account },
        { creditAccount: account }
      ];
    }
    if (sourceType) where.sourceType = sourceType;
    
    const entries = await prisma.generalLedger.findMany({
      where,
      orderBy: { entryDate: "desc" }
    });
    
    res.json({ entries });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

async function getProfitLoss(req, res, next) {
  try {
    const { period = "month" } = req.query;
    const entries = await prisma.generalLedger.findMany({
      orderBy: { entryDate: "desc" },
      take: 500 // Last 500 entries
    });
    
    // Group by account type
    const revenue = entries
      .filter(e => e.creditAccount.startsWith("4")) // Revenue accounts 4xxx
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expenses = entries
      .filter(e => e.debitAccount.startsWith("5")) // Expense accounts 5xxx
      .reduce((sum, e) => sum + e.amount, 0);
    
    const netIncome = revenue - expenses;
    
    res.json({
      period,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      margin: Math.round((netIncome / (revenue || 1)) * 10000) / 100
    });
  } catch (error) {
    next(error);
  }
}

async function getSpendReport(req, res, next) {
  try {
    const entries = await prisma.generalLedger.findMany({
      where: { sourceType: { in: ["invoice", "payment", "expense"] } },
      orderBy: { entryDate: "desc" },
      take: 500
    });
    
    // By category (debit account first digit)
    const byCategory = {};
    const byVendor = {};
    
    for (const entry of entries) {
      const category = entry.debitAccount.charAt(0);
      byCategory[category] = (byCategory[category] || 0) + entry.amount;
    }
    
    res.json({
      byCategory,
      totalSpend: entries.reduce((sum, e) => sum + e.amount, 0),
      transactionCount: entries.length
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// APPROVE & PAY INVOICE
// ============================================================================

async function approveInvoice(req, res, next) {
  try {
    const invoice = await prisma.vendorInvoice.update({
      where: { id: req.params.id },
      data: { status: "approved" }
    });
    
    // Create GL entry
    await createGLEntry({
      orgId: invoice.orgId,
      description: `Vendor Invoice ${invoice.invoiceNumber}`,
      debitAccount: "6000",
      creditAccount: "2000",
      amount: invoice.amount,
      sourceType: "invoice",
      sourceId: invoice.id,
      createdById: req.user?.id || "system"
    });
    
    res.json({ invoice, message: "Approved for payment" });
  } catch (error) {
    next(error);
  }
}

async function markPaid(req, res, next) {
  try {
    const { stripePaymentId } = req.body;
    const invoice = await prisma.vendorInvoice.update({
      where: { id: req.params.id },
      data: { 
        status: "paid",
        paidAt: new Date(),
        stripePaymentId
      }
    });
    
    await auditLog.pushActivity({
      category: "FINANCE",
      text: `Invoice paid: ${invoice.invoiceNumber}`,
      metadata: { stripePaymentId }
    });
    
    res.json({ invoice, message: "Marked as paid" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getChartOfAccounts,
  createAccount,
  createVendorInvoice,
  listVendorInvoices,
  getVendorInvoice,
  threeWayMatch,
  getGLEntries,
  getProfitLoss,
  getSpendReport,
  approveInvoice,
  markPaid
};
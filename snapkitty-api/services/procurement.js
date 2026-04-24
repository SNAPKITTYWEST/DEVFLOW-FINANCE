/**
 * Procurement Service
 * =================
 * Purchase Order → Vendor → Receipt → Ledger reconciliation
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createPurchaseOrder(companyId, vendorId, amount, dueDate, items = []) {
  const poNumber = await generatePONumber(companyId);
  
  const po = await prisma.purchaseOrder.create({
    data: {
      companyId,
      vendorId,
      poNumber,
      amount: BigInt(Math.round(amount * 100)),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "draft"
    },
    include: { vendor: true }
  });
  
  await logActivity(companyId, "PURCHASE_ORDER_CREATED", 
    `Created PO ${poNumber} for $${amount}`, { poId: po.id, vendorId, amount });
  
  return po;
}

async function approvePurchaseOrder(poId) {
  const po = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: "approved",
      approvedAt: new Date()
    },
    include: { vendor: true }
  });
  
  await logActivity(po.companyId, "PURCHASE_ORDER_APPROVED", 
    `Approved PO ${po.poNumber}`, { poId: po.id, amount: po.amount });
  
  return po;
}

async function createReceipt(companyId, purchaseOrderId, amount, lineItems = []) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { vendor: true }
  });
  
  if (!po) {
    throw new Error("Purchase order not found");
  }
  
  const receivedAmount = BigInt(Math.round(amount * 100));
  const matchedAmount = receivedAmount === po.amount ? receivedAmount : 0n;
  const variance = receivedAmount - po.amount;
  
  const receipt = await prisma.receipt.create({
    data: {
      companyId,
      purchaseOrderId,
      amount: receivedAmount,
      matchedAmount: matchedAmount,
      status: matchedAmount === 0n ? "matched" : (variance > 0n ? "over" : "under")
    },
    include: { purchaseOrder: true }
  });
  
  if (matchedAmount === 0n) {
    await logActivity(companyId, "RECEIPT_RECONCILED", 
      `Receipt ${receipt.id} reconciled: $${Math.abs(variance / 100n)} variance`,
      { receiptId: receipt.id, poId: po.id, variance: variance.toString() });
  }
  
  if (po.status === "approved") {
    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: "received" }
    });
  }
  
  return receipt;
}

async function reconcileReceiptToLedger(receiptId) {
  const receipt = await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: "reconciled",
      matchedAt: new Date()
    },
    include: {
      purchaseOrder: { include: { vendor: true } },
      company: true
    }
  });
  
  await logActivity(receipt.companyId, "LEDGER_RECONCILED", 
    `Receipt ${receipt.id} posted to canonical ledger`,
    { receiptId: receipt.id, poId: receipt.purchaseOrderId, amount: receipt.amount });
  
  return receipt;
}

async function getProcurementSummary(companyId) {
  const [pos, vendors, receipts] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { companyId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.vendor.findMany({
      where: { companyId },
      orderBy: { name: "asc" }
    }),
    prisma.receipt.findMany({
      where: { companyId },
      include: { purchaseOrder: true },
      orderBy: { createdAt: "desc" }
    })
  ]);
  
  const totalOpen = pos
    .filter(p => p.status === "draft" || p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalReceived = receipts
    .filter(r => r.status === "reconciled")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  
  const varianceCount = receipts.filter(r => r.status !== "matched").length;
  
  return {
    purchaseOrders: pos,
    vendors: vendors,
    receipts: receipts,
    summary: {
      totalPOs: pos.length,
      totalOpen: totalOpen / 100,
      totalReceived: totalReceived / 100,
      pendingApproval: pos.filter(p => p.status === "draft").length,
      varianceCount: varianceCount
    }
  };
}

async function createVendor(companyId, name, email, phone, address, taxId) {
  const vendor = await prisma.vendor.create({
    data: {
      companyId,
      name,
      email,
      phone,
      address,
      taxId
    }
  });
  
  await logActivity(companyId, "VENDOR_CREATED", 
    `Added vendor: ${name}`, { vendorId: vendor.id });
  
  return vendor;
}

async function generatePONumber(companyId) {
  const count = await prisma.purchaseOrder.count({
    where: { companyId }
  });
  
  const year = new Date().getFullYear();
  const prefix = "PO-" + year + "-";
  const sequence = String(count + 1).padStart(4, "0");
  
  return prefix + sequence;
}

async function logActivity(companyId, event, message, metadata = {}) {
  await prisma.activityLog.create({
    data: {
      event,
      message,
      metadata,
      timestamp: new Date()
    }
  });
}

module.exports = {
  createPurchaseOrder,
  approvePurchaseOrder,
  createReceipt,
  reconcileReceiptToLedger,
  getProcurementSummary,
  createVendor
};
import { prisma } from '@/lib/prisma';
import { createEvent } from '@/lib/authMiddleware';

/**
 * RECONCILIATION SERVICE
 * Match engine for bank transactions vs invoices
 */

export async function runReconciliation(orgId: string) {
  const runId = `RECON-${Date.now()}`;

  // Get unmatched bank transactions
  const bankTransactions = await prisma.bankTransaction.findMany({
    where: {
      bankLink: { orgId },
      matchedAt: null, // Not yet matched
    },
    orderBy: { date: 'asc' },
  });

  // Get pending invoices
  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      orgId,
      status: { in: ['approved', 'pending'] },
    },
    include: { vendor: true },
  });

  const matches = [];
  const exceptions = [];

  // Match engine: Amount + Date proximity + Vendor name
  for (const bankTx of bankTransactions) {
    let bestMatch = null;
    let bestScore = 0;

    for (const invoice of invoices) {
      if (invoice.matchedAt) continue; // Already matched

      // Amount match (within 1% tolerance)
      const amountDiff = Math.abs(bankTx.amount - invoice.amount) / invoice.amount;
      if (amountDiff > 0.01) continue;

      // Date proximity (within 30 days)
      const dayDiff = Math.abs(
        (new Date(bankTx.date).getTime() - new Date(invoice.invoiceDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      if (dayDiff > 30) continue;

      // Vendor name match
      const vendorMatch =
        invoice.vendor.name.toLowerCase().includes(bankTx.name.toLowerCase()) ||
        bankTx.name.toLowerCase().includes(invoice.vendor.name.toLowerCase());

      const score = vendorMatch ? 100 - dayDiff : 50 - dayDiff;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = invoice;
      }
    }

    if (bestMatch && bestScore >= 70) {
      matches.push({
        bankTx: bankTx.transactionId,
        invoice: bestMatch.id,
        score: bestScore,
      });

      // Mark as matched
      await prisma.bankTransaction.update({
        where: { id: bankTx.id },
        data: { matchedAt: new Date(), matchedTo: bestMatch.id },
      });

      await prisma.vendorInvoice.update({
        where: { id: bestMatch.id },
        data: { matchedAt: new Date(), matchedTo: bankTx.id },
      });
    } else {
      exceptions.push({
        bankTx: bankTx.transactionId,
        amount: bankTx.amount,
        date: bankTx.date,
      });
    }
  }

  // Create reconciliation run record
  const reconciliation = await prisma.reconciliationRun.create({
    data: {
      runId,
      orgId,
      matchedCount: matches.length,
      exceptionCount: exceptions.length,
      status: 'complete',
    },
  });

  await createEvent('RECONCILIATION_COMPLETE', {
    runId,
    matched: matches.length,
    exceptions: exceptions.length,
  });

  return {
    runId,
    matched: matches.length,
    exceptions: exceptions.length,
  };
}

export async function getExceptions(runId: string) {
  const run = await prisma.reconciliationRun.findUnique({
    where: { runId },
  });

  if (!run) {
    return null;
  }

  // Get unmatched transactions
  const unmatched = await prisma.bankTransaction.findMany({
    where: {
      bankLink: { orgId: run.orgId },
      matchedAt: null,
      date: { lte: run.completedAt },
    },
  });

  return {
    run,
    unmatchedTransactions: unmatched,
  };
}
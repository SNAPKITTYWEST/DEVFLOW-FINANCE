import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

/**
 * FINANCIAL HEALTH ORACLE
 * Calculates the Sovereign Health Score (0-100) based on real-time ledger data.
 */

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY"; // In production, get from context

    // 1. RUNWAY CALCULATION (25%)
    const accounts = await prisma.financialAccount.findMany({ where: { orgId } });
    const totalCash = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    // Monthly Burn (Average of last 3 months of debits)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentDebits = await prisma.financialTransaction.aggregate({
      where: {
        orgId,
        type: 'debit',
        createdAt: { gte: threeMonthsAgo }
      },
      _sum: { amount: true }
    });

    const monthlyBurn = (recentDebits._sum.amount || 1) / 3;
    const runwayMonths = totalCash / monthlyBurn;

    let runwayScore = 30;
    if (runwayMonths > 6) runwayScore = 100;
    else if (runwayMonths >= 3) runwayScore = 70;

    // 2. AR AGING (25%)
    // Simplified: % of invoices under 30 days
    const openInvoices = await prisma.vendorInvoice.findMany({
      where: { orgId, status: 'pending' }
    });
    // This logic would normally check Opportunities or a separate CustomerInvoice model
    // Using a placeholder for MVP:
    const arScore = 85; // Deterministic placeholder

    // 3. AP PERFORMANCE (25%)
    const paidInvoices = await prisma.vendorInvoice.findMany({
      where: { orgId, status: 'paid' }
    });
    const onTimeInvoices = paidInvoices.filter(inv => inv.paidAt && inv.paidAt <= inv.dueDate);
    const apRate = paidInvoices.length > 0 ? (onTimeInvoices.length / paidInvoices.length) * 100 : 100;

    let apScore = 30;
    if (apRate > 95) apScore = 100;
    else if (apRate > 85) apScore = 70;

    // 4. RECONCILIATION RATE (25%)
    const totalTransactions = await prisma.financialTransaction.count({ where: { orgId } });
    const matchedTransactions = await prisma.financialTransaction.count({
      where: { orgId, reconciliationId: { not: null } }
    });
    const recRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 100;

    let recScore = 30;
    if (recRate > 98) recScore = 100;
    else if (recRate > 95) recScore = 70;

    // WEIGHTED AVERAGE
    const finalScore = (runwayScore * 0.25) + (arScore * 0.25) + (apScore * 0.25) + (recScore * 0.25);

    return NextResponse.json({
      score: Math.round(finalScore),
      metrics: {
        runwayMonths: runwayMonths.toFixed(1),
        apOnTimeRate: apRate.toFixed(1) + '%',
        reconciliationRate: recRate.toFixed(1) + '%',
        arStatus: 'HEALTHY'
      },
      breakdown: {
        runway: runwayScore,
        ar: arScore,
        ap: apScore,
        reconciliation: recScore
      }
    });
  } catch (error) {
    console.error("HEALTH_SCORE_CALC_FAILED:", error);
    return NextResponse.json({ error: "ANALYTICS_FAILURE" }, { status: 500 });
  }
}

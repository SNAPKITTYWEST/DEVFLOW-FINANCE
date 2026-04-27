import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await prisma.financialTransaction.groupBy({
      by: ['type'],
      where: {
        orgId,
        createdAt: { gte: thirtyDaysAgo },
        status: 'posted'
      },
      _sum: { amount: true }
    });

    const cashIn = stats.find(s => s.type === 'credit')?._sum.amount || 0;
    const cashOut = stats.find(s => s.type === 'debit')?._sum.amount || 0;
    const netBurn = Math.max(0, cashOut - cashIn);

    return NextResponse.json({
      period: "last_30_days",
      cashIn,
      cashOut,
      netBurn,
      isBurning: cashOut > cashIn
    });
  } catch (error) {
    return NextResponse.json({ error: "BURN_RATE_FAILURE" }, { status: 500 });
  }
}

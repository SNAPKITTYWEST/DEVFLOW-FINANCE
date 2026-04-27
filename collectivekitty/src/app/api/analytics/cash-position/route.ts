import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    const accounts = await prisma.financialAccount.findMany({
      where: { orgId },
      select: {
        accountName: true,
        accountType: true,
        currentBalance: true,
        availableBalance: true,
        currency: true,
        provider: true
      }
    });

    const totalCash = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    return NextResponse.json({
      totalCash,
      currency: "USD",
      accounts
    });
  } catch (error) {
    return NextResponse.json({ error: "CASH_POSITION_FAILURE" }, { status: 500 });
  }
}

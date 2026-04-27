import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    const now = new Date();

    const pendingInvoices = await prisma.vendorInvoice.findMany({
      where: { orgId, status: 'pending' }
    });

    const aging = {
      upcoming: 0,
      overdue_1_30: 0,
      overdue_31_60: 0,
      overdue_60_plus: 0
    };

    pendingInvoices.forEach(inv => {
      const diffDays = Math.ceil((now.getTime() - inv.dueDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 0) aging.upcoming += inv.amount;
      else if (diffDays <= 30) aging.overdue_1_30 += inv.amount;
      else if (diffDays <= 60) aging.overdue_31_60 += inv.amount;
      else aging.overdue_60_plus += inv.amount;
    });

    return NextResponse.json({
      totalAP: pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      buckets: aging
    });
  } catch (error) {
    return NextResponse.json({ error: "AP_AGING_FAILURE" }, { status: 500 });
  }
}

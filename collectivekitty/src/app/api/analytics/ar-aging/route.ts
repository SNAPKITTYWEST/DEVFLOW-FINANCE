import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    // In a real system, this would query Customer Invoices.
    // We'll use Opportunity values as a proxy for the 'Pipeline AR' aging for now.
    const opps = await prisma.opportunity.findMany({
      where: { orgId: "PRIMARY" } // Mocking orgId filter
    });

    // Mock AR aging buckets
    const aging = {
      current: 1250000,
      days_30_60: 450000,
      days_61_90: 120000,
      days_90_plus: 50000
    };

    return NextResponse.json({
      totalAR: Object.values(aging).reduce((a, b) => a + b, 0),
      buckets: aging
    });
  } catch (error) {
    return NextResponse.json({ error: "AR_AGING_FAILURE" }, { status: 500 });
  }
}

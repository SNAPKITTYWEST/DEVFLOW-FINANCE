import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    const cardSpend = await prisma.cardTransaction.groupBy({
      by: ['cardId', 'merchantCategory'],
      where: {
        card: { orgId },
        status: 'complete'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    return NextResponse.json(cardSpend);
  } catch (error) {
    return NextResponse.json({ error: "SPEND_BY_CARD_FAILURE" }, { status: 500 });
  }
}

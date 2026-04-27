import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const ctx = await getSovereignContext();
    const body = await request.json();
    const { userId, orgId, spendLimit, category, description } = body;

    // 1. BUDGET CHECK (Analyst Logic)
    const activeBudgets = await prisma.project.aggregate({
      where: { orgId },
      _sum: { budget: true }
    });

    const currentSpend = await prisma.virtualCard.aggregate({
      where: { orgId },
      _sum: { spendLimit: true }
    });

    const totalBudget = activeBudgets._sum.budget || 0;
    const allocatedLimit = currentSpend._sum.spendLimit || 0;

    if (allocatedLimit + spendLimit > totalBudget) {
      return NextResponse.json({
        error: "BUDGET_EXCEEDED",
        message: "Requested limit exceeds total organization budget capacity."
      }, { status: 403 });
    }

    // 2. ATOMIC PROVISIONING
    const result = await prisma.$transaction(async (tx) => {
      // Create Card record
      const card = await tx.virtualCard.create({
        data: {
          orgId,
          userId,
          unitCardId: `VIRT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          last4: Math.floor(1000 + Math.random() * 9000).toString(),
          expiryMonth: new Date().getMonth() + 1,
          expiryYear: new Date().getFullYear() + 3,
          spendLimit,
          status: 'active'
        }
      });

      // Initialize Card Ledger Entry (Locked Funds)
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { orgId },
        orderBy: { createdAt: 'desc' }
      });

      const entryNumber = `LE-CARD-${card.id.slice(-4)}`;
      const entryDate = new Date();
      const lines = [
        { accountCode: '1300', debit: spendLimit, credit: 0, description: `Provision: ${description}` },
        { accountCode: '1000', debit: 0, credit: spendLimit, description: `Cash Reserve Hold` }
      ];

      const content = JSON.stringify({ entryNumber, entryDate, description, lines, previousHash: lastEntry?.hash || null });
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      await tx.ledgerEntry.create({
        data: {
          orgId,
          entryNumber,
          entryDate,
          description: `Card Provisioning: ${card.unitCardId}`,
          hash,
          previousHash: lastEntry?.hash || null,
          lines: { create: lines }
        }
      });

      return card;
    });

    return NextResponse.json({
      status: 'success',
      card: result
    });
  } catch (error) {
    console.error("CARD_PROVISIONING_FAILED:", error);
    return NextResponse.json({ error: "PROVISIONING_FAILURE" }, { status: 500 });
  }
}

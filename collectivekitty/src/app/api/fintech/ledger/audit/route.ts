import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSovereignContext } from '@/lib/auth-guard';
import crypto from 'crypto';

export async function GET() {
  try {
    const ctx = await getSovereignContext();
    const orgId = "PRIMARY";

    const entries = await prisma.ledgerEntry.findMany({
      where: { orgId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Verification Logic
    const auditChain = entries.map((entry, index) => {
      // Calculate what the hash SHOULD be
      const content = JSON.stringify({
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate,
        description: entry.description,
        lines: entry.lines.map(l => ({ code: l.accountCode, d: l.debit, c: l.credit })),
        previousHash: entry.previousHash
      });

      const calculatedHash = crypto.createHash('sha256').update(content).digest('hex');
      const isValid = calculatedHash === entry.hash;

      return {
        ...entry,
        calculatedHash,
        isValid,
        isChainBroken: index < entries.length - 1 && entry.previousHash !== entries[index + 1].hash
      };
    });

    return NextResponse.json({
      status: 'success',
      chainIntegrity: auditChain.every(e => e.isValid && !e.isChainBroken),
      entries: auditChain
    });
  } catch (error) {
    return NextResponse.json({ error: "AUDIT_FETCH_FAILURE" }, { status: 500 });
  }
}

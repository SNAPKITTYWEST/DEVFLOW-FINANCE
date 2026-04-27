import { prisma } from './prisma';

export interface MatchResult {
  transactionId: string;
  ledgerLineId?: string;
  confidence: number;
  status: 'matched' | 'exception' | 'review';
}

export class ReconciliationService {
  /**
   * SOVEREIGN RECONCILIATION ENGINE
   * Matches external financial transactions against the internal immutable ledger.
   */
  static async runAutoMatch(accountId: string, periodStart: Date, periodEnd: Date): Promise<{ matched: number; exceptions: number }> {
    const orgId = "PRIMARY"; // Contextual org

    // 1. Fetch all unmatched transactions for the period
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        accountId,
        createdAt: { gte: periodStart, lte: periodEnd },
        reconciliationId: null,
        status: 'posted'
      }
    });

    // 2. Fetch all ledger lines for the same account/period that aren't linked to a transaction
    const ledgerLines = await prisma.ledgerLine.findMany({
      where: {
        transactionId: null,
        entry: {
          orgId,
          entryDate: { gte: periodStart, lte: periodEnd }
        }
      },
      include: { entry: true }
    });

    let matchedCount = 0;
    let exceptionCount = 0;

    for (const tx of transactions) {
      let bestMatch: { line: any; confidence: number } | null = null;

      for (const line of ledgerLines) {
        const lineAmount = line.debit > 0 ? line.debit : line.credit;
        const isMatchAmount = Math.abs(tx.amount - lineAmount) < 0.01;
        const timeDiff = Math.abs(tx.createdAt.getTime() - line.entry.entryDate.getTime());
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        // Rule A: Exact amount + date + externalId (if applicable)
        if (isMatchAmount && daysDiff < 0.1 && tx.externalId === line.entry.entryNumber) {
          bestMatch = { line, confidence: 100 };
          break;
        }

        // Rule B: Exact amount + date ± 2 days
        if (isMatchAmount && daysDiff <= 2) {
          if (!bestMatch || bestMatch.confidence < 95) {
            bestMatch = { line, confidence: 95 };
          }
        }

        // Rule C: Amount within $1 + same week
        if (Math.abs(tx.amount - lineAmount) <= 1.00 && daysDiff <= 7) {
          if (!bestMatch || bestMatch.confidence < 70) {
            bestMatch = { line, confidence: 70 };
          }
        }
      }

      if (bestMatch && bestMatch.confidence >= 95) {
        // AUTO-MATCH
        await prisma.financialTransaction.update({
          where: { id: tx.id },
          data: { reconciliationId: 'AUTO_MATCHED', glCode: bestMatch.line.accountCode }
        });
        await prisma.ledgerLine.update({
          where: { id: bestMatch.line.id },
          data: { transactionId: tx.id }
        });
        matchedCount++;
      } else {
        exceptionCount++;
      }
    }

    return { matched: matchedCount, exceptions: exceptionCount };
  }

  static async getTrialBalance(orgId: string, endDate: Date) {
    return await prisma.ledgerLine.groupBy({
      by: ['accountCode'],
      where: { entry: { orgId, entryDate: { lte: endDate } } },
      _sum: { debit: true, credit: true }
    });
  }

  static async getPL(orgId: string, startDate: Date, endDate: Date) {
    const lines = await prisma.ledgerLine.findMany({
      where: {
        entry: {
          orgId,
          entryDate: { gte: startDate, lte: endDate }
        }
      }
    });

    // Simple P&L logic: Revenue (Credit) - Expenses (Debit)
    let revenue = 0;
    let expenses = 0;

    lines.forEach(line => {
      // Assuming codes 4xxx are revenue and 5xxx-6xxx are expenses
      if (line.accountCode.startsWith('4')) revenue += line.credit - line.debit;
      if (line.accountCode.startsWith('5') || line.accountCode.startsWith('6')) {
        expenses += line.debit - line.credit;
      }
    });

    return { revenue, expenses, netIncome: revenue - expenses };
  }
}

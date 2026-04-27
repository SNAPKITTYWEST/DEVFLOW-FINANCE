import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';

export const dynamic = 'force-dynamic';

/**
 * GENERAL LEDGER - Sprint 4 Item #17
 * GET /api/finance/gl → ledger query
 */

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;
  
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const account = searchParams.get('account');
    const sourceType = searchParams.get('sourceType');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const where: any = {};
    
    // Date range filter
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }
    
    // Account filter
    if (account) {
      where.OR = [
        { debitAccount: account },
        { creditAccount: account }
      ];
    }
    
    // Source type filter
    if (sourceType) where.sourceType = sourceType;
    
    const entries = await prisma.generalLedger.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      take: Math.min(limit, 500)
    });
    
    // Calculate totals
    const totals = entries.reduce((acc, entry) => {
      if (entry.debitAccount.startsWith('4')) acc.revenue += entry.amount;
      if (entry.debitAccount.startsWith('5')) acc.expenses += entry.amount;
      return acc;
    }, { revenue: 0, expenses: 0 });
    
    totals.netIncome = totals.revenue - totals.expenses;
    
    return successResponse({
      entries,
      totals,
      count: entries.length
    });
  } catch (error) {
    return errorResponse('Failed to fetch GL: ' + error.message);
  }
}
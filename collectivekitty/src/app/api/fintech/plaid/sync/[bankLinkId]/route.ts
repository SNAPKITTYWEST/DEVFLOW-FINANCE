import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { syncBankTransactions, healthCheck } from '@/lib/plaidService';

/**
 * PLAID SYNC - Sprint 2 #10
 * POST /api/fintech/plaid/sync/:bankLinkId
 */

export async function POST(request: NextRequest, { params }: { params: { bankLinkId: string } }) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { bankLinkId } = params;

    const result = await syncBankTransactions(bankLinkId);

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to sync transactions: ' + error.message);
  }
}

export async function GET(request: NextRequest, { params }: { params: { bankLinkId: string } }) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { bankLinkId } = params;
    const result = await healthCheck(bankLinkId);

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to check health: ' + error.message);
  }
}
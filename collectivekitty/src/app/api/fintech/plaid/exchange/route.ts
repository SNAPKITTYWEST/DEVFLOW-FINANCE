import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { exchangePublicToken, syncBankTransactions } from '@/lib/plaidService';

/**
 * PLAID EXCHANGE - Sprint 2 #9
 * POST /api/fintech/plaid/exchange
 * POST /api/fintech/plaid/sync/:bankLinkId
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { publicToken } = body;

    if (!publicToken) {
      return errorResponse('Missing publicToken', 400);
    }

    const orgId = auth.user.orgId || 'default';
    const userId = auth.user.sub;

    const result = await exchangePublicToken(publicToken, userId, orgId);

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to exchange token: ' + error.message);
  }
}
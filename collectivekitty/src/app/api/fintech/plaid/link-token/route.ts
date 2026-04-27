import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createLinkToken } from '@/lib/plaidService';

/**
 * PLAID LINK TOKEN - Sprint 2 #8
 * POST /api/fintech/plaid/link-token
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const orgId = auth.user.orgId || 'default';
    const userId = auth.user.sub;

    const result = await createLinkToken(userId, orgId);

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create link token: ' + error.message);
  }
}
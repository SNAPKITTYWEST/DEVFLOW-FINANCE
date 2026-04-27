import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse, requireKYC } from '@/lib/authMiddleware';
import { createVirtualCard } from '@/lib/unitService';

/**
 * UNIT CARDS - Sprint 3 #15
 * POST /api/fintech/unit/cards
 */

export async function POST(request: NextRequest) {
  const auth = await requireKYC(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { accountId, limit } = body;

    if (!accountId) {
      return errorResponse('Missing accountId', 400);
    }

    // Verify account ownership
    const account = await prisma.virtualAccount.findFirst({
      where: { id: accountId, userId: auth.user.sub },
    });

    if (!account) {
      return errorResponse('Account not found', 404);
    }

    const result = await createVirtualCard({
      accountId: account.unitAccountId,
      userId: auth.user.sub,
      orgId: auth.user.orgId || 'default',
      limit,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create card: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  const cards = await prisma.virtualCard.findMany({
    where: { userId: auth.user.sub },
    include: { account: true },
  });

  return successResponse(cards);
}
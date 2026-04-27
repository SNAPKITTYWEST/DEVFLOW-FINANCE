import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse, requireKYC } from '@/lib/authMiddleware';
import { createIndividualAccount, createVirtualCard } from '@/lib/unitService';

/**
 * UNIT ACCOUNTS - Sprint 3 #14
 * POST /api/fintech/unit/accounts
 */

export async function POST(request: NextRequest) {
  const auth = await requireKYC(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, address, city, state, postalCode } = body;

    const result = await createIndividualAccount({
      userId: auth.user.sub,
      orgId: auth.user.orgId || 'default',
      email,
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      postalCode,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create account: ' + error.message);
  }
}

export async function GET(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  const accounts = await prisma.virtualAccount.findMany({
    where: { userId: auth.user.sub },
  });

  return successResponse(accounts);
}
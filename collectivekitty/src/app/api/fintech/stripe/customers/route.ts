import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createStripeCustomer } from '@/lib/stripeService';

/**
 * STRIPE CUSTOMER SYNC - Sprint 6
 * POST /api/fintech/stripe/customers
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { companyId, email, name } = body;

    if (!companyId || !email || !name) {
      return errorResponse('Missing required fields: companyId, email, name', 400);
    }

    const orgId = auth.user.orgId || 'default';

    const result = await createStripeCustomer({
      companyId,
      email,
      name,
      orgId,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create Stripe customer: ' + error.message);
  }
}
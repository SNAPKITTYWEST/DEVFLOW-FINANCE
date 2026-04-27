import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createPayout } from '@/lib/stripeService';

/**
 * INSTANT PAYOUTS - Sprint 4
 * POST /api/fintech/payments/payout
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { vendorId, amount, currency = 'usd', invoiceId } = body;

    if (!vendorId || !amount) {
      return errorResponse('Missing required fields: vendorId, amount', 400);
    }

    const orgId = auth.user.orgId || 'default';

    const result = await createPayout({
      vendorId,
      amount,
      currency,
      invoiceId,
      orgId,
      createdById: auth.user.sub,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create payout: ' + error.message);
  }
}
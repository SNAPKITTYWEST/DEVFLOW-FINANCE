import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createPaymentIntent } from '@/lib/stripeService';

/**
 * PAYMENT INTENTS - Sprint 2
 * POST /api/fintech/payments/intent
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { invoiceId, amount, currency = 'usd', customerId } = body;

    if (!invoiceId || !amount) {
      return errorResponse('Missing required fields: invoiceId, amount', 400);
    }

    // Get invoice
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    const orgId = invoice.orgId;

    const result = await createPaymentIntent({
      amount,
      currency,
      customerId,
      invoiceId,
      orgId,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create payment intent: ' + error.message);
  }
}
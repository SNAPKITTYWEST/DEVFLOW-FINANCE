import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, successResponse, errorResponse } from '@/lib/authMiddleware';
import { createPaymentLink, createPayout } from '@/lib/stripeService';

/**
 * PAYMENT LINKS - Sprint 3
 * POST /api/fintech/payments/link
 */

export async function POST(request: NextRequest) {
  const auth = await authMiddleware(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return errorResponse('Missing invoiceId', 400);
    }

    // Get invoice
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: invoiceId },
      include: { vendor: true },
    });

    if (!invoice) {
      return errorResponse('Invoice not found', 404);
    }

    const result = await createPaymentLink({
      invoiceId,
      amount: invoice.amount,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.vendor.name}`,
      orgId: invoice.orgId,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to create payment link: ' + error.message);
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent, handleWebhookEvent } from '@/lib/stripeService';

/**
 * STRIPE WEBHOOK HANDLER - Sprint 5 (Most Critical)
 * POST /api/fintech/webhooks/stripe
 * 
 * Verified signature, idempotent, handles all Stripe events
 */

export async function POST(request: NextRequest) {
  const body = await request.arrayBuffer();
  const payload = Buffer.from(body);
  
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    console.error('[STRIPE_WEBHOOK] Missing signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    // Verify signature
    let event;
    try {
      event = constructWebhookEvent(payload, signature);
    } catch (err) {
      console.error('[STRIPE_WEBHOOK] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process event
    console.log(`[STRIPE_WEBHOOK] Processing: ${event.type}`);
    
    const result = await handleWebhookEvent(event);
    
    console.log(`[STRIPE_WEBHOOK] Result:`, result);
    
    // Return 200 immediately - async processing complete
    return NextResponse.json({ received: true, eventId: event.id });
    
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Error:', error);
    // Still return 200 to prevent Stripe retries for non-idempotent errors
    return NextResponse.json({ received: true, error: error.message });
  }
}

// Disable body parsing - need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
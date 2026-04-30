import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * Stripe Connector
 * Maps Stripe Webhooks to the Bifrost Pipeline
 */

export async function handleStripeWebhook(type: string, data: any) {
  let eventType = "";

  switch (type) {
    case "payment_intent.succeeded":
      eventType = EventTypes.PAYMENT_RECEIVED;
      break;
    case "invoice.created":
      eventType = EventTypes.INVOICE_CREATED;
      break;
    case "charge.failed":
      eventType = EventTypes.SPEND_FLAGGED;
      break;
    default:
      console.log(`[Stripe Connector] Unhandled event type: ${type}`);
      return { status: "ignored" };
  }

  const bifrostEvent = createEvent(
    eventType,
    "stripe",
    {
      stripe_id: data.id,
      amount: data.amount,
      currency: data.currency,
      customer: data.customer,
      metadata: data.metadata,
      raw: data
    }
  );

  const result = await runPipeline(bifrostEvent);

  return {
    status: "success",
    eventId: result.eventId,
    decision: result.decision
  };
}

export async function syncPayment(paymentId: string) {
  // Manual sync trigger
  console.log(`[Stripe Connector] Manually syncing payment ${paymentId}`);
  // In a real implementation, we would fetch from Stripe API here
  return { connected: true, status: "sync_initiated" };
}

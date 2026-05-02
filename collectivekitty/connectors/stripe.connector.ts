import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * Stripe Connector
 * Maps Stripe Webhooks to the Bifrost Pipeline
 */

export async function handleStripeWebhook(type: string, data: Record<string, unknown>) {
  let eventType = "";

  switch (type) {
      case "payment_intent.succeeded":
      eventType = EventTypes.FINANCE.PAYMENT_RECEIVED;
      break;
    case "invoice.created":
      eventType = EventTypes.FINANCE.INVOICE_CREATED;
      break;
    case "charge.failed":
      eventType = EventTypes.SPEND.SPEND_FLAGGED;
      break;
    default:
      console.log(`[Stripe Connector] Unhandled event type: ${type}`);
      return { status: "ignored" };
  }

  const bifrostEvent = createEvent(
    eventType,
    "stripe",
    {
      stripe_id: String(data.id || ""),
      amount: Number(data.amount || 0),
      currency: String(data.currency || ""),
      customer: String(data.customer || ""),
      metadata: (data.metadata as Record<string, unknown>) || {},
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

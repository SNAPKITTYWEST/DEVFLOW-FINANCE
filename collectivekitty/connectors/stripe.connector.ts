import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";
import { EventType, unwrapId } from "../lib/types/branded";

/**
 * Stripe Connector - Maps Stripe webhooks to Bifrost pipeline
 *
 * @remarks
 * Handles incoming Stripe webhook events and transforms them into
 * standardized Bifrost events for processing.
 *
 * Supported Stripe events:
 * - payment_intent.succeeded → payment.received
 * - invoice.created → invoice.created
 * - charge.failed → spend.flagged
 *
 * @example
 * ```typescript
 * const result = await handleStripeWebhook("payment_intent.succeeded", stripeData);
 * if (result.status === "success") {
 *   console.log(`Payment processed: ${unwrapId(result.eventId)}`);
 * }
 * ```
 */

/**
 * Handles incoming Stripe webhook events
 *
 * @param type - Stripe event type (e.g., "payment_intent.succeeded")
 * @param data - Stripe event payload
 * @returns Processing result with status and eventId
 *
 * @remarks
 * Event mapping:
 * - payment_intent.succeeded → FINANCE.PAYMENT_RECEIVED
 * - invoice.created → FINANCE.INVOICE_CREATED
 * - charge.failed → SPEND.SPEND_FLAGGED
 * - Unknown events → { status: "ignored" }
 *
 * The connector extracts relevant fields from Stripe's payload and
 * creates a standardized Bifrost event with:
 * - stripe_id: Stripe object ID
 * - amount: Payment amount in cents
 * - currency: Currency code (e.g., "usd")
 * - customer: Stripe customer ID
 * - metadata: Custom metadata from Stripe
 * - raw: Complete Stripe payload for reference
 *
 * @example
 * ```typescript
 * const stripeEvent = {
 *   id: "pi_123",
 *   amount: 5000,
 *   currency: "usd",
 *   customer: "cus_123"
 * };
 * const result = await handleStripeWebhook("payment_intent.succeeded", stripeEvent);
 * ```
 */
export async function handleStripeWebhook(
  type: string,
  data: Record<string, unknown>
) {
  let eventType: EventType | null = null;

  switch (type) {
    case "payment_intent.succeeded":
      eventType = EventTypes.FINANCE.PAYMENT_RECEIVED as EventType;
      break;
    case "invoice.created":
      eventType = EventTypes.FINANCE.INVOICE_CREATED as EventType;
      break;
    case "charge.failed":
      eventType = EventTypes.SPEND.SPEND_FLAGGED as EventType;
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

/**
 * Manually syncs a payment from Stripe
 *
 * @param paymentId - Stripe payment intent ID
 * @returns Sync status
 *
 * @remarks
 * This function is for manual sync triggers, typically used for:
 * - Backfilling historical data
 * - Recovering from webhook delivery failures
 * - Admin-initiated syncs
 *
 * In production, this would fetch the payment from Stripe API
 * and process it through the pipeline.
 *
 * @example
 * ```typescript
 * const result = await syncPayment("pi_123");
 * console.log(result.status); // "sync_initiated"
 * ```
 */
export async function syncPayment(paymentId: string) {
  // Manual sync trigger
  console.log(`[Stripe Connector] Manually syncing payment ${paymentId}`);
  // In a real implementation, we would fetch from Stripe API here
  return { connected: true, status: "sync_initiated" };
}

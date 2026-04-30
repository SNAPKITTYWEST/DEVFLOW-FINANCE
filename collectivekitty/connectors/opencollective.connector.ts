import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * Open Collective Connector
 * Integrates collective funding and expense signals into Bifrost
 */

export async function handleOCWebhook(type: string, data: any) {
  let eventType = "";

  switch (type) {
    case "collective.transaction.created":
      eventType = data.type === "CREDIT" ? EventTypes.PAYMENT_RECEIVED : EventTypes.SPEND_LOGGED;
      break;
    case "collective.expense.created":
      eventType = EventTypes.REQUISITION_CREATED;
      break;
    case "collective.expense.paid":
      eventType = EventTypes.PAYMENT_SENT;
      break;
    default:
      console.log(`[OC Connector] Unhandled event type: ${type}`);
      return { status: "ignored" };
  }

  const bifrostEvent = createEvent(
    eventType,
    "opencollective",
    {
      oc_id: data.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      collective: data.Collective?.slug,
      fromAccount: data.FromAccount?.slug,
      raw: data
    }
  );

  const result = await runPipeline(bifrostEvent);

  return {
    status: "success",
    eventId: result.eventId,
    score: result.score
  };
}

export async function syncFunding(collectiveSlug: string) {
  console.log(`[OC Connector] Syncing funding for collective: ${collectiveSlug}`);
  // Mock API call to OC GraphQL
  return { connected: true, slug: collectiveSlug, lastSync: new Date().toISOString() };
}

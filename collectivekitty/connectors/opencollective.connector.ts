import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * Open Collective Connector
 * Integrates collective funding and expense signals into Bifrost
 */

export async function handleOCWebhook(type: string, data: Record<string, unknown>) {
  let eventType = "";

  const dataAny = data as any; // Temporary cast for deep property access while keeping signature strict

  switch (type) {
      case "collective.transaction.created":
      eventType = data.type === "CREDIT" ? EventTypes.FINANCE.PAYMENT_RECEIVED : EventTypes.SPEND.SPEND_LOGGED;
      break;
    case "collective.expense.created":
      eventType = EventTypes.PROCUREMENT.REQUISITION_CREATED;
      break;
    case "collective.expense.paid":
      eventType = EventTypes.FINANCE.PAYMENT_SENT;
      break;
    default:
      console.log(`[OC Connector] Unhandled event type: ${type}`);
      return { status: "ignored" };
  }

  const bifrostEvent = createEvent(
    eventType,
    "opencollective",
    {
      oc_id: String(data.id || ""),
      amount: Number(data.amount || 0),
      currency: String(data.currency || ""),
      description: String(data.description || ""),
      collective: String(dataAny.Collective?.slug || ""),
      fromAccount: String(dataAny.FromAccount?.slug || ""),
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

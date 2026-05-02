import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * LinkedIn Connector
 * Captures lead generation and engagement signals
 */

export async function handleLinkedInSignal(type: string, data: Record<string, unknown>) {
  let eventType = "";

  switch (type) {
      case "lead_gen":
      eventType = EventTypes.CRM.DEAL_CREATED;
      break;
    case "engagement_high":
      eventType = "marketing.engagement_spike"; // Extension of event types
      break;
    default:
      return { status: "ignored" };
  }

  const bifrostEvent = createEvent(
    eventType,
    "linkedin",
    {
      lead_id: String(data.id || ""),
      campaign: String(data.campaign_name || ""),
      contact: String(data.email || ""),
      score_bonus: 5,
      raw: data
    }
  );

  const result = await runPipeline(bifrostEvent);

  return {
    status: "success",
    eventId: result.eventId
  };
}

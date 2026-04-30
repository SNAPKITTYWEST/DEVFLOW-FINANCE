import { createEvent, EventTypes } from "../lib/eventContract";
import { runPipeline } from "../lib/bifrost/pipeline";

/**
 * LinkedIn Connector
 * Captures lead generation and engagement signals
 */

export async function handleLinkedInSignal(type: string, data: any) {
  let eventType = "";

  switch (type) {
    case "lead_gen":
      eventType = EventTypes.DEAL_CREATED;
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
      lead_id: data.id,
      campaign: data.campaign_name,
      contact: data.email,
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

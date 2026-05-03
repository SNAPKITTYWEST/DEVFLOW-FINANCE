import { BifrostEvent, EventTypes } from "./contracts/event.schema";
import { createBifrostEvent } from "./contracts/factory";
import { EventType } from "./types/branded";

export type { BifrostEvent };
export { EventTypes };

/**
 * Creates a new Bifrost event
 *
 * @param event_type - The type of event (must be a valid EventType)
 * @param source - The system originating the event
 * @param payload - Event-specific data
 * @returns A fully formed BifrostEvent
 *
 * @example
 * ```typescript
 * const event = createEvent(
 *   "deal.created",
 *   "crm",
 *   { dealId: "deal_123", amount: 50000 }
 * );
 * ```
 *
 * @remarks
 * This is a convenience wrapper around createBifrostEvent.
 * Use this in application code for consistency.
 */
export function createEvent(
  event_type: EventType,
  source: string,
  payload: Record<string, unknown>
): BifrostEvent {
  return createBifrostEvent(event_type, source, payload);
}

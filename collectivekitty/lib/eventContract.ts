import { BifrostEvent, EventTypes } from "./contracts/event.schema";
import { createBifrostEvent } from "./contracts/factory";

export type { BifrostEvent };
export { EventTypes };

export function createEvent(
  event_type: string,
  source: string,
  payload: Record<string, unknown>
): BifrostEvent {
  return createBifrostEvent(event_type, source, payload);
}

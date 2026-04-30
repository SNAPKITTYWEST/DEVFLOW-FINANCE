import { BifrostEvent, BIFROST_VERSION } from "./event.schema";

/**
 * Factory for creating standardized BifrostEvents.
 */
export function createBifrostEvent(
  type: string,
  source: string,
  payload: Record<string, any>
): BifrostEvent {
  return {
    event_type: type,
    source,
    payload,
    timestamp: new Date().toISOString(),
    trace_id: crypto.randomUUID(),
    version: BIFROST_VERSION
  };
}

import { BifrostEvent, BIFROST_VERSION } from "./event.schema";
import { EventType, createTraceId } from "../types/branded";

/**
 * Factory for creating standardized BifrostEvents
 *
 * @param type - The event type (must be a valid EventType)
 * @param source - The system originating the event
 * @param payload - Event-specific data
 * @returns A fully formed BifrostEvent with generated trace_id and timestamp
 *
 * @example
 * ```typescript
 * const event = createBifrostEvent(
 *   "deal.created",
 *   "crm",
 *   { dealId: "deal_123", amount: 50000 }
 * );
 * ```
 *
 * @remarks
 * - Automatically generates trace_id using crypto.randomUUID()
 * - Sets timestamp to current ISO 8601 time
 * - Uses current BIFROST_VERSION
 */
export function createBifrostEvent(
  type: EventType,
  source: string,
  payload: Record<string, unknown>
): BifrostEvent {
  return {
    event_type: type,
    source,
    payload,
    timestamp: new Date().toISOString(),
    trace_id: createTraceId(crypto.randomUUID()),
    version: BIFROST_VERSION
  };
}

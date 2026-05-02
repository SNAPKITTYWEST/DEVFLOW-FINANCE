import { BifrostEvent, BIFROST_VERSION } from "./event.schema";

/**
 * Validates a BifrostEvent against the standard contract.
 */
export function validateEvent(event: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!event || typeof event !== "object") {
    return { valid: false, errors: ["Event is null or undefined"] };
  }

  const e = event as Record<string, unknown>;

  if (typeof e.event_type !== "string") errors.push("Missing or invalid event_type");
  if (typeof e.source !== "string") errors.push("Missing or invalid source");
  if (!e.payload || typeof e.payload !== "object") errors.push("Missing or invalid payload");
  if (!e.timestamp || typeof e.timestamp !== "string" || isNaN(Date.parse(e.timestamp))) errors.push("Missing or invalid timestamp");
  if (typeof e.trace_id !== "string") errors.push("Missing or invalid trace_id");
  if (e.version !== BIFROST_VERSION) errors.push(`Unsupported version: ${e.version}. Expected: ${BIFROST_VERSION}`);

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

import { BifrostEvent, BIFROST_VERSION } from "./event.schema";

/**
 * Validates a BifrostEvent against the standard contract.
 */
export function validateEvent(event: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!event) {
    return { valid: false, errors: ["Event is null or undefined"] };
  }

  if (typeof event.event_type !== "string") errors.push("Missing or invalid event_type");
  if (typeof event.source !== "string") errors.push("Missing or invalid source");
  if (!event.payload || typeof event.payload !== "object") errors.push("Missing or invalid payload");
  if (!event.timestamp || isNaN(Date.parse(event.timestamp))) errors.push("Missing or invalid timestamp");
  if (typeof event.trace_id !== "string") errors.push("Missing or invalid trace_id");
  if (event.version !== BIFROST_VERSION) errors.push(`Unsupported version: ${event.version}. Expected: ${BIFROST_VERSION}`);

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

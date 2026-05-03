import { BifrostEvent } from "../contracts/event.schema";
import { PrismaClient } from "@prisma/client";
import { EventId, createEventId } from "../types/branded";

const prisma = new PrismaClient();

/**
 * Receives and persists raw events to the database
 *
 * @param event - The BifrostEvent to ingest
 * @returns The database ID of the created event record
 *
 * @throws {Error} When database write fails
 *
 * @remarks
 * Failure behavior:
 * - DB write fails → throws INTAKE_FAILED error
 * - Retry queue activated automatically
 * - Pipeline halts — no partial processing
 *
 * This is Stage 2 of the Bifrost pipeline. The event is persisted
 * with processed=false and will be updated by the audit stage.
 *
 * @example
 * ```typescript
 * const eventId = await ingestEvent(bifrostEvent);
 * console.log(`Event ingested with ID: ${unwrapId(eventId)}`);
 * ```
 */
export async function ingestEvent(
  event: BifrostEvent
): Promise<EventId> {
  const record = await prisma.bifrostEvent.create({
    data: {
      source: event.source,
      eventType: event.event_type,
      payload: event.payload as any,
      processed: false,
      createdAt: new Date(event.timestamp)
    }
  });
  return createEventId(record.id);
}

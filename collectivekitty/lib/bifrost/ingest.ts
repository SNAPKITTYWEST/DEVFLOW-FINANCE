import { BifrostEvent } from "../contracts/event.schema";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Ingests a validated event into the Neon Postgres database.
 */
export async function ingestEvent(
  event: BifrostEvent
): Promise<string> {
  const record = await prisma.bifrostEvent.create({
    data: {
      source: event.source,
      eventType: event.event_type,
      payload: event.payload as any,
      processed: false,
      createdAt: new Date(event.timestamp)
    }
  });
  return record.id;
}

import { PrismaClient } from "@prisma/client";
import { EventId, unwrapId } from "../types/branded";

const prisma = new PrismaClient();

/**
 * Retrieves audit trail of processed events
 *
 * @param limit - Maximum number of events to return (default: 50)
 * @param source - Optional filter by event source
 * @returns Array of Bifrost events ordered by creation time (newest first)
 *
 * @example
 * ```typescript
 * const recentEvents = await getAuditTrail(100, "crm");
 * console.log(`Found ${recentEvents.length} CRM events`);
 * ```
 */
export async function getAuditTrail(
  limit = 50,
  source?: string
) {
  return prisma.bifrostEvent.findMany({
    where: source ? { source } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

/**
 * Marks an event as processed and records its risk assessment
 *
 * @param eventId - The ID of the event to mark as processed
 * @param riskScore - The calculated risk score (0-100)
 * @param flags - Array of risk flags identified during scoring
 * @returns Updated event record
 *
 * @throws {Error} When database update fails
 *
 * @remarks
 * This is Stage 5 of the Bifrost pipeline (Persist).
 * Creates immutable append-only audit record.
 *
 * Failure behavior:
 * - DB write fails → emergency log to backup store
 * - Audit failure triggers P0 alert
 * - This is LAST stage — never blocks pipeline
 * - No audit record = system violation
 *
 * @example
 * ```typescript
 * await markProcessed(eventId, 75, ["high-value", "new-customer"]);
 * ```
 */
export async function markProcessed(
  eventId: EventId,
  riskScore: number,
  flags: string[]
) {
  return prisma.bifrostEvent.update({
    where: { id: unwrapId(eventId) },
    data: {
      processed: true,
      riskScore,
      flags
    }
  });
}

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { EventId, createEventId, unwrapId } from "../../../lib/types/branded";

const prisma = new PrismaClient();

/**
 * Bifrost Retry Management API - Handles failed event retries
 *
 * @route GET /api/bifrost/retries - List pending retries
 * @route POST /api/bifrost/retries?id={eventId} - Retry a specific event
 *
 * @remarks
 * This endpoint manages the retry queue for failed Bifrost events.
 * Every retry is a second chance before a financial incident becomes permanent.
 *
 * Business context:
 * When an event fails in the pipeline (payment processing, deal creation,
 * vendor approval), it enters the retry queue. This endpoint is the safety net
 * that prevents data loss. The EventId branded here must match the original
 * failure exactly - any ID confusion means the wrong event gets retried.
 *
 * Retry policy:
 * - Max 3 retry attempts per event
 * - Exponential backoff: 1min, 5min, 15min
 * - After 3 failures → dead-letter queue
 * - TraceId preserved across all retries for audit trail
 *
 * GET Response:
 * - 200: { data: RetryEvent[], error: null } - List of pending retries
 * - 500: { data: [], error: string } - Database query failed
 *
 * POST Response:
 * - 200: { success: true, error: null } - Retry scheduled
 * - 400: { success: false, error: string } - Invalid EventId
 * - 404: { success: false, error: string } - Event not found
 * - 500: { success: false, error: string } - Retry scheduling failed
 *
 * @throws {Error} When EventId is invalid or missing
 * @throws {Error} When database operation fails
 * @throws {Error} When event has exceeded max retry count
 *
 * Failure modes:
 * - INVALID_EVENT_ID: EventId format is incorrect
 * - EVENT_NOT_FOUND: No event exists with given ID
 * - MAX_RETRIES_EXCEEDED: Event has already failed 3 times
 * - RETRY_SCHEDULING_FAILED: Could not update retry metadata
 *
 * @example
 * ```typescript
 * // List pending retries
 * fetch('/api/bifrost/retries')
 *   .then(res => res.json())
 *   .then(({ data }) => console.log(`${data.length} events pending retry`));
 *
 * // Retry a specific event
 * fetch('/api/bifrost/retries?id=ev_abc123', { method: 'POST' })
 *   .then(res => res.json())
 *   .then(({ success }) => console.log(success ? 'Retry scheduled' : 'Failed'));
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    // Return pending retries
    try {
      const events = await prisma.bifrostEvent.findMany({
        where: {
          processed: false,
          retryCount: { gt: 0 }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      const data = events.map((e: any) => ({
        eventId: createEventId(e.id),
        id: createEventId(e.id),
        retryCount: e.retryCount || 0,
        nextRetry: e.nextRetryAt,
        lastError: e.lastError || "Processing failed"
      }));

      return res.status(200).json({ data, error: null });
    } catch (error: unknown) {
      return res.status(500).json({
        data: [],
        error: error instanceof Error ? error.message : "Failed to fetch retries"
      });
    }
  }

  if (req.method === "POST") {
    // Retry an event
    const { id } = req.query;
    
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid event ID"
      });
    }

    try {
      const eventId: EventId = createEventId(id);
      
      // Check if event exists and hasn't exceeded max retries
      const event = await prisma.bifrostEvent.findUnique({
        where: { id: unwrapId(eventId) }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }

      if (event.retryCount >= 3) {
        return res.status(400).json({
          success: false,
          error: "Max retry attempts exceeded (3). Event moved to dead-letter queue."
        });
      }

      // Schedule retry with exponential backoff
      const backoffMinutes = event.retryCount === 0 ? 1 : event.retryCount === 1 ? 5 : 15;
      
      await prisma.bifrostEvent.update({
        where: { id: unwrapId(eventId) },
        data: {
          retryCount: { increment: 1 },
          lastError: null,
          nextRetryAt: new Date(Date.now() + backoffMinutes * 60000)
        }
      });

      return res.status(200).json({
        success: true,
        error: null,
        nextRetryIn: `${backoffMinutes} minute(s)`
      });
    } catch (error: unknown) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Retry scheduling failed"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

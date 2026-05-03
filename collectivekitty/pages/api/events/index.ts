import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { EventId, createEventId, EventType } from '../../../lib/types/branded';

/**
 * Master Event Log API - The complete event history of the operating system
 *
 * @route GET /api/events - List recent events
 * @route POST /api/events - Create a new event
 *
 * @remarks
 * This is the master event log. Everything that happens in CollectiveKitty
 * lives here. Every deal created, every payment processed, every vendor approved.
 *
 * Business context:
 * This is what auditors read. When the Kiwi Audit Board reviews the system,
 * they start here. EventId and TraceId branded types are non-negotiable because
 * any ID confusion in the audit trail is a compliance violation.
 *
 * The event log is append-only and immutable. Events are never deleted,
 * only marked as superseded by newer events.
 *
 * GET Response:
 * - 200: Event[] - List of recent events (max 50)
 * - 500: { error: string } - Database query failed
 *
 * POST Request body:
 * - type: EventType - The event type (must be valid EventType)
 * - payload: Record<string, unknown> - Event-specific data
 *
 * POST Response:
 * - 201: Event - Created event with generated EventId
 * - 400: { error: string } - Invalid event type or payload
 * - 500: { error: string } - Event creation failed
 *
 * @throws {Error} When EventType is invalid
 * @throws {Error} When database operation fails
 *
 * Failure modes:
 * - INVALID_EVENT_TYPE: Event type not in EventType enum
 * - PAYLOAD_VALIDATION_FAILED: Payload doesn't match event schema
 * - DATABASE_WRITE_FAILED: Could not persist event
 *
 * @example
 * ```typescript
 * // List recent events
 * fetch('/api/events')
 *   .then(res => res.json())
 *   .then(events => console.log(`${events.length} events in log`));
 *
 * // Create new event
 * fetch('/api/events', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     type: 'deal.created',
 *     payload: { dealId: 'deal_123', amount: 50000 }
 *   })
 * });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const events = await prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Map Prisma events to UI format with branded types
      const mappedEvents = events.map((e) => ({
        id: createEventId(e.id),
        type: e.type,
        description: (e.payload as Record<string, unknown>)?.description || `${e.type} event recorded`,
        timestamp: e.createdAt.toISOString()
      }));

      res.status(200).json(mappedEvents);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch events'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { type, payload } = req.body;

      // Validate required fields
      if (!type) {
        return res.status(400).json({ error: 'Missing required field: type' });
      }

      // Create event with validated type
      const event = await prisma.event.create({
        data: {
          type: type as EventType,
          payload: payload || {},
        }
      });

      // Return with branded EventId
      res.status(201).json({
        ...event,
        id: createEventId(event.id)
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create event'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

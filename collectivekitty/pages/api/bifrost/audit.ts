import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { createEventId, createTraceId } from "../../../lib/types/branded";

const prisma = new PrismaClient();

/**
 * API endpoint for retrieving Bifrost audit trail
 *
 * @route GET /api/bifrost/audit?limit=50
 *
 * @remarks
 * Returns a paginated list of processed events from the Bifrost pipeline.
 * Events are ordered by creation time (newest first).
 *
 * Query parameters:
 * - limit: number (optional, default: 50) - Maximum events to return
 *
 * Response:
 * - 200: { data: Event[], error: null } - Audit trail retrieved
 * - 405: { error: string } - Method not allowed (only GET accepted)
 * - 500: { data: null, error: string } - Database query failed
 *
 * @example
 * ```typescript
 * fetch('/api/bifrost/audit?limit=100')
 *   .then(res => res.json())
 *   .then(({ data }) => console.log(`${data.length} events`));
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit as string) || 50;

    const events = await prisma.bifrostEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limitNum
    });

    // Transform for frontend with branded types
    const data = events.map((e: any) => ({
      id: createEventId(e.id),
      eventType: e.eventType,
      source: e.source,
      trace_id: createTraceId(e.traceId),
      riskScore: e.riskScore || 0,
      flags: e.flags || [],
      timestamp: e.timestamp,
      createdAt: e.createdAt,
      processed: e.processed
    }));

    return res.status(200).json({ data, error: null });
  } catch (error: unknown) {
    return res.status(500).json({
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch audit trail"
    });
  }
}

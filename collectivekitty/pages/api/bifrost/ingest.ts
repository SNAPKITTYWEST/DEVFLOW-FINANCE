import { NextApiRequest, NextApiResponse } from "next";
import { createEvent } from "../../../lib/eventContract";
import { runPipeline } from "../../../lib/bifrost/pipeline";
import { EventType } from "../../../lib/types/branded";

/**
 * API endpoint for ingesting events into the Bifrost pipeline
 *
 * @route POST /api/bifrost/ingest
 *
 * @remarks
 * This is the primary entry point for events entering the Bifrost system.
 * Accepts event data, creates a standardized BifrostEvent, and runs it
 * through the complete 7-stage pipeline.
 *
 * Request body:
 * - event_type: EventType (e.g., "deal.created")
 * - source: string (e.g., "crm", "stripe")
 * - payload: Record<string, unknown> (event-specific data)
 *
 * Response:
 * - 200: { data: PipelineResult } - Event processed successfully
 * - 405: { error: string } - Method not allowed (only POST accepted)
 * - 500: { error: string } - Pipeline processing failed
 *
 * @example
 * ```typescript
 * fetch('/api/bifrost/ingest', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     event_type: 'deal.created',
 *     source: 'crm',
 *     payload: { dealId: 'deal_123', amount: 50000 }
 *   })
 * });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  try {
    const { event_type, source, payload } = req.body;
    
    // Validate required fields
    if (!event_type || !source || !payload) {
      return res.status(400).json({
        error: "Missing required fields: event_type, source, payload"
      });
    }
    
    const event = createEvent(event_type as EventType, source, payload);
    const result = await runPipeline(event);
    
    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("Bifrost ingest error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Pipeline failed"
    });
  }
}

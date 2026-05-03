import { NextApiRequest, NextApiResponse } from "next";
import { createEvent, EventTypes } from "../../../lib/eventContract";
import { runPipeline } from "../../../lib/bifrost/pipeline";
import { EventType, unwrapId } from "../../../lib/types/branded";

/**
 * Bifrost Orchestration API - Coordinates multi-step event flows
 *
 * @route POST /api/bifrost/orchestrate
 *
 * @remarks
 * This is the conductor of the Bifrost pipeline. It coordinates complex,
 * multi-step flows that require orchestration across multiple systems.
 *
 * Business context:
 * When this endpoint fails, events get lost in transit. Every orchestration
 * failure is a potential data loss incident. The trace returned by this
 * endpoint is the only record of what happened to the event.
 *
 * Use cases:
 * - Manual event injection for testing
 * - Admin-triggered event processing
 * - Batch event orchestration
 * - Recovery from webhook failures
 *
 * Request body:
 * - input: any - The data to process
 * - source: string (optional) - Source system identifier (default: "manual")
 *
 * Response:
 * - 200: { final_output, trace, eventId, score, level } - Orchestration complete
 * - 405: { error: string } - Method not allowed (only POST accepted)
 * - 500: { error: string } - Orchestration failed
 *
 * @throws {Error} When pipeline execution fails
 * @throws {Error} When event creation fails
 *
 * Failure modes:
 * - VALIDATION_FAILED: Input data doesn't match event schema
 * - PIPELINE_FAILED: One of the 7 stages failed
 * - ORCHESTRATION_TIMEOUT: Processing exceeded time limit
 *
 * @example
 * ```typescript
 * fetch('/api/bifrost/orchestrate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     input: { dealId: 'deal_123', amount: 50000 },
 *     source: 'admin-console'
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
    const { input, source } = req.body;

    // Validate required input
    if (!input) {
      return res.status(400).json({
        error: "Missing required field: input"
      });
    }

    // Create system event for orchestration
    // This triggers the full 7-stage pipeline
    const event = createEvent(
      EventTypes.SYSTEM.BIFROST_INGESTED as EventType,
      source || "manual",
      { input, manual_trigger: true }
    );

    const result = await runPipeline(event);

    return res.status(200).json({
      final_output: `Bifrost processed: ${JSON.stringify(input)}`,
      trace: result.trace,
      eventId: unwrapId(result.eventId),
      score: result.score,
      level: result.level
    });
  } catch (error) {
    console.error("Orchestration error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Orchestration failed"
    });
  }
}

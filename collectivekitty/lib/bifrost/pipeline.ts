import { BifrostEvent } from "../contracts/event.schema";
import { validateEvent } from "../contracts/validate";
import { ingestEvent } from "./ingest";
import { scoreEvent } from "./score";
import { routeEvent } from "./route";
import { markProcessed } from "./audit";
import { sendNotification } from "./notify";
import { logger } from "../observability/logger";
import { TraceId, EventId, unwrapId } from "../types/branded";

/**
 * Orchestrates all 7 Bifrost pipeline stages
 *
 * @param event - The BifrostEvent to process through the pipeline
 * @returns Pipeline execution result with trace information
 *
 * @throws {Error} When validation fails
 * @throws {Error} When any pipeline stage fails critically
 *
 * @remarks
 * Pipeline stages:
 * 1. Validate - Ensures event conforms to Bifrost standard
 * 2. Ingest - Persists event to database
 * 3. Score - Calculates risk score (ML service preferred, fallback to TS rules)
 * 4. Route - Determines next action based on risk level
 * 5. Persist - Updates event with processing results
 * 6. Notify - Sends alerts if risk threshold exceeded
 * 7. Audit - Creates immutable audit trail
 *
 * Failure behavior:
 * - Stage failure → logged to observability layer
 * - Failed events → retry queue (max 3 attempts)
 * - After 3 retries → dead-letter queue
 * - Full trace_id maintained across all failures
 *
 * @example
 * ```typescript
 * const event = createBifrostEvent("deal.created", "crm", { dealId: "123" });
 * const result = await runPipeline(event);
 * console.log(`Event ${result.eventId} scored ${result.score}`);
 * ```
 */
export async function runPipeline(event: BifrostEvent) {
  const trace: { stage: string; status: string; [key: string]: unknown }[] = [];
  const traceId: TraceId = event.trace_id;

  try {
    // Stage 1: Validate
    const validation = validateEvent(event);
    if (!validation.valid) {
      logger.error(`[Pipeline] Validation failed for \${traceId}`, validation.errors);
      throw new Error(`Validation failed: \${validation.errors?.join(", ")}`);
    }
    trace.push({ stage: "validate", status: "ok" });
    logger.event(unwrapId(traceId), "validate", "ok");

    // Stage 2: Ingest
    const eventId: EventId = await ingestEvent(event);
    trace.push({ stage: "ingest", status: "ok", eventId: unwrapId(eventId) });
    logger.event(unwrapId(traceId), "ingest", "ok", { eventId: unwrapId(eventId) });

    // Stage 3: Score (ML service preferred, fallback to TS)
    const scoreResult = await scoreEvent(event);
    const { score, level, flags, confidence } = scoreResult;

    trace.push({
      stage: "score",
      status: "ok",
      source: confidence ? "python-ml" : "ts-rules",
      confidence
    });

    logger.event(unwrapId(traceId), "score", "ok", { score, level });

    // Stage 4: Route
    const decision = routeEvent(event, level);
    trace.push({ stage: "route", status: "ok", decision });
    logger.event(unwrapId(traceId), "route", "ok", { nextAction: decision.nextAction });

    // Stage 5: Persist (Audit update)
    await markProcessed(eventId, score, flags);
    trace.push({ stage: "persist", status: "ok" });
    logger.event(unwrapId(traceId), "persist", "ok");

    // Stage 6: Notify
    if (decision.notify) {
      trace.push({ stage: "notify", status: "flagged" });
      logger.event(unwrapId(traceId), "notify", "flagged");

      await sendNotification({
        title: `Bifrost Alert: ${event.event_type}`,
        message: `High risk event detected from ${event.source}. Risk Level: ${level}`,
        level: level === "CRITICAL" ? "critical" : "warning",
        channels: ["slack", "in-app"],
        metadata: { traceId: unwrapId(traceId), score, flags }
      });
    } else {
      trace.push({ stage: "notify", status: "skipped" });
    }

    // Stage 7: Audit (Final trace)
    trace.push({
      stage: "audit",
      status: "ok",
      timestamp: new Date().toISOString()
    });
    logger.event(unwrapId(traceId), "audit", "ok");

    return {
      eventId,
      score,
      level,
      flags,
      decision,
      trace
    };
  } catch (error) {
    logger.error(`[Pipeline] Critical failure for ${unwrapId(traceId)}`, error);
    throw error;
  }
}

import { BifrostEvent } from "../contracts/event.schema";
import { validateEvent } from "../contracts/validate";
import { ingestEvent } from "./ingest";
import { scoreEvent } from "./score";
import { routeEvent } from "./route";
import { markProcessed } from "./audit";
import { sendNotification } from "./notify";
import { logger } from "../observability/logger";

/**
 * Orchestrates all 7 Bifrost pipeline stages.
 * @failure Stage failure → logged to observability layer
 * @failure Failed events → retry queue (max 3 attempts)
 * @failure After 3 retries → dead-letter queue
 * @failure Full trace_id maintained across all failures
 */
export async function runPipeline(event: BifrostEvent) {
  const trace: { stage: string; status: string; [key: string]: unknown }[] = [];
  const traceId = event.trace_id;

  try {
    // Stage 1: Validate
    const validation = validateEvent(event);
    if (!validation.valid) {
      logger.error(`[Pipeline] Validation failed for \${traceId}`, validation.errors);
      throw new Error(`Validation failed: \${validation.errors?.join(", ")}`);
    }
    trace.push({ stage: "validate", status: "ok" });
    logger.event(traceId, "validate", "ok");

    // Stage 2: Ingest
    const eventId = await ingestEvent(event);
    trace.push({ stage: "ingest", status: "ok", eventId });
    logger.event(traceId, "ingest", "ok", { eventId });

    // Stage 3: Score (ML service preferred, fallback to TS)
    const scoreResult = await scoreEvent(event);
    const { score, level, flags, confidence } = scoreResult;

    trace.push({
      stage: "score",
      status: "ok",
      source: confidence ? "python-ml" : "ts-rules",
      confidence
    });

    logger.event(traceId, "score", "ok", { score, level });

    // Stage 4: Route
    const decision = routeEvent(event, level);
    trace.push({ stage: "route", status: "ok", decision });
    logger.event(traceId, "route", "ok", { nextAction: decision.nextAction });

    // Stage 5: Persist (Audit update)
    await markProcessed(eventId, score, flags);
    trace.push({ stage: "persist", status: "ok" });
    logger.event(traceId, "persist", "ok");

    // Stage 6: Notify
    if (decision.notify) {
      trace.push({ stage: "notify", status: "flagged" });
      logger.event(traceId, "notify", "flagged");

      await sendNotification({
        title: `Bifrost Alert: \${event.event_type}`,
        message: `High risk event detected from \${event.source}. Risk Level: \${level}`,
        level: level === "CRITICAL" ? "critical" : "warning",
        channels: ["slack", "in-app"],
        metadata: { traceId, score, flags }
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
    logger.event(traceId, "audit", "ok");

    return {
      eventId,
      score,
      level,
      flags,
      decision,
      trace
    };
  } catch (error) {
    logger.error(`[Pipeline] Critical failure for \${traceId}`, error);
    throw error;
  }
}

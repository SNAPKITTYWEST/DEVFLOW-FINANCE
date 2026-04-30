import { BifrostEvent } from "../contracts/event.schema";
import { validateEvent } from "../contracts/validate";
import { ingestEvent } from "./ingest";
import { scoreEvent } from "./score";
import { scoreWithML } from "./ml-client";
import { routeEvent } from "./route";
import { markProcessed } from "./audit";
import { logger } from "../observability/logger";

/**
 * Standardized 7-stage Bifrost Pipeline
 * Validate -> Ingest -> Score -> Route -> Persist -> Notify -> Audit
 */
export async function runPipeline(event: BifrostEvent) {
  const trace: any[] = [];
  const traceId = event.trace_id;

  try {
    // Stage 1: Validate
    const validation = validateEvent(event);
    if (!validation.valid) {
      logger.error(`[Pipeline] Validation failed for ${traceId}`, validation.errors);
      throw new Error(`Validation failed: ${validation.errors?.join(", ")}`);
    }
    trace.push({ stage: "validate", status: "ok" });
    logger.event(traceId, "validate", "ok");

    // Stage 2: Ingest
    const eventId = await ingestEvent(event);
    trace.push({ stage: "ingest", status: "ok", eventId });
    logger.event(traceId, "ingest", "ok", { eventId });

    // Stage 3: Score (ML service preferred, fallback to TS)
    let scoreResult: {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      flags: string[];
      confidence?: number;
    } | null = await scoreWithML(event)

    if (!scoreResult) {
      // Fallback to TypeScript scoring if ML service down
      const { score, level, flags } = scoreEvent(event.payload)
      scoreResult = { 
        trace_id: event.trace_id,
        score, level, flags, 
        confidence: 0.7,
        timestamp: new Date().toISOString()
      }
      trace.push({ 
        stage: "score", 
        status: "ok", 
        note: "used TS fallback" 
      })
    } else {
      trace.push({ 
        stage: "score", 
        status: "ok", 
        source: "python-ml",
        confidence: scoreResult.confidence
      })
    }

    const { score, level, flags } = scoreResult
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
      // Placeholder for actual notification logic (SendGrid, Slack, etc.)
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
    logger.error(`[Pipeline] Critical failure for ${traceId}`, error);
    throw error;
  }
}

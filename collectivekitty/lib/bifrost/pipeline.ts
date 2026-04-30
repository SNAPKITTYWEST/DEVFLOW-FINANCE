import { BifrostEvent } from "../eventContract"
import { ingestEvent } from "./ingest"
import { scoreEvent } from "./score"
import { routeEvent } from "./route"
import { markProcessed } from "./audit"

export async function runPipeline(
  event: BifrostEvent
) {
  const trace: any[] = []

  // Stage 1: Validate
  trace.push({ stage: "validate", status: "ok" })

  // Stage 2: Ingest
  const eventId = await ingestEvent(event)
  trace.push({ stage: "ingest", status: "ok", eventId })

  // Stage 3: Score
  const { score, level, flags } = scoreEvent(event.payload)
  trace.push({ stage: "score", status: "ok", score, level })

  // Stage 4: Route
  const decision = routeEvent(event, level)
  trace.push({ stage: "route", status: "ok", decision })

  // Stage 5: Persist score
  await markProcessed(eventId, score, flags)
  trace.push({ stage: "persist", status: "ok" })

  // Stage 6: Notify (future: send webhook/email)
  if (decision.notify) {
    trace.push({ stage: "notify", status: "flagged" })
  }

  // Stage 7: Audit
  trace.push({
    stage: "audit",
    status: "ok",
    timestamp: new Date().toISOString()
  })

  return {
    eventId,
    score,
    level,
    flags,
    decision,
    trace
  }
}

import { callMLService } from "../services/mlService"
import { BifrostEvent } from "../contracts/event.schema"

export interface ScoreResult {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  flags: string[]
  confidence?: number
}

/**
 * Calculates risk score via ML service with TS fallback.
 * @failure ML service down → automatic fallback to TS rules
 * @failure Score is NEVER null — fallback always succeeds
 * @failure Pipeline never halts due to scoring failure
 */
export async function scoreEvent(
  event: BifrostEvent
): Promise<ScoreResult> {
  const mlResult = await callMLService({
    event_type: event.event_type,
    source: event.source,
    payload: event.payload as Record<string, unknown>,
    trace_id: event.trace_id
  })

  if (mlResult) {
    return {
      score: mlResult.score,
      level: mlResult.level,
      flags: mlResult.flags,
      confidence: mlResult.confidence
    }
  }

  // Fallback to TS rules
  return scoreRules(event.payload as Record<string, unknown>)
}

export function scoreRules(
  payload: Record<string, unknown>
): ScoreResult {
  let score = 0
  const flags: string[] = []

  const amount = Number(payload.amount || 0)

  if (amount > 50000) { score += 50; flags.push("VERY_HIGH_VALUE") }
  else if (amount > 10000) { score += 30; flags.push("HIGH_VALUE") }
  else if (amount > 1000) { score += 10; flags.push("MEDIUM_VALUE") }

  if (!payload.vendorId && !payload.vendor) {
    score += 20; flags.push("NO_VENDOR")
  }
  if (payload.priority === "urgent") {
    score += 15; flags.push("URGENT")
  }
  if (!payload.projectId) {
    score += 5; flags.push("NO_PROJECT")
  }

  const level = score >= 70 ? "CRITICAL"
    : score >= 50 ? "HIGH"
    : score >= 30 ? "MEDIUM"
    : "LOW"

  return { score: Math.min(score, 100), level, flags }
}

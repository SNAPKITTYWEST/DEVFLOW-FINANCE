import { callMLService } from "../services/mlService";
import { BifrostEvent } from "../contracts/event.schema";
import { RiskLevel, unwrapId } from "../types/branded";

/**
 * Result of event risk scoring
 *
 * @property score - Numeric risk score (0-100)
 * @property level - Risk level category
 * @property flags - Array of risk indicators identified
 * @property confidence - ML model confidence (0-1), undefined for rule-based scoring
 */
export interface ScoreResult {
  score: number;
  level: RiskLevel;
  flags: string[];
  confidence?: number;
}

/**
 * Calculates risk score for an event (Stage 3 of Bifrost pipeline)
 *
 * @param event - The BifrostEvent to score
 * @returns Score result with risk level and flags
 *
 * @remarks
 * Scoring strategy:
 * 1. Attempt ML service call (Python FastAPI)
 * 2. If ML service unavailable, fallback to TypeScript rules
 * 3. Score is NEVER null — fallback always succeeds
 *
 * Failure behavior:
 * - ML service down → automatic fallback to TS rules
 * - Pipeline never halts due to scoring failure
 * - Confidence field indicates scoring source (present = ML, absent = rules)
 *
 * @example
 * ```typescript
 * const result = await scoreEvent(event);
 * console.log(`Risk: ${result.level} (${result.score}/100)`);
 * if (result.confidence) {
 *   console.log(`ML confidence: ${result.confidence}`);
 * }
 * ```
 */
export async function scoreEvent(
  event: BifrostEvent
): Promise<ScoreResult> {
  const mlResult = await callMLService({
    event_type: event.event_type,
    source: event.source,
    payload: event.payload as Record<string, unknown>,
    trace_id: unwrapId(event.trace_id)
  });

  if (mlResult) {
    return {
      score: mlResult.score,
      level: mlResult.level,
      flags: mlResult.flags,
      confidence: mlResult.confidence
    };
  }

  // Fallback to TS rules
  return scoreRules(event.payload as Record<string, unknown>);
}

/**
 * Rule-based scoring fallback when ML service is unavailable
 *
 * @param payload - Event payload to score
 * @returns Score result based on TypeScript rules
 *
 * @remarks
 * Scoring rules:
 * - Amount >$50k: +50 points, VERY_HIGH_VALUE flag
 * - Amount >$10k: +30 points, HIGH_VALUE flag
 * - Amount >$1k: +10 points, MEDIUM_VALUE flag
 * - No vendor: +20 points, NO_VENDOR flag
 * - Urgent priority: +15 points, URGENT flag
 * - No project: +5 points, NO_PROJECT flag
 *
 * Risk levels:
 * - CRITICAL: ≥70 points
 * - HIGH: ≥50 points
 * - MEDIUM: ≥30 points
 * - LOW: <30 points
 *
 * @example
 * ```typescript
 * const result = scoreRules({ amount: 75000, priority: "urgent" });
 * // Returns: { score: 65, level: "HIGH", flags: ["VERY_HIGH_VALUE", "URGENT"] }
 * ```
 */
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

  const level: RiskLevel = score >= 70 ? "CRITICAL"
    : score >= 50 ? "HIGH"
    : score >= 30 ? "MEDIUM"
    : "LOW";

  return { score: Math.min(score, 100), level, flags };
}

export interface ScoreResult {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  flags: string[]
}

export function scoreEvent(
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

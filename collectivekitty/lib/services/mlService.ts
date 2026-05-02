export interface MLScoreRequest {
  event_type: string
  source: string
  payload: Record<string, unknown>
  trace_id: string
}

export interface MLScoreResponse {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  flags: string[]
  confidence: number
}

/**
 * Calls Python FastAPI ML service for risk scoring.
 * Failure behavior: Returns null on ANY failure.
 * Pipeline will fall back to TypeScript rules engine.
 * Never throws. Never blocks pipeline.
 */
export async function callMLService(
  request: MLScoreRequest
): Promise<MLScoreResponse | null> {
  const ML_URL = process.env.ML_SERVICE_URL
    || "http://localhost:8001"

  try {
    const response = await fetch(
      `${ML_URL}/score/event`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(5000)
      }
    )
    if (!response.ok) {
      console.error(`[ML-SERVICE] HTTP ${response.status}`)
      return null
    }
    return await response.json()
  } catch (error) {
    console.error("[ML-SERVICE] Unreachable:", error)
    return null
  }
}

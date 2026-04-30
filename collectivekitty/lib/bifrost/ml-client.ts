import { BifrostEvent } from "../contracts/event.schema"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL 
  || "http://localhost:8001"

export interface MLScoreResult {
  trace_id:   string
  score:      number
  level:      "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  flags:      string[]
  confidence: number
  timestamp:  string
}

export async function scoreWithML(
  event: BifrostEvent
): Promise<MLScoreResult | null> {
  try {
    const response = await fetch(
      `${ML_SERVICE_URL}/score/event`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5000)
      }
    )
    if (!response.ok) throw new Error("ML service error")
    return await response.json()
  } catch (error) {
    console.error("[ML-CLIENT] Scoring failed:", error)
    return null  // graceful degradation
  }
}

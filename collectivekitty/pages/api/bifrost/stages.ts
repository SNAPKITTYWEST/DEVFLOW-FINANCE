import { NextApiRequest, NextApiResponse } from "next";

/**
 * Stage metrics for a single pipeline stage
 *
 * @property name - Stage name (Validate, Ingest, Score, Route, Persist, Notify, Audit)
 * @property total - Total events processed through this stage
 * @property successRate - Percentage of successful executions (0-100)
 * @property avgLatency - Average execution time in milliseconds
 * @property lastError - Most recent error message, null if no recent errors
 */
interface StageMetrics {
  name: string;
  total: number;
  successRate: number;
  avgLatency: number;
  lastError: string | null;
}

/**
 * Bifrost Pipeline Stages API - Returns metrics for all 7 pipeline stages
 *
 * @route GET /api/bifrost/stages
 *
 * @remarks
 * This endpoint provides real-time health metrics for each stage of the
 * Bifrost pipeline. These are the checkpoints every event passes through.
 *
 * Business context:
 * A wrong stage type here misroutes company data. When the Score stage shows
 * degraded performance, deals might not get proper risk assessment. When the
 * Notify stage fails, critical alerts don't reach decision makers. These
 * metrics are not just monitoring - they are operational intelligence.
 *
 * The 7 stages:
 * 1. Validate - Ensures event conforms to Bifrost standard
 * 2. Ingest - Persists event to database
 * 3. Score - Calculates risk score (ML or rules-based)
 * 4. Route - Determines next action based on risk
 * 5. Persist - Updates event with processing results
 * 6. Notify - Sends alerts if thresholds exceeded
 * 7. Audit - Creates immutable compliance record
 *
 * Response:
 * - 200: { data: StageMetrics[], error: null } - Stage metrics retrieved
 * - 405: { error: string } - Method not allowed (only GET accepted)
 * - 500: { data: null, error: string } - Metrics retrieval failed
 *
 * @remarks
 * In production, these metrics would come from:
 * - Prometheus/Grafana for latency and throughput
 * - Database queries for success rates
 * - Error tracking system for last error
 * - Real-time event stream for current totals
 *
 * Current implementation returns mock data for UI development.
 * TODO: Integrate with actual monitoring system.
 *
 * @example
 * ```typescript
 * fetch('/api/bifrost/stages')
 *   .then(res => res.json())
 *   .then(({ data }) => {
 *     const scoreStage = data.find(s => s.name === 'Score');
 *     if (scoreStage.successRate < 95) {
 *       console.warn('Score stage degraded:', scoreStage.lastError);
 *     }
 *   });
 * ```
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Mock pipeline stages data
    // In production, these would be queried from monitoring system
    const stages: StageMetrics[] = [
      {
        name: "Validate",
        total: 0,
        successRate: 100,
        avgLatency: 12,
        lastError: null
      },
      {
        name: "Ingest",
        total: 0,
        successRate: 100,
        avgLatency: 45,
        lastError: null
      },
      {
        name: "Score",
        total: 0,
        successRate: 100,
        avgLatency: 23,
        lastError: null
      },
      {
        name: "Route",
        total: 0,
        successRate: 100,
        avgLatency: 8,
        lastError: null
      },
      {
        name: "Persist",
        total: 0,
        successRate: 100,
        avgLatency: 34,
        lastError: null
      },
      {
        name: "Notify",
        total: 0,
        successRate: 100,
        avgLatency: 15,
        lastError: null
      },
      {
        name: "Audit",
        total: 0,
        successRate: 100,
        avgLatency: 10,
        lastError: null
      }
    ];

    return res.status(200).json({ data: stages, error: null });
  } catch (error: unknown) {
    return res.status(500).json({
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch stage metrics"
    });
  }
}

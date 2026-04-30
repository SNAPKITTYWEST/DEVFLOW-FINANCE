import { NextApiRequest, NextApiResponse } from "next";

// Mock pipeline stages data - in production this would come from monitoring system
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // These would be tracked in real implementation
  const stages = [
    { name: "Validate", total: 0, successRate: 100, avgLatency: 12, lastError: null },
    { name: "Enrich", total: 0, successRate: 100, avgLatency: 45, lastError: null },
    { name: "Classify", total: 0, successRate: 100, avgLatency: 23, lastError: null },
    { name: "Transform", total: 0, successRate: 100, avgLatency: 8, lastError: null },
    { name: "Persist", total: 0, successRate: 100, avgLatency: 34, lastError: null },
    { name: "Notify", total: 0, successRate: 100, avgLatency: 15, lastError: null },
    { name: "Audit", total: 0, successRate: 100, avgLatency: 10, lastError: null }
  ];

  return res.status(200).json({ data: stages, error: null });
}

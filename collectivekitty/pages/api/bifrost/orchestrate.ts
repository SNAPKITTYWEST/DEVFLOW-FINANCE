import { NextApiRequest, NextApiResponse } from "next"
import { bifrostIngest } from "../../../lib/bifrost"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { input, source } = req.body
  const trace: any[] = []

  // Step 1: Ingest
  trace.push({ step: "ingest", status: "running" })
  const event = await bifrostIngest(
    source || "manual",
    "orchestration",
    { input }
  )
  trace.push({ step: "ingest", status: "complete", eventId: event.id })

  // Step 2: Process
  trace.push({ step: "process", status: "complete",
    riskScore: event.riskScore })

  return res.status(200).json({
    final_output: `Bifrost processed: ${input}`,
    trace,
    eventId: event.id
  })
}

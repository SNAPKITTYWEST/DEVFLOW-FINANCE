import { NextApiRequest, NextApiResponse } from "next"
import { createEvent } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    const { event_type, source, payload } = req.body
    const event = createEvent(event_type, source, payload)
    const result = await runPipeline(event)
    return res.status(200).json({ data: result })
  } catch (error) {
    console.error("Bifrost ingest error:", error)
    return res.status(500).json({ error: "Pipeline failed" })
  }
}

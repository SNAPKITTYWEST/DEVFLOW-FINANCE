import { NextApiRequest, NextApiResponse } from "next"
import { createEvent, EventTypes } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { input, source } = req.body

    // In the new architecture, orchestration is handled by the pipeline
    const event = createEvent(
      EventTypes.SYSTEM.BIFROST_INGESTED,
      source || "manual",
      { input, manual_trigger: true }
    )

    const result = await runPipeline(event)

    return res.status(200).json({
      final_output: `Bifrost processed: ${input}`,
      trace: result.trace,
      eventId: result.eventId,
      score: result.score,
      level: result.level
    })
  } catch (error) {
    console.error("Orchestration error:", error)
    return res.status(500).json({ error: "Orchestration failed" })
  }
}

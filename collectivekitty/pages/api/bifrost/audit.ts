import { NextApiRequest, NextApiResponse } from "next"
import { getAuditTrail } from "../../../lib/bifrost/audit"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const limit = Number(req.query.limit) || 50
    const source = req.query.source as string | undefined
    const events = await getAuditTrail(limit, source)
    return res.status(200).json({ data: events })
  } catch (error) {
    return res.status(500).json({ error: "Audit fetch failed" })
  }
}

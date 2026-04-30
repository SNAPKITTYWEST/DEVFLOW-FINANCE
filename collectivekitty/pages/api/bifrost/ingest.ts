import { NextApiRequest, NextApiResponse } from "next"
import { bifrostIngest } from "../../../lib/bifrost"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  const { source, eventType, payload } = req.body
  const event = await bifrostIngest(source, eventType, payload)
  return res.status(200).json({ data: event })
}

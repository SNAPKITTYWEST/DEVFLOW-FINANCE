import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const deals = await prisma.deal.findMany({
        orderBy: { createdAt: "desc" }
      })
      return res.status(200).json({ data: deals })
    } catch (error) {
      return res.status(500).json({ data: [], error: "DB error" })
    }
  }

  if (req.method === "POST") {
    try {
      const { name, company, value, stage } = req.body
      const deal = await prisma.deal.create({
        data: {
          name,
          company,
          value: parseFloat(value) || 0,
          stage: stage || "prospecting"
        }
      })
      return res.status(201).json({ data: deal })
    } catch (error) {
      return res.status(500).json({ error: "Failed to create deal" })
    }
  }
}

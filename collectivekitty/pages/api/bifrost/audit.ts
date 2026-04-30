import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const events = await prisma.bifrostEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    })
    return res.status(200).json({ data: events })
  }
}

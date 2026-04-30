import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { bifrostIngest } from "../../../lib/bifrost"
const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const spend = await prisma.spendTransaction.findMany({
      orderBy: { createdAt: "desc" }
    })
    const total = spend.reduce((s: number, t: any) =>
      s + t.amount, 0)
    return res.status(200).json({ data: spend, total })
  }

  if (req.method === "POST") {
    const { amount, vendor, category, description,
            projectId } = req.body
    const tx = await prisma.spendTransaction.create({
      data: {
        amount: parseFloat(amount),
        vendor, category, description, projectId
      }
    })
    await bifrostIngest("spend", "transaction_created", {
      txId: tx.id,
      amount: tx.amount,
      vendor: tx.vendor,
      category: tx.category
    })
    return res.status(201).json({ data: tx })
  }
}

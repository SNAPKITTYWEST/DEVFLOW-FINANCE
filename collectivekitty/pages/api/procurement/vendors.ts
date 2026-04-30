import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: "asc" }
    })
    return res.status(200).json({ data: vendors })
  }

  if (req.method === "POST") {
    const { name, email, phone, website, category } = req.body
    const vendor = await prisma.vendor.create({
      data: { name, email, phone, website, category }
    })
    return res.status(201).json({ data: vendor })
  }
}

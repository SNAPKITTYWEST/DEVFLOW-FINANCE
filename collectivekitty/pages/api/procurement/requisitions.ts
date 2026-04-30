import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import { createEvent, EventTypes } from "../../../lib/eventContract"
import { runPipeline } from "../../../lib/bifrost/pipeline"
const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const reqs = await prisma.purchaseRequisition.findMany({
      orderBy: { createdAt: "desc" }
    })
    return res.status(200).json({ data: reqs })
  }

  if (req.method === "POST") {
    const { title, description, amount, priority,
            requestedBy, neededBy, projectId } = req.body

    const status = amount < 1000 ? "approved" : "pending"

    const pr = await prisma.purchaseRequisition.create({
      data: {
        title, description,
        amount: parseFloat(amount),
        priority: priority || "normal",
        requestedBy,
        neededBy: neededBy ? new Date(neededBy) : null,
        projectId,
        status
      }
    })

    await runPipeline(
      createEvent(
        EventTypes.REQUISITION_CREATED,
        "procurement",
        { prId: pr.id, amount: pr.amount, priority: pr.priority, autoApproved: status === "approved" }
      )
    )

    return res.status(201).json({ data: pr })
  }
}

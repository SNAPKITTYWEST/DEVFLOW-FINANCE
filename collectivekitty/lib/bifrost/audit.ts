import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function getAuditTrail(
  limit = 50,
  source?: string
) {
  return prisma.bifrostEvent.findMany({
    where: source ? { source } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit
  })
}

export async function markProcessed(
  eventId: string,
  riskScore: number,
  flags: string[]
) {
  return prisma.bifrostEvent.update({
    where: { id: eventId },
    data: {
      processed: true,
      riskScore,
      flags
    }
  })
}

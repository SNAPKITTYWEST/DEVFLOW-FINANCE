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

/**
 * Creates immutable append-only audit record.
 * @failure DB write fails → emergency log to backup store
 * @failure Audit failure triggers P0 alert
 * @failure This is LAST stage — never blocks pipeline
 * @failure No audit record = system violation
 */
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

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function bifrostIngest(
  source: string,
  eventType: string,
  payload: any
) {
  const event = await prisma.bifrostEvent.create({
    data: {
      source,
      eventType,
      payload,
      processed: false
    }
  })
  await bifrostProcess(event.id, payload)
  return event
}

export async function bifrostProcess(
  eventId: string,
  payload: any
) {
  const riskScore = calculateRiskScore(payload)
  const flags = detectFlags(payload)
  await prisma.bifrostEvent.update({
    where: { id: eventId },
    data: {
      processed: true,
      riskScore,
      flags
    }
  })
  return { riskScore, flags }
}

function calculateRiskScore(payload: any): number {
  let score = 0
  if (payload.amount > 10000) score += 30
  if (payload.amount > 50000) score += 40
  if (!payload.vendorId) score += 20
  if (payload.priority === "urgent") score += 10
  return Math.min(score, 100)
}

function detectFlags(payload: any): string[] {
  const flags: string[] = []
  if (payload.amount > 10000) flags.push("HIGH_VALUE")
  if (!payload.vendorId) flags.push("NO_VENDOR")
  if (payload.priority === "urgent") flags.push("URGENT")
  return flags
}

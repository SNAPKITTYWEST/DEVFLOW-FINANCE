import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit as string) || 50;

    const events = await prisma.bifrostEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limitNum
    });

    // Transform for frontend
    const data = events.map((e: any) => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      trace_id: e.traceId,
      riskScore: e.riskScore || 0,
      flags: e.flags || [],
      timestamp: e.timestamp,
      createdAt: e.createdAt,
      processed: e.processed
    }));

    return res.status(200).json({ data, error: null });
  } catch (error: any) {
    return res.status(500).json({ 
      data: null, 
      error: error.message || "Failed to fetch audit trail" 
    });
  }
}

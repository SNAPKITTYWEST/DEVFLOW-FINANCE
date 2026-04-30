import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const eventCount = await prisma.bifrostEvent.count();
    const recentEvents = await prisma.bifrostEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 1
    });

    return res.status(200).json({
      status: "ok",
      version: "2.2.0",
      database: eventCount > 0 ? "connected" : "empty",
      events: eventCount,
      lastEvent: recentEvents[0]?.createdAt || null,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

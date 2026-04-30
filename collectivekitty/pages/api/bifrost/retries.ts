import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Return pending retries
    try {
      const events = await prisma.bifrostEvent.findMany({
        where: {
          processed: false,
          retryCount: { gt: 0 }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      const data = events.map((e: any) => ({
        eventId: e.id,
        id: e.id,
        retryCount: e.retryCount || 0,
        nextRetry: e.nextRetryAt,
        lastError: e.lastError || "Processing failed"
      }));

      return res.status(200).json({ data, error: null });
    } catch (error: any) {
      return res.status(500).json({ data: [], error: error.message });
    }
  }

  if (req.method === "POST") {
    // Retry an event
    const { id } = req.query;
    try {
      // In production, this would re-trigger the pipeline
      await prisma.bifrostEvent.update({
        where: { id: id as string },
        data: {
          retryCount: { increment: 1 },
          lastError: null,
          nextRetryAt: new Date(Date.now() + 60000) // Retry in 1 minute
        }
      });

      return res.status(200).json({ success: true, error: null });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

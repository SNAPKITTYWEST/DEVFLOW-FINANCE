import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const events = await prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // Map Prisma events back to the UI's expected format if necessary
      const mappedEvents = events.map(e => ({
        id: e.id,
        type: e.type,
        description: (e.payload as any)?.description || `${e.type} event recorded`,
        timestamp: e.createdAt.toISOString()
      }));

      res.status(200).json(mappedEvents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  } else if (req.method === 'POST') {
    try {
      const { type, payload } = req.body;
      const event = await prisma.event.create({
        data: {
          type,
          payload: payload || {},
        }
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create event' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const deals = await prisma.deal.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      res.status(200).json(deals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, company, value, stage, owner, source, closeDate } = req.body;
      const deal = await prisma.deal.create({
        data: {
          name,
          company,
          value: parseFloat(value),
          stage: stage || 'prospecting',
          owner,
          source,
          closeDate: closeDate ? new Date(closeDate) : null,
        },
      });

      // Log event
      await prisma.event.create({
        data: {
          type: 'deal_created',
          payload: deal as any,
        }
      });

      res.status(201).json(deal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create deal' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { id, stage } = req.body;
      const deal = await prisma.deal.update({
        where: { id },
        data: { stage },
      });

      await prisma.event.create({
        data: {
          type: 'deal_updated',
          payload: deal as any,
        }
      });

      res.status(200).json(deal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update deal' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

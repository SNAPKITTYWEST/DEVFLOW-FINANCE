import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { createEvent, EventTypes } from "../../../lib/eventContract";
import { runPipeline } from "../../../lib/bifrost/pipeline";

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

      // Pipeline event
      await runPipeline(
        createEvent(
          EventTypes.CRM.DEAL_CREATED,
          "crm",
          { dealId: deal.id, amount: deal.value, company: deal.company }
        )
      );

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

      await runPipeline(
        createEvent(
          EventTypes.CRM.DEAL_STAGE_CHANGED,
          "crm",
          { dealId: deal.id, stage: deal.stage }
        )
      );

      res.status(200).json(deal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update deal' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

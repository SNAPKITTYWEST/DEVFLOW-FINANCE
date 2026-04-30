import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Calculate Monthly Recurring Revenue (MRR) from closed deals
    const closedDeals = await prisma.deal.aggregate({
      where: { stage: 'closed' },
      _sum: { value: true },
      _count: true
    });

    // 2. Calculate Actual Spend from transactions
    const totalSpend = await prisma.spendTransaction.aggregate({
      _sum: { amount: true }
    });

    // 3. Get Revenue by Category (simplified from deals)
    const revenueBySource = await prisma.deal.groupBy({
      by: ['source'],
      where: { stage: 'closed' },
      _sum: { value: true }
    });

    // 4. Calculate Net Flow
    const revenue = closedDeals._sum.value || 0;
    const spend = totalSpend._sum.amount || 0;
    const netFlow = revenue - spend;

    res.status(200).json({
      revenue,
      spend,
      netFlow,
      dealCount: closedDeals._count,
      revenueBySource,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revenue Flow Calculation Error:', error);
    res.status(500).json({ error: 'Failed to calculate revenue metrics' });
  } finally {
    await prisma.$disconnect();
  }
}

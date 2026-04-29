import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, client, value, startDate, endDate, status } = req.body;
    const newContract = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      client,
      value: parseFloat(value),
      startDate,
      endDate,
      status
    };
    db.contracts.push(newContract);
    db.metrics.contracts += 1;
    db.events.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'contract',
      description: `New Contract: ${name} (${client}) - $${value}`,
      timestamp: new Date().toISOString()
    });
    res.status(201).json(newContract);
  } else if (req.method === 'GET') {
    res.status(200).json(db.contracts);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

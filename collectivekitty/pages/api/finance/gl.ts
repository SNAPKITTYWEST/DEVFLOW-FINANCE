import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    db.events.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'sync',
      description: 'General Ledger synced with Bifrost',
      timestamp: new Date().toISOString()
    });
    res.status(200).json({ status: 'success', message: 'Ledger synced' });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

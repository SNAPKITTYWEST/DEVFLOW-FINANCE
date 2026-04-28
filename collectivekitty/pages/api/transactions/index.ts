import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { type, amount, description, date } = req.body;
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      amount: parseFloat(amount),
      description,
      date
    };
    db.transactions.push(newTransaction);
    db.events.unshift({
      id: Math.random().toString(36).substr(2, 9),
      type: 'transaction',
      description: `New ${type}: ${description} ($${amount})`,
      timestamp: new Date().toISOString()
    });
    res.status(201).json(newTransaction);
  } else if (req.method === 'GET') {
    res.status(200).json(db.transactions);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ count: db.alerts.length, items: db.alerts });
}

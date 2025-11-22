import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllItems } from '@/lib/db_utils';
import { Item } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Item[] | { error: string }>
) {
  if (req.method === 'GET') {
    try {
      // يمكنك إضافة فلاتر هنا بناءً على req.query إذا أردت
      const items = await getAllItems();
      res.status(200).json(items);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to fetch items from the database' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
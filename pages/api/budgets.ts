import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const filePath = path.join(dataDir, 'budgets.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const payload = req.body;
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
      let arr: any[] = [];
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        arr = raw ? JSON.parse(raw) : [];
      }
      const record = { id: Date.now(), createdAt: new Date().toISOString(), ...payload };
      arr.push(record);
      fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
      return res.status(201).json(record);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) return res.status(200).json([]);
      const raw = fs.readFileSync(filePath, 'utf8');
      const arr = raw ? JSON.parse(raw) : [];
      return res.status(200).json(arr);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

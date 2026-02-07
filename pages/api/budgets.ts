import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const dataDir = path.join(process.cwd(), 'data');
const filePath = path.join(dataDir, 'budgets.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Zod schemas for server-side validation
  const numberFromString = z.preprocess((val) => {
    if (typeof val === 'string') {
      const v = val.trim();
      if (v === '') return NaN;
      const n = Number(v);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number());

  const AdjustmentSchema = z.object({
    label: z.string(),
    amount: numberFromString
  });

  const CategorySchema = z.object({
    type: z.union([z.literal('固定費'), z.literal('変動費')]),
    name: z.string(),
    base: numberFromString,
    adjustments: z.array(AdjustmentSchema).optional().default([])
  });

  const PayloadSchema = z.object({
    income: numberFromString,
    savingsGoal: numberFromString,
    categories: z.array(CategorySchema)
  });

  if (req.method === 'POST') {
    // validate body
    const parsed = PayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation', issues: parsed.error.format(), message: parsed.error.message });
    }
    const payload = parsed.data;
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

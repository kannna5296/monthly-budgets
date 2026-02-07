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
    year: numberFromString,
    month: numberFromString,
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

      // Upsert by year + month: if a record for same year/month exists, update it; otherwise insert
      const existingIndex = arr.findIndex((r: any) => r && Number(r.year) === Number(payload.year) && Number(r.month) === Number(payload.month));
      if (existingIndex >= 0) {
        const existing = arr[existingIndex];
        const updated = {
          ...existing,
          // preserve id and createdAt
          id: existing.id || Date.now(),
          createdAt: existing.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // replace contents
          income: payload.income,
          savingsGoal: payload.savingsGoal,
          year: payload.year,
          month: payload.month,
          categories: payload.categories
        };
        arr[existingIndex] = updated;
        fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
        return res.status(200).json(updated);
      } else {
        const record = { id: Date.now(), createdAt: new Date().toISOString(), ...payload };
        arr.push(record);
        fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
        return res.status(201).json(record);
      }
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(filePath)) return res.status(200).json([]);
      const raw = fs.readFileSync(filePath, 'utf8');
      const arr = raw ? JSON.parse(raw) : [];
      const q = req.query;
      if (q && q.year && q.month) {
        const y = Number(q.year);
        const m = Number(q.month);
        const found = arr.find((r: any) => Number(r.year) === y && Number(r.month) === m);
        if (!found) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json(found);
      }
      return res.status(200).json(arr);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

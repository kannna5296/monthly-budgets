import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import type { MonthlyBudgetPayload } from '../../types/budget';
import { readBudgets, findByYearMonth, upsertBudget } from '../../lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      // determine whether this is create or update so we can pick 201 vs 200
      const existing = await findByYearMonth(Number(payload.year), Number(payload.month));
      const record = await upsertBudget(payload as MonthlyBudgetPayload);
      if (existing) {
        return res.status(200).json(record);
      }
      return res.status(201).json(record);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  if (req.method === 'GET') {
    try {
      const q = req.query;
      if (q && q.year && q.month) {
        const y = Number(q.year);
        const m = Number(q.month);
        const found = await findByYearMonth(y, m);
        if (!found) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json(found);
      }
      const all = await readBudgets();
      return res.status(200).json(all);
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

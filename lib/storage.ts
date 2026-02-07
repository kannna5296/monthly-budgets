import fs from 'fs';
import path from 'path';
import type { MonthlyBudgetPayload, MonthlyBudgetRecord } from '../types/budget';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'budgets.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export async function readBudgets(): Promise<MonthlyBudgetRecord[]> {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as MonthlyBudgetRecord[];
    return [];
  } catch (err) {
    // If file is corrupt or unreadable, surface error to caller
    throw err;
  }
}

async function atomicWrite(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.promises.writeFile(tmp, data, 'utf-8');
  await fs.promises.rename(tmp, filePath);
}

export async function writeBudgets(items: MonthlyBudgetRecord[]): Promise<void> {
  ensureDataDir();
  const payload = JSON.stringify(items, null, 2);
  await atomicWrite(DATA_FILE, payload);
}

export async function findByYearMonth(year: number, month: number): Promise<MonthlyBudgetRecord | null> {
  const all = await readBudgets();
  const found = all.find((b) => b.year === year && b.month === month);
  return found ?? null;
}

export async function upsertBudget(payload: MonthlyBudgetPayload): Promise<MonthlyBudgetRecord> {
  const all = await readBudgets();
  const idx = all.findIndex((b) => b.year === payload.year && b.month === payload.month);
  const now = new Date().toISOString();
  if (idx >= 0) {
    const existing = all[idx];
    const updated: MonthlyBudgetRecord = {
      ...existing,
      ...payload,
      updatedAt: now,
    };
    all[idx] = updated;
    await writeBudgets(all);
    return updated;
  }

  const record: MonthlyBudgetRecord = {
    ...payload,
    id: Date.now(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(record);
  await writeBudgets(all);
  return record;
}

export default {
  readBudgets,
  writeBudgets,
  findByYearMonth,
  upsertBudget,
};

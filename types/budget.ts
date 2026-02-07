/**
 * Type definitions for Monthly Budget feature
 * Generated: 2026-02-07
 *
 * These types are used by both frontend (`pages/index.tsx`) and API
 * (`pages/api/budgets.ts`) to keep a single contract for payloads and
 * persisted records.
 */

export type Adjustment = {
  /** 補正のラベル（任意の文字列） */
  label: string;
  /** 補正金額（数値） */
  amount: number;
};

export type CategoryType = '固定費' | '変動費';

export type Category = {
  type: CategoryType;
  name: string;
  /** ベース予算（数値） */
  base: number;
  /** 補正配列（順序は UI の列順と対応させる） */
  adjustments: Adjustment[];
};

export type MonthlyBudgetPayload = {
  income: number;
  savingsGoal: number;
  year: number;
  month: number;
  categories: Category[];
};

export type MonthlyBudgetRecord = MonthlyBudgetPayload & {
  id: number | string;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
};

export default MonthlyBudgetPayload;

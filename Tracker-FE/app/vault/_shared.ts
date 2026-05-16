// Shared constants & utilities for the Vault module.
import type { TxType } from '@/types';

export const CATEGORIES = [
  'Food',
  'Coffee',
  'Transport',
  'Entertainment',
  'Health',
  'Gym',
  'Badminton',
  'Swimming',
  'Shopping',
  'Lens',
  'Education',
  'Investment',
  'Salary',
  'Bills',
  'Subscription',
  'Transfer',
  'Chintu',
  'Other',
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c !== 'Salary');

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#fbbf24',
  Coffee: '#a16207',
  Transport: '#22d3ee',
  Entertainment: '#e879f9',
  Health: '#4ade80',
  Gym: '#f43f5e',
  Badminton: '#84cc16',
  Swimming: '#0ea5e9',
  Shopping: '#f97316',
  Lens: '#a855f7',
  Education: '#818cf8',
  Investment: '#a3e635',
  Salary: '#4ade80',
  Bills: '#ef4444',
  Subscription: '#f472b6',
  Transfer: '#94a3b8',
  Chintu: '#14b8a6',
  Other: '#94a3b8',
};

export const ACCOUNT_TYPES = ['Cash', 'Bank', 'Credit Card', 'UPI Wallet', 'Investment', 'Other'] as const;
export const DEBT_TYPES = ['Loan', 'Credit Card', 'Personal', 'Mortgage', 'Other'] as const;
export const INVESTMENT_TYPES = ['Stock', 'MF', 'FD', 'Gold', 'Crypto', 'Bond', 'Other'] as const;
export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export const currentMonth = (offset = 0): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const fmtINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const fmtINRSigned = (n: number) => `${n >= 0 ? '+' : '-'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

// Safe arithmetic-only calculator: supports + - * / parentheses and decimals.
// Returns null if expression is invalid or unsafe.
export const safeCalc = (expr: string): number | null => {
  if (!expr) return null;
  // Only digits, whitespace, decimal points, parens, basic operators.
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return null;
  try {
    const v = Function(`"use strict";return (${expr});`)();
    if (typeof v !== 'number' || !isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
};

export const parseAmount = (input: string): number | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Plain number first.
  const plain = parseFloat(trimmed);
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return plain;
  // Otherwise try calculator.
  return safeCalc(trimmed);
};

export const txTypeOptions: TxType[] = ['Expense', 'Income'];

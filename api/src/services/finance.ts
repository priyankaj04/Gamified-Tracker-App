import { supabase } from './supabase';
import { awardXp, checkBadges } from './gamification';
import { XP } from '@/lib/xp';
import { monthRange, todayISO, yyyymm } from '@/lib/date';
import type { TxType } from '@/types';

const txFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  amount: Number(r.amount),
  type: r.type as TxType,
  category: r.category,
  description: r.description,
  xpEarned: r.xp_earned,
});

export const listTransactions = async (params: { month?: string; category?: string; type?: string; page?: number; limit?: number }) => {
  const sb = supabase();
  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb.from('transactions').select('*', { count: 'exact' }).order('date', { ascending: false }).range(offset, offset + limit - 1);
  if (params.month) {
    const { from, to } = monthRange(params.month);
    q = q.gte('date', from).lte('date', to);
  }
  if (params.category) q = q.eq('category', params.category);
  if (params.type) q = q.eq('type', params.type);
  const { data, error } = await q;
  if (error) throw error;
  return { transactions: (data ?? []).map(txFromRow) };
};

interface TxBody {
  date?: string;
  amount: number;
  type: TxType;
  category: string;
  description?: string;
}

export const createTransaction = async (body: TxBody) => {
  const sb = supabase();
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.LOG_TRANSACTION,
    module: 'vault',
    source: 'transaction',
  });
  const { data, error } = await sb
    .from('transactions')
    .insert({
      date: body.date ?? todayISO(),
      amount: body.amount,
      type: body.type,
      category: body.category,
      description: body.description ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;
  const { count } = await sb.from('transactions').select('id', { count: 'exact', head: true });
  const badges = await checkBadges({ transactionCount: count ?? 0 });
  return { transaction: txFromRow(data), xpEarned, newTotalXp, badgesUnlocked: badges };
};

export const updateTransaction = async (id: string, body: Partial<TxBody>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.amount !== undefined) update.amount = body.amount;
  if (body.type !== undefined) update.type = body.type;
  if (body.category !== undefined) update.category = body.category;
  if (body.description !== undefined) update.description = body.description;
  if (body.date !== undefined) update.date = body.date;
  const { data, error } = await sb.from('transactions').update(update).eq('id', id).select().single();
  if (error) throw error;
  return txFromRow(data);
};

export const deleteTransaction = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

export const getBudgetSummary = async (month: string) => {
  const sb = supabase();
  const { data: budget } = await sb.from('monthly_budgets').select('*').eq('month', month).maybeSingle();
  const { from, to } = monthRange(month);
  const { data: txs } = await sb
    .from('transactions')
    .select('*')
    .gte('date', from)
    .lte('date', to);
  let totalExpenses = 0;
  let totalIncome = 0;
  const byCategory: Record<string, number> = {};
  (txs ?? []).forEach((t: any) => {
    if (t.type === 'Expense') {
      totalExpenses += Number(t.amount);
      byCategory[t.category] = (byCategory[t.category] ?? 0) + Number(t.amount);
    } else {
      totalIncome += Number(t.amount);
    }
  });
  return {
    budget: budget
      ? {
          month: budget.month,
          income: Number(budget.income),
          savingsTarget: Number(budget.savings_target),
          categoryBudgets: budget.category_budgets ?? {},
        }
      : {
          month,
          income: 0,
          savingsTarget: 0,
          categoryBudgets: {},
        },
    actual: {
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      byCategory,
    },
  };
};

interface BudgetBody {
  income?: number;
  savingsTarget?: number;
  categoryBudgets?: Record<string, number>;
}

export const upsertBudget = async (month: string, body: BudgetBody) => {
  const sb = supabase();
  const { data: existing } = await sb.from('monthly_budgets').select('*').eq('month', month).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('monthly_budgets')
      .update({
        income: body.income ?? existing.income,
        savings_target: body.savingsTarget ?? existing.savings_target,
        category_budgets: body.categoryBudgets ?? existing.category_budgets,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return {
      month: data.month,
      income: Number(data.income),
      savingsTarget: Number(data.savings_target),
      categoryBudgets: data.category_budgets ?? {},
    };
  }
  const { data, error } = await sb
    .from('monthly_budgets')
    .insert({
      month,
      income: body.income ?? 0,
      savings_target: body.savingsTarget ?? 0,
      category_budgets: body.categoryBudgets ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return {
    month: data.month,
    income: Number(data.income),
    savingsTarget: Number(data.savings_target),
    categoryBudgets: data.category_budgets ?? {},
  };
};

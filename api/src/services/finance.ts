import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP, vaultTitleFor } from '@/lib/xp';
import { monthRange, todayISO, previousISO } from '@/lib/date';
import type { TxType } from '@/types';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const txFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  amount: Number(r.amount),
  type: r.type as TxType,
  category: r.category,
  description: r.description,
  accountId: r.account_id ?? null,
  recurringId: r.recurring_id ?? null,
  merchant: r.merchant ?? null,
  receiptUrl: r.receipt_url ?? null,
  currency: r.currency ?? 'INR',
  loggedAt: r.logged_at ?? r.created_at ?? null,
  xpEarned: r.xp_earned,
});

const accountFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  openingBalance: Number(r.opening_balance),
  currency: r.currency,
  color: r.color,
  icon: r.icon ?? null,
  includeInNetWorth: r.include_in_net_worth,
  archived: r.archived,
  createdAt: r.created_at,
});

const goalFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  targetAmount: Number(r.target_amount),
  currentAmount: Number(r.current_amount),
  deadline: r.deadline,
  color: r.color,
  completed: r.completed,
  completedAt: r.completed_at,
  archived: r.archived,
  createdAt: r.created_at,
});

const debtFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  principal: Number(r.principal),
  balance: Number(r.balance),
  interestRate: r.interest_rate != null ? Number(r.interest_rate) : null,
  emi: r.emi != null ? Number(r.emi) : null,
  startDate: r.start_date,
  endDate: r.end_date,
  dueDay: r.due_day,
  cleared: r.cleared,
  clearedAt: r.cleared_at,
  createdAt: r.created_at,
});

const investmentFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  symbol: r.symbol,
  quantity: Number(r.quantity),
  costBasis: Number(r.cost_basis),
  currentValue: Number(r.current_value),
  firstBoughtOn: r.first_bought_on,
  platform: r.platform,
  notes: r.notes,
  archived: r.archived,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const recurringFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  amount: Number(r.amount),
  type: r.type as TxType,
  category: r.category,
  frequency: r.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: r.interval,
  nextDue: r.next_due,
  startDate: r.start_date,
  endDate: r.end_date,
  accountId: r.account_id,
  description: r.description,
  isSubscription: r.is_subscription,
  cancelled: r.cancelled,
  cancelledAt: r.cancelled_at,
  paused: r.paused,
  createdAt: r.created_at,
});

const tagFromRow = (r: any) => ({ id: r.id, name: r.name, color: r.color });

const snapshotFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  assets: Number(r.assets),
  liabilities: Number(r.liabilities),
  netWorth: Number(r.net_worth),
  notes: r.notes,
  createdAt: r.created_at,
});

const challengeFromRow = (r: any) => ({
  id: r.id,
  key: r.key,
  title: r.title,
  description: r.description,
  period: r.period as 'weekly' | 'monthly' | 'oneshot',
  target: r.target,
  progress: r.progress,
  xpReward: r.xp_reward,
  completed: r.completed,
  completedAt: r.completed_at,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
});

const templateFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  amount: Number(r.amount),
  type: r.type as TxType,
  category: r.category,
  description: r.description,
  emoji: r.emoji,
  useCount: r.use_count,
});

const ensureSettings = async () => {
  const sb = supabase();
  const { data } = await sb.from('vault_settings').select('*').limit(1).maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await sb.from('vault_settings').insert({}).select().single();
  if (error) throw error;
  return inserted;
};

// ─────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────

export const listTransactions = async (params: {
  month?: string;
  category?: string;
  type?: string;
  accountId?: string;
  tagId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) => {
  const sb = supabase();
  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (params.month) {
    const { from, to } = monthRange(params.month);
    q = q.gte('date', from).lte('date', to);
  }
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  if (params.category) q = q.eq('category', params.category);
  if (params.type) q = q.eq('type', params.type);
  if (params.accountId) q = q.eq('account_id', params.accountId);
  if (params.search) q = q.ilike('description', `%${params.search}%`);
  const { data, error, count } = await q;
  if (error) throw error;

  let txs = (data ?? []).map(txFromRow);
  // Attach tags if any.
  if (txs.length) {
    const ids = txs.map((t) => t.id);
    const { data: links } = await sb
      .from('transaction_tags')
      .select('transaction_id, tag_id, vault_tags(name, color, id)')
      .in('transaction_id', ids);
    const map: Record<string, { id: string; name: string; color: string }[]> = {};
    (links ?? []).forEach((l: any) => {
      const tag = Array.isArray(l.vault_tags) ? l.vault_tags[0] : l.vault_tags;
      if (!tag) return;
      (map[l.transaction_id] ||= []).push({ id: tag.id, name: tag.name, color: tag.color });
    });
    txs = txs.map((t) => ({ ...t, tags: map[t.id] ?? [] }));
  }

  if (params.tagId) {
    txs = txs.filter((t: any) => (t.tags ?? []).some((tag: any) => tag.id === params.tagId));
  }

  return { transactions: txs, total: count ?? txs.length };
};

interface TxBody {
  date?: string;
  amount: number;
  type: TxType;
  category: string;
  description?: string;
  accountId?: string | null;
  merchant?: string | null;
  receiptUrl?: string | null;
  recurringId?: string | null;
  currency?: string;
  tagIds?: string[];
  roundUp?: boolean;
}

const computeVaultContext = async (): Promise<any> => {
  const sb = supabase();
  const [{ count: txCount }, { data: txs }, { data: vaultStreak }, { data: tags },
         { data: receipts }, { data: budgets }, { data: goals }, { data: recurring },
         { data: investmentTxns }, { data: debts }, { data: settings }, { data: badgeRows },
         { data: snapshots }, { data: contributions }] = await Promise.all([
    sb.from('transactions').select('id', { count: 'exact', head: true }),
    sb.from('transactions').select('id,type,amount,category,description,date,merchant,recurring_id'),
    sb.from('streaks').select('*').eq('module', 'vault').maybeSingle(),
    sb.from('transaction_tags').select('transaction_id'),
    sb.from('transactions').select('id').not('receipt_url', 'is', null),
    sb.from('monthly_budgets').select('*'),
    sb.from('savings_goals').select('*'),
    sb.from('recurring_transactions').select('*'),
    sb.from('investment_transactions').select('*'),
    sb.from('debts').select('*'),
    sb.from('vault_settings').select('*').maybeSingle(),
    sb.from('user_badges').select('badge_id'),
    sb.from('net_worth_snapshots').select('*').order('date', { ascending: false }).limit(1),
    sb.from('savings_contributions').select('*'),
  ]);

  const allTxs = txs ?? [];
  const expense = allTxs.filter((t: any) => t.type === 'Expense');
  const uniqueCategories = new Set(expense.map((t: any) => t.category)).size;
  const descriptionCount = allTxs.filter((t: any) => t.description && t.description.trim()).length;
  const taggedTxCount = new Set((tags ?? []).map((t: any) => t.transaction_id)).size;
  const receiptCount = (receipts ?? []).length;
  const activeRecurring = (recurring ?? []).filter((r: any) => !r.cancelled);
  const activeSubs = activeRecurring.filter((r: any) => r.is_subscription && !r.cancelled);
  const investmentTxnCount = (investmentTxns ?? []).length;
  const debtsCleared = (debts ?? []).filter((d: any) => d.cleared).length;
  const cumulativeDebtPaid = (debts ?? []).reduce((s: number, d: any) => s + (Number(d.principal) - Number(d.balance)), 0);
  const totalDebt = (debts ?? []).reduce((s: number, d: any) => s + Number(d.balance), 0);

  // Zero-spend days (days with no expense in last 60 days).
  const today = new Date(todayISO() + 'T00:00:00Z');
  const sixty = new Date(today);
  sixty.setUTCDate(today.getUTCDate() - 60);
  const expenseDates = new Set(expense.filter((t: any) => new Date(t.date + 'T00:00:00Z') >= sixty).map((t: any) => t.date));
  let zeroSpendDays = 0;
  for (let d = new Date(sixty); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().split('T')[0];
    if (!expenseDates.has(iso)) zeroSpendDays += 1;
  }

  // Discretionary categories (Food/Entertainment/Shopping). Count streak days.
  const DISCRETIONARY = new Set(['Food', 'Entertainment', 'Shopping']);
  let noDiscretionaryStreakDays = 0;
  for (let d = new Date(today); d >= sixty; d.setUTCDate(d.getUTCDate() - 1)) {
    const iso = d.toISOString().split('T')[0];
    const spent = expense.some((t: any) => t.date === iso && DISCRETIONARY.has(t.category));
    if (spent) break;
    noDiscretionaryStreakDays += 1;
  }

  // Spartan no-dining streak (Food category).
  let spartanNoDiningStreak = 0;
  for (let d = new Date(today); d >= sixty; d.setUTCDate(d.getUTCDate() - 1)) {
    const iso = d.toISOString().split('T')[0];
    const spent = expense.some((t: any) => t.date === iso && t.category === 'Food');
    if (spent) break;
    spartanNoDiningStreak += 1;
  }

  // Months where savings target was hit.
  let savingsTargetMonthsHit = 0;
  const monthMap: Record<string, { income: number; expense: number }> = {};
  allTxs.forEach((t: any) => {
    const m = t.date.slice(0, 7);
    monthMap[m] ||= { income: 0, expense: 0 };
    if (t.type === 'Income') monthMap[m].income += Number(t.amount);
    else monthMap[m].expense += Number(t.amount);
  });
  let budgetUnderConsecutiveMonths = 0;
  let highSavingsRateMonthsConsecutive = 0;
  let runUnder = 0, runHigh = 0;
  const monthsSorted = Object.keys(monthMap).sort();
  for (const m of monthsSorted) {
    const b = (budgets ?? []).find((bg: any) => bg.month === m);
    const target = b ? Number(b.savings_target) : 0;
    const income = monthMap[m].income;
    const expense = monthMap[m].expense;
    const net = income - expense;
    if (target > 0 && net >= target) savingsTargetMonthsHit += 1;
    if (b && expense <= Number(b.income || 0)) runUnder += 1; else runUnder = 0;
    budgetUnderConsecutiveMonths = Math.max(budgetUnderConsecutiveMonths, runUnder);
    if (income > 0 && net / income >= 0.5) runHigh += 1; else runHigh = 0;
    highSavingsRateMonthsConsecutive = Math.max(highSavingsRateMonthsConsecutive, runHigh);
  }

  // Current month under budget?
  const curMonth = todayISO().slice(0, 7);
  const curBudget = (budgets ?? []).find((b: any) => b.month === curMonth);
  const curExpenses = monthMap[curMonth]?.expense ?? 0;
  const budgetUnder = !!(curBudget && Number(curBudget.income || 0) > 0 && curExpenses <= Number(curBudget.income || 0));
  const categoriesUnderBudgetInMonth = (() => {
    if (!curBudget) return 0;
    const cb = (curBudget.category_budgets ?? {}) as Record<string, number>;
    const byCat: Record<string, number> = {};
    expense.filter((t: any) => t.date.slice(0, 7) === curMonth).forEach((t: any) => {
      byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(cb).filter(([k, v]) => Number(v) > 0 && (byCat[k] ?? 0) <= Number(v)).length;
  })();

  const totalSaved = (goals ?? []).reduce((s: number, g: any) => s + Number(g.current_amount), 0);
  const SALARY_CATS = new Set(['Salary']);
  const nonSalaryIncomeTotal = allTxs
    .filter((t: any) => t.type === 'Income' && !SALARY_CATS.has(t.category))
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const uniqueIncomeStreams = new Set(allTxs.filter((t: any) => t.type === 'Income').map((t: any) => t.category)).size;

  const roundUpRows = (contributions ?? []).filter((c: any) => c.source === 'round_up');
  const roundUpCount = roundUpRows.length;
  const roundUpSavedTotal = roundUpRows.reduce((s: number, c: any) => s + Number(c.amount), 0);

  // Long-hold investments (1+ year, with logs).
  const longHoldInvestmentCount = (await sb
    .from('investments')
    .select('id, first_bought_on')
    .lte('first_bought_on', new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().split('T')[0])
    .then((r) => r.data ?? [])).length;

  // Net worth
  const accountsTotal = (await sb.from('accounts').select('opening_balance, include_in_net_worth').then((r) => r.data ?? []))
    .filter((a: any) => a.include_in_net_worth)
    .reduce((s: number, a: any) => s + Number(a.opening_balance), 0);
  const investmentValue = (await sb.from('investments').select('current_value').then((r) => r.data ?? []))
    .reduce((s: number, i: any) => s + Number(i.current_value), 0);
  const netWorth = accountsTotal + investmentValue + totalSaved - totalDebt;

  // Debt-free consecutive months: months with zero debt balance ever existed.
  const debtFreeMonthsConsecutive = totalDebt === 0 ? 12 : 0; // heuristic — we don't track historical debt balances

  const unlockedVaultBadgeIds = (badgeRows ?? []).map((b: any) => b.badge_id);

  return {
    transactionCount: txCount ?? 0,
    vaultStreak: vaultStreak?.count ?? 0,
    uniqueVaultCategories: uniqueCategories,
    zeroSpendDays,
    receiptCount,
    budgetSetCount: (budgets ?? []).length,
    savingsGoalCount: (goals ?? []).length,
    descriptionCount,
    taggedTxCount,
    recurringCount: activeRecurring.length,
    activeSubscriptionsCount: activeSubs.length,
    calculatorUsed: !!settings?.calculator_used,
    roundUpCount,
    roundUpSavedTotal,
    noDiscretionaryStreakDays,
    savingsTargetMonthsHit,
    investmentTxnCount,
    debtsCleared,
    categoriesUnderBudgetInMonth,
    uniqueIncomeStreams,
    weeklyReportStreak: settings?.weekly_report_streak ?? 0,
    annualReportExported: !!settings?.annual_report_exported,
    spartanNoDiningStreak,
    netWorth,
    longHoldInvestmentCount,
    cumulativeDebtPaid,
    budgetUnderConsecutiveMonths,
    highSavingsRateMonthsConsecutive,
    nonSalaryIncomeTotal,
    totalDebt,
    debtFreeMonthsConsecutive,
    budgetUnder,
    totalSaved,
    unlockedVaultBadgeIds,
  };
};

const runVaultBadgeChecks = async () => checkBadges(await computeVaultContext());

export const createTransaction = async (body: TxBody) => {
  const sb = supabase();

  let base: number = body.type === 'Income' ? XP.LOG_INCOME : XP.LOG_TRANSACTION;
  if (body.receiptUrl) base += XP.TX_RECEIPT_BONUS;
  if (body.description) base += XP.TX_NOTE_BONUS;
  if (body.recurringId) base = XP.RECURRING_AUTO_CONFIRMED;

  const { xpEarned, newTotalXp } = await awardXp({
    base,
    module: 'vault',
    source: body.recurringId ? 'recurring' : 'transaction',
  });
  await updateStreak('vault');

  const { data, error } = await sb
    .from('transactions')
    .insert({
      date: body.date ?? todayISO(),
      amount: body.amount,
      type: body.type,
      category: body.category,
      description: body.description ?? null,
      account_id: body.accountId ?? null,
      recurring_id: body.recurringId ?? null,
      merchant: body.merchant ?? null,
      receipt_url: body.receiptUrl ?? null,
      currency: body.currency ?? 'INR',
      logged_at: new Date().toISOString(),
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;

  if (body.tagIds?.length) {
    await sb.from('transaction_tags').insert(body.tagIds.map((tagId) => ({ transaction_id: data.id, tag_id: tagId })));
  }

  // Round-up bonus → goal contribution.
  let roundUpResult: any = null;
  if (body.roundUp && body.type === 'Expense') {
    const settings = await ensureSettings();
    if (settings.round_up_enabled && settings.round_up_goal_id) {
      const step = Number(settings.round_up_to);
      const remainder = Number(body.amount) % step;
      const delta = remainder === 0 ? 0 : step - remainder;
      if (delta > 0) {
        await sb.from('savings_contributions').insert({
          goal_id: settings.round_up_goal_id,
          amount: delta,
          source: 'round_up',
          notes: `Round-up from ₹${body.amount}`,
        });
        const { data: goalRow } = await sb
          .from('savings_goals')
          .select('current_amount')
          .eq('id', settings.round_up_goal_id)
          .single();
        const newAmount = (Number(goalRow?.current_amount) || 0) + delta;
        await sb.from('savings_goals').update({ current_amount: newAmount }).eq('id', settings.round_up_goal_id);
        await awardXp({ base: XP.ROUND_UP_SAVED, module: 'vault', source: 'round_up' });
        roundUpResult = { goalId: settings.round_up_goal_id, amount: delta };
      }
    }
  }

  const badges = await runVaultBadgeChecks();
  await incrementChallengeProgress('log_transaction', 1);

  return { transaction: txFromRow(data), xpEarned, newTotalXp, badgesUnlocked: badges, roundUp: roundUpResult };
};

export const updateTransaction = async (id: string, body: Partial<TxBody>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.amount !== undefined) update.amount = body.amount;
  if (body.type !== undefined) update.type = body.type;
  if (body.category !== undefined) update.category = body.category;
  if (body.description !== undefined) update.description = body.description;
  if (body.date !== undefined) update.date = body.date;
  if (body.accountId !== undefined) update.account_id = body.accountId;
  if (body.merchant !== undefined) update.merchant = body.merchant;
  if (body.receiptUrl !== undefined) update.receipt_url = body.receiptUrl;
  if (body.currency !== undefined) update.currency = body.currency;
  const { data, error } = await sb.from('transactions').update(update).eq('id', id).select().single();
  if (error) throw error;

  if (body.tagIds !== undefined) {
    await sb.from('transaction_tags').delete().eq('transaction_id', id);
    if (body.tagIds.length) {
      await sb.from('transaction_tags').insert(body.tagIds.map((tagId) => ({ transaction_id: id, tag_id: tagId })));
    }
  }
  return txFromRow(data);
};

export const deleteTransaction = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────
// Budget
// ─────────────────────────────────────────────────────────────

export const getBudgetSummary = async (month: string) => {
  const sb = supabase();
  const { data: budget } = await sb.from('monthly_budgets').select('*').eq('month', month).maybeSingle();
  const { from, to } = monthRange(month);
  const { data: txs } = await sb.from('transactions').select('*').gte('date', from).lte('date', to);
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
  // Spend velocity: through today's date / days in month.
  const day = new Date().getDate();
  const lastDay = Number(to.split('-')[2]);
  const sameMonth = todayISO().startsWith(month);
  const velocity = sameMonth ? day / lastDay : 1;
  return {
    budget: budget
      ? {
          month: budget.month,
          income: Number(budget.income),
          savingsTarget: Number(budget.savings_target),
          categoryBudgets: budget.category_budgets ?? {},
        }
      : { month, income: 0, savingsTarget: 0, categoryBudgets: {} },
    actual: {
      totalExpenses,
      totalIncome,
      netSavings: totalIncome - totalExpenses,
      byCategory,
      spendVelocity: velocity,
      daysIntoMonth: sameMonth ? day : lastDay,
      daysInMonth: lastDay,
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

  let isNew = !existing;
  let res;
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
    res = data;
  } else {
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
    res = data;
  }

  let badgesUnlocked: any[] = [];
  let xpEarned = 0;
  if (isNew) {
    const award = await awardXp({ base: XP.BUDGET_CREATED, module: 'vault', source: 'budget_created' });
    xpEarned = award.xpEarned;
    badgesUnlocked = await runVaultBadgeChecks();
  }

  return {
    budget: {
      month: res.month,
      income: Number(res.income),
      savingsTarget: Number(res.savings_target),
      categoryBudgets: res.category_budgets ?? {},
    },
    xpEarned,
    badgesUnlocked,
  };
};

// ─────────────────────────────────────────────────────────────
// Accounts
// ─────────────────────────────────────────────────────────────

export const listAccounts = async () => {
  const sb = supabase();
  const { data: accs } = await sb.from('accounts').select('*').order('created_at', { ascending: true });
  const accounts = (accs ?? []).map(accountFromRow);
  // Compute current balance = opening + sum(income) - sum(expense) per account.
  if (accounts.length) {
    const ids = accounts.map((a) => a.id);
    const { data: txs } = await sb.from('transactions').select('account_id, type, amount').in('account_id', ids);
    const delta: Record<string, number> = {};
    (txs ?? []).forEach((t: any) => {
      delta[t.account_id] = (delta[t.account_id] ?? 0) + (t.type === 'Income' ? Number(t.amount) : -Number(t.amount));
    });
    return { accounts: accounts.map((a) => ({ ...a, balance: a.openingBalance + (delta[a.id] ?? 0) })) };
  }
  return { accounts: [] as ((typeof accounts)[number] & { balance: number })[] };
};

interface AccountBody {
  name: string;
  type: 'Cash' | 'Bank' | 'Credit Card' | 'UPI Wallet' | 'Investment' | 'Other';
  openingBalance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  includeInNetWorth?: boolean;
}

export const createAccount = async (body: AccountBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('accounts')
    .insert({
      name: body.name,
      type: body.type,
      opening_balance: body.openingBalance ?? 0,
      currency: body.currency ?? 'INR',
      color: body.color ?? '#fbbf24',
      icon: body.icon ?? null,
      include_in_net_worth: body.includeInNetWorth ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return accountFromRow(data);
};

export const updateAccount = async (id: string, body: Partial<AccountBody & { archived: boolean }>) => {
  const sb = supabase();
  const u: Record<string, any> = {};
  if (body.name !== undefined) u.name = body.name;
  if (body.type !== undefined) u.type = body.type;
  if (body.openingBalance !== undefined) u.opening_balance = body.openingBalance;
  if (body.currency !== undefined) u.currency = body.currency;
  if (body.color !== undefined) u.color = body.color;
  if (body.icon !== undefined) u.icon = body.icon;
  if (body.includeInNetWorth !== undefined) u.include_in_net_worth = body.includeInNetWorth;
  if (body.archived !== undefined) u.archived = body.archived;
  const { data, error } = await sb.from('accounts').update(u).eq('id', id).select().single();
  if (error) throw error;
  return accountFromRow(data);
};

export const deleteAccount = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('accounts').delete().eq('id', id);
  if (error) throw error;
};

export const transferBetweenAccounts = async (body: { fromId: string; toId: string; amount: number; date?: string; description?: string }) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const desc = body.description ?? 'Account transfer';
  await sb.from('transactions').insert([
    { date, amount: body.amount, type: 'Expense', category: 'Transfer', description: desc, account_id: body.fromId },
    { date, amount: body.amount, type: 'Income', category: 'Transfer', description: desc, account_id: body.toId },
  ]);
  return { ok: true };
};

// ─────────────────────────────────────────────────────────────
// Savings goals
// ─────────────────────────────────────────────────────────────

export const listGoals = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('savings_goals').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return { goals: (data ?? []).map(goalFromRow) };
};

interface GoalBody {
  name: string;
  emoji?: string;
  targetAmount: number;
  deadline?: string | null;
  color?: string;
}

export const createGoal = async (body: GoalBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('savings_goals')
    .insert({
      name: body.name,
      emoji: body.emoji ?? '🎯',
      target_amount: body.targetAmount,
      deadline: body.deadline ?? null,
      color: body.color ?? '#fbbf24',
    })
    .select()
    .single();
  if (error) throw error;
  const { xpEarned } = await awardXp({ base: XP.CREATE_SAVINGS_GOAL, module: 'vault', source: 'goal_created' });
  const badges = await runVaultBadgeChecks();
  return { goal: goalFromRow(data), xpEarned, badgesUnlocked: badges };
};

export const updateGoal = async (id: string, body: Partial<GoalBody & { archived: boolean }>) => {
  const sb = supabase();
  const u: Record<string, any> = {};
  if (body.name !== undefined) u.name = body.name;
  if (body.emoji !== undefined) u.emoji = body.emoji;
  if (body.targetAmount !== undefined) u.target_amount = body.targetAmount;
  if (body.deadline !== undefined) u.deadline = body.deadline;
  if (body.color !== undefined) u.color = body.color;
  if (body.archived !== undefined) u.archived = body.archived;
  const { data, error } = await sb.from('savings_goals').update(u).eq('id', id).select().single();
  if (error) throw error;
  return goalFromRow(data);
};

export const deleteGoal = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('savings_goals').delete().eq('id', id);
  if (error) throw error;
};

export const contributeToGoal = async (
  goalId: string,
  body: { amount: number; notes?: string; source?: string; date?: string },
) => {
  const sb = supabase();
  const { data: goal, error: gErr } = await sb.from('savings_goals').select('*').eq('id', goalId).single();
  if (gErr) throw gErr;
  await sb.from('savings_contributions').insert({
    goal_id: goalId,
    amount: body.amount,
    date: body.date ?? todayISO(),
    source: body.source ?? 'manual',
    notes: body.notes ?? null,
  });
  const newAmount = Number(goal.current_amount) + Number(body.amount);
  const hit = !goal.completed && newAmount >= Number(goal.target_amount);
  const beaten = !goal.completed && newAmount >= Number(goal.target_amount) * 1.1;
  await sb
    .from('savings_goals')
    .update({
      current_amount: newAmount,
      completed: hit || goal.completed,
      completed_at: hit ? new Date().toISOString() : goal.completed_at,
    })
    .eq('id', goalId);
  let totalXp = 0;
  const a1 = await awardXp({ base: XP.GOAL_CONTRIBUTION, module: 'vault', source: 'goal_contribution' });
  totalXp += a1.xpEarned;
  if (hit) {
    const a2 = await awardXp({ base: XP.HIT_SAVINGS_GOAL, module: 'vault', source: 'goal_hit' });
    totalXp += a2.xpEarned;
  }
  if (beaten) {
    const a3 = await awardXp({ base: XP.SAVINGS_GOAL_BEATEN, module: 'vault', source: 'goal_beaten' });
    totalXp += a3.xpEarned;
  }
  const badges = await runVaultBadgeChecks();
  return { xpEarned: totalXp, badgesUnlocked: badges, hit, beaten };
};

// ─────────────────────────────────────────────────────────────
// Debts
// ─────────────────────────────────────────────────────────────

export const listDebts = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('debts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return { debts: (data ?? []).map(debtFromRow) };
};

interface DebtBody {
  name: string;
  type: string;
  principal: number;
  balance?: number;
  interestRate?: number;
  emi?: number;
  startDate?: string;
  endDate?: string;
  dueDay?: number;
}

export const createDebt = async (body: DebtBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('debts')
    .insert({
      name: body.name,
      type: body.type,
      principal: body.principal,
      balance: body.balance ?? body.principal,
      interest_rate: body.interestRate ?? null,
      emi: body.emi ?? null,
      start_date: body.startDate ?? null,
      end_date: body.endDate ?? null,
      due_day: body.dueDay ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return debtFromRow(data);
};

export const updateDebt = async (id: string, body: Partial<DebtBody>) => {
  const sb = supabase();
  const u: Record<string, any> = {};
  if (body.name !== undefined) u.name = body.name;
  if (body.type !== undefined) u.type = body.type;
  if (body.principal !== undefined) u.principal = body.principal;
  if (body.balance !== undefined) u.balance = body.balance;
  if (body.interestRate !== undefined) u.interest_rate = body.interestRate;
  if (body.emi !== undefined) u.emi = body.emi;
  if (body.startDate !== undefined) u.start_date = body.startDate;
  if (body.endDate !== undefined) u.end_date = body.endDate;
  if (body.dueDay !== undefined) u.due_day = body.dueDay;
  const { data, error } = await sb.from('debts').update(u).eq('id', id).select().single();
  if (error) throw error;
  return debtFromRow(data);
};

export const deleteDebt = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('debts').delete().eq('id', id);
  if (error) throw error;
};

export const payDebt = async (debtId: string, body: { amount: number; date?: string; notes?: string }) => {
  const sb = supabase();
  const { data: debt, error: dErr } = await sb.from('debts').select('*').eq('id', debtId).single();
  if (dErr) throw dErr;
  await sb.from('debt_payments').insert({
    debt_id: debtId,
    amount: body.amount,
    date: body.date ?? todayISO(),
    notes: body.notes ?? null,
  });
  const newBalance = Math.max(0, Number(debt.balance) - Number(body.amount));
  const cleared = newBalance === 0 && !debt.cleared;
  await sb
    .from('debts')
    .update({
      balance: newBalance,
      cleared: cleared || debt.cleared,
      cleared_at: cleared ? new Date().toISOString() : debt.cleared_at,
    })
    .eq('id', debtId);
  let xp = 0;
  const a1 = await awardXp({ base: XP.DEBT_PAYMENT, module: 'vault', source: 'debt_payment' });
  xp += a1.xpEarned;
  if (cleared) {
    const a2 = await awardXp({ base: XP.DEBT_CLEARED, module: 'vault', source: 'debt_cleared' });
    xp += a2.xpEarned;
  }
  const badges = await runVaultBadgeChecks();
  return { xpEarned: xp, badgesUnlocked: badges, cleared, balance: newBalance };
};

// ─────────────────────────────────────────────────────────────
// Investments
// ─────────────────────────────────────────────────────────────

export const listInvestments = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('investments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return { investments: (data ?? []).map(investmentFromRow) };
};

interface InvestmentBody {
  name: string;
  type: string;
  symbol?: string;
  quantity?: number;
  costBasis?: number;
  currentValue?: number;
  firstBoughtOn?: string;
  platform?: string;
  notes?: string;
}

export const createInvestment = async (body: InvestmentBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('investments')
    .insert({
      name: body.name,
      type: body.type,
      symbol: body.symbol ?? null,
      quantity: body.quantity ?? 0,
      cost_basis: body.costBasis ?? 0,
      current_value: body.currentValue ?? body.costBasis ?? 0,
      first_bought_on: body.firstBoughtOn ?? null,
      platform: body.platform ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return investmentFromRow(data);
};

export const updateInvestment = async (id: string, body: Partial<InvestmentBody & { archived: boolean }>) => {
  const sb = supabase();
  const u: Record<string, any> = {};
  if (body.name !== undefined) u.name = body.name;
  if (body.type !== undefined) u.type = body.type;
  if (body.symbol !== undefined) u.symbol = body.symbol;
  if (body.quantity !== undefined) u.quantity = body.quantity;
  if (body.costBasis !== undefined) u.cost_basis = body.costBasis;
  if (body.currentValue !== undefined) u.current_value = body.currentValue;
  if (body.firstBoughtOn !== undefined) u.first_bought_on = body.firstBoughtOn;
  if (body.platform !== undefined) u.platform = body.platform;
  if (body.notes !== undefined) u.notes = body.notes;
  if (body.archived !== undefined) u.archived = body.archived;
  u.updated_at = new Date().toISOString();
  const { data, error } = await sb.from('investments').update(u).eq('id', id).select().single();
  if (error) throw error;
  return investmentFromRow(data);
};

export const deleteInvestment = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('investments').delete().eq('id', id);
  if (error) throw error;
};

export const logInvestmentTxn = async (
  investmentId: string,
  body: { action: 'Buy' | 'Sell' | 'SIP' | 'Dividend' | 'Interest'; quantity?: number; amount: number; date?: string; notes?: string },
) => {
  const sb = supabase();
  const { data: inv, error: iErr } = await sb.from('investments').select('*').eq('id', investmentId).single();
  if (iErr) throw iErr;
  await sb.from('investment_transactions').insert({
    investment_id: investmentId,
    action: body.action,
    quantity: body.quantity ?? null,
    amount: body.amount,
    date: body.date ?? todayISO(),
    notes: body.notes ?? null,
  });
  const update: Record<string, any> = {};
  if (body.action === 'Buy' || body.action === 'SIP') {
    update.quantity = Number(inv.quantity) + (body.quantity ?? 0);
    update.cost_basis = Number(inv.cost_basis) + Number(body.amount);
    update.current_value = Number(inv.current_value) + Number(body.amount);
    if (!inv.first_bought_on) update.first_bought_on = body.date ?? todayISO();
  }
  if (body.action === 'Sell') {
    update.quantity = Math.max(0, Number(inv.quantity) - (body.quantity ?? 0));
    update.current_value = Math.max(0, Number(inv.current_value) - Number(body.amount));
  }
  if (Object.keys(update).length) {
    update.updated_at = new Date().toISOString();
    await sb.from('investments').update(update).eq('id', investmentId);
  }
  const base = body.action === 'SIP' ? XP.LOG_SIP_CONTRIBUTION : XP.LOG_INVESTMENT;
  const { xpEarned } = await awardXp({ base, module: 'vault', source: `inv_${body.action.toLowerCase()}` });
  // Milestone XP if total portfolio crosses thresholds.
  const { data: allInv } = await sb.from('investments').select('current_value');
  const portfolio = (allInv ?? []).reduce((s: number, i: any) => s + Number(i.current_value), 0);
  const milestones = [10000, 50000, 100000, 500000];
  let bonus = 0;
  for (const m of milestones) {
    if (portfolio >= m && portfolio - Number(body.amount) < m) {
      const r = await awardXp({ base: XP.INVESTMENT_MILESTONE, module: 'vault', source: `inv_milestone_${m}` });
      bonus += r.xpEarned;
    }
  }
  const badges = await runVaultBadgeChecks();
  return { xpEarned: xpEarned + bonus, badgesUnlocked: badges, portfolio };
};

// ─────────────────────────────────────────────────────────────
// Recurring
// ─────────────────────────────────────────────────────────────

const addInterval = (iso: string, freq: 'daily' | 'weekly' | 'monthly' | 'yearly', interval: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  if (freq === 'daily') d.setUTCDate(d.getUTCDate() + interval);
  if (freq === 'weekly') d.setUTCDate(d.getUTCDate() + 7 * interval);
  if (freq === 'monthly') d.setUTCMonth(d.getUTCMonth() + interval);
  if (freq === 'yearly') d.setUTCFullYear(d.getUTCFullYear() + interval);
  return d.toISOString().split('T')[0];
};

export const listRecurring = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('recurring_transactions').select('*').order('next_due', { ascending: true });
  if (error) throw error;
  return { recurring: (data ?? []).map(recurringFromRow) };
};

interface RecurringBody {
  name: string;
  amount: number;
  type: TxType;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  startDate?: string;
  endDate?: string | null;
  nextDue?: string;
  accountId?: string | null;
  description?: string | null;
  isSubscription?: boolean;
}

export const createRecurring = async (body: RecurringBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('recurring_transactions')
    .insert({
      name: body.name,
      amount: body.amount,
      type: body.type,
      category: body.category,
      frequency: body.frequency,
      interval: body.interval ?? 1,
      start_date: body.startDate ?? todayISO(),
      end_date: body.endDate ?? null,
      next_due: body.nextDue ?? body.startDate ?? todayISO(),
      account_id: body.accountId ?? null,
      description: body.description ?? null,
      is_subscription: body.isSubscription ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  const badges = await runVaultBadgeChecks();
  return { recurring: recurringFromRow(data), badgesUnlocked: badges };
};

export const updateRecurring = async (id: string, body: Partial<RecurringBody & { paused: boolean }>) => {
  const sb = supabase();
  const u: Record<string, any> = {};
  if (body.name !== undefined) u.name = body.name;
  if (body.amount !== undefined) u.amount = body.amount;
  if (body.type !== undefined) u.type = body.type;
  if (body.category !== undefined) u.category = body.category;
  if (body.frequency !== undefined) u.frequency = body.frequency;
  if (body.interval !== undefined) u.interval = body.interval;
  if (body.startDate !== undefined) u.start_date = body.startDate;
  if (body.endDate !== undefined) u.end_date = body.endDate;
  if (body.nextDue !== undefined) u.next_due = body.nextDue;
  if (body.accountId !== undefined) u.account_id = body.accountId;
  if (body.description !== undefined) u.description = body.description;
  if (body.isSubscription !== undefined) u.is_subscription = body.isSubscription;
  if (body.paused !== undefined) u.paused = body.paused;
  const { data, error } = await sb.from('recurring_transactions').update(u).eq('id', id).select().single();
  if (error) throw error;
  return recurringFromRow(data);
};

export const cancelRecurring = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('recurring_transactions')
    .update({ cancelled: true, cancelled_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  const { xpEarned } = await awardXp({ base: XP.SUBSCRIPTION_CANCELLED, module: 'vault', source: 'subscription_cancelled' });
  const badges = await runVaultBadgeChecks();
  return { recurring: recurringFromRow(data), xpEarned, badgesUnlocked: badges };
};

export const deleteRecurring = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('recurring_transactions').delete().eq('id', id);
  if (error) throw error;
};

export const deleteChallenge = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('vault_challenges').delete().eq('id', id);
  if (error) throw error;
};

export const confirmRecurringDue = async (id: string, opts?: { date?: string }) => {
  const sb = supabase();
  const { data: rec, error: rErr } = await sb.from('recurring_transactions').select('*').eq('id', id).single();
  if (rErr) throw rErr;
  const dueDate = opts?.date ?? rec.next_due;
  const tx = await createTransaction({
    date: dueDate,
    amount: Number(rec.amount),
    type: rec.type,
    category: rec.category,
    description: rec.description ?? rec.name,
    accountId: rec.account_id ?? null,
    recurringId: rec.id,
  });
  const next = addInterval(dueDate, rec.frequency, rec.interval ?? 1);
  await sb.from('recurring_transactions').update({ next_due: next }).eq('id', rec.id);
  // Bill paid on time if dueDate <= rec.next_due.
  let onTime = 0;
  if (new Date(dueDate) <= new Date(rec.next_due)) {
    const r = await awardXp({ base: XP.BILL_PAID_ON_TIME, module: 'vault', source: 'bill_on_time' });
    onTime = r.xpEarned;
  }
  return { ...tx, billOnTimeBonus: onTime, nextDue: next };
};

export const processDueRecurring = async () => {
  const sb = supabase();
  const today = todayISO();
  const { data } = await sb
    .from('recurring_transactions')
    .select('*')
    .lte('next_due', today)
    .eq('cancelled', false)
    .eq('paused', false);
  let created = 0;
  for (const r of data ?? []) {
    await confirmRecurringDue(r.id);
    created += 1;
  }
  return { created };
};

// ─────────────────────────────────────────────────────────────
// Tags
// ─────────────────────────────────────────────────────────────

export const listTags = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('vault_tags').select('*').order('name');
  if (error) throw error;
  return { tags: (data ?? []).map(tagFromRow) };
};

export const createTag = async (body: { name: string; color?: string }) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('vault_tags')
    .insert({ name: body.name, color: body.color ?? '#fbbf24' })
    .select()
    .single();
  if (error) throw error;
  return tagFromRow(data);
};

export const deleteTag = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('vault_tags').delete().eq('id', id);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────
// Net worth snapshots
// ─────────────────────────────────────────────────────────────

export const listNetWorthSnapshots = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('net_worth_snapshots').select('*').order('date', { ascending: true });
  if (error) throw error;
  return { snapshots: (data ?? []).map(snapshotFromRow) };
};

export const createNetWorthSnapshot = async (body?: { date?: string; assets?: number; liabilities?: number; notes?: string }) => {
  const sb = supabase();
  let { assets, liabilities } = body ?? {};
  if (assets == null || liabilities == null) {
    const [{ data: accs }, { data: invs }, { data: gls }, { data: debts }] = await Promise.all([
      sb.from('accounts').select('opening_balance, include_in_net_worth, id'),
      sb.from('investments').select('current_value'),
      sb.from('savings_goals').select('current_amount'),
      sb.from('debts').select('balance'),
    ]);
    const accIds = (accs ?? []).filter((a: any) => a.include_in_net_worth).map((a: any) => a.id);
    const { data: txs } = accIds.length
      ? await sb.from('transactions').select('account_id, type, amount').in('account_id', accIds)
      : { data: [] as any[] };
    const delta: Record<string, number> = {};
    (txs ?? []).forEach((t: any) => {
      delta[t.account_id] = (delta[t.account_id] ?? 0) + (t.type === 'Income' ? Number(t.amount) : -Number(t.amount));
    });
    const accSum = (accs ?? [])
      .filter((a: any) => a.include_in_net_worth)
      .reduce((s: number, a: any) => s + Number(a.opening_balance) + (delta[a.id] ?? 0), 0);
    const invSum = (invs ?? []).reduce((s: number, i: any) => s + Number(i.current_value), 0);
    const goalSum = (gls ?? []).reduce((s: number, g: any) => s + Number(g.current_amount), 0);
    const debtSum = (debts ?? []).reduce((s: number, d: any) => s + Number(d.balance), 0);
    assets = accSum + invSum + goalSum;
    liabilities = debtSum;
  }
  const net = (assets ?? 0) - (liabilities ?? 0);
  const date = body?.date ?? todayISO();
  const { data: existing } = await sb.from('net_worth_snapshots').select('*').eq('date', date).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('net_worth_snapshots')
      .update({ assets, liabilities, net_worth: net, notes: body?.notes ?? null })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { snapshot: snapshotFromRow(data), xpEarned: 0 };
  }
  const { data, error } = await sb
    .from('net_worth_snapshots')
    .insert({ date, assets, liabilities, net_worth: net, notes: body?.notes ?? null })
    .select()
    .single();
  if (error) throw error;
  // Only award the monthly snapshot XP once per calendar month.
  const month = date.slice(0, 7);
  const { count } = await sb
    .from('net_worth_snapshots')
    .select('id', { count: 'exact', head: true })
    .gte('date', month + '-01')
    .lte('date', month + '-31');
  let xp = 0;
  if ((count ?? 0) === 1) {
    const r = await awardXp({ base: XP.NET_WORTH_SNAPSHOT, module: 'vault', source: 'net_worth_snapshot' });
    xp = r.xpEarned;
  }
  // Milestones
  const milestones = [100000, 500000, 1000000, 10000000];
  for (const m of milestones) {
    const wasUnder = (await sb.from('net_worth_snapshots').select('net_worth').lt('net_worth', m).order('date', { ascending: false }).limit(1)).data ?? [];
    if (net >= m && wasUnder.length) {
      const r = await awardXp({ base: XP.NET_WORTH_MILESTONE, module: 'vault', source: `nw_milestone_${m}` });
      xp += r.xpEarned;
    }
  }
  await runVaultBadgeChecks();
  return { snapshot: snapshotFromRow(data), xpEarned: xp };
};

// ─────────────────────────────────────────────────────────────
// Challenges
// ─────────────────────────────────────────────────────────────

const WEEKLY_POOL: Omit<ReturnType<typeof challengeFromRow>, 'id' | 'progress' | 'completed' | 'completedAt' | 'startsOn' | 'endsOn'>[] = [
  { key: 'no_spend_weekend', title: 'No-Spend Weekend', description: 'Zero discretionary spend Sat & Sun', period: 'weekly', target: 1, xpReward: XP.CHALLENGE_COMPLETED_MEDIUM },
  { key: 'track_every_rupee', title: 'Track Every Rupee', description: 'Log a transaction every day this week', period: 'weekly', target: 7, xpReward: XP.CHALLENGE_COMPLETED_MEDIUM },
  { key: 'cooking_week', title: 'Cooking Week', description: 'No restaurant spending for 7 days', period: 'weekly', target: 7, xpReward: XP.CHALLENGE_COMPLETED_LARGE },
  { key: 'bargain_hunter', title: 'Bargain Hunter', description: 'Tag 5 purchases as deal', period: 'weekly', target: 5, xpReward: XP.CHALLENGE_COMPLETED_SMALL },
  { key: 'side_hustle_sprint', title: 'Side Hustle Sprint', description: 'Log ₹5,000+ in non-salary income', period: 'weekly', target: 5000, xpReward: XP.CHALLENGE_COMPLETED_LARGE },
];

const MONTHLY_POOL = [
  { key: 'beat_last_month', title: 'Beat Last Month', description: 'Save more than you did last month', period: 'monthly' as const, target: 1, xpReward: XP.CHALLENGE_COMPLETED_LARGE },
  { key: 'full_categorization', title: 'Full Categorization', description: 'No "Other" category this month', period: 'monthly' as const, target: 1, xpReward: XP.CHALLENGE_COMPLETED_SMALL },
  { key: 'receipt_champion', title: 'Receipt Champion', description: 'Attach 20 receipts this month', period: 'monthly' as const, target: 20, xpReward: XP.CHALLENGE_COMPLETED_MEDIUM },
];

const weekRange = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z');
  const day = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { startsOn: monday.toISOString().split('T')[0], endsOn: sunday.toISOString().split('T')[0] };
};

const monthRangeISO = (iso: string) => {
  const m = iso.slice(0, 7);
  const r = monthRange(m);
  return { startsOn: r.from, endsOn: r.to };
};

export const ensureActiveChallenges = async () => {
  const sb = supabase();
  const today = todayISO();
  const w = weekRange(today);
  const m = monthRangeISO(today);
  const { data: existing } = await sb.from('vault_challenges').select('*').gte('ends_on', today);
  const have = new Set((existing ?? []).map((c: any) => `${c.key}:${c.starts_on}`));
  const weekKey = WEEKLY_POOL[Math.floor(Date.now() / (7 * 24 * 3600 * 1000)) % WEEKLY_POOL.length];
  if (!have.has(`${weekKey.key}:${w.startsOn}`)) {
    await sb.from('vault_challenges').insert({
      key: weekKey.key,
      title: weekKey.title,
      description: weekKey.description,
      period: 'weekly',
      target: weekKey.target,
      progress: 0,
      xp_reward: weekKey.xpReward,
      starts_on: w.startsOn,
      ends_on: w.endsOn,
    });
  }
  const monthKey = MONTHLY_POOL[new Date().getUTCMonth() % MONTHLY_POOL.length];
  if (!have.has(`${monthKey.key}:${m.startsOn}`)) {
    await sb.from('vault_challenges').insert({
      key: monthKey.key,
      title: monthKey.title,
      description: monthKey.description,
      period: 'monthly',
      target: monthKey.target,
      progress: 0,
      xp_reward: monthKey.xpReward,
      starts_on: m.startsOn,
      ends_on: m.endsOn,
    });
  }
};

export const listActiveChallenges = async () => {
  await ensureActiveChallenges();
  const sb = supabase();
  const today = todayISO();
  const { data, error } = await sb.from('vault_challenges').select('*').gte('ends_on', today).order('starts_on');
  if (error) throw error;
  return { challenges: (data ?? []).map(challengeFromRow) };
};

export const incrementChallengeProgress = async (matchKey: string, delta = 1) => {
  const sb = supabase();
  const today = todayISO();
  const { data: active } = await sb
    .from('vault_challenges')
    .select('*')
    .gte('ends_on', today)
    .lte('starts_on', today)
    .eq('completed', false);
  for (const c of active ?? []) {
    let inc = 0;
    if (c.key === 'track_every_rupee' && matchKey === 'log_transaction') inc = delta;
    if (c.key === 'receipt_champion' && matchKey === 'receipt') inc = delta;
    if (c.key === 'bargain_hunter' && matchKey === 'deal_tag') inc = delta;
    if (c.key === 'side_hustle_sprint' && matchKey === 'side_income') inc = delta;
    if (inc > 0) {
      const newProgress = Math.min(c.target, c.progress + inc);
      const completed = newProgress >= c.target;
      await sb
        .from('vault_challenges')
        .update({
          progress: newProgress,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', c.id);
      if (completed) {
        await awardXp({ base: c.xp_reward, module: 'vault', source: `challenge:${c.key}` });
      }
    }
  }
};

export const createChallengeManually = async (body: {
  title: string;
  description?: string;
  target?: number;
  xpReward?: number;
  period?: 'weekly' | 'monthly' | 'oneshot';
  startsOn?: string;
  endsOn?: string;
}) => {
  const sb = supabase();
  const today = todayISO();
  const period = body.period ?? 'oneshot';
  let starts = body.startsOn ?? today;
  let ends = body.endsOn;
  if (!ends) {
    if (period === 'weekly') ends = weekRange(today).endsOn;
    else if (period === 'monthly') ends = monthRangeISO(today).endsOn;
    else {
      const d = new Date(today + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 30);
      ends = d.toISOString().split('T')[0];
    }
  }
  const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await sb
    .from('vault_challenges')
    .insert({
      key,
      title: body.title,
      description: body.description ?? '',
      period,
      target: body.target ?? 1,
      progress: 0,
      xp_reward: body.xpReward ?? XP.CHALLENGE_COMPLETED_SMALL,
      starts_on: starts,
      ends_on: ends,
    })
    .select()
    .single();
  if (error) throw error;
  return challengeFromRow(data);
};

export const completeChallengeManually = async (id: string) => {
  const sb = supabase();
  const { data: c } = await sb.from('vault_challenges').select('*').eq('id', id).single();
  if (!c || c.completed) return { ok: false };
  await sb
    .from('vault_challenges')
    .update({ progress: c.target, completed: true, completed_at: new Date().toISOString() })
    .eq('id', id);
  const { xpEarned } = await awardXp({ base: c.xp_reward, module: 'vault', source: `challenge:${c.key}` });
  return { ok: true, xpEarned };
};

// ─────────────────────────────────────────────────────────────
// Stats / reports
// ─────────────────────────────────────────────────────────────

export const getVaultStats = async (params: { months?: number }) => {
  const sb = supabase();
  const months = params.months ?? 12;
  const startDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - (months - 1));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  })();
  const { data: txs } = await sb.from('transactions').select('*').gte('date', startDate).order('date');
  const monthBuckets: Record<string, { income: number; expense: number }> = {};
  const catBuckets: Record<string, number> = {};
  const merchantBuckets: Record<string, number> = {};
  const dowBuckets: number[] = [0, 0, 0, 0, 0, 0, 0];
  const todBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const dayActivity: Record<string, number> = {};
  const topExpenses: any[] = [];

  (txs ?? []).forEach((t: any) => {
    const m = t.date.slice(0, 7);
    monthBuckets[m] ||= { income: 0, expense: 0 };
    const amt = Number(t.amount);
    if (t.type === 'Income') monthBuckets[m].income += amt;
    else {
      monthBuckets[m].expense += amt;
      catBuckets[t.category] = (catBuckets[t.category] ?? 0) + amt;
      if (t.merchant) merchantBuckets[t.merchant] = (merchantBuckets[t.merchant] ?? 0) + amt;
      const d = new Date(t.date + 'T00:00:00Z');
      dowBuckets[d.getUTCDay()] += amt;
      const h = t.logged_at ? new Date(t.logged_at).getHours() : 12;
      if (h < 6) todBuckets.night += amt;
      else if (h < 12) todBuckets.morning += amt;
      else if (h < 18) todBuckets.afternoon += amt;
      else todBuckets.evening += amt;
      dayActivity[t.date] = (dayActivity[t.date] ?? 0) + amt;
      topExpenses.push({ id: t.id, date: t.date, amount: amt, category: t.category, description: t.description, merchant: t.merchant });
    }
  });

  topExpenses.sort((a, b) => b.amount - a.amount);

  const monthList = Object.keys(monthBuckets).sort();
  const spendingTrend = monthList.map((m) => ({ label: m.slice(5), value: monthBuckets[m].expense, month: m }));
  const incomeVsExpense = monthList.map((m) => ({ month: m, income: monthBuckets[m].income, expense: monthBuckets[m].expense }));
  const savingsRate = monthList.map((m) => {
    const inc = monthBuckets[m].income;
    const exp = monthBuckets[m].expense;
    return { month: m, rate: inc > 0 ? Math.max(0, (inc - exp) / inc) : 0 };
  });
  const burnRate = (() => {
    if (!monthList.length) return 0;
    const last3 = monthList.slice(-3);
    const total = last3.reduce((s, m) => s + monthBuckets[m].expense, 0);
    return total / (last3.length * 30);
  })();

  // 90-day activity grid (intensity buckets 0-4).
  const today = new Date(todayISO() + 'T00:00:00Z');
  const grid: { date: string; value: number }[] = [];
  const ninety = new Date(today);
  ninety.setUTCDate(today.getUTCDate() - 90);
  const dayMax = Math.max(1, ...Object.values(dayActivity));
  for (let d = new Date(ninety); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().split('T')[0];
    const v = dayActivity[iso] ?? 0;
    const intensity = v <= 0 ? 0 : v < dayMax * 0.25 ? 1 : v < dayMax * 0.5 ? 2 : v < dayMax * 0.75 ? 3 : 4;
    grid.push({ date: iso, value: intensity });
  }

  // Tag spend.
  const { data: tagLinks } = await sb
    .from('transaction_tags')
    .select('transaction_id, vault_tags(id, name, color), transactions(amount, type)');
  const byTag: Record<string, { id: string; name: string; color: string; amount: number }> = {};
  (tagLinks ?? []).forEach((l: any) => {
    const tag = Array.isArray(l.vault_tags) ? l.vault_tags[0] : l.vault_tags;
    const txn = Array.isArray(l.transactions) ? l.transactions[0] : l.transactions;
    if (!tag || !txn || txn.type !== 'Expense') return;
    byTag[tag.id] ||= { id: tag.id, name: tag.name, color: tag.color, amount: 0 };
    byTag[tag.id].amount += Number(txn.amount);
  });

  // Frugal day count this month.
  const curMonth = todayISO().slice(0, 7);
  const r = monthRange(curMonth);
  let frugalDays = 0;
  for (let d = new Date(r.from + 'T00:00:00Z'); d.toISOString().split('T')[0] <= r.to; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().split('T')[0];
    if (!(dayActivity[iso] > 0)) frugalDays += 1;
  }

  return {
    spendingTrend,
    incomeVsExpense,
    byCategory: Object.entries(catBuckets).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    topMerchants: Object.entries(merchantBuckets).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10),
    topExpenses: topExpenses.slice(0, 10),
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => ({ label: d, value: dowBuckets[i] })),
    timeOfDay: todBuckets,
    savingsRate,
    burnRate,
    activityGrid: grid,
    tagSpend: Object.values(byTag).sort((a, b) => b.amount - a.amount),
    frugalDaysThisMonth: frugalDays,
  };
};

export const getSubscriptionsSummary = async () => {
  const sb = supabase();
  const { data, error } = await sb
    .from('recurring_transactions')
    .select('*')
    .eq('is_subscription', true)
    .eq('cancelled', false)
    .order('amount', { ascending: false });
  if (error) throw error;
  const subs = (data ?? []).map(recurringFromRow);
  const monthlyTotal = subs.reduce((s, r) => {
    const mult = r.frequency === 'monthly' ? 1 : r.frequency === 'yearly' ? 1 / 12 : r.frequency === 'weekly' ? 52 / 12 : 30;
    return s + r.amount * mult;
  }, 0);
  return { subscriptions: subs, monthlyTotal };
};

// ─────────────────────────────────────────────────────────────
// Game / level / titles
// ─────────────────────────────────────────────────────────────

export const getVaultGame = async () => {
  const sb = supabase();
  const { data: streak } = await sb.from('streaks').select('*').eq('module', 'vault').maybeSingle();
  // Sum of all transaction XP + badges + bonus events isn't tracked separately —
  // approximate vault XP as sum of xp_earned across vault tables.
  const [{ data: txs }, { data: vaultBadges }] = await Promise.all([
    sb.from('transactions').select('xp_earned'),
    sb.from('user_badges').select('xp_awarded, badge_id'),
  ]);
  let vaultXp = (txs ?? []).reduce((s: number, t: any) => s + (Number(t.xp_earned) || 0), 0);
  // Approximate: only count badges with vault-themed ids.
  const VAULT_BADGE_PREFIX = new Set([
    'ryo-earned', 'penny-pincher', 'bookkeeper', 'categorizer', 'frugal-friday',
    'receipt-hunter', 'budgeteer', 'goal-setter', 'note-taker', 'tagged-up',
    'recurring-rookie', 'subscription-sleuth', 'calculator-kun', 'round-up-recruit',
    'budget-master', 'frugal-fortnight', 'savers-spirit', 'streak-sage',
    'investors-eye', 'debt-dodger', 'category-king', 'diversifier', 'round-up-hero',
    'faithful-reviewer', 'tax-prep-pro', 'money-master', 'spartan-saver',
    'wealth-wizard', 'compound-sage', 'debt-demolisher', 'marathon-logger',
    'budget-black-belt', 'fire-starter', 'side-income-mogul', 'loid-forger',
    'money-god', 'madaras-treasury', 'zero-debt-zen', 'decade-discipline',
    'millionaire-mindset', 'crorepati', 'financial-sensei', 'vault-hokage',
  ]);
  vaultXp += (vaultBadges ?? [])
    .filter((b: any) => VAULT_BADGE_PREFIX.has(b.badge_id))
    .reduce((s: number, b: any) => s + (Number(b.xp_awarded) || 0), 0);
  return {
    vaultXp,
    title: vaultTitleFor(vaultXp),
    streak: {
      count: streak?.count ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
      lastActivityDate: streak?.last_activity_date ?? null,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

export const getSettings = async () => {
  const s = await ensureSettings();
  return {
    roundUpEnabled: s.round_up_enabled,
    roundUpTo: s.round_up_to,
    roundUpGoalId: s.round_up_goal_id,
    calculatorUsed: s.calculator_used,
    annualReportExported: s.annual_report_exported,
    weeklyReportStreak: s.weekly_report_streak,
    weeklyReportLastSeen: s.weekly_report_last_seen,
  };
};

export const updateSettings = async (body: {
  roundUpEnabled?: boolean;
  roundUpTo?: number;
  roundUpGoalId?: string | null;
  calculatorUsed?: boolean;
  annualReportExported?: boolean;
}) => {
  const sb = supabase();
  const s = await ensureSettings();
  const u: Record<string, any> = {};
  if (body.roundUpEnabled !== undefined) u.round_up_enabled = body.roundUpEnabled;
  if (body.roundUpTo !== undefined) u.round_up_to = body.roundUpTo;
  if (body.roundUpGoalId !== undefined) u.round_up_goal_id = body.roundUpGoalId;
  if (body.calculatorUsed !== undefined) u.calculator_used = body.calculatorUsed;
  if (body.annualReportExported !== undefined) u.annual_report_exported = body.annualReportExported;
  u.updated_at = new Date().toISOString();
  await sb.from('vault_settings').update(u).eq('id', s.id);
  let xp = 0;
  if (body.calculatorUsed && !s.calculator_used) {
    await runVaultBadgeChecks();
  }
  if (body.annualReportExported && !s.annual_report_exported) {
    const r = await awardXp({ base: XP.EXPORT_REPORT, module: 'vault', source: 'annual_report' });
    xp += r.xpEarned;
    await runVaultBadgeChecks();
  }
  return { ok: true, xpEarned: xp };
};

export const markWeeklyReportSeen = async () => {
  const sb = supabase();
  const s = await ensureSettings();
  const today = todayISO();
  const last = s.weekly_report_last_seen;
  let streak = s.weekly_report_streak ?? 0;
  if (last) {
    const lastDate = new Date(last + 'T00:00:00Z');
    const now = new Date(today + 'T00:00:00Z');
    const days = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
    if (days <= 8) streak += 1;
    else streak = 1;
  } else {
    streak = 1;
  }
  await sb.from('vault_settings').update({ weekly_report_last_seen: today, weekly_report_streak: streak }).eq('id', s.id);
  const { xpEarned } = await awardXp({ base: XP.WEEKLY_REPORT_REVIEWED, module: 'vault', source: 'weekly_report' });
  await runVaultBadgeChecks();
  return { xpEarned, weeklyReportStreak: streak };
};

export const markMonthlyReportSeen = async () => {
  const { xpEarned } = await awardXp({ base: XP.MONTHLY_REPORT_REVIEWED, module: 'vault', source: 'monthly_report' });
  return { xpEarned };
};

// ─────────────────────────────────────────────────────────────
// Templates (quick-add)
// ─────────────────────────────────────────────────────────────

export const listTemplates = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('vault_templates').select('*').order('use_count', { ascending: false });
  if (error) throw error;
  return { templates: (data ?? []).map(templateFromRow) };
};

export const createTemplate = async (body: { name: string; amount: number; type: TxType; category: string; description?: string; emoji?: string }) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('vault_templates')
    .insert({
      name: body.name,
      amount: body.amount,
      type: body.type,
      category: body.category,
      description: body.description ?? null,
      emoji: body.emoji ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return templateFromRow(data);
};

export const deleteTemplate = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('vault_templates').delete().eq('id', id);
  if (error) throw error;
};

export const useTemplate = async (id: string) => {
  const sb = supabase();
  const { data: tpl, error } = await sb.from('vault_templates').select('*').eq('id', id).single();
  if (error) throw error;
  await sb.from('vault_templates').update({ use_count: (tpl.use_count ?? 0) + 1 }).eq('id', id);
  return createTransaction({
    amount: Number(tpl.amount),
    type: tpl.type,
    category: tpl.category,
    description: tpl.description ?? tpl.name,
  });
};

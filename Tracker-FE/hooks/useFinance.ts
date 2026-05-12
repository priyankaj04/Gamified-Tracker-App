import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type {
  Account,
  Budget,
  BudgetActual,
  Debt,
  Investment,
  NetWorthSnapshot,
  RecurringTransaction,
  SavingsGoal,
  SubscriptionsSummary,
  Transaction,
  VaultChallenge,
  VaultGame,
  VaultSettings,
  VaultStats,
  VaultTag,
  VaultTemplate,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const financeKeys = {
  all: ['finance'] as const,
  txList: (params?: Record<string, unknown>) => ['finance', 'tx', params] as const,
  budget: (month: string) => ['finance', 'budget', month] as const,
  accounts: ['finance', 'accounts'] as const,
  goals: ['finance', 'goals'] as const,
  debts: ['finance', 'debts'] as const,
  investments: ['finance', 'investments'] as const,
  recurring: ['finance', 'recurring'] as const,
  tags: ['finance', 'tags'] as const,
  netWorth: ['finance', 'net-worth'] as const,
  challenges: ['finance', 'challenges'] as const,
  stats: (months?: number) => ['finance', 'stats', months] as const,
  subscriptions: ['finance', 'subscriptions'] as const,
  game: ['finance', 'game'] as const,
  settings: ['finance', 'settings'] as const,
  templates: ['finance', 'templates'] as const,
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: financeKeys.all });
  qc.invalidateQueries({ queryKey: gameKeys.state });
};

// ── Transactions ─────────────────────────────────────
export const useTransactions = (params?: {
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
}) =>
  useQuery({
    queryKey: financeKeys.txList(params),
    queryFn: () =>
      api
        .get<{ data: { transactions: Transaction[]; total: number } }>('/finance/transactions', { params })
        .then(unwrap),
  });

interface TxBody {
  date?: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  description?: string;
  accountId?: string | null;
  recurringId?: string | null;
  merchant?: string | null;
  receiptUrl?: string | null;
  currency?: string;
  tagIds?: string[];
  roundUp?: boolean;
}

export const useCreateTx = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const pushBadge = useAppStore((s) => s.pushBadgeUnlock);
  return useMutation({
    mutationFn: (body: TxBody) =>
      api
        .post<{ data: { transaction: Transaction; roundUp?: { goalId: string; amount: number } } & XpAwardResult }>(
          '/finance/transactions',
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, res.transaction.type === 'Income' ? 'Income logged' : 'Transaction');
      res.badgesUnlocked?.forEach((b: any) => pushBadge(b));
      invalidateAll(qc);
    },
  });
};

export const useUpdateTx = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TxBody> }) =>
      api.put<{ data: Transaction }>(`/finance/transactions/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteTx = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { deleted: boolean } }>(`/finance/transactions/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

// ── Budget ───────────────────────────────────────────
export const useBudget = (month: string) =>
  useQuery({
    queryKey: financeKeys.budget(month),
    queryFn: () =>
      api
        .get<{ data: { budget: Budget; actual: BudgetActual } }>(`/finance/budget/${month}`)
        .then(unwrap),
  });

export const useUpdateBudget = (month: string) => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: Partial<Budget>) =>
      api
        .put<{ data: { budget: Budget; xpEarned: number; badgesUnlocked: any[] } }>(`/finance/budget/${month}`, body)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Budget set');
      invalidateAll(qc);
    },
  });
};

// ── Accounts ─────────────────────────────────────────
export const useAccounts = () =>
  useQuery({
    queryKey: financeKeys.accounts,
    queryFn: () => api.get<{ data: { accounts: Account[] } }>('/finance/accounts').then(unwrap),
  });

export const useCreateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Account>) =>
      api.post<{ data: Account }>('/finance/accounts', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Account> }) =>
      api.put<{ data: Account }>(`/finance/accounts/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { deleted: boolean } }>(`/finance/accounts/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fromId: string; toId: string; amount: number; date?: string; description?: string }) =>
      api.post<{ data: { ok: boolean } }>('/finance/accounts/transfer', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

// ── Savings goals ────────────────────────────────────
export const useGoals = () =>
  useQuery({
    queryKey: financeKeys.goals,
    queryFn: () => api.get<{ data: { goals: SavingsGoal[] } }>('/finance/goals').then(unwrap),
  });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const pushBadge = useAppStore((s) => s.pushBadgeUnlock);
  return useMutation({
    mutationFn: (body: { name: string; emoji?: string; targetAmount: number; deadline?: string | null; color?: string }) =>
      api.post<{ data: { goal: SavingsGoal } & XpAwardResult }>('/finance/goals', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Goal created');
      res.badgesUnlocked?.forEach((b: any) => pushBadge(b));
      invalidateAll(qc);
    },
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SavingsGoal> }) =>
      api.put<{ data: SavingsGoal }>(`/finance/goals/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { deleted: boolean } }>(`/finance/goals/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useContributeGoal = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const pushBadge = useAppStore((s) => s.pushBadgeUnlock);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { amount: number; notes?: string; source?: string; date?: string } }) =>
      api
        .post<{ data: { xpEarned: number; badgesUnlocked: any[]; hit: boolean; beaten: boolean } }>(
          `/finance/goals/${id}/contribute`,
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, res.hit ? 'Goal hit!' : 'Saved');
      res.badgesUnlocked?.forEach((b: any) => pushBadge(b));
      invalidateAll(qc);
    },
  });
};

// ── Debts ────────────────────────────────────────────
export const useDebts = () =>
  useQuery({
    queryKey: financeKeys.debts,
    queryFn: () => api.get<{ data: { debts: Debt[] } }>('/finance/debts').then(unwrap),
  });

export const useCreateDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Debt>) => api.post<{ data: Debt }>('/finance/debts', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Debt> }) =>
      api.put<{ data: Debt }>(`/finance/debts/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { deleted: boolean } }>(`/finance/debts/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const usePayDebt = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const pushBadge = useAppStore((s) => s.pushBadgeUnlock);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { amount: number; date?: string; notes?: string } }) =>
      api
        .post<{ data: { xpEarned: number; badgesUnlocked: any[]; cleared: boolean; balance: number } }>(
          `/finance/debts/${id}/pay`,
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, res.cleared ? 'Debt cleared!' : 'Payment');
      res.badgesUnlocked?.forEach((b: any) => pushBadge(b));
      invalidateAll(qc);
    },
  });
};

// ── Investments ──────────────────────────────────────
export const useInvestments = () =>
  useQuery({
    queryKey: financeKeys.investments,
    queryFn: () =>
      api.get<{ data: { investments: Investment[] } }>('/finance/investments').then(unwrap),
  });

export const useCreateInvestment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Investment>) =>
      api.post<{ data: Investment }>('/finance/investments', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateInvestment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Investment> }) =>
      api.put<{ data: Investment }>(`/finance/investments/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteInvestment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { deleted: boolean } }>(`/finance/investments/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useLogInvestmentTxn = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const pushBadge = useAppStore((s) => s.pushBadgeUnlock);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { action: 'Buy' | 'Sell' | 'SIP' | 'Dividend' | 'Interest'; quantity?: number; amount: number; date?: string; notes?: string };
    }) =>
      api
        .post<{ data: { xpEarned: number; badgesUnlocked: any[]; portfolio: number } }>(
          `/finance/investments/${id}/log`,
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Investment');
      res.badgesUnlocked?.forEach((b: any) => pushBadge(b));
      invalidateAll(qc);
    },
  });
};

// ── Recurring ────────────────────────────────────────
export const useRecurring = () =>
  useQuery({
    queryKey: financeKeys.recurring,
    queryFn: () =>
      api.get<{ data: { recurring: RecurringTransaction[] } }>('/finance/recurring').then(unwrap),
  });

export const useCreateRecurring = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<RecurringTransaction>) =>
      api.post<{ data: { recurring: RecurringTransaction } }>('/finance/recurring', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateRecurring = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<RecurringTransaction> }) =>
      api.put<{ data: RecurringTransaction }>(`/finance/recurring/${id}`, body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useCancelRecurring = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<{ data: { recurring: RecurringTransaction; xpEarned: number } }>(`/finance/recurring/${id}/cancel`)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Subscription cancelled');
      invalidateAll(qc);
    },
  });
};

export const useConfirmRecurring = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: { date?: string } }) =>
      api
        .post<{ data: { transaction: Transaction; xpEarned: number; billOnTimeBonus: number; nextDue: string } }>(
          `/finance/recurring/${id}/confirm`,
          body ?? {},
        )
        .then(unwrap),
    onSuccess: (res) => {
      const total = (res.xpEarned ?? 0) + (res.billOnTimeBonus ?? 0);
      if (total) pushPopup(total, 'Bill paid');
      invalidateAll(qc);
    },
  });
};

export const useDeleteRecurring = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { deleted: boolean } }>(`/finance/recurring/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useProcessDueRecurring = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { created: number } }>('/finance/recurring/process-due').then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

// ── Tags ─────────────────────────────────────────────
export const useVaultTags = () =>
  useQuery({
    queryKey: financeKeys.tags,
    queryFn: () => api.get<{ data: { tags: VaultTag[] } }>('/finance/tags').then(unwrap),
  });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string }) =>
      api.post<{ data: VaultTag }>('/finance/tags', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: { deleted: boolean } }>(`/finance/tags/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

// ── Net worth ────────────────────────────────────────
export const useNetWorth = () =>
  useQuery({
    queryKey: financeKeys.netWorth,
    queryFn: () =>
      api.get<{ data: { snapshots: NetWorthSnapshot[] } }>('/finance/net-worth').then(unwrap),
  });

export const useTakeNetWorthSnapshot = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body?: { date?: string; assets?: number; liabilities?: number; notes?: string }) =>
      api
        .post<{ data: { snapshot: NetWorthSnapshot; xpEarned: number } }>('/finance/net-worth/snapshot', body ?? {})
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Net worth');
      invalidateAll(qc);
    },
  });
};

// ── Challenges ──────────────────────────────────────
export const useVaultChallenges = () =>
  useQuery({
    queryKey: financeKeys.challenges,
    queryFn: () =>
      api.get<{ data: { challenges: VaultChallenge[] } }>('/finance/challenges').then(unwrap),
  });

export const useCompleteChallenge = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<{ data: { ok: boolean; xpEarned?: number } }>(`/finance/challenges/${id}/complete`)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Challenge done');
      invalidateAll(qc);
    },
  });
};

export const useCreateChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      description?: string;
      target?: number;
      xpReward?: number;
      period?: 'weekly' | 'monthly' | 'oneshot';
      startsOn?: string;
      endsOn?: string;
    }) => api.post<{ data: VaultChallenge }>('/finance/challenges', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteChallenge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { deleted: boolean } }>(`/finance/challenges/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

// ── Stats / reports ─────────────────────────────────
export const useVaultStats = (months?: number) =>
  useQuery({
    queryKey: financeKeys.stats(months),
    queryFn: () =>
      api.get<{ data: VaultStats }>('/finance/stats', { params: { months } }).then(unwrap),
  });

export const useSubscriptionsSummary = () =>
  useQuery({
    queryKey: financeKeys.subscriptions,
    queryFn: () =>
      api.get<{ data: SubscriptionsSummary }>('/finance/subscriptions').then(unwrap),
  });

// ── Vault game ──────────────────────────────────────
export const useVaultGame = () =>
  useQuery({
    queryKey: financeKeys.game,
    queryFn: () => api.get<{ data: VaultGame }>('/finance/game').then(unwrap),
  });

// ── Settings ────────────────────────────────────────
export const useVaultSettings = () =>
  useQuery({
    queryKey: financeKeys.settings,
    queryFn: () => api.get<{ data: VaultSettings }>('/finance/settings').then(unwrap),
  });

export const useUpdateVaultSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<VaultSettings>) =>
      api.put<{ data: { ok: boolean; xpEarned: number } }>('/finance/settings', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useMarkWeeklySeen = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: () =>
      api
        .post<{ data: { xpEarned: number; weeklyReportStreak: number } }>('/finance/reports/weekly-seen')
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Weekly review');
      invalidateAll(qc);
    },
  });
};

export const useMarkMonthlySeen = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { xpEarned: number } }>('/finance/reports/monthly-seen').then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Monthly review');
      invalidateAll(qc);
    },
  });
};

// ── Templates ───────────────────────────────────────
export const useTemplates = () =>
  useQuery({
    queryKey: financeKeys.templates,
    queryFn: () => api.get<{ data: { templates: VaultTemplate[] } }>('/finance/templates').then(unwrap),
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<VaultTemplate>) =>
      api.post<{ data: VaultTemplate }>('/finance/templates', body).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUseTemplate = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<{ data: { transaction: Transaction } & XpAwardResult }>(`/finance/templates/${id}/use`)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Quick add');
      invalidateAll(qc);
    },
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: { deleted: boolean } }>(`/finance/templates/${id}`).then(unwrap),
    onSuccess: () => invalidateAll(qc),
  });
};

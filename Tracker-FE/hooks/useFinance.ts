import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { Budget, BudgetActual, Transaction, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const financeKeys = {
  all: ['finance'] as const,
  txList: (params?: Record<string, unknown>) => ['finance', 'tx', params] as const,
  budget: (month: string) => ['finance', 'budget', month] as const,
};

export const useTransactions = (params?: { month?: string; category?: string; type?: string }) =>
  useQuery({
    queryKey: financeKeys.txList(params),
    queryFn: () =>
      api
        .get<{ data: { transactions: Transaction[] } }>('/finance/transactions', { params })
        .then(unwrap),
  });

interface TxBody {
  date?: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  description?: string;
}

export const useCreateTx = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: TxBody) =>
      api
        .post<{ data: { transaction: Transaction } & XpAwardResult }>(
          '/finance/transactions',
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Transaction');
      qc.invalidateQueries({ queryKey: financeKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

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
  return useMutation({
    mutationFn: (body: Partial<Budget>) =>
      api.put<{ data: Budget }>(`/finance/budget/${month}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.budget(month) }),
  });
};

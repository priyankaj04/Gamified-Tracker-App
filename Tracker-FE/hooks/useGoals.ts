import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { GoalLog, SpiritGoal, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const goalsKeys = {
  all: ['goals'] as const,
  list: ['goals', 'list'] as const,
  archived: ['goals', 'archived'] as const,
  logs: (id: string) => ['goals', id, 'logs'] as const,
};

export const useGoals = () =>
  useQuery({
    queryKey: goalsKeys.list,
    queryFn: () => api.get<{ data: SpiritGoal[] }>('/spirit/goals').then(unwrap),
  });

export const useArchivedGoals = () =>
  useQuery({
    queryKey: goalsKeys.archived,
    queryFn: () => api.get<{ data: SpiritGoal[] }>('/spirit/goals/archived').then(unwrap),
  });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<SpiritGoal>) =>
      api.post<{ data: SpiritGoal }>('/spirit/goals', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalsKeys.all }),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SpiritGoal> }) =>
      api.put<{ data: SpiritGoal }>(`/spirit/goals/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalsKeys.all }),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalsKeys.all }),
  });
};

export const useLogGoalProgress = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const triggerConfetti = useAppStore((s) => s.triggerConfetti);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { value: number; notes?: string; date?: string } }) =>
      api
        .post<{ data: { goal: SpiritGoal; completedNow: boolean } & XpAwardResult }>(
          `/spirit/goals/${id}/log`,
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.completedNow) {
        triggerConfetti();
        if (res.xpEarned) pushPopup(res.xpEarned, '🏆 Goal Reached!');
      } else if (res.xpEarned) {
        pushPopup(res.xpEarned, 'Goal Reached');
      }
      qc.invalidateQueries({ queryKey: goalsKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useGoalLogs = (id: string) =>
  useQuery({
    queryKey: goalsKeys.logs(id),
    queryFn: () => api.get<{ data: GoalLog[] }>(`/spirit/goals/${id}/logs`).then(unwrap),
    enabled: !!id,
  });

export const useCompleteGoal = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (id: string) =>
      api
        .patch<{ data: { goal: SpiritGoal } & XpAwardResult }>(`/spirit/goals/${id}/complete`)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Goal Reached');
      qc.invalidateQueries({ queryKey: goalsKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useArchiveGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: SpiritGoal }>(`/spirit/goals/${id}/archive`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: goalsKeys.all }),
  });
};

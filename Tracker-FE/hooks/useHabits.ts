import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { Habit, HabitBundle, HabitHistoryCell, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const habitsKeys = {
  all: ['habits'] as const,
  list: ['habits', 'list'] as const,
  today: ['habits', 'today'] as const,
  bundles: ['habits', 'bundles'] as const,
  history: (id: string) => ['habits', id, 'history'] as const,
  streak: (id: string) => ['habits', id, 'streak'] as const,
};

export const useHabits = () =>
  useQuery({
    queryKey: habitsKeys.list,
    queryFn: () => api.get<{ data: Habit[] }>('/spirit/habits').then(unwrap),
  });

export const useTodayHabits = () =>
  useQuery({
    queryKey: habitsKeys.today,
    queryFn: () => api.get<{ data: Habit[] }>('/spirit/habits/today').then(unwrap),
  });

export const useCreateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Habit>) =>
      api.post<{ data: Habit }>('/spirit/habits', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  });
};

export const useUpdateHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Habit> }) =>
      api.put<{ data: Habit }>(`/spirit/habits/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/habits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  });
};

export const useReorderHabits = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.patch('/spirit/habits/reorder', { orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  });
};

export const useCompleteHabit = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: XpAwardResult & { bundleHit?: { name: string; bonusXp: number } } }>(`/spirit/habits/${id}/complete`).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Habit Done');
      if (res.bundleHit) pushPopup(res.bundleHit.bonusXp, `Bundle: ${res.bundleHit.name}`);
      qc.invalidateQueries({ queryKey: habitsKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useUncompleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/habits/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.all }),
  });
};

export const useHabitHistory = (id: string) =>
  useQuery({
    queryKey: habitsKeys.history(id),
    queryFn: () => api.get<{ data: HabitHistoryCell[] }>(`/spirit/habits/${id}/history`).then(unwrap),
    enabled: !!id,
  });

export const useHabitStreak = (id: string) =>
  useQuery({
    queryKey: habitsKeys.streak(id),
    queryFn: () => api.get<{ data: { current: number; longest: number } }>(`/spirit/habits/${id}/streak`).then(unwrap),
    enabled: !!id,
  });

export const useBundles = () =>
  useQuery({
    queryKey: habitsKeys.bundles,
    queryFn: () => api.get<{ data: HabitBundle[] }>('/spirit/habits/bundles').then(unwrap),
  });

export const useCreateBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; bonusXp?: number; habitIds: string[] }) =>
      api.post<{ data: HabitBundle }>('/spirit/habits/bundles', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.bundles }),
  });
};

export const useDeleteBundle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/habits/bundles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: habitsKeys.bundles }),
  });
};

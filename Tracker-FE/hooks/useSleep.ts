import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { SleepGoal, SleepLog, SleepStats, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const sleepKeys = {
  all: ['sleep'] as const,
  list: ['sleep', 'list'] as const,
  goal: ['sleep', 'goal'] as const,
  stats: ['sleep', 'stats'] as const,
};

export const useSleep = () =>
  useQuery({
    queryKey: sleepKeys.list,
    queryFn: () => api.get<{ data: SleepLog[] }>('/spirit/sleep').then(unwrap),
  });

export const useSleepGoal = () =>
  useQuery({
    queryKey: sleepKeys.goal,
    queryFn: () => api.get<{ data: SleepGoal }>('/spirit/sleep/goal').then(unwrap),
  });

export const useSleepStats = () =>
  useQuery({
    queryKey: sleepKeys.stats,
    queryFn: () => api.get<{ data: SleepStats }>('/spirit/sleep/stats').then(unwrap),
  });

export const useLogSleep = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: {
      date: string;
      bedtime: string;
      wakeTime: string;
      quality?: number;
      notes?: string;
    }) => api.post<{ data: { log: SleepLog } & XpAwardResult }>('/spirit/sleep', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Sleep Logged');
      qc.invalidateQueries({ queryKey: sleepKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useDeleteSleep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/sleep/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: sleepKeys.all }),
  });
};

export const useUpdateSleepGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetHours: number }) =>
      api.put<{ data: SleepGoal }>('/spirit/sleep/goal', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: sleepKeys.all }),
  });
};

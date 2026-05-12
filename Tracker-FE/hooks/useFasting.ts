import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { FastingSession, FastingStats, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const fastingKeys = {
  all: ['fasting'] as const,
  active: ['fasting', 'active'] as const,
  list: ['fasting', 'list'] as const,
  stats: ['fasting', 'stats'] as const,
};

export const useActiveFast = () =>
  useQuery({
    queryKey: fastingKeys.active,
    queryFn: () => api.get<{ data: FastingSession | null }>('/spirit/fasting/active').then(unwrap),
    refetchInterval: 60_000,
  });

export const useFasts = () =>
  useQuery({
    queryKey: fastingKeys.list,
    queryFn: () => api.get<{ data: FastingSession[] }>('/spirit/fasting').then(unwrap),
  });

export const useFastingStats = () =>
  useQuery({
    queryKey: fastingKeys.stats,
    queryFn: () => api.get<{ data: FastingStats }>('/spirit/fasting/stats').then(unwrap),
  });

export const useStartFast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetHours: number; startTime?: string }) =>
      api.post<{ data: FastingSession }>('/spirit/fasting/start', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: fastingKeys.all }),
  });
};

export const useEndFast = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const triggerConfetti = useAppStore((s) => s.triggerConfetti);
  return useMutation({
    mutationFn: (body: { endTime?: string; notes?: string } = {}) =>
      api
        .post<{ data: { session: FastingSession } & XpAwardResult }>('/spirit/fasting/end', body)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) {
        pushPopup(res.xpEarned, 'Fast Complete');
        triggerConfetti();
      }
      qc.invalidateQueries({ queryKey: fastingKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useDeleteFast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/fasting/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: fastingKeys.all }),
  });
};

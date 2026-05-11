import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { XpAwardResult } from '@/types';

export interface CardioSession {
  id: string;
  activityType: string;
  date: string;
  durationMinutes: number;
  distanceKm: number | null;
  avgPaceMinPerKm: number | null;
  hrZone: number | null;
  stars: number | null;
  notes: string | null;
  xpEarned: number;
  createdAt: string;
}

export const cardioKeys = {
  all: ['cardio'] as const,
  list: (params?: unknown) => ['cardio', 'list', params] as const,
  stats: ['cardio', 'stats'] as const,
};

export const useCardio = (params?: { from?: string; to?: string; activityType?: string }) =>
  useQuery({
    queryKey: cardioKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { sessions: CardioSession[] } }>('/cardio', { params })
        .then(unwrap),
  });

export const useCardioStats = () =>
  useQuery({
    queryKey: cardioKeys.stats,
    queryFn: () =>
      api
        .get<{ data: { totalSessions: number; totalMinutes: number; totalKm: number } }>(
          '/cardio/stats',
        )
        .then(unwrap),
  });

export interface CardioBody {
  activityType: string;
  date?: string;
  durationMinutes: number;
  distanceKm?: number;
  hrZone?: number;
  stars?: number;
  notes?: string;
}

export const useLogCardio = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: CardioBody) =>
      api
        .post<{ data: { session: CardioSession } & XpAwardResult }>('/cardio', body)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Cardio');
      qc.invalidateQueries({ queryKey: cardioKeys.all });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
};

export const useDeleteCardio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cardio/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardioKeys.all }),
  });
};

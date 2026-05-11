import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export type Soreness = Record<string, number>;

export interface RecoveryLog {
  id: string;
  date: string;
  sleepHours: number | null;
  sleepQuality: number | null;
  energyLevel: number | null;
  soreness: Soreness;
  notes: string | null;
  createdAt: string;
}

export interface RecoveryScore {
  score: number | null;
  days: number;
  window: number;
}

const keys = {
  list: (params?: Record<string, unknown>) => ['recovery', 'list', params] as const,
  score: ['recovery', 'score'] as const,
};

export const useRecoveryLogs = (params?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: keys.list(params),
    queryFn: () =>
      api.get<{ data: { logs: RecoveryLog[] } }>('/recovery', { params }).then(unwrap),
  });

export const useRecoveryScore = () =>
  useQuery({
    queryKey: keys.score,
    queryFn: () => api.get<{ data: RecoveryScore }>('/recovery/score').then(unwrap),
  });

export interface UpsertRecoveryBody {
  date?: string;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  energyLevel?: number | null;
  soreness?: Soreness;
  notes?: string | null;
}

export const useUpsertRecovery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertRecoveryBody) =>
      api.post<{ data: RecoveryLog }>('/recovery', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recovery'] });
    },
  });
};

export const useDeleteRecovery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => api.delete(`/recovery/${date}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recovery'] }),
  });
};

// Helpers
export const scoreBand = (score: number | null): 'good' | 'okay' | 'low' | 'unknown' => {
  if (score == null) return 'unknown';
  if (score >= 75) return 'good';
  if (score >= 50) return 'okay';
  return 'low';
};

export const scoreColor = (score: number | null): string => {
  const band = scoreBand(score);
  if (band === 'good') return '#4ade80';
  if (band === 'okay') return '#fbbf24';
  if (band === 'low') return '#ef4444';
  return '#64748b';
};

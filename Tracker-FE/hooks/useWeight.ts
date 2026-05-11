import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { BodyGoal, WeightEntry, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const weightKeys = {
  all: ['weight'] as const,
  list: (params?: Record<string, unknown>) => ['weight', 'list', params] as const,
  goal: ['weight', 'goal'] as const,
};

export const useWeight = (params?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: weightKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { entries: WeightEntry[]; goal: BodyGoal | null; progressPct: number } }>(
          '/weight',
          { params },
        )
        .then(unwrap),
  });

interface WeightBody {
  date?: string;
  weightKg: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  notes?: string;
}

export const useLogWeight = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: WeightBody) =>
      api.post<{ data: { entry: WeightEntry } & XpAwardResult }>('/weight', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Weight Logged');
      qc.invalidateQueries({ queryKey: weightKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

interface GoalBody {
  startWeightKg: number;
  targetWeightKg: number;
  startDate: string;
  targetDate: string;
}

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GoalBody) =>
      api.put<{ data: BodyGoal }>('/weight/goal', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: weightKeys.all }),
  });
};

export const useUpdateWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<WeightBody> }) =>
      api.put<{ data: WeightEntry }>(`/weight/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: weightKeys.all }),
  });
};

export const useDeleteWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/weight/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: weightKeys.all }),
  });
};

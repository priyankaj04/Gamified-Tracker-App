import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import type {
  DsaDifficulty,
  DsaPlatform,
  DsaProblem,
  DsaStatus,
  DsaTopic,
  GridCell,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const dsaKeys = {
  all: ['dsa'] as const,
  list: (params?: Record<string, unknown>) => ['dsa', 'list', params] as const,
  stats: ['dsa', 'stats'] as const,
  grid: ['dsa', 'grid'] as const,
};

interface ListParams {
  difficulty?: DsaDifficulty;
  topic?: DsaTopic;
  status?: DsaStatus;
  platform?: DsaPlatform;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const useDsaProblems = (params: ListParams = {}) =>
  useQuery({
    queryKey: dsaKeys.list(params as any),
    queryFn: () => api.get<{ data: { problems: DsaProblem[] } }>('/dsa', { params }).then(unwrap),
  });

export const useDsaStats = () =>
  useQuery({
    queryKey: dsaKeys.stats,
    queryFn: () =>
      api
        .get<{
          data: {
            totalSolved: number;
            easy: number;
            medium: number;
            hard: number;
            byTopic: { topic: string; solved: number; attempted: number }[];
            byPlatform: { platform: string; count: number }[];
            currentStreak: number;
            longestStreak: number;
            weeklyGoalProgress: { current: number; goal: number };
            avgTimeToSolve: number;
            weakTopics: string[];
          };
        }>('/dsa/stats')
        .then(unwrap),
  });

export const useDsaGrid = () =>
  useQuery({
    queryKey: dsaKeys.grid,
    queryFn: () =>
      api.get<{ data: { grid: (GridCell & { count: number })[] } }>('/dsa/grid').then(unwrap),
  });

export interface DsaBody {
  title: string;
  platform?: DsaPlatform;
  difficulty: DsaDifficulty;
  topic?: DsaTopic;
  status?: DsaStatus;
  timeTakenMin?: number | null;
  date?: string;
  problemUrl?: string | null;
  notes?: string | null;
  solutionNotes?: string | null;
}

export const useCreateDsaProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DsaBody) =>
      api.post<{ data: { problem: DsaProblem } & XpAwardResult }>('/dsa', body).then(unwrap),
    onSuccess: (res, vars) => {
      const lvl = vars.difficulty === 'Hard' ? 'big' : 'normal';
      celebrate({ xp: res.xpEarned, label: `DSA · ${vars.difficulty}`, level: lvl });
      qc.invalidateQueries({ queryKey: dsaKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useUpdateDsaProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DsaBody> }) =>
      api.put<{ data: DsaProblem }>(`/dsa/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: dsaKeys.all }),
  });
};

export const useDeleteDsaProblem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/dsa/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: dsaKeys.all }),
  });
};

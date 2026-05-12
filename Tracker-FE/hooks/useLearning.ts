import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import type {
  LearningItem,
  LearningStatus,
  LearningType,
  Proficiency,
  SkillCategory,
  TechSkill,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const learningKeys = {
  all: ['learning'] as const,
  list: (params?: Record<string, unknown>) => ['learning', 'list', params] as const,
  stats: ['learning', 'stats'] as const,
  skillMap: ['learning', 'skill-map'] as const,
  rusty: ['learning', 'rusty'] as const,
  trending: ['learning', 'trending'] as const,
};

interface ListParams {
  status?: LearningStatus;
  type?: LearningType;
  topic?: string;
  search?: string;
}

export const useLearning = (params: ListParams = {}) =>
  useQuery({
    queryKey: learningKeys.list(params as any),
    queryFn: () =>
      api.get<{ data: { items: LearningItem[] } }>('/learning', { params }).then(unwrap),
  });

export interface LearningBody {
  title: string;
  type?: LearningType;
  platform?: string | null;
  sourceUrl?: string | null;
  topics?: string[];
  status?: LearningStatus;
  progressPct?: number;
  rating?: number | null;
  notes?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export const useCreateLearning = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LearningBody) =>
      api.post<{ data: LearningItem }>('/learning', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: learningKeys.all }),
  });
};

export const useUpdateLearning = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<LearningBody> }) =>
      api.put<{ data: LearningItem }>(`/learning/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: learningKeys.all }),
  });
};

export const useDeleteLearning = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/learning/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: learningKeys.all }),
  });
};

export const useUpdateProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, progressPct }: { id: string; progressPct: number }) =>
      api.patch<{ data: LearningItem }>(`/learning/${id}/progress`, { progressPct }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: learningKeys.all }),
  });
};

export const useCompleteLearning = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: { item: LearningItem } & XpAwardResult }>(`/learning/${id}/complete`).then(unwrap),
    onSuccess: (res) => {
      celebrate({ xp: res.xpEarned, label: 'Learning Complete', level: 'big' });
      qc.invalidateQueries({ queryKey: learningKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useLearningStats = () =>
  useQuery({
    queryKey: learningKeys.stats,
    queryFn: () =>
      api
        .get<{
          data: {
            totalCompleted: number;
            totalInProgress: number;
            totalHours: number;
            completedThisMonth: number;
            topicBreakdown: { topic: string; count: number; hours: number }[];
          };
        }>('/learning/stats')
        .then(unwrap),
  });

export const useSkillMap = () =>
  useQuery({
    queryKey: learningKeys.skillMap,
    queryFn: () =>
      api
        .get<{
          data: { categories: Record<string, TechSkill[]>; skills: TechSkill[] };
        }>('/learning/skill-map')
        .then(unwrap),
  });

export const useRustySkills = () =>
  useQuery({
    queryKey: learningKeys.rusty,
    queryFn: () =>
      api.get<{ data: { skills: TechSkill[] } }>('/learning/rusty').then(unwrap),
  });

export const useTrendingSkills = () =>
  useQuery({
    queryKey: learningKeys.trending,
    queryFn: () =>
      api.get<{ data: { skills: TechSkill[] } }>('/learning/trending').then(unwrap),
  });

export const useUpdateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { proficiency?: Proficiency; category?: SkillCategory };
    }) => api.put<{ data: TechSkill }>(`/learning/skills/${id}`, body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: learningKeys.skillMap });
      qc.invalidateQueries({ queryKey: learningKeys.rusty });
    },
  });
};

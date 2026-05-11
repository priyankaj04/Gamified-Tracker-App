import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { Quest, Tag, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const questKeys = {
  all: ['quests'] as const,
  list: (params?: Record<string, unknown>) => ['quests', 'list', params] as const,
  tags: ['quests', 'tags'] as const,
};

export const useQuests = (params?: {
  completed?: boolean;
  priority?: string;
  tagId?: string;
  daily?: boolean;
}) =>
  useQuery({
    queryKey: questKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { quests: Quest[]; total: number } }>('/quests', { params })
        .then(unwrap),
  });

interface QuestBody {
  title: string;
  priority?: 'S' | 'A' | 'B' | 'C';
  isDaily?: boolean;
  dueDate?: string | null;
  tagIds?: string[];
  notes?: string;
}

export const useCreateQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestBody) => api.post<{ data: Quest }>('/quests', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.all }),
  });
};

export const useCompleteQuest = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: ({ id, stars }: { id: string; stars?: number }) =>
      api
        .patch<{ data: { quest: Quest } & XpAwardResult }>(`/quests/${id}/complete`, { stars })
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Quest Complete');
      qc.invalidateQueries({ queryKey: questKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useDeleteQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.all }),
  });
};

export const useTags = () =>
  useQuery({
    queryKey: questKeys.tags,
    queryFn: () => api.get<{ data: { tags: Tag[] } }>('/quests/tags').then(unwrap),
  });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color?: string }) =>
      api.post<{ data: Tag }>('/quests/tags', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.tags }),
  });
};

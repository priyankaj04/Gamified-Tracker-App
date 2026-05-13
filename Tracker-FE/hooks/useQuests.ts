import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cancelQuestReminder, scheduleQuestReminder } from '@/lib/notifications';
import type {
  Quest,
  QuestActiveTimer,
  QuestChallenge,
  QuestCombo,
  QuestInsights,
  QuestRank,
  QuestSettings,
  QuestStep,
  QuestTemplate,
  QuestTodaysHunt,
  Recurrence,
  Tag,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const questKeys = {
  all: ['quests'] as const,
  list: (params?: Record<string, unknown>) => ['quests', 'list', params] as const,
  detail: (id: string) => ['quests', 'detail', id] as const,
  steps: (id: string) => ['quests', 'steps', id] as const,
  tags: ['quests', 'tags'] as const,
  templates: ['quests', 'templates'] as const,
  hunt: ['quests', 'hunt'] as const,
  insights: (window?: number) => ['quests', 'insights', window] as const,
  rank: ['quests', 'rank'] as const,
  combo: ['quests', 'combo'] as const,
  challenges: ['quests', 'challenges'] as const,
  settings: ['quests', 'settings'] as const,
  timer: ['quests', 'timer'] as const,
};

const invalidateQuestData = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: questKeys.all });
  qc.invalidateQueries({ queryKey: gameKeys.state });
};

// ─── List & detail ─────────────────────────────────────────
export const useQuests = (params?: {
  completed?: boolean;
  priority?: string;
  tagId?: string;
  daily?: boolean;
  boss?: boolean;
  archived?: boolean;
  search?: string;
  parentId?: string | null;
}) =>
  useQuery({
    queryKey: questKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { quests: Quest[]; total: number } }>('/quests', { params })
        .then(unwrap),
  });

export const useQuest = (id: string | undefined) =>
  useQuery({
    queryKey: questKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: Quest }>(`/quests/${id}`).then(unwrap),
    enabled: !!id,
  });

interface QuestBody {
  title: string;
  description?: string | null;
  priority?: 'S' | 'A' | 'B' | 'C';
  difficulty?: 'Trivial' | 'Normal' | 'Hard' | 'Boss' | null;
  isDaily?: boolean;
  isBoss?: boolean;
  dueDate?: string | null;
  remindAt?: string | null;
  tagIds?: string[];
  notes?: string;
  estimatedMinutes?: number | null;
  recurrence?: Recurrence;
  parentQuestId?: string | null;
  steps?: string[];
  linkedModule?: string | null;
  linkedModuleId?: string | null;
}

export const useCreateQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestBody) => api.post<{ data: Quest }>('/quests', body).then(unwrap),
    onSuccess: (quest) => {
      invalidateQuestData(qc);
      if (quest?.remindAt) {
        scheduleQuestReminder(quest.id, quest.remindAt, quest.title).catch(() => {});
      }
    },
  });
};

export const useUpdateQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<QuestBody> }) =>
      api.put<{ data: Quest }>(`/quests/${id}`, body).then(unwrap),
    onSuccess: (quest) => {
      invalidateQuestData(qc);
      if (quest) {
        cancelQuestReminder(quest.id).catch(() => {});
        if (quest.remindAt && !quest.completed) {
          scheduleQuestReminder(quest.id, quest.remindAt, quest.title).catch(() => {});
        }
      }
    },
  });
};

interface CompleteResult extends XpAwardResult {
  quest: Quest;
  comboActive: boolean;
  comboCount: number;
  multiplierApplied: number;
}

export const useCompleteQuest = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: ({ id, stars }: { id: string; stars?: number }) =>
      api
        .patch<{ data: CompleteResult }>(`/quests/${id}/complete`, { stars })
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) {
        const label = res.comboActive ? `COMBO ${res.comboCount}× — Quest Complete` : 'Quest Complete';
        pushPopup(res.xpEarned, label);
      }
      if (res.quest) cancelQuestReminder(res.quest.id).catch(() => {});
      invalidateQuestData(qc);
    },
  });
};

export const useDeleteQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quests/${id}`),
    onSuccess: (_, id) => {
      cancelQuestReminder(id).catch(() => {});
      invalidateQuestData(qc);
    },
  });
};

export const useArchiveQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: Quest }>(`/quests/${id}/archive`).then(unwrap),
    onSuccess: () => invalidateQuestData(qc),
  });
};

export const useUnarchiveQuest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: Quest }>(`/quests/${id}/unarchive`).then(unwrap),
    onSuccess: () => invalidateQuestData(qc),
  });
};

export const useReorderQuests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => api.post('/quests/reorder', { orderedIds }),
    onSuccess: () => invalidateQuestData(qc),
  });
};

// ─── Steps ─────────────────────────────────────────────────
export const useQuestSteps = (questId: string | undefined) =>
  useQuery({
    queryKey: questKeys.steps(questId ?? ''),
    queryFn: () => api.get<{ data: QuestStep[] }>(`/quests/${questId}/steps`).then(unwrap),
    enabled: !!questId,
  });

export const useCreateStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questId, label }: { questId: string; label: string }) =>
      api.post<{ data: QuestStep }>(`/quests/${questId}/steps`, { label }).then(unwrap),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: questKeys.steps(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.detail(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.all });
    },
  });
};

export const useUpdateStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, body }: { stepId: string; questId: string; body: { label?: string; done?: boolean } }) =>
      api.patch<{ data: { autoCompleteQuestId?: string } }>(`/quests/steps/${stepId}`, body).then(unwrap),
    onSuccess: async (res, vars) => {
      qc.invalidateQueries({ queryKey: questKeys.steps(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.detail(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.all });
      if (res?.autoCompleteQuestId) {
        try {
          await api.patch(`/quests/${res.autoCompleteQuestId}/complete`, {});
          invalidateQuestData(qc);
        } catch {
          /* swallow — UI will refresh on next pull */
        }
      }
    },
  });
};

export const useDeleteStep = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId }: { stepId: string; questId: string }) =>
      api.delete(`/quests/steps/${stepId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: questKeys.steps(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.detail(vars.questId) });
      qc.invalidateQueries({ queryKey: questKeys.all });
    },
  });
};

// ─── Tags ──────────────────────────────────────────────────
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

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quests/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.tags }),
  });
};

// ─── Templates ─────────────────────────────────────────────
export const useQuestTemplates = () =>
  useQuery({
    queryKey: questKeys.templates,
    queryFn: () => api.get<{ data: QuestTemplate[] }>('/quests/templates').then(unwrap),
  });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<QuestTemplate, 'id' | 'useCount' | 'lastUsedAt' | 'createdAt'>) =>
      api.post<{ data: QuestTemplate }>('/quests/templates', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.templates }),
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/quests/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.templates }),
  });
};

export const useUseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ data: Quest }>(`/quests/templates/${id}/use`).then(unwrap),
    onSuccess: () => {
      invalidateQuestData(qc);
      qc.invalidateQueries({ queryKey: questKeys.templates });
    },
  });
};

// ─── Hunt / Rank / Combo / Insights / Challenges ───────────
export const useTodaysHunt = () =>
  useQuery({
    queryKey: questKeys.hunt,
    queryFn: () => api.get<{ data: QuestTodaysHunt }>('/quests/hunt').then(unwrap),
  });

export const useQuestRank = () =>
  useQuery({
    queryKey: questKeys.rank,
    queryFn: () => api.get<{ data: QuestRank }>('/quests/rank').then(unwrap),
  });

export const useQuestCombo = () =>
  useQuery({
    queryKey: questKeys.combo,
    queryFn: () => api.get<{ data: QuestCombo }>('/quests/combo').then(unwrap),
    refetchInterval: 30 * 1000,
  });

export const useQuestInsights = (window?: number) =>
  useQuery({
    queryKey: questKeys.insights(window),
    queryFn: () =>
      api
        .get<{ data: QuestInsights }>('/quests/insights', { params: window ? { window } : undefined })
        .then(unwrap),
  });

export const useQuestChallenges = () =>
  useQuery({
    queryKey: questKeys.challenges,
    queryFn: () => api.get<{ data: QuestChallenge[] }>('/quests/challenges').then(unwrap),
  });

export const useSeedChallenges = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ data: QuestChallenge[] }>('/quests/challenges/seed').then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.challenges }),
  });
};

// ─── Rollover / Auto-archive ───────────────────────────────
export const useRolloverQuests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ data: { rolledOver: number; date: string } }>('/quests/rollover').then(unwrap),
    onSuccess: () => invalidateQuestData(qc),
  });
};

export const useAutoArchive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ data: { archived: number } }>('/quests/auto-archive').then(unwrap),
    onSuccess: () => invalidateQuestData(qc),
  });
};

// ─── Settings ──────────────────────────────────────────────
export const useQuestSettings = () =>
  useQuery({
    queryKey: questKeys.settings,
    queryFn: () => api.get<{ data: QuestSettings }>('/quests/settings').then(unwrap),
  });

export const useUpdateQuestSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Omit<QuestSettings, 'id'>>) =>
      api.put<{ data: QuestSettings }>('/quests/settings', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.settings }),
  });
};

// ─── Timer ─────────────────────────────────────────────────
export const useQuestTimer = () =>
  useQuery({
    queryKey: questKeys.timer,
    queryFn: () => api.get<{ data: QuestActiveTimer | null }>('/quests/timer').then(unwrap),
  });

export const useStartTimer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) =>
      api.post<{ data: QuestActiveTimer }>(`/quests/${questId}/timer/start`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.timer }),
  });
};

export const usePauseTimer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) =>
      api.post<{ data: QuestActiveTimer }>(`/quests/${questId}/timer/pause`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.timer }),
  });
};

export const useStopTimer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questId: string) => api.post(`/quests/${questId}/timer/stop`),
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.timer }),
  });
};

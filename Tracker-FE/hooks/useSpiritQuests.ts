import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { gameKeys } from './useGame';

export interface SpiritQuest {
  id: string;
  date: string;
  questKey: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
  icon: string;
}

export interface SpiritStreakBundle {
  weight: { current: number; longest: number; total: number };
  nutrition: { current: number; longest: number; total: number };
  sleep: { current: number; longest: number; total: number };
  sleepQuality: { current: number; longest: number; total: number };
  habits: { current: number; longest: number; total: number };
  fasting: { current: number; longest: number; total: number };
}

export const spiritGameKeys = {
  quests: ['spirit', 'quests', 'today'] as const,
  streaks: ['spirit', 'streaks'] as const,
};

export const useSpiritQuests = () =>
  useQuery({
    queryKey: spiritGameKeys.quests,
    queryFn: () => api.get<{ data: SpiritQuest[] }>('/spirit/quests/today').then(unwrap),
    refetchInterval: 60_000,
  });

export const useClaimQuest = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  const triggerConfetti = useAppStore((s) => s.triggerConfetti);
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<{ data: { xpEarned: number; newTotalXp: number } }>(`/spirit/quests/${id}/claim`)
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Quest Cleared');
      triggerConfetti();
      qc.invalidateQueries({ queryKey: spiritGameKeys.quests });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useSpiritStreaks = () =>
  useQuery({
    queryKey: spiritGameKeys.streaks,
    queryFn: () => api.get<{ data: SpiritStreakBundle }>('/spirit/streaks').then(unwrap),
  });

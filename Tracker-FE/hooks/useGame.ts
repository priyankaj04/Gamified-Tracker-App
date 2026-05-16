import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, unwrap } from '@/lib/api';
import { notifyAchievement } from '@/lib/notifications';
import { useAppStore } from '@/store/useAppStore';
import type { GameState, XpPenalty } from '@/types';

export const gameKeys = {
  state: ['game'] as const,
};

const SEEN_PENALTIES_KEY = 'kaizenarc:seen-penalty-ids';

const loadSeen = async (): Promise<Set<string>> => {
  try {
    const raw = await AsyncStorage.getItem(SEEN_PENALTIES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const saveSeen = async (ids: Set<string>) => {
  try {
    // Cap to the last 100 — past penalties beyond that are de-facto seen.
    const arr = Array.from(ids).slice(-100);
    await AsyncStorage.setItem(SEEN_PENALTIES_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
};

const MODULE_LABEL: Record<XpPenalty['module'], string> = {
  dojo: 'Dojo',
  forge: 'Forge',
  spirit: 'Spirit',
  vault: 'Vault',
  quests: 'Quests',
};

// Surfaces newly applied penalties to the user: in-app negative popup + a local
// notification if backgrounded. Runs whenever /game/state is refetched.
export const useSurfacePenalties = (state: GameState | undefined) => {
  const pushPopup = useAppStore((s) => s.pushPopup);
  useEffect(() => {
    if (!state?.recentPenalties?.length) return;
    let cancelled = false;
    (async () => {
      const seen = await loadSeen();
      const fresh = state.recentPenalties!.filter((p) => !seen.has(p.id));
      if (cancelled || fresh.length === 0) return;
      for (const p of fresh) {
        const moduleName = MODULE_LABEL[p.module] ?? p.module;
        pushPopup(-p.xpLost, `${moduleName} consistency · ${p.daysLogged}/7 days`);
        await notifyAchievement({
          title: `${moduleName} XP penalty`,
          body: `Logged ${p.daysLogged}/7 days — lost ${p.xpLost} XP.`,
        });
        seen.add(p.id);
      }
      await saveSeen(seen);
    })();
    return () => {
      cancelled = true;
    };
  }, [state?.recentPenalties, pushPopup]);
};

export const useGameState = () => {
  const query = useQuery({
    queryKey: gameKeys.state,
    queryFn: () => api.get<{ data: GameState }>('/game').then(unwrap),
  });
  useSurfacePenalties(query.data);
  return query;
};

export const useUpdateStreak = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (module: string) =>
      api.patch<{ data: any }>(`/game/streak/${module}`, {}).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: gameKeys.state }),
  });
};

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Badge } from '@/types';

export interface XpPopup {
  id: string;
  amount: number;
  label?: string;
}

export interface BadgeUnlock {
  id: string;
  badge: Badge;
}

interface AppState {
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => void;

  // Confetti trigger — increment to replay
  confettiTick: number;
  triggerConfetti: () => void;

  // local optimistic XP display (mirrors server)
  displayXp: number;
  setDisplayXp: (xp: number) => void;
  bumpDisplayXp: (delta: number) => void;

  // ephemeral popup queue (not persisted)
  popups: XpPopup[];
  pushPopup: (amount: number, label?: string) => void;
  dismissPopup: (id: string) => void;

  // Badge reveal queue
  badgeQueue: BadgeUnlock[];
  pushBadgeUnlock: (badge: Badge) => void;
  dismissBadgeUnlock: (id: string) => void;

  // Level-up queue
  levelUpQueue: LevelUpEvent[];
  pushLevelUp: (event: Omit<LevelUpEvent, 'id'>) => void;
  dismissLevelUp: (id: string) => void;
}

export interface LevelUpEvent {
  id: string;
  newLevel: number;
  newTitle: string;
  newColor: string;
  previousLevel: number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hapticsEnabled: true,
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),

      confettiTick: 0,
      triggerConfetti: () => set({ confettiTick: get().confettiTick + 1 }),

      displayXp: 0,
      setDisplayXp: (xp) => set({ displayXp: xp }),
      bumpDisplayXp: (delta) => set({ displayXp: Math.max(0, get().displayXp + delta) }),

      popups: [],
      pushPopup: (amount, label) =>
        set({
          popups: [
            ...get().popups,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, amount, label },
          ],
        }),
      dismissPopup: (id) => set({ popups: get().popups.filter((p) => p.id !== id) }),

      badgeQueue: [],
      pushBadgeUnlock: (badge) =>
        set({
          badgeQueue: [
            ...get().badgeQueue,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, badge },
          ],
        }),
      dismissBadgeUnlock: (id) =>
        set({ badgeQueue: get().badgeQueue.filter((b) => b.id !== id) }),

      levelUpQueue: [],
      pushLevelUp: (event) =>
        set({
          levelUpQueue: [
            ...get().levelUpQueue,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...event },
          ],
        }),
      dismissLevelUp: (id) =>
        set({ levelUpQueue: get().levelUpQueue.filter((l) => l.id !== id) }),
    }),
    {
      name: 'kaizenarc-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hapticsEnabled: s.hapticsEnabled,
        displayXp: s.displayXp,
      }),
    },
  ),
);

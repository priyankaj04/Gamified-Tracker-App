import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface XpPopup {
  id: string;
  amount: number;
  label?: string;
}

interface AppState {
  hapticsEnabled: boolean;
  setHapticsEnabled: (v: boolean) => void;

  // local optimistic XP display (mirrors server)
  displayXp: number;
  setDisplayXp: (xp: number) => void;
  bumpDisplayXp: (delta: number) => void;

  // ephemeral popup queue (not persisted)
  popups: XpPopup[];
  pushPopup: (amount: number, label?: string) => void;
  dismissPopup: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hapticsEnabled: true,
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),

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

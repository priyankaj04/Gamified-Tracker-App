import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { MoodTag, WorkoutType } from '@/types';
import type { ExerciseDraft } from '@/components/workout/ExerciseCard';

const STORAGE_KEY = 'kaizenarc:workout-draft:v1';

export interface WorkoutDraft {
  name: string;
  type: WorkoutType;
  date: string;
  stars: number | null;
  notes: string;
  mood: MoodTag | null;
  exercises: ExerciseDraft[];
  templateId: string | null;
  startedAt: number | null;
  manualDurationMinutes: number | null;
  updatedAt: number;
}

export const emptyDraft = (today: string): WorkoutDraft => ({
  name: '',
  type: 'Strength',
  date: today,
  stars: null,
  notes: '',
  mood: null,
  exercises: [],
  templateId: null,
  startedAt: null,
  manualDurationMinutes: null,
  updatedAt: Date.now(),
});

// AsyncStorage can be unavailable if the native module isn't linked into the
// running dev client (happens after installing new native deps without a
// rebuild). Treat every storage op as best-effort — the workout flow still
// works in memory, you just lose crash-recovery.
const warnOnce = (() => {
  let warned = false;
  return (op: string, err: unknown) => {
    if (warned) return;
    warned = true;
    console.warn(`[workoutDraft] AsyncStorage.${op} failed — drafts won't persist this session.`, err);
  };
})();

export const saveDraft = async (draft: WorkoutDraft): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch (e) {
    warnOnce('setItem', e);
  }
};

export const loadDraft = async (): Promise<WorkoutDraft | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkoutDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (e) {
    warnOnce('getItem', e);
    return null;
  }
};

export const clearDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    warnOnce('removeItem', e);
  }
};

export const hasActiveDraft = async (): Promise<boolean> => {
  const draft = await loadDraft();
  return !!draft && draft.startedAt != null;
};

// Debounced persistence: writes at most once per `delayMs` while values change.
export const useDraftPersistence = (draft: WorkoutDraft | null, delayMs = 600) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!draft) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveDraft(draft).catch(() => {});
    }, delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, delayMs]);
};

// One-shot hydration on mount.
export const useDraftHydration = (
  onHydrate: (draft: WorkoutDraft) => void,
  enabled = true,
) => {
  const [hydrated, setHydrated] = useState(false);
  const handler = useCallback(onHydrate, [onHydrate]);
  useEffect(() => {
    if (!enabled || hydrated) return;
    let cancelled = false;
    loadDraft().then((d) => {
      if (cancelled) return;
      if (d) handler(d);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, hydrated, handler]);
  return hydrated;
};

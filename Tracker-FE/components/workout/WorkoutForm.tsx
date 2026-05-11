import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { StarRating } from '@/components/gamification/StarRating';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { TemplatePicker } from '@/components/workout/TemplatePicker';
import {
  ExerciseCard,
  createExerciseDraft,
  type ExerciseDraft,
} from '@/components/workout/ExerciseCard';
import { MoodTagSelector } from '@/components/workout/MoodTagSelector';
import { WorkoutTimer, elapsedMinutes } from '@/components/workout/WorkoutTimer';
import { RestTimer } from '@/components/workout/RestTimer';
import { useCreateWorkout, usePersonalRecords, useUpdateWorkout, useWorkout } from '@/hooks/useWorkouts';
import { useTemplate } from '@/hooks/useTemplates';
import { api, unwrap } from '@/lib/api';
import {
  clearDraft,
  emptyDraft,
  saveDraft,
  useDraftHydration,
  useDraftPersistence,
  type WorkoutDraft,
} from '@/lib/workoutDraft';
import type { Exercise, MoodTag, WorkoutType } from '@/types';

const TYPES: WorkoutType[] = [
  'Strength', 'Calisthenics', 'Plyometrics', 'HIIT',
  'Cardio', 'Sports', 'Combat', 'Flexibility', 'Mobility', 'Mixed',
];

interface Props {
  mode: 'new' | 'active' | 'edit';
  templateId?: string;
  // Source workout to hydrate from. In 'edit' mode we PUT back to this id;
  // in 'new' mode we treat it as a duplicate (copy exercises, save as new).
  sourceWorkoutId?: string;
}

export function WorkoutForm({ mode, templateId, sourceWorkoutId }: Props) {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const create = useCreateWorkout();
  const update = useUpdateWorkout();
  const sourceWorkout = useWorkout(sourceWorkoutId);
  const templateQuery = useTemplate(templateId);
  const isEdit = mode === 'edit';
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: any }>('/settings').then(unwrap),
  });
  const defaultRestSeconds = settingsQuery.data?.defaultRestSeconds ?? 90;
  const autoStartRest = settingsQuery.data?.autoStartRest ?? true;
  const personalRecords = usePersonalRecords();
  const prByExercise = useMemo(() => {
    const out = new Map<string, { bestWeightKg: number | null; bestReps: number | null }>();
    (personalRecords.data?.records ?? []).forEach((r) => {
      const entry = { bestWeightKg: r.bestWeightKg, bestReps: r.bestReps };
      if (r.exerciseId) out.set(`id:${r.exerciseId}`, entry);
      if (r.exerciseName) out.set(`name:${r.exerciseName}`, entry);
    });
    return out;
  }, [personalRecords.data?.records]);

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>('Strength');
  const [date, setDate] = useState(todayISO());
  const [stars, setStars] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState<MoodTag | null>(null);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [manualDurationStr, setManualDurationStr] = useState('');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [tplPickerOpen, setTplPickerOpen] = useState(false);
  const swapIndexRef = useRef<number | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [restToken, setRestToken] = useState<number | null>(null);
  const isActive = startedAt != null;

  // Hydrate from AsyncStorage on mount (skipped entirely in edit mode — edit
  // hydrates from server). In 'active' mode we *require* a stored draft;
  // in 'new' mode we just resume if present.
  const hydrated = useDraftHydration(
    (draft) => {
      if (draft.name) setName(draft.name);
      if (draft.type) setType(draft.type);
      if (draft.date) setDate(draft.date);
      setStars(draft.stars);
      setNotes(draft.notes);
      setMood(draft.mood);
      setExercises(draft.exercises);
      setStartedAt(draft.startedAt);
      if (draft.manualDurationMinutes != null) {
        setManualDurationStr(String(draft.manualDurationMinutes));
      }
    },
    !isEdit,
  );

  // Hydrate from a source workout (edit OR duplicate).
  const [hydratedFromSource, setHydratedFromSource] = useState(false);
  useEffect(() => {
    if (!sourceWorkoutId || hydratedFromSource) return;
    const w = sourceWorkout.data;
    if (!w) return;
    if (isEdit) {
      setName(w.name);
      setType(w.type as WorkoutType);
      setDate(w.date);
      setStars(w.stars ?? null);
      setNotes(w.notes ?? '');
      setMood((w as any).moodTag ?? null);
      if (w.durationMinutes != null) setManualDurationStr(String(w.durationMinutes));
    } else {
      // duplicate — keep date today, fresh name suffix
      setName(`${w.name} (copy)`);
      setType(w.type as WorkoutType);
    }
    setExercises(
      (w.exercises ?? []).map((ex) =>
        createExerciseDraft({
          exerciseId: ex.exerciseId ?? undefined,
          name: ex.name,
          sets: ex.sets.map((s) => ({
            reps: s.reps ?? null,
            weightKg: s.weightKg ?? null,
            setType: s.setType,
          })),
        }),
      ),
    );
    setHydratedFromSource(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceWorkout.data?.id, sourceWorkoutId]);

  // If we're on the active-workout route but no draft was found, bounce back.
  useEffect(() => {
    if (mode !== 'active' || !hydrated) return;
    if (startedAt == null) {
      router.replace('/dojo/new-workout');
    }
  }, [mode, hydrated, startedAt, router]);

  const manualDurationMinutes = useMemo(() => {
    const n = parseInt(manualDurationStr, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [manualDurationStr]);

  // Persist draft (debounced).
  const currentDraft = useMemo<WorkoutDraft>(
    () => ({
      name,
      type,
      date,
      stars,
      notes,
      mood,
      exercises,
      templateId: templateId ?? null,
      startedAt,
      manualDurationMinutes,
      updatedAt: Date.now(),
    }),
    [name, type, date, stars, notes, mood, exercises, templateId, startedAt, manualDurationMinutes],
  );
  // Only persist after first hydration completes — avoids overwriting stored draft with empty initial state.
  // Skip persistence in edit mode (editing a past workout shouldn't touch the current-session draft).
  useDraftPersistence(!isEdit && hydrated ? currentDraft : null);

  // Hydrate from template (only if no draft already populated us).
  useEffect(() => {
    if (!templateQuery.data) return;
    if (!hydrated) return;
    if (exercises.length > 0) return; // draft restored — don't clobber
    const tpl = templateQuery.data;
    if (!name) setName(tpl.name);
    setType((tpl.type as WorkoutType) ?? 'Strength');
    setExercises(
      tpl.exercises.map((te) =>
        createExerciseDraft({
          exerciseId: te.exerciseId,
          name: te.exerciseName ?? 'Exercise',
          musclePrimary: te.musclePrimary,
          equipment: te.equipment,
          sets: te.sets.map((s) => ({
            reps: s.targetReps,
            weightKg: s.targetWeightKg,
            setType: s.setType,
          })),
        }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateQuery.data?.id, hydrated]);

  const handlePick = (picked: Exercise[]) => {
    setExercises((cur) => [
      ...cur,
      ...picked.map((p) =>
        createExerciseDraft({
          exerciseId: p.id,
          name: p.name,
          musclePrimary: p.musclePrimary,
          equipment: p.equipment,
        }),
      ),
    ]);
  };

  const handleSwap = (picked: Exercise[]) => {
    if (swapIndexRef.current == null || picked.length === 0) return;
    const idx = swapIndexRef.current;
    const ex = picked[0];
    setExercises((cur) =>
      cur.map((d, i) =>
        i === idx
          ? { ...d, exerciseId: ex.id, name: ex.name, musclePrimary: ex.musclePrimary, equipment: ex.equipment }
          : d,
      ),
    );
    swapIndexRef.current = null;
  };

  const totalSets = useMemo(() => exercises.reduce((s, e) => s + e.sets.length, 0), [exercises]);
  const completedSets = useMemo(
    () => exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0),
    [exercises],
  );

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Add at least one exercise');
      return;
    }
    // Prefer real timer when active; otherwise fall back to manually-entered duration.
    const resolvedDuration = startedAt
      ? elapsedMinutes(startedAt)
      : manualDurationMinutes ?? undefined;
    const payload = {
      name: name.trim(),
      type,
      date,
      durationMinutes: resolvedDuration,
      stars: stars ?? undefined,
      notes: notes || undefined,
      moodTag: mood ?? undefined,
      templateId: templateId ?? null,
      exercises: exercises.map((e) => ({
        name: e.name,
        exerciseId: e.exerciseId,
        notes: e.notes,
        sets: e.sets
          .filter((s) => s.reps || s.weightKg || s.completed)
          .map((s) => ({
            reps: s.reps ? parseInt(s.reps, 10) : undefined,
            weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
            setType: s.setType,
          })),
      })),
    };
    try {
      if (isEdit && sourceWorkoutId) {
        await update.mutateAsync({ id: sourceWorkoutId, body: payload });
      } else {
        await create.mutateAsync(payload);
        await clearDraft();
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save workout');
    }
  };

  const onCancelWorkout = () => {
    Alert.alert('Cancel workout?', 'Logged sets will be lost.', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await clearDraft();
          router.back();
        },
      },
    ]);
  };

  const onStart = async () => {
    const startTime = Date.now();
    setStartedAt(startTime);
    // Immediately persist so navigating to /dojo/active-workout finds the active draft.
    await saveDraft({
      name,
      type,
      date,
      stars,
      notes,
      mood,
      exercises,
      templateId: templateId ?? null,
      startedAt: startTime,
      manualDurationMinutes,
      updatedAt: startTime,
    });
    if (mode === 'new') {
      router.replace('/dojo/active-workout');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled">
        {/* Top row: timer + active state badge */}
        <View style={styles.topRow}>
          <WorkoutTimer
            running={isActive}
            startedAt={startedAt}
            accent={accent}
            onToggle={() => setStartedAt(isActive ? null : Date.now())}
          />
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.activeText, { color: accent }]}>● LIVE · {completedSets}/{totalSets} sets</Text>
            </View>
          )}
          {isActive && (
            <Pressable onPress={onCancelWorkout} hitSlop={8}>
              <Text style={[styles.cancelText, { color: palette.textMuted }]}>Cancel</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Push Day"
          placeholderTextColor={palette.textDim}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.typeText, active && { color: accent }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Date</Text>
        <DatePicker value={date} onChange={setDate} accent={accent} />

        <Text style={styles.label}>Duration (min)</Text>
        <View style={styles.durationRow}>
          <TextInput
            value={isActive ? String(elapsedMinutes(startedAt!)) : manualDurationStr}
            onChangeText={(v) => setManualDurationStr(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            editable={!isActive}
            placeholder={isActive ? '' : 'e.g. 45'}
            placeholderTextColor={palette.textDim}
            style={[styles.input, styles.durationInput, isActive && { opacity: 0.6 }]}
          />
          <Text style={styles.durationHint}>
            {isActive ? 'Counting from timer' : 'Optional — fill in if you didn\'t use the timer'}
          </Text>
        </View>

        <Text style={styles.label}>Exercises</Text>
        <View style={{ gap: 10 }}>
          {exercises.map((ex, i) => {
            const prKey = ex.exerciseId ? `id:${ex.exerciseId}` : `name:${ex.name}`;
            return (
              <ExerciseCard
                key={ex.id}
                draft={ex}
                index={i}
                isActive={isActive}
                accent={accent}
                pr={prByExercise.get(prKey)}
                onUpdate={(next) =>
                  setExercises((cur) => cur.map((d, idx) => (idx === i ? next : d)))
                }
                onRemove={() => setExercises((cur) => cur.filter((_, idx) => idx !== i))}
                onSwap={() => {
                  swapIndexRef.current = i;
                  setSwapOpen(true);
                }}
                onMoveUp={
                  i > 0
                    ? () =>
                        setExercises((cur) => {
                          const next = [...cur];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          return next;
                        })
                    : undefined
                }
                onMoveDown={
                  i < exercises.length - 1
                    ? () =>
                        setExercises((cur) => {
                          const next = [...cur];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          return next;
                        })
                    : undefined
                }
                onCompleteSet={() => {
                  if (autoStartRest) setRestToken(Date.now());
                }}
              />
            );
          })}
          <View style={styles.addRow}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={[styles.addExBtn, { borderColor: accent + '66', flex: 1 }]}>
              <Ionicons name="add-circle-outline" size={20} color={accent} />
              <Text style={[styles.addExText, { color: accent }]}>
                {exercises.length === 0 ? 'Add exercises' : 'Add another'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTplPickerOpen(true)}
              style={[styles.addExBtn, { borderColor: accent + '66', flex: 1 }]}>
              <Ionicons name="albums-outline" size={20} color={accent} />
              <Text style={[styles.addExText, { color: accent }]}>From template</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.label}>How did it feel?</Text>
        <StarRating value={stars} onChange={setStars} />

        <Text style={styles.label}>Mood</Text>
        <MoodTagSelector value={mood} onChange={setMood} />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="Anything to remember…"
          placeholderTextColor={palette.textDim}
        />

        <View style={{ height: 12 }} />
        <GlowButton
          title={isActive ? 'Finish & Save' : exercises.length > 0 ? 'Start Workout' : 'Save'}
          color={accent}
          loading={create.isPending}
          onPress={() => {
            if (exercises.length > 0 && !isActive) {
              onStart();
            } else {
              onSave();
            }
          }}
        />
        {isActive && (
          <GlowButton
            title="Save Now"
            color={accent}
            variant="ghost"
            onPress={onSave}
            loading={create.isPending}
          />
        )}
      </ScrollView>

      <RestTimer
        restSeconds={restToken ? defaultRestSeconds : null}
        defaultSeconds={defaultRestSeconds}
        accent={accent}
        onDone={() => setRestToken(null)}
        onCancel={() => setRestToken(null)}
      />

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
        accent={accent}
        mode="multi"
      />

      <TemplatePicker
        visible={tplPickerOpen}
        onClose={() => setTplPickerOpen(false)}
        onSelect={(drafts) => setExercises((cur) => [...cur, ...drafts])}
      />
      <ExercisePicker
        visible={swapOpen}
        onClose={() => {
          setSwapOpen(false);
          swapIndexRef.current = null;
        }}
        onSelect={handleSwap}
        accent={accent}
        mode="single"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  activeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  cancelText: { marginLeft: 'auto', fontWeight: '700', fontSize: 13 },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeBtn: {
    flexGrow: 1,
    minWidth: '18%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  typeText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 8 },
  durationRow: { gap: 6 },
  durationInput: { width: 120 },
  durationHint: { color: palette.textDim, fontSize: 11, fontStyle: 'italic' },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addExText: { fontWeight: '800', fontSize: 13 },
});

import React, { useState } from 'react';
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

import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { StarRating } from '@/components/gamification/StarRating';
import { useCreateWorkout } from '@/hooks/useWorkouts';
import type { WorkoutType } from '@/types';

const TYPES: WorkoutType[] = ['Strength', 'Cardio', 'Flexibility', 'Combat'];

interface SetRow {
  reps: string;
  weightKg: string;
}
interface ExerciseRow {
  name: string;
  sets: SetRow[];
}

export default function NewWorkout() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const create = useCreateWorkout();

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>('Strength');
  const [duration, setDuration] = useState('');
  const [stars, setStars] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseRow[]>([
    { name: '', sets: [{ reps: '', weightKg: '' }] },
  ]);

  const addExercise = () =>
    setExercises((e) => [...e, { name: '', sets: [{ reps: '', weightKg: '' }] }]);
  const removeExercise = (i: number) =>
    setExercises((e) => e.filter((_, idx) => idx !== i));
  const updateExerciseName = (i: number, n: string) =>
    setExercises((e) => e.map((x, idx) => (idx === i ? { ...x, name: n } : x)));
  const addSet = (i: number) =>
    setExercises((e) =>
      e.map((x, idx) =>
        idx === i ? { ...x, sets: [...x.sets, { reps: '', weightKg: '' }] } : x,
      ),
    );
  const updateSet = (i: number, j: number, field: 'reps' | 'weightKg', value: string) =>
    setExercises((e) =>
      e.map((x, idx) =>
        idx === i
          ? {
              ...x,
              sets: x.sets.map((s, sIdx) => (sIdx === j ? { ...s, [field]: value } : s)),
            }
          : x,
      ),
    );

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }
    const payload = {
      name: name.trim(),
      type,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      stars: stars ?? undefined,
      notes: notes || undefined,
      exercises: exercises
        .filter((x) => x.name.trim())
        .map((x) => ({
          name: x.name.trim(),
          sets: x.sets
            .filter((s) => s.reps || s.weightKg)
            .map((s) => ({
              reps: s.reps ? parseInt(s.reps, 10) : undefined,
              weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
            })),
        })),
    };
    try {
      await create.mutateAsync(payload);
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save workout');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Push Day" placeholderTextColor={palette.textDim} />

      <Text style={styles.fieldLabel}>Type</Text>
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

      <Text style={styles.fieldLabel}>Duration (min)</Text>
      <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={styles.input} placeholderTextColor={palette.textDim} />

      <Text style={styles.fieldLabel}>How did it feel?</Text>
      <StarRating value={stars} onChange={setStars} />

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, { height: 80 }]}
        multiline
        placeholderTextColor={palette.textDim}
      />

      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Exercises</Text>
      {exercises.map((ex, i) => (
        <View key={i} style={styles.exCard}>
          <View style={styles.exHead}>
            <TextInput
              value={ex.name}
              onChangeText={(v) => updateExerciseName(i, v)}
              style={[styles.input, { flex: 1 }]}
              placeholder={`Exercise ${i + 1}`}
              placeholderTextColor={palette.textDim}
            />
            {exercises.length > 1 && (
              <Pressable onPress={() => removeExercise(i)} hitSlop={6}>
                <Ionicons name="trash-outline" size={22} color={palette.danger} />
              </Pressable>
            )}
          </View>
          <View style={styles.setHeader}>
            <Text style={styles.setHeadCol}>SET</Text>
            <Text style={styles.setHeadCol}>REPS</Text>
            <Text style={styles.setHeadCol}>KG</Text>
          </View>
          {ex.sets.map((s, j) => (
            <View key={j} style={styles.setRow}>
              <Text style={styles.setIdx}>{j + 1}</Text>
              <TextInput
                value={s.reps}
                onChangeText={(v) => updateSet(i, j, 'reps', v)}
                keyboardType="numeric"
                style={styles.setInput}
                placeholderTextColor={palette.textDim}
              />
              <TextInput
                value={s.weightKg}
                onChangeText={(v) => updateSet(i, j, 'weightKg', v)}
                keyboardType="decimal-pad"
                style={styles.setInput}
                placeholderTextColor={palette.textDim}
              />
            </View>
          ))}
          <Pressable onPress={() => addSet(i)} style={styles.addSet}>
            <Ionicons name="add" size={16} color={accent} />
            <Text style={[styles.addSetText, { color: accent }]}>Add set</Text>
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addExercise} style={[styles.addEx, { borderColor: accent + '66' }]}>
        <Ionicons name="add-circle-outline" size={18} color={accent} />
        <Text style={[styles.addExText, { color: accent }]}>Add exercise</Text>
      </Pressable>

      <View style={{ height: 16 }} />
      <GlowButton title="Save Workout" color={accent} onPress={onSave} loading={create.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
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
    minWidth: '23%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  typeText: { color: palette.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  exCard: {
    backgroundColor: palette.cardAlt,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setHeader: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginTop: 6 },
  setHeadCol: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, flex: 1 },
  setRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  setIdx: { color: palette.text, fontWeight: '800', width: 30, textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  addSetText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  addEx: {
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

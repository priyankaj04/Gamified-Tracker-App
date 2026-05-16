import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import {
  ExerciseCard,
  createExerciseDraft,
  type ExerciseDraft,
} from '@/components/workout/ExerciseCard';
import { useCreateTemplate, useUpdateTemplate, type TemplateBody } from '@/hooks/useTemplates';
import type { Exercise, WorkoutTemplate, WorkoutType } from '@/types';

const TYPES: WorkoutType[] = [
  'Strength', 'Calisthenics', 'Plyometrics', 'HIIT',
  'Cardio', 'Sports', 'Combat', 'Flexibility', 'Mobility', 'Mixed',
];

interface Props {
  initial?: WorkoutTemplate;
}

export function TemplateEditor({ initial }: Props) {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const create = useCreateTemplate();
  const update = useUpdateTemplate();

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<WorkoutType>((initial?.type as WorkoutType) ?? 'Strength');
  const [estMinutes, setEstMinutes] = useState(String(initial?.estimatedMinutes ?? 60));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    initial?.exercises.map((te) =>
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
    ) ?? [],
  );

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

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Name required');
    if (exercises.length === 0) return Alert.alert('Add at least one exercise');
    const payload: TemplateBody = {
      name: name.trim(),
      type,
      estimatedMinutes: parseInt(estMinutes, 10) || 60,
      notes: notes || undefined,
      exercises: exercises
        .filter((e) => e.exerciseId)
        .map((e) => ({
          exerciseId: e.exerciseId!,
          sets: e.sets.map((s) => ({
            setType: s.setType,
            targetReps: s.reps ? parseInt(s.reps, 10) : undefined,
            targetWeightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
          })),
        })),
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, body: payload });
      else await create.mutateAsync(payload);
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save template');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled">
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

        <Text style={styles.label}>Estimated Duration (min)</Text>
        <TextInput
          value={estMinutes}
          onChangeText={setEstMinutes}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={palette.textDim}
        />

        <Text style={styles.label}>Exercises</Text>
        <View style={{ gap: 10 }}>
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              draft={ex}
              index={i}
              isActive={false}
              accent={accent}
              onUpdate={(next) =>
                setExercises((cur) => cur.map((d, idx) => (idx === i ? next : d)))
              }
              onRemove={() => setExercises((cur) => cur.filter((_, idx) => idx !== i))}
            />
          ))}
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.addExBtn, { borderColor: accent + '66' }]}>
            <Ionicons name="add-circle-outline" size={20} color={accent} />
            <Text style={[styles.addExText, { color: accent }]}>
              {exercises.length === 0 ? 'Add exercises' : 'Add another exercise'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          multiline
          placeholderTextColor={palette.textDim}
        />

        <View style={{ height: 12 }} />
        <GlowButton
          title={initial ? 'Save changes' : 'Create template'}
          color={accent}
          loading={create.isPending || update.isPending}
          onPress={onSave}
        />
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePick}
        accent={accent}
        mode="multi"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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

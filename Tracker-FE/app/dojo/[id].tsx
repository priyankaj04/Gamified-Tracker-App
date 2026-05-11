import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { StarRating } from '@/components/gamification/StarRating';
import { Skeleton } from '@/components/layout/Skeleton';
import {
  useWorkout,
  useDeleteWorkout,
  useSaveWorkoutAsTemplate,
} from '@/hooks/useWorkouts';
import type { SetType } from '@/types';

const SET_TYPE_META: Record<SetType, { label: string; color: string }> = {
  Normal: { label: 'N', color: '#a78bfa' },
  Warmup: { label: 'W', color: '#fbbf24' },
  DropSet: { label: 'D', color: '#22d3ee' },
  Failure: { label: 'F', color: '#ef4444' },
  AMRAP: { label: 'A', color: '#4ade80' },
};

const MOOD_LABEL: Record<string, string> = {
  CrushedIt: 'Crushed it 💪',
  Solid: 'Solid 🙂',
  Average: 'Average 😐',
  Rough: 'Rough 😣',
  Struggled: 'Struggled 😵',
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data, isLoading } = useWorkout(id);
  const del = useDeleteWorkout();
  const saveAsTpl = useSaveWorkoutAsTemplate();

  if (isLoading || !data) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={styles.scroll}>
        <Skeleton height={28} width="60%" />
        <Skeleton height={14} width="40%" style={{ marginTop: 8 }} />
        <Skeleton height={100} style={{ marginTop: 16 }} />
        <Skeleton height={140} style={{ marginTop: 8 }} />
        <Skeleton height={140} style={{ marginTop: 8 }} />
      </ScrollView>
    );
  }

  const w = data as any;

  const onDelete = () => {
    Alert.alert('Delete this workout?', `${w.name} · ${new Date(w.date).toLocaleDateString()}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await del.mutateAsync(id);
            router.back();
          } catch (e: any) {
            Alert.alert('Failed', e.message ?? 'Could not delete');
          }
        },
      },
    ]);
  };

  const onSaveAsTemplate = () => {
    Alert.alert('Save as template?', 'Create a reusable template from this workout.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          try {
            const res = await saveAsTpl.mutateAsync({ id });
            Alert.alert('Saved', `Template "${res.name}" created.`);
          } catch (e: any) {
            Alert.alert('Failed', e.message ?? 'Could not save template');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>{w.name}</Text>
      <Text style={styles.subtitle}>
        {w.type} · {new Date(w.date).toLocaleDateString()} · {w.durationMinutes ?? '—'} min
      </Text>
      <View style={styles.headerRow}>
        <StarRating value={w.stars} readOnly size={18} />
        <Text style={[styles.xp, { color: accent }]}>+{w.xpEarned} XP</Text>
      </View>

      <View style={styles.actionRow}>
        <ActionBtn
          icon="pencil"
          label="Edit"
          color={accent}
          onPress={() => router.push(`/dojo/edit-workout/${id}` as any)}
        />
        <ActionBtn
          icon="copy"
          label="Duplicate"
          color={accent}
          onPress={() => router.push({ pathname: '/dojo/new-workout', params: { duplicateFromId: id } } as any)}
        />
        <ActionBtn
          icon="albums"
          label="Template"
          color={accent}
          onPress={onSaveAsTemplate}
          loading={saveAsTpl.isPending}
        />
        <ActionBtn
          icon="trash"
          label="Delete"
          color={palette.danger}
          onPress={onDelete}
          loading={del.isPending}
        />
      </View>

      {/* Aggregate totals */}
      {(w.totalVolumeKg > 0 || w.totalSets > 0) && (
        <View style={styles.statRow}>
          <StatBlock label="Volume" value={`${Math.round(w.totalVolumeKg ?? 0)} kg`} />
          <StatBlock label="Sets" value={`${w.totalSets ?? 0}`} />
          <StatBlock label="Reps" value={`${w.totalReps ?? 0}`} />
        </View>
      )}

      {w.moodTag && MOOD_LABEL[w.moodTag] && (
        <View style={styles.moodPill}>
          <Text style={styles.moodText}>{MOOD_LABEL[w.moodTag]}</Text>
        </View>
      )}

      {w.notes && (
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.body}>{w.notes}</Text>
        </View>
      )}

      <Text style={[styles.label, { marginTop: 14 }]}>Exercises</Text>
      <View style={{ gap: 8 }}>
        {(w.exercises ?? []).map((ex: any) => (
          <View key={ex.id} style={styles.exCard}>
            <Text style={styles.exName}>{ex.name}</Text>
            {ex.sets.map((s: any, i: number) => {
              const meta = SET_TYPE_META[s.setType as SetType] ?? SET_TYPE_META.Normal;
              return (
                <View key={s.id ?? i} style={styles.setRow}>
                  <Text style={styles.setIdx}>{i + 1}</Text>
                  <View style={[styles.setTypeBadge, { borderColor: meta.color + '99', backgroundColor: meta.color + '22' }]}>
                    <Text style={[styles.setTypeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={styles.setMeta}>
                    {s.reps ? `${s.reps} reps` : ''}
                    {s.weightKg ? ` × ${s.weightKg}kg` : ''}
                    {s.durationSeconds ? ` · ${s.durationSeconds}s` : ''}
                  </Text>
                  {s.isPr && (
                    <View style={[styles.prBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
                      <Ionicons name="trophy" size={10} color={accent} />
                      <Text style={[styles.prTag, { color: accent }]}>PR</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionBtn,
        { borderColor: color + '66', backgroundColor: color + '15' },
        pressed && { opacity: 0.7 },
      ]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 12, paddingBottom: 60 },
  title: { color: palette.text, fontSize: 26, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xp: { fontSize: 14, fontWeight: '800' },

  actionRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },

  statRow: { flexDirection: 'row', gap: 8 },
  statBlock: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: { color: palette.text, fontSize: 16, fontWeight: '900', marginTop: 2 },

  moodPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  moodText: { color: palette.text, fontSize: 12, fontWeight: '700' },

  card: { backgroundColor: palette.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: palette.border, gap: 4 },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { color: palette.text, fontSize: 14, lineHeight: 20 },

  exCard: { backgroundColor: palette.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: palette.border, gap: 6 },
  exName: { color: palette.text, fontWeight: '800', fontSize: 15 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setIdx: { color: palette.textMuted, width: 18, textAlign: 'center', fontWeight: '700' },
  setTypeBadge: {
    width: 24,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeText: { fontSize: 10, fontWeight: '900' },
  setMeta: { color: palette.text, fontSize: 13, flex: 1 },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  prTag: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
});

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { ActivityGrid } from '@/components/ui/ActivityGrid';
import { EmptyState } from '@/components/layout/EmptyState';
import { StarRating } from '@/components/gamification/StarRating';
import { useWorkouts, useWorkoutGrid, usePersonalRecords } from '@/hooks/useWorkouts';
import { useGameState } from '@/hooks/useGame';

const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

export default function DojoScreen() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const accent2 = screenTheme.dojo.accent2;
  const workouts = useWorkouts({ limit: 50 });
  const grid = useWorkoutGrid();
  const records = usePersonalRecords();
  const game = useGameState();
  const [prOpen, setPrOpen] = useState(false);

  const list = workouts.data?.workouts ?? [];
  const total = workouts.data?.total ?? 0;
  const sow = startOfWeek();
  const thisWeek = list.filter((w) => new Date(w.date) >= sow).length;
  const streak = game.data?.streaks?.dojo?.count ?? 0;
  const prCount = records.data?.records?.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={workouts.isFetching || grid.isFetching}
            onRefresh={() => {
              workouts.refetch();
              grid.refetch();
              records.refetch();
            }}
          />
        }>
        <PageHeader
          title="Dojo"
          subtitle="Train Hard"
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="flame" size={28} color={accent} />}
        />

        <View style={styles.stats}>
          <StatCard label="Total" value={total} icon="barbell" accent={accent} />
          <StatCard label="This Week" value={thisWeek} icon="calendar" accent={accent} />
          <StatCard label="Streak" value={streak} icon="flame" accent="#f97316" />
          <StatCard label="PRs" value={prCount} icon="trophy" accent="#fbbf24" />
        </View>

        <SectionTitle title="Last 90 Days" accent={accent} />
        <ActivityGrid data={grid.data?.grid ?? []} accent={accent} />

        <SectionTitle title="Workouts" accent={accent} />
        {list.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="barbell"
              title="No workouts yet"
              message="Tap the + button to log your first one."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {list.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => router.push(`/dojo/${w.id}` as any)}
                style={({ pressed }) => [styles.workoutRow, pressed && { opacity: 0.7 }]}>
                <View style={[styles.typeBadge, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
                  <Text style={[styles.typeText, { color: accent }]}>{w.type[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName} numberOfLines={1}>
                    {w.name}
                  </Text>
                  <Text style={styles.workoutMeta}>
                    {new Date(w.date).toLocaleDateString()} · {w.durationMinutes ?? '—'} min
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <StarRating value={w.stars} readOnly size={12} />
                  <Text style={[styles.xp, { color: accent }]}>+{w.xpEarned} XP</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <SectionTitle
          title="Personal Records"
          accent={accent}
          right={
            <Pressable onPress={() => setPrOpen((v) => !v)} hitSlop={8}>
              <Ionicons
                name={prOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={palette.textMuted}
              />
            </Pressable>
          }
        />
        {prOpen && (
          <View style={{ paddingHorizontal: 20, gap: 6 }}>
            {(records.data?.records ?? []).map((r) => (
              <View key={r.id} style={styles.prRow}>
                <Text style={styles.prName}>{r.exerciseName}</Text>
                <Text style={styles.prBest}>
                  {r.bestWeightKg ? `${r.bestWeightKg}kg` : ''} {r.bestReps ? `× ${r.bestReps}` : ''}
                </Text>
                <Text style={styles.prDate}>{new Date(r.achievedAt).toLocaleDateString()}</Text>
              </View>
            ))}
            {(records.data?.records?.length ?? 0) === 0 && (
              <Text style={{ color: palette.textMuted, fontSize: 13 }}>No PRs yet.</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => router.push('/dojo/new-workout' as any)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  typeBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeText: { fontSize: 16, fontWeight: '900' },
  workoutName: { color: palette.text, fontSize: 15, fontWeight: '700' },
  workoutMeta: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  xp: { fontSize: 12, fontWeight: '800' },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  prName: { color: palette.text, fontWeight: '700', flex: 1, fontSize: 13 },
  prBest: { color: '#fbbf24', fontWeight: '800', fontSize: 13 },
  prDate: { color: palette.textMuted, fontSize: 11 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});

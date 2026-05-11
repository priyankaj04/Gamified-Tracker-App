import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart } from '@/components/charts/BarChart';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useAllTimeStats,
  useWeeklyStats,
  useMuscleStats,
} from '@/hooks/useWorkouts';
import { useSettings, toDisplayWeight } from '@/hooks/useSettings';

const RANGE_OPTIONS = [4, 8, 12, 26] as const;
type Range = (typeof RANGE_OPTIONS)[number];
const MUSCLE_TARGET_SETS_PER_WEEK = 16; // industry rule-of-thumb: 10–20 sets/wk per muscle

export default function StatsScreen() {
  const accent = screenTheme.dojo.accent;
  const [weeks, setWeeks] = useState<Range>(12);
  const weekly = useWeeklyStats(weeks);
  const muscle = useMuscleStats(4);
  const all = useAllTimeStats();
  const settings = useSettings();
  const unit = settings.data?.weightUnit ?? 'kg';
  const winW = Dimensions.get('window').width;

  const fmtVolume = (kg: number) => {
    const v = toDisplayWeight(kg, unit) ?? 0;
    if (v > 1000) return `${(v / 1000).toFixed(1)}t`;
    return `${Math.round(v)}`;
  };

  const weeklyBars = useMemo(
    () =>
      (weekly.data?.week ?? []).map((w) => ({
        label: w.weekStart.slice(5),
        value: w.workouts,
      })),
    [weekly.data],
  );
  const volumeBars = useMemo(
    () =>
      (weekly.data?.week ?? []).map((w) => ({
        label: w.weekStart.slice(5),
        value: w.volume,
      })),
    [weekly.data],
  );

  const refetchAll = () => {
    weekly.refetch();
    muscle.refetch();
    all.refetch();
  };
  const fetching = weekly.isFetching || muscle.isFetching || all.isFetching;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl tintColor={accent} refreshing={fetching} onRefresh={refetchAll} />}>
        <Text style={styles.section}>All-time</Text>
        <View style={styles.stats}>
          <StatCard label="Workouts" value={all.data?.totalWorkouts ?? 0} icon="barbell" accent={accent} />
          <StatCard
            label={`Volume (${unit})`}
            value={fmtVolume(all.data?.totalVolumeKg ?? 0)}
            icon="trending-up"
            accent={accent}
          />
          <StatCard label="Minutes" value={all.data?.totalMinutes ?? 0} icon="time" accent={accent} />
          <StatCard label="PRs" value={all.data?.totalPRs ?? 0} icon="trophy" accent="#fbbf24" />
        </View>

        <View style={[styles.summaryRow, { marginTop: 10 }]}>
          <SummaryItem label="Favorite Exercise" value={all.data?.favoriteExercise ?? '—'} accent={accent} />
          <SummaryItem label="Top Muscle" value={all.data?.topMuscle ?? '—'} accent={accent} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryItem label="Current Streak" value={`${all.data?.currentStreak ?? 0} 🔥`} accent="#f97316" />
          <SummaryItem label="Longest Streak" value={`${all.data?.longestStreak ?? 0} 🔥`} accent="#f97316" />
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((r) => {
            const active = weeks === r;
            return (
              <Pressable
                key={r}
                onPress={() => setWeeks(r)}
                style={[styles.rangeBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.rangeText, active && { color: accent }]}>{r}w</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Workouts / week ({weeks} weeks)</Text>
        <View style={styles.chartCard}>
          {weeklyBars.length ? (
            <BarChart bars={weeklyBars} color={accent} width={winW - 64} height={160} />
          ) : (
            <EmptyState icon="bar-chart" title="No data yet" accent={accent} />
          )}
        </View>

        <Text style={styles.section}>Volume / week ({unit})</Text>
        <View style={styles.chartCard}>
          {volumeBars.length ? (
            <BarChart
              bars={volumeBars}
              color="#fbbf24"
              width={winW - 64}
              height={160}
              valueFormatter={(v) => fmtVolume(v)}
            />
          ) : (
            <EmptyState icon="bar-chart" title="No data yet" accent={accent} />
          )}
        </View>

        <View style={styles.targetRow}>
          <Text style={styles.section}>Muscle group frequency (sets / wk · last 4 wks)</Text>
          <Text style={styles.targetPill}>Target: {MUSCLE_TARGET_SETS_PER_WEEK}/wk</Text>
        </View>
        <View style={{ gap: 6 }}>
          {(muscle.data?.muscles ?? []).map((m) => {
            const pct = Math.min(1, m.setsPerWeek / MUSCLE_TARGET_SETS_PER_WEEK);
            return (
              <View key={m.muscle} style={styles.muscleRow}>
                <Text style={styles.muscleLabel}>{m.muscle}</Text>
                <View style={styles.muscleBarTrack}>
                  <View style={[styles.muscleBarFill, { width: `${pct * 100}%`, backgroundColor: pct < 0.6 ? accent : '#4ade80' }]} />
                </View>
                <Text style={styles.muscleVal}>
                  {m.setsPerWeek.toFixed(1)} / wk
                </Text>
              </View>
            );
          })}
          {(muscle.data?.muscles ?? []).length === 0 && (
            <EmptyState icon="body" title="No muscle data" accent={accent} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryItem({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryVal, { color: accent }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    flex: 1,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  summaryItem: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryVal: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  chartCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  muscleLabel: { color: palette.text, fontSize: 12, fontWeight: '700', width: 96 },
  muscleBarTrack: { flex: 1, height: 6, backgroundColor: palette.cardAlt, borderRadius: 3, overflow: 'hidden' },
  muscleBarFill: { height: '100%', borderRadius: 3 },
  muscleVal: { color: palette.textMuted, fontSize: 11, fontWeight: '700', width: 64, textAlign: 'right' },
  rangeRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  rangeText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  targetPill: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cardAlt,
  },
});

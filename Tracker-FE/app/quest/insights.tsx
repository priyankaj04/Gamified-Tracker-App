import React, { useMemo } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { TrendLine } from '@/components/charts/TrendLine';
import { HabitGrid } from '@/components/spirit/HabitGrid';
import { useQuestInsights, useQuestRank } from '@/hooks/useQuests';
import { useGameState } from '@/hooks/useGame';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;

export default function QuestInsightsScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const insightsQ = useQuestInsights();
  const rankQ = useQuestRank();
  const gameQ = useGameState();

  const data = insightsQ.data;

  const heatmapCells = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const e of data.heatmap) map.set(e.date, e.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells: { date: string; completed: boolean }[] = [];
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      cells.push({ date: iso, completed: (map.get(iso) ?? 0) > 0 });
    }
    return cells;
  }, [data]);

  const priorityDonutSlices = useMemo(() => {
    if (!data) return [];
    return data.priorityMix.map((p) => ({
      label: p.label,
      value: p.value,
      color: priorityColor[p.label as 'S' | 'A' | 'B' | 'C'] ?? palette.textMuted,
    }));
  }, [data]);

  const xpTrendValues = useMemo(() => {
    if (!data) return { values: [], labels: [] };
    const sorted = [...data.xpTrend].sort((a, b) => a.date.localeCompare(b.date)).slice(-28);
    return {
      values: sorted.map((p) => p.value),
      labels: sorted.map((p) => p.date.slice(5)),
    };
  }, [data]);

  const tagBars = useMemo(() => {
    if (!data) return [];
    return data.tagRates
      .slice()
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 8)
      .map((t) => ({ label: t.name, value: t.rate }));
  }, [data]);

  const hourTotals = useMemo(() => {
    if (!data) return Array(24).fill(0);
    const out = Array(24).fill(0);
    for (const day of data.hourMap) for (let h = 0; h < 24; h++) out[h] += day[h] ?? 0;
    return out;
  }, [data]);

  const peakHour = useMemo(() => {
    const idx = hourTotals.indexOf(Math.max(...hourTotals));
    return Math.max(...hourTotals) > 0 ? idx : null;
  }, [hourTotals]);

  const streak = gameQ.data?.streaks?.quests;
  const totalDone = data?.priorityMix.reduce((acc, p) => acc + p.value, 0) ?? 0;
  const rank = rankQ.data;

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={insightsQ.isFetching}
            onRefresh={() => {
              insightsQ.refetch();
              rankQ.refetch();
            }}
          />
        }>
        <PageHeader
          title="Insights"
          subtitle="Quest Analytics"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {/* Weekly review */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.weeklyCard, { borderColor: accent }]}>
            <Text style={[styles.weeklyKicker, { color: accent }]}>LAST 7 DAYS</Text>
            <View style={styles.weeklyRow}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyValue}>{data?.weeklyReview.totalCompleted ?? 0}</Text>
                <Text style={styles.weeklyLabel}>Cleared</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={[styles.weeklyValue, { color: accent }]}>{data?.weeklyReview.totalXp ?? 0}</Text>
                <Text style={styles.weeklyLabel}>XP</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={[styles.weeklyValue, { color: '#ef4444' }]}>{data?.weeklyReview.sRankCompleted ?? 0}</Text>
                <Text style={styles.weeklyLabel}>S-Rank</Text>
              </View>
              <View style={styles.weeklyStat}>
                <Text style={[styles.weeklyValue, { color: '#f97316' }]}>{streak?.count ?? 0}</Text>
                <Text style={styles.weeklyLabel}>Streak</Text>
              </View>
            </View>
            {data?.weeklyReview.topTag && (
              <Text style={styles.weeklyTopTag}>
                Top tag:{' '}
                <Text style={{ color: data.weeklyReview.topTag.color, fontWeight: '900' }}>
                  #{data.weeklyReview.topTag.name}
                </Text>{' '}
                · {data.weeklyReview.topTag.completed} clears
              </Text>
            )}
          </View>
        </View>

        {/* Heatmap */}
        <SectionTitle title="Completion Heatmap" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <HabitGrid cells={heatmapCells} color={accent} />
        </View>

        {/* Priority mix */}
        <SectionTitle title="Priority Mix" accent={accent} />
        <View style={[styles.chartCard, { marginHorizontal: 20 }]}>
          <View style={{ alignItems: 'center' }}>
            <DonutChart
              slices={priorityDonutSlices}
              centerValue={`${totalDone}`}
              centerLabel="Cleared"
            />
          </View>
          <View style={styles.legend}>
            {priorityDonutSlices.map((s) => (
              <View key={s.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendTxt}>
                  {s.label}: <Text style={{ color: palette.text, fontWeight: '900' }}>{s.value}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* XP trend */}
        <SectionTitle title="XP Trend (28d)" accent={accent} />
        <View style={[styles.chartCard, { marginHorizontal: 20 }]}>
          <TrendLine
            values={xpTrendValues.values.length ? xpTrendValues.values : [0, 0]}
            labels={xpTrendValues.labels}
            color={accent}
            width={CARD_W - 24}
            height={150}
            showDots
          />
        </View>

        {/* Tag completion rate */}
        <SectionTitle title="Tag Completion Rate" accent={accent} />
        <View style={[styles.chartCard, { marginHorizontal: 20 }]}>
          {tagBars.length === 0 ? (
            <Text style={{ color: palette.textMuted, fontSize: 12, padding: 12 }}>
              No tag data yet. Add tags to quests to see follow-through rate.
            </Text>
          ) : (
            <BarChart bars={tagBars} color={accent2} width={CARD_W - 24} height={160} valueFormatter={(v) => `${v}%`} />
          )}
        </View>

        {/* Time of day */}
        <SectionTitle title="Time of Day" accent={accent} />
        <View style={[styles.chartCard, { marginHorizontal: 20 }]}>
          <BarChart
            bars={hourTotals.map((v: number, i: number) => ({
              label: i % 3 === 0 ? `${i}h` : '',
              value: v,
            }))}
            color="#fbbf24"
            width={CARD_W - 24}
            height={140}
          />
          {peakHour !== null && (
            <Text style={[styles.peakTxt, { color: '#fbbf24' }]}>
              Peak hour: {peakHour}:00
            </Text>
          )}
        </View>

        {/* Estimate accuracy */}
        <SectionTitle title="Estimate vs Actual" accent={accent} />
        <View style={[styles.chartCard, { marginHorizontal: 20 }]}>
          {!data?.accuracy.length ? (
            <Text style={{ color: palette.textMuted, fontSize: 12, padding: 12 }}>
              Track time on quests to build an estimate-accuracy view.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              {data.accuracy.slice(0, 6).map((a, i) => {
                const variance = ((a.actual - a.estimated) / Math.max(1, a.estimated)) * 100;
                const over = variance > 0;
                return (
                  <View key={i} style={styles.accuracyRow}>
                    <Text style={styles.accuracyTxt}>
                      est {a.estimated}m → actual {a.actual}m
                    </Text>
                    <Text style={[styles.accuracyDelta, { color: over ? palette.danger : '#4ade80' }]}>
                      {over ? '+' : ''}{Math.round(variance)}%
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Hunter rank */}
        <SectionTitle title="Hunter Rank" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.rankCard, { borderColor: rank?.rank.color ?? accent }]}>
            <Ionicons name="trophy" size={32} color={rank?.rank.color ?? accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankTitle, { color: rank?.rank.color ?? palette.text }]}>
                {rank?.rank.title ?? '—'}
              </Text>
              <Text style={styles.rankSub}>
                {rank?.completedCount ?? 0} cleared · {rank?.sRankCount ?? 0} S-rank
              </Text>
              {rank?.nextRank && (
                <View style={styles.rankBar}>
                  <View style={styles.rankBarBg}>
                    <View
                      style={[
                        styles.rankBarFill,
                        { width: `${rank.progressPct}%`, backgroundColor: rank.rank.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.rankBarTxt}>
                    {rank.toNext} to {rank.nextRank.title}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  weeklyCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  weeklyKicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  weeklyRow: { flexDirection: 'row', gap: 12 },
  weeklyStat: { flex: 1, alignItems: 'center' },
  weeklyValue: { color: palette.text, fontSize: 22, fontWeight: '900' },
  weeklyLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  weeklyTopTag: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
  chartCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 12,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  peakTxt: { fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: palette.bgElevated,
    borderRadius: 8,
  },
  accuracyTxt: { color: palette.text, fontSize: 12, fontWeight: '700' },
  accuracyDelta: { fontSize: 12, fontWeight: '900' },
  rankCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rankTitle: { fontSize: 18, fontWeight: '900' },
  rankSub: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  rankBar: { marginTop: 8, gap: 4 },
  rankBarBg: { height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  rankBarFill: { height: '100%', borderRadius: 3 },
  rankBarTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
});

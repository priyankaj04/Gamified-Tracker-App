import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { WellnessRing } from '@/components/spirit/WellnessRing';
import { TrendLine } from '@/components/charts/TrendLine';
import { useWellnessScore, useWellnessScoreHistory } from '@/hooks/useSpirit';

const COMPONENT_LABELS: Record<string, string> = {
  sleep: 'Sleep',
  nutrition: 'Nutrition',
  habits: 'Habits',
  workouts: 'Workouts',
  weightTrend: 'Weight Trend',
};

export default function WellnessScoreScreen() {
  const accent = screenTheme.spirit.accent;
  const winW = Dimensions.get('window').width;

  const score = useWellnessScore();
  const history = useWellnessScoreHistory();

  const refreshing = score.isFetching || history.isFetching;
  const onRefresh = () => {
    score.refetch();
    history.refetch();
  };

  const breakdown = useMemo(() => {
    if (!score.data) return [];
    return (
      [
        ['sleep', score.data.sleep],
        ['nutrition', score.data.nutrition],
        ['habits', score.data.habits],
        ['workouts', score.data.workouts],
        ['weightTrend', score.data.weightTrend],
      ] as const
    ).map(([key, v]) => ({ key, value: v }));
  }, [score.data]);

  const lowest = breakdown.reduce(
    (acc, c) => (c.value < acc.value ? c : acc),
    breakdown[0] ?? { key: 'sleep', value: 20 },
  );

  const series = (history.data ?? []).map((h) => h.total);

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title="Wellness Score" subtitle="Composite · 30 days" accent={accent} back compact />
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <WellnessRing score={score.data?.total ?? 0} size={220} label={score.data?.label} />
        </View>

        <SectionTitle title="Breakdown" accent={accent} />
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {breakdown.map((b) => (
            <View key={b.key} style={styles.row}>
              <Text style={styles.label}>{COMPONENT_LABELS[b.key]}</Text>
              <View style={styles.bg}>
                <View
                  style={[
                    styles.fill,
                    {
                      backgroundColor: accent,
                      width: `${Math.min(100, (b.value / 20) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.val}>{b.value} / 20</Text>
            </View>
          ))}
        </View>

        {lowest && (
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>Where to push next</Text>
            <Text style={styles.insightText}>
              Your {COMPONENT_LABELS[lowest.key]} score is dragging — focus there this week.
            </Text>
          </View>
        )}

        {series.length >= 2 && (
          <>
            <SectionTitle title="30-Day Trend" accent={accent} />
            <View style={{ paddingHorizontal: 16 }}>
              <TrendLine values={series} color={accent} width={winW - 32} height={140} />
            </View>
          </>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  label: { color: palette.text, fontSize: 12, fontWeight: '800', width: 100 },
  bg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: palette.cardAlt },
  fill: { height: 8, borderRadius: 4 },
  val: { color: spiritText.secondary, fontSize: 11, fontWeight: '800', width: 60, textAlign: 'right' },
  insight: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  insightTitle: {
    color: spiritText.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  insightText: { color: palette.text, fontSize: 14, fontWeight: '700', marginTop: 6 },
});

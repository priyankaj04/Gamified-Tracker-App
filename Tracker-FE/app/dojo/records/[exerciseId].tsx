import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme } from '@/lib/themes';
import { EmptyState } from '@/components/layout/EmptyState';
import { Skeleton } from '@/components/layout/Skeleton';
import { TrendLine } from '@/components/charts/TrendLine';
import { useExerciseHistory } from '@/hooks/useWorkouts';
import { useSettings, toDisplayWeight } from '@/hooks/useSettings';

type Metric = 'weight' | 'volume' | '1rm';
type Range = 'all' | '3mo' | '1mo' | '30d';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'weight', label: 'Top Weight' },
  { key: 'volume', label: 'Volume' },
  { key: '1rm', label: 'Est 1RM' },
];

const RANGES: { key: Range; label: string }[] = [
  { key: '30d', label: '30d' },
  { key: '1mo', label: '1mo' },
  { key: '3mo', label: '3mo' },
  { key: 'all', label: 'All' },
];

export default function ExerciseProgression() {
  const { exerciseId, name } = useLocalSearchParams<{ exerciseId: string; name?: string }>();
  const accent = screenTheme.dojo.accent;
  const [metric, setMetric] = useState<Metric>('weight');
  const [range, setRange] = useState<Range>('3mo');

  const { data, isLoading } = useExerciseHistory({
    exerciseId: exerciseId && exerciseId !== '' ? exerciseId : undefined,
    name: name ?? undefined,
  });
  const settings = useSettings();
  const unit = settings.data?.weightUnit ?? 'kg';

  const filteredSeries = useMemo(() => {
    const series = data?.series ?? [];
    if (range === 'all') return series;
    const cutoff = new Date();
    if (range === '30d' || range === '1mo') cutoff.setDate(cutoff.getDate() - 30);
    else if (range === '3mo') cutoff.setMonth(cutoff.getMonth() - 3);
    const iso = cutoff.toISOString().split('T')[0];
    return series.filter((p) => p.date >= iso);
  }, [data, range]);

  const values = useMemo(() => {
    return filteredSeries.map((p) => {
      switch (metric) {
        case 'weight':
          return toDisplayWeight(p.topWeightKg, unit) ?? 0;
        case 'volume':
          return toDisplayWeight(p.volumeKg, unit) ?? 0;
        case '1rm':
          return toDisplayWeight(p.estOneRmKg, unit) ?? 0;
      }
    });
  }, [filteredSeries, metric, unit]);

  const last = filteredSeries[filteredSeries.length - 1];
  const peak = values.length ? Math.max(...values) : 0;

  // Mark sessions where this metric set a new high vs all prior sessions.
  const prFlags = useMemo(() => {
    let runningMax = -Infinity;
    return values.map((v) => {
      const isPr = v > runningMax;
      if (isPr) runningMax = v;
      return isPr;
    });
  }, [values]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
        <Text style={styles.title}>{name ?? 'Exercise'}</Text>

        <View style={styles.metricRow}>
          {METRICS.map((m) => {
            const active = metric === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={[styles.tab, active && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.tabText, active && { color: accent }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.rangeRow}>
          {RANGES.map((r) => {
            const active = range === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRange(r.key)}
                style={[styles.rangeBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.rangeText, active && { color: accent }]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={70} />
            <Skeleton height={200} />
            <Skeleton height={40} style={{ marginTop: 6 }} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </View>
        ) : values.length < 2 ? (
          <EmptyState
            icon="trending-up"
            title="Not enough data yet"
            message="Log this exercise a few more times to see your progression."
            accent={accent}
          />
        ) : (
          <View>
            <View style={styles.peakRow}>
              <View>
                <Text style={styles.peakLabel}>Latest</Text>
                <Text style={[styles.peakVal, { color: accent }]}>
                  {(values[values.length - 1] ?? 0).toFixed(1)} {metric === 'volume' ? unit : unit}
                </Text>
                {last && <Text style={styles.peakDate}>{new Date(last.date).toLocaleDateString()}</Text>}
              </View>
              <View>
                <Text style={styles.peakLabel}>Peak</Text>
                <Text style={[styles.peakVal, { color: '#fbbf24' }]}>
                  {peak.toFixed(1)} {unit}
                </Text>
              </View>
              <View>
                <Text style={styles.peakLabel}>Sessions</Text>
                <Text style={styles.peakVal}>{filteredSeries.length}</Text>
              </View>
            </View>
            <View style={styles.chartWrap}>
              <TrendLine
                values={values}
                labels={filteredSeries.map((p) => new Date(p.date).toLocaleDateString())}
                color={accent}
                width={Dimensions.get('window').width - 64}
                height={200}
                showDots
                valueFormatter={(v) => `${v.toFixed(1)} ${unit}`}
              />
            </View>

            <Text style={styles.sectionLabel}>Sessions</Text>
            {filteredSeries.slice().reverse().map((p, revIdx) => {
              const origIdx = filteredSeries.length - 1 - revIdx;
              const isPr = prFlags[origIdx];
              return (
                <View
                  key={revIdx}
                  style={[styles.row, isPr && { borderColor: accent + '99', backgroundColor: accent + '10' }]}>
                  <Text style={styles.rowDate}>{new Date(p.date).toLocaleDateString()}</Text>
                  <Text style={styles.rowVal}>
                    {(toDisplayWeight(p.topWeightKg, unit) ?? 0).toFixed(1)} {unit} × {p.topReps}
                  </Text>
                  {isPr && (
                    <View style={[styles.prBadge, { backgroundColor: accent + '22', borderColor: accent }]}>
                      <Ionicons name="trophy" size={10} color={accent} />
                      <Text style={[styles.prText, { color: accent }]}>PR</Text>
                    </View>
                  )}
                  <Text style={[styles.rowSub, { color: accent }]}>
                    ~1RM {(toDisplayWeight(p.estOneRmKg, unit) ?? 0).toFixed(1)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.text, fontSize: 24, fontWeight: '900' },
  metricRow: { flexDirection: 'row', gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  rangeRow: { flexDirection: 'row', gap: 6 },
  rangeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  rangeText: { color: palette.textMuted, fontWeight: '700', fontSize: 11 },
  peakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  peakLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  peakVal: { fontSize: 20, fontWeight: '900', color: palette.text, letterSpacing: -0.3, marginTop: 2 },
  peakDate: { color: palette.textDim, fontSize: 11, marginTop: 2 },
  chartWrap: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
  },
  sectionLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 6,
  },
  rowDate: { color: palette.textMuted, fontSize: 11, fontWeight: '700', width: 86 },
  rowVal: { color: palette.text, fontWeight: '800', fontSize: 13, flex: 1 },
  rowSub: { fontSize: 11, fontWeight: '700' },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  prText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});

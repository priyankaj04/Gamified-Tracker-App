import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { TrendLine } from '@/components/charts/TrendLine';
import { EmptyState } from '@/components/layout/EmptyState';
import { useComposition, useCompositionStats } from '@/hooks/useSpirit';

export default function CompositionScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;

  const history = useComposition();
  const stats = useCompositionStats();

  const refreshing = history.isFetching || stats.isFetching;
  const onRefresh = () => {
    history.refetch();
    stats.refetch();
  };

  const winW = Dimensions.get('window').width;
  const bfSeries = useMemo(() => (history.data ?? []).map((r) => r.bodyFatPct), [history.data]);
  const leanSeries = useMemo(() => (history.data ?? []).map((r) => r.leanMassKg), [history.data]);
  const fatSeries = useMemo(() => (history.data ?? []).map((r) => r.fatMassKg), [history.data]);

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title="Composition" subtitle="Lean · Fat" accent={accent} accent2={accent2} back compact />

        <View style={styles.statsRow}>
          <StatCard
            label="Body Fat"
            value={stats.data?.currentBodyFatPct != null ? `${stats.data.currentBodyFatPct}%` : '—'}
            trend={stats.data?.category ? { value: stats.data.category, up: false } : undefined}
            accent={accent}
          />
          <StatCard
            label="Lean Mass"
            value={stats.data?.leanMassKg != null ? `${stats.data.leanMassKg}kg` : '—'}
            accent={accent2}
          />
          <StatCard
            label="Fat Mass"
            value={stats.data?.fatMassKg != null ? `${stats.data.fatMassKg}kg` : '—'}
            accent={palette.danger}
          />
        </View>

        {stats.data?.recomposition && (
          <View style={[styles.recomp, { borderColor: stats.data.recomposition.leanUp && stats.data.recomposition.fatDown ? accent : palette.border }]}>
            <Ionicons
              name={stats.data.recomposition.leanUp && stats.data.recomposition.fatDown ? 'trending-up' : 'remove'}
              size={20}
              color={stats.data.recomposition.leanUp && stats.data.recomposition.fatDown ? accent : spiritText.secondary}
            />
            <Text style={styles.recompText}>
              {stats.data.recomposition.leanUp && stats.data.recomposition.fatDown
                ? 'Recomposing: lean mass up, fat mass down'
                : 'Recomposition: not yet — stay consistent'}
            </Text>
          </View>
        )}

        {(!history.data || history.data.length < 2) ? (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <EmptyState
              icon="body"
              title="Body composition needs more data"
              message="Log weight with body fat % for at least 2 days to see composition trends."
              accent={accent}
            />
          </View>
        ) : (
          <>
            <SectionTitle title="Body Fat %" accent={accent} />
            <View style={{ paddingHorizontal: 16 }}>
              <TrendLine values={bfSeries} color={accent} width={winW - 32} height={160} />
            </View>

            <SectionTitle title="Lean Mass" accent={accent} />
            <View style={{ paddingHorizontal: 16 }}>
              <TrendLine values={leanSeries} color={accent} width={winW - 32} height={140} />
            </View>

            <SectionTitle title="Fat Mass" accent={accent} />
            <View style={{ paddingHorizontal: 16 }}>
              <TrendLine values={fatSeries} color={palette.danger} width={winW - 32} height={140} />
            </View>
          </>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  recomp: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
  },
  recompText: { color: palette.text, fontSize: 12, fontWeight: '700', flex: 1 },
});

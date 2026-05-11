import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { HabitGrid } from '@/components/spirit/HabitGrid';
import { useHabitHistory, useHabitStreak } from '@/hooks/useHabits';

export default function HabitDetailScreen() {
  const accent = screenTheme.spirit.accent;
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const id = String(params.id ?? '');

  const history = useHabitHistory(id);
  const streak = useHabitStreak(id);

  const refreshing = history.isFetching || streak.isFetching;
  const onRefresh = () => {
    history.refetch();
    streak.refetch();
  };

  const completed = (history.data ?? []).filter((c) => c.completed).length;
  const total = history.data?.length ?? 0;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title={params.name ?? 'Habit'} subtitle="Streak · Grid" accent={accent} back compact />

        <View style={styles.statsRow}>
          <StatCard label="Current" value={streak.data?.current ?? 0} accent={accent} />
          <StatCard label="Longest" value={streak.data?.longest ?? 0} accent={accent} />
          <StatCard label="Rate" value={`${rate}%`} accent={accent} />
        </View>

        <SectionTitle title="Last 90 days" accent={accent} />
        <View style={styles.gridWrap}>
          {history.data && <HabitGrid cells={history.data} color={accent} />}
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  gridWrap: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
});

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { DSAProblemRow } from '@/components/forge/DSAProblemRow';
import { ForgeActivityGrid } from '@/components/forge/ForgeActivityGrid';
import { useDsaGrid, useDsaProblems, useDsaStats } from '@/hooks/useDSA';

const greenScale = ['#0a0a0f', '#0b3a26', '#0e5f3a', '#16a34a', '#4ade80'];

export default function DsaScreen() {
  const router = useRouter();
  const accent = '#a78bfa';
  const list = useDsaProblems({ limit: 60 });
  const stats = useDsaStats();
  const grid = useDsaGrid();

  const items = list.data?.problems ?? [];
  const goalCurrent = stats.data?.weeklyGoalProgress.current ?? 0;
  const goalTotal = stats.data?.weeklyGoalProgress.goal ?? 5;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={list.isFetching} onRefresh={() => { list.refetch(); stats.refetch(); grid.refetch(); }} />}>
        <PageHeader
          title="DSA Practice"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent}
          right={
            <Pressable onPress={() => router.push('/forge/dsa-new' as any)} hitSlop={8}>
              <Ionicons name="add" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={styles.statsRow}>
          <Stat label="Total" value={stats.data?.totalSolved ?? 0} color="#22d3ee" />
          <Stat label="Easy" value={stats.data?.easy ?? 0} color="#4ade80" />
          <Stat label="Medium" value={stats.data?.medium ?? 0} color="#fbbf24" />
          <Stat label="Hard" value={stats.data?.hard ?? 0} color="#ef4444" />
        </View>

        <View style={styles.streakRow}>
          <Text style={[styles.streak, { color: accent }]}>🔥 {stats.data?.currentStreak ?? 0} day streak</Text>
          <Text style={styles.streakLong}>Best · {stats.data?.longestStreak ?? 0}</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHead}>
            <Text style={styles.goalLabel}>Weekly Goal</Text>
            <Text style={styles.goalText}>{goalCurrent} / {goalTotal}</Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${Math.min(100, (goalCurrent / Math.max(1, goalTotal)) * 100)}%`, backgroundColor: accent }]} />
          </View>
        </View>

        <SectionTitle title="Topics" accent={accent} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
          {(stats.data?.byTopic ?? []).map((t) => {
            const weak = t.solved < 5 && t.attempted >= 2;
            const strong = t.solved >= 10;
            const color = weak ? '#ef4444' : strong ? '#4ade80' : palette.textMuted;
            return (
              <View key={t.topic} style={[styles.topicChip, { borderColor: color + '88' }]}>
                <Text style={[styles.topicName, { color }]}>{t.topic}</Text>
                <Text style={styles.topicCount}>{t.solved}/{t.solved + t.attempted}</Text>
              </View>
            );
          })}
        </ScrollView>

        {(stats.data?.weakTopics ?? []).length > 0 && (
          <View style={styles.weakBox}>
            <Text style={styles.weakLabel}>⚠ Weak Topics</Text>
            <Text style={styles.weakText}>{stats.data!.weakTopics.join(' · ')}</Text>
          </View>
        )}

        <SectionTitle title="Activity (90d)" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <ForgeActivityGrid data={(grid.data?.grid ?? []) as any} scale={greenScale} />
        </View>

        <SectionTitle title="Recent" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          {items.length === 0 && (
            <EmptyState icon="code-slash" title="No problems solved yet." message="Time to grind." accent={accent} />
          )}
          {items.map((p) => (
            <DSAProblemRow key={p.id} problem={p} onPress={() => p.problemUrl && Linking.openURL(p.problemUrl)} />
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginVertical: 6 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 8 },
  streak: { fontWeight: '900', fontSize: 13 },
  streakLong: { color: palette.textMuted, fontWeight: '700', fontSize: 11 },
  goalCard: { backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 12, marginHorizontal: 20, gap: 6 },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between' },
  goalLabel: { color: palette.textMuted, fontWeight: '800', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  goalText: { color: palette.text, fontWeight: '900' },
  goalTrack: { height: 6, borderRadius: 3, backgroundColor: palette.cardAlt, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },
  topicsRow: { paddingHorizontal: 20, gap: 6 },
  topicChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignItems: 'center', gap: 1, backgroundColor: palette.card },
  topicName: { fontWeight: '800', fontSize: 12 },
  topicCount: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  weakBox: { backgroundColor: '#fbbf2422', borderColor: '#fbbf24', borderWidth: 1, borderRadius: 10, padding: 12, marginHorizontal: 20, marginTop: 10, gap: 4 },
  weakLabel: { color: '#fbbf24', fontWeight: '900', fontSize: 12 },
  weakText: { color: palette.text, fontSize: 12 },
});

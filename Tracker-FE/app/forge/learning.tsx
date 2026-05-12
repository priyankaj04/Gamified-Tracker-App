import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { StarRating } from '@/components/gamification/StarRating';
import {
  useCompleteLearning,
  useLearning,
  useLearningStats,
  useUpdateProgress,
} from '@/hooks/useLearning';
import type { LearningStatus, LearningType } from '@/types';

const TABS: { key: LearningStatus | 'all'; label: string }[] = [
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Not Started', label: 'Not Started' },
  { key: 'Completed', label: 'Completed' },
];

const typeIcon: Record<LearningType, string> = {
  Course: '🎓',
  Book: '📚',
  Tutorial: '📝',
  Video: '🎬',
  Documentation: '📄',
  Paper: '🧪',
};

export default function LearningScreen() {
  const router = useRouter();
  const accent = '#fbbf24';
  const [tab, setTab] = useState<LearningStatus>('In Progress');
  const { data, isFetching, refetch } = useLearning({ status: tab });
  const stats = useLearningStats();
  const complete = useCompleteLearning();
  const progress = useUpdateProgress();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <PageHeader
          title="Learning"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent}
          right={
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => router.push('/forge/skill-map' as any)} hitSlop={8}>
                <Ionicons name="grid" size={22} color={accent} />
              </Pressable>
              <Pressable onPress={() => router.push('/forge/learning-new' as any)} hitSlop={8}>
                <Ionicons name="add" size={26} color={accent} />
              </Pressable>
            </View>
          }
        />

        <View style={styles.statsRow}>
          <Stat label="Done" value={stats.data?.totalCompleted ?? 0} accent={accent} />
          <Stat label="In Progress" value={stats.data?.totalInProgress ?? 0} accent={accent} />
          <Stat label="Hours" value={stats.data?.totalHours ?? 0} accent={accent} />
          <Stat label="This Mo" value={stats.data?.completedThisMonth ?? 0} accent={accent} />
        </View>

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key as LearningStatus)}
              style={[styles.tab, tab === t.key && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.tabText, tab === t.key && { color: accent }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {(data?.items ?? []).length === 0 && (
            <EmptyState icon="book-outline" title="Nothing here yet." message="Add a learning item to start." accent={accent} />
          )}
          {(data?.items ?? []).map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.icon}>{typeIcon[item.type]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.tag, { color: accent, borderColor: accent + '55' }]}>{item.type}</Text>
                    {item.platform && <Text style={styles.platform}>{item.platform}</Text>}
                  </View>
                </View>
                {item.status === 'Completed' && <StarRating value={item.rating} readOnly size={12} />}
              </View>

              {(item.topics ?? []).length > 0 && (
                <View style={styles.topics}>
                  {item.topics.slice(0, 5).map((t) => (
                    <Text key={t} style={styles.topic}>{t}</Text>
                  ))}
                </View>
              )}

              {item.status === 'In Progress' && (
                <>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${item.progressPct}%`, backgroundColor: accent }]} />
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => progress.mutate({ id: item.id, progressPct: Math.min(100, item.progressPct + 10) })} style={[styles.action, { borderColor: accent + '55' }]}>
                      <Text style={[styles.actionText, { color: accent }]}>+10%</Text>
                    </Pressable>
                    <Pressable onPress={() => complete.mutate(item.id)} style={[styles.action, { borderColor: '#4ade80' }]}>
                      <Text style={[styles.actionText, { color: '#4ade80' }]}>Complete</Text>
                    </Pressable>
                  </View>
                </>
              )}
              {item.status === 'Not Started' && (
                <Pressable onPress={() => progress.mutate({ id: item.id, progressPct: 1 })} style={[styles.startBtn, { borderColor: accent }]}>
                  <Text style={[styles.actionText, { color: accent }]}>Start Learning</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 8 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginVertical: 10 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 14, gap: 10, marginBottom: 10 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { fontSize: 26 },
  title: { color: palette.text, fontWeight: '800', fontSize: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  tag: { fontSize: 10, fontWeight: '800', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  platform: { color: palette.textMuted, fontSize: 11 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  topic: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  track: { height: 6, backgroundColor: palette.cardAlt, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  actionText: { fontWeight: '800', fontSize: 12 },
  startBtn: { paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
});

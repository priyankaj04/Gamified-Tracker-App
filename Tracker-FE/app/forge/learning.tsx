import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { StarRating } from '@/components/gamification/StarRating';
import { XPBadge } from '@/components/gamification/XPBadge';
import {
  useCompleteLearning,
  useDeleteLearning,
  useLearning,
  useLearningStats,
  useUpdateLearning,
  useUpdateProgress,
} from '@/hooks/useLearning';
import type { LearningItem, LearningStatus, LearningType } from '@/types';

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
  // Fetch the whole list once and filter locally — that way we can show real
  // counts on each tab and a freshly-added item is never hidden by the active
  // tab filter.
  const { data, isFetching, refetch } = useLearning({});
  const stats = useLearningStats();
  const complete = useCompleteLearning();
  const progress = useUpdateProgress();
  const update = useUpdateLearning();
  const remove = useDeleteLearning();

  const [contextItem, setContextItem] = useState<LearningItem | null>(null);

  const all = data?.items ?? [];
  const counts = {
    'In Progress': all.filter((i) => i.status === 'In Progress').length,
    'Not Started': all.filter((i) => i.status === 'Not Started').length,
    Completed: all.filter((i) => i.status === 'Completed').length,
  } as Record<LearningStatus, number>;

  // Pick a sensible default tab: prefer In Progress, then Not Started, then
  // Completed — so the user lands on whatever has items.
  const defaultTab: LearningStatus =
    counts['In Progress'] > 0
      ? 'In Progress'
      : counts['Not Started'] > 0
      ? 'Not Started'
      : 'Completed';
  const [tab, setTab] = useState<LearningStatus>(defaultTab);
  // When the data loads for the first time, jump to the tab that actually has
  // content so a fresh add is visible immediately.
  const [didAutoSelect, setDidAutoSelect] = React.useState(false);
  React.useEffect(() => {
    if (didAutoSelect || all.length === 0) return;
    setTab(defaultTab);
    setDidAutoSelect(true);
  }, [all.length, defaultTab, didAutoSelect]);

  const filtered = all.filter((i) => i.status === tab);

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
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = counts[t.key as LearningStatus];
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key as LearningStatus)}
                style={[styles.tab, active && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.tabText, active && { color: accent }]}>{t.label}</Text>
                <View style={[styles.tabCount, active && { backgroundColor: accent + '33' }]}>
                  <Text style={[styles.tabCountText, active && { color: accent }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {filtered.length === 0 && (
            <EmptyState
              icon="book-outline"
              title={all.length === 0 ? 'Nothing here yet.' : `No ${tab} items.`}
              message={all.length === 0 ? 'Tap + to add your first learning item.' : 'Try a different tab.'}
              accent={accent}
            />
          )}
          {filtered.map((item) => (
            <Pressable
              key={item.id}
              onLongPress={() => setContextItem(item)}
              style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.icon}>{typeIcon[item.type]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.tag, { color: accent, borderColor: accent + '55' }]}>{item.type}</Text>
                    {item.platform && <Text style={styles.platform}>{item.platform}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {item.status === 'Completed' && <StarRating value={item.rating} readOnly size={12} />}
                  <XPBadge amount={item.xpEarned} color="#fbbf24" />
                  <Pressable onPress={() => setContextItem(item)} hitSlop={8}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={palette.textMuted} />
                  </Pressable>
                </View>
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
                      <Text style={[styles.actionText, { color: '#4ade80' }]}>Mark Complete</Text>
                    </Pressable>
                  </View>
                </>
              )}
              {item.status === 'Not Started' && (
                <Pressable
                  onPress={() =>
                    update.mutate({ id: item.id, body: { status: 'In Progress', progressPct: 1 } })
                  }
                  style={[styles.startBtn, { borderColor: accent, backgroundColor: accent + '22' }]}>
                  <Ionicons name="play" size={14} color={accent} />
                  <Text style={[styles.actionText, { color: accent }]}>Start Learning</Text>
                </Pressable>
              )}
              {item.status === 'Completed' && (
                <View style={styles.completedRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                  <Text style={[styles.actionText, { color: '#4ade80' }]}>
                    Completed{item.completedAt ? ` · ${new Date(item.completedAt).toLocaleDateString()}` : ''}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() =>
                      update.mutate({ id: item.id, body: { status: 'In Progress', progressPct: 50 } })
                    }
                    hitSlop={8}>
                    <Text style={[styles.actionText, { color: palette.textMuted }]}>Reopen</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      <BottomSheet
        visible={!!contextItem}
        onClose={() => setContextItem(null)}
        title={contextItem?.title ?? ''}>
        {contextItem && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sheetSubLabel}>Set status</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['Not Started', 'In Progress', 'Completed'] as LearningStatus[]).map((s) => {
                const active = contextItem.status === s;
                const color = s === 'Completed' ? '#4ade80' : s === 'In Progress' ? accent : palette.textMuted;
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      const body: Parameters<typeof update.mutate>[0]['body'] = { status: s };
                      if (s === 'Not Started') body.progressPct = 0;
                      if (s === 'In Progress' && contextItem.progressPct === 0) body.progressPct = 1;
                      if (s === 'Completed') body.progressPct = 100;
                      update.mutate({ id: contextItem.id, body });
                      setContextItem(null);
                    }}
                    style={[
                      styles.sheetChip,
                      { borderColor: color + '88' },
                      active && { backgroundColor: color + '22', borderColor: color },
                    ]}>
                    <Text style={[styles.sheetChipText, { color: active ? color : palette.textMuted }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>

            {contextItem.status !== 'Completed' && (
              <GlowButton
                title="✓ Mark Complete (claim XP)"
                color="#4ade80"
                onPress={() => {
                  complete.mutate(contextItem.id);
                  setContextItem(null);
                }}
              />
            )}
            <GlowButton
              title="🗑 Delete"
              variant="ghost"
              color="#ef4444"
              onPress={() => {
                Alert.alert('Delete learning item?', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      remove.mutate(contextItem.id);
                      setContextItem(null);
                    },
                  },
                ]);
              }}
            />
          </View>
        )}
      </BottomSheet>
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
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  tabCount: {
    minWidth: 18,
    height: 16,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: palette.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: { color: palette.textMuted, fontWeight: '900', fontSize: 10 },
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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  sheetSubLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sheetChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: palette.card,
  },
  sheetChipText: { fontWeight: '900', fontSize: 11 },
});

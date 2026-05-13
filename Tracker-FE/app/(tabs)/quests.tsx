import React, { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { AnimatedTabs } from '@/components/quests/AnimatedTabs';
import { QuestRow } from '@/components/quests/QuestRow';
import { TodaysHuntCard } from '@/components/quests/TodaysHuntCard';
import { HeroStatsBar } from '@/components/quests/HeroStatsBar';
import { FabSpeedDial } from '@/components/quests/FabSpeedDial';
import { QuestCreateSheet } from '@/components/quests/QuestCreateSheet';
import { showQuestStamp } from '@/components/quests/QuestStamp';
import { ModuleRankCard } from '@/components/gamification/ModuleRankCard';
import {
  useQuests,
  useCompleteQuest,
  useDeleteQuest,
  useQuestRank,
  useReorderQuests,
  useTags,
  useUpdateQuest,
} from '@/hooks/useQuests';
import type { Quest } from '@/types';

const TABS = ['Hunt', 'Daily', 'Active', 'Completed'] as const;
type Tab = (typeof TABS)[number];

const EMPTY_COPY: Record<Tab, { title: string; message: string; icon: 'paw' | 'today' | 'reader' | 'trophy' }> = {
  Hunt: { title: 'The board is quiet, hunter.', message: 'Add daily or S/A-rank quests to summon today\'s hunt.', icon: 'paw' },
  Daily: { title: 'No daily routines yet.', message: 'Toggle "Daily" when creating a quest to grow your loop.', icon: 'today' },
  Active: { title: 'Nothing on the board.', message: 'Drop a quest with the + button to start hunting XP.', icon: 'reader' },
  Completed: { title: 'No clears yet.', message: 'Your trophy hall is empty — go conquer something.', icon: 'trophy' },
};

export default function QuestsScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const [tab, setTab] = useState<Tab>('Hunt');
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filter = useMemo(() => {
    const base: Record<string, unknown> = { tagId: activeTag };
    if (search.trim()) base.search = search.trim();
    if (tab === 'Daily') return { ...base, daily: true, completed: false };
    if (tab === 'Completed') return { ...base, completed: true };
    return { ...base, completed: false };
  }, [tab, activeTag, search]);

  const { data, isFetching, refetch } = useQuests(filter);
  const tagsQ = useTags();
  const complete = useCompleteQuest();
  const remove = useDeleteQuest();
  const update = useUpdateQuest();
  const reorder = useReorderQuests();
  const rankQ = useQuestRank();

  // Exit reorder mode whenever we leave Active tab
  React.useEffect(() => {
    if (tab !== 'Active' && reorderMode) setReorderMode(false);
  }, [tab, reorderMode]);

  const allActiveQ = useQuests({ completed: false });
  const activeQuests = allActiveQ.data?.quests ?? [];
  const dailyCount = activeQuests.filter((q) => q.isDaily).length;
  const activeCount = activeQuests.length;
  const todayCount = activeQuests.filter(
    (q) => q.isDaily || q.dueDate === today,
  ).length;
  const overdueCount = activeQuests.filter(
    (q) => q.dueDate && q.dueDate < today,
  ).length;

  const completedQ = useQuests({ completed: true });
  const completedCount = completedQ.data?.quests.length ?? 0;

  const quests = data?.quests ?? [];

  // Group Active tab by Overdue / Today / Week / Later
  const grouped = useMemo(() => {
    if (tab !== 'Active') return null;
    const inWeek = (d: string) => {
      const date = new Date(d);
      const now = new Date();
      const diff = (date.getTime() - now.getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    };
    const overdue: Quest[] = [];
    const todayG: Quest[] = [];
    const week: Quest[] = [];
    const later: Quest[] = [];
    const none: Quest[] = [];
    for (const q of quests) {
      if (!q.dueDate) {
        none.push(q);
      } else if (q.dueDate < today) {
        overdue.push(q);
      } else if (q.dueDate === today) {
        todayG.push(q);
      } else if (inWeek(q.dueDate)) {
        week.push(q);
      } else {
        later.push(q);
      }
    }
    return [
      { key: 'Overdue', items: overdue, color: palette.danger },
      { key: 'Today', items: todayG, color: '#fbbf24' },
      { key: 'This Week', items: week, color: accent },
      { key: 'Later', items: later, color: accent2 },
      { key: 'Unscheduled', items: none, color: palette.textMuted },
    ].filter((g) => g.items.length > 0);
  }, [tab, quests, today, accent, accent2]);

  const handleComplete = async (q: Quest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const res = await complete.mutateAsync({ id: q.id });
    showQuestStamp(q.priority, q.isBoss, res.comboActive ? res.comboCount : undefined);
  };

  const handleSnooze = (q: Quest) => {
    const next = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    update.mutate({ id: q.id, body: { dueDate: next } });
  };

  const moveQuest = (id: string, direction: -1 | 1) => {
    const items = [...quests];
    const idx = items.findIndex((q) => q.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    Haptics.selectionAsync();
    reorder.mutate(items.map((q) => q.id));
  };

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />
        }>
        <PageHeader
          title="Quests"
          subtitle="Hunter Exam Board"
          accent={accent}
          accent2={accent2}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable hitSlop={6} onPress={() => router.push('/quest/insights')}>
                <Ionicons name="stats-chart" size={22} color={accent} />
              </Pressable>
              <Pressable hitSlop={6} onPress={() => router.push('/quest/shadow-army')}>
                <Ionicons name="people" size={22} color={accent} />
              </Pressable>
              <Pressable hitSlop={6} onPress={() => router.push('/quest/calendar')}>
                <Ionicons name="calendar" size={22} color={accent} />
              </Pressable>
              <Pressable hitSlop={6} onPress={() => router.push('/quest/settings')}>
                <Ionicons name="settings-sharp" size={22} color={accent} />
              </Pressable>
            </View>
          }
        />

        <ModuleRankCard
          kicker="HUNTER RANK"
          rank={rankQ.data?.rank}
          nextRank={rankQ.data?.nextRank}
          progressPct={rankQ.data?.progressPct ?? 0}
          toNext={rankQ.data?.toNext ?? 0}
          unitLabel="clears"
          subtitle={
            rankQ.data
              ? `${rankQ.data.completedCount} cleared · ${rankQ.data.sRankCount} S-rank`
              : undefined
          }
          accent={accent}
          icon="trophy"
          onPress={() => router.push('/quest/shadow-army')}
        />

        <HeroStatsBar
          accent={accent}
          todayCount={todayCount}
          overdueCount={overdueCount}
          onRankPress={() => router.push('/quest/shadow-army')}
        />

        <AnimatedTabs<Tab>
          tabs={[
            { key: 'Hunt', label: 'Hunt' },
            { key: 'Daily', label: 'Daily', count: dailyCount },
            { key: 'Active', label: 'Active', count: activeCount },
            { key: 'Completed', label: 'Done', count: completedCount },
          ]}
          active={tab}
          onChange={setTab}
          accent={accent}
        />

        {tab === 'Hunt' && (
          <>
            <View style={{ marginBottom: 16 }}>
              <TodaysHuntCard accent={accent} accent2={accent2} />
            </View>
            <Pressable
              onPress={() => router.push('/quest/challenges')}
              style={[styles.challengesLink, { borderColor: accent2 + '88', backgroundColor: accent2 + '22' }]}>
              <Ionicons name="ribbon" size={18} color={accent2} />
              <Text style={[styles.challengesTxt, { color: accent2 }]}>Weekly Challenges</Text>
              <Ionicons name="chevron-forward" size={16} color={accent2} />
            </Pressable>
          </>
        )}

        {tab !== 'Hunt' && (
          <>
            {tab === 'Active' && quests.length > 1 && (
              <View style={styles.reorderToolbar}>
                <Pressable
                  onPress={() => setReorderMode((v) => !v)}
                  style={[
                    styles.reorderToggle,
                    reorderMode && { backgroundColor: accent + '22', borderColor: accent },
                  ]}>
                  <Ionicons
                    name={reorderMode ? 'checkmark' : 'reorder-three'}
                    size={14}
                    color={reorderMode ? accent : palette.textMuted}
                  />
                  <Text style={[styles.reorderTxt, reorderMode && { color: accent }]}>
                    {reorderMode ? 'Done' : 'Reorder'}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={palette.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search quests..."
                placeholderTextColor={palette.textDim}
                style={styles.searchInput}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color={palette.textMuted} />
                </Pressable>
              ) : null}
            </View>

            {!!tagsQ.data?.tags?.length && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagRow}>
                <Pressable
                  onPress={() => setActiveTag(undefined)}
                  style={[
                    styles.tagPill,
                    !activeTag && { borderColor: accent, backgroundColor: accent + '22' },
                  ]}>
                  <Text style={[styles.tagText, !activeTag && { color: accent }]}>All</Text>
                </Pressable>
                {tagsQ.data.tags.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => setActiveTag(t.id)}
                    style={[
                      styles.tagPill,
                      activeTag === t.id && { borderColor: t.color, backgroundColor: t.color + '22' },
                    ]}>
                    <Text style={[styles.tagText, activeTag === t.id && { color: t.color }]}>#{t.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {tab !== 'Hunt' && quests.length === 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon={EMPTY_COPY[tab].icon}
              title={EMPTY_COPY[tab].title}
              message={EMPTY_COPY[tab].message}
              accent={accent}
            />
          </View>
        )}

        {tab === 'Active' && !reorderMode && grouped && (
          <View style={{ gap: 12 }}>
            {grouped.map((g) => (
              <View key={g.key}>
                <SectionTitle title={g.key} accent={g.color} />
                <View style={{ gap: 8, paddingHorizontal: 20 }}>
                  {g.items.map((q) => (
                    <QuestRow
                      key={q.id}
                      quest={q}
                      accent={accent}
                      onComplete={() => handleComplete(q)}
                      onDelete={() => remove.mutate(q.id)}
                      onSnooze={() => handleSnooze(q)}
                      onTap={() => router.push(`/quest/${q.id}`)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'Active' && reorderMode && (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {quests.map((q, idx) => {
              const c = priorityColor[q.priority] ?? accent;
              return (
                <View key={q.id} style={styles.reorderRow}>
                  <Ionicons name="reorder-three" size={20} color={palette.textDim} />
                  <View style={[styles.reorderPrio, { borderColor: c }]}>
                    <Text style={[styles.reorderPrioTxt, { color: c }]}>{q.priority}</Text>
                  </View>
                  <Text style={styles.reorderTitle} numberOfLines={1}>
                    {q.isBoss ? '👹 ' : ''}{q.title}
                  </Text>
                  <Pressable
                    onPress={() => moveQuest(q.id, -1)}
                    disabled={idx === 0 || reorder.isPending}
                    hitSlop={6}
                    style={[styles.moveBtn, idx === 0 && { opacity: 0.3 }]}>
                    <Ionicons name="chevron-up" size={20} color={accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveQuest(q.id, 1)}
                    disabled={idx === quests.length - 1 || reorder.isPending}
                    hitSlop={6}
                    style={[styles.moveBtn, idx === quests.length - 1 && { opacity: 0.3 }]}>
                    <Ionicons name="chevron-down" size={20} color={accent} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {(tab === 'Daily' || tab === 'Completed') && quests.length > 0 && (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {quests.map((q) => (
              <QuestRow
                key={q.id}
                quest={q}
                accent={accent}
                onComplete={() => handleComplete(q)}
                onDelete={() => remove.mutate(q.id)}
                onSnooze={() => handleSnooze(q)}
                onTap={() => router.push(`/quest/${q.id}`)}
              />
            ))}
          </View>
        )}

        {tab === 'Hunt' && (
          <Pressable
            onPress={() => router.push('/quest/archived')}
            style={styles.archivedLink}>
            <Ionicons name="archive" size={16} color={palette.textMuted} />
            <Text style={styles.archivedTxt}>View Archive</Text>
          </Pressable>
        )}
      </ScrollView>

      <FabSpeedDial accent={accent} onNewQuest={() => setSheetOpen(true)} />
      <QuestCreateSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} accent={accent} />
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  tagRow: { paddingHorizontal: 20, gap: 6, marginBottom: 10 },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    marginRight: 6,
  },
  tagText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  searchRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchInput: { flex: 1, color: palette.text, paddingVertical: 10, fontSize: 13 },
  challengesLink: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  challengesTxt: { flex: 1, fontWeight: '900', fontSize: 13, letterSpacing: 0.6 },
  archivedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
  },
  archivedTxt: { color: palette.textMuted, fontSize: 13, fontWeight: '700' },
  reorderToolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 6 },
  reorderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  reorderTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  reorderPrio: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reorderPrioTxt: { fontSize: 11, fontWeight: '900' },
  reorderTitle: { flex: 1, color: palette.text, fontSize: 13, fontWeight: '700' },
  moveBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

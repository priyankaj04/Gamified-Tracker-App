import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { AnimeTag } from '@/components/ui/AnimeTag';
import {
  useQuests,
  useCompleteQuest,
  useCreateQuest,
  useDeleteQuest,
  useTags,
} from '@/hooks/useQuests';
import type { Priority, Quest } from '@/types';

const TABS = ['Daily', 'Active', 'Completed'] as const;
type Tab = (typeof TABS)[number];

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C'];

export default function QuestsScreen() {
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const [tab, setTab] = useState<Tab>('Active');
  const [activeTag, setActiveTag] = useState<string | undefined>();

  const filter =
    tab === 'Daily'
      ? { daily: true, completed: false, tagId: activeTag }
      : tab === 'Completed'
      ? { completed: true, tagId: activeTag }
      : { completed: false, tagId: activeTag };

  const { data, isFetching, refetch } = useQuests(filter);
  const tagsQ = useTags();
  const complete = useCompleteQuest();
  const remove = useDeleteQuest();
  const create = useCreateQuest();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('C');
  const [isDaily, setIsDaily] = useState(false);

  const quests = data?.quests ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />
        }>
        <PageHeader
          title="Quests"
          subtitle="Hunter Exam Board"
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="reader" size={26} color={accent} />}
        />

        <View style={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, active && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.tabText, active && { color: accent }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        {!!tagsQ.data?.tags?.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
            <Pressable
              onPress={() => setActiveTag(undefined)}
              style={[styles.tagPill, !activeTag && { borderColor: accent, backgroundColor: accent + '22' }]}>
              <Text style={[styles.tagText, !activeTag && { color: accent }]}>All</Text>
            </Pressable>
            {tagsQ.data.tags.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setActiveTag(t.id)}
                style={[styles.tagPill, activeTag === t.id && { borderColor: t.color, backgroundColor: t.color + '22' }]}>
                <Text style={[styles.tagText, activeTag === t.id && { color: t.color }]}>#{t.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {quests.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="reader"
              title="No quests in this view"
              message="Drop a quest with the + button to start hunting XP."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {quests.map((q) => (
              <QuestRow
                key={q.id}
                quest={q}
                onComplete={async () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  await complete.mutateAsync({ id: q.id });
                }}
                onDelete={() => remove.mutate(q.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="New Quest">
        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={palette.textDim} />

        <Text style={styles.fieldLabel}>Priority</Text>
        <View style={styles.prioRow}>
          {PRIORITIES.map((p) => {
            const active = priority === p;
            const c = priorityColor[p];
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.prioBtn,
                  active && { backgroundColor: c + '22', borderColor: c },
                ]}>
                <Text style={[styles.prioText, active && { color: c }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => setIsDaily((v) => !v)} style={styles.toggleRow}>
          <Ionicons name={isDaily ? 'checkbox' : 'square-outline'} size={20} color={isDaily ? accent : palette.textMuted} />
          <Text style={[styles.toggleText, isDaily && { color: accent }]}>Daily quest</Text>
        </Pressable>

        <View style={{ height: 12 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={create.isPending}
          onPress={async () => {
            if (!title.trim()) return;
            await create.mutateAsync({ title: title.trim(), priority, isDaily });
            setSheetOpen(false);
            setTitle('');
            setPriority('C');
            setIsDaily(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

function QuestRow({
  quest,
  onComplete,
  onDelete,
}: {
  quest: Quest;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.qCard, quest.completed && { opacity: 0.6 }]}>
      <AnimeTag label={quest.priority} variant="priority" />
      <View style={{ flex: 1 }}>
        <Text style={[styles.qTitle, quest.completed && styles.strike]} numberOfLines={2}>
          {quest.title}
        </Text>
        <View style={styles.qMeta}>
          {quest.isDaily && <Text style={styles.dailyTag}>DAILY</Text>}
          {quest.dueDate && (
            <Text style={styles.dueTxt}>{new Date(quest.dueDate).toLocaleDateString()}</Text>
          )}
          {quest.tags?.slice(0, 2).map((t) => (
            <AnimeTag key={t.id} label={t.name} color={t.color} />
          ))}
        </View>
      </View>
      {!quest.completed ? (
        <Pressable
          onPress={onComplete}
          hitSlop={6}
          style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
        </Pressable>
      ) : (
        <Pressable onPress={onDelete} hitSlop={6} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Ionicons name="trash" size={22} color={palette.danger} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 10 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    backgroundColor: palette.card,
  },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },
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
  qCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  qTitle: { color: palette.text, fontWeight: '700', fontSize: 14 },
  strike: { textDecorationLine: 'line-through', color: palette.textMuted },
  qMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' },
  dailyTag: {
    color: '#e879f9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    backgroundColor: '#e879f922',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  completeBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fieldLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  prioRow: { flexDirection: 'row', gap: 6 },
  prioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  prioText: { color: palette.textMuted, fontWeight: '900', fontSize: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  toggleText: { color: palette.textMuted, fontWeight: '700', fontSize: 14 },
});

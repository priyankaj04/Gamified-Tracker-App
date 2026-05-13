import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { useDeleteQuest, useQuests, useUnarchiveQuest } from '@/hooks/useQuests';

export default function ArchivedQuestsScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;

  const q = useQuests({ archived: true });
  const unarchive = useUnarchiveQuest();
  const remove = useDeleteQuest();
  const items = q.data?.quests ?? [];

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={q.isFetching} onRefresh={q.refetch} />
        }>
        <PageHeader
          title="Archive"
          subtitle="Old Hunts"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {items.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="archive"
              title="The vault is empty"
              message="Completed quests older than 30 days move here automatically."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {items.map((it) => (
              <View key={it.id} style={styles.row}>
                <View style={[styles.prio, { borderColor: priorityColor[it.priority] }]}>
                  <Text style={[styles.prioTxt, { color: priorityColor[it.priority] }]}>{it.priority}</Text>
                </View>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/quest/${it.id}`)}>
                  <Text style={styles.title} numberOfLines={2}>
                    {it.title}
                  </Text>
                  <Text style={styles.sub}>
                    {it.completedAt ? new Date(it.completedAt).toLocaleDateString() : ''}
                    {it.xpEarned ? ` · +${it.xpEarned} XP` : ''}
                  </Text>
                </Pressable>
                <Pressable onPress={() => unarchive.mutate(it.id)} hitSlop={4}>
                  <Ionicons name="arrow-undo" size={20} color={accent} />
                </Pressable>
                <Pressable onPress={() => remove.mutate(it.id)} hitSlop={4}>
                  <Ionicons name="trash" size={18} color={palette.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  prio: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prioTxt: { fontSize: 12, fontWeight: '900' },
  title: { color: palette.text, fontSize: 13, fontWeight: '700' },
  sub: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
});

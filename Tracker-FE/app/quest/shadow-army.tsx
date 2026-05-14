import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { QuestRankBadgeCard } from '@/components/quests/QuestRankBadgeCard';
import { QuestRankLadder } from '@/components/quests/QuestRankLadder';
import { useQuestRank, useQuests } from '@/hooks/useQuests';
import { HUNTER_RANKS } from '@/lib/xp';

export default function ShadowArmyScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const rankQ = useQuestRank();
  const questsQ = useQuests({ completed: true });

  const rank = rankQ.data;
  const army = useMemo(() => {
    return questsQ.data?.quests.slice(0, 200) ?? [];
  }, [questsQ.data]);

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={questsQ.isFetching}
            onRefresh={() => {
              questsQ.refetch();
              rankQ.refetch();
            }}
          />
        }>
        <PageHeader
          title="Shadow Army"
          subtitle="Hunter Rank"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <QuestRankBadgeCard
          rank={rank?.rank}
          nextRank={rank?.nextRank}
          score={(rank?.completedCount ?? 0) + (rank?.sRankCount ?? 0)}
          progressPct={rank?.progressPct ?? 0}
          toNext={rank?.toNext ?? 0}
          subtitle={
            rank
              ? `${rank.completedCount} cleared · ${rank.sRankCount} S-rank`
              : undefined
          }
          accent={accent}
        />

        <SectionTitle title="Rank Path" accent={accent} />
        <QuestRankLadder
          ladder={HUNTER_RANKS}
          score={(rank?.completedCount ?? 0) + (rank?.sRankCount ?? 0)}
          currentKey={rank?.rank.key}
          unitLabel="clears"
        />

        <SectionTitle title={`Trophy Hall (${army.length})`} accent={accent} />
        {army.length === 0 ? (
          <Text style={styles.emptyTxt}>No clears yet — your shadow army awaits.</Text>
        ) : (
          <View style={styles.grid}>
            {army.map((q) => {
              const c = priorityColor[q.priority] ?? accent;
              return (
                <Pressable
                  key={q.id}
                  onPress={() => router.push(`/quest/${q.id}`)}
                  style={[styles.shadowCard, { borderColor: c + '88', backgroundColor: c + '11' }]}>
                  <Text style={[styles.shadowPrio, { color: c }]}>{q.priority}</Text>
                  {q.isBoss && <Ionicons name="flame" size={11} color="#ef4444" />}
                  <Text style={styles.shadowTitle} numberOfLines={2}>
                    {q.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  emptyTxt: { color: palette.textMuted, paddingHorizontal: 20, fontSize: 13 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
  },
  shadowCard: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    gap: 2,
  },
  shadowPrio: { fontWeight: '900', fontSize: 11 },
  shadowTitle: { color: palette.textMuted, fontSize: 9, fontWeight: '700' },
});

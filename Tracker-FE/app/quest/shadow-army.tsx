import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
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

        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.rankCard, { borderColor: rank?.rank.color ?? accent }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rankKicker}>CURRENT RANK</Text>
              <Text style={[styles.rankTitle, { color: rank?.rank.color ?? palette.text }]}>
                {rank?.rank.title ?? '—'}
              </Text>
              <Text style={styles.rankSub}>
                {rank?.completedCount ?? 0} cleared · {rank?.sRankCount ?? 0} S-rank
              </Text>
              {rank?.nextRank && (
                <>
                  <View style={styles.rankBarBg}>
                    <View
                      style={[
                        styles.rankBarFill,
                        { width: `${rank.progressPct}%`, backgroundColor: rank.rank.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.rankBarTxt}>
                    {rank.toNext} clears to <Text style={{ color: rank.nextRank.color }}>{rank.nextRank.title}</Text>
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="trophy" size={48} color={rank?.rank.color ?? accent} />
          </View>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <View style={{ paddingHorizontal: 20, gap: 6 }}>
          {HUNTER_RANKS.map((r) => {
            const score = (rank?.completedCount ?? 0) + (rank?.sRankCount ?? 0);
            const unlocked = score >= r.min;
            const isCurrent = rank?.rank.key === r.key;
            return (
              <View
                key={r.key}
                style={[
                  styles.rankRow,
                  { borderColor: unlocked ? r.color + '88' : palette.border },
                  isCurrent && { backgroundColor: r.color + '11', borderColor: r.color },
                ]}>
                <Ionicons
                  name={unlocked ? 'checkmark-circle' : 'lock-closed'}
                  size={20}
                  color={unlocked ? r.color : palette.textDim}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankRowTitle, { color: unlocked ? r.color : palette.textMuted }]}>
                    {r.title}
                  </Text>
                  <Text style={styles.rankRowSub}>{r.min} clears required</Text>
                </View>
                {isCurrent && (
                  <Text style={[styles.currentTag, { color: r.color }]}>YOU ARE HERE</Text>
                )}
              </View>
            );
          })}
        </View>

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
  rankCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankKicker: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  rankTitle: { fontSize: 24, fontWeight: '900' },
  rankSub: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  rankBarBg: { height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  rankBarFill: { height: '100%', borderRadius: 3 },
  rankBarTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800', marginTop: 6 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  rankRowTitle: { fontSize: 14, fontWeight: '800' },
  rankRowSub: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  currentTag: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
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

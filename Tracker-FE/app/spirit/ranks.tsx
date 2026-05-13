import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { RankLadder } from '@/components/gamification/RankLadder';
import { useSpiritRank } from '@/hooks/useSpirit';
import { CHAKRA_RANKS } from '@/lib/xp';

export default function SpiritRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const rankQ = useSpiritRank();
  const rank = rankQ.data;

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={rankQ.isFetching} onRefresh={() => rankQ.refetch()} />
        }>
        <PageHeader
          title="Chakra Path"
          subtitle="Cultivate. Flow. Awaken."
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.heroCard, { borderColor: rank?.rank.color ?? accent }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CURRENT RANK</Text>
              <Text style={[styles.title, { color: rank?.rank.color ?? palette.text }]}>
                {rank?.rank.title ?? '—'}
              </Text>
              {rank && (
                <Text style={styles.sub}>
                  {rank.habitCount} habits · {rank.sleepCount} sleep · {rank.weightCount} weigh-ins ·{' '}
                  {rank.fastCount} fasts
                </Text>
              )}
              {rank?.nextRank && (
                <>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${rank.progressPct}%`, backgroundColor: rank.rank.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.barTxt}>
                    {rank.toNext} logs to{' '}
                    <Text style={{ color: rank.nextRank.color }}>{rank.nextRank.title}</Text>
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="sparkles" size={48} color={rank?.rank.color ?? accent} />
          </View>
        </View>

        <View style={styles.formula}>
          <Text style={styles.formulaTxt}>
            Score = habits + sleep + weigh-ins + check-ins + step-goal days + completed fasts × 3.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <RankLadder
          ladder={CHAKRA_RANKS}
          score={rank?.score ?? 0}
          currentKey={rank?.rank.key}
          unitLabel="logs"
        />
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kicker: { color: palette.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800', marginTop: 6 },
  formula: { paddingHorizontal: 20, marginTop: 16 },
  formulaTxt: { color: palette.textMuted, fontSize: 12, fontStyle: 'italic' },
});

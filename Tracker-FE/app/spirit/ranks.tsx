import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { SpiritRankBadgeCard } from '@/components/spirit/SpiritRankBadgeCard';
import { SpiritRankLadder } from '@/components/spirit/SpiritRankLadder';
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
          title="Hidden Leaf"
          subtitle="Train. Endure. Awaken."
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <SpiritRankBadgeCard
          rank={rank?.rank}
          nextRank={rank?.nextRank}
          score={rank?.score ?? 0}
          progressPct={rank?.progressPct ?? 0}
          toNext={rank?.toNext ?? 0}
          subtitle={
            rank
              ? `${rank.habitCount} habits · ${rank.sleepCount} sleep · ${rank.weightCount} weigh-ins · ${rank.fastCount} fasts`
              : undefined
          }
          accent={accent}
        />

        <View style={{ ...styles.formula, ...styles.card }}>
          <Text style={styles.formulaTxt}>
            Score = habits + sleep + weigh-ins + check-ins + step-goal days + completed fasts × 3.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <SpiritRankLadder
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
  formula: { paddingHorizontal: 20, marginTop: 16 },
  formulaTxt: { color: palette.textMuted, fontSize: 12, fontStyle: 'italic' },
  card: {
    backgroundColor: palette.bg + 'aa',
    borderRadius: 5,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    padding: 4,
  },
});

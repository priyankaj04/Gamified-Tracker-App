import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { SpiritRankBadgeCard } from '@/components/spirit/SpiritRankBadgeCard';
import { SpiritRankLadder } from '@/components/spirit/SpiritRankLadder';
import { useSpiritRank } from '@/hooks/useSpirit';
import { CHAKRA_RANKS } from '@/lib/xp';

export default function SpiritRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.spirit.accent;
  const rankQ = useSpiritRank();
  const rank = rankQ.data;

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={rankQ.isFetching} onRefresh={() => rankQ.refetch()} />
        }>
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
          right={
            <Pressable
              hitSlop={8}
              onPress={() => router.back()}
              style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          }
        />

        <View style={styles.formula}>
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7,7,16,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formula: { paddingHorizontal: 20, marginTop: 16 },
  formulaTxt: { color: palette.textMuted, fontSize: 12, fontStyle: 'italic' },
});

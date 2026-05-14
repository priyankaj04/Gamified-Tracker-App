import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { ForgeRankBadgeCard } from '@/components/forge/ForgeRankBadgeCard';
import { ForgeRankLadder } from '@/components/forge/ForgeRankLadder';
import { useForgeRank } from '@/hooks/useForgeStats';
import { BLUE_LOCK_RANKS } from '@/lib/xp';

export default function ForgeRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;
  const rankQ = useForgeRank();
  const rank = rankQ.data;

  return (
    <ThemedScene scene="forge">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={rankQ.isFetching} onRefresh={() => rankQ.refetch()} />
        }>
        <PageHeader
          title="Blue Lock"
          subtitle="Devour. Ship. Dominate."
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <ForgeRankBadgeCard
          rank={rank?.rank}
          nextRank={rank?.nextRank}
          score={rank?.score ?? 0}
          progressPct={rank?.progressPct ?? 0}
          toNext={rank?.toNext ?? 0}
          subtitle={
            rank
              ? `${rank.sessionCount} sessions · ${rank.shippedCount} shipped`
              : undefined
          }
          accent={accent}
        />

        <View style={{ ...styles.formula, ...styles.card }}>
          <Text style={styles.formulaTxt}>
            Score = sessions + shipped × 10. A shipped project is the only thing that matters.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <ForgeRankLadder
          ladder={BLUE_LOCK_RANKS}
          score={rank?.score ?? 0}
          currentKey={rank?.rank.key}
          unitLabel="goals"
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

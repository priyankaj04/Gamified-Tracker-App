import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { DojoRankBadgeCard } from '@/components/dojo/DojoRankBadgeCard';
import { DojoRankLadder } from '@/components/dojo/DojoRankLadder';
import { useDojoRank } from '@/hooks/useWorkouts';
import { DEMON_SLAYER_RANKS } from '@/lib/xp';

export default function DojoRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const rankQ = useDojoRank();
  const rank = rankQ.data;

  return (
    <ThemedScene scene="dojo">
      <ScrollView
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={rankQ.isFetching} onRefresh={() => rankQ.refetch()} />
        }>
        <DojoRankBadgeCard
          rank={rank?.rank}
          nextRank={rank?.nextRank}
          score={rank?.score ?? 0}
          progressPct={rank?.progressPct ?? 0}
          toNext={rank?.toNext ?? 0}
          subtitle={
            rank
              ? `${rank.workoutCount} workouts · ${rank.prCount} PRs`
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

        <View style={{ ...styles.formula, ...styles.card }}>
          <Text style={styles.formulaTxt}>
            Score = workouts + PRs × 3. Personal records carry the weight of a Hashira's blade.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <DojoRankLadder
          ladder={DEMON_SLAYER_RANKS}
          score={rank?.score ?? 0}
          currentKey={rank?.rank.key}
          unitLabel="strikes"
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

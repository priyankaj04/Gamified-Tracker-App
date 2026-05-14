import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { DashboardRankBadgeCard } from '@/components/dashboard/DashboardRankBadgeCard';
import { DashboardRankLadder } from '@/components/dashboard/DashboardRankLadder';
import { useGameState } from '@/hooks/useGame';
import { getDashboardRank, SOLO_LEVELING_RANKS } from '@/lib/xp';

export default function DashboardRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.dashboard.accent;
  const gameQ = useGameState();
  const totalXp = gameQ.data?.totalXp ?? 0;
  const rank = getDashboardRank(totalXp);

  return (
    <ThemedScene scene="dashboard">
      <ScrollView
        contentContainerStyle={{ paddingTop: 48, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={gameQ.isFetching}
            onRefresh={() => gameQ.refetch()}
          />
        }>
        <DashboardRankBadgeCard
          totalXp={totalXp}
          subtitle={
            gameQ.data
              ? `Level ${gameQ.data.level} · ${totalXp.toLocaleString()} total XP`
              : undefined
          }
          accent={accent}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </Pressable>
          }
        />

        <View style={{ ...styles.formula, ...styles.card }}>
          <Text style={styles.formulaTxt}>
            Score = total XP across every module. Every rep, ship, fast, save, and clear lifts the Monarch.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <DashboardRankLadder
          ladder={SOLO_LEVELING_RANKS}
          score={totalXp}
          currentKey={rank.key}
          unitLabel="XP"
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

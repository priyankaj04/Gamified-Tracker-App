import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { VaultRankBadgeCard } from '@/components/vault/VaultRankBadgeCard';
import { VaultRankLadder } from '@/components/vault/VaultRankLadder';
import { useVaultGame } from '@/hooks/useFinance';
import { MAGE_RANKS } from '@/lib/xp';

export default function VaultRanksScreen() {
  const router = useRouter();
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const gameQ = useVaultGame();
  const game = gameQ.data;

  return (
    <ThemedScene scene="vault">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={gameQ.isFetching} onRefresh={() => gameQ.refetch()} />
        }>
        <PageHeader
          title="Mage's Ledger"
          subtitle="Save. Stack. Etch the lines."
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <VaultRankBadgeCard
          rank={game?.rank}
          nextRank={game?.nextRank}
          score={game?.vaultXp ?? 0}
          progressPct={game?.progressPct ?? 0}
          toNext={game?.toNext ?? 0}
          subtitle={
            game
              ? `${game.vaultXp.toLocaleString()} Vault XP · 🔥 ${game.streak.count} day streak`
              : undefined
          }
          accent={accent}
        />

        <View style={{ ...styles.formula, ...styles.card }}>
          <Text style={styles.formulaTxt}>
            Score = total vault XP. Every line on the wand is earned, not given.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <VaultRankLadder
          ladder={MAGE_RANKS}
          score={game?.vaultXp ?? 0}
          currentKey={game?.rank.key}
          unitLabel="vault XP"
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

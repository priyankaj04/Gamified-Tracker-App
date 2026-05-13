import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { RankLadder } from '@/components/gamification/RankLadder';
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

        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.heroCard, { borderColor: game?.rank.color ?? accent }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>CURRENT RANK</Text>
              <Text style={[styles.title, { color: game?.rank.color ?? palette.text }]}>
                {game?.rank.title ?? '—'}
              </Text>
              <Text style={styles.sub}>
                {game?.vaultXp.toLocaleString() ?? 0} Vault XP · 🔥 {game?.streak.count ?? 0} day streak
              </Text>
              {game?.nextRank && (
                <>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${game.progressPct}%`, backgroundColor: game.rank.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.barTxt}>
                    {game.toNext.toLocaleString()} vault XP to{' '}
                    <Text style={{ color: game.nextRank.color }}>{game.nextRank.title}</Text>
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="flash" size={48} color={game?.rank.color ?? accent} />
          </View>
        </View>

        <View style={styles.formula}>
          <Text style={styles.formulaTxt}>
            Score = total vault XP. Every line on the wand is earned, not given.
          </Text>
        </View>

        <SectionTitle title="Rank Path" accent={accent} />
        <RankLadder
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

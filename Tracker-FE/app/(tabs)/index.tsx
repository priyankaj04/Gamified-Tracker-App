import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { XPBar } from '@/components/gamification/XPBar';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { TodayCard } from '@/components/workout/TodayCard';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { USER_NAME } from '@/constants';
import { useGameState } from '@/hooks/useGame';
import { useChallenges, useBadges } from '@/hooks/useBadges';
import type { Module } from '@/types';

const moduleMeta: { module: Module; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { module: 'dojo', icon: 'flame', label: 'Dojo' },
  { module: 'forge', icon: 'code-slash', label: 'Forge' },
  { module: 'spirit', icon: 'pulse', label: 'Spirit' },
  { module: 'vault', icon: 'wallet', label: 'Vault' },
  { module: 'quests', icon: 'list', label: 'Quests' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return 'Konbanwa';
  if (h < 12) return 'Ohayou';
  if (h < 17) return 'Konnichiwa';
  return 'Konbanwa';
};

const todayDate = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

export default function Dashboard() {
  const router = useRouter();
  const game = useGameState();
  const challenges = useChallenges();
  const badges = useBadges();
  const accent = screenTheme.dashboard.accent;

  const xp = game.data?.totalXp ?? 0;
  const streaks = game.data?.streaks;
  const activeStreaks = streaks
    ? Object.values(streaks).filter((s) => s.count > 0).length
    : 0;
  const unlocked = badges.data?.summary?.unlocked ?? 0;

  const onQuickAdd = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <ThemedScene scene="dashboard">
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl
          tintColor={accent}
          refreshing={game.isFetching}
          onRefresh={() => {
            game.refetch();
            challenges.refetch();
            badges.refetch();
          }}
        />
      }>
      <PageHeader
        title={`${greeting()}, ${USER_NAME} ⚡`}
        subtitle={todayDate()}
        accent={accent}
        accent2={screenTheme.dashboard.accent2}
        right={
          <Pressable onPress={() => router.push('/hall' as any)} hitSlop={8}>
            <Ionicons name="trophy" size={22} color={accent} />
          </Pressable>
        }
      />

      <View style={styles.section}>
        <View style={styles.row}>
          <LevelBadge xp={xp} />
          <Pressable onPress={() => router.push('/settings' as any)} hitSlop={8}>
            <Ionicons name="settings-outline" size={20} color={palette.textMuted} />
          </Pressable>
        </View>
        <View style={{ height: 12 }} />
        <XPBar xp={xp} />
      </View>

      <SectionTitle title="Today's Workout" accent={accent} />
      <TodayCard />

      <SectionTitle title="Streaks" accent={accent} />
      <View style={styles.streakRow}>
        {moduleMeta.map((m) => {
          const s = streaks?.[m.module];
          return (
            <View key={m.module} style={styles.streakCell}>
              <StreakFlame
                count={s?.count ?? 0}
                color={(screenTheme as any)[m.module]?.accent}
                size="sm"
                label={m.label}
              />
            </View>
          );
        })}
      </View>

      <SectionTitle title="Daily Challenges" accent={accent} />
      {challenges.data?.challenges?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}>
          {challenges.data.challenges.map((c: any) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <EmptyState
            icon="rocket"
            title="No challenges yet"
            message="Connect the API to fetch today's daily quests."
            accent={accent}
          />
        </View>
      )}

      <SectionTitle title="Stats" accent={accent} />
      <View style={styles.statGrid}>
        <StatCard
          label="Total XP"
          value={xp.toLocaleString()}
          icon="flash"
          accent={accent}
        />
        <StatCard
          label="Active Streaks"
          value={activeStreaks}
          icon="flame"
          accent="#f97316"
        />
        <StatCard
          label="Badges Unlocked"
          value={`${unlocked} / ${badges.data?.summary?.total ?? 0}`}
          icon="trophy"
          accent="#fbbf24"
        />
        <StatCard label="Level" value={game.data?.level ?? 1} icon="ribbon" accent={accent} />
      </View>

      <SectionTitle title="Quick Add" accent={accent} />
      <View style={styles.quickRow}>
        <QuickBtn icon="flame" label="Workout" color={screenTheme.dojo.accent} onPress={() => onQuickAdd('/dojo/new-workout')} />
        <QuickBtn icon="code-slash" label="Session" color={screenTheme.forge.accent} onPress={() => onQuickAdd('/(tabs)/forge')} />
        <QuickBtn icon="pulse" label="Weight" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/(tabs)/spirit')} />
        <QuickBtn icon="wallet" label="Money" color={screenTheme.vault.accent} onPress={() => onQuickAdd('/(tabs)/vault')} />
        <QuickBtn icon="list" label="Quest" color={screenTheme.quests.accent} onPress={() => onQuickAdd('/(tabs)/quests')} />
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
    </ThemedScene>
  );
}

function QuickBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.7 }, { borderColor: color + '66' }]}>
      <View style={[styles.quickIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  streakCell: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  hScroll: { paddingHorizontal: 20, gap: 12 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
  },
  quick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
});

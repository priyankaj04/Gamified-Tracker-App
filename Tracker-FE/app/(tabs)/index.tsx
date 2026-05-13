import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, screenTheme, spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';

// Gamification primitives
import { XPBar } from '@/components/gamification/XPBar';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { ChallengeCard } from '@/components/gamification/ChallengeCard';
import { ModuleRankCard } from '@/components/gamification/ModuleRankCard';
import { BadgeCard } from '@/components/gamification/BadgeCard';

// Module-specific widgets being reused
import { TodayCard } from '@/components/workout/TodayCard';
import { DashboardQuestWidget } from '@/components/quests/DashboardQuestWidget';
import { StatCard } from '@/components/ui/StatCard';
import { WellnessRing } from '@/components/spirit/WellnessRing';
import { MacroDonut } from '@/components/spirit/MacroDonut';
import { GoalRing } from '@/components/spirit/GoalRing';
import { StreaksRow as SpiritStreaksRow } from '@/components/spirit/StreaksRow';
import { NextBadgeCard } from '@/components/spirit/NextBadgeCard';
import { WeightChart } from '@/components/spirit/WeightChart';
import { CycleCalendar } from '@/components/spirit/CycleCalendar';
import { MeasurementCard } from '@/components/spirit/MeasurementCard';
import { ForgeActivityGrid } from '@/components/forge/ForgeActivityGrid';
import { ProjectCard } from '@/components/forge/ProjectCard';
import { SnippetCard } from '@/components/forge/SnippetCard';

// Hooks
import { USER_NAME } from '@/constants';
import { useGameState } from '@/hooks/useGame';
import { useChallenges, useBadges } from '@/hooks/useBadges';
import { useQuestRank } from '@/hooks/useQuests';
import {
  useWellnessScore,
  useProfile,
  useSpiritRank,
  useLatestMeasurement,
} from '@/hooks/useSpirit';
import { useNutritionSummary } from '@/hooks/useNutrition';
import { useTodayHabits, useCompleteHabit } from '@/hooks/useHabits';
import { useSleepStats } from '@/hooks/useSleep';
import { useActiveFast } from '@/hooks/useFasting';
import { useWeight } from '@/hooks/useWeight';
import { useCyclePrediction, useCycleSettings } from '@/hooks/useCycle';
import { useActiveTimer, useSessionGrid } from '@/hooks/useSessions';
import { useDailyGoal, useForgeSummary, useForgeRank } from '@/hooks/useForgeStats';
import { useDsaStats } from '@/hooks/useDSA';
import { useProjects } from '@/hooks/useProjects';
import { useSnippets } from '@/hooks/useSnippets';
import { useLearningStats } from '@/hooks/useLearning';
import { useTodayStandup } from '@/hooks/useStandup';
import {
  useNetWorth,
  useSubscriptionsSummary,
  useRecurring,
  useTransactions,
  useVaultGame,
  useVaultStats,
  useGoals as useVaultGoals,
} from '@/hooks/useFinance';
import { useDojoRank, useWeeklyStats, useAllTimeStats } from '@/hooks/useWorkouts';
import { useCardio } from '@/hooks/useCardio';
import { todayISO } from '@/components/ui/DatePicker';
import { fmtINR } from '../vault/_shared';

import type { Module } from '@/types';

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

const QUOTES = [
  'Discipline today, freedom tomorrow.',
  'Small reps. Long compound.',
  'You are what you log.',
  'The arrow moves forward, even slowly.',
  'Cleared the easy. Now the bosses.',
  'Skill is a habit you forgot quitting.',
  'Iron sharpens iron — log the rep.',
];

const fmtElapsed = (sec: number) => {
  if (!sec || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 86_400_000);

const moduleMeta: { module: Module; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { module: 'dojo', icon: 'flame', label: 'Dojo' },
  { module: 'forge', icon: 'code-slash', label: 'Forge' },
  { module: 'spirit', icon: 'pulse', label: 'Spirit' },
  { module: 'vault', icon: 'wallet', label: 'Vault' },
  { module: 'quests', icon: 'list', label: 'Quests' },
];

export default function Dashboard() {
  const router = useRouter();
  const today = todayISO();
  const accent = screenTheme.dashboard.accent;

  // Core game state
  const game = useGameState();
  const challenges = useChallenges();
  const badges = useBadges();
  const profile = useProfile();

  // Quest
  const questRank = useQuestRank();

  // Spirit
  const wellness = useWellnessScore();
  const nutrition = useNutritionSummary(today);
  const habitsToday = useTodayHabits();
  const completeHabit = useCompleteHabit();
  const sleepStats = useSleepStats();
  const activeFast = useActiveFast();
  const spiritRank = useSpiritRank();
  const latestMeasurement = useLatestMeasurement();
  const weight = useWeight();
  const cycleSettings = useCycleSettings();
  const cyclePred = useCyclePrediction();

  // Forge
  const activeTimer = useActiveTimer();
  const dailyGoal = useDailyGoal();
  const forgeSummary = useForgeSummary();
  const forgeRank = useForgeRank();
  const dsaStats = useDsaStats();
  const sessionGrid = useSessionGrid(91);
  const pinnedProjects = useProjects({ pinned: true });
  const pinnedSnippets = useSnippets({ pinned: true });
  const learning = useLearningStats();
  const todayStandup = useTodayStandup();

  // Vault
  const netWorth = useNetWorth();
  const subs = useSubscriptionsSummary();
  const recurring = useRecurring();
  const vaultGoals = useVaultGoals();
  const todayTx = useTransactions({ from: today, to: today });
  const vaultGame = useVaultGame();
  const vaultStats = useVaultStats(1);

  // Dojo
  const dojoRank = useDojoRank();
  const weeklyStats = useWeeklyStats(1);
  const allTimeStats = useAllTimeStats();
  const cardio = useCardio({ from: today, to: today });

  const xp = game.data?.totalXp ?? 0;
  const streaks = game.data?.streaks;
  const activeStreaks = streaks ? Object.values(streaks).filter((s) => s.count > 0).length : 0;
  const unlocked = badges.data?.summary?.unlocked ?? 0;

  // Derived values
  const profileCreatedAt = (profile.data as any)?.createdAt;
  const journeyDay = profileCreatedAt
    ? Math.max(1, daysBetween(new Date(profileCreatedAt), new Date()) + 1)
    : null;

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  const fastElapsedSec = activeFast.data
    ? Math.floor((Date.now() - new Date(activeFast.data.startTime).getTime()) / 1000)
    : 0;

  const timerElapsedSec = activeTimer.data?.timer?.startedAt
    ? Math.floor((Date.now() - new Date(activeTimer.data.timer.startedAt).getTime()) / 1000)
    : 0;

  const nw = netWorth.data?.snapshots ?? [];
  const latestNW = nw[nw.length - 1];
  const prevNW = nw[nw.length - 2];
  const nwDelta = latestNW && prevNW ? latestNW.netWorth - prevNW.netWorth : 0;

  const upcomingBills = useMemo(() => {
    const arr = recurring.data?.recurring ?? [];
    return arr
      .filter((r) => !r.cancelled && !r.paused)
      .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
      .slice(0, 3);
  }, [recurring.data]);

  const topSavingsGoal = useMemo(() => {
    const arr = vaultGoals.data?.goals ?? [];
    return arr
      .filter((g) => !g.completed && !g.archived)
      .sort((a, b) => b.currentAmount / Math.max(1, b.targetAmount) - a.currentAmount / Math.max(1, a.targetAmount))[0];
  }, [vaultGoals.data]);

  const todaySpend = useMemo(() => {
    const arr = todayTx.data?.transactions ?? [];
    let inc = 0;
    let exp = 0;
    for (const t of arr) {
      if (t.type === 'Income') inc += t.amount;
      else if (t.type === 'Expense') exp += t.amount;
    }
    return { inc, exp, net: inc - exp };
  }, [todayTx.data]);

  const weightSeries = useMemo(() => {
    const entries = weight.data?.entries ?? [];
    return entries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((e) => e.weightKg);
  }, [weight.data]);

  const recentlyUnlocked = useMemo(() => {
    const arr = badges.data?.badges ?? [];
    return arr.filter((b) => b.unlocked).slice(0, 6);
  }, [badges.data]);

  const pinnedProject = pinnedProjects.data?.projects?.[0];
  const pinnedSnippet = pinnedSnippets.data?.snippets?.[0];

  const onQuickAdd = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const refreshAll = () => {
    game.refetch();
    challenges.refetch();
    badges.refetch();
    wellness.refetch();
    nutrition.refetch();
    habitsToday.refetch();
    sleepStats.refetch();
    activeFast.refetch();
    activeTimer.refetch();
    dailyGoal.refetch();
    forgeSummary.refetch();
    dsaStats.refetch();
    netWorth.refetch();
    subs.refetch();
    recurring.refetch();
    vaultGoals.refetch();
    todayTx.refetch();
    vaultStats.refetch();
    weeklyStats.refetch();
    allTimeStats.refetch();
    cardio.refetch();
    weight.refetch();
  };

  const isFetching =
    game.isFetching || badges.isFetching || wellness.isFetching || netWorth.isFetching;

  return (
    <ThemedScene scene="dashboard">
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refreshAll} />
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

        {/* Identity row: level + journey + settings */}
        <View style={styles.section}>
          <View style={styles.identityRow}>
            <LevelBadge xp={xp} />
            <View style={{ flex: 1 }}>
              {journeyDay && (
                <Text style={styles.journey}>Day {journeyDay} of your arc</Text>
              )}
              <Text style={styles.quote} numberOfLines={1}>“{quote}”</Text>
            </View>
            <Pressable onPress={() => router.push('/settings' as any)} hitSlop={8}>
              <Ionicons name="settings-outline" size={20} color={palette.textMuted} />
            </Pressable>
          </View>
          <View style={{ height: 12 }} />
          <XPBar xp={xp} />
        </View>

        {/* ── Active now banner ─────────────────────────────── */}
        {(activeTimer.data?.timer || activeFast.data) && (
          <View style={{ paddingHorizontal: 20, marginTop: 6 }}>
            {activeTimer.data?.timer && (
              <ActiveBanner
                accent={screenTheme.forge.accent}
                icon="code-slash"
                kicker="ACTIVE SESSION"
                title="Coding in progress"
                detail={fmtElapsed(timerElapsedSec)}
                onPress={() => router.push('/forge/active-session' as any)}
              />
            )}
            {activeFast.data && (
              <ActiveBanner
                accent={screenTheme.spirit.accent}
                icon="timer"
                kicker="FAST IN PROGRESS"
                title={`Target ${activeFast.data.targetHours}h`}
                detail={fmtElapsed(fastElapsedSec)}
                onPress={() => router.push('/spirit/fasting' as any)}
              />
            )}
          </View>
        )}

        {/* ── Today's Hunt ──────────────────────────────────── */}
        <SectionTitle title="Today's Hunt" accent={screenTheme.quests.accent} />
        <DashboardQuestWidget />

        {/* ── Today's Workout ───────────────────────────────── */}
        <SectionTitle title="Today's Workout" accent={screenTheme.dojo.accent} />
        <TodayCard />

        {/* ── Streaks across modules ────────────────────────── */}
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

        {/* ── SPIRIT ────────────────────────────────────────── */}
        <SectionTitle
          title="Spirit · Wellness"
          accent={screenTheme.spirit.accent}
          right={<ChevronLink onPress={() => router.push('/(tabs)/spirit')} color={screenTheme.spirit.accent} />}
        />

        <View style={styles.wellnessCard}>
          <WellnessRing score={wellness.data?.total ?? 0} size={150} />
          <View style={{ flex: 1, gap: 8 }}>
            <MiniStat
              label="Sleep last night"
              value={
                sleepStats.data?.avgDuration7d != null
                  ? `${sleepStats.data.avgDuration7d.toFixed(1)}h`
                  : '—'
              }
              caption={
                sleepStats.data?.avgQuality7d
                  ? `Q ${sleepStats.data.avgQuality7d.toFixed(1)}/5`
                  : 'No data'
              }
              color="#a78bfa"
            />
            <MiniStat
              label="Calories"
              value={
                nutrition.data
                  ? `${Math.round(nutrition.data.caloriesConsumed)}${
                      nutrition.data.caloriesGoal ? ` / ${nutrition.data.caloriesGoal}` : ''
                    }`
                  : '—'
              }
              caption={
                nutrition.data?.deficit != null
                  ? nutrition.data.deficit > 0
                    ? `${Math.round(nutrition.data.deficit)} deficit`
                    : `${Math.abs(Math.round(nutrition.data.deficit))} surplus`
                  : 'Log a meal'
              }
              color={screenTheme.spirit.accent}
            />
            <MiniStat
              label="Water"
              value={
                nutrition.data
                  ? `${(nutrition.data.waterMl / 1000).toFixed(1)} / ${(
                      nutrition.data.waterGoal / 1000
                    ).toFixed(0)}L`
                  : '—'
              }
              caption=""
              color="#22d3ee"
            />
          </View>
        </View>

        <View style={{ height: 4 }} />
        <SpiritStreaksRow />

        {/* Today's habits */}
        {habitsToday.data && habitsToday.data.length > 0 && (
          <View style={styles.habitsCard}>
            <View style={styles.habitsHead}>
              <Text style={styles.cardTitle}>Today's Habits</Text>
              <Pressable onPress={() => router.push('/spirit/habits' as any)} hitSlop={6}>
                <Text style={[styles.cardCta, { color: screenTheme.spirit.accent }]}>All →</Text>
              </Pressable>
            </View>
            {habitsToday.data.slice(0, 5).map((h) => (
              <Pressable
                key={h.id}
                style={styles.habitRow}
                onPress={() => {
                  if (h.completedToday) return;
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  completeHabit.mutate(h.id);
                }}>
                <Text style={styles.habitEmoji}>{h.emoji}</Text>
                <Text
                  style={[
                    styles.habitName,
                    h.completedToday && { textDecorationLine: 'line-through', color: spiritText.tertiary },
                  ]}
                  numberOfLines={1}>
                  {h.name}
                </Text>
                <Ionicons
                  name={h.completedToday ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={h.completedToday ? '#4ade80' : palette.textMuted}
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* Macros donut + body delta */}
        {nutrition.data && (nutrition.data.proteinConsumed + nutrition.data.carbsConsumed + nutrition.data.fatsConsumed) > 0 && (
          <View style={styles.macroCard}>
            <MacroDonut
              proteinG={nutrition.data.proteinConsumed}
              carbsG={nutrition.data.carbsConsumed}
              fatsG={nutrition.data.fatsConsumed}
              size={120}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.cardTitle}>Today's Fuel</Text>
              <Text style={styles.fuelLine}>
                <Text style={{ color: '#16a34a', fontWeight: '900' }}>P</Text>{' '}
                {Math.round(nutrition.data.proteinConsumed)}g
                {nutrition.data.proteinGoal && (
                  <Text style={styles.muted}> / {nutrition.data.proteinGoal}</Text>
                )}
              </Text>
              <Text style={styles.fuelLine}>
                <Text style={{ color: '#fbbf24', fontWeight: '900' }}>C</Text>{' '}
                {Math.round(nutrition.data.carbsConsumed)}g
                {nutrition.data.carbsGoal && (
                  <Text style={styles.muted}> / {nutrition.data.carbsGoal}</Text>
                )}
              </Text>
              <Text style={styles.fuelLine}>
                <Text style={{ color: '#f97316', fontWeight: '900' }}>F</Text>{' '}
                {Math.round(nutrition.data.fatsConsumed)}g
                {nutrition.data.fatsGoal && (
                  <Text style={styles.muted}> / {nutrition.data.fatsGoal}</Text>
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Weight chart */}
        {weightSeries.length >= 2 && (
          <View style={styles.chartCard}>
            <View style={styles.habitsHead}>
              <Text style={styles.cardTitle}>Weight · last 30 logs</Text>
              <Pressable onPress={() => router.push('/spirit/weight-log' as any)} hitSlop={6}>
                <Text style={[styles.cardCta, { color: screenTheme.spirit.accent }]}>Log →</Text>
              </Pressable>
            </View>
            <WeightChart values={weightSeries} color={screenTheme.spirit.accent} height={120} width={320} />
          </View>
        )}

        {/* Body measurements latest snapshot */}
        {latestMeasurement.data && (
          <View style={styles.measureGrid}>
            <MeasurementCard
              label="Waist"
              value={latestMeasurement.data.waistCm ?? null}
              icon="resize"
              accent={screenTheme.spirit.accent}
              onPress={() => router.push('/spirit/measurements' as any)}
            />
            <MeasurementCard
              label="Chest"
              value={latestMeasurement.data.chestCm ?? null}
              icon="body"
              accent={screenTheme.spirit.accent}
              onPress={() => router.push('/spirit/measurements' as any)}
            />
            <MeasurementCard
              label="Biceps"
              value={latestMeasurement.data.bicepsCm ?? null}
              icon="barbell"
              accent={screenTheme.spirit.accent}
              onPress={() => router.push('/spirit/measurements' as any)}
            />
          </View>
        )}

        {/* Cycle (only if enabled) */}
        {cycleSettings.data?.isEnabled && cyclePred.data?.lastPeriodStart && (
          <View style={styles.cycleCard}>
            <View style={styles.habitsHead}>
              <Text style={styles.cardTitle}>Cycle</Text>
              <Pressable onPress={() => router.push('/spirit/cycle' as any)} hitSlop={6}>
                <Text style={[styles.cardCta, { color: '#f43f5e' }]}>Open →</Text>
              </Pressable>
            </View>
            <CycleCalendar
              cycleStart={cyclePred.data.lastPeriodStart}
              averageCycleLength={cyclePred.data.averageCycleLength}
            />
          </View>
        )}

        {/* ── FORGE ─────────────────────────────────────────── */}
        <SectionTitle
          title="Forge · Build"
          accent={screenTheme.forge.accent}
          right={<ChevronLink onPress={() => router.push('/(tabs)/forge')} color={screenTheme.forge.accent} />}
        />

        {/* Daily goal + DSA */}
        <View style={styles.forgeStatsRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardKicker}>Today's Build</Text>
            <Text style={[styles.miniCardValue, { color: screenTheme.forge.accent }]}>
              {dailyGoal.data ? `${Math.floor(dailyGoal.data.todayMinutes / 60)}h ${dailyGoal.data.todayMinutes % 60}m` : '—'}
            </Text>
            {dailyGoal.data && dailyGoal.data.goalMinutes > 0 && (
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(100, dailyGoal.data.pct)}%`,
                      backgroundColor: screenTheme.forge.accent,
                    },
                  ]}
                />
              </View>
            )}
            <Text style={styles.miniCardCaption}>
              {dailyGoal.data?.goalStreak ? `🔥 ${dailyGoal.data.goalStreak}d goal streak` : 'Goal not set'}
            </Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniCardKicker}>DSA · this week</Text>
            <Text style={[styles.miniCardValue, { color: screenTheme.forge.accent }]}>
              {dsaStats.data
                ? `${dsaStats.data.weeklyGoalProgress.current}/${dsaStats.data.weeklyGoalProgress.goal}`
                : '—'}
            </Text>
            {dsaStats.data && dsaStats.data.weeklyGoalProgress.goal > 0 && (
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.round(
                          (dsaStats.data.weeklyGoalProgress.current / dsaStats.data.weeklyGoalProgress.goal) * 100,
                        ),
                      )}%`,
                      backgroundColor: screenTheme.forge.accent2,
                    },
                  ]}
                />
              </View>
            )}
            <Text style={styles.miniCardCaption}>
              {dsaStats.data ? `${dsaStats.data.currentStreak}d streak` : 'No DSA yet'}
            </Text>
          </View>
        </View>

        {/* Forge week summary banner */}
        {forgeSummary.data && (
          <Pressable
            style={styles.statBanner}
            onPress={() => router.push('/forge/forge-stats' as any)}>
            <Stat label="Today" value={`${Math.floor((forgeSummary.data.todayMinutes ?? 0) / 60)}h`} />
            <Stat label="Week" value={`${Math.floor((forgeSummary.data.weekMinutes ?? 0) / 60)}h`} />
            <Stat label="Month" value={`${Math.floor((forgeSummary.data.monthMinutes ?? 0) / 60)}h`} />
            <Stat label="All time" value={`${Math.floor(forgeSummary.data.allTimeHours ?? 0)}h`} />
          </Pressable>
        )}

        {/* Standup prompt */}
        {!todayStandup.data?.standup && (
          <CalloutCard
            icon="newspaper"
            color="#818cf8"
            title="Log today's standup"
            message="Yesterday, today, blockers — a 30-second journal."
            cta="Write →"
            onPress={() => router.push('/forge/standup' as any)}
          />
        )}

        {/* Pinned project */}
        {pinnedProject && (
          <View style={{ paddingHorizontal: 20 }}>
            <ProjectCard
              project={pinnedProject}
              accent={screenTheme.forge.accent}
              onPress={() => router.push(`/forge/${pinnedProject.id}` as any)}
            />
          </View>
        )}

        {/* Recent snippet */}
        {pinnedSnippet && (
          <View style={{ paddingHorizontal: 20 }}>
            <SnippetCard
              snippet={pinnedSnippet}
              onPress={() => router.push('/forge/snippets' as any)}
            />
          </View>
        )}

        {/* Learning in progress */}
        {learning.data && learning.data.totalInProgress > 0 && (
          <CalloutCard
            icon="book"
            color="#a78bfa"
            title={`${learning.data.totalInProgress} learning ${learning.data.totalInProgress === 1 ? 'item' : 'items'} in progress`}
            message={`${learning.data.totalHours.toFixed(1)}h logged total · ${learning.data.completedThisMonth} completed this month`}
            cta="Open →"
            onPress={() => router.push('/forge/learning' as any)}
          />
        )}

        {/* Activity grid */}
        {sessionGrid.data?.grid && sessionGrid.data.grid.length > 0 && (
          <View style={styles.gridCard}>
            <View style={styles.habitsHead}>
              <Text style={styles.cardTitle}>Build streak · 90 days</Text>
              <Pressable onPress={() => router.push('/forge/sessions' as any)} hitSlop={6}>
                <Text style={[styles.cardCta, { color: screenTheme.forge.accent }]}>All →</Text>
              </Pressable>
            </View>
            <ForgeActivityGrid
              data={sessionGrid.data.grid.slice(-91) as any}
              showLegend
            />
          </View>
        )}

        {/* ── VAULT ─────────────────────────────────────────── */}
        <SectionTitle
          title="Vault · Money"
          accent={screenTheme.vault.accent}
          right={<ChevronLink onPress={() => router.push('/(tabs)/vault')} color={screenTheme.vault.accent} />}
        />

        {/* Net worth */}
        {latestNW && (
          <Pressable
            style={[styles.netWorthCard, { borderColor: screenTheme.vault.accent + '66' }]}
            onPress={() => router.push('/vault/accounts' as any)}>
            <View>
              <Text style={styles.miniCardKicker}>Net worth</Text>
              <Text style={[styles.netWorthValue, { color: screenTheme.vault.accent }]}>
                {fmtINR(latestNW.netWorth)}
              </Text>
              {prevNW && (
                <Text style={[styles.miniCardCaption, { color: nwDelta >= 0 ? '#4ade80' : '#ef4444' }]}>
                  {nwDelta >= 0 ? '▲' : '▼'} {fmtINR(Math.abs(nwDelta))} since last snapshot
                </Text>
              )}
            </View>
            <Ionicons name="wallet" size={36} color={screenTheme.vault.accent} />
          </Pressable>
        )}

        {/* Today's spend + savings rate + frugal */}
        <View style={styles.statBanner}>
          <Stat label="Today spend" value={fmtINR(todaySpend.exp)} />
          <Stat label="Today income" value={fmtINR(todaySpend.inc)} color="#4ade80" />
          {vaultStats.data && (
            <Stat
              label="Burn / day"
              value={fmtINR(vaultStats.data.burnRate ?? 0)}
            />
          )}
          {vaultStats.data && (
            <Stat
              label="Frugal days"
              value={`${vaultStats.data.frugalDaysThisMonth}`}
            />
          )}
        </View>

        {/* Subscriptions drain */}
        {subs.data && subs.data.monthlyTotal > 0 && (
          <CalloutCard
            icon="receipt"
            color="#f472b6"
            title={`Subscription drain: ${fmtINR(subs.data.monthlyTotal)}/mo`}
            message={`${subs.data.subscriptions.length} active subscriptions`}
            cta="Review →"
            onPress={() => router.push('/vault/subscriptions' as any)}
          />
        )}

        {/* Top savings goal */}
        {topSavingsGoal && (
          <View style={{ paddingHorizontal: 20 }}>
            <GoalRing
              progress={
                topSavingsGoal.targetAmount > 0
                  ? Math.min(1, topSavingsGoal.currentAmount / topSavingsGoal.targetAmount)
                  : 0
              }
              title={`${topSavingsGoal.emoji} ${topSavingsGoal.name}`}
              subtitle={`${fmtINR(topSavingsGoal.currentAmount)} / ${fmtINR(topSavingsGoal.targetAmount)}`}
              color={topSavingsGoal.color || screenTheme.vault.accent}
              completed={topSavingsGoal.completed}
              onPress={() => router.push('/vault/goals' as any)}
              size={140}
            />
          </View>
        )}

        {/* Upcoming bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.billsCard}>
            <View style={styles.habitsHead}>
              <Text style={styles.cardTitle}>Upcoming bills</Text>
              <Pressable onPress={() => router.push('/vault/recurring' as any)} hitSlop={6}>
                <Text style={[styles.cardCta, { color: screenTheme.vault.accent }]}>All →</Text>
              </Pressable>
            </View>
            {upcomingBills.map((b) => {
              const due = new Date(b.nextDue);
              const dleft = daysBetween(new Date(), due);
              const tag =
                dleft < 0 ? `${Math.abs(dleft)}d overdue` : dleft === 0 ? 'today' : `in ${dleft}d`;
              const danger = dleft <= 1;
              return (
                <View key={b.id} style={styles.billRow}>
                  <Ionicons name="repeat" size={16} color={palette.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billName} numberOfLines={1}>
                      {b.name}
                    </Text>
                    <Text style={[styles.muted, { color: danger ? '#ef4444' : palette.textMuted }]}>
                      {tag}
                    </Text>
                  </View>
                  <Text style={[styles.billAmount, { color: b.type === 'Income' ? '#4ade80' : '#ef4444' }]}>
                    {fmtINR(b.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── DOJO ──────────────────────────────────────────── */}
        <SectionTitle
          title="Dojo · Train"
          accent={screenTheme.dojo.accent}
          right={<ChevronLink onPress={() => router.push('/(tabs)/dojo')} color={screenTheme.dojo.accent} />}
        />

        {weeklyStats.data?.week?.[0] && (
          <View style={styles.statBanner}>
            <Stat label="This week" value={`${weeklyStats.data.week[0].workouts} wo`} />
            <Stat
              label="Volume"
              value={`${(weeklyStats.data.week[0].volume / 1000).toFixed(1)}t`}
            />
            <Stat
              label="Minutes"
              value={`${weeklyStats.data.week[0].minutes}m`}
            />
            {allTimeStats.data && (
              <Stat label="PRs" value={`${allTimeStats.data.totalPRs}`} />
            )}
          </View>
        )}

        {cardio.data?.sessions && cardio.data.sessions.length > 0 && (
          <CalloutCard
            icon="bicycle"
            color={screenTheme.dojo.accent}
            title={`Cardio today: ${cardio.data.sessions[0].activityType}`}
            message={`${cardio.data.sessions[0].durationMinutes}m${
              cardio.data.sessions[0].distanceKm ? ` · ${cardio.data.sessions[0].distanceKm}km` : ''
            }`}
            cta="View →"
            onPress={() => router.push('/dojo/cardio' as any)}
          />
        )}

        {allTimeStats.data?.favoriteExercise && (
          <CalloutCard
            icon="trophy"
            color="#fbbf24"
            title={`Favorite lift: ${allTimeStats.data.favoriteExercise}`}
            message={`${allTimeStats.data.totalWorkouts} workouts · longest streak ${allTimeStats.data.longestStreak}d`}
            cta="Records →"
            onPress={() => router.push('/dojo/records' as any)}
          />
        )}

        {/* ── MODULE RANKS ─────────────────────────────────── */}
        <SectionTitle title="Ranks" accent={screenTheme.hall.accent} />
        <ModuleRankCard
          kicker="HUNTER RANK"
          rank={questRank.data?.rank}
          nextRank={questRank.data?.nextRank}
          progressPct={questRank.data?.progressPct ?? 0}
          toNext={questRank.data?.toNext ?? 0}
          unitLabel="clears"
          subtitle={
            questRank.data
              ? `${questRank.data.completedCount} cleared · ${questRank.data.sRankCount} S-rank`
              : undefined
          }
          accent={screenTheme.quests.accent}
          icon="trophy"
          onPress={() => router.push('/quest/shadow-army' as any)}
        />
        <ModuleRankCard
          kicker="DEMON SLAYER RANK"
          rank={dojoRank.data?.rank}
          nextRank={dojoRank.data?.nextRank}
          progressPct={dojoRank.data?.progressPct ?? 0}
          toNext={dojoRank.data?.toNext ?? 0}
          unitLabel="strikes"
          subtitle={
            dojoRank.data
              ? `${dojoRank.data.workoutCount} workouts · ${dojoRank.data.prCount} PRs`
              : undefined
          }
          accent={screenTheme.dojo.accent}
          icon="flame"
          onPress={() => router.push('/dojo/ranks' as any)}
        />
        <ModuleRankCard
          kicker="BLUE LOCK RANK"
          rank={forgeRank.data?.rank}
          nextRank={forgeRank.data?.nextRank}
          progressPct={forgeRank.data?.progressPct ?? 0}
          toNext={forgeRank.data?.toNext ?? 0}
          unitLabel="goals"
          subtitle={
            forgeRank.data
              ? `${forgeRank.data.sessionCount} sessions · ${forgeRank.data.shippedCount} shipped`
              : undefined
          }
          accent={screenTheme.forge.accent}
          icon="football"
          onPress={() => router.push('/forge/ranks' as any)}
        />
        <ModuleRankCard
          kicker="CHAKRA PATH"
          rank={spiritRank.data?.rank}
          nextRank={spiritRank.data?.nextRank}
          progressPct={spiritRank.data?.progressPct ?? 0}
          toNext={spiritRank.data?.toNext ?? 0}
          unitLabel="logs"
          subtitle={
            spiritRank.data
              ? `${spiritRank.data.habitCount} habits · ${spiritRank.data.sleepCount} sleep`
              : undefined
          }
          accent={screenTheme.spirit.accent}
          icon="sparkles"
          onPress={() => router.push('/spirit/ranks' as any)}
        />
        <ModuleRankCard
          kicker="MAGE RANK"
          rank={vaultGame.data?.rank}
          nextRank={vaultGame.data?.nextRank}
          progressPct={vaultGame.data?.progressPct ?? 0}
          toNext={vaultGame.data?.toNext ?? 0}
          unitLabel="vault XP"
          subtitle={
            vaultGame.data
              ? `${vaultGame.data.vaultXp.toLocaleString()} Vault XP · 🔥 ${vaultGame.data.streak.count}d`
              : undefined
          }
          accent={screenTheme.vault.accent}
          icon="flash"
          onPress={() => router.push('/vault/ranks' as any)}
        />

        {/* ── BADGES ────────────────────────────────────────── */}
        <SectionTitle title="Badges" accent={accent} />
        <NextBadgeCard />
        {recentlyUnlocked.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeStrip}>
            {recentlyUnlocked.map((b) => (
              <View key={b.id} style={styles.badgeCell}>
                <BadgeCard badge={b} onPress={() => router.push('/hall' as any)} />
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── DAILY CHALLENGES ──────────────────────────────── */}
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

        {/* ── STATS ─────────────────────────────────────────── */}
        <SectionTitle title="Stats" accent={accent} />
        <View style={styles.statGrid}>
          <StatCard label="Total XP" value={xp.toLocaleString()} icon="flash" accent={accent} />
          <StatCard label="Active Streaks" value={activeStreaks} icon="flame" accent="#f97316" />
          <StatCard
            label="Badges"
            value={`${unlocked} / ${badges.data?.summary?.total ?? 0}`}
            icon="trophy"
            accent="#fbbf24"
          />
          <StatCard label="Level" value={game.data?.level ?? 1} icon="ribbon" accent={accent} />
        </View>

        {/* ── QUICK ADD (expanded) ──────────────────────────── */}
        <SectionTitle title="Quick Add" accent={accent} />
        <View style={styles.quickGrid}>
          <QuickBtn icon="flame" label="Workout" color={screenTheme.dojo.accent} onPress={() => onQuickAdd('/dojo/new-workout')} />
          <QuickBtn icon="play-circle" label="Start WO" color={screenTheme.dojo.accent} onPress={() => onQuickAdd('/dojo/active-workout')} />
          <QuickBtn icon="bicycle" label="Cardio" color={screenTheme.dojo.accent} onPress={() => onQuickAdd('/dojo/cardio')} />
          <QuickBtn icon="code-slash" label="Session" color={screenTheme.forge.accent} onPress={() => onQuickAdd('/forge/session-new')} />
          <QuickBtn icon="timer" label="Focus" color={screenTheme.forge.accent} onPress={() => onQuickAdd('/forge/focus')} />
          <QuickBtn icon="bug" label="DSA" color={screenTheme.forge.accent} onPress={() => onQuickAdd('/forge/dsa-new')} />
          <QuickBtn icon="code" label="Snippet" color={screenTheme.forge.accent} onPress={() => onQuickAdd('/forge/snippets')} />
          <QuickBtn icon="newspaper" label="Standup" color="#818cf8" onPress={() => onQuickAdd('/forge/standup')} />
          <QuickBtn icon="scale" label="Weight" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/spirit/weight-log')} />
          <QuickBtn icon="restaurant" label="Meal" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/spirit/nutrition-log')} />
          <QuickBtn icon="moon" label="Sleep" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/spirit/sleep')} />
          <QuickBtn icon="happy" label="Mood" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/spirit/energy-mood')} />
          <QuickBtn icon="checkmark-done" label="Habit" color={screenTheme.spirit.accent} onPress={() => onQuickAdd('/spirit/habits')} />
          <QuickBtn icon="wallet" label="Money" color={screenTheme.vault.accent} onPress={() => onQuickAdd('/(tabs)/vault')} />
          <QuickBtn icon="list" label="Quest" color={screenTheme.quests.accent} onPress={() => onQuickAdd('/(tabs)/quests')} />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </ThemedScene>
  );
}

// ─── Inline subcomponents ─────────────────────────────────────────

function ActiveBanner({
  accent,
  icon,
  kicker,
  title,
  detail,
  onPress,
}: {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  kicker: string;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activeBanner,
        { borderColor: accent + '88', shadowColor: accent },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.activeIcon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.activeKicker, { color: accent }]}>{kicker}</Text>
        <Text style={styles.activeTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={[styles.activeDetail, { color: accent }]}>{detail}</Text>
    </Pressable>
  );
}

function MiniStat({
  label,
  value,
  caption,
  color,
}: {
  label: string;
  value: string;
  caption: string;
  color: string;
}) {
  return (
    <View style={styles.miniStatRow}>
      <View style={[styles.miniDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.miniStatLabel}>{label}</Text>
        <Text style={styles.miniStatValue}>{value}</Text>
        {caption ? <Text style={styles.miniStatCaption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

function CalloutCard({
  icon,
  color,
  title,
  message,
  cta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  message: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.callout,
        { borderColor: color + '66' },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.calloutIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.calloutTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.calloutMsg} numberOfLines={2}>
          {message}
        </Text>
      </View>
      <Text style={[styles.calloutCta, { color }]}>{cta}</Text>
    </Pressable>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.bannerVal, color ? { color } : null]}>{value}</Text>
      <Text style={styles.bannerLabel}>{label}</Text>
    </View>
  );
}

function ChevronLink({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Ionicons name="chevron-forward" size={18} color={color} />
    </Pressable>
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quick,
        pressed && { opacity: 0.7 },
        { borderColor: color + '66' },
      ]}>
      <View style={[styles.quickIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 6 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  journey: { color: palette.text, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  quote: { color: palette.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 },

  streakRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
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

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
  },
  quick: {
    width: '22.5%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  activeTitle: { color: palette.text, fontWeight: '900', fontSize: 14, marginTop: 1 },
  activeDetail: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },

  wellnessCard: {
    marginHorizontal: 20,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  miniStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniStatLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  miniStatValue: { color: palette.text, fontSize: 14, fontWeight: '900' },
  miniStatCaption: { color: palette.textDim, fontSize: 11, fontWeight: '700' },

  habitsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 6,
  },
  habitsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { color: palette.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  cardCta: { fontSize: 11, fontWeight: '900' },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: palette.bgElevated,
    borderRadius: 10,
  },
  habitEmoji: { fontSize: 18 },
  habitName: { flex: 1, color: palette.text, fontSize: 13, fontWeight: '700' },

  macroCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fuelLine: { color: palette.text, fontSize: 13, fontWeight: '800' },
  muted: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },

  chartCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 8,
  },

  measureGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },

  cycleCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 8,
  },

  forgeStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  miniCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 4,
  },
  miniCardKicker: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  miniCardValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  miniCardCaption: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  barBg: {
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: '100%', borderRadius: 2 },

  statBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
  },
  bannerVal: { color: palette.text, fontSize: 14, fontWeight: '900' },
  bannerLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 3,
    textTransform: 'uppercase',
  },

  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  calloutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: { color: palette.text, fontSize: 13, fontWeight: '900' },
  calloutMsg: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  calloutCta: { fontSize: 11, fontWeight: '900' },

  gridCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 8,
  },

  netWorthCard: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netWorthValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },

  billsCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: palette.bgElevated,
    borderRadius: 8,
  },
  billName: { color: palette.text, fontSize: 13, fontWeight: '800' },
  billAmount: { fontSize: 13, fontWeight: '900' },

  badgeStrip: { paddingHorizontal: 20, gap: 10 },
  badgeCell: { width: 150 },
});

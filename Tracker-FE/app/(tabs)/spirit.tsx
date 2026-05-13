import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { WellnessRing } from '@/components/spirit/WellnessRing';
import { GoalRing } from '@/components/spirit/GoalRing';
import { AnimatedCard } from '@/components/spirit/AnimatedCard';
import { QuestsCard } from '@/components/spirit/QuestsCard';
import { StreaksRow } from '@/components/spirit/StreaksRow';
import { PerfectDayBanner } from '@/components/spirit/PerfectDayBanner';
import { NextBadgeCard } from '@/components/spirit/NextBadgeCard';
import { useWeight } from '@/hooks/useWeight';
import { useTodayHabits, useCompleteHabit } from '@/hooks/useHabits';
import { useNutritionSummary } from '@/hooks/useNutrition';
import { useSleep, useSleepGoal } from '@/hooks/useSleep';
import { useActiveFast } from '@/hooks/useFasting';
import { useSpiritRank, useStepsStats, useWellnessScore, useWellnessToday } from '@/hooks/useSpirit';
import { SpiritRankBadgeCard } from '@/components/spirit/SpiritRankBadgeCard';
import { useGoals } from '@/hooks/useGoals';
import { useGameState } from '@/hooks/useGame';
import { useDevicePedometer } from '@/hooks/usePedometer';
import { useCycleSettings, useCyclePrediction } from '@/hooks/useCycle';
import { todayISO } from '@/components/ui/DatePicker';

export default function SpiritScreen() {
  const router = useRouter();
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;

  const score = useWellnessScore();
  const weight = useWeight();
  const habits = useTodayHabits();
  const completeHabit = useCompleteHabit();
  const summary = useNutritionSummary(todayISO());
  const sleep = useSleep();
  const sleepGoal = useSleepGoal();
  const activeFast = useActiveFast();
  const stepsStats = useStepsStats();
  const goals = useGoals();
  const game = useGameState();
  const pedometer = useDevicePedometer();
  const wellnessToday = useWellnessToday();
  const rank = useSpiritRank();
  const cycleSettings = useCycleSettings();
  const cyclePrediction = useCyclePrediction();

  const wellnessLoggedToday =
    !!wellnessToday.data &&
    (wellnessToday.data.mood != null ||
      wellnessToday.data.energyLevel != null ||
      wellnessToday.data.stressLevel != null);

  const refreshing =
    score.isFetching ||
    weight.isFetching ||
    habits.isFetching ||
    summary.isFetching ||
    sleep.isFetching;

  const refetchAll = () => {
    score.refetch();
    weight.refetch();
    habits.refetch();
    summary.refetch();
    sleep.refetch();
    sleepGoal.refetch();
    activeFast.refetch();
    stepsStats.refetch();
    goals.refetch();
    game.refetch();
    wellnessToday.refetch();
    cycleSettings.refetch();
    cyclePrediction.refetch();
  };

  const latestWeight = weight.data?.entries?.[0];
  const lastSleep = sleep.data?.[0];
  const habitsDoneToday = habits.data?.filter((h) => h.completedToday).length ?? 0;
  const habitsTotalToday = habits.data?.length ?? 0;

  // Sleep is "logged for last night" if its wake-day matches today OR yesterday
  // (the latter covers entries saved between local midnight and dawn).
  const weightDoneToday = !!latestWeight && latestWeight.date === todayISO();
  const mealsDoneToday = (summary.data?.caloriesConsumed ?? 0) > 0;
  const habitsAllDone = !!habitsTotalToday && habitsDoneToday === habitsTotalToday;
  const perfectDay =
    weightDoneToday &&
    mealsDoneToday &&
    habitsAllDone &&
    wellnessLoggedToday;

  const sleepLoggedForLastNight = (() => {
    if (!lastSleep) return false;
    const today = todayISO();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterday =
      `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(
        y.getDate(),
      ).padStart(2, '0')}`;
    return lastSleep.date === today || lastSleep.date === yesterday;
  })();

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={refetchAll} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader
          title="Spirit"
          subtitle="Inner Chakra"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.push('/spirit/profile')} hitSlop={8}>
              <Ionicons name="person-circle" size={28} color={accent} />
            </Pressable>
          }
        />

        <SpiritRankBadgeCard
          rank={rank.data?.rank}
          nextRank={rank.data?.nextRank}
          score={rank.data?.score ?? 0}
          progressPct={rank.data?.progressPct ?? 0}
          toNext={rank.data?.toNext ?? 0}
          subtitle={
            rank.data
              ? `${rank.data.habitCount} habits · ${rank.data.sleepCount} sleep · ${rank.data.weightCount} weigh-ins`
              : undefined
          }
          accent={accent}
          onPress={() => router.push('/spirit/ranks' as any)}
        />

        {/* Wellness composite score */}
        <AnimatedCard index={0}>
          <Pressable
            onPress={() => router.push('/spirit/wellness-score')}
            style={({ pressed }) => [styles.scoreWrap, pressed && { opacity: 0.85 }]}>
            <View style={styles.scoreBackdrop}>
              <View style={styles.scoreGlow}>
                <LinearGradient
                  colors={[accent + '44', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <WellnessRing score={score.data?.total ?? 0} />
              </View>
            </View>
            <Text style={styles.scoreCaption}>Wellness Score · Tap for breakdown</Text>
          </Pressable>
        </AnimatedCard>

        {/* Perfect day celebration banner */}
        <PerfectDayBanner visible={perfectDay} />

        {/* Individual streaks */}
        <AnimatedCard index={1}>
          <StreaksRow />
        </AnimatedCard>

        {/* Daily quests */}
        <AnimatedCard index={2}>
          <QuestsCard />
        </AnimatedCard>

        {/* Next badge progress */}
        <AnimatedCard index={3}>
          <NextBadgeCard />
        </AnimatedCard>

        {/* Pedometer banner */}
        {pedometer.available && pedometer.todaySteps > 0 && (
          <AnimatedCard index={2}>
            <View style={styles.pedoCard}>
              <Ionicons name="footsteps" size={20} color={accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pedoLabel}>Today (synced from device)</Text>
                <Text style={styles.pedoValue}>{pedometer.todaySteps.toLocaleString()} steps</Text>
              </View>
              <View style={[styles.pulseDot, { backgroundColor: accent }]} />
            </View>
          </AnimatedCard>
        )}

        {/* Active fast */}
        {activeFast.data && (
          <AnimatedCard index={2}>
            <Pressable onPress={() => router.push('/spirit/fasting')} style={styles.fastCard}>
              <View style={[styles.fastIconWrap, { backgroundColor: accent2 + '22' }]}>
                <Ionicons name="timer" size={22} color={accent2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fastLabel}>Fasting in progress</Text>
                <Text style={styles.fastValue}>Target {activeFast.data.targetHours}h</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={spiritText.secondary} />
            </Pressable>
          </AnimatedCard>
        )}

        {/* Today's checklist */}
        <SectionTitle title="Today's Checklist" accent={accent} />
        <AnimatedCard index={3}>
          <View style={styles.checklist}>
            <ChecklistRow
              icon="scale"
              label="Log weight"
              done={!!latestWeight && latestWeight.date === todayISO()}
              accent={accent}
              onPress={() => router.push('/spirit/weight-log')}
            />
            <ChecklistRow
              icon="restaurant"
              label="Log meals"
              done={(summary.data?.caloriesConsumed ?? 0) > 0}
              accent={accent}
              onPress={() => router.push('/spirit/nutrition')}
            />
            <ChecklistRow
              icon="checkmark-done"
              label={`Habits (${habitsDoneToday}/${habitsTotalToday})`}
              done={!!habitsTotalToday && habitsDoneToday === habitsTotalToday}
              accent={accent}
              onPress={() => router.push('/spirit/habits')}
            />
            <ChecklistRow
              icon="moon"
              label="Log sleep"
              done={sleepLoggedForLastNight}
              accent={accent}
              onPress={() => router.push('/spirit/sleep')}
            />
            <ChecklistRow
              icon="happy"
              label="Mood check-in"
              done={wellnessLoggedToday}
              accent={accent}
              onPress={() => router.push('/spirit/energy-mood')}
            />
            {cycleSettings.data?.isEnabled && (
              <ChecklistRow
                icon="ellipse"
                label={
                  cyclePrediction.data?.nextPeriodStart
                    ? cyclePrediction.data.daysUntil != null && cyclePrediction.data.daysUntil >= 0
                      ? `Next period in ${cyclePrediction.data.daysUntil}d`
                      : 'Period overdue · log it'
                    : 'Log period'
                }
                done={!!cyclePrediction.data?.nextPeriodStart}
                accent={accent}
                onPress={() => router.push('/spirit/cycle')}
              />
            )}
          </View>
        </AnimatedCard>

        {/* Active Goals */}
        <SectionTitle
          title="Active Goals"
          accent={accent}
          right={
            <Pressable onPress={() => router.push('/spirit/goals')} hitSlop={8}>
              <Ionicons name="add-circle" size={22} color={accent} />
            </Pressable>
          }
        />
        {goals.data?.length ? (
          <AnimatedCard index={4}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalScroll}>
              {goals.data.slice(0, 8).map((g) => (
                <View key={g.id} style={{ width: 150 }}>
                  <GoalRing
                    progress={g.progressPct}
                    title={g.title}
                    subtitle={g.targetValue ? `→ ${g.targetValue}${g.unit ?? ''}` : undefined}
                    color={accent}
                    completed={g.completed}
                    onPress={() =>
                      router.push({ pathname: '/spirit/goal-detail', params: { id: g.id } })
                    }
                  />
                </View>
              ))}
              <Pressable onPress={() => router.push('/spirit/goals')} style={styles.goalAdd}>
                <Ionicons name="add" size={22} color={accent} />
                <Text style={[styles.goalAddLabel, { color: accent }]}>New</Text>
              </Pressable>
            </ScrollView>
          </AnimatedCard>
        ) : (
          <AnimatedCard index={4}>
            <Pressable onPress={() => router.push('/spirit/goals')} style={styles.emptyHint}>
              <Ionicons name="flag" size={26} color={accent} />
              <Text style={styles.hintTitle}>Set your first goal, Shinobi</Text>
              <Text style={styles.hintSub}>What are you training toward?</Text>
            </Pressable>
          </AnimatedCard>
        )}

        {/* Snapshot cards */}
        <SectionTitle title="Snapshots" accent={accent} />
        <View style={styles.snapshots}>
          {[
            {
              icon: 'scale' as const,
              title: 'Weight',
              value: latestWeight ? `${latestWeight.weightKg} kg` : '—',
              sub: weight.data?.goal ? `Goal ${weight.data.goal.targetWeightKg}kg` : 'Set a goal',
              tint: accent,
              go: '/spirit/weight-log' as const,
            },
            {
              icon: 'restaurant' as const,
              title: 'Calories',
              value: summary.data
                ? `${summary.data.caloriesConsumed}${summary.data.caloriesGoal ? ` / ${summary.data.caloriesGoal}` : ''}`
                : '—',
              sub: 'kcal today',
              tint: accent2,
              go: '/spirit/nutrition' as const,
            },
            {
              icon: 'moon' as const,
              title: 'Sleep',
              value: lastSleep?.durationHours ? `${lastSleep.durationHours} hr` : '—',
              sub: `Goal ${sleepGoal.data?.targetHours ?? 8} hr`,
              tint: accent,
              go: '/spirit/sleep' as const,
            },
            {
              icon: 'footsteps' as const,
              title: 'Steps',
              value:
                pedometer.todaySteps > 0
                  ? pedometer.todaySteps.toLocaleString()
                  : (stepsStats.data?.avgDailySteps7d ?? 0).toLocaleString(),
              sub: pedometer.todaySteps > 0 ? 'today' : 'avg / day',
              tint: accent2,
              go: '/spirit/wellness-score' as const,
            },
            {
              icon: 'happy' as const,
              title: 'Mood',
              value: 'Log',
              sub: 'Energy · Stress',
              tint: accent,
              go: '/spirit/energy-mood' as const,
            },
            {
              icon: 'resize' as const,
              title: 'Body',
              value: 'View',
              sub: 'Measurements',
              tint: accent2,
              go: '/spirit/measurements' as const,
            },
            {
              icon: 'body' as const,
              title: 'Composition',
              value: 'View',
              sub: 'Lean · Fat',
              tint: accent,
              go: '/spirit/composition' as const,
            },
            {
              icon: 'calculator' as const,
              title: 'TDEE',
              value: 'Calc',
              sub: 'Cut · Bulk',
              tint: accent2,
              go: '/spirit/tdee' as const,
            },
            {
              icon: 'timer' as const,
              title: 'Fasting',
              value: activeFast.data ? 'Active' : 'Start',
              sub: '16:8 · 18:6 · 24h',
              tint: accent,
              go: '/spirit/fasting' as const,
            },
            {
              icon: 'ellipse' as const,
              title: 'Cycle',
              value:
                cyclePrediction.data?.daysUntil != null && cyclePrediction.data.daysUntil >= 0
                  ? `${cyclePrediction.data.daysUntil}d`
                  : cyclePrediction.data?.nextPeriodStart
                  ? 'Due'
                  : 'Log',
              sub: cyclePrediction.data?.nextPeriodStart
                ? 'Next period'
                : 'Tap to log',
              tint: '#f43f5e',
              go: '/spirit/cycle' as const,
            },
          ].map((c, i) => (
            <AnimatedCard key={c.title} index={5 + i} style={styles.snapWrap}>
              <SnapshotCard
                icon={c.icon}
                title={c.title}
                value={c.value}
                sub={c.sub}
                accent={c.tint}
                onPress={() => router.push(c.go as any)}
              />
            </AnimatedCard>
          ))}
        </View>

        {/* Quick habit row */}
        {habits.data && habits.data.length > 0 && (
          <>
            <SectionTitle
              title="Habits Today"
              accent={accent}
              right={
                <Pressable onPress={() => router.push('/spirit/habits')} hitSlop={8}>
                  <Text style={[styles.linkLabel, { color: accent }]}>View all</Text>
                </Pressable>
              }
            />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {habits.data.slice(0, 5).map((h, i) => (
                <AnimatedCard key={h.id} index={15 + i}>
                  <Pressable
                    onPress={() => !h.completedToday && completeHabit.mutate(h.id)}
                    style={[styles.habitRow, h.completedToday && { opacity: 0.55 }]}>
                    <View style={[styles.habitEmojiWrap, { borderColor: accent + '55' }]}>
                      <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.habitName}>{h.name}</Text>
                      <Text style={styles.habitSub}>+{h.xpPerCompletion} XP</Text>
                    </View>
                    <View style={[styles.checkOuter, h.completedToday && { backgroundColor: accent }]}>
                      <Ionicons
                        name={h.completedToday ? 'checkmark' : 'add'}
                        size={20}
                        color={h.completedToday ? '#0b0b14' : accent}
                      />
                    </View>
                  </Pressable>
                </AnimatedCard>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/spirit/nutrition-log')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}>
        <LinearGradient
          colors={[accent2, accent]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>
    </ThemedScene>
  );
}

function ChecklistRow({
  icon,
  label,
  done,
  accent,
  onPress,
}: {
  icon: any;
  label: string;
  done: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.85 }]}>
      <View style={[styles.checkIconBg, done && { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={14} color={done ? accent : spiritText.secondary} />
      </View>
      <Text
        style={[
          styles.checkLabel,
          done && { color: spiritText.secondary, textDecorationLine: 'line-through' },
        ]}>
        {label}
      </Text>
      {done ? (
        <Ionicons name="checkmark-circle" size={20} color={accent} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={spiritText.tertiary} />
      )}
    </Pressable>
  );
}

function SnapshotCard({
  icon,
  title,
  value,
  sub,
  accent,
  onPress,
}: {
  icon: any;
  title: string;
  value: string;
  sub: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.snap, pressed && { opacity: 0.85 }]}>
      <LinearGradient
        colors={[accent + '10', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.snapHead}>
        <View style={[styles.snapIcon, { backgroundColor: accent + '22' }]}>
          <Ionicons name={icon} size={12} color={accent} />
        </View>
        <Text style={styles.snapTitle}>{title}</Text>
      </View>
      <Text style={[styles.snapValue, { color: accent }]}>{value}</Text>
      <Text style={styles.snapSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scoreWrap: { alignItems: 'center', paddingTop: 4 },
  scoreBackdrop: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 7, 16, 0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  scoreGlow: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scoreCaption: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  streakRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  streakCount: { fontWeight: '900', fontSize: 13 },
  streakLabel: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  pedoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pedoLabel: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pedoValue: { color: palette.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  checklist: { paddingHorizontal: 20, gap: 8 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  checkIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cardAlt,
  },
  checkLabel: { color: palette.text, flex: 1, fontSize: 14, fontWeight: '700' },
  fastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fastIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastLabel: {
    color: spiritText.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fastValue: { color: palette.text, fontSize: 15, fontWeight: '800', marginTop: 2 },
  goalScroll: { paddingHorizontal: 20, gap: 12 },
  goalAdd: {
    width: 124,
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  goalAddLabel: { fontSize: 12, fontWeight: '800' },
  emptyHint: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: palette.card,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  hintTitle: { color: palette.text, fontSize: 14, fontWeight: '900' },
  hintSub: { color: spiritText.secondary, fontSize: 12, fontWeight: '700' },
  snapshots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  snapWrap: { width: '31.5%' },
  snap: {
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  snapHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  snapIcon: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  snapTitle: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  snapValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  snapSub: { color: spiritText.tertiary, fontSize: 11, fontWeight: '700' },
  linkLabel: { fontSize: 12, fontWeight: '800' },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  habitEmojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: palette.cardAlt,
  },
  habitName: { color: palette.text, fontSize: 14, fontWeight: '800' },
  habitSub: { color: spiritText.secondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  checkOuter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cardAlt,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
  },
});

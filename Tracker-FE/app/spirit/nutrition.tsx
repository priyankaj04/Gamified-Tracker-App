import React from 'react';
import {
  Alert,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { palette, screenTheme, spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { XPBadge } from '@/components/gamification/XPBadge';
import { MacroDonut } from '@/components/spirit/MacroDonut';
import { AnimatedCard } from '@/components/spirit/AnimatedCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { todayISO } from '@/components/ui/DatePicker';

import {
  useNutritionSummary,
  useLogWater,
  useDeleteMeal,
  useRecentMeals,
  useLogMeal,
} from '@/hooks/useNutrition';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const MEAL_ICONS: Record<(typeof MEAL_TYPES)[number], any> = {
  Breakfast: 'sunny',
  Lunch: 'restaurant',
  Dinner: 'moon',
  Snack: 'cafe',
};

export default function NutritionScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const router = useRouter();
  const date = todayISO();

  const summary = useNutritionSummary(date);
  const recent = useRecentMeals();
  const logMeal = useLogMeal();
  const logWater = useLogWater();
  const delMeal = useDeleteMeal();

  const totals = summary.data;
  const calProgress =
    totals?.caloriesGoal && totals.caloriesGoal > 0
      ? Math.min(1, totals.caloriesConsumed / totals.caloriesGoal)
      : 0;

  const grouped = (totals?.meals ?? []).reduce<Record<string, NonNullable<typeof totals>['meals']>>(
    (acc, m) => {
      if (!acc[m.mealType]) acc[m.mealType] = [];
      acc[m.mealType].push(m);
      return acc;
    },
    {},
  );

  const refreshing = summary.isFetching || recent.isFetching;
  const onRefresh = () => {
    summary.refetch();
    recent.refetch();
  };

  const waterMl = totals?.waterMl ?? 0;
  const waterGoal = totals?.waterGoal ?? 4000;
  const glassUnit = Math.max(250, Math.floor(waterGoal / 8));

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader
          title="Nutrition"
          subtitle="Calories · Macros · Water"
          accent={accent}
          accent2={accent2}
          back
          compact
          right={
            <Pressable onPress={() => router.push('/spirit/tdee')} hitSlop={8}>
              <Ionicons name="calculator-outline" size={22} color={accent2} />
            </Pressable>
          }
        />

        {/* Calorie + macro hero card */}
        <AnimatedCard index={0}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[accent + '22', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroRow}>
              <View style={{ alignItems: 'center' }}>
                <ProgressRing
                  progress={calProgress}
                  color={accent}
                  size={130}
                  centerValue={`${totals?.caloriesConsumed ?? 0}`}
                  label={totals?.caloriesGoal ? `of ${totals.caloriesGoal}` : 'kcal'}
                />
                <Text style={styles.miniCaption}>Consumed</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MacroDonut
                  proteinG={totals?.proteinConsumed ?? 0}
                  carbsG={totals?.carbsConsumed ?? 0}
                  fatsG={totals?.fatsConsumed ?? 0}
                />
                <Text style={styles.miniCaption}>Macro Split</Text>
              </View>
            </View>

            {totals?.deficit != null && (
              <View
                style={[
                  styles.deficitPill,
                  {
                    borderColor: totals.deficit >= 0 ? accent : palette.danger,
                    backgroundColor:
                      (totals.deficit >= 0 ? accent : palette.danger) + '22',
                  },
                ]}>
                <Ionicons
                  name={totals.deficit >= 0 ? 'trending-down' : 'trending-up'}
                  size={13}
                  color={totals.deficit >= 0 ? accent : palette.danger}
                />
                <Text
                  style={{
                    color: totals.deficit >= 0 ? '#ffffff' : '#ffffff',
                    fontWeight: '900',
                    fontSize: 13,
                  }}>
                  {totals.deficit >= 0
                    ? `${totals.deficit} kcal under goal`
                    : `${Math.abs(totals.deficit)} kcal over goal`}
                </Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        {/* Macros card */}
        <SectionTitle title="Macros" accent={accent} />
        <AnimatedCard index={1}>
          <View style={styles.cardBlock}>
            <MacroBar
              label="Protein"
              consumed={totals?.proteinConsumed ?? 0}
              goal={totals?.proteinGoal ?? null}
              color={accent}
            />
            <MacroBar
              label="Carbs"
              consumed={totals?.carbsConsumed ?? 0}
              goal={totals?.carbsGoal ?? null}
              color={accent2}
            />
            <MacroBar
              label="Fats"
              consumed={totals?.fatsConsumed ?? 0}
              goal={totals?.fatsGoal ?? null}
              color="#f97316"
            />
          </View>
        </AnimatedCard>

        {/* Water card */}
        <SectionTitle title="Water" accent={accent} />
        <AnimatedCard index={2}>
          <View style={styles.cardBlock}>
            <View style={styles.waterTop}>
              <View>
                <Text style={styles.waterBig}>
                  {waterMl}
                  <Text style={styles.waterUnit}> / {waterGoal} ml</Text>
                </Text>
                <Text style={styles.waterSub}>
                  {Math.round((waterMl / Math.max(1, waterGoal)) * 100)}% of goal
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  logWater.mutate(
                    { amountMl: 250 },
                    {
                      onError: (e: any) =>
                        Alert.alert('Could not save water', e?.message ?? 'Try again'),
                    },
                  )
                }
                disabled={logWater.isPending}
                style={({ pressed }) => [
                  styles.waterBtn,
                  { borderColor: accent, backgroundColor: accent + '22' },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                  logWater.isPending && { opacity: 0.5 },
                ]}>
                <Ionicons name="water" size={14} color="#ffffff" />
                <Text style={styles.waterBtnLabel}>+250 ml</Text>
              </Pressable>
            </View>
            <View style={styles.glassRow}>
              {Array.from({ length: 8 }).map((_, i) => {
                const filled = waterMl >= (i + 1) * glassUnit;
                return (
                  <View
                    key={i}
                    style={[
                      styles.glass,
                      filled && {
                        backgroundColor: accent,
                        borderColor: accent,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </AnimatedCard>

        {/* Quick add */}
        {recent.data && recent.data.length > 0 && (
          <>
            <SectionTitle title="Quick Add" accent={accent} />
            <AnimatedCard index={3}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {recent.data.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() =>
                      logMeal.mutate({
                        mealType: m.mealType,
                        name: m.name,
                        calories: m.calories,
                        proteinG: m.proteinG,
                        carbsG: m.carbsG,
                        fatsG: m.fatsG,
                      })
                    }
                    style={({ pressed }) => [
                      styles.chip,
                      { borderColor: accent + '55' },
                      pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                    ]}>
                    <View style={[styles.chipIcon, { backgroundColor: accent + '33' }]}>
                      <Ionicons name="add" size={12} color="#ffffff" />
                    </View>
                    <View>
                      <Text style={styles.chipName} numberOfLines={1}>
                        {m.name}
                      </Text>
                      <Text style={styles.chipKcal}>{m.calories} kcal</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </AnimatedCard>
          </>
        )}

        {/* Meals grouped by type */}
        <SectionTitle title="Meals" accent={accent} />
        {MEAL_TYPES.map((mt, idx) => {
          const items = grouped[mt] ?? [];
          return (
            <AnimatedCard key={mt} index={4 + idx}>
              <View style={[styles.mealGroup, { borderColor: accent + '33' }]}>
                <View style={styles.mealGroupHead}>
                  <View style={[styles.mealTypeIcon, { backgroundColor: accent + '33' }]}>
                    <Ionicons name={MEAL_ICONS[mt]} size={13} color="#ffffff" />
                  </View>
                  <Text style={styles.mealGroupLabel}>{mt}</Text>
                  <Text style={styles.mealGroupKcal}>
                    {items.reduce((s, m) => s + m.calories, 0)} kcal
                  </Text>
                </View>
                {items.length === 0 ? (
                  <Text style={styles.mealEmpty}>Nothing logged</Text>
                ) : (
                  items.map((m) => (
                    <View key={m.id} style={styles.mealRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealName}>{m.name}</Text>
                        <Text style={styles.mealMacros}>
                          P {m.proteinG}g · C {m.carbsG}g · F {m.fatsG}g
                        </Text>
                      </View>
                      <Text style={styles.mealKcal}>{m.calories} kcal</Text>
                      <XPBadge amount={m.xpEarned} color={accent} />
                      <Pressable onPress={() => delMeal.mutate(m.id)} hitSlop={8} style={styles.delBtn}>
                        <Ionicons name="trash" size={14} color="#ffffff" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            </AnimatedCard>
          );
        })}

        {(!totals?.meals || totals.meals.length === 0) && (
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <EmptyState
              icon="restaurant"
              title="Log your first meal"
              message="Tap + to add a meal — track macros and stay on target."
              accent={accent}
            />
          </View>
        )}
      </ScrollView>

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

function MacroBar({
  label,
  consumed,
  goal,
  color,
}: {
  label: string;
  consumed: number;
  goal: number | null;
  color: string;
}) {
  const pct = goal ? Math.min(1, consumed / goal) : 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHead}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroVal}>
          {consumed.toFixed(0)}g{goal ? ` / ${goal}g` : ''}
        </Text>
      </View>
      <View style={styles.macroBg}>
        <View
          style={[
            styles.macroFill,
            {
              backgroundColor: color,
              width: goal ? `${pct * 100}%` : '6%',
              opacity: goal ? 1 : 0.6,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  miniCaption: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  deficitPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
  },
  cardBlock: {
    marginHorizontal: 20,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  macroRow: { gap: 6 },
  macroHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flex: 1,
  },
  macroVal: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  macroBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  macroFill: { height: 8, borderRadius: 4 },
  waterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterBig: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  waterUnit: { color: spiritText.secondary, fontSize: 13, fontWeight: '700' },
  waterSub: { color: spiritText.secondary, fontSize: 11, fontWeight: '800', marginTop: 2 },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  waterBtnLabel: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  glassRow: { flexDirection: 'row', gap: 6 },
  glass: {
    flex: 1,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 140,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipName: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  chipKcal: { color: spiritText.secondary, fontSize: 11, fontWeight: '700' },
  mealGroup: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  mealGroupHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealTypeIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealGroupLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  mealGroupKcal: { color: spiritText.secondary, fontSize: 12, fontWeight: '800' },
  mealEmpty: {
    color: spiritText.secondary,
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 6,
    fontStyle: 'italic',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mealName: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  mealMacros: { color: spiritText.secondary, fontSize: 11, fontWeight: '800', marginTop: 2 },
  mealKcal: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  delBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
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

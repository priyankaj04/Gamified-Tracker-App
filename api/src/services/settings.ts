import { supabase } from './supabase';

const fromRow = (r: any) => ({
  weightUnit: r.weight_unit,
  distanceUnit: r.distance_unit,
  defaultRestSeconds: r.default_rest_seconds,
  autoStartRest: r.auto_start_rest,
  oneRmFormula: r.one_rm_formula,
  weekStartsMonday: r.week_starts_monday,
  barbellWeightKg: r.barbell_weight_kg,
  workoutReminderEnabled: r.workout_reminder_enabled ?? false,
  reminderHour: r.reminder_hour ?? 7,
  reminderMinute: r.reminder_minute ?? 0,
  streakAtRiskEnabled: r.streak_at_risk_enabled ?? true,
  weeklySummaryEnabled: r.weekly_summary_enabled ?? true,
  // Forge
  forgeCodeReminderEnabled: r.forge_code_reminder_enabled ?? false,
  forgeCodeReminderHour: r.forge_code_reminder_hour ?? 19,
  forgeCodeReminderMinute: r.forge_code_reminder_minute ?? 0,
  forgeStreakAtRiskEnabled: r.forge_streak_at_risk_enabled ?? true,
  forgeWeeklySummaryEnabled: r.forge_weekly_summary_enabled ?? true,
  // Spirit
  spiritMealRemindersEnabled: r.spirit_meal_reminders_enabled ?? false,
  spiritBreakfastHour: r.spirit_breakfast_hour ?? 8,
  spiritLunchHour: r.spirit_lunch_hour ?? 13,
  spiritDinnerHour: r.spirit_dinner_hour ?? 19,
  spiritHydrationEnabled: r.spirit_hydration_enabled ?? false,
  spiritHydrationStartHour: r.spirit_hydration_start_hour ?? 9,
  spiritHydrationEndHour: r.spirit_hydration_end_hour ?? 21,
  spiritHydrationIntervalHours: r.spirit_hydration_interval_hours ?? 2,
  spiritWindDownEnabled: r.spirit_wind_down_enabled ?? false,
  spiritBedtimeHour: r.spirit_bedtime_hour ?? 23,
  spiritBedtimeMinute: r.spirit_bedtime_minute ?? 0,
  spiritHabitStreakAtRiskEnabled: r.spirit_habit_streak_at_risk_enabled ?? true,
  // Vault
  vaultWeeklyReviewEnabled: r.vault_weekly_review_enabled ?? true,
  vaultWeeklyReviewWeekday: r.vault_weekly_review_weekday ?? 1,
  vaultWeeklyReviewHour: r.vault_weekly_review_hour ?? 19,
  vaultSubscriptionAlertsEnabled: r.vault_subscription_alerts_enabled ?? true,
  // Quest
  questDailySummaryEnabled: r.quest_daily_summary_enabled ?? false,
  questDailySummaryHour: r.quest_daily_summary_hour ?? 20,
  // Gamification
  penaltiesEnabled: r.penalties_enabled ?? false,
});

export const getSettings = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('user_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: inserted } = await sb.from('user_settings').insert({}).select().single();
    return fromRow(inserted);
  }
  return fromRow(data);
};

interface SettingsBody {
  weightUnit?: 'kg' | 'lbs';
  distanceUnit?: 'km' | 'mi';
  defaultRestSeconds?: number;
  autoStartRest?: boolean;
  oneRmFormula?: 'Epley' | 'Brzycki' | 'Lander';
  weekStartsMonday?: boolean;
  barbellWeightKg?: number;
  workoutReminderEnabled?: boolean;
  reminderHour?: number;
  reminderMinute?: number;
  streakAtRiskEnabled?: boolean;
  weeklySummaryEnabled?: boolean;
  forgeCodeReminderEnabled?: boolean;
  forgeCodeReminderHour?: number;
  forgeCodeReminderMinute?: number;
  forgeStreakAtRiskEnabled?: boolean;
  forgeWeeklySummaryEnabled?: boolean;
  spiritMealRemindersEnabled?: boolean;
  spiritBreakfastHour?: number;
  spiritLunchHour?: number;
  spiritDinnerHour?: number;
  spiritHydrationEnabled?: boolean;
  spiritHydrationStartHour?: number;
  spiritHydrationEndHour?: number;
  spiritHydrationIntervalHours?: number;
  spiritWindDownEnabled?: boolean;
  spiritBedtimeHour?: number;
  spiritBedtimeMinute?: number;
  spiritHabitStreakAtRiskEnabled?: boolean;
  vaultWeeklyReviewEnabled?: boolean;
  vaultWeeklyReviewWeekday?: number;
  vaultWeeklyReviewHour?: number;
  vaultSubscriptionAlertsEnabled?: boolean;
  questDailySummaryEnabled?: boolean;
  questDailySummaryHour?: number;
  penaltiesEnabled?: boolean;
}

// Maps camelCase API keys to snake_case DB columns. Keeps updateSettings DRY.
const COLUMN_MAP: Record<string, string> = {
  weightUnit: 'weight_unit',
  distanceUnit: 'distance_unit',
  defaultRestSeconds: 'default_rest_seconds',
  autoStartRest: 'auto_start_rest',
  oneRmFormula: 'one_rm_formula',
  weekStartsMonday: 'week_starts_monday',
  barbellWeightKg: 'barbell_weight_kg',
  workoutReminderEnabled: 'workout_reminder_enabled',
  reminderHour: 'reminder_hour',
  reminderMinute: 'reminder_minute',
  streakAtRiskEnabled: 'streak_at_risk_enabled',
  weeklySummaryEnabled: 'weekly_summary_enabled',
  forgeCodeReminderEnabled: 'forge_code_reminder_enabled',
  forgeCodeReminderHour: 'forge_code_reminder_hour',
  forgeCodeReminderMinute: 'forge_code_reminder_minute',
  forgeStreakAtRiskEnabled: 'forge_streak_at_risk_enabled',
  forgeWeeklySummaryEnabled: 'forge_weekly_summary_enabled',
  spiritMealRemindersEnabled: 'spirit_meal_reminders_enabled',
  spiritBreakfastHour: 'spirit_breakfast_hour',
  spiritLunchHour: 'spirit_lunch_hour',
  spiritDinnerHour: 'spirit_dinner_hour',
  spiritHydrationEnabled: 'spirit_hydration_enabled',
  spiritHydrationStartHour: 'spirit_hydration_start_hour',
  spiritHydrationEndHour: 'spirit_hydration_end_hour',
  spiritHydrationIntervalHours: 'spirit_hydration_interval_hours',
  spiritWindDownEnabled: 'spirit_wind_down_enabled',
  spiritBedtimeHour: 'spirit_bedtime_hour',
  spiritBedtimeMinute: 'spirit_bedtime_minute',
  spiritHabitStreakAtRiskEnabled: 'spirit_habit_streak_at_risk_enabled',
  vaultWeeklyReviewEnabled: 'vault_weekly_review_enabled',
  vaultWeeklyReviewWeekday: 'vault_weekly_review_weekday',
  vaultWeeklyReviewHour: 'vault_weekly_review_hour',
  vaultSubscriptionAlertsEnabled: 'vault_subscription_alerts_enabled',
  questDailySummaryEnabled: 'quest_daily_summary_enabled',
  questDailySummaryHour: 'quest_daily_summary_hour',
  penaltiesEnabled: 'penalties_enabled',
};

export const updateSettings = async (body: SettingsBody) => {
  const sb = supabase();
  const { data: existing } = await sb.from('user_settings').select('id').limit(1).maybeSingle();
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [apiKey, dbCol] of Object.entries(COLUMN_MAP)) {
    const val = (body as any)[apiKey];
    if (val !== undefined) update[dbCol] = val;
  }
  if (existing) {
    const { data } = await sb.from('user_settings').update(update).eq('id', existing.id).select().single();
    return fromRow(data);
  }
  const { data } = await sb.from('user_settings').insert(update).select().single();
  return fromRow(data);
};

// 1RM formulas — returns kg
export const estimateOneRm = (weight: number, reps: number, formula: 'Epley' | 'Brzycki' | 'Lander') => {
  if (reps <= 1) return weight;
  switch (formula) {
    case 'Brzycki':
      return weight * (36 / (37 - reps));
    case 'Lander':
      return (100 * weight) / (101.3 - 2.67123 * reps);
    case 'Epley':
    default:
      return weight * (1 + reps / 30);
  }
};

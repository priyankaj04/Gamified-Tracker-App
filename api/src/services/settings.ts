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
}

export const updateSettings = async (body: SettingsBody) => {
  const sb = supabase();
  const { data: existing } = await sb.from('user_settings').select('id').limit(1).maybeSingle();
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.weightUnit) update.weight_unit = body.weightUnit;
  if (body.distanceUnit) update.distance_unit = body.distanceUnit;
  if (body.defaultRestSeconds !== undefined) update.default_rest_seconds = body.defaultRestSeconds;
  if (body.autoStartRest !== undefined) update.auto_start_rest = body.autoStartRest;
  if (body.oneRmFormula) update.one_rm_formula = body.oneRmFormula;
  if (body.weekStartsMonday !== undefined) update.week_starts_monday = body.weekStartsMonday;
  if (body.barbellWeightKg !== undefined) update.barbell_weight_kg = body.barbellWeightKg;
  if (body.workoutReminderEnabled !== undefined) update.workout_reminder_enabled = body.workoutReminderEnabled;
  if (body.reminderHour !== undefined) update.reminder_hour = body.reminderHour;
  if (body.reminderMinute !== undefined) update.reminder_minute = body.reminderMinute;
  if (body.streakAtRiskEnabled !== undefined) update.streak_at_risk_enabled = body.streakAtRiskEnabled;
  if (body.weeklySummaryEnabled !== undefined) update.weekly_summary_enabled = body.weeklySummaryEnabled;
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

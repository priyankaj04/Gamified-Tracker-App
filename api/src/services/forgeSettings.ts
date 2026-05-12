import { supabase } from './supabase';

const fromRow = (r: any) => ({
  id: r.id,
  dailyCodingGoalMin: r.daily_coding_goal_min,
  defaultSessionMin: r.default_session_min,
  pomodoroWorkMin: r.pomodoro_work_min,
  pomodoroBreakMin: r.pomodoro_break_min,
  githubUsername: r.github_username ?? null,
  workStartHour: r.work_start_hour,
  workEndHour: r.work_end_hour,
  weekStartDay: r.week_start_day,
  billableRate: r.billable_rate == null ? null : Number(r.billable_rate),
  billableCurrency: r.billable_currency ?? 'INR',
  weeklyDsaGoal: r.weekly_dsa_goal ?? 5,
  updatedAt: r.updated_at,
});

const ensureRow = async () => {
  const sb = supabase();
  const { data } = await sb.from('forge_settings').select('*').limit(1).maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await sb.from('forge_settings').insert({}).select().single();
  if (error) throw error;
  return inserted;
};

export const getSettings = async () => {
  const row = await ensureRow();
  return fromRow(row);
};

export const updateSettings = async (body: Partial<{
  dailyCodingGoalMin: number;
  defaultSessionMin: number;
  pomodoroWorkMin: number;
  pomodoroBreakMin: number;
  githubUsername: string | null;
  workStartHour: number;
  workEndHour: number;
  weekStartDay: number;
  billableRate: number | null;
  billableCurrency: string;
  weeklyDsaGoal: number;
}>) => {
  const sb = supabase();
  const row = await ensureRow();
  const upd: any = { updated_at: new Date().toISOString() };
  if (body.dailyCodingGoalMin !== undefined) upd.daily_coding_goal_min = body.dailyCodingGoalMin;
  if (body.defaultSessionMin !== undefined) upd.default_session_min = body.defaultSessionMin;
  if (body.pomodoroWorkMin !== undefined) upd.pomodoro_work_min = body.pomodoroWorkMin;
  if (body.pomodoroBreakMin !== undefined) upd.pomodoro_break_min = body.pomodoroBreakMin;
  if (body.githubUsername !== undefined) upd.github_username = body.githubUsername;
  if (body.workStartHour !== undefined) upd.work_start_hour = body.workStartHour;
  if (body.workEndHour !== undefined) upd.work_end_hour = body.workEndHour;
  if (body.weekStartDay !== undefined) upd.week_start_day = body.weekStartDay;
  if (body.billableRate !== undefined) upd.billable_rate = body.billableRate;
  if (body.billableCurrency !== undefined) upd.billable_currency = body.billableCurrency;
  if (body.weeklyDsaGoal !== undefined) upd.weekly_dsa_goal = body.weeklyDsaGoal;
  await sb.from('forge_settings').update(upd).eq('id', row.id);
  return getSettings();
};

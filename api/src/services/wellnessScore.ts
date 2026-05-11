import { supabase } from './supabase';
import { todayISO } from '@/lib/date';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const computeWellnessScore = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromIso = from.toISOString().slice(0, 10);

  // Sleep
  const { data: sleepGoalRow } = await sb.from('sleep_goal').select('*').limit(1).maybeSingle();
  const sleepGoal = sleepGoalRow ? Number(sleepGoalRow.target_hours) : 8;
  const { data: sleeps } = await sb
    .from('sleep_logs')
    .select('duration_hours')
    .gte('date', fromIso);
  const avgSleep =
    sleeps && sleeps.length
      ? sleeps.reduce((s: number, r: any) => s + Number(r.duration_hours ?? 0), 0) / sleeps.length
      : 0;
  const sleepPts = Math.round(clamp((avgSleep / sleepGoal) * 20, 0, 20));

  // Nutrition
  const { data: meals } = await sb.from('meal_logs').select('date').gte('date', fromIso);
  const mealDays = new Set((meals ?? []).map((r: any) => r.date)).size;
  const nutritionPts = Math.round(clamp((mealDays / 7) * 20, 0, 20));

  // Habits — completion rate
  const { data: habits } = await sb.from('habits').select('id').eq('is_active', true);
  const { data: logs } = await sb
    .from('habit_logs')
    .select('completed, date')
    .gte('date', fromIso);
  let habitsPts = 0;
  if (habits && habits.length) {
    const expected = habits.length * 7;
    const completed = (logs ?? []).filter((l: any) => l.completed).length;
    habitsPts = Math.round(clamp((completed / Math.max(1, expected)) * 20, 0, 20));
  }

  // Workouts
  const { data: workouts } = await sb.from('workouts').select('date').gte('date', fromIso);
  const workoutCount = (workouts ?? []).length;
  const workoutsPts = Math.round(clamp((workoutCount / 4) * 20, 0, 20));

  // Weight trend
  const { data: goalRow } = await sb.from('body_goal').select('*').limit(1).maybeSingle();
  const { data: entries } = await sb
    .from('weight_entries')
    .select('weight_kg, date')
    .order('date', { ascending: false })
    .limit(7);
  let weightTrendPts = 10; // default stable
  if (entries && entries.length >= 2 && goalRow) {
    const latest = Number(entries[0].weight_kg);
    const earliest = Number(entries[entries.length - 1].weight_kg);
    const decreasing = Number(goalRow.start_weight_kg) > Number(goalRow.target_weight_kg);
    const movingDown = latest < earliest;
    const stable = Math.abs(latest - earliest) < 0.3;
    if (stable) weightTrendPts = 10;
    else if (decreasing === movingDown) weightTrendPts = 20;
    else weightTrendPts = 5;
  }

  const total = sleepPts + nutritionPts + habitsPts + workoutsPts + weightTrendPts;
  return {
    total,
    sleep: sleepPts,
    nutrition: nutritionPts,
    habits: habitsPts,
    workouts: workoutsPts,
    weightTrend: weightTrendPts,
  };
};

export const wellnessLabel = (total: number) => {
  if (total < 40) return 'Rough';
  if (total < 60) return 'Solid';
  if (total < 80) return 'Strong';
  return 'Optimal';
};

export const persistTodayScore = async () => {
  const sb = supabase();
  const score = await computeWellnessScore();
  await sb.from('wellness_score_logs').upsert(
    {
      date: todayISO(),
      total: score.total,
      sleep_pts: score.sleep,
      nutrition_pts: score.nutrition,
      habits_pts: score.habits,
      workouts_pts: score.workouts,
      weight_trend_pts: score.weightTrend,
    },
    { onConflict: 'date' },
  );
  return score;
};

export const wellnessHistory = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const { data } = await sb
    .from('wellness_score_logs')
    .select('*')
    .gte('date', from.toISOString().slice(0, 10))
    .order('date', { ascending: true });
  return (data ?? []).map((r: any) => ({
    date: r.date,
    total: r.total,
    sleep: r.sleep_pts,
    nutrition: r.nutrition_pts,
    habits: r.habits_pts,
    workouts: r.workouts_pts,
    weightTrend: r.weight_trend_pts,
  }));
};

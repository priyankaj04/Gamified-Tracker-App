import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type { WorkoutType } from '@/types';

interface SetInput {
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  isPr?: boolean;
}
interface ExerciseInput {
  name: string;
  sets: SetInput[];
}
export interface CreateWorkoutInput {
  name: string;
  type: WorkoutType;
  date?: string;
  durationMinutes?: number;
  stars?: number | null;
  notes?: string;
  exercises: ExerciseInput[];
}

const snakeToCamelWorkout = (row: any, exercises: any[] = []) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  date: row.date,
  durationMinutes: row.duration_minutes,
  stars: row.stars,
  notes: row.notes,
  xpEarned: row.xp_earned,
  createdAt: row.created_at,
  exercises: exercises.map((e) => ({
    id: e.id,
    name: e.name,
    orderIndex: e.order_index,
    sets: (e.exercise_sets ?? []).map((s: any) => ({
      id: s.id,
      reps: s.reps,
      weightKg: s.weight_kg,
      durationSeconds: s.duration_seconds,
      isPr: s.is_pr,
      orderIndex: s.order_index,
    })),
  })),
});

export const listWorkouts = async (params: { page?: number; limit?: number; from?: string; to?: string }) => {
  const sb = supabase();
  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb.from('workouts').select('*', { count: 'exact' }).order('date', { ascending: false }).range(offset, offset + limit - 1);
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data, count, error } = await q;
  if (error) throw error;
  return {
    workouts: (data ?? []).map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      date: w.date,
      durationMinutes: w.duration_minutes,
      stars: w.stars,
      xpEarned: w.xp_earned,
    })),
    total: count ?? 0,
  };
};

export const getWorkout = async (id: string) => {
  const sb = supabase();
  const { data: workout, error } = await sb.from('workouts').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: exercises } = await sb
    .from('workout_exercises')
    .select('*, exercise_sets(*)')
    .eq('workout_id', id)
    .order('order_index', { ascending: true });
  return snakeToCamelWorkout(workout, exercises ?? []);
};

const checkPRs = async (exercises: ExerciseInput[]) => {
  const sb = supabase();
  const prsSet: string[] = [];
  for (const ex of exercises) {
    const best = ex.sets.reduce<{ weight: number; reps: number }>(
      (acc, s) => {
        if ((s.weightKg ?? 0) > acc.weight) return { weight: s.weightKg ?? 0, reps: s.reps ?? 0 };
        return acc;
      },
      { weight: 0, reps: 0 },
    );
    if (best.weight <= 0) continue;
    const { data: existing } = await sb
      .from('personal_records')
      .select('*')
      .eq('exercise_name', ex.name)
      .maybeSingle();
    if (!existing || (existing.best_weight_kg ?? 0) < best.weight) {
      await sb.from('personal_records').upsert(
        {
          exercise_name: ex.name,
          best_weight_kg: best.weight,
          best_reps: best.reps,
          achieved_at: todayISO(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'exercise_name' },
      );
      prsSet.push(ex.name);
    }
  }
  return prsSet;
};

export const createWorkout = async (input: CreateWorkoutInput) => {
  const sb = supabase();
  const date = input.date ?? todayISO();
  const totalSets = input.exercises.reduce((s, e) => s + e.sets.length, 0);

  const prsSet = await checkPRs(input.exercises);

  const baseXp = XP.COMPLETE_WORKOUT + totalSets * XP.LOG_SET + prsSet.length * XP.HIT_PERSONAL_RECORD;
  const { xpEarned, newTotalXp } = await awardXp({ base: baseXp, module: 'dojo', source: 'workout' });

  const { data: workoutRow, error: wErr } = await sb
    .from('workouts')
    .insert({
      name: input.name,
      type: input.type,
      date,
      duration_minutes: input.durationMinutes ?? null,
      stars: input.stars ?? null,
      notes: input.notes ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (wErr) throw wErr;

  for (let i = 0; i < input.exercises.length; i++) {
    const ex = input.exercises[i];
    const { data: exRow, error: eErr } = await sb
      .from('workout_exercises')
      .insert({ workout_id: workoutRow.id, name: ex.name, order_index: i })
      .select()
      .single();
    if (eErr) throw eErr;
    if (ex.sets.length) {
      const setRows = ex.sets.map((s, idx) => ({
        exercise_id: exRow.id,
        reps: s.reps ?? null,
        weight_kg: s.weightKg ?? null,
        duration_seconds: s.durationSeconds ?? null,
        is_pr: prsSet.includes(ex.name) && idx === ex.sets.length - 1,
        order_index: idx,
      }));
      await sb.from('exercise_sets').insert(setRows);
    }
  }

  const streak = await updateStreak('dojo');

  // For badge context, fetch counts
  const { count: workoutCount } = await sb.from('workouts').select('id', { count: 'exact', head: true });
  const { count: prCount } = await sb.from('personal_records').select('id', { count: 'exact', head: true });

  const badges = await checkBadges({
    workoutCount: workoutCount ?? 0,
    workoutStreak: streak.count,
    prCount: prCount ?? 0,
  });

  const fullWorkout = await getWorkout(workoutRow.id);
  return {
    workout: fullWorkout,
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
    personalRecordsSet: prsSet,
  };
};

export const deleteWorkout = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('workouts').delete().eq('id', id);
  if (error) throw error;
};

export const getWorkoutGrid = async () => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 89);
  const fromISO = from.toISOString().split('T')[0];
  const { data } = await sb.from('workouts').select('id, date, xp_earned').gte('date', fromISO).order('date', { ascending: true });
  const byDate: Record<string, { xp: number; id: string }> = {};
  (data ?? []).forEach((w) => {
    const k = w.date as string;
    const prev = byDate[k];
    if (!prev || prev.xp < w.xp_earned) {
      byDate[k] = { xp: w.xp_earned, id: w.id };
    }
  });
  const grid: { date: string; value: number; workoutId: string | null }[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const cell = byDate[dStr];
    const xp = cell?.xp ?? 0;
    let value = 0;
    if (xp >= 200) value = 4;
    else if (xp >= 120) value = 3;
    else if (xp >= 60) value = 2;
    else if (xp > 0) value = 1;
    grid.push({ date: dStr, value, workoutId: cell?.id ?? null });
  }
  return { grid };
};

export const getRecords = async () => {
  const sb = supabase();
  const { data } = await sb.from('personal_records').select('*').order('updated_at', { ascending: false });
  return {
    records: (data ?? []).map((r) => ({
      id: r.id,
      exerciseName: r.exercise_name,
      bestWeightKg: r.best_weight_kg,
      bestReps: r.best_reps,
      achievedAt: r.achieved_at,
      workoutId: r.workout_id,
    })),
  };
};

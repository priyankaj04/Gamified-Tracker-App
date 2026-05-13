import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP, getDojoRank as computeDojoRank } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import { getSettings, estimateOneRm } from './settings';
import type { WorkoutType } from '@/types';

type SetType = 'Normal' | 'Warmup' | 'DropSet' | 'Failure' | 'AMRAP';

interface SetInput {
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  setType?: SetType;
  isPr?: boolean;
}
interface ExerciseInput {
  name: string;          // free-text fallback or display name
  exerciseId?: string;   // FK into exercises (preferred)
  supersetGroupId?: string | null;
  notes?: string;
  sets: SetInput[];
}
export interface CreateWorkoutInput {
  name: string;
  type: WorkoutType | 'Mixed';
  date?: string;
  durationMinutes?: number;
  stars?: number | null;
  notes?: string;
  moodTag?: 'CrushedIt' | 'Solid' | 'Average' | 'Rough' | 'Struggled';
  templateId?: string | null;
  routineDayId?: string | null;
  exercises: ExerciseInput[];
}

const fromRow = (row: any, exercises: any[] = []) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  date: row.date,
  durationMinutes: row.duration_minutes,
  stars: row.stars,
  notes: row.notes,
  moodTag: row.mood_tag,
  totalVolumeKg: row.total_volume_kg != null ? Number(row.total_volume_kg) : 0,
  totalSets: row.total_sets,
  totalReps: row.total_reps,
  templateId: row.template_id,
  routineDayId: row.routine_day_id,
  xpEarned: row.xp_earned,
  createdAt: row.created_at,
  exercises: exercises
    .slice()
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((e) => ({
      id: e.id,
      exerciseId: e.exercise_id,
      name: e.name,
      supersetGroupId: e.superset_group_id,
      orderIndex: e.order_index,
      notes: e.notes,
      sets: (e.exercise_sets ?? [])
        .slice()
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((s: any) => ({
          id: s.id,
          reps: s.reps,
          weightKg: s.weight_kg != null ? Number(s.weight_kg) : null,
          durationSeconds: s.duration_seconds,
          setType: s.set_type,
          isPr: s.is_pr,
          orderIndex: s.order_index,
        })),
    })),
});

// ── LIST / GET / DELETE ─────────────────────────────────
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
      moodTag: w.mood_tag,
      totalVolumeKg: w.total_volume_kg != null ? Number(w.total_volume_kg) : 0,
      totalSets: w.total_sets,
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
  return fromRow(workout, exercises ?? []);
};

export const deleteWorkout = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('workouts').delete().eq('id', id);
  if (error) throw error;
};

// Edit-in-place. Rewrites exercises + sets; recomputes aggregates; preserves XP.
// Does NOT re-evaluate PRs (those were set at original create time) or re-award XP.
export const updateWorkout = async (id: string, input: CreateWorkoutInput) => {
  const sb = supabase();

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  input.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const setType = s.setType ?? 'Normal';
      totalSets += 1;
      if (setType !== 'Warmup') {
        totalReps += s.reps ?? 0;
        totalVolume += (s.reps ?? 0) * (s.weightKg ?? 0);
      }
    });
  });

  const { error: uErr } = await sb
    .from('workouts')
    .update({
      name: input.name,
      type: input.type,
      date: input.date ?? undefined,
      duration_minutes: input.durationMinutes ?? null,
      stars: input.stars ?? null,
      notes: input.notes ?? null,
      mood_tag: input.moodTag ?? null,
      total_volume_kg: totalVolume,
      total_sets: totalSets,
      total_reps: totalReps,
    })
    .eq('id', id);
  if (uErr) throw uErr;

  await sb.from('workout_exercises').delete().eq('workout_id', id);
  for (let i = 0; i < input.exercises.length; i++) {
    const ex = input.exercises[i];
    const { data: exRow, error: eErr } = await sb
      .from('workout_exercises')
      .insert({
        workout_id: id,
        exercise_id: ex.exerciseId ?? null,
        name: ex.name,
        order_index: i,
        superset_group_id: ex.supersetGroupId ?? null,
        notes: ex.notes ?? null,
      })
      .select()
      .single();
    if (eErr) throw eErr;
    if (ex.sets.length) {
      await sb.from('exercise_sets').insert(
        ex.sets.map((s, idx) => ({
          exercise_id: exRow.id,
          reps: s.reps ?? null,
          weight_kg: s.weightKg ?? null,
          duration_seconds: s.durationSeconds ?? null,
          set_type: s.setType ?? 'Normal',
          is_pr: false,
          order_index: idx,
        })),
      );
    }
  }

  return getWorkout(id);
};

// Snapshot the current shape of a workout as a reusable template.
export const saveWorkoutAsTemplate = async (
  id: string,
  override?: { name?: string },
) => {
  const sb = supabase();
  const workout = await getWorkout(id);

  const { data: tpl, error } = await sb
    .from('workout_templates')
    .insert({
      name: override?.name ?? `${workout.name} (template)`,
      type: workout.type,
      estimated_minutes: workout.durationMinutes ?? 60,
      notes: workout.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  for (let i = 0; i < (workout.exercises ?? []).length; i++) {
    const ex = workout.exercises![i];
    if (!ex.exerciseId) continue;
    const { data: te, error: teErr } = await sb
      .from('template_exercises')
      .insert({
        template_id: tpl.id,
        exercise_id: ex.exerciseId,
        superset_group_id: ex.supersetGroupId ?? null,
        order_index: i,
        notes: ex.notes ?? null,
      })
      .select()
      .single();
    if (teErr) throw teErr;
    if (ex.sets.length) {
      await sb.from('template_sets').insert(
        ex.sets.map((s: any, j: number) => ({
          template_exercise_id: te.id,
          set_type: s.setType ?? 'Normal',
          target_reps: s.reps ?? null,
          target_weight_kg: s.weightKg ?? null,
          target_duration_seconds: s.durationSeconds ?? null,
          order_index: j,
        })),
      );
    }
  }

  return { id: tpl.id, name: tpl.name };
};

export const bulkDeleteWorkouts = async (params: { from: string; to: string }) => {
  const sb = supabase();
  const { error, count } = await sb
    .from('workouts')
    .delete({ count: 'exact' })
    .gte('date', params.from)
    .lte('date', params.to);
  if (error) throw error;
  return { deleted: count ?? 0 };
};

// ── IMPORT ───────────────────────────────────────────────
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuote = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ',') {
        row.push(cur);
        cur = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cur);
        cur = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
};

const VALID_TYPES = new Set(['Strength', 'Cardio', 'Flexibility', 'Combat', 'Mixed']);
const VALID_SET_TYPES = new Set<SetType>(['Normal', 'Warmup', 'DropSet', 'Failure', 'AMRAP']);

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export const importWorkoutsCsv = async (csvText: string): Promise<ImportResult> => {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return { imported: 0, skipped: 0, errors: [] };
  const [header, ...dataRows] = rows;
  const idxOf = (h: string) => header.findIndex((c) => c.trim().toLowerCase() === h);
  const colDate = idxOf('date');
  const colName = idxOf('workout_name');
  const colType = idxOf('type');
  const colDur = idxOf('duration_min');
  const colEx = idxOf('exercise');
  const colSetIdx = idxOf('set_index');
  const colSetType = idxOf('set_type');
  const colReps = idxOf('reps');
  const colWeight = idxOf('weight_kg');
  const colSec = idxOf('duration_sec');
  if (colDate < 0 || colName < 0) {
    return {
      imported: 0,
      skipped: dataRows.length,
      errors: [{ row: 0, reason: 'CSV header must include "date" and "workout_name"' }],
    };
  }

  const errors: { row: number; reason: string }[] = [];

  interface ParsedRow {
    date: string;
    workoutName: string;
    type: string;
    durationMin: number | null;
    exerciseName: string;
    setIndex: number;
    setType: SetType;
    reps: number | null;
    weightKg: number | null;
    durationSec: number | null;
  }
  const parsed: ParsedRow[] = [];
  dataRows.forEach((r, i) => {
    try {
      const date = (r[colDate] ?? '').trim();
      const name = (r[colName] ?? '').trim();
      if (!date || !name) throw new Error('Missing date or workout_name');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Bad date format "${date}"`);
      const type = (r[colType] ?? 'Strength').trim() || 'Strength';
      if (!VALID_TYPES.has(type)) throw new Error(`Unknown workout type "${type}"`);
      const exerciseName = colEx >= 0 ? (r[colEx] ?? '').trim() : '';
      const setIndex = colSetIdx >= 0 ? Number(r[colSetIdx] ?? 0) || 0 : 0;
      const rawSetType = (colSetType >= 0 ? (r[colSetType] ?? '').trim() : 'Normal') as SetType;
      const setType: SetType = VALID_SET_TYPES.has(rawSetType) ? rawSetType : 'Normal';
      const reps = colReps >= 0 && r[colReps] !== '' ? Number(r[colReps]) : null;
      const weight = colWeight >= 0 && r[colWeight] !== '' ? Number(r[colWeight]) : null;
      const dur = colSec >= 0 && r[colSec] !== '' ? Number(r[colSec]) : null;
      const durMin = colDur >= 0 && r[colDur] !== '' ? Number(r[colDur]) : null;
      parsed.push({
        date,
        workoutName: name,
        type,
        durationMin: Number.isFinite(durMin as number) ? (durMin as number) : null,
        exerciseName,
        setIndex,
        setType,
        reps: Number.isFinite(reps as number) ? (reps as number) : null,
        weightKg: Number.isFinite(weight as number) ? (weight as number) : null,
        durationSec: Number.isFinite(dur as number) ? (dur as number) : null,
      });
    } catch (e: any) {
      errors.push({ row: i + 2, reason: e?.message ?? 'Invalid row' });
    }
  });

  // Group rows into workouts by (date|name); each unique exercise within = one workout_exercise.
  interface WorkoutAccum {
    date: string;
    name: string;
    type: string;
    durationMin: number | null;
    exercises: Map<
      string,
      { setIndex: number; setType: SetType; reps: number | null; weightKg: number | null; durationSec: number | null }[]
    >;
  }
  const workouts = new Map<string, WorkoutAccum>();
  parsed.forEach((p) => {
    const key = `${p.date}|${p.workoutName}`;
    if (!workouts.has(key)) {
      workouts.set(key, {
        date: p.date,
        name: p.workoutName,
        type: p.type,
        durationMin: p.durationMin,
        exercises: new Map(),
      });
    }
    const w = workouts.get(key)!;
    if (p.durationMin != null && w.durationMin == null) w.durationMin = p.durationMin;
    if (!p.exerciseName) return;
    if (!w.exercises.has(p.exerciseName)) w.exercises.set(p.exerciseName, []);
    w.exercises.get(p.exerciseName)!.push({
      setIndex: p.setIndex,
      setType: p.setType,
      reps: p.reps,
      weightKg: p.weightKg,
      durationSec: p.durationSec,
    });
  });

  const sb = supabase();
  let imported = 0;
  let skipped = 0;
  for (const [, w] of workouts) {
    if (w.exercises.size === 0) {
      skipped += 1;
      continue;
    }
    let totalSets = 0;
    let totalVolume = 0;
    let totalReps = 0;
    w.exercises.forEach((sets) =>
      sets.forEach((s) => {
        totalSets += 1;
        if (s.setType !== 'Warmup') {
          totalReps += s.reps ?? 0;
          totalVolume += (s.reps ?? 0) * (s.weightKg ?? 0);
        }
      }),
    );

    const { data: workoutRow, error } = await sb
      .from('workouts')
      .insert({
        name: w.name,
        type: w.type,
        date: w.date,
        duration_minutes: w.durationMin,
        total_volume_kg: totalVolume,
        total_sets: totalSets,
        total_reps: totalReps,
        xp_earned: 0,
      })
      .select()
      .single();
    if (error || !workoutRow) {
      errors.push({ row: 0, reason: `Insert workout failed: ${error?.message ?? 'unknown'}` });
      skipped += 1;
      continue;
    }

    let order = 0;
    for (const [exName, sets] of w.exercises) {
      const { data: exRow } = await sb
        .from('workout_exercises')
        .insert({ workout_id: workoutRow.id, name: exName, order_index: order })
        .select()
        .single();
      order += 1;
      if (!exRow || sets.length === 0) continue;
      const sortedSets = sets.slice().sort((a, b) => a.setIndex - b.setIndex);
      await sb.from('exercise_sets').insert(
        sortedSets.map((s, i) => ({
          exercise_id: exRow.id,
          reps: s.reps,
          weight_kg: s.weightKg,
          duration_seconds: s.durationSec,
          set_type: s.setType,
          order_index: i,
        })),
      );
    }
    imported += 1;
  }

  return { imported, skipped, errors };
};

// ── CREATE: PRs + aggregates + XP ───────────────────────
interface PrUpdate { exerciseId: string | null; exerciseName: string; reason: 'weight' | 'volume' | '1rm' }

const computeWorkingSetVolume = (sets: SetInput[]) =>
  sets
    .filter((s) => (s.setType ?? 'Normal') !== 'Warmup')
    .reduce((sum, s) => sum + (s.reps ?? 0) * (s.weightKg ?? 0), 0);

const detectPRs = async (exercises: ExerciseInput[]): Promise<PrUpdate[]> => {
  const sb = supabase();
  const settings = await getSettings();
  const updates: PrUpdate[] = [];

  for (const ex of exercises) {
    if (!ex.exerciseId && !ex.name) continue;
    const workingSets = ex.sets.filter((s) => (s.setType ?? 'Normal') !== 'Warmup');
    if (workingSets.length === 0) continue;

    // best weight at any reps
    const bestSet = workingSets.reduce<{ weight: number; reps: number }>(
      (acc, s) => ((s.weightKg ?? 0) > acc.weight ? { weight: s.weightKg ?? 0, reps: s.reps ?? 0 } : acc),
      { weight: 0, reps: 0 },
    );
    const volume = computeWorkingSetVolume(ex.sets);
    const est1rm = bestSet.weight && bestSet.reps ? estimateOneRm(bestSet.weight, bestSet.reps, settings.oneRmFormula as any) : 0;

    // Lookup existing PR row (by exercise_id first, fallback to name)
    let prRow: any = null;
    if (ex.exerciseId) {
      const { data } = await sb.from('personal_records').select('*').eq('exercise_id', ex.exerciseId).maybeSingle();
      prRow = data;
    }
    if (!prRow) {
      const { data } = await sb.from('personal_records').select('*').eq('exercise_name', ex.name).maybeSingle();
      prRow = data;
    }

    const prev = {
      weight: prRow?.best_weight_kg ? Number(prRow.best_weight_kg) : 0,
      reps: prRow?.best_reps ?? 0,
      volume: prRow?.best_volume_kg ? Number(prRow.best_volume_kg) : 0,
      est1rm: prRow?.best_est_one_rm_kg ? Number(prRow.best_est_one_rm_kg) : 0,
    };

    const reasons: ('weight' | 'volume' | '1rm')[] = [];
    if (bestSet.weight > prev.weight) reasons.push('weight');
    if (volume > prev.volume) reasons.push('volume');
    if (est1rm > prev.est1rm) reasons.push('1rm');
    if (reasons.length === 0) continue;

    const newRow = {
      exercise_id: ex.exerciseId ?? prRow?.exercise_id ?? null,
      exercise_name: ex.name,
      best_weight_kg: Math.max(bestSet.weight, prev.weight),
      best_reps: bestSet.weight >= prev.weight ? bestSet.reps : prev.reps,
      best_volume_kg: Math.max(volume, prev.volume),
      best_est_one_rm_kg: Math.max(est1rm, prev.est1rm),
      achieved_at: todayISO(),
      updated_at: new Date().toISOString(),
    };
    await sb.from('personal_records').upsert(newRow, { onConflict: 'exercise_name' });
    updates.push({ exerciseId: ex.exerciseId ?? null, exerciseName: ex.name, reason: reasons[0] });
  }
  return updates;
};

export const createWorkout = async (input: CreateWorkoutInput) => {
  const sb = supabase();
  const date = input.date ?? todayISO();

  // PRs first so we can flag isPr on the inserted sets
  const prs = await detectPRs(input.exercises);
  const prExerciseNames = new Set(prs.map((p) => p.exerciseName));

  // Aggregates
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  input.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      const setType = s.setType ?? 'Normal';
      totalSets += 1;
      if (setType !== 'Warmup') {
        totalReps += s.reps ?? 0;
        totalVolume += (s.reps ?? 0) * (s.weightKg ?? 0);
      }
    });
  });

  // XP: base + per-set + per-PR
  const baseXp = XP.COMPLETE_WORKOUT + totalSets * XP.LOG_SET + prs.length * XP.HIT_PERSONAL_RECORD;
  const { xpEarned, newTotalXp } = await awardXp({ base: baseXp, module: 'dojo', source: 'workout' });

  // Insert workout
  const { data: workoutRow, error: wErr } = await sb
    .from('workouts')
    .insert({
      name: input.name,
      type: input.type,
      date,
      duration_minutes: input.durationMinutes ?? null,
      stars: input.stars ?? null,
      notes: input.notes ?? null,
      mood_tag: input.moodTag ?? null,
      template_id: input.templateId ?? null,
      routine_day_id: input.routineDayId ?? null,
      total_volume_kg: totalVolume,
      total_sets: totalSets,
      total_reps: totalReps,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (wErr) throw wErr;

  // Exercises + sets
  for (let i = 0; i < input.exercises.length; i++) {
    const ex = input.exercises[i];
    const { data: exRow, error: eErr } = await sb
      .from('workout_exercises')
      .insert({
        workout_id: workoutRow.id,
        exercise_id: ex.exerciseId ?? null,
        name: ex.name,
        order_index: i,
        superset_group_id: ex.supersetGroupId ?? null,
        notes: ex.notes ?? null,
      })
      .select()
      .single();
    if (eErr) throw eErr;
    if (ex.sets.length) {
      const setRows = ex.sets.map((s, idx) => ({
        exercise_id: exRow.id,
        reps: s.reps ?? null,
        weight_kg: s.weightKg ?? null,
        duration_seconds: s.durationSeconds ?? null,
        set_type: s.setType ?? 'Normal',
        is_pr: prExerciseNames.has(ex.name) && idx === ex.sets.length - 1,
        order_index: idx,
      }));
      await sb.from('exercise_sets').insert(setRows);
    }
  }

  // Bump template last_used
  if (input.templateId) {
    await sb.from('workout_templates').update({ last_used_at: new Date().toISOString() }).eq('id', input.templateId);
  }

  const streak = await updateStreak('dojo');
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
    personalRecordsSet: prs,
  };
};

// ── ACTIVITY GRID ───────────────────────────────────────
export const getWorkoutGrid = async (days = 90) => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  const fromISO = from.toISOString().split('T')[0];
  const { data } = await sb
    .from('workouts')
    .select('id, name, type, date, xp_earned, duration_minutes, total_volume_kg')
    .gte('date', fromISO)
    .order('date', { ascending: true });
  const byDate: Record<string, { xp: number; id: string; name: string; type: string; duration: number | null }> = {};
  (data ?? []).forEach((w: any) => {
    const k = w.date;
    const prev = byDate[k];
    if (!prev || prev.xp < w.xp_earned) {
      byDate[k] = { xp: w.xp_earned, id: w.id, name: w.name, type: w.type, duration: w.duration_minutes };
    }
  });
  // Mark rest days
  const { data: restDays } = await sb.from('rest_days').select('date').gte('date', fromISO);
  const restSet = new Set((restDays ?? []).map((r: any) => r.date));

  const grid: { date: string; value: number; workoutId: string | null; workoutName?: string; isRestDay: boolean }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const cell = byDate[dStr];
    const isRest = restSet.has(dStr);
    const xp = cell?.xp ?? 0;
    let value = 0;
    if (xp >= 200) value = 4;
    else if (xp >= 120) value = 3;
    else if (xp >= 60) value = 2;
    else if (xp > 0) value = 1;
    grid.push({
      date: dStr,
      value,
      workoutId: cell?.id ?? null,
      workoutName: cell?.name,
      isRestDay: isRest,
    });
  }
  return { grid };
};

// ── PR HISTORY ──────────────────────────────────────────
export const getRecords = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('personal_records')
    .select('*, exercises(name, muscle_primary, equipment)')
    .order('updated_at', { ascending: false });
  return {
    records: (data ?? []).map((r: any) => ({
      id: r.id,
      exerciseId: r.exercise_id,
      exerciseName: r.exercise_name,
      musclePrimary: r.exercises?.muscle_primary ?? null,
      equipment: r.exercises?.equipment ?? null,
      bestWeightKg: r.best_weight_kg != null ? Number(r.best_weight_kg) : null,
      bestReps: r.best_reps,
      bestVolumeKg: r.best_volume_kg != null ? Number(r.best_volume_kg) : null,
      bestEstOneRmKg: r.best_est_one_rm_kg != null ? Number(r.best_est_one_rm_kg) : null,
      achievedAt: r.achieved_at,
    })),
  };
};

export const getExerciseHistory = async (exerciseRef: { id?: string; name?: string }) => {
  const sb = supabase();
  let q = sb
    .from('workout_exercises')
    .select('id, workout_id, exercise_id, name, workouts(date), exercise_sets(reps, weight_kg, set_type)')
    .order('workout_id', { ascending: false });
  if (exerciseRef.id) q = q.eq('exercise_id', exerciseRef.id);
  else if (exerciseRef.name) q = q.eq('name', exerciseRef.name);
  const { data } = await q.limit(200);

  const settings = await getSettings();
  const series = (data ?? [])
    .map((row: any) => {
      const sets = (row.exercise_sets ?? []).filter((s: any) => s.set_type !== 'Warmup');
      if (sets.length === 0) return null;
      const top = sets.reduce(
        (acc: any, s: any) => ((s.weight_kg ?? 0) > (acc.weight ?? 0) ? s : acc),
        { weight_kg: 0, reps: 0 },
      );
      const volume = sets.reduce((s: number, x: any) => s + (Number(x.weight_kg) || 0) * (x.reps ?? 0), 0);
      const oneRm = top.weight_kg && top.reps ? estimateOneRm(Number(top.weight_kg), top.reps, settings.oneRmFormula as any) : 0;
      return {
        date: row.workouts?.date,
        topWeightKg: Number(top.weight_kg) || 0,
        topReps: top.reps ?? 0,
        volumeKg: volume,
        estOneRmKg: oneRm,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => (a!.date < b!.date ? -1 : 1));

  return { series };
};

// ── ANALYTICS ───────────────────────────────────────────
const startOfWeek = (d: Date, mondayStart: boolean) => {
  const day = d.getDay();
  const offset = mondayStart ? (day === 0 ? 6 : day - 1) : day;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(d.getDate() - offset);
  return x;
};

export const weeklyStats = async (weeks = 12) => {
  const sb = supabase();
  const settings = await getSettings();
  const today = new Date();
  const start = startOfWeek(today, settings.weekStartsMonday);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const fromISO = start.toISOString().split('T')[0];

  const { data } = await sb
    .from('workouts')
    .select('date, duration_minutes, total_volume_kg, total_sets, total_reps')
    .gte('date', fromISO)
    .order('date', { ascending: true });

  const buckets: Record<string, { workouts: number; volume: number; minutes: number; sets: number }> = {};
  for (let i = 0; i < weeks; i++) {
    const wStart = new Date(start);
    wStart.setDate(start.getDate() + i * 7);
    const key = wStart.toISOString().split('T')[0];
    buckets[key] = { workouts: 0, volume: 0, minutes: 0, sets: 0 };
  }
  (data ?? []).forEach((w: any) => {
    const d = new Date(w.date);
    const wStart = startOfWeek(d, settings.weekStartsMonday);
    const key = wStart.toISOString().split('T')[0];
    if (!buckets[key]) return;
    buckets[key].workouts += 1;
    buckets[key].volume += Number(w.total_volume_kg) || 0;
    buckets[key].minutes += w.duration_minutes ?? 0;
    buckets[key].sets += w.total_sets ?? 0;
  });

  const week = Object.entries(buckets).map(([weekStart, v]) => ({ weekStart, ...v }));
  return { week };
};

export const muscleStats = async (weeks = 4) => {
  const sb = supabase();
  const settings = await getSettings();
  const today = new Date();
  const start = startOfWeek(today, settings.weekStartsMonday);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const fromISO = start.toISOString().split('T')[0];

  const { data } = await sb
    .from('workout_exercises')
    .select('exercise_id, workouts!inner(date), exercises(muscle_primary), exercise_sets(reps, weight_kg, set_type)');

  const sums: Record<string, { sets: number; volume: number }> = {};
  (data ?? []).forEach((row: any) => {
    const date = row.workouts?.date;
    if (!date || date < fromISO) return;
    const muscle = row.exercises?.muscle_primary ?? 'Unknown';
    const sets = (row.exercise_sets ?? []).filter((s: any) => s.set_type !== 'Warmup');
    const setCount = sets.length;
    const volume = sets.reduce((s: number, x: any) => s + (Number(x.weight_kg) || 0) * (x.reps ?? 0), 0);
    if (!sums[muscle]) sums[muscle] = { sets: 0, volume: 0 };
    sums[muscle].sets += setCount;
    sums[muscle].volume += volume;
  });

  const muscles = Object.entries(sums).map(([muscle, s]) => ({
    muscle,
    setsPerWeek: s.sets / weeks,
    volumePerWeek: s.volume / weeks,
  })).sort((a, b) => b.setsPerWeek - a.setsPerWeek);
  return { weeks, muscles };
};

export const getDojoRank = async () => {
  const sb = supabase();
  const [{ count: workoutCount }, { count: prCount }] = await Promise.all([
    sb.from('workouts').select('id', { count: 'exact', head: true }),
    sb.from('personal_records').select('id', { count: 'exact', head: true }),
  ]);
  const workouts = workoutCount ?? 0;
  const prs = prCount ?? 0;
  // PRs are rare and meaningful — count each as worth 3 workouts toward rank.
  const score = workouts + prs * 3;
  return { ...computeDojoRank(score), workoutCount: workouts, prCount: prs };
};

export const allTimeStats = async () => {
  const sb = supabase();
  const { count: workoutCount } = await sb.from('workouts').select('id', { count: 'exact', head: true });
  const { data: agg } = await sb.from('workouts').select('total_volume_kg, duration_minutes, name');
  const totalVolume = (agg ?? []).reduce((s: number, r: any) => s + (Number(r.total_volume_kg) || 0), 0);
  const totalMinutes = (agg ?? []).reduce((s: number, r: any) => s + (r.duration_minutes ?? 0), 0);

  const { count: prCount } = await sb.from('personal_records').select('id', { count: 'exact', head: true });

  // Favorite exercise & most-trained muscle
  const { data: exRows } = await sb
    .from('workout_exercises')
    .select('name, exercises(muscle_primary)');
  const exCount: Record<string, number> = {};
  const muscleCount: Record<string, number> = {};
  (exRows ?? []).forEach((r: any) => {
    exCount[r.name] = (exCount[r.name] ?? 0) + 1;
    const m = r.exercises?.muscle_primary;
    if (m) muscleCount[m] = (muscleCount[m] ?? 0) + 1;
  });
  const favoriteExercise = Object.entries(exCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topMuscle = Object.entries(muscleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const { data: streak } = await sb.from('streaks').select('count, longest_streak').eq('module', 'dojo').maybeSingle();

  return {
    totalWorkouts: workoutCount ?? 0,
    totalVolumeKg: totalVolume,
    totalMinutes,
    totalPRs: prCount ?? 0,
    favoriteExercise,
    topMuscle,
    currentStreak: streak?.count ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
  };
};

import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { supabase } from '@/services/supabase';

export const exportRouter = Router();

const escapeCsv = (v: any): string => {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

exportRouter.get(
  '/workouts.csv',
  asyncHandler(async (_req, res) => {
    const sb = supabase();
    const { data: workouts } = await sb
      .from('workouts')
      .select('id, name, type, date, duration_minutes, stars, mood_tag, total_volume_kg, xp_earned')
      .order('date', { ascending: false });
    const { data: exercises } = await sb
      .from('workout_exercises')
      .select('id, workout_id, name, exercise_sets(reps, weight_kg, duration_seconds, set_type)');

    const exByWorkout: Record<string, any[]> = {};
    (exercises ?? []).forEach((e: any) => {
      (exByWorkout[e.workout_id] ??= []).push(e);
    });

    const lines: string[] = [];
    lines.push('workout_id,date,workout_name,type,duration_min,exercise,set_index,set_type,reps,weight_kg,duration_sec,xp_earned');
    (workouts ?? []).forEach((w: any) => {
      const exs = exByWorkout[w.id] ?? [];
      if (exs.length === 0) {
        lines.push([w.id, w.date, escapeCsv(w.name), w.type, w.duration_minutes ?? '', '', '', '', '', '', '', w.xp_earned].join(','));
        return;
      }
      exs.forEach((e) => {
        (e.exercise_sets ?? []).forEach((s: any, i: number) => {
          lines.push([
            w.id, w.date, escapeCsv(w.name), w.type, w.duration_minutes ?? '',
            escapeCsv(e.name), i + 1, s.set_type ?? 'Normal', s.reps ?? '', s.weight_kg ?? '', s.duration_seconds ?? '',
            w.xp_earned,
          ].join(','));
        });
      });
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="workouts.csv"');
    res.send(lines.join('\n'));
  }),
);

exportRouter.get(
  '/workouts.json',
  asyncHandler(async (_req, res) => {
    const sb = supabase();
    const { data } = await sb
      .from('workouts')
      .select('*, workout_exercises(*, exercise_sets(*))')
      .order('date', { ascending: false });
    res.json({ data: data ?? [], error: null });
  }),
);

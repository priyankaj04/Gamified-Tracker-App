import { supabase } from './supabase';

export type ExerciseType = 'compound' | 'isolation' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  musclePrimary: string;
  muscleSecondary: string[];
  equipment: string;
  exerciseType: ExerciseType;
  isCustom: boolean;
  isFavorite: boolean;
  notes: string | null;
}

const fromRow = (r: any): Exercise => ({
  id: r.id,
  name: r.name,
  musclePrimary: r.muscle_primary,
  muscleSecondary: r.muscle_secondary ?? [],
  equipment: r.equipment,
  exerciseType: r.exercise_type,
  isCustom: r.is_custom,
  isFavorite: r.is_favorite,
  notes: r.notes,
});

export const listExercises = async (params: {
  search?: string;
  muscle?: string;
  equipment?: string;
  type?: ExerciseType;
  favorite?: boolean;
}) => {
  const sb = supabase();
  let q = sb.from('exercises').select('*').order('name', { ascending: true });
  if (params.search) q = q.ilike('name', `%${params.search}%`);
  if (params.muscle) q = q.eq('muscle_primary', params.muscle);
  if (params.equipment) q = q.eq('equipment', params.equipment);
  if (params.type) q = q.eq('exercise_type', params.type);
  if (params.favorite !== undefined) q = q.eq('is_favorite', params.favorite);
  const { data, error } = await q;
  if (error) throw error;
  return { exercises: (data ?? []).map(fromRow) };
};

export const getExercise = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb.from('exercises').select('*').eq('id', id).single();
  if (error) throw error;
  return fromRow(data);
};

interface ExerciseBody {
  name: string;
  musclePrimary: string;
  muscleSecondary?: string[];
  equipment: string;
  exerciseType: ExerciseType;
  notes?: string;
}

export const createExercise = async (body: ExerciseBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('exercises')
    .insert({
      name: body.name,
      muscle_primary: body.musclePrimary,
      muscle_secondary: body.muscleSecondary ?? [],
      equipment: body.equipment,
      exercise_type: body.exerciseType,
      is_custom: true,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const updateExercise = async (id: string, body: Partial<ExerciseBody> & { isFavorite?: boolean }) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.musclePrimary !== undefined) update.muscle_primary = body.musclePrimary;
  if (body.muscleSecondary !== undefined) update.muscle_secondary = body.muscleSecondary;
  if (body.equipment !== undefined) update.equipment = body.equipment;
  if (body.exerciseType !== undefined) update.exercise_type = body.exerciseType;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.isFavorite !== undefined) update.is_favorite = body.isFavorite;
  const { data, error } = await sb.from('exercises').update(update).eq('id', id).select().single();
  if (error) throw error;
  return fromRow(data);
};

export const deleteExercise = async (id: string) => {
  const sb = supabase();
  // Only allow deleting custom exercises
  const { data: ex } = await sb.from('exercises').select('is_custom').eq('id', id).maybeSingle();
  if (!ex) throw new Error('Exercise not found');
  if (!ex.is_custom) throw new Error('Cannot delete a built-in exercise (unfavorite or hide instead)');
  const { error } = await sb.from('exercises').delete().eq('id', id);
  if (error) throw error;
};

// Most recent non-warmup set for this exercise (by exercise_id or fallback name).
export const lastSet = async (ref: { id?: string; name?: string }) => {
  const sb = supabase();
  let q = sb
    .from('workout_exercises')
    .select('id, exercise_id, name, workouts(date), exercise_sets(reps, weight_kg, set_type, order_index)')
    .order('workout_id', { ascending: false })
    .limit(20);
  if (ref.id) q = q.eq('exercise_id', ref.id);
  else if (ref.name) q = q.eq('name', ref.name);
  else return { last: null };
  const { data } = await q;
  if (!data || data.length === 0) return { last: null };
  // Walk rows newest-first; pick the top working set of the most recent workout.
  for (const row of data as any[]) {
    const sets = (row.exercise_sets ?? []).filter((s: any) => s.set_type !== 'Warmup');
    if (sets.length === 0) continue;
    const top = sets.reduce(
      (acc: any, s: any) => ((s.weight_kg ?? 0) > (acc.weight_kg ?? 0) ? s : acc),
      { weight_kg: 0, reps: 0 },
    );
    return {
      last: {
        date: row.workouts?.date ?? null,
        weightKg: Number(top.weight_kg) || 0,
        reps: top.reps ?? 0,
      },
    };
  }
  return { last: null };
};

export const muscleGroups = () => [
  'Chest','Back','Shoulders','Biceps','Triceps','Forearms','Core',
  'Quads','Hamstrings','Glutes','Calves','Full Body','Cardio',
];

export const equipmentTypes = () => [
  'Barbell','Dumbbell','Machine','Cable','Bodyweight',
  'Resistance Band','Kettlebell','Cardio Machine',
];

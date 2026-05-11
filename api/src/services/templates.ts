import { supabase } from './supabase';

const tplExerciseFromRow = (te: any) => ({
  id: te.id,
  exerciseId: te.exercise_id,
  supersetGroupId: te.superset_group_id,
  orderIndex: te.order_index,
  notes: te.notes,
  exerciseName: te.exercises?.name,
  musclePrimary: te.exercises?.muscle_primary,
  equipment: te.exercises?.equipment,
  sets: (te.template_sets ?? [])
    .slice()
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((s: any) => ({
      id: s.id,
      setType: s.set_type,
      targetReps: s.target_reps,
      targetWeightKg: s.target_weight_kg,
      targetDurationSeconds: s.target_duration_seconds,
      orderIndex: s.order_index,
    })),
});

const fromRow = (row: any) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  estimatedMinutes: row.estimated_minutes,
  notes: row.notes,
  lastUsedAt: row.last_used_at,
  createdAt: row.created_at,
  exercises: (row.template_exercises ?? [])
    .slice()
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map(tplExerciseFromRow),
});

export const listTemplates = async () => {
  const sb = supabase();
  const { data, error } = await sb
    .from('workout_templates')
    .select('*, template_exercises(*, exercises(name, muscle_primary, equipment), template_sets(*))')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return { templates: (data ?? []).map(fromRow) };
};

export const getTemplate = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('workout_templates')
    .select('*, template_exercises(*, exercises(name, muscle_primary, equipment), template_sets(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return fromRow(data);
};

interface TemplateExerciseInput {
  exerciseId: string;
  supersetGroupId?: string | null;
  notes?: string;
  sets: {
    setType?: 'Normal' | 'Warmup' | 'DropSet' | 'Failure' | 'AMRAP';
    targetReps?: number;
    targetWeightKg?: number;
    targetDurationSeconds?: number;
  }[];
}

interface TemplateBody {
  name: string;
  type?: 'Strength' | 'Cardio' | 'Flexibility' | 'Combat' | 'Mixed';
  estimatedMinutes?: number;
  notes?: string;
  exercises: TemplateExerciseInput[];
}

export const createTemplate = async (body: TemplateBody) => {
  const sb = supabase();
  const { data: tpl, error } = await sb
    .from('workout_templates')
    .insert({
      name: body.name,
      type: body.type ?? 'Strength',
      estimated_minutes: body.estimatedMinutes ?? 60,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  await insertTemplateExercises(tpl.id, body.exercises);
  return getTemplate(tpl.id);
};

export const updateTemplate = async (id: string, body: TemplateBody) => {
  const sb = supabase();
  await sb
    .from('workout_templates')
    .update({
      name: body.name,
      type: body.type ?? 'Strength',
      estimated_minutes: body.estimatedMinutes ?? 60,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  // Replace exercise list: simplest reliable approach for now
  await sb.from('template_exercises').delete().eq('template_id', id);
  await insertTemplateExercises(id, body.exercises);
  return getTemplate(id);
};

const insertTemplateExercises = async (templateId: string, exs: TemplateExerciseInput[]) => {
  const sb = supabase();
  for (let i = 0; i < exs.length; i++) {
    const ex = exs[i];
    const { data: te, error } = await sb
      .from('template_exercises')
      .insert({
        template_id: templateId,
        exercise_id: ex.exerciseId,
        superset_group_id: ex.supersetGroupId ?? null,
        order_index: i,
        notes: ex.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    if (ex.sets?.length) {
      await sb.from('template_sets').insert(
        ex.sets.map((s, j) => ({
          template_exercise_id: te.id,
          set_type: s.setType ?? 'Normal',
          target_reps: s.targetReps ?? null,
          target_weight_kg: s.targetWeightKg ?? null,
          target_duration_seconds: s.targetDurationSeconds ?? null,
          order_index: j,
        })),
      );
    }
  }
};

export const deleteTemplate = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('workout_templates').delete().eq('id', id);
  if (error) throw error;
};

export const duplicateTemplate = async (id: string) => {
  const original = await getTemplate(id);
  return createTemplate({
    name: `${original.name} (copy)`,
    type: original.type as any,
    estimatedMinutes: original.estimatedMinutes,
    notes: original.notes ?? undefined,
    exercises: original.exercises.map((e: any) => ({
      exerciseId: e.exerciseId,
      supersetGroupId: e.supersetGroupId,
      notes: e.notes,
      sets: e.sets.map((s: any) => ({
        setType: s.setType,
        targetReps: s.targetReps,
        targetWeightKg: s.targetWeightKg,
        targetDurationSeconds: s.targetDurationSeconds,
      })),
    })),
  });
};

import { supabase } from './supabase';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  isActive: r.is_active,
  isDeloadWeek: r.is_deload_week ?? false,
  startedAt: r.started_at,
  createdAt: r.created_at,
  days: (r.routine_days ?? [])
    .slice()
    .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
    .map((d: any) => ({
      id: d.id,
      dayOfWeek: d.day_of_week,
      dayLabel: DAYS[d.day_of_week],
      templateId: d.template_id,
      isRestDay: d.is_rest_day,
      templateName: d.workout_templates?.name ?? null,
    })),
});

export const listRoutines = async () => {
  const sb = supabase();
  const { data, error } = await sb
    .from('routines')
    .select('*, routine_days(*, workout_templates(name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { routines: (data ?? []).map(fromRow) };
};

export const getRoutine = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('routines')
    .select('*, routine_days(*, workout_templates(name))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const getActiveRoutine = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('routines')
    .select('*, routine_days(*, workout_templates(name))')
    .eq('is_active', true)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? fromRow(data) : null;
};

interface RoutineDayInput {
  dayOfWeek: number;
  templateId?: string | null;
  isRestDay?: boolean;
}

interface RoutineBody {
  name: string;
  description?: string;
  isActive?: boolean;
  isDeloadWeek?: boolean;
  days: RoutineDayInput[];
}

export const createRoutine = async (body: RoutineBody) => {
  const sb = supabase();
  if (body.isActive) {
    await sb.from('routines').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { data: r, error } = await sb
    .from('routines')
    .insert({
      name: body.name,
      description: body.description ?? null,
      is_active: body.isActive ?? false,
      is_deload_week: body.isDeloadWeek ?? false,
      started_at: body.isActive ? new Date().toISOString().split('T')[0] : null,
    })
    .select()
    .single();
  if (error) throw error;
  if (body.days?.length) {
    await sb.from('routine_days').insert(
      body.days.map((d) => ({
        routine_id: r.id,
        day_of_week: d.dayOfWeek,
        template_id: d.templateId ?? null,
        is_rest_day: d.isRestDay ?? false,
      })),
    );
  }
  return getRoutine(r.id);
};

export const updateRoutine = async (id: string, body: RoutineBody) => {
  const sb = supabase();
  if (body.isActive) {
    await sb.from('routines').update({ is_active: false }).neq('id', id);
  }
  await sb
    .from('routines')
    .update({
      name: body.name,
      description: body.description ?? null,
      is_active: body.isActive ?? false,
      is_deload_week: body.isDeloadWeek ?? false,
      started_at: body.isActive ? new Date().toISOString().split('T')[0] : null,
    })
    .eq('id', id);
  await sb.from('routine_days').delete().eq('routine_id', id);
  if (body.days?.length) {
    await sb.from('routine_days').insert(
      body.days.map((d) => ({
        routine_id: id,
        day_of_week: d.dayOfWeek,
        template_id: d.templateId ?? null,
        is_rest_day: d.isRestDay ?? false,
      })),
    );
  }
  return getRoutine(id);
};

export const setActiveRoutine = async (id: string) => {
  const sb = supabase();
  await sb.from('routines').update({ is_active: false }).neq('id', id);
  await sb
    .from('routines')
    .update({ is_active: true, started_at: new Date().toISOString().split('T')[0] })
    .eq('id', id);
  return getRoutine(id);
};

export const deleteRoutine = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('routines').delete().eq('id', id);
  if (error) throw error;
};

export const getTodayWorkout = async () => {
  const active = await getActiveRoutine();
  if (!active) return { routine: null, today: null };
  const dow = new Date().getDay();
  const today = active.days.find((d: { dayOfWeek: number }) => d.dayOfWeek === dow) ?? null;
  return { routine: active, today };
};

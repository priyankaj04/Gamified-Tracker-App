import { supabase } from './supabase';
import { todayISO } from '@/lib/date';

const settingsFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        isEnabled: r.is_enabled,
        averageCycleLength: r.average_cycle_length,
        averagePeriodLength: r.average_period_length,
      }
    : { id: null, isEnabled: false, averageCycleLength: 28, averagePeriodLength: 5 };

export const getSettings = async () => {
  const sb = supabase();
  const { data } = await sb.from('cycle_settings').select('*').limit(1).maybeSingle();
  return settingsFromRow(data);
};

export const upsertSettings = async (body: {
  isEnabled?: boolean;
  averageCycleLength?: number;
  averagePeriodLength?: number;
}) => {
  const sb = supabase();
  const { data: existing } = await sb.from('cycle_settings').select('id').limit(1).maybeSingle();
  const row: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.isEnabled !== undefined) row.is_enabled = body.isEnabled;
  if (body.averageCycleLength !== undefined) row.average_cycle_length = body.averageCycleLength;
  if (body.averagePeriodLength !== undefined) row.average_period_length = body.averagePeriodLength;
  if (existing) {
    const { data, error } = await sb
      .from('cycle_settings')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return settingsFromRow(data);
  }
  const { data, error } = await sb.from('cycle_settings').insert(row).select().single();
  if (error) throw error;
  return settingsFromRow(data);
};

const cycleFromRow = (r: any) => ({
  id: r.id,
  startDate: r.start_date,
  endDate: r.end_date,
  cycleLength: r.cycle_length,
  notes: r.notes,
});

export const startCycle = async (body: { startDate?: string; endDate?: string; notes?: string }) => {
  const sb = supabase();
  const startDate = body.startDate ?? todayISO();
  // Auto-enable cycle tracking once a user logs their first period.
  await upsertSettings({ isEnabled: true });
  // compute previous cycle's length (days between this start and the previous start)
  const { data: prev } = await sb
    .from('cycle_logs')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prev) {
    const len = Math.round(
      (new Date(startDate).getTime() - new Date(prev.start_date).getTime()) / 86400000,
    );
    if (len > 0) {
      await sb.from('cycle_logs').update({ cycle_length: len }).eq('id', prev.id);
    }
  }
  const { data, error } = await sb
    .from('cycle_logs')
    .insert({
      start_date: startDate,
      end_date: body.endDate ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return cycleFromRow(data);
};

export const updateCycleEntry = async (
  id: string,
  body: { startDate?: string; endDate?: string; notes?: string },
) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.startDate !== undefined) upd.start_date = body.startDate;
  if (body.endDate !== undefined) upd.end_date = body.endDate;
  if (body.notes !== undefined) upd.notes = body.notes;
  const { data, error } = await sb.from('cycle_logs').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return cycleFromRow(data);
};

export const deleteCycle = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('cycle_logs').delete().eq('id', id);
  if (error) throw error;
};

export const endCycle = async (body: { endDate?: string }) => {
  const sb = supabase();
  const endDate = body.endDate ?? todayISO();
  const { data: latest } = await sb
    .from('cycle_logs')
    .select('*')
    .is('end_date', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) throw new Error('No active cycle');
  const { data, error } = await sb
    .from('cycle_logs')
    .update({ end_date: endDate })
    .eq('id', latest.id)
    .select()
    .single();
  if (error) throw error;
  return cycleFromRow(data);
};

export const listCycles = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('cycle_logs')
    .select('*')
    .order('start_date', { ascending: false });
  return (data ?? []).map(cycleFromRow);
};

// Predict the next period start date based on past cycles.
// - 0 cycles → null
// - 1 cycle → last start + default (28 days)
// - 2+ cycles → last start + average gap between consecutive starts
export const cyclePrediction = async () => {
  const sb = supabase();
  const settings = await getSettings();
  const { data: cycles } = await sb
    .from('cycle_logs')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(12);
  if (!cycles || cycles.length === 0) {
    return {
      nextPeriodStart: null,
      daysUntil: null,
      averageCycleLength: settings.averageCycleLength,
      lastPeriodStart: null,
      sampleSize: 0,
    };
  }
  const lastStart = cycles[0].start_date as string;
  let avgLength = settings.averageCycleLength;
  if (cycles.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const a = new Date(cycles[i].start_date + 'T00:00:00Z').getTime();
      const b = new Date(cycles[i + 1].start_date + 'T00:00:00Z').getTime();
      gaps.push(Math.round((a - b) / 86_400_000));
    }
    if (gaps.length) {
      avgLength = Math.round(gaps.reduce((s, n) => s + n, 0) / gaps.length);
    }
  }
  const next = new Date(lastStart + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + avgLength);
  const today = new Date(todayISO() + 'T00:00:00Z');
  const daysUntil = Math.round((next.getTime() - today.getTime()) / 86_400_000);
  return {
    nextPeriodStart: next.toISOString().slice(0, 10),
    daysUntil,
    averageCycleLength: avgLength,
    lastPeriodStart: lastStart,
    sampleSize: cycles.length,
  };
};

export const todayCycle = async () => {
  const sb = supabase();
  const settings = await getSettings();
  const { data: latest } = await sb
    .from('cycle_logs')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) {
    return {
      phase: null,
      day: null,
      nextPeriodInDays: null,
      cycleStart: null,
    };
  }
  const start = new Date(latest.start_date + 'T00:00:00Z');
  const today = new Date(todayISO() + 'T00:00:00Z');
  const day = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  let phase: 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';
  if (day <= 5) phase = 'Menstrual';
  else if (day <= 13) phase = 'Follicular';
  else if (day <= 16) phase = 'Ovulation';
  else phase = 'Luteal';
  const nextPeriod = new Date(start.getTime() + settings.averageCycleLength * 86400000);
  const nextPeriodInDays = Math.max(
    0,
    Math.round((nextPeriod.getTime() - today.getTime()) / 86400000),
  );
  return {
    phase,
    day,
    nextPeriodInDays,
    cycleStart: latest.start_date,
  };
};

const symptomFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        date: r.date,
        cramps: r.cramps,
        bloating: r.bloating,
        mood: r.mood,
        energy: r.energy,
        notes: r.notes,
      }
    : null;

export const upsertSymptoms = async (body: {
  date?: string;
  cramps?: number;
  bloating?: number;
  mood?: number;
  energy?: number;
  notes?: string;
}) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const row: Record<string, any> = { date };
  if (body.cramps !== undefined) row.cramps = body.cramps;
  if (body.bloating !== undefined) row.bloating = body.bloating;
  if (body.mood !== undefined) row.mood = body.mood;
  if (body.energy !== undefined) row.energy = body.energy;
  if (body.notes !== undefined) row.notes = body.notes;
  const { data, error } = await sb
    .from('cycle_symptoms')
    .upsert(row, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return symptomFromRow(data);
};

export const getSymptoms = async (date: string) => {
  const sb = supabase();
  const { data } = await sb.from('cycle_symptoms').select('*').eq('date', date).maybeSingle();
  return symptomFromRow(data);
};

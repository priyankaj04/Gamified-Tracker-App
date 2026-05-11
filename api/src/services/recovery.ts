import { supabase } from './supabase';
import { todayISO } from '@/lib/date';

export type Soreness = Record<string, number>; // muscle -> 1..5

const fromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  sleepHours: r.sleep_hours != null ? Number(r.sleep_hours) : null,
  sleepQuality: r.sleep_quality,
  energyLevel: r.energy_level,
  soreness: (r.soreness ?? {}) as Soreness,
  notes: r.notes,
  createdAt: r.created_at,
});

export const listRecovery = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('recovery_logs').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data, error } = await q;
  if (error) throw error;
  return { logs: (data ?? []).map(fromRow) };
};

export interface UpsertRecoveryInput {
  date?: string;
  sleepHours?: number | null;
  sleepQuality?: number | null;
  energyLevel?: number | null;
  soreness?: Soreness;
  notes?: string | null;
}

export const upsertRecovery = async (input: UpsertRecoveryInput) => {
  const sb = supabase();
  const date = input.date ?? todayISO();
  const row: Record<string, any> = { date };
  if (input.sleepHours !== undefined) row.sleep_hours = input.sleepHours;
  if (input.sleepQuality !== undefined) row.sleep_quality = input.sleepQuality;
  if (input.energyLevel !== undefined) row.energy_level = input.energyLevel;
  if (input.soreness !== undefined) row.soreness = input.soreness;
  if (input.notes !== undefined) row.notes = input.notes;
  const { data, error } = await sb
    .from('recovery_logs')
    .upsert(row, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const deleteRecovery = async (date: string) => {
  const sb = supabase();
  const { error } = await sb.from('recovery_logs').delete().eq('date', date);
  if (error) throw error;
};

// Rolling 7-day recovery score, normalised to 0..100.
// Per spec: average of (sleep_quality * 20) + (energy_level * 10) + (10 if rest day) — clamped 0..100.
export const recoveryScore = async () => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  const fromISO = from.toISOString().split('T')[0];

  const { data: logs } = await sb
    .from('recovery_logs')
    .select('date, sleep_quality, energy_level')
    .gte('date', fromISO);
  const { data: rest } = await sb.from('rest_days').select('date').gte('date', fromISO);

  const restSet = new Set((rest ?? []).map((r: any) => r.date));
  const logMap = new Map<string, { sleep_quality: number | null; energy_level: number | null }>();
  (logs ?? []).forEach((l: any) => logMap.set(l.date, l));

  let total = 0;
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const l = logMap.get(key);
    let daily = 0;
    let counted = false;
    if (l) {
      if (l.sleep_quality != null) {
        daily += l.sleep_quality * 20;
        counted = true;
      }
      if (l.energy_level != null) {
        daily += l.energy_level * 10;
        counted = true;
      }
    }
    if (restSet.has(key)) {
      daily += 10;
      counted = true;
    }
    if (counted) {
      total += Math.min(100, daily);
      count += 1;
    }
  }

  const score = count > 0 ? Math.round(total / count) : null;
  return { score, days: count, window: 7 };
};

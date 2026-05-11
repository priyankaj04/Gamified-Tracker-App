import { supabase } from './supabase';
import { updateStreak } from './gamification';
import { todayISO } from '@/lib/date';

export const listRestDays = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('rest_days').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data } = await q;
  return { restDays: data ?? [] };
};

export const markRestDay = async (body: { date?: string; notes?: string }) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { data, error } = await sb
    .from('rest_days')
    .upsert({ date, notes: body.notes ?? null }, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  // Rest day still counts as activity for streaks
  const streak = await updateStreak('dojo');
  return { restDay: data, streakCount: streak.count };
};

export const removeRestDay = async (date: string) => {
  const sb = supabase();
  const { error } = await sb.from('rest_days').delete().eq('date', date);
  if (error) throw error;
};

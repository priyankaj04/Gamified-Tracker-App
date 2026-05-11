import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';

const fromRow = (r: any) => ({
  id: r.id,
  startTime: r.start_time,
  endTime: r.end_time,
  targetHours: Number(r.target_hours),
  actualHours: r.actual_hours != null ? Number(r.actual_hours) : null,
  completed: r.completed,
  notes: r.notes,
  xpEarned: r.xp_earned,
});

export const startFast = async (body: { targetHours: number; startTime?: string }) => {
  const sb = supabase();
  // Cancel any existing active session
  await sb
    .from('fasting_sessions')
    .delete()
    .is('end_time', null);
  const startTime = body.startTime ?? new Date().toISOString();
  const { data, error } = await sb
    .from('fasting_sessions')
    .insert({ start_time: startTime, target_hours: body.targetHours })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const endFast = async (body: { endTime?: string; notes?: string } = {}) => {
  const sb = supabase();
  const { data: active } = await sb
    .from('fasting_sessions')
    .select('*')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!active) throw new Error('No active fast');
  const endTime = body.endTime ?? new Date().toISOString();
  const actualHours =
    Math.round(((new Date(endTime).getTime() - new Date(active.start_time).getTime()) / 3_600_000) * 10) / 10;
  const completed = actualHours >= Number(active.target_hours);
  let xpEarned = 0;
  let newTotalXp = 0;
  let badges: any[] = [];
  if (completed) {
    const award = await awardXp({
      base: XP.COMPLETE_FAST_BASE + Math.round(actualHours * XP.COMPLETE_FAST_PER_HOUR),
      module: 'spirit',
      source: 'fast',
    });
    xpEarned = award.xpEarned;
    newTotalXp = award.newTotalXp;
    await updateStreak('spirit');
    const { count } = await sb
      .from('fasting_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true);
    badges = await checkBadges({ completedFasts: (count ?? 0) + 1 });
  }
  const { data, error } = await sb
    .from('fasting_sessions')
    .update({
      end_time: endTime,
      actual_hours: actualHours,
      completed,
      notes: body.notes ?? active.notes,
      xp_earned: xpEarned,
    })
    .eq('id', active.id)
    .select()
    .single();
  if (error) throw error;
  return { session: fromRow(data), xpEarned, newTotalXp, badgesUnlocked: badges };
};

export const getActive = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('fasting_sessions')
    .select('*')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? fromRow(data) : null;
};

export const listFasts = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('fasting_sessions')
    .select('*')
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false });
  return (data ?? []).map(fromRow);
};

export const deleteFast = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('fasting_sessions').delete().eq('id', id);
  if (error) throw error;
};

export const fastingStats = async () => {
  const sb = supabase();
  const { data } = await sb.from('fasting_sessions').select('*').not('end_time', 'is', null);
  const completed = (data ?? []).filter((r: any) => r.completed);
  const actuals = completed.map((r: any) => Number(r.actual_hours ?? 0));
  const longest = actuals.length ? Math.max(...actuals) : 0;
  const total = (data ?? []).length;
  const avgFastDuration = actuals.length
    ? Math.round((actuals.reduce((s, n) => s + n, 0) / actuals.length) * 10) / 10
    : 0;
  // streaks (per-day basis: count consecutive days with at least one completed fast)
  const dates = Array.from(
    new Set(completed.map((r: any) => new Date(r.start_time).toISOString().slice(0, 10))),
  ).sort();
  let longestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    const dt = new Date(d);
    if (prev && (dt.getTime() - prev.getTime()) / 86400000 === 1) {
      run++;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = dt;
  }
  let currentStreak = 0;
  if (dates.length > 0) {
    let cursor = new Date();
    for (let i = dates.length - 1; i >= 0; i--) {
      const dt = new Date(dates[i] + 'T00:00:00Z');
      const cursorIso = cursor.toISOString().slice(0, 10);
      if (dates[i] === cursorIso) {
        currentStreak++;
        cursor = new Date(dt.getTime() - 86400000);
      } else if (currentStreak === 0 && (new Date(cursorIso).getTime() - dt.getTime()) / 86400000 === 1) {
        currentStreak++;
        cursor = new Date(dt.getTime() - 86400000);
      } else if (currentStreak > 0) {
        break;
      }
    }
  }
  return {
    longestFast: longest,
    totalFasts: total,
    completedFasts: completed.length,
    avgFastDuration,
    currentStreak,
    longestStreak,
  };
};

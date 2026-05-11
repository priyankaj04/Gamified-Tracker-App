import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';

const logFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  bedtime: r.bedtime,
  wakeTime: r.wake_time,
  durationHours: r.duration_hours ? Number(r.duration_hours) : null,
  quality: r.quality,
  notes: r.notes,
  xpEarned: r.xp_earned,
});

const goalFromRow = (r: any) =>
  r ? { id: r.id, targetHours: Number(r.target_hours) } : null;

export const getGoal = async () => {
  const sb = supabase();
  const { data } = await sb.from('sleep_goal').select('*').limit(1).maybeSingle();
  return goalFromRow(data) ?? { id: null, targetHours: 8 };
};

export const upsertGoal = async (body: { targetHours: number }) => {
  const sb = supabase();
  const { data: existing } = await sb.from('sleep_goal').select('id').limit(1).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('sleep_goal')
      .update({ target_hours: body.targetHours, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return goalFromRow(data);
  }
  const { data, error } = await sb
    .from('sleep_goal')
    .insert({ target_hours: body.targetHours })
    .select()
    .single();
  if (error) throw error;
  return goalFromRow(data);
};

export const listSleep = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('sleep_logs').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data } = await q;
  return (data ?? []).map(logFromRow);
};

export const createSleep = async (body: {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality?: number;
  notes?: string;
}) => {
  const sb = supabase();
  const bedtime = new Date(body.bedtime);
  const wake = new Date(body.wakeTime);
  const durationHours = Math.round(((wake.getTime() - bedtime.getTime()) / 3_600_000) * 10) / 10;
  const goal = await getGoal();
  const base = durationHours >= (goal?.targetHours ?? 8) ? XP.LOG_SLEEP_GOOD : XP.LOG_SLEEP_SHORT;
  const { xpEarned, newTotalXp } = await awardXp({ base, module: 'spirit', source: 'sleep' });
  const { data, error } = await sb
    .from('sleep_logs')
    .upsert(
      {
        date: body.date,
        bedtime: body.bedtime,
        wake_time: body.wakeTime,
        duration_hours: durationHours,
        quality: body.quality ?? null,
        notes: body.notes ?? null,
        xp_earned: xpEarned,
      },
      { onConflict: 'date' },
    )
    .select()
    .single();
  if (error) throw error;
  await updateStreak('spirit');
  const sleepQualityStreak = await computeSleepQualityStreak();
  const badges = await checkBadges({ sleepQualityStreak });
  return { log: logFromRow(data), xpEarned, newTotalXp, badgesUnlocked: badges };
};

const computeSleepQualityStreak = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('sleep_logs')
    .select('date, quality')
    .order('date', { ascending: false })
    .limit(60);
  if (!data) return 0;
  let streak = 0;
  for (const r of data as any[]) {
    if ((r.quality ?? 0) >= 4) streak++;
    else break;
  }
  return streak;
};

export const updateSleep = async (id: string, body: any) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.bedtime !== undefined) upd.bedtime = body.bedtime;
  if (body.wakeTime !== undefined) upd.wake_time = body.wakeTime;
  if (body.bedtime !== undefined && body.wakeTime !== undefined) {
    const bed = new Date(body.bedtime).getTime();
    const wake = new Date(body.wakeTime).getTime();
    upd.duration_hours = Math.round(((wake - bed) / 3_600_000) * 10) / 10;
  }
  if (body.quality !== undefined) upd.quality = body.quality;
  if (body.notes !== undefined) upd.notes = body.notes;
  const { data, error } = await sb.from('sleep_logs').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return logFromRow(data);
};

export const deleteSleep = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('sleep_logs').delete().eq('id', id);
  if (error) throw error;
};

export const sleepStats = async () => {
  const sb = supabase();
  const goal = await getGoal();
  const goalHours = goal?.targetHours ?? 8;
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromIso = from.toISOString().slice(0, 10);
  const { data: recent } = await sb
    .from('sleep_logs')
    .select('*')
    .gte('date', fromIso)
    .order('date', { ascending: false });
  const { data: all } = await sb
    .from('sleep_logs')
    .select('date, duration_hours, quality')
    .order('date', { ascending: false });

  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10 : null;
  const durations = (recent ?? [])
    .map((r: any) => (r.duration_hours != null ? Number(r.duration_hours) : null))
    .filter((x: any): x is number => x != null);
  const qualities = (recent ?? [])
    .map((r: any) => (r.quality != null ? Number(r.quality) : null))
    .filter((x: any): x is number => x != null);
  const avgDuration = avg(durations);
  const avgQuality = avg(qualities);
  const debt =
    (recent ?? []).reduce((s: number, r: any) => {
      const d = Number(r.duration_hours ?? 0);
      return s + Math.max(0, goalHours - d);
    }, 0);

  // longest + current streak of any sleep log
  let currentStreak = 0;
  let cursor = new Date();
  for (const r of all ?? []) {
    const d = new Date(r.date + 'T00:00:00Z');
    const cursorIso = cursor.toISOString().slice(0, 10);
    if (r.date === cursorIso) {
      currentStreak++;
      cursor = new Date(d.getTime() - 86400000);
    } else if (currentStreak === 0 && new Date(cursorIso).getTime() - d.getTime() === 86400000) {
      currentStreak++;
      cursor = new Date(d.getTime() - 86400000);
    } else {
      break;
    }
  }

  const sorted = [...(all ?? [])]
    .map((r: any) => Number(r.duration_hours ?? 0))
    .filter((x) => x > 0);
  const bestNight = sorted.length ? Math.max(...sorted) : null;
  const worstNight = sorted.length ? Math.min(...sorted) : null;

  return {
    avgDuration7d: avgDuration,
    avgQuality7d: avgQuality,
    sleepDebt7d: Math.round(debt * 10) / 10,
    currentStreak,
    longestStreak: currentStreak,
    totalLogged: (all ?? []).length,
    bestNight,
    worstNight,
    goalHours,
  };
};

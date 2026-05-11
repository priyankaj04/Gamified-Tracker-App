import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';

const fromRow = (r: any) => ({
  id: r.id,
  activityType: r.activity_type,
  date: r.date,
  durationMinutes: r.duration_minutes,
  distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
  avgPaceMinPerKm: r.avg_pace_min_per_km != null ? Number(r.avg_pace_min_per_km) : null,
  hrZone: r.hr_zone,
  stars: r.stars,
  notes: r.notes,
  xpEarned: r.xp_earned,
  createdAt: r.created_at,
});

export const listCardio = async (params: { from?: string; to?: string; activityType?: string }) => {
  const sb = supabase();
  let q = sb.from('cardio_sessions').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  if (params.activityType) q = q.eq('activity_type', params.activityType);
  const { data, error } = await q;
  if (error) throw error;
  return { sessions: (data ?? []).map(fromRow) };
};

interface CardioBody {
  activityType: string;
  date?: string;
  durationMinutes: number;
  distanceKm?: number;
  hrZone?: number;
  stars?: number;
  notes?: string;
}

export const createCardio = async (body: CardioBody) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  // pace = duration / distance (min/km)
  const avgPace = body.distanceKm && body.distanceKm > 0 ? body.durationMinutes / body.distanceKm : null;
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.COMPLETE_WORKOUT,
    module: 'dojo',
    source: 'cardio',
  });
  const { data, error } = await sb
    .from('cardio_sessions')
    .insert({
      activity_type: body.activityType,
      date,
      duration_minutes: body.durationMinutes,
      distance_km: body.distanceKm ?? null,
      avg_pace_min_per_km: avgPace,
      hr_zone: body.hrZone ?? null,
      stars: body.stars ?? null,
      notes: body.notes ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;
  const streak = await updateStreak('dojo');
  const badges = await checkBadges({ workoutStreak: streak.count });
  return {
    session: fromRow(data),
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
  };
};

export const deleteCardio = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('cardio_sessions').delete().eq('id', id);
  if (error) throw error;
};

export const cardioStats = async () => {
  const sb = supabase();
  const { data } = await sb.from('cardio_sessions').select('duration_minutes, distance_km, date');
  const rows = data ?? [];
  const totalSessions = rows.length;
  const totalMinutes = rows.reduce((s, r: any) => s + (r.duration_minutes ?? 0), 0);
  const totalKm = rows.reduce((s, r: any) => s + (Number(r.distance_km) || 0), 0);
  return { totalSessions, totalMinutes, totalKm };
};

import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type { SessionMood } from '@/types';

// ──────────────────────────────────────────────────────────────
// Mapping helpers
// ──────────────────────────────────────────────────────────────

const sessionFromRow = (s: any, tags: string[] = []) => ({
  id: s.id,
  projectId: s.project_id ?? null,
  projectName: s.projects?.name ?? null,
  milestoneId: s.milestone_id ?? null,
  date: s.date,
  startTime: s.start_time ?? null,
  endTime: s.end_time ?? null,
  durationMinutes: s.duration_minutes,
  mood: (s.mood as SessionMood) ?? null,
  stars: s.stars ?? null,
  notes: s.notes ?? null,
  isBillable: !!s.is_billable,
  pomodoroCount: s.pomodoro_count ?? 0,
  xpEarned: s.xp_earned ?? 0,
  tags,
  createdAt: s.created_at,
});

// ──────────────────────────────────────────────────────────────
// List / get
// ──────────────────────────────────────────────────────────────

interface ListParams {
  projectId?: string;
  from?: string;
  to?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export const listSessions = async (p: ListParams) => {
  const sb = supabase();
  const limit = p.limit ?? 50;
  const offset = ((p.page ?? 1) - 1) * limit;
  let q = sb
    .from('coding_sessions')
    .select('*, projects(name), project_milestones(title)', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (p.projectId) q = q.eq('project_id', p.projectId);
  if (p.from) q = q.gte('date', p.from);
  if (p.to) q = q.lte('date', p.to);

  const { data, error } = await q;
  if (error) throw error;

  const ids = (data ?? []).map((s: any) => s.id);
  const tagsBySession: Record<string, string[]> = {};
  if (ids.length) {
    const { data: tagRows } = await sb.from('session_tags').select('*').in('session_id', ids);
    (tagRows ?? []).forEach((t: any) => {
      (tagsBySession[t.session_id] ??= []).push(t.tag);
    });
  }
  if (p.tag) {
    return {
      sessions: (data ?? [])
        .filter((s: any) => (tagsBySession[s.id] ?? []).includes(p.tag!))
        .map((s: any) => sessionFromRow(s, tagsBySession[s.id] ?? [])),
    };
  }
  return {
    sessions: (data ?? []).map((s: any) =>
      sessionFromRow(
        { ...s, milestoneName: s.project_milestones?.title },
        tagsBySession[s.id] ?? [],
      ),
    ),
  };
};

export const getTodaySessions = async () => {
  const sb = supabase();
  const t = todayISO();
  const { data, error } = await sb
    .from('coding_sessions')
    .select('*, projects(name)')
    .eq('date', t)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const total = (data ?? []).reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
  return {
    totalMinutes: total,
    sessions: (data ?? []).map((s: any) => sessionFromRow(s)),
  };
};

// ──────────────────────────────────────────────────────────────
// Create / update / delete
// ──────────────────────────────────────────────────────────────

interface SessionBody {
  projectId?: string | null;
  milestoneId?: string | null;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  mood?: SessionMood | null;
  notes?: string | null;
  stars?: number | null;
  isBillable?: boolean;
  pomodoroCount?: number;
  tags?: string[];
}

const computeSessionXp = (durationMin: number, startTime: string | null | undefined) => {
  let base = XP.LOG_CODING_SESSION + Math.floor(durationMin / 10) * XP.CODING_SESSION_PER_10_MIN;
  if (startTime) {
    const h = new Date(startTime).getHours();
    if (h >= 22 || h < 5) base += XP.NIGHT_OWL_BONUS;
  }
  return base;
};

export const createSession = async (body: SessionBody) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const base = computeSessionXp(body.durationMinutes, body.startTime ?? null);
  const { xpEarned, newTotalXp } = await awardXp({
    base,
    module: 'forge',
    source: 'session',
  });

  const { data: s, error } = await sb
    .from('coding_sessions')
    .insert({
      project_id: body.projectId ?? null,
      milestone_id: body.milestoneId ?? null,
      date,
      start_time: body.startTime ?? null,
      end_time: body.endTime ?? null,
      duration_minutes: body.durationMinutes,
      mood: body.mood ?? null,
      notes: body.notes ?? null,
      stars: body.stars ?? null,
      is_billable: body.isBillable ?? false,
      pomodoro_count: body.pomodoroCount ?? 0,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;

  if (body.tags?.length) {
    await sb.from('session_tags').insert(body.tags.map((tag) => ({ session_id: s.id, tag })));
  }

  if (body.projectId) {
    const { data: cur } = await sb
      .from('projects')
      .select('total_hours, tech_stack, status')
      .eq('id', body.projectId)
      .maybeSingle();
    if (cur) {
      const update: Record<string, any> = {
        total_hours: Number(cur.total_hours ?? 0) + body.durationMinutes / 60,
        updated_at: new Date().toISOString(),
      };
      // Auto-promote to In Progress on first session, so the project actually
      // surfaces on the Forge home's "In Progress" list.
      if (cur.status === 'Idea' || cur.status === 'Backlog') {
        update.status = 'In Progress';
      }
      await sb.from('projects').update(update).eq('id', body.projectId);
      // bump tech_skills hours/last_used for project's tech_stack
      const hoursDelta = body.durationMinutes / 60;
      for (const name of cur.tech_stack ?? []) {
        const { data: skill } = await sb.from('tech_skills').select('*').eq('name', name).maybeSingle();
        if (skill) {
          await sb
            .from('tech_skills')
            .update({
              total_hours: Number(skill.total_hours ?? 0) + hoursDelta,
              last_used: date,
              updated_at: new Date().toISOString(),
            })
            .eq('id', skill.id);
        } else {
          await sb.from('tech_skills').insert({
            name,
            total_hours: hoursDelta,
            first_used: date,
            last_used: date,
          });
        }
      }
    }
  }

  const streak = await updateStreak('forge');

  const { count: sessionCount } = await sb.from('coding_sessions').select('id', { count: 'exact', head: true });
  const { data: hoursAgg } = await sb.from('coding_sessions').select('duration_minutes');
  const totalCodingHours = (hoursAgg ?? []).reduce(
    (sum: number, r: any) => sum + (r.duration_minutes ?? 0) / 60,
    0,
  );
  const { data: nightAgg } = await sb.from('coding_sessions').select('start_time').not('start_time', 'is', null);
  const nightSessionCount = (nightAgg ?? []).filter((r: any) => {
    if (!r.start_time) return false;
    const h = new Date(r.start_time).getHours();
    return h >= 22 || h < 5;
  }).length;

  const badges = await checkBadges({
    sessionCount: sessionCount ?? 0,
    forgeStreak: streak.count,
    totalCodingHours,
    nightSessionCount,
  });

  return {
    session: sessionFromRow(s, body.tags ?? []),
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
  };
};

export const updateSession = async (id: string, body: Partial<SessionBody>) => {
  const sb = supabase();
  const upd: any = {};
  if (body.projectId !== undefined) upd.project_id = body.projectId;
  if (body.milestoneId !== undefined) upd.milestone_id = body.milestoneId;
  if (body.date !== undefined) upd.date = body.date;
  if (body.startTime !== undefined) upd.start_time = body.startTime;
  if (body.endTime !== undefined) upd.end_time = body.endTime;
  if (body.durationMinutes !== undefined) upd.duration_minutes = body.durationMinutes;
  if (body.mood !== undefined) upd.mood = body.mood;
  if (body.notes !== undefined) upd.notes = body.notes;
  if (body.stars !== undefined) upd.stars = body.stars;
  if (body.isBillable !== undefined) upd.is_billable = body.isBillable;
  if (body.pomodoroCount !== undefined) upd.pomodoro_count = body.pomodoroCount;
  await sb.from('coding_sessions').update(upd).eq('id', id);
  if (body.tags) {
    await sb.from('session_tags').delete().eq('session_id', id);
    if (body.tags.length) {
      await sb.from('session_tags').insert(body.tags.map((tag) => ({ session_id: id, tag })));
    }
  }
  const { data } = await sb.from('coding_sessions').select('*, projects(name)').eq('id', id).single();
  return sessionFromRow(data, body.tags ?? []);
};

export const deleteSession = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('coding_sessions').delete().eq('id', id);
  if (error) throw error;
};

// ──────────────────────────────────────────────────────────────
// Activity grid (365-day)
// ──────────────────────────────────────────────────────────────

export const getSessionGrid = async (days = 365) => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));
  const fromISO = from.toISOString().split('T')[0];
  const { data } = await sb
    .from('coding_sessions')
    .select('id, date, duration_minutes')
    .gte('date', fromISO);
  const byDate: Record<string, { minutes: number; ids: string[] }> = {};
  (data ?? []).forEach((s: any) => {
    const k = s.date as string;
    if (!byDate[k]) byDate[k] = { minutes: 0, ids: [] };
    byDate[k].minutes += s.duration_minutes ?? 0;
    byDate[k].ids.push(s.id);
  });
  const grid: {
    date: string;
    value: number;
    totalMinutes: number;
    sessionIds: string[];
  }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const cell = byDate[dStr];
    const minutes = cell?.minutes ?? 0;
    let value = 0;
    if (minutes >= 240) value = 4;
    else if (minutes >= 120) value = 3;
    else if (minutes >= 60) value = 2;
    else if (minutes > 0) value = 1;
    grid.push({ date: dStr, value, totalMinutes: minutes, sessionIds: cell?.ids ?? [] });
  }
  return { grid };
};

// ──────────────────────────────────────────────────────────────
// Active timer
// ──────────────────────────────────────────────────────────────

export const getActiveTimer = async () => {
  const sb = supabase();
  const { data } = await sb.from('active_timer').select('*, projects(name)').limit(1).maybeSingle();
  if (!data) return { timer: null };
  const startedAt = new Date(data.started_at).getTime();
  const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
  return {
    timer: {
      id: data.id,
      projectId: data.project_id,
      projectName: data.projects?.name ?? null,
      milestoneId: data.milestone_id,
      startedAt: data.started_at,
      elapsedSec,
      isRunning: data.is_running,
      isPomodoro: !!data.is_pomodoro,
    },
  };
};

export const startTimer = async (body: {
  projectId?: string | null;
  milestoneId?: string | null;
  isPomodoro?: boolean;
}) => {
  const sb = supabase();
  // Only one active timer at a time
  await sb.from('active_timer').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data, error } = await sb
    .from('active_timer')
    .insert({
      project_id: body.projectId ?? null,
      milestone_id: body.milestoneId ?? null,
      is_pomodoro: body.isPomodoro ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return { timerId: data.id, startedAt: data.started_at, isPomodoro: !!data.is_pomodoro };
};

export const stopTimer = async () => {
  const sb = supabase();
  const { data } = await sb.from('active_timer').select('*').limit(1).maybeSingle();
  if (!data) return { elapsedSec: 0 };
  const startedAt = new Date(data.started_at).getTime();
  const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
  await sb.from('active_timer').delete().eq('id', data.id);
  return { elapsedSec, projectId: data.project_id, milestoneId: data.milestone_id };
};

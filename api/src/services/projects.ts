import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type { ProjectStatus } from '@/types';

const projectFromRow = (row: any, milestones: any[] = [], sessions: any[] = []) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  techStack: row.tech_stack ?? [],
  githubUrl: row.github_url,
  status: row.status as ProjectStatus,
  stars: row.stars,
  totalHours: Number(row.total_hours),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  milestones: milestones.map((m) => ({
    id: m.id,
    projectId: m.project_id,
    title: m.title,
    completed: m.completed,
    completedAt: m.completed_at,
    orderIndex: m.order_index,
  })),
  recentSessions: sessions.map((s) => ({
    id: s.id,
    projectId: s.project_id,
    date: s.date,
    durationMinutes: s.duration_minutes,
    notes: s.notes,
    stars: s.stars,
    xpEarned: s.xp_earned,
    createdAt: s.created_at,
  })),
});

export const listProjects = async (status?: string) => {
  const sb = supabase();
  let q = sb.from('projects').select('*, project_milestones(*)').order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return {
    projects: (data ?? []).map((p) => projectFromRow(p, p.project_milestones ?? [])),
  };
};

export const getProject = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb.from('projects').select('*, project_milestones(*)').eq('id', id).single();
  if (error) throw error;
  const { data: sessions } = await sb
    .from('coding_sessions')
    .select('*')
    .eq('project_id', id)
    .order('date', { ascending: false })
    .limit(10);
  return projectFromRow(data, data.project_milestones ?? [], sessions ?? []);
};

interface CreateBody {
  name: string;
  description?: string;
  techStack?: string[];
  githubUrl?: string;
  milestones?: { title: string }[];
}

export const createProject = async (body: CreateBody) => {
  const sb = supabase();
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.CREATE_PROJECT,
    module: 'forge',
    source: 'create-project',
  });
  const { data: p, error } = await sb
    .from('projects')
    .insert({
      name: body.name,
      description: body.description ?? null,
      tech_stack: body.techStack ?? [],
      github_url: body.githubUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (body.milestones?.length) {
    await sb
      .from('project_milestones')
      .insert(body.milestones.map((m, i) => ({ project_id: p.id, title: m.title, order_index: i })));
  }
  const { count: projectCount } = await sb.from('projects').select('id', { count: 'exact', head: true });
  const badges = await checkBadges({ projectCount: projectCount ?? 0 });
  const project = await getProject(p.id);
  return { project, xpEarned, newTotalXp, badgesUnlocked: badges };
};

export const updateProject = async (id: string, body: Partial<CreateBody> & { status?: ProjectStatus; stars?: number | null }) => {
  const sb = supabase();
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.techStack !== undefined) update.tech_stack = body.techStack;
  if (body.githubUrl !== undefined) update.github_url = body.githubUrl;
  if (body.status !== undefined) update.status = body.status;
  if (body.stars !== undefined) update.stars = body.stars;

  const wasShipped = body.status === 'Shipped';
  let extraXp = 0;
  if (wasShipped) {
    const { data: cur } = await sb.from('projects').select('status').eq('id', id).maybeSingle();
    if (cur && cur.status !== 'Shipped') extraXp = XP.SHIP_PROJECT;
  }

  const { error } = await sb.from('projects').update(update).eq('id', id);
  if (error) throw error;
  if (extraXp) {
    await awardXp({ base: extraXp, module: 'forge', source: 'ship-project' });
  }
  return getProject(id);
};

export const deleteProject = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('projects').delete().eq('id', id);
  if (error) throw error;
};

export const toggleMilestone = async (projectId: string, milestoneId: string, completed: boolean) => {
  const sb = supabase();
  const completedAt = completed ? new Date().toISOString() : null;
  const { data: ms, error } = await sb
    .from('project_milestones')
    .update({ completed, completed_at: completedAt })
    .eq('id', milestoneId)
    .select()
    .single();
  if (error) throw error;
  let xpEarned = 0;
  let newTotalXp = 0;
  if (completed) {
    const award = await awardXp({ base: XP.COMPLETE_MILESTONE, module: 'forge', source: 'milestone' });
    xpEarned = award.xpEarned;
    newTotalXp = award.newTotalXp;
  }
  return {
    milestone: {
      id: ms.id,
      projectId: ms.project_id,
      title: ms.title,
      completed: ms.completed,
      completedAt: ms.completed_at,
      orderIndex: ms.order_index,
    },
    xpEarned,
    newTotalXp,
    badgesUnlocked: [],
  };
};

// ── SESSIONS ──────────────────────────────────────────
interface SessionBody {
  projectId?: string | null;
  date?: string;
  durationMinutes: number;
  notes?: string;
  stars?: number | null;
}

export const listSessions = async (params: { projectId?: string; from?: string; to?: string; page?: number; limit?: number }) => {
  const sb = supabase();
  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb
    .from('coding_sessions')
    .select('*, projects(name)', { count: 'exact' })
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1);
  if (params.projectId) q = q.eq('project_id', params.projectId);
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data, error } = await q;
  if (error) throw error;
  return {
    sessions: (data ?? []).map((s: any) => ({
      id: s.id,
      projectId: s.project_id,
      projectName: s.projects?.name ?? null,
      date: s.date,
      durationMinutes: s.duration_minutes,
      notes: s.notes,
      stars: s.stars,
      xpEarned: s.xp_earned,
      createdAt: s.created_at,
    })),
  };
};

export const createSession = async (body: SessionBody) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.LOG_CODING_SESSION,
    module: 'forge',
    source: 'session',
  });

  const { data: s, error } = await sb
    .from('coding_sessions')
    .insert({
      project_id: body.projectId ?? null,
      date,
      duration_minutes: body.durationMinutes,
      notes: body.notes ?? null,
      stars: body.stars ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;

  if (body.projectId) {
    const { data: cur } = await sb.from('projects').select('total_hours').eq('id', body.projectId).maybeSingle();
    if (cur) {
      await sb
        .from('projects')
        .update({ total_hours: Number(cur.total_hours) + body.durationMinutes / 60, updated_at: new Date().toISOString() })
        .eq('id', body.projectId);
    }
  }

  const streak = await updateStreak('forge');
  const { count: sessionCount } = await sb.from('coding_sessions').select('id', { count: 'exact', head: true });
  const { data: hoursAgg } = await sb.from('coding_sessions').select('duration_minutes');
  const totalCodingHours = (hoursAgg ?? []).reduce((sum: number, r: any) => sum + r.duration_minutes / 60, 0);
  const { count: shippedCount } = await sb
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Shipped');

  const badges = await checkBadges({
    sessionCount: sessionCount ?? 0,
    forgeStreak: streak.count,
    totalCodingHours,
    shippedCount: shippedCount ?? 0,
  });

  return {
    session: {
      id: s.id,
      projectId: s.project_id,
      date: s.date,
      durationMinutes: s.duration_minutes,
      notes: s.notes,
      stars: s.stars,
      xpEarned: s.xp_earned,
    },
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
  };
};

export const deleteSession = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('coding_sessions').delete().eq('id', id);
  if (error) throw error;
};

export const getSessionGrid = async () => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 89);
  const fromISO = from.toISOString().split('T')[0];
  const { data } = await sb
    .from('coding_sessions')
    .select('id, date, duration_minutes')
    .gte('date', fromISO);
  const byDate: Record<string, { minutes: number; id: string }> = {};
  (data ?? []).forEach((s: any) => {
    const k = s.date as string;
    const prev = byDate[k]?.minutes ?? 0;
    byDate[k] = { minutes: prev + s.duration_minutes, id: s.id };
  });
  const grid: { date: string; value: number; sessionId: string | null }[] = [];
  for (let i = 0; i < 90; i++) {
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
    grid.push({ date: dStr, value, sessionId: cell?.id ?? null });
  }
  return { grid };
};

import { supabase } from './supabase';
import { awardXp, checkBadges } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type {
  ProjectStatus,
  ProjectType,
  Priority,
} from '@/types';

// ──────────────────────────────────────────────────────────────
// Row mappers
// ──────────────────────────────────────────────────────────────

const milestoneFromRow = (m: any, subtasks: any[] = []) => ({
  id: m.id,
  projectId: m.project_id,
  title: m.title,
  targetDate: m.target_date ?? null,
  completed: m.completed,
  completedAt: m.completed_at ?? null,
  orderIndex: m.order_index,
  notes: m.notes ?? null,
  xpEarned: m.xp_earned ?? 0,
  subtasks: subtasks
    .filter((s) => s.milestone_id === m.id)
    .map((s) => ({
      id: s.id,
      milestoneId: s.milestone_id,
      title: s.title,
      priority: s.priority as Priority,
      estimatedHours: s.estimated_hours == null ? null : Number(s.estimated_hours),
      completed: s.completed,
      completedAt: s.completed_at ?? null,
      orderIndex: s.order_index,
    })),
});

const projectFromRow = (
  row: any,
  milestones: any[] = [],
  subtasks: any[] = [],
  sessions: any[] = [],
  issuesOpen = 0,
  lastSessionDate: string | null = null,
  deployments: any[] = [],
) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? null,
  type: (row.type ?? 'Personal') as ProjectType,
  priority: (row.priority ?? 'B') as Priority,
  techStack: row.tech_stack ?? [],
  coverEmoji: row.cover_emoji ?? '💻',
  coverColor: row.cover_color ?? '#22d3ee',
  isPinned: !!row.is_pinned,
  isArchived: !!row.is_archived,
  readmeNotes: row.readme_notes ?? null,
  startDate: row.start_date ?? null,
  targetShipDate: row.target_ship_date ?? null,
  shippedDate: row.shipped_date ?? null,
  estimatedHours: row.estimated_hours == null ? null : Number(row.estimated_hours),
  githubUrl: row.github_url ?? null,
  demoUrl: row.demo_url ?? null,
  figmaUrl: row.figma_url ?? null,
  docsUrl: row.docs_url ?? null,
  isPortfolio: !!row.is_portfolio,
  status: row.status as ProjectStatus,
  stars: row.stars ?? null,
  totalHours: Number(row.total_hours ?? 0),
  githubData: row.github_data ?? null,
  githubSyncedAt: row.github_synced_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  milestoneCompletionPct:
    milestones.length === 0
      ? 0
      : Math.round(
          (milestones.filter((m: any) => m.completed).length / milestones.length) * 100,
        ),
  openIssueCount: issuesOpen,
  lastSessionDate,
  milestones: milestones.map((m) => milestoneFromRow(m, subtasks)),
  recentSessions: sessions.map((s) => ({
    id: s.id,
    projectId: s.project_id,
    date: s.date,
    durationMinutes: s.duration_minutes,
    notes: s.notes,
    stars: s.stars,
    mood: s.mood,
    xpEarned: s.xp_earned,
    createdAt: s.created_at,
  })),
  deployments: deployments.map((d) => ({
    id: d.id,
    projectId: d.project_id,
    version: d.version,
    environment: d.environment,
    deployedAt: d.deployed_at,
    releaseNotes: d.release_notes,
    deployUrl: d.deploy_url,
  })),
});

// ──────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────

const refreshTechSkillsFromProject = async (projectId: string) => {
  const sb = supabase();
  const { data: p } = await sb.from('projects').select('tech_stack').eq('id', projectId).maybeSingle();
  const stack: string[] = p?.tech_stack ?? [];
  for (const name of stack) {
    const { data: existing } = await sb.from('tech_skills').select('*').eq('name', name).maybeSingle();
    if (existing) {
      await sb
        .from('tech_skills')
        .update({
          last_used: todayISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await sb.from('tech_skills').insert({
        name,
        first_used: todayISO(),
        last_used: todayISO(),
      });
    }
  }
  // refresh project_count for every tech in this stack
  for (const name of stack) {
    const { count } = await sb
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .contains('tech_stack', [name]);
    await sb.from('tech_skills').update({ project_count: count ?? 0 }).eq('name', name);
  }
};

// ──────────────────────────────────────────────────────────────
// CRUD
// ──────────────────────────────────────────────────────────────

interface ListFilters {
  status?: string;
  type?: string;
  priority?: string;
  archived?: boolean;
  pinned?: boolean;
  search?: string;
  tag?: string;
}

export const listProjects = async (filters: ListFilters) => {
  const sb = supabase();
  let q = sb
    .from('projects')
    .select('*, project_milestones(id, completed), issues!issues_project_id_fkey(id, status)')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.priority) q = q.eq('priority', filters.priority);
  if (filters.archived !== undefined) q = q.eq('is_archived', filters.archived);
  if (filters.pinned !== undefined) q = q.eq('is_pinned', filters.pinned);
  if (filters.search) q = q.ilike('name', `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;

  let rows: any[] = data ?? [];
  if (filters.tag) {
    rows = rows.filter((p) => (p.tech_stack ?? []).includes(filters.tag));
  }

  // Pull last session date per project
  const ids = rows.map((p) => p.id);
  const lastSessionByProject: Record<string, string> = {};
  if (ids.length) {
    const { data: sess } = await sb
      .from('coding_sessions')
      .select('project_id, date')
      .in('project_id', ids)
      .order('date', { ascending: false });
    (sess ?? []).forEach((s: any) => {
      if (s.project_id && !lastSessionByProject[s.project_id]) lastSessionByProject[s.project_id] = s.date;
    });
  }

  return {
    projects: rows.map((p) =>
      projectFromRow(
        p,
        p.project_milestones ?? [],
        [],
        [],
        (p.issues ?? []).filter((i: any) => i.status === 'Open' || i.status === 'In Progress').length,
        lastSessionByProject[p.id] ?? null,
      ),
    ),
  };
};

export const getProject = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: ms } = await sb
    .from('project_milestones')
    .select('*')
    .eq('project_id', id)
    .order('order_index', { ascending: true });
  const milestoneIds = (ms ?? []).map((m: any) => m.id);
  const { data: subs } = milestoneIds.length
    ? await sb.from('subtasks').select('*').in('milestone_id', milestoneIds).order('order_index')
    : { data: [] };
  const { data: sessions } = await sb
    .from('coding_sessions')
    .select('*')
    .eq('project_id', id)
    .order('date', { ascending: false })
    .limit(10);
  const { data: issues } = await sb.from('issues').select('id, status').eq('project_id', id);
  const openCount = (issues ?? []).filter((i: any) => i.status === 'Open' || i.status === 'In Progress').length;
  const { data: deps } = await sb
    .from('deployments')
    .select('*')
    .eq('project_id', id)
    .order('deployed_at', { ascending: false })
    .limit(20);
  const lastSession = (sessions ?? [])[0]?.date ?? null;
  return projectFromRow(data, ms ?? [], subs ?? [], sessions ?? [], openCount, lastSession, deps ?? []);
};

interface CreateBody {
  name: string;
  description?: string | null;
  type?: ProjectType;
  priority?: Priority;
  techStack?: string[];
  coverEmoji?: string;
  coverColor?: string;
  startDate?: string;
  targetShipDate?: string | null;
  estimatedHours?: number | null;
  githubUrl?: string | null;
  demoUrl?: string | null;
  figmaUrl?: string | null;
  docsUrl?: string | null;
  milestones?: { title: string; targetDate?: string | null }[];
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
      type: body.type ?? 'Personal',
      priority: body.priority ?? 'B',
      tech_stack: body.techStack ?? [],
      cover_emoji: body.coverEmoji ?? '💻',
      cover_color: body.coverColor ?? '#22d3ee',
      start_date: body.startDate ?? todayISO(),
      target_ship_date: body.targetShipDate ?? null,
      estimated_hours: body.estimatedHours ?? null,
      github_url: body.githubUrl ?? null,
      demo_url: body.demoUrl ?? null,
      figma_url: body.figmaUrl ?? null,
      docs_url: body.docsUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (body.milestones?.length) {
    await sb.from('project_milestones').insert(
      body.milestones.map((m, i) => ({
        project_id: p.id,
        title: m.title,
        target_date: m.targetDate ?? null,
        order_index: i,
      })),
    );
  }

  await refreshTechSkillsFromProject(p.id);

  const { count: projectCount } = await sb.from('projects').select('id', { count: 'exact', head: true });
  const { data: techRows } = await sb.from('tech_skills').select('id', { count: 'exact' });
  const uniqueTechCount = techRows?.length ?? 0;
  const badges = await checkBadges({ projectCount: projectCount ?? 0, uniqueTechCount });

  const project = await getProject(p.id);
  return { project, xpEarned, newTotalXp, badgesUnlocked: badges };
};

export const updateProject = async (
  id: string,
  body: Partial<CreateBody> & {
    status?: ProjectStatus;
    stars?: number | null;
    readmeNotes?: string | null;
    isPortfolio?: boolean;
  },
) => {
  const sb = supabase();
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = body.name;
  if (body.description !== undefined) update.description = body.description;
  if (body.type !== undefined) update.type = body.type;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.techStack !== undefined) update.tech_stack = body.techStack;
  if (body.coverEmoji !== undefined) update.cover_emoji = body.coverEmoji;
  if (body.coverColor !== undefined) update.cover_color = body.coverColor;
  if (body.startDate !== undefined) update.start_date = body.startDate;
  if (body.targetShipDate !== undefined) update.target_ship_date = body.targetShipDate;
  if (body.estimatedHours !== undefined) update.estimated_hours = body.estimatedHours;
  if (body.githubUrl !== undefined) update.github_url = body.githubUrl;
  if (body.demoUrl !== undefined) update.demo_url = body.demoUrl;
  if (body.figmaUrl !== undefined) update.figma_url = body.figmaUrl;
  if (body.docsUrl !== undefined) update.docs_url = body.docsUrl;
  if (body.status !== undefined) update.status = body.status;
  if (body.stars !== undefined) update.stars = body.stars;
  if (body.readmeNotes !== undefined) update.readme_notes = body.readmeNotes;
  if (body.isPortfolio !== undefined) update.is_portfolio = body.isPortfolio;

  const { error } = await sb.from('projects').update(update).eq('id', id);
  if (error) throw error;

  if (body.techStack !== undefined) await refreshTechSkillsFromProject(id);
  return getProject(id);
};

export const deleteProject = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('projects').delete().eq('id', id);
  if (error) throw error;
};

export const togglePin = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb.from('projects').select('is_pinned').eq('id', id).maybeSingle();
  const next = !cur?.is_pinned;
  await sb
    .from('projects')
    .update({ is_pinned: next, updated_at: new Date().toISOString() })
    .eq('id', id);
  return getProject(id);
};

export const toggleArchive = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb.from('projects').select('is_archived, status').eq('id', id).maybeSingle();
  const archived = !cur?.is_archived;
  const update: any = { is_archived: archived, updated_at: new Date().toISOString() };
  if (archived) update.status = 'Archived';
  else if (cur?.status === 'Archived') update.status = 'Backlog';
  await sb.from('projects').update(update).eq('id', id);
  return getProject(id);
};

export const shipProject = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb
    .from('projects')
    .select('created_at, type, status')
    .eq('id', id)
    .maybeSingle();
  if (!cur) throw new Error('Project not found');
  if (cur.status === 'Shipped') return { project: await getProject(id), xpEarned: 0, newTotalXp: 0, badgesUnlocked: [] };

  await sb
    .from('projects')
    .update({
      status: 'Shipped',
      shipped_date: todayISO(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.SHIP_PROJECT,
    module: 'forge',
    source: 'ship-project',
  });

  const created = new Date(cur.created_at);
  const today = new Date();
  const days = (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const shippedWithinSevenDays = days <= 7;

  const { count: shippedCount } = await sb
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Shipped');
  const { count: shippedOS } = await sb
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Shipped')
    .eq('type', 'Open Source');

  const badges = await checkBadges({
    shippedCount: shippedCount ?? 0,
    shippedWithinSevenDays,
    shippedOpenSourceCount: shippedOS ?? 0,
  });

  return { project: await getProject(id), xpEarned, newTotalXp, badgesUnlocked: badges };
};

export const duplicateProject = async (id: string) => {
  const sb = supabase();
  const { data: src, error } = await sb.from('projects').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: ms } = await sb.from('project_milestones').select('*').eq('project_id', id);

  const { data: clone, error: cErr } = await sb
    .from('projects')
    .insert({
      name: `Copy of ${src.name}`,
      description: src.description,
      type: src.type,
      priority: src.priority,
      tech_stack: src.tech_stack,
      cover_emoji: src.cover_emoji,
      cover_color: src.cover_color,
      readme_notes: src.readme_notes,
      estimated_hours: src.estimated_hours,
      github_url: src.github_url,
      demo_url: src.demo_url,
      figma_url: src.figma_url,
      docs_url: src.docs_url,
      status: 'Backlog',
      total_hours: 0,
      start_date: todayISO(),
    })
    .select()
    .single();
  if (cErr) throw cErr;

  if ((ms ?? []).length) {
    await sb.from('project_milestones').insert(
      ms!.map((m: any) => ({
        project_id: clone.id,
        title: m.title,
        target_date: null,
        order_index: m.order_index,
      })),
    );
  }
  return getProject(clone.id);
};

// ──────────────────────────────────────────────────────────────
// Tags
// ──────────────────────────────────────────────────────────────

export const listTags = async () => {
  const sb = supabase();
  const { data, error } = await sb.from('project_tags').select('*').order('name');
  if (error) throw error;
  return { tags: data ?? [] };
};

export const createTag = async (name: string, color = '#22d3ee') => {
  const sb = supabase();
  const { data, error } = await sb.from('project_tags').insert({ name, color }).select().single();
  if (error) throw error;
  return data;
};

export const deleteTag = async (id: string) => {
  const sb = supabase();
  await sb.from('project_tags').delete().eq('id', id);
};

// ──────────────────────────────────────────────────────────────
// Portfolio
// ──────────────────────────────────────────────────────────────

export const listPortfolio = async () => {
  const sb = supabase();
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('is_portfolio', true)
    .order('shipped_date', { ascending: false });
  if (error) throw error;
  return {
    projects: (data ?? []).map((p: any) => projectFromRow(p)),
  };
};

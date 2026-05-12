import { supabase } from './supabase';
import { awardXp, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type {
  LearningStatus,
  LearningType,
  Proficiency,
  SkillCategory,
} from '@/types';

const learningXp: Record<LearningType, number> = {
  Course: XP.LEARNING_COURSE,
  Book: XP.LEARNING_BOOK,
  Tutorial: XP.LEARNING_TUTORIAL,
  Video: XP.LEARNING_VIDEO,
  Documentation: XP.LEARNING_DOCUMENTATION,
  Paper: XP.LEARNING_PAPER,
};

const itemFromRow = (r: any) => ({
  id: r.id,
  title: r.title,
  type: r.type as LearningType,
  platform: r.platform ?? null,
  sourceUrl: r.source_url ?? null,
  topics: r.topics ?? [],
  status: r.status as LearningStatus,
  progressPct: r.progress_pct,
  rating: r.rating ?? null,
  notes: r.notes ?? null,
  startedAt: r.started_at ?? null,
  completedAt: r.completed_at ?? null,
  estimatedHours: r.estimated_hours == null ? null : Number(r.estimated_hours),
  actualHours: r.actual_hours == null ? null : Number(r.actual_hours),
  xpEarned: r.xp_earned ?? 0,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const skillFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  category: r.category as SkillCategory,
  proficiency: r.proficiency as Proficiency,
  totalHours: Number(r.total_hours ?? 0),
  projectCount: r.project_count ?? 0,
  firstUsed: r.first_used ?? null,
  lastUsed: r.last_used ?? null,
  updatedAt: r.updated_at,
});

// ──────────────────────────────────────────────────────────────
// Learning items CRUD
// ──────────────────────────────────────────────────────────────

interface ListLearningParams {
  status?: string;
  type?: string;
  topic?: string;
  search?: string;
}

export const listLearning = async (p: ListLearningParams) => {
  const sb = supabase();
  let q = sb.from('learning_items').select('*').order('updated_at', { ascending: false });
  if (p.status) q = q.eq('status', p.status);
  if (p.type) q = q.eq('type', p.type);
  if (p.search) q = q.ilike('title', `%${p.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  let rows = data ?? [];
  if (p.topic) rows = rows.filter((r: any) => (r.topics ?? []).includes(p.topic));
  return { items: rows.map(itemFromRow) };
};

interface LearningBody {
  title: string;
  type?: LearningType;
  platform?: string | null;
  sourceUrl?: string | null;
  topics?: string[];
  status?: LearningStatus;
  progressPct?: number;
  rating?: number | null;
  notes?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
}

export const createLearning = async (body: LearningBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('learning_items')
    .insert({
      title: body.title,
      type: body.type ?? 'Course',
      platform: body.platform ?? null,
      source_url: body.sourceUrl ?? null,
      topics: body.topics ?? [],
      status: body.status ?? 'Not Started',
      progress_pct: body.progressPct ?? 0,
      rating: body.rating ?? null,
      notes: body.notes ?? null,
      estimated_hours: body.estimatedHours ?? null,
      actual_hours: body.actualHours ?? null,
      started_at: body.status === 'In Progress' ? todayISO() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return itemFromRow(data);
};

export const updateLearning = async (id: string, body: Partial<LearningBody>) => {
  const sb = supabase();
  const { data: current } = await sb.from('learning_items').select('*').eq('id', id).single();
  if (!current) throw new Error('Learning item not found');

  const upd: any = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) upd.title = body.title;
  if (body.type !== undefined) upd.type = body.type;
  if (body.platform !== undefined) upd.platform = body.platform;
  if (body.sourceUrl !== undefined) upd.source_url = body.sourceUrl;
  if (body.topics !== undefined) upd.topics = body.topics;
  if (body.status !== undefined) upd.status = body.status;
  if (body.progressPct !== undefined) upd.progress_pct = body.progressPct;
  if (body.rating !== undefined) upd.rating = body.rating;
  if (body.notes !== undefined) upd.notes = body.notes;
  if (body.estimatedHours !== undefined) upd.estimated_hours = body.estimatedHours;
  if (body.actualHours !== undefined) upd.actual_hours = body.actualHours;

  // Auto-flip status when progress changes meaningfully.
  // - First nudge from 0 → >0 promotes Not Started → In Progress.
  // - Hitting 100 promotes anything → Completed.
  const nextProgress = body.progressPct ?? current.progress_pct;
  const nextStatus = body.status ?? current.status;
  if (body.progressPct !== undefined && body.status === undefined) {
    if (nextProgress >= 100 && nextStatus !== 'Completed') {
      upd.status = 'Completed';
      upd.completed_at = todayISO();
    } else if (nextProgress > 0 && nextStatus === 'Not Started') {
      upd.status = 'In Progress';
      if (!current.started_at) upd.started_at = todayISO();
    }
  }
  // If the caller explicitly moved into In Progress, stamp started_at.
  if (body.status === 'In Progress' && !current.started_at) upd.started_at = todayISO();
  // If the caller explicitly moved into Completed, stamp completed_at.
  if (body.status === 'Completed' && !current.completed_at) upd.completed_at = todayISO();

  await sb.from('learning_items').update(upd).eq('id', id);
  if (body.progressPct !== undefined || body.status !== undefined) {
    await updateStreak('learning');
  }
  const { data } = await sb.from('learning_items').select('*').eq('id', id).single();
  return itemFromRow(data);
};

export const updateProgress = async (id: string, progressPct: number) => {
  return updateLearning(id, { progressPct });
};

export const completeLearning = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb.from('learning_items').select('*').eq('id', id).maybeSingle();
  if (!cur) throw new Error('Not found');
  const type = (cur.type as LearningType) ?? 'Course';
  const { xpEarned, newTotalXp } = await awardXp({
    base: learningXp[type],
    module: 'learning',
    source: 'learning-complete',
  });
  await sb
    .from('learning_items')
    .update({
      status: 'Completed',
      progress_pct: 100,
      completed_at: todayISO(),
      xp_earned: xpEarned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  await updateStreak('learning');

  // bump tech_skills for each topic
  const hoursDelta = Number(cur.actual_hours ?? cur.estimated_hours ?? 0);
  for (const topic of cur.topics ?? []) {
    const { data: skill } = await sb.from('tech_skills').select('*').eq('name', topic).maybeSingle();
    if (skill) {
      await sb
        .from('tech_skills')
        .update({
          total_hours: Number(skill.total_hours ?? 0) + hoursDelta,
          last_used: todayISO(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', skill.id);
    } else {
      await sb.from('tech_skills').insert({
        name: topic,
        total_hours: hoursDelta,
        first_used: todayISO(),
        last_used: todayISO(),
      });
    }
  }

  const { data } = await sb.from('learning_items').select('*').eq('id', id).single();
  return { item: itemFromRow(data), xpEarned, newTotalXp };
};

export const deleteLearning = async (id: string) => {
  const sb = supabase();
  await sb.from('learning_items').delete().eq('id', id);
};

// ──────────────────────────────────────────────────────────────
// Stats
// ──────────────────────────────────────────────────────────────

export const learningStats = async () => {
  const sb = supabase();
  const { data } = await sb.from('learning_items').select('*');
  const items = data ?? [];
  const completed = items.filter((i: any) => i.status === 'Completed');
  const inProgress = items.filter((i: any) => i.status === 'In Progress');
  const monthStart = new Date();
  monthStart.setDate(1);
  const completedThisMonth = completed.filter(
    (i: any) => i.completed_at && new Date(i.completed_at) >= monthStart,
  ).length;
  const totalHours = items.reduce(
    (s: number, i: any) => s + Number(i.actual_hours ?? 0),
    0,
  );
  const topicMap: Record<string, { count: number; hours: number }> = {};
  items.forEach((i: any) => {
    (i.topics ?? []).forEach((t: string) => {
      if (!topicMap[t]) topicMap[t] = { count: 0, hours: 0 };
      topicMap[t].count += 1;
      topicMap[t].hours += Number(i.actual_hours ?? 0);
    });
  });
  return {
    totalCompleted: completed.length,
    totalInProgress: inProgress.length,
    totalHours: Math.round(totalHours * 10) / 10,
    completedThisMonth,
    topicBreakdown: Object.entries(topicMap).map(([topic, v]) => ({
      topic,
      count: v.count,
      hours: Math.round(v.hours * 10) / 10,
    })),
  };
};

// ──────────────────────────────────────────────────────────────
// Skill map
// ──────────────────────────────────────────────────────────────

export const skillMap = async () => {
  const sb = supabase();
  const { data } = await sb.from('tech_skills').select('*').order('total_hours', { ascending: false });
  const rows = (data ?? []).map(skillFromRow);
  const grouped: Record<string, typeof rows> = {};
  rows.forEach((s) => {
    (grouped[s.category] ??= []).push(s);
  });
  return { categories: grouped, skills: rows };
};

export const updateSkill = async (id: string, body: { proficiency?: Proficiency; category?: SkillCategory }) => {
  const sb = supabase();
  const upd: any = { updated_at: new Date().toISOString() };
  if (body.proficiency) upd.proficiency = body.proficiency;
  if (body.category) upd.category = body.category;
  await sb.from('tech_skills').update(upd).eq('id', id);
  const { data } = await sb.from('tech_skills').select('*').eq('id', id).single();
  return skillFromRow(data);
};

const daysAgo = (iso: string | null) => {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
};

export const rustySkills = async () => {
  const sb = supabase();
  const { data } = await sb.from('tech_skills').select('*').gt('total_hours', 0);
  const rusty = (data ?? [])
    .filter((s: any) => daysAgo(s.last_used) > 60)
    .map(skillFromRow);
  return { skills: rusty };
};

export const trendingSkills = async () => {
  const sb = supabase();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const { data } = await sb.from('tech_skills').select('*').gte('last_used', cutoff.toISOString().split('T')[0]);
  return {
    skills: (data ?? [])
      .map(skillFromRow)
      .sort((a, b) => b.totalHours - a.totalHours),
  };
};

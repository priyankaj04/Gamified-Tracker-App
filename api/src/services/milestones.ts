import { supabase } from './supabase';
import { awardXp, checkBadges } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type { Priority } from '@/types';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const subtaskFromRow = (s: any) => ({
  id: s.id,
  milestoneId: s.milestone_id,
  title: s.title,
  priority: s.priority as Priority,
  estimatedHours: s.estimated_hours == null ? null : Number(s.estimated_hours),
  completed: s.completed,
  completedAt: s.completed_at ?? null,
  orderIndex: s.order_index,
});

const milestoneFromRow = (m: any, subtasks: any[] = []) => {
  const isOverdue =
    !m.completed && m.target_date && new Date(m.target_date) < new Date(todayISO());
  return {
    id: m.id,
    projectId: m.project_id,
    title: m.title,
    targetDate: m.target_date ?? null,
    completed: m.completed,
    completedAt: m.completed_at ?? null,
    orderIndex: m.order_index,
    notes: m.notes ?? null,
    xpEarned: m.xp_earned ?? 0,
    isOverdue: !!isOverdue,
    subtasks: subtasks.map(subtaskFromRow),
    subtaskCount: subtasks.length,
    subtaskCompleteCount: subtasks.filter((s) => s.completed).length,
  };
};

// ──────────────────────────────────────────────────────────────
// Milestones
// ──────────────────────────────────────────────────────────────

export const listMilestones = async (projectId: string) => {
  const sb = supabase();
  const { data: ms } = await sb
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index');
  const ids = (ms ?? []).map((m: any) => m.id);
  const { data: subs } = ids.length
    ? await sb.from('subtasks').select('*').in('milestone_id', ids).order('order_index')
    : { data: [] };
  return {
    milestones: (ms ?? []).map((m: any) =>
      milestoneFromRow(
        m,
        (subs ?? []).filter((s: any) => s.milestone_id === m.id),
      ),
    ),
  };
};

interface MilestoneBody {
  projectId: string;
  title: string;
  targetDate?: string | null;
  notes?: string | null;
  orderIndex?: number;
}

export const createMilestone = async (body: MilestoneBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('project_milestones')
    .insert({
      project_id: body.projectId,
      title: body.title,
      target_date: body.targetDate ?? null,
      notes: body.notes ?? null,
      order_index: body.orderIndex ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return milestoneFromRow(data);
};

export const updateMilestone = async (
  id: string,
  body: Partial<{ title: string; targetDate: string | null; notes: string | null; orderIndex: number }>,
) => {
  const sb = supabase();
  const upd: any = {};
  if (body.title !== undefined) upd.title = body.title;
  if (body.targetDate !== undefined) upd.target_date = body.targetDate;
  if (body.notes !== undefined) upd.notes = body.notes;
  if (body.orderIndex !== undefined) upd.order_index = body.orderIndex;
  await sb.from('project_milestones').update(upd).eq('id', id);
  const { data } = await sb.from('project_milestones').select('*').eq('id', id).single();
  return milestoneFromRow(data);
};

export const deleteMilestone = async (id: string) => {
  const sb = supabase();
  await sb.from('project_milestones').delete().eq('id', id);
};

export const completeMilestone = async (id: string, completed: boolean) => {
  const sb = supabase();
  const completedAt = completed ? new Date().toISOString() : null;
  let xpEarned = 0;
  let newTotalXp = 0;
  if (completed) {
    const award = await awardXp({ base: XP.COMPLETE_MILESTONE, module: 'forge', source: 'milestone' });
    xpEarned = award.xpEarned;
    newTotalXp = award.newTotalXp;
  }
  await sb
    .from('project_milestones')
    .update({ completed, completed_at: completedAt, xp_earned: xpEarned })
    .eq('id', id);

  const { count: doneCount } = await sb
    .from('project_milestones')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true);
  const badges = completed
    ? await checkBadges({ milestonesCompleted: doneCount ?? 0 })
    : [];
  const { data } = await sb.from('project_milestones').select('*').eq('id', id).single();
  return {
    milestone: milestoneFromRow(data),
    xpEarned,
    newTotalXp,
    badgesUnlocked: badges,
  };
};

export const reorderMilestones = async (ids: string[]) => {
  const sb = supabase();
  for (let i = 0; i < ids.length; i++) {
    await sb.from('project_milestones').update({ order_index: i }).eq('id', ids[i]);
  }
  return { ok: true };
};

// ──────────────────────────────────────────────────────────────
// Subtasks
// ──────────────────────────────────────────────────────────────

interface SubtaskBody {
  title: string;
  priority?: Priority;
  estimatedHours?: number | null;
  orderIndex?: number;
}

export const createSubtask = async (milestoneId: string, body: SubtaskBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('subtasks')
    .insert({
      milestone_id: milestoneId,
      title: body.title,
      priority: body.priority ?? 'B',
      estimated_hours: body.estimatedHours ?? null,
      order_index: body.orderIndex ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return subtaskFromRow(data);
};

export const updateSubtask = async (
  id: string,
  body: Partial<SubtaskBody> & { completed?: boolean },
) => {
  const sb = supabase();
  const upd: any = {};
  if (body.title !== undefined) upd.title = body.title;
  if (body.priority !== undefined) upd.priority = body.priority;
  if (body.estimatedHours !== undefined) upd.estimated_hours = body.estimatedHours;
  if (body.orderIndex !== undefined) upd.order_index = body.orderIndex;
  if (body.completed !== undefined) {
    upd.completed = body.completed;
    upd.completed_at = body.completed ? new Date().toISOString() : null;
  }
  await sb.from('subtasks').update(upd).eq('id', id);
  const { data } = await sb.from('subtasks').select('*').eq('id', id).single();
  return subtaskFromRow(data);
};

export const deleteSubtask = async (id: string) => {
  const sb = supabase();
  await sb.from('subtasks').delete().eq('id', id);
};

export const toggleSubtask = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb.from('subtasks').select('completed').eq('id', id).maybeSingle();
  return updateSubtask(id, { completed: !cur?.completed });
};

export const reorderSubtasks = async (ids: string[]) => {
  const sb = supabase();
  for (let i = 0; i < ids.length; i++) {
    await sb.from('subtasks').update({ order_index: i }).eq('id', ids[i]);
  }
  return { ok: true };
};

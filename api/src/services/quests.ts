import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import {
  xpForTaskPriority,
  difficultyMultiplier,
  getHunterRank,
  nextHunterRank,
  COMBO_WINDOW_MIN,
  COMBO_THRESHOLD,
  COMBO_BONUS,
  XP,
} from '@/lib/xp';
import type { Priority } from '@/types';

type Recurrence =
  | { kind: 'daily' }
  | { kind: 'weekly'; daysOfWeek: number[] }
  | { kind: 'monthly'; dayOfMonth: number }
  | null;

const tagFromRow = (r: any) => ({ id: r.id, name: r.name, color: r.color });

const stepFromRow = (r: any) => ({
  id: r.id,
  questId: r.quest_id,
  label: r.label,
  done: r.done,
  doneAt: r.done_at,
  orderIndex: r.order_index,
});

const questFromRow = (r: any, tags: any[] = [], steps: any[] = []) => ({
  id: r.id,
  title: r.title,
  description: r.description ?? null,
  priority: r.priority as Priority,
  difficulty: r.difficulty ?? null,
  isDaily: r.is_daily,
  isBoss: r.is_boss ?? false,
  completed: r.completed,
  completedAt: r.completed_at,
  dueDate: r.due_date,
  remindAt: r.remind_at,
  stars: r.stars,
  notes: r.notes,
  estimatedMinutes: r.estimated_minutes,
  actualMinutes: r.actual_minutes,
  xpEarned: r.xp_earned,
  displayOrder: r.display_order ?? 0,
  parentQuestId: r.parent_quest_id,
  recurrence: (r.recurrence ?? null) as Recurrence,
  lastRolloverDate: r.last_rollover_date,
  archivedAt: r.archived_at,
  templateId: r.template_id,
  linkedModule: r.linked_module,
  linkedModuleId: r.linked_module_id,
  createdAt: r.created_at,
  tags: tags.map(tagFromRow),
  steps: steps.map(stepFromRow),
  stepCount: steps.length,
  stepDoneCount: steps.filter((s) => s.done).length,
});

const fetchQuestWithRelations = async (id: string) => {
  const sb = supabase();
  const { data: q, error } = await sb.from('quests').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: links } = await sb.from('quest_tags').select('tag_id, tags(*)').eq('quest_id', id);
  const tags = (links ?? []).map((l: any) => l.tags).filter(Boolean);
  const { data: steps } = await sb
    .from('quest_steps')
    .select('*')
    .eq('quest_id', id)
    .order('order_index', { ascending: true });
  return questFromRow(q, tags, steps ?? []);
};

export const listQuests = async (params: {
  completed?: boolean;
  priority?: string;
  tagId?: string;
  daily?: boolean;
  boss?: boolean;
  archived?: boolean;
  search?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
}) => {
  const sb = supabase();
  const limit = params.limit ?? 100;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb
    .from('quests')
    .select('*, quest_tags(tag_id, tags(*)), quest_steps(*)', { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (params.completed !== undefined) q = q.eq('completed', params.completed);
  if (params.priority) q = q.eq('priority', params.priority);
  if (params.daily !== undefined) q = q.eq('is_daily', params.daily);
  if (params.boss !== undefined) q = q.eq('is_boss', params.boss);
  if (params.archived === true) q = q.not('archived_at', 'is', null);
  else q = q.is('archived_at', null);
  if (params.parentId === null) q = q.is('parent_quest_id', null);
  else if (params.parentId) q = q.eq('parent_quest_id', params.parentId);
  if (params.search) q = q.ilike('title', `%${params.search}%`);

  const { data, count, error } = await q;
  if (error) throw error;

  let quests = (data ?? []).map((row: any) =>
    questFromRow(
      row,
      (row.quest_tags ?? []).map((qt: any) => qt.tags).filter(Boolean),
      (row.quest_steps ?? []).slice().sort((a: any, b: any) => a.order_index - b.order_index),
    ),
  );
  if (params.tagId) quests = quests.filter((q) => q.tags.some((t: any) => t.id === params.tagId));
  return { quests, total: count ?? 0 };
};

export const getQuest = (id: string) => fetchQuestWithRelations(id);

interface QuestBody {
  title: string;
  description?: string | null;
  priority?: Priority;
  difficulty?: 'Trivial' | 'Normal' | 'Hard' | 'Boss' | null;
  isDaily?: boolean;
  isBoss?: boolean;
  dueDate?: string | null;
  remindAt?: string | null;
  tagIds?: string[];
  notes?: string;
  estimatedMinutes?: number | null;
  recurrence?: Recurrence;
  parentQuestId?: string | null;
  steps?: string[];
  linkedModule?: string | null;
  linkedModuleId?: string | null;
}

export const createQuest = async (body: QuestBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('quests')
    .insert({
      title: body.title,
      description: body.description ?? null,
      priority: body.priority ?? 'C',
      difficulty: body.difficulty ?? null,
      is_daily: body.isDaily ?? false,
      is_boss: body.isBoss ?? false,
      due_date: body.dueDate ?? null,
      remind_at: body.remindAt ?? null,
      notes: body.notes ?? null,
      estimated_minutes: body.estimatedMinutes ?? null,
      recurrence: body.recurrence ?? null,
      parent_quest_id: body.parentQuestId ?? null,
      linked_module: body.linkedModule ?? null,
      linked_module_id: body.linkedModuleId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (body.tagIds?.length) {
    await sb.from('quest_tags').insert(body.tagIds.map((tag_id) => ({ quest_id: data.id, tag_id })));
  }
  if (body.steps?.length) {
    await sb.from('quest_steps').insert(
      body.steps.map((label, i) => ({ quest_id: data.id, label, order_index: i })),
    );
  }
  return fetchQuestWithRelations(data.id);
};

export const updateQuest = async (id: string, body: Partial<QuestBody>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.difficulty !== undefined) update.difficulty = body.difficulty;
  if (body.isDaily !== undefined) update.is_daily = body.isDaily;
  if (body.isBoss !== undefined) update.is_boss = body.isBoss;
  if (body.dueDate !== undefined) update.due_date = body.dueDate;
  if (body.remindAt !== undefined) update.remind_at = body.remindAt;
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.estimatedMinutes !== undefined) update.estimated_minutes = body.estimatedMinutes;
  if (body.recurrence !== undefined) update.recurrence = body.recurrence;
  if (body.parentQuestId !== undefined) update.parent_quest_id = body.parentQuestId;
  if (body.linkedModule !== undefined) update.linked_module = body.linkedModule;
  if (body.linkedModuleId !== undefined) update.linked_module_id = body.linkedModuleId;
  if (Object.keys(update).length) await sb.from('quests').update(update).eq('id', id);
  if (body.tagIds !== undefined) {
    await sb.from('quest_tags').delete().eq('quest_id', id);
    if (body.tagIds.length) {
      await sb.from('quest_tags').insert(body.tagIds.map((tag_id) => ({ quest_id: id, tag_id })));
    }
  }
  return fetchQuestWithRelations(id);
};

const updateCombo = async () => {
  const sb = supabase();
  const { data: row } = await sb.from('quest_combo').select('*').limit(1).maybeSingle();
  const now = new Date();
  const windowMs = COMBO_WINDOW_MIN * 60 * 1000;
  const last = row?.last_complete_at ? new Date(row.last_complete_at).getTime() : 0;
  const inWindow = last && now.getTime() - last < windowMs;
  const newCount = inWindow ? (row?.count ?? 0) + 1 : 1;
  const windowEndsAt = new Date(now.getTime() + windowMs).toISOString();
  if (row) {
    await sb
      .from('quest_combo')
      .update({ count: newCount, last_complete_at: now.toISOString(), window_ends_at: windowEndsAt })
      .eq('id', row.id);
  } else {
    await sb.from('quest_combo').insert({
      count: newCount,
      last_complete_at: now.toISOString(),
      window_ends_at: windowEndsAt,
    });
  }
  const comboActive = newCount >= COMBO_THRESHOLD;
  return { count: newCount, comboActive, multiplier: comboActive ? COMBO_BONUS : 1 };
};

export const getCombo = async () => {
  const sb = supabase();
  const { data: row } = await sb.from('quest_combo').select('*').limit(1).maybeSingle();
  if (!row) return { count: 0, comboActive: false, windowEndsAt: null };
  const now = Date.now();
  const ends = row.window_ends_at ? new Date(row.window_ends_at).getTime() : 0;
  if (ends && now > ends) return { count: 0, comboActive: false, windowEndsAt: null };
  return {
    count: row.count,
    comboActive: row.count >= COMBO_THRESHOLD,
    windowEndsAt: row.window_ends_at,
  };
};

export const completeQuest = async (id: string, stars?: number | null) => {
  const sb = supabase();
  const { data: q, error } = await sb.from('quests').select('*').eq('id', id).single();
  if (error) throw error;
  if (q.completed) {
    return {
      quest: await fetchQuestWithRelations(id),
      xpEarned: 0,
      newTotalXp: 0,
      streakUpdated: false,
      streakCount: 0,
      badgesUnlocked: [],
      comboActive: false,
      comboCount: 0,
      multiplierApplied: 1,
    };
  }

  const base = xpForTaskPriority(q.priority as Priority);
  const diffMult = difficultyMultiplier(q.difficulty as any);
  const bossMult = q.is_boss ? 2 : 1;
  const combo = await updateCombo();
  const adjustedBase = Math.round(base * diffMult * bossMult * combo.multiplier);

  const { xpEarned, newTotalXp } = await awardXp({
    base: adjustedBase,
    module: 'quests',
    source: `quest:${q.priority}${q.is_boss ? ':boss' : ''}${combo.comboActive ? ':combo' : ''}`,
  });

  // close active timer if any, capture minutes
  let actualMinutes: number | null = null;
  const { data: timer } = await sb.from('quest_active_timer').select('*').eq('quest_id', id).maybeSingle();
  if (timer) {
    const ran = timer.is_running
      ? timer.elapsed_sec + Math.floor((Date.now() - new Date(timer.started_at).getTime()) / 1000)
      : timer.elapsed_sec;
    actualMinutes = Math.max(1, Math.round(ran / 60));
    await sb.from('quest_active_timer').delete().eq('id', timer.id);
  }

  await sb
    .from('quests')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      stars: stars ?? null,
      xp_earned: xpEarned,
      actual_minutes: actualMinutes,
    })
    .eq('id', id);

  // mark all steps as done if quest is completed (idempotent for completion)
  await sb.from('quest_steps').update({ done: true, done_at: new Date().toISOString() }).eq('quest_id', id).eq('done', false);

  const streak = await updateStreak('quests');

  const { count: questCount } = await sb
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true);
  const { count: sRankCount } = await sb
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)
    .eq('priority', 'S');

  const badges = await checkBadges({
    questCount: questCount ?? 0,
    sRankQuestCount: sRankCount ?? 0,
  });

  // Progress active weekly/monthly challenges
  await progressActiveChallenges(q.priority, q.is_boss);

  return {
    quest: await fetchQuestWithRelations(id),
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
    comboActive: combo.comboActive,
    comboCount: combo.count,
    multiplierApplied: diffMult * bossMult * combo.multiplier,
  };
};

export const deleteQuest = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('quests').delete().eq('id', id);
  if (error) throw error;
};

export const archiveQuest = async (id: string) => {
  const sb = supabase();
  await sb.from('quests').update({ archived_at: new Date().toISOString() }).eq('id', id);
  return fetchQuestWithRelations(id);
};

export const unarchiveQuest = async (id: string) => {
  const sb = supabase();
  await sb.from('quests').update({ archived_at: null }).eq('id', id);
  return fetchQuestWithRelations(id);
};

export const reorderQuests = async (orderedIds: string[]) => {
  const sb = supabase();
  await Promise.all(
    orderedIds.map((id, i) => sb.from('quests').update({ display_order: i }).eq('id', id)),
  );
};

// ── Steps (subtasks) ─────────────────────────────────────────
export const listSteps = async (questId: string) => {
  const sb = supabase();
  const { data } = await sb
    .from('quest_steps')
    .select('*')
    .eq('quest_id', questId)
    .order('order_index', { ascending: true });
  return (data ?? []).map(stepFromRow);
};

export const createStep = async (questId: string, label: string) => {
  const sb = supabase();
  const { data: existing } = await sb
    .from('quest_steps')
    .select('order_index')
    .eq('quest_id', questId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (existing?.order_index ?? -1) + 1;
  const { data, error } = await sb
    .from('quest_steps')
    .insert({ quest_id: questId, label, order_index: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return stepFromRow(data);
};

export const updateStep = async (id: string, body: { label?: string; done?: boolean }) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.label !== undefined) update.label = body.label;
  if (body.done !== undefined) {
    update.done = body.done;
    update.done_at = body.done ? new Date().toISOString() : null;
  }
  await sb.from('quest_steps').update(update).eq('id', id);

  // Auto-complete parent quest when all steps done
  if (body.done) {
    const { data: step } = await sb.from('quest_steps').select('quest_id').eq('id', id).single();
    if (step) {
      const { data: stepsRemaining } = await sb
        .from('quest_steps')
        .select('id, done')
        .eq('quest_id', step.quest_id);
      const allDone = stepsRemaining?.every((s: any) => s.done);
      if (allDone && stepsRemaining && stepsRemaining.length > 0) {
        const { data: parentQuest } = await sb.from('quests').select('*').eq('id', step.quest_id).single();
        if (parentQuest && !parentQuest.completed) {
          return { autoCompleteQuestId: step.quest_id };
        }
      }
    }
  }
  return {};
};

export const deleteStep = async (id: string) => {
  const sb = supabase();
  await sb.from('quest_steps').delete().eq('id', id);
};

export const reorderSteps = async (questId: string, orderedIds: string[]) => {
  const sb = supabase();
  await Promise.all(
    orderedIds.map((id, i) =>
      sb.from('quest_steps').update({ order_index: i }).eq('id', id).eq('quest_id', questId),
    ),
  );
};

// ── Templates ────────────────────────────────────────────────
export const listTemplates = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('quest_templates')
    .select('*')
    .order('use_count', { ascending: false })
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    priority: r.priority,
    difficulty: r.difficulty,
    isDaily: r.is_daily,
    isBoss: r.is_boss,
    recurrence: r.recurrence,
    estimatedMinutes: r.estimated_minutes,
    notes: r.notes,
    tagIds: r.tag_ids ?? [],
    stepLabels: r.step_labels ?? [],
    useCount: r.use_count,
    lastUsedAt: r.last_used_at,
    createdAt: r.created_at,
  }));
};

export const createTemplate = async (body: {
  name: string;
  title: string;
  priority?: Priority;
  difficulty?: string | null;
  isDaily?: boolean;
  isBoss?: boolean;
  recurrence?: Recurrence;
  estimatedMinutes?: number | null;
  notes?: string | null;
  tagIds?: string[];
  stepLabels?: string[];
}) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('quest_templates')
    .insert({
      name: body.name,
      title: body.title,
      priority: body.priority ?? 'C',
      difficulty: body.difficulty ?? null,
      is_daily: body.isDaily ?? false,
      is_boss: body.isBoss ?? false,
      recurrence: body.recurrence ?? null,
      estimated_minutes: body.estimatedMinutes ?? null,
      notes: body.notes ?? null,
      tag_ids: body.tagIds ?? [],
      step_labels: body.stepLabels ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTemplate = async (id: string) => {
  const sb = supabase();
  await sb.from('quest_templates').delete().eq('id', id);
};

export const useTemplate = async (id: string) => {
  const sb = supabase();
  const { data: tpl, error } = await sb.from('quest_templates').select('*').eq('id', id).single();
  if (error) throw error;
  const quest = await createQuest({
    title: tpl.title,
    priority: tpl.priority,
    difficulty: tpl.difficulty,
    isDaily: tpl.is_daily,
    isBoss: tpl.is_boss,
    recurrence: tpl.recurrence,
    estimatedMinutes: tpl.estimated_minutes,
    notes: tpl.notes,
    tagIds: tpl.tag_ids ?? [],
    steps: tpl.step_labels ?? [],
  });
  await sb
    .from('quest_templates')
    .update({ use_count: (tpl.use_count ?? 0) + 1, last_used_at: new Date().toISOString() })
    .eq('id', id);
  return quest;
};

// ── Active timer ─────────────────────────────────────────────
export const getActiveTimer = async () => {
  const sb = supabase();
  const { data } = await sb.from('quest_active_timer').select('*').limit(1).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    questId: data.quest_id,
    startedAt: data.started_at,
    elapsedSec: data.elapsed_sec,
    isRunning: data.is_running,
  };
};

export const startTimer = async (questId: string) => {
  const sb = supabase();
  await sb.from('quest_active_timer').delete().neq('quest_id', questId);
  const existing = await sb.from('quest_active_timer').select('*').eq('quest_id', questId).maybeSingle();
  if (existing.data) {
    await sb
      .from('quest_active_timer')
      .update({ is_running: true, started_at: new Date().toISOString() })
      .eq('id', existing.data.id);
  } else {
    await sb.from('quest_active_timer').insert({ quest_id: questId, is_running: true });
  }
  return getActiveTimer();
};

export const pauseTimer = async (questId: string) => {
  const sb = supabase();
  const { data } = await sb.from('quest_active_timer').select('*').eq('quest_id', questId).maybeSingle();
  if (!data) return null;
  const elapsed = data.is_running
    ? data.elapsed_sec + Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)
    : data.elapsed_sec;
  await sb
    .from('quest_active_timer')
    .update({ is_running: false, elapsed_sec: elapsed })
    .eq('id', data.id);
  return getActiveTimer();
};

export const stopTimer = async (questId: string) => {
  const sb = supabase();
  await sb.from('quest_active_timer').delete().eq('quest_id', questId);
};

// ── Recurrence rollover ──────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);

const shouldRollover = (recurrence: Recurrence, lastRollover: string | null, today: string) => {
  if (!recurrence) return false;
  if (lastRollover === today) return false;
  if (recurrence.kind === 'daily') return true;
  const d = new Date(today + 'T12:00:00');
  if (recurrence.kind === 'weekly') return recurrence.daysOfWeek.includes(d.getDay());
  if (recurrence.kind === 'monthly') return d.getDate() === recurrence.dayOfMonth;
  return false;
};

export const rolloverQuests = async () => {
  const sb = supabase();
  const today = todayISO();
  const { data: candidates } = await sb
    .from('quests')
    .select('*')
    .or('is_daily.eq.true,recurrence.not.is.null')
    .eq('completed', true);
  let count = 0;
  for (const q of candidates ?? []) {
    const rec: Recurrence = q.recurrence ?? (q.is_daily ? { kind: 'daily' } : null);
    if (!rec) continue;
    if (!shouldRollover(rec, q.last_rollover_date, today)) continue;
    await sb
      .from('quests')
      .update({
        completed: false,
        completed_at: null,
        stars: null,
        xp_earned: 0,
        actual_minutes: null,
        last_rollover_date: today,
      })
      .eq('id', q.id);
    await sb.from('quest_steps').update({ done: false, done_at: null }).eq('quest_id', q.id);
    count++;
  }
  return { rolledOver: count, date: today };
};

// ── Auto-archive completed quests older than setting ─────────
export const autoArchive = async () => {
  const sb = supabase();
  const { data: settings } = await sb.from('quest_settings').select('*').limit(1).maybeSingle();
  const days = settings?.auto_archive_days ?? 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from('quests')
    .update({ archived_at: new Date().toISOString() })
    .lt('completed_at', cutoff)
    .eq('completed', true)
    .is('archived_at', null)
    .is('recurrence', null)
    .eq('is_daily', false)
    .select('id');
  return { archived: data?.length ?? 0 };
};

// ── Quest settings ───────────────────────────────────────────
export const getSettings = async () => {
  const sb = supabase();
  const { data } = await sb.from('quest_settings').select('*').limit(1).maybeSingle();
  if (!data) {
    const { data: ins } = await sb.from('quest_settings').insert({}).select().single();
    return mapSettings(ins);
  }
  return mapSettings(data);
};

const mapSettings = (r: any) => ({
  id: r.id,
  defaultPriority: r.default_priority,
  defaultTab: r.default_tab,
  autoArchiveDays: r.auto_archive_days,
  reminderOffsetMinutes: r.reminder_offset_minutes,
  soundsEnabled: r.sounds_enabled,
  comboEnabled: r.combo_enabled,
  penaltyEnabled: r.penalty_enabled,
});

export const updateSettings = async (body: Partial<{
  defaultPriority: string;
  defaultTab: string;
  autoArchiveDays: number;
  reminderOffsetMinutes: number;
  soundsEnabled: boolean;
  comboEnabled: boolean;
  penaltyEnabled: boolean;
}>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.defaultPriority !== undefined) update.default_priority = body.defaultPriority;
  if (body.defaultTab !== undefined) update.default_tab = body.defaultTab;
  if (body.autoArchiveDays !== undefined) update.auto_archive_days = body.autoArchiveDays;
  if (body.reminderOffsetMinutes !== undefined)
    update.reminder_offset_minutes = body.reminderOffsetMinutes;
  if (body.soundsEnabled !== undefined) update.sounds_enabled = body.soundsEnabled;
  if (body.comboEnabled !== undefined) update.combo_enabled = body.comboEnabled;
  if (body.penaltyEnabled !== undefined) update.penalty_enabled = body.penaltyEnabled;
  update.updated_at = new Date().toISOString();
  const { data: existing } = await sb.from('quest_settings').select('id').limit(1).maybeSingle();
  if (existing) await sb.from('quest_settings').update(update).eq('id', existing.id);
  return getSettings();
};

// ── Hunter Rank ──────────────────────────────────────────────
export const getRank = async () => {
  const sb = supabase();
  const { count: qCount } = await sb
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true);
  const { count: sCount } = await sb
    .from('quests')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true)
    .eq('priority', 'S');
  const cur = getHunterRank(qCount ?? 0, sCount ?? 0);
  const nxt = nextHunterRank(qCount ?? 0, sCount ?? 0);
  const score = (qCount ?? 0) + (sCount ?? 0);
  const progress = nxt ? Math.min(100, Math.round(((score - cur.min) / (nxt.min - cur.min)) * 100)) : 100;
  return {
    rank: cur,
    nextRank: nxt,
    completedCount: qCount ?? 0,
    sRankCount: sCount ?? 0,
    progressPct: progress,
    toNext: nxt ? Math.max(0, nxt.min - score) : 0,
  };
};

// ── Today's Hunt ─────────────────────────────────────────────
export const getTodaysHunt = async () => {
  const sb = supabase();
  const today = todayISO();
  // Daily/recurring active quests
  const { data: dailies } = await sb
    .from('quests')
    .select('*, quest_tags(tag_id, tags(*)), quest_steps(*)')
    .eq('completed', false)
    .is('archived_at', null)
    .eq('is_daily', true);
  // Due today
  const { data: dueToday } = await sb
    .from('quests')
    .select('*, quest_tags(tag_id, tags(*)), quest_steps(*)')
    .eq('completed', false)
    .is('archived_at', null)
    .eq('due_date', today);
  // High-priority active (S/A) not in above
  const { data: highPriority } = await sb
    .from('quests')
    .select('*, quest_tags(tag_id, tags(*)), quest_steps(*)')
    .eq('completed', false)
    .is('archived_at', null)
    .in('priority', ['S', 'A'])
    .limit(5);

  const dedupe = new Map<string, any>();
  for (const row of [...(dailies ?? []), ...(dueToday ?? []), ...(highPriority ?? [])]) {
    if (!dedupe.has(row.id)) dedupe.set(row.id, row);
  }
  const items = Array.from(dedupe.values()).map((row: any) =>
    questFromRow(
      row,
      (row.quest_tags ?? []).map((qt: any) => qt.tags).filter(Boolean),
      (row.quest_steps ?? []).slice().sort((a: any, b: any) => a.order_index - b.order_index),
    ),
  );

  const allDailies = (dailies ?? []).map((q: any) => q.id);
  const { data: completedTodayDailies } = await sb
    .from('quests')
    .select('id')
    .eq('completed', true)
    .eq('is_daily', true)
    .gte('completed_at', `${today}T00:00:00`);

  return {
    items,
    perfectDayProgress: {
      total: allDailies.length + ((completedTodayDailies?.length) ?? 0),
      done: (completedTodayDailies?.length) ?? 0,
    },
  };
};

// ── Challenges ───────────────────────────────────────────────
const startOfWeekISO = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};
const endOfWeekISO = () => {
  const d = new Date(startOfWeekISO());
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
};
const startOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};
const endOfMonthISO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
};

export const ensureChallenges = async () => {
  const sb = supabase();
  const weekStart = startOfWeekISO();
  const monthStart = startOfMonthISO();
  const seeds = [
    { key: 'weekly_5_quests', title: 'Hunt 5 quests', description: 'Complete any 5 quests this week.', period: 'weekly', target: 5, xpReward: 150, starts_on: weekStart, ends_on: endOfWeekISO() },
    { key: 'weekly_s_rank',    title: 'S-rank slayer',   description: 'Clear 2 S-rank quests this week.', period: 'weekly', target: 2, xpReward: 200, starts_on: weekStart, ends_on: endOfWeekISO() },
    { key: 'monthly_streak',   title: 'Month of Hunts',  description: 'Keep a 14-day quest streak this month.', period: 'monthly', target: 14, xpReward: 500, starts_on: monthStart, ends_on: endOfMonthISO() },
  ];
  for (const s of seeds) {
    await sb.from('quest_challenges').upsert(s, { onConflict: 'key,starts_on' });
  }
  return listChallenges();
};

export const listChallenges = async () => {
  const sb = supabase();
  const today = todayISO();
  const { data } = await sb
    .from('quest_challenges')
    .select('*')
    .lte('starts_on', today)
    .gte('ends_on', today);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    key: r.key,
    title: r.title,
    description: r.description,
    period: r.period,
    target: r.target,
    progress: r.progress,
    completed: r.completed,
    completedAt: r.completed_at,
    xpReward: r.xp_reward,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
  }));
};

const progressActiveChallenges = async (priority: Priority, isBoss: boolean) => {
  const sb = supabase();
  const today = todayISO();
  const { data: active } = await sb
    .from('quest_challenges')
    .select('*')
    .eq('completed', false)
    .lte('starts_on', today)
    .gte('ends_on', today);
  for (const ch of active ?? []) {
    let inc = 0;
    if (ch.key === 'weekly_5_quests') inc = 1;
    if (ch.key === 'weekly_s_rank' && priority === 'S') inc = 1;
    // monthly_streak handled by streak update directly; skip here
    if (inc === 0) continue;
    const newProgress = ch.progress + inc;
    const done = newProgress >= ch.target;
    await sb
      .from('quest_challenges')
      .update({ progress: newProgress, completed: done, completed_at: done ? new Date().toISOString() : null })
      .eq('id', ch.id);
    if (done) {
      await awardXp({ base: ch.xp_reward, module: 'quests', source: `quest-challenge:${ch.key}` });
    }
  }
};

// ── Insights (analytics) ─────────────────────────────────────
export const getInsights = async (params: { window?: number }) => {
  const sb = supabase();
  const window = params.window ?? 84; // 12 weeks
  const since = new Date(Date.now() - window * 24 * 60 * 60 * 1000).toISOString();

  const { data: completed } = await sb
    .from('quests')
    .select('id, priority, completed_at, xp_earned, estimated_minutes, actual_minutes, quest_tags(tag_id, tags(*))')
    .eq('completed', true)
    .gte('completed_at', since);
  const { data: allActive } = await sb
    .from('quests')
    .select('id, priority, created_at, completed, quest_tags(tag_id, tags(*))')
    .gte('created_at', since);

  // Heatmap: counts per date
  const heatmap: Record<string, number> = {};
  for (const q of completed ?? []) {
    const d = (q.completed_at ?? '').slice(0, 10);
    if (!d) continue;
    heatmap[d] = (heatmap[d] ?? 0) + 1;
  }

  // Priority mix
  const priorityMix: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
  for (const q of completed ?? []) priorityMix[q.priority] = (priorityMix[q.priority] ?? 0) + 1;

  // XP trend per day
  const xpTrend: Record<string, number> = {};
  for (const q of completed ?? []) {
    const d = (q.completed_at ?? '').slice(0, 10);
    if (!d) continue;
    xpTrend[d] = (xpTrend[d] ?? 0) + (q.xp_earned ?? 0);
  }

  // Completion rate by tag
  const created: Record<string, number> = {};
  const done: Record<string, number> = {};
  const tagNames: Record<string, { name: string; color: string }> = {};
  for (const q of allActive ?? []) {
    for (const qt of (q as any).quest_tags ?? []) {
      const t = qt.tags;
      if (!t) continue;
      tagNames[t.id] = { name: t.name, color: t.color };
      created[t.id] = (created[t.id] ?? 0) + 1;
      if ((q as any).completed) done[t.id] = (done[t.id] ?? 0) + 1;
    }
  }
  const tagRates = Object.keys(tagNames).map((id) => ({
    id,
    name: tagNames[id].name,
    color: tagNames[id].color,
    completed: done[id] ?? 0,
    created: created[id] ?? 0,
    rate: created[id] ? Math.round(((done[id] ?? 0) / created[id]) * 100) : 0,
  }));

  // Hour heatmap (day-of-week x hour-of-day)
  const hourMap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const q of completed ?? []) {
    if (!q.completed_at) continue;
    const d = new Date(q.completed_at);
    hourMap[d.getDay()][d.getHours()]++;
  }

  // Estimate accuracy points
  const accuracy = (completed ?? [])
    .filter((q) => q.estimated_minutes && q.actual_minutes)
    .map((q) => ({ estimated: q.estimated_minutes!, actual: q.actual_minutes! }));

  // Weekly review (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const week = (completed ?? []).filter((q) => q.completed_at && q.completed_at >= sevenDaysAgo);
  const weeklyReview = {
    totalCompleted: week.length,
    totalXp: week.reduce((acc, q) => acc + (q.xp_earned ?? 0), 0),
    sRankCompleted: week.filter((q) => q.priority === 'S').length,
    topTag: tagRates.sort((a, b) => b.completed - a.completed)[0] ?? null,
  };

  return {
    heatmap: Object.entries(heatmap).map(([date, value]) => ({ date, value })),
    priorityMix: Object.entries(priorityMix).map(([label, value]) => ({ label, value })),
    xpTrend: Object.entries(xpTrend).map(([date, value]) => ({ date, value })),
    tagRates,
    hourMap,
    accuracy,
    weeklyReview,
  };
};

// ── Tags ────────────────────────────────────────────────────
export const listTags = async () => {
  const sb = supabase();
  const { data } = await sb.from('tags').select('*').order('name');
  return { tags: (data ?? []).map(tagFromRow) };
};

export const createTag = async (body: { name: string; color?: string }) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('tags')
    .insert({ name: body.name, color: body.color ?? '#a78bfa' })
    .select()
    .single();
  if (error) throw error;
  return tagFromRow(data);
};

export const deleteTag = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('tags').delete().eq('id', id);
  if (error) throw error;
};

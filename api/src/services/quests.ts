import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { xpForTaskPriority } from '@/lib/xp';
import type { Priority } from '@/types';

const tagFromRow = (r: any) => ({ id: r.id, name: r.name, color: r.color });

const questFromRow = (r: any, tags: any[] = []) => ({
  id: r.id,
  title: r.title,
  priority: r.priority as Priority,
  isDaily: r.is_daily,
  completed: r.completed,
  completedAt: r.completed_at,
  dueDate: r.due_date,
  stars: r.stars,
  notes: r.notes,
  xpEarned: r.xp_earned,
  createdAt: r.created_at,
  tags: tags.map(tagFromRow),
});

const fetchQuestWithTags = async (id: string) => {
  const sb = supabase();
  const { data: q, error } = await sb.from('quests').select('*').eq('id', id).single();
  if (error) throw error;
  const { data: links } = await sb.from('quest_tags').select('tag_id, tags(*)').eq('quest_id', id);
  const tags = (links ?? []).map((l: any) => l.tags).filter(Boolean);
  return questFromRow(q, tags);
};

export const listQuests = async (params: {
  completed?: boolean;
  priority?: string;
  tagId?: string;
  daily?: boolean;
  page?: number;
  limit?: number;
}) => {
  const sb = supabase();
  const limit = params.limit ?? 50;
  const offset = ((params.page ?? 1) - 1) * limit;
  let q = sb
    .from('quests')
    .select('*, quest_tags(tag_id, tags(*))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (params.completed !== undefined) q = q.eq('completed', params.completed);
  if (params.priority) q = q.eq('priority', params.priority);
  if (params.daily !== undefined) q = q.eq('is_daily', params.daily);
  const { data, count, error } = await q;
  if (error) throw error;

  let quests = (data ?? []).map((row: any) =>
    questFromRow(
      row,
      (row.quest_tags ?? []).map((qt: any) => qt.tags).filter(Boolean),
    ),
  );

  if (params.tagId) {
    quests = quests.filter((q) => q.tags.some((t) => t.id === params.tagId));
  }

  return { quests, total: count ?? 0 };
};

interface QuestBody {
  title: string;
  priority?: Priority;
  isDaily?: boolean;
  dueDate?: string | null;
  tagIds?: string[];
  notes?: string;
}

export const createQuest = async (body: QuestBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('quests')
    .insert({
      title: body.title,
      priority: body.priority ?? 'C',
      is_daily: body.isDaily ?? false,
      due_date: body.dueDate ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (body.tagIds?.length) {
    await sb.from('quest_tags').insert(body.tagIds.map((tag_id) => ({ quest_id: data.id, tag_id })));
  }
  return fetchQuestWithTags(data.id);
};

export const updateQuest = async (id: string, body: Partial<QuestBody>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.isDaily !== undefined) update.is_daily = body.isDaily;
  if (body.dueDate !== undefined) update.due_date = body.dueDate;
  if (body.notes !== undefined) update.notes = body.notes;
  await sb.from('quests').update(update).eq('id', id);
  if (body.tagIds !== undefined) {
    await sb.from('quest_tags').delete().eq('quest_id', id);
    if (body.tagIds.length) {
      await sb.from('quest_tags').insert(body.tagIds.map((tag_id) => ({ quest_id: id, tag_id })));
    }
  }
  return fetchQuestWithTags(id);
};

export const completeQuest = async (id: string, stars?: number | null) => {
  const sb = supabase();
  const { data: q, error } = await sb.from('quests').select('*').eq('id', id).single();
  if (error) throw error;
  if (q.completed) {
    return { quest: await fetchQuestWithTags(id), xpEarned: 0, newTotalXp: 0, streakUpdated: false, streakCount: 0, badgesUnlocked: [] };
  }
  const base = xpForTaskPriority(q.priority as Priority);
  const { xpEarned, newTotalXp } = await awardXp({
    base,
    module: 'quests',
    source: `quest:${q.priority}`,
  });
  await sb
    .from('quests')
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      stars: stars ?? null,
      xp_earned: xpEarned,
    })
    .eq('id', id);
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

  return {
    quest: await fetchQuestWithTags(id),
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
  };
};

export const deleteQuest = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('quests').delete().eq('id', id);
  if (error) throw error;
};

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

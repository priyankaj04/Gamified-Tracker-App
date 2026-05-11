import { supabase } from './supabase';
import { awardXp, checkBadges } from './gamification';
import { todayISO } from '@/lib/date';

const fromRow = (r: any) => ({
  id: r.id,
  title: r.title,
  type: r.type as 'numeric' | 'habit' | 'reduction' | 'milestone',
  unit: r.unit,
  startValue: r.start_value != null ? Number(r.start_value) : null,
  targetValue: r.target_value != null ? Number(r.target_value) : null,
  currentValue: r.current_value != null ? Number(r.current_value) : null,
  startDate: r.start_date,
  deadline: r.deadline,
  completed: r.completed,
  completedAt: r.completed_at,
  archived: r.archived,
  xpReward: r.xp_reward,
});

const progressPct = (g: any) => {
  if (g.type === 'milestone') return g.completed ? 1 : 0;
  const start = Number(g.startValue ?? 0);
  const target = Number(g.targetValue ?? 0);
  const current = Number(g.currentValue ?? start);
  if (g.type === 'reduction') {
    if (start === target) return current <= target ? 1 : 0;
    return Math.max(0, Math.min(1, (start - current) / (start - target)));
  }
  // numeric or habit
  if (target === start) return current >= target ? 1 : 0;
  return Math.max(0, Math.min(1, (current - start) / (target - start)));
};

export const listGoals = async (params: { archived?: boolean }) => {
  const sb = supabase();
  let q = sb.from('spirit_goals').select('*').order('created_at', { ascending: false });
  if (params.archived) q = q.eq('archived', true);
  else q = q.eq('archived', false);
  const { data } = await q;
  return (data ?? []).map((r: any) => {
    const g = fromRow(r);
    return { ...g, progressPct: progressPct(g) };
  });
};

export const createGoal = async (body: {
  title: string;
  type: 'numeric' | 'habit' | 'reduction' | 'milestone';
  unit?: string;
  startValue?: number;
  targetValue?: number;
  currentValue?: number;
  startDate?: string;
  deadline?: string;
  xpReward?: number;
}) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('spirit_goals')
    .insert({
      title: body.title,
      type: body.type,
      unit: body.unit ?? null,
      start_value: body.startValue ?? null,
      target_value: body.targetValue ?? null,
      current_value: body.currentValue ?? body.startValue ?? null,
      start_date: body.startDate ?? todayISO(),
      deadline: body.deadline ?? null,
      xp_reward: body.xpReward ?? 200,
    })
    .select()
    .single();
  if (error) throw error;
  const g = fromRow(data);
  return { ...g, progressPct: progressPct(g) };
};

export const updateGoal = async (id: string, body: any) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.title !== undefined) upd.title = body.title;
  if (body.type !== undefined) upd.type = body.type;
  if (body.unit !== undefined) upd.unit = body.unit;
  if (body.startValue !== undefined) upd.start_value = body.startValue;
  if (body.targetValue !== undefined) upd.target_value = body.targetValue;
  if (body.currentValue !== undefined) upd.current_value = body.currentValue;
  if (body.deadline !== undefined) upd.deadline = body.deadline;
  if (body.xpReward !== undefined) upd.xp_reward = body.xpReward;
  const { data, error } = await sb.from('spirit_goals').update(upd).eq('id', id).select().single();
  if (error) throw error;
  const g = fromRow(data);
  return { ...g, progressPct: progressPct(g) };
};

export const deleteGoal = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('spirit_goals').delete().eq('id', id);
  if (error) throw error;
};

export const logProgress = async (id: string, body: { value: number; notes?: string; date?: string }) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  await sb.from('goal_logs').insert({
    goal_id: id,
    date,
    value: body.value,
    notes: body.notes ?? null,
  });
  // Update current_value on the goal
  const { data: goal } = await sb.from('spirit_goals').select('*').eq('id', id).maybeSingle();
  if (!goal) throw new Error('Goal not found');
  await sb.from('spirit_goals').update({ current_value: body.value }).eq('id', id);
  // Re-check progress
  const updated = { ...fromRow({ ...goal, current_value: body.value }) };
  const pct = progressPct(updated);
  let xpEarned = 0;
  let newTotalXp = 0;
  let completedNow = false;
  let badges: any[] = [];
  if (pct >= 1 && !goal.completed) {
    completedNow = true;
    await sb
      .from('spirit_goals')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);
    const award = await awardXp({ base: goal.xp_reward ?? 200, module: 'spirit', source: `goal:${goal.title}` });
    xpEarned = award.xpEarned;
    newTotalXp = award.newTotalXp;
    // Goal-hit badges: tie into chakra-control if it's body-fat related
    badges = await checkBadges({ goalHit: true });
  }
  return {
    goal: { ...updated, progressPct: pct, completed: completedNow || goal.completed },
    xpEarned,
    newTotalXp,
    completedNow,
    badgesUnlocked: badges,
  };
};

export const goalLogs = async (id: string) => {
  const sb = supabase();
  const { data } = await sb
    .from('goal_logs')
    .select('*')
    .eq('goal_id', id)
    .order('date', { ascending: true });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    goalId: r.goal_id,
    date: r.date,
    value: Number(r.value),
    notes: r.notes,
  }));
};

export const completeGoal = async (id: string) => {
  const sb = supabase();
  const { data: goal } = await sb.from('spirit_goals').select('*').eq('id', id).maybeSingle();
  if (!goal) throw new Error('Goal not found');
  if (goal.completed) {
    return { goal: fromRow(goal), xpEarned: 0, newTotalXp: 0, badgesUnlocked: [] };
  }
  await sb
    .from('spirit_goals')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', id);
  const award = await awardXp({ base: goal.xp_reward ?? 200, module: 'spirit', source: `goal:${goal.title}` });
  const badges = await checkBadges({ goalHit: true });
  return {
    goal: { ...fromRow({ ...goal, completed: true }), progressPct: 1 },
    xpEarned: award.xpEarned,
    newTotalXp: award.newTotalXp,
    badgesUnlocked: badges,
  };
};

export const archiveGoal = async (id: string) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('spirit_goals')
    .update({ archived: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

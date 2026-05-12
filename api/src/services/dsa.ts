import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';
import type {
  DsaDifficulty,
  DsaPlatform,
  DsaStatus,
  DsaTopic,
} from '@/types';

const xpFor = (d: DsaDifficulty) => (d === 'Easy' ? XP.DSA_EASY : d === 'Medium' ? XP.DSA_MEDIUM : XP.DSA_HARD);

const fromRow = (r: any) => ({
  id: r.id,
  title: r.title,
  platform: r.platform as DsaPlatform,
  difficulty: r.difficulty as DsaDifficulty,
  topic: r.topic as DsaTopic,
  status: r.status as DsaStatus,
  timeTakenMin: r.time_taken_min ?? null,
  date: r.date,
  problemUrl: r.problem_url ?? null,
  notes: r.notes ?? null,
  solutionNotes: r.solution_notes ?? null,
  xpEarned: r.xp_earned ?? 0,
  createdAt: r.created_at,
});

interface ListParams {
  difficulty?: string;
  topic?: string;
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const listProblems = async (p: ListParams) => {
  const sb = supabase();
  const limit = p.limit ?? 50;
  const offset = ((p.page ?? 1) - 1) * limit;
  let q = sb
    .from('dsa_problems')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (p.difficulty) q = q.eq('difficulty', p.difficulty);
  if (p.topic) q = q.eq('topic', p.topic);
  if (p.status) q = q.eq('status', p.status);
  if (p.platform) q = q.eq('platform', p.platform);
  if (p.from) q = q.gte('date', p.from);
  if (p.to) q = q.lte('date', p.to);
  const { data, error } = await q;
  if (error) throw error;
  return { problems: (data ?? []).map(fromRow) };
};

interface ProblemBody {
  title: string;
  platform?: DsaPlatform;
  difficulty: DsaDifficulty;
  topic?: DsaTopic;
  status?: DsaStatus;
  timeTakenMin?: number | null;
  date?: string;
  problemUrl?: string | null;
  notes?: string | null;
  solutionNotes?: string | null;
}

export const createProblem = async (body: ProblemBody) => {
  const sb = supabase();
  const { xpEarned, newTotalXp } = await awardXp({
    base: xpFor(body.difficulty),
    module: 'forge', // dsa rolls up under forge
    source: `dsa-${body.difficulty}`,
  });
  const { data, error } = await sb
    .from('dsa_problems')
    .insert({
      title: body.title,
      platform: body.platform ?? 'LeetCode',
      difficulty: body.difficulty,
      topic: body.topic ?? 'Arrays',
      status: body.status ?? 'Solved',
      time_taken_min: body.timeTakenMin ?? null,
      date: body.date ?? todayISO(),
      problem_url: body.problemUrl ?? null,
      notes: body.notes ?? null,
      solution_notes: body.solutionNotes ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;
  const streak = await updateStreak('dsa');
  const { count: solved } = await sb
    .from('dsa_problems')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Solved');
  const badges = await checkBadges({ dsaSolved: solved ?? 0 });
  return {
    problem: fromRow(data),
    xpEarned,
    newTotalXp,
    streakUpdated: true,
    streakCount: streak.count,
    badgesUnlocked: badges,
  };
};

export const updateProblem = async (id: string, body: Partial<ProblemBody>) => {
  const sb = supabase();
  const upd: any = {};
  if (body.title !== undefined) upd.title = body.title;
  if (body.platform !== undefined) upd.platform = body.platform;
  if (body.difficulty !== undefined) upd.difficulty = body.difficulty;
  if (body.topic !== undefined) upd.topic = body.topic;
  if (body.status !== undefined) upd.status = body.status;
  if (body.timeTakenMin !== undefined) upd.time_taken_min = body.timeTakenMin;
  if (body.date !== undefined) upd.date = body.date;
  if (body.problemUrl !== undefined) upd.problem_url = body.problemUrl;
  if (body.notes !== undefined) upd.notes = body.notes;
  if (body.solutionNotes !== undefined) upd.solution_notes = body.solutionNotes;
  await sb.from('dsa_problems').update(upd).eq('id', id);
  const { data } = await sb.from('dsa_problems').select('*').eq('id', id).single();
  return fromRow(data);
};

export const deleteProblem = async (id: string) => {
  const sb = supabase();
  await sb.from('dsa_problems').delete().eq('id', id);
};

export const dsaStats = async () => {
  const sb = supabase();
  const { data: all } = await sb.from('dsa_problems').select('*');
  const items = all ?? [];
  const solved = items.filter((i: any) => i.status === 'Solved');
  const byTopicMap: Record<string, { solved: number; attempted: number }> = {};
  items.forEach((i: any) => {
    if (!byTopicMap[i.topic]) byTopicMap[i.topic] = { solved: 0, attempted: 0 };
    if (i.status === 'Solved') byTopicMap[i.topic].solved += 1;
    else byTopicMap[i.topic].attempted += 1;
  });
  const byTopic = Object.entries(byTopicMap).map(([topic, v]) => ({
    topic,
    solved: v.solved,
    attempted: v.attempted,
  }));
  const byPlatformMap: Record<string, number> = {};
  items.forEach((i: any) => {
    byPlatformMap[i.platform] = (byPlatformMap[i.platform] ?? 0) + 1;
  });
  const byPlatform = Object.entries(byPlatformMap).map(([platform, count]) => ({ platform, count }));
  const { data: streak } = await sb.from('streaks').select('*').eq('module', 'dsa').maybeSingle();
  const weakTopics = byTopic.filter((t) => t.solved < 5 && t.attempted >= 2).map((t) => t.topic);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weeklyCount = items.filter(
    (i: any) => new Date(i.date) >= weekStart && i.status === 'Solved',
  ).length;
  const { data: settings } = await sb.from('forge_settings').select('weekly_dsa_goal').limit(1).maybeSingle();
  const weeklyGoal = settings?.weekly_dsa_goal ?? 5;
  const timesSolved = solved.filter((i: any) => i.time_taken_min).map((i: any) => i.time_taken_min);
  const avgTimeToSolve = timesSolved.length
    ? Math.round(timesSolved.reduce((a: number, b: number) => a + b, 0) / timesSolved.length)
    : 0;
  return {
    totalSolved: solved.length,
    easy: solved.filter((i: any) => i.difficulty === 'Easy').length,
    medium: solved.filter((i: any) => i.difficulty === 'Medium').length,
    hard: solved.filter((i: any) => i.difficulty === 'Hard').length,
    byTopic,
    byPlatform,
    currentStreak: streak?.count ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    weeklyGoalProgress: { current: weeklyCount, goal: weeklyGoal },
    avgTimeToSolve,
    weakTopics,
  };
};

// 90-day activity grid for DSA
export const dsaGrid = async () => {
  const sb = supabase();
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 89);
  const fromISO = from.toISOString().split('T')[0];
  const { data } = await sb.from('dsa_problems').select('date, status').gte('date', fromISO);
  const byDate: Record<string, number> = {};
  (data ?? []).forEach((d: any) => {
    if (d.status === 'Solved') byDate[d.date] = (byDate[d.date] ?? 0) + 1;
  });
  const grid: { date: string; value: number; count: number }[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    const k = d.toISOString().split('T')[0];
    const n = byDate[k] ?? 0;
    let v = 0;
    if (n >= 5) v = 4;
    else if (n >= 3) v = 3;
    else if (n >= 2) v = 2;
    else if (n >= 1) v = 1;
    grid.push({ date: k, value: v, count: n });
  }
  return { grid };
};

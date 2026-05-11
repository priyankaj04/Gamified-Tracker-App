import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';

const habitFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  frequency: r.frequency as 'daily' | 'weekdays' | 'custom',
  customDays: r.custom_days,
  routineSlot: r.routine_slot as 'morning' | 'evening' | 'anytime',
  xpPerCompletion: r.xp_per_completion,
  isActive: r.is_active,
  orderIndex: r.order_index,
});

const isRelevantForDay = (h: any, dayOfWeek: number) => {
  if (h.frequency === 'daily') return true;
  if (h.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (h.frequency === 'custom') return (h.custom_days ?? []).includes(dayOfWeek);
  return true;
};

export const listHabits = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('habits')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  const today = todayISO();
  const { data: logs } = await sb
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('date', today);
  const doneMap = new Map((logs ?? []).map((l: any) => [l.habit_id, l.completed]));
  return (data ?? []).map((h: any) => ({
    ...habitFromRow(h),
    completedToday: !!doneMap.get(h.id),
  }));
};

export const todayHabits = async () => {
  const sb = supabase();
  const today = todayISO();
  const dow = new Date(today + 'T00:00:00Z').getUTCDay(); // 0..6
  const { data } = await sb
    .from('habits')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  const { data: logs } = await sb
    .from('habit_logs')
    .select('habit_id, completed')
    .eq('date', today);
  const doneMap = new Map((logs ?? []).map((l: any) => [l.habit_id, l.completed]));
  const relevant = (data ?? []).filter((h: any) => isRelevantForDay(h, dow));
  return relevant.map((h: any) => ({
    ...habitFromRow(h),
    completedToday: !!doneMap.get(h.id),
  }));
};

export const createHabit = async (body: {
  name: string;
  emoji?: string;
  frequency?: 'daily' | 'weekdays' | 'custom';
  customDays?: number[];
  routineSlot?: 'morning' | 'evening' | 'anytime';
  xpPerCompletion?: number;
}) => {
  const sb = supabase();
  const { data: existing } = await sb
    .from('habits')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const orderIndex = (existing?.order_index ?? -1) + 1;
  const { data, error } = await sb
    .from('habits')
    .insert({
      name: body.name,
      emoji: body.emoji ?? '⭐',
      frequency: body.frequency ?? 'daily',
      custom_days: body.customDays ?? null,
      routine_slot: body.routineSlot ?? 'anytime',
      xp_per_completion: body.xpPerCompletion ?? 10,
      order_index: orderIndex,
    })
    .select()
    .single();
  if (error) throw error;
  return habitFromRow(data);
};

export const updateHabit = async (id: string, body: any) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.name !== undefined) upd.name = body.name;
  if (body.emoji !== undefined) upd.emoji = body.emoji;
  if (body.frequency !== undefined) upd.frequency = body.frequency;
  if (body.customDays !== undefined) upd.custom_days = body.customDays;
  if (body.routineSlot !== undefined) upd.routine_slot = body.routineSlot;
  if (body.xpPerCompletion !== undefined) upd.xp_per_completion = body.xpPerCompletion;
  const { data, error } = await sb.from('habits').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return habitFromRow(data);
};

export const deleteHabit = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('habits').update({ is_active: false }).eq('id', id);
  if (error) throw error;
};

export const reorderHabits = async (orderedIds: string[]) => {
  const sb = supabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await sb.from('habits').update({ order_index: i }).eq('id', orderedIds[i]);
  }
  return { ok: true };
};

export const completeHabit = async (id: string) => {
  const sb = supabase();
  const today = todayISO();
  const { data: habit } = await sb.from('habits').select('*').eq('id', id).maybeSingle();
  if (!habit) throw new Error('Habit not found');
  const { xpEarned, newTotalXp } = await awardXp({
    base: habit.xp_per_completion,
    module: 'spirit',
    source: `habit:${habit.name}`,
  });
  await sb
    .from('habit_logs')
    .upsert(
      { habit_id: id, date: today, completed: true, xp_earned: xpEarned },
      { onConflict: 'habit_id,date' },
    );

  // Bundle check: if every habit in any bundle is done today → award bonus
  const { data: bundles } = await sb.from('habit_bundles').select('*');
  let bundleXp = 0;
  let bundleHit: { id: string; name: string; bonusXp: number } | null = null;
  for (const bundle of bundles ?? []) {
    const { data: members } = await sb
      .from('habit_bundle_members')
      .select('habit_id')
      .eq('bundle_id', bundle.id);
    const memberIds = (members ?? []).map((m: any) => m.habit_id);
    if (memberIds.length === 0) continue;
    const { data: doneLogs } = await sb
      .from('habit_logs')
      .select('habit_id')
      .in('habit_id', memberIds)
      .eq('date', today)
      .eq('completed', true);
    if ((doneLogs ?? []).length === memberIds.length) {
      // already awarded today? track via a sentinel meal log... we'll simply award each time the bundle completes
      // To avoid double-award, only award if the just-completed habit is a member.
      if (memberIds.includes(id)) {
        const award = await awardXp({ base: bundle.bonus_xp, module: 'spirit', source: `bundle:${bundle.name}` });
        bundleXp += award.xpEarned;
        bundleHit = { id: bundle.id, name: bundle.name, bonusXp: award.xpEarned };
      }
    }
  }

  // Compute "all habits today complete" streak for habit-stack badge
  const habitsAllDoneStreak = await computeHabitStackStreak();
  if (habitsAllDoneStreak > 0) await updateStreak('spirit');
  const badges = await checkBadges({ habitsAllDoneStreak });

  return {
    xpEarned: xpEarned + bundleXp,
    newTotalXp: newTotalXp + bundleXp,
    bundleHit,
    badgesUnlocked: badges,
  };
};

export const uncompleteHabit = async (id: string) => {
  const sb = supabase();
  const today = todayISO();
  const { error } = await sb.from('habit_logs').delete().eq('habit_id', id).eq('date', today);
  if (error) throw error;
  return { ok: true };
};

export const habitHistory = async (id: string) => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  const fromIso = from.toISOString().slice(0, 10);
  const { data } = await sb
    .from('habit_logs')
    .select('date, completed')
    .eq('habit_id', id)
    .gte('date', fromIso);
  const map = new Map((data ?? []).map((r: any) => [r.date, r.completed]));
  const cells: { date: string; completed: boolean }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, completed: !!map.get(iso) });
  }
  return cells;
};

export const habitStreak = async (id: string) => {
  const sb = supabase();
  const { data } = await sb
    .from('habit_logs')
    .select('date')
    .eq('habit_id', id)
    .eq('completed', true)
    .order('date', { ascending: false });
  if (!data || data.length === 0) return { current: 0, longest: 0 };
  const dates = data.map((r: any) => r.date);
  let current = 0;
  let cursor = new Date(todayISO() + 'T00:00:00Z');
  for (const d of dates) {
    const dt = new Date(d + 'T00:00:00Z');
    const diff = (cursor.getTime() - dt.getTime()) / 86400000;
    if (diff === 0 || diff === 1) {
      current++;
      cursor = new Date(dt.getTime() - 86400000);
    } else {
      break;
    }
  }
  // longest streak (scan all)
  let longest = 0;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00Z');
    const curr = new Date(dates[i] + 'T00:00:00Z');
    if ((prev.getTime() - curr.getTime()) / 86400000 === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);
  return { current, longest };
};

const computeHabitStackStreak = async () => {
  const sb = supabase();
  const { data: habits } = await sb.from('habits').select('id, frequency, custom_days').eq('is_active', true);
  if (!habits || habits.length === 0) return 0;
  const { data: logs } = await sb
    .from('habit_logs')
    .select('habit_id, date')
    .eq('completed', true);
  const byDate = new Map<string, Set<string>>();
  (logs ?? []).forEach((l: any) => {
    if (!byDate.has(l.date)) byDate.set(l.date, new Set());
    byDate.get(l.date)!.add(l.habit_id);
  });
  let streak = 0;
  let cursor = new Date();
  for (let i = 0; i < 90; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    const dow = cursor.getUTCDay();
    const relevant = habits.filter((h: any) => isRelevantForDay(h, dow));
    if (relevant.length === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const done = byDate.get(iso) ?? new Set();
    const allDone = relevant.every((h: any) => done.has(h.id));
    if (allDone) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// ─── Bundles ────────────────────────────────────────────────
export const listBundles = async () => {
  const sb = supabase();
  const { data: bundles } = await sb
    .from('habit_bundles')
    .select('*')
    .order('created_at', { ascending: false });
  const out = [];
  for (const b of bundles ?? []) {
    const { data: members } = await sb
      .from('habit_bundle_members')
      .select('habit_id')
      .eq('bundle_id', b.id);
    out.push({
      id: b.id,
      name: b.name,
      bonusXp: b.bonus_xp,
      habitIds: (members ?? []).map((m: any) => m.habit_id),
    });
  }
  return out;
};

export const createBundle = async (body: { name: string; bonusXp?: number; habitIds: string[] }) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('habit_bundles')
    .insert({ name: body.name, bonus_xp: body.bonusXp ?? 50 })
    .select()
    .single();
  if (error) throw error;
  if (body.habitIds.length) {
    await sb
      .from('habit_bundle_members')
      .insert(body.habitIds.map((habitId) => ({ bundle_id: data.id, habit_id: habitId })));
  }
  return { id: data.id, name: data.name, bonusXp: data.bonus_xp, habitIds: body.habitIds };
};

export const deleteBundle = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('habit_bundles').delete().eq('id', id);
  if (error) throw error;
};

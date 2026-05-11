import { supabase } from './supabase';
import { streakMultiplier } from '@/lib/xp';
import { getLevelFromXP, getXPProgress } from '@/lib/levels';
import { BADGES, evaluateBadges, BadgeCheckContext } from '@/lib/badges';
import { todayISO, previousISO } from '@/lib/date';
import type { Module } from '@/types';

interface AwardXpOptions {
  base: number;
  module?: Module;
  source: string;
}

interface AwardXpResult {
  xpEarned: number;
  newTotalXp: number;
}

const ensureGameStateRow = async () => {
  const sb = supabase();
  const { data } = await sb.from('game_state').select('*').limit(1).maybeSingle();
  if (data) return data;
  const { data: inserted, error } = await sb
    .from('game_state')
    .insert({ total_xp: 0, level: 1, level_title: 'Academy Student' })
    .select()
    .single();
  if (error) throw error;
  return inserted;
};

export const getGameState = async () => {
  const sb = supabase();
  const row = await ensureGameStateRow();
  const { data: streaks } = await sb.from('streaks').select('*');

  const streakMap: Record<string, any> = {};
  ['dojo', 'forge', 'spirit', 'vault', 'quests'].forEach((m) => {
    const s = streaks?.find((x) => x.module === m);
    streakMap[m] = {
      count: s?.count ?? 0,
      longestStreak: s?.longest_streak ?? 0,
      lastActivityDate: s?.last_activity_date ?? null,
    };
  });

  const progress = getXPProgress(row.total_xp);
  return {
    totalXp: row.total_xp,
    level: progress.current.level,
    levelTitle: progress.current.title,
    xpToNextLevel: progress.next?.xpRequired ?? row.total_xp,
    xpProgress: progress.pct,
    streaks: streakMap,
  };
};

export const awardXp = async ({ base, module, source }: AwardXpOptions): Promise<AwardXpResult> => {
  const sb = supabase();
  const row = await ensureGameStateRow();

  let multiplier = 1;
  if (module) {
    const { data: streak } = await sb.from('streaks').select('*').eq('module', module).maybeSingle();
    multiplier = streakMultiplier(streak?.count ?? 0);
  }
  const xpEarned = Math.round(base * multiplier);
  const newTotal = row.total_xp + xpEarned;
  const level = getLevelFromXP(newTotal);

  await sb
    .from('game_state')
    .update({ total_xp: newTotal, level: level.level, level_title: level.title, updated_at: new Date().toISOString() })
    .eq('id', row.id);

  console.log(`[XP] +${xpEarned} (${source}) → ${newTotal}`);
  return { xpEarned, newTotalXp: newTotal };
};

export const updateStreak = async (module: Module): Promise<{ count: number; justBroken: boolean; longestStreak: number }> => {
  const sb = supabase();
  const { data: existing } = await sb.from('streaks').select('*').eq('module', module).maybeSingle();
  const today = todayISO();
  const last: string | null = existing?.last_activity_date ?? null;
  const yesterday = previousISO(today);
  const currentCount = existing?.count ?? 0;
  const longest = existing?.longest_streak ?? 0;

  if (last === today) {
    return { count: currentCount, justBroken: false, longestStreak: longest };
  }

  let newCount = 1;
  let justBroken = false;
  if (last === yesterday) {
    newCount = currentCount + 1;
  } else {
    justBroken = currentCount > 1;
  }
  const newLongest = Math.max(longest, newCount);

  if (existing) {
    await sb
      .from('streaks')
      .update({ count: newCount, last_activity_date: today, longest_streak: newLongest })
      .eq('id', existing.id);
  } else {
    await sb
      .from('streaks')
      .insert({ module, count: newCount, last_activity_date: today, longest_streak: newLongest });
  }
  return { count: newCount, justBroken, longestStreak: newLongest };
};

export const checkBadges = async (ctx: BadgeCheckContext) => {
  const sb = supabase();
  const targets = evaluateBadges(ctx);
  if (targets.length === 0) return [];

  const { data: existing } = await sb.from('user_badges').select('badge_id').in('badge_id', targets);
  const already = new Set((existing ?? []).map((r) => r.badge_id));
  const newOnes = targets.filter((id) => !already.has(id));
  if (newOnes.length === 0) return [];

  const rows = newOnes.map((id) => {
    const def = BADGES.find((b) => b.id === id)!;
    return { badge_id: id, xp_awarded: def.xpReward };
  });
  await sb.from('user_badges').insert(rows);

  // award XP for each
  for (const r of rows) {
    await awardXp({ base: r.xp_awarded, source: `badge:${r.badge_id}` });
  }
  return rows.map((r) => {
    const def = BADGES.find((b) => b.id === r.badge_id)!;
    return { id: def.id, name: def.name, xpReward: def.xpReward, rarity: def.rarity };
  });
};

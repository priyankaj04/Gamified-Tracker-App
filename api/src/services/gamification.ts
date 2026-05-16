import { supabase } from './supabase';
import { streakMultiplier } from '@/lib/xp';
import { getLevelFromXP, getXPProgress } from '@/lib/levels';
import { BADGES, evaluateBadges, BadgeCheckContext } from '@/lib/badges';
import { todayISO, previousISO } from '@/lib/date';
import type { Module } from '@/types';

// Modules that are active-logging trackers (penalize if user is inconsistent).
// Passive trackers (fasting, cycle, sleep) are excluded — they're observation,
// not action, and penalizing them would feel unfair.
const PENALTY_MODULES = ['dojo', 'forge', 'spirit', 'vault', 'quests'] as const;
type PenaltyModule = (typeof PENALTY_MODULES)[number];

// Maps each penalty-eligible module to its canonical activity table + date column.
// Used by getLoggedDaysInWindow to count distinct activity dates.
const ACTIVITY_SOURCE: Record<PenaltyModule, { table: string; dateCol: string; filter?: Record<string, any> }> = {
  dojo: { table: 'workouts', dateCol: 'date' },
  forge: { table: 'coding_sessions', dateCol: 'date' },
  spirit: { table: 'habit_logs', dateCol: 'date', filter: { completed: true } },
  vault: { table: 'transactions', dateCol: 'date' },
  quests: { table: 'quests', dateCol: 'completed_at', filter: { completed: true } },
};

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
  // Lazy fallback: catch up on any missed penalty sweeps before reporting state.
  // Idempotent — no-op if already swept today, or if penalties are disabled.
  try {
    await processPendingPenalties();
  } catch (err) {
    console.error('[PENALTY] lazy sweep failed', err);
  }

  const row = await ensureGameStateRow();
  const { data: streaks } = await sb.from('streaks').select('*');

  const streakMap: Record<string, any> = {};
  ['dojo', 'forge', 'spirit', 'vault', 'quests', 'dsa', 'learning'].forEach((m) => {
    const s = streaks?.find((x) => x.module === m);
    streakMap[m] = {
      count: s?.count ?? 0,
      longestStreak: s?.longest_streak ?? 0,
      lastActivityDate: s?.last_activity_date ?? null,
    };
  });

  const progress = getXPProgress(row.total_xp);
  const recentPenalties = await getRecentPenalties(24);
  return {
    totalXp: row.total_xp,
    level: progress.current.level,
    levelTitle: progress.current.title,
    xpToNextLevel: progress.next?.xpRequired ?? row.total_xp,
    xpProgress: progress.pct,
    streaks: streakMap,
    recentPenalties,
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

// ─── Penalty system ──────────────────────────────────────────
// Returns count of distinct days in the trailing `days`-day window (inclusive of today)
// on which the user logged at least one row in the module's activity table.
export const getLoggedDaysInWindow = async (
  module: PenaltyModule,
  days = 7,
): Promise<number> => {
  const sb = supabase();
  const src = ACTIVITY_SOURCE[module];
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const sinceISO = since.toISOString().split('T')[0];

  let q = sb.from(src.table).select(src.dateCol).gte(src.dateCol, sinceISO);
  if (src.filter) {
    for (const [k, v] of Object.entries(src.filter)) q = q.eq(k, v);
  }
  const { data } = await q;
  if (!data) return 0;
  // Normalize to YYYY-MM-DD whether the column is DATE or TIMESTAMPTZ.
  const dates = new Set<string>();
  for (const row of data as any[]) {
    const raw = row[src.dateCol];
    if (!raw) continue;
    const iso = typeof raw === 'string' ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
    dates.add(iso);
  }
  return dates.size;
};

// Mirror of awardXp. Subtracts XP, clamped at the current level's floor so users
// can't level down. Records the deduction in xp_penalties.
export const deductXp = async (
  amount: number,
  meta: {
    module: PenaltyModule;
    daysLogged: number;
    shortfall: number;
    reason?: string;
  },
): Promise<{ xpLost: number; newTotalXp: number }> => {
  const sb = supabase();
  const row = await ensureGameStateRow();
  const currentLevel = getLevelFromXP(row.total_xp);
  // Clamp so we never drop below the floor of the user's current level.
  const floor = currentLevel.xpRequired;
  const newTotal = Math.max(floor, row.total_xp - amount);
  const xpLost = row.total_xp - newTotal;
  const nextLevel = getLevelFromXP(newTotal);

  await sb
    .from('game_state')
    .update({
      total_xp: newTotal,
      level: nextLevel.level,
      level_title: nextLevel.title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  await sb.from('xp_penalties').insert({
    module: meta.module,
    days_logged: meta.daysLogged,
    shortfall: meta.shortfall,
    level_at_time: currentLevel.level,
    xp_lost: xpLost,
    reason: meta.reason ?? 'weekly_consistency',
  });

  console.log(
    `[PENALTY] -${xpLost} (${meta.module}, ${meta.daysLogged}/7, L${currentLevel.level}) → ${newTotal}`,
  );
  return { xpLost, newTotalXp: newTotal };
};

// Rule: in any rolling 7-day window, the user must log on at least 5 days per
// active module. shortfall = max(0, 5 - days_logged). Penalty scales with level.
// Idempotent: skips a module if last_penalty_date is within the last 7 days.
export interface PenaltyApplied {
  module: PenaltyModule;
  daysLogged: number;
  shortfall: number;
  xpLost: number;
  levelAtTime: number;
}

export const processPendingPenalties = async (options?: {
  dryRun?: boolean;
}): Promise<PenaltyApplied[]> => {
  const sb = supabase();
  // Feature flag — only run for users who opted in.
  const { data: settings } = await sb.from('user_settings').select('penalties_enabled').limit(1).maybeSingle();
  if (!settings?.penalties_enabled) return [];

  const today = todayISO();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  const cutoffISO = sevenDaysAgo.toISOString().split('T')[0];

  const { data: gameRow } = await sb.from('game_state').select('total_xp').limit(1).maybeSingle();
  const currentLevel = getLevelFromXP(gameRow?.total_xp ?? 0);

  const applied: PenaltyApplied[] = [];
  for (const module of PENALTY_MODULES) {
    const { data: streak } = await sb.from('streaks').select('*').eq('module', module).maybeSingle();
    // Idempotency: don't penalize twice within the same 7-day window.
    if (streak?.last_penalty_date && streak.last_penalty_date > cutoffISO) continue;
    // Vacation mode.
    if (streak?.penalty_paused_until && streak.penalty_paused_until >= today) continue;

    const daysLogged = await getLoggedDaysInWindow(module, 7);
    const shortfall = Math.max(0, 5 - daysLogged);
    if (shortfall === 0) continue;

    const baseXp = 25;
    const lossMultiplier = 1 + (currentLevel.level - 1) * 0.15;
    const penalty = Math.floor(currentLevel.level * baseXp * lossMultiplier * shortfall);

    if (options?.dryRun) {
      applied.push({
        module,
        daysLogged,
        shortfall,
        xpLost: penalty,
        levelAtTime: currentLevel.level,
      });
      continue;
    }

    const { xpLost } = await deductXp(penalty, { module, daysLogged, shortfall });
    // Mark this module penalized so we don't double-charge during the next sweep
    // before the user has had 7 days to recover.
    if (streak) {
      await sb.from('streaks').update({ last_penalty_date: today, count: 0 }).eq('id', streak.id);
    } else {
      await sb.from('streaks').insert({ module, count: 0, longest_streak: 0, last_penalty_date: today });
    }
    applied.push({
      module,
      daysLogged,
      shortfall,
      xpLost,
      levelAtTime: currentLevel.level,
    });
  }
  return applied;
};

// Returns penalties applied in the last `hours` hours (default 24) so the FE can
// surface a banner / fire a local notification on next app open.
export const getRecentPenalties = async (hours = 24) => {
  const sb = supabase();
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const { data } = await sb
    .from('xp_penalties')
    .select('*')
    .gte('applied_at', since)
    .order('applied_at', { ascending: false })
    .limit(20);
  return (data ?? []).map((r) => ({
    id: r.id,
    module: r.module,
    daysLogged: r.days_logged,
    shortfall: r.shortfall,
    levelAtTime: r.level_at_time,
    xpLost: r.xp_lost,
    appliedAt: r.applied_at,
    reason: r.reason,
  }));
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

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import { supabase } from '@/services/supabase';
import { awardXp } from '@/services/gamification';
import { todayISO } from '@/lib/date';
import type { Module } from '@/types';

export const challengesRouter = Router();

interface ChallengeTemplate {
  key: string;
  title: string;
  description: string;
  module: Module | 'global';
  target: number;
  xpReward: number;
}

// Major daily tasks — these are shown EVERY day, not randomized. They map
// to the user's most important habits across modules.
const POOL: ChallengeTemplate[] = [
  { key: 'log-workout',     title: 'Train Hard',          description: 'Log a workout today',                  module: 'dojo',   target: 1,  xpReward: 100 },
  { key: 'priority-quests', title: "Today's Priorities",  description: 'Finish a high-priority quest (S or A)', module: 'quests', target: 1,  xpReward: 150 },
  { key: 'track-tx',        title: 'Log Your Spendings',  description: 'Log at least one transaction',         module: 'vault',  target: 1,  xpReward: 80  },
  { key: 'fasting-today',   title: 'Fast & Focus',        description: 'Complete a fasting session',           module: 'spirit', target: 1,  xpReward: 100 },
  { key: 'deep-work',       title: 'Deep Work',           description: 'Code for 60+ min today',               module: 'forge',  target: 60, xpReward: 150 },
];

const pickToday = (): ChallengeTemplate[] => POOL;

const endOfDayISO = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

// Compute the live progress for a given challenge based on today's activity
// across the relevant module table. Returns 0 if no data / unknown key.
const computeLiveProgress = async (
  key: string,
  date: string,
): Promise<number> => {
  const sb = supabase();
  switch (key) {
    case 'log-workout': {
      const { count } = await sb
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('date', date);
      return count ?? 0;
    }
    case 'priority-quests': {
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      const { count } = await sb
        .from('quests')
        .select('id', { count: 'exact', head: true })
        .eq('completed', true)
        .in('priority', ['S', 'A'])
        .gte('completed_at', start)
        .lte('completed_at', end);
      return count ?? 0;
    }
    case 'track-tx': {
      const { count } = await sb
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('date', date);
      return count ?? 0;
    }
    case 'fasting-today': {
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      const { count } = await sb
        .from('fasting_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('end_time', start)
        .lte('end_time', end);
      return count ?? 0;
    }
    case 'deep-work': {
      const { data } = await sb
        .from('coding_sessions')
        .select('duration_minutes')
        .eq('date', date);
      const total = (data ?? []).reduce(
        (s: number, r: { duration_minutes: number | null }) =>
          s + (r.duration_minutes ?? 0),
        0,
      );
      return total;
    }
    case 'all-modules': {
      // Count how many modules saw at least one activity today.
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      const [w, c, we, tx, q] = await Promise.all([
        (async () => {
          const { count } = await sb
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('date', date);
          return (count ?? 0) > 0 ? 1 : 0;
        })(),
        (async () => {
          const { count } = await sb
            .from('coding_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('date', date);
          return (count ?? 0) > 0 ? 1 : 0;
        })(),
        (async () => {
          const { count } = await sb
            .from('weight_entries')
            .select('id', { count: 'exact', head: true })
            .eq('date', date);
          return (count ?? 0) > 0 ? 1 : 0;
        })(),
        (async () => {
          const { count } = await sb
            .from('transactions')
            .select('id', { count: 'exact', head: true })
            .eq('date', date);
          return (count ?? 0) > 0 ? 1 : 0;
        })(),
        (async () => {
          const { count } = await sb
            .from('quests')
            .select('id', { count: 'exact', head: true })
            .eq('completed', true)
            .gte('completed_at', start)
            .lte('completed_at', end);
          return (count ?? 0) > 0 ? 1 : 0;
        })(),
      ]);
      return w + c + we + tx + q;
    }
    default:
      return 0;
  }
};

challengesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sb = supabase();
    const today = todayISO();
    const { data: existing } = await sb.from('daily_challenges').select('*').eq('date', today);
    let rows = existing ?? [];

    // If today's stored rows don't match the current pool exactly, clear and
    // reseed. This lets us roll out new challenge sets without waiting until
    // the next day, while preserving same-day rows when nothing changed.
    const poolKeys = new Set(POOL.map((p) => p.key));
    const storedKeys = new Set(rows.map((r) => r.challenge_key));
    const needsReseed =
      rows.length !== POOL.length ||
      [...poolKeys].some((k) => !storedKeys.has(k)) ||
      [...storedKeys].some((k) => !poolKeys.has(k));

    if (needsReseed) {
      if (rows.length > 0) {
        await sb.from('daily_challenges').delete().eq('date', today);
      }
      const picks = pickToday();
      const { data: inserted } = await sb
        .from('daily_challenges')
        .insert(
          picks.map((p) => ({
            date: today,
            challenge_key: p.key,
            target: p.target,
            xp_reward: p.xpReward,
          })),
        )
        .select();
      rows = inserted ?? [];
    }

    // Live-recompute progress for each row, persist deltas, and award XP on
    // first transition to complete. This keeps challenge state in sync with
    // real activity without needing module write paths to call this API.
    const challenges = await Promise.all(
      rows.map(async (r) => {
        const tpl = POOL.find((p) => p.key === r.challenge_key);
        const target: number = r.target;
        const rawProgress = await computeLiveProgress(r.challenge_key, today);
        const progress = Math.min(target, rawProgress);
        const completed = progress >= target;
        const justCompleted = completed && !r.completed;

        if (progress !== r.progress || completed !== r.completed) {
          await sb
            .from('daily_challenges')
            .update({ progress, completed })
            .eq('id', r.id);
        }

        if (justCompleted) {
          await awardXp({
            base: r.xp_reward,
            source: `challenge:${r.challenge_key}`,
          });
        }

        return {
          id: r.id,
          challengeKey: r.challenge_key,
          title: tpl?.title ?? r.challenge_key,
          description: tpl?.description ?? '',
          module: tpl?.module ?? 'global',
          progress,
          target,
          completed,
          xpReward: r.xp_reward,
          expiresAt: endOfDayISO(),
        };
      }),
    );

    ok(res, { challenges });
  }),
);

// Retained for manual increments (rarely used now that GET auto-computes).
challengesRouter.patch(
  '/:id/progress',
  validateBody(z.object({ increment: z.number().int().default(1) })),
  asyncHandler(async (req, res) => {
    const sb = supabase();
    const { data: row, error } = await sb.from('daily_challenges').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    if (row.completed) {
      return ok(res, { challenge: row, justCompleted: false, xpEarned: 0 });
    }
    const next = Math.min(row.target, row.progress + (req.body.increment ?? 1));
    const completed = next >= row.target;
    let xpEarned = 0;
    if (completed) {
      const award = await awardXp({ base: row.xp_reward, source: `challenge:${row.challenge_key}` });
      xpEarned = award.xpEarned;
    }
    const { data: updated } = await sb
      .from('daily_challenges')
      .update({ progress: next, completed })
      .eq('id', row.id)
      .select()
      .single();
    ok(res, { challenge: updated, justCompleted: completed, xpEarned });
  }),
);

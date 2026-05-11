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

// Pool of daily challenges — we deterministically pick 3 based on date
const POOL: ChallengeTemplate[] = [
  { key: 'log-workout',  title: 'Train Hard',     description: 'Log a workout today',           module: 'dojo',   target: 1, xpReward: 100 },
  { key: 'pr-today',     title: 'Push the limit', description: 'Set a personal record today',   module: 'dojo',   target: 1, xpReward: 150 },
  { key: 'code-session', title: 'In The Zone',    description: 'Log a 30+ min coding session',  module: 'forge',  target: 30, xpReward: 100 },
  { key: 'ship-feature', title: 'Ship It',        description: 'Complete a milestone',          module: 'forge',  target: 1, xpReward: 150 },
  { key: 'weigh-in',     title: 'Inner Chakra',   description: 'Log a weight entry',            module: 'spirit', target: 1, xpReward: 80  },
  { key: 'track-tx',     title: 'Mind the Money', description: 'Log 3 transactions',            module: 'vault',  target: 3, xpReward: 80  },
  { key: 'quest-three',  title: 'Hunter Mode',    description: 'Complete 3 quests',             module: 'quests', target: 3, xpReward: 120 },
  { key: 'all-modules',  title: 'Five Paths',     description: 'Use all 5 modules today',       module: 'global', target: 5, xpReward: 200 },
];

const pickToday = (): ChallengeTemplate[] => {
  const today = todayISO();
  const seed = today.split('-').reduce((s, p) => s + Number(p), 0);
  const picked: ChallengeTemplate[] = [];
  const used = new Set<number>();
  let i = seed;
  while (picked.length < 3) {
    const idx = i % POOL.length;
    if (!used.has(idx)) {
      used.add(idx);
      picked.push(POOL[idx]);
    }
    i++;
  }
  return picked;
};

const endOfDayISO = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

challengesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sb = supabase();
    const today = todayISO();
    const { data: existing } = await sb.from('daily_challenges').select('*').eq('date', today);
    let rows = existing ?? [];
    if (rows.length === 0) {
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
    const challenges = rows.map((r) => {
      const tpl = POOL.find((p) => p.key === r.challenge_key);
      return {
        id: r.id,
        challengeKey: r.challenge_key,
        title: tpl?.title ?? r.challenge_key,
        description: tpl?.description ?? '',
        module: tpl?.module ?? 'global',
        progress: r.progress,
        target: r.target,
        completed: r.completed,
        xpReward: r.xp_reward,
        expiresAt: endOfDayISO(),
      };
    });
    ok(res, { challenges });
  }),
);

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

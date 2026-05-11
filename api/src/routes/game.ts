import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, fail } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import { awardXp, getGameState, updateStreak } from '@/services/gamification';
import type { Module } from '@/types';

export const gameRouter = Router();

gameRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const state = await getGameState();
    ok(res, state);
  }),
);

const xpSchema = z.object({
  amount: z.number().int(),
  source: z.string().min(1).default('manual'),
});

gameRouter.patch(
  '/xp',
  validateBody(xpSchema),
  asyncHandler(async (req, res) => {
    const { amount, source } = req.body as z.infer<typeof xpSchema>;
    const result = await awardXp({ base: amount, source });
    ok(res, result);
  }),
);

const MODULES = new Set(['dojo', 'forge', 'spirit', 'vault', 'quests']);

gameRouter.patch(
  '/streak/:module',
  asyncHandler(async (req, res) => {
    const m = req.params.module as Module;
    if (!MODULES.has(m)) return fail(res, 'Invalid module', 400);
    const result = await updateStreak(m);
    ok(res, result);
  }),
);

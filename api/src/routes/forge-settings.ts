import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/forgeSettings';

export const forgeSettingsRouter = Router();

const schema = z.object({
  dailyCodingGoalMin: z.number().int().min(15).max(720).optional(),
  defaultSessionMin: z.number().int().min(5).max(720).optional(),
  pomodoroWorkMin: z.number().int().min(5).max(120).optional(),
  pomodoroBreakMin: z.number().int().min(1).max(60).optional(),
  githubUsername: z.string().nullable().optional(),
  workStartHour: z.number().int().min(0).max(23).optional(),
  workEndHour: z.number().int().min(0).max(23).optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
  billableRate: z.number().nullable().optional(),
  billableCurrency: z.string().optional(),
  weeklyDsaGoal: z.number().int().min(1).max(100).optional(),
});

forgeSettingsRouter.get('/', asyncHandler(async (_req, res) => ok(res, await svc.getSettings())));
forgeSettingsRouter.get(
  '/github-username',
  asyncHandler(async (_req, res) => {
    const s = await svc.getSettings();
    ok(res, { githubUsername: s.githubUsername });
  }),
);
forgeSettingsRouter.put(
  '/',
  validateBody(schema),
  asyncHandler(async (req, res) => ok(res, await svc.updateSettings(req.body))),
);

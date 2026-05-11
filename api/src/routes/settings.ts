import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/settings';

export const settingsRouter = Router();

const schema = z.object({
  weightUnit: z.enum(['kg', 'lbs']).optional(),
  distanceUnit: z.enum(['km', 'mi']).optional(),
  defaultRestSeconds: z.number().int().positive().optional(),
  autoStartRest: z.boolean().optional(),
  oneRmFormula: z.enum(['Epley', 'Brzycki', 'Lander']).optional(),
  weekStartsMonday: z.boolean().optional(),
  barbellWeightKg: z.number().positive().optional(),
  workoutReminderEnabled: z.boolean().optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
  reminderMinute: z.number().int().min(0).max(59).optional(),
  streakAtRiskEnabled: z.boolean().optional(),
  weeklySummaryEnabled: z.boolean().optional(),
});

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await svc.getSettings())),
);

settingsRouter.put(
  '/',
  validateBody(schema),
  asyncHandler(async (req, res) => ok(res, await svc.updateSettings(req.body))),
);

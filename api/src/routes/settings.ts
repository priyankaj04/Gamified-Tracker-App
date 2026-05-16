import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/settings';

export const settingsRouter = Router();

const hour = z.number().int().min(0).max(23).optional();
const minute = z.number().int().min(0).max(59).optional();
const weekday = z.number().int().min(1).max(7).optional();

const schema = z.object({
  weightUnit: z.enum(['kg', 'lbs']).optional(),
  distanceUnit: z.enum(['km', 'mi']).optional(),
  defaultRestSeconds: z.number().int().positive().optional(),
  autoStartRest: z.boolean().optional(),
  oneRmFormula: z.enum(['Epley', 'Brzycki', 'Lander']).optional(),
  weekStartsMonday: z.boolean().optional(),
  barbellWeightKg: z.number().positive().optional(),
  workoutReminderEnabled: z.boolean().optional(),
  reminderHour: hour,
  reminderMinute: minute,
  streakAtRiskEnabled: z.boolean().optional(),
  weeklySummaryEnabled: z.boolean().optional(),
  // Forge
  forgeCodeReminderEnabled: z.boolean().optional(),
  forgeCodeReminderHour: hour,
  forgeCodeReminderMinute: minute,
  forgeStreakAtRiskEnabled: z.boolean().optional(),
  forgeWeeklySummaryEnabled: z.boolean().optional(),
  // Spirit
  spiritMealRemindersEnabled: z.boolean().optional(),
  spiritBreakfastHour: hour,
  spiritLunchHour: hour,
  spiritDinnerHour: hour,
  spiritHydrationEnabled: z.boolean().optional(),
  spiritHydrationStartHour: hour,
  spiritHydrationEndHour: hour,
  spiritHydrationIntervalHours: z.number().int().min(1).max(8).optional(),
  spiritWindDownEnabled: z.boolean().optional(),
  spiritBedtimeHour: hour,
  spiritBedtimeMinute: minute,
  spiritHabitStreakAtRiskEnabled: z.boolean().optional(),
  // Vault
  vaultWeeklyReviewEnabled: z.boolean().optional(),
  vaultWeeklyReviewWeekday: weekday,
  vaultWeeklyReviewHour: hour,
  vaultSubscriptionAlertsEnabled: z.boolean().optional(),
  // Quest
  questDailySummaryEnabled: z.boolean().optional(),
  questDailySummaryHour: hour,
  // Gamification
  penaltiesEnabled: z.boolean().optional(),
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

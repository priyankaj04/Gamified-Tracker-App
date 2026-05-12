import { Router } from 'express';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import * as svc from '@/services/forgeStats';

export const forgeStatsRouter = Router();

forgeStatsRouter.get('/summary', asyncHandler(async (_req, res) => ok(res, await svc.summary())));
forgeStatsRouter.get('/weekly', asyncHandler(async (_req, res) => ok(res, await svc.weekly())));
forgeStatsRouter.get('/weekly-chart', asyncHandler(async (_req, res) => ok(res, await svc.weeklyChart())));
forgeStatsRouter.get('/by-project', asyncHandler(async (_req, res) => ok(res, await svc.byProject())));
forgeStatsRouter.get('/daily-goal', asyncHandler(async (_req, res) => ok(res, await svc.dailyGoal())));
forgeStatsRouter.get(
  '/billable',
  asyncHandler(async (req, res) => {
    const month = (req.query.month as string | undefined) ?? new Date().toISOString().slice(0, 7);
    ok(res, await svc.billable(month));
  }),
);

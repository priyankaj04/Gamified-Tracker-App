import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/recovery';

export const recoveryRouter = Router();

const upsertSchema = z.object({
  date: z.string().optional(),
  sleepHours: z.number().nonnegative().nullable().optional(),
  sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
  energyLevel: z.number().int().min(1).max(5).nullable().optional(),
  soreness: z.record(z.string(), z.number().int().min(0).max(5)).optional(),
  notes: z.string().nullable().optional(),
});

recoveryRouter.get(
  '/score',
  asyncHandler(async (_req, res) => ok(res, await svc.recoveryScore())),
);

recoveryRouter.get(
  '/',
  asyncHandler(async (req, res) =>
    ok(
      res,
      await svc.listRecovery({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      }),
    ),
  ),
);

recoveryRouter.post(
  '/',
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertRecovery(req.body), 201)),
);

recoveryRouter.delete(
  '/:date',
  asyncHandler(async (req, res) => {
    await svc.deleteRecovery(req.params.date);
    ok(res, { deleted: true });
  }),
);

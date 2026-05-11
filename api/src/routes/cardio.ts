import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/cardio';

export const cardioRouter = Router();

const cardioSchema = z.object({
  activityType: z.string().min(1),
  date: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  distanceKm: z.number().positive().optional(),
  hrZone: z.number().int().min(1).max(5).optional(),
  stars: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

cardioRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => ok(res, await svc.cardioStats())),
);

cardioRouter.get(
  '/',
  asyncHandler(async (req, res) =>
    ok(res, await svc.listCardio({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      activityType: req.query.activityType as string | undefined,
    })),
  ),
);

cardioRouter.post(
  '/',
  validateBody(cardioSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createCardio(req.body), 201)),
);

cardioRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteCardio(req.params.id);
    ok(res, { deleted: true });
  }),
);

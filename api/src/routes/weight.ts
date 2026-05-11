import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/weight';

export const weightRouter = Router();

const entrySchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
  bodyFatPct: z.number().nonnegative().optional(),
  chestCm: z.number().nonnegative().optional(),
  waistCm: z.number().nonnegative().optional(),
  hipsCm: z.number().nonnegative().optional(),
  bicepsCm: z.number().nonnegative().optional(),
  thighsCm: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const goalSchema = z.object({
  startWeightKg: z.number().positive(),
  targetWeightKg: z.number().positive(),
  startDate: z.string(),
  targetDate: z.string(),
});

weightRouter.get(
  '/goal',
  asyncHandler(async (_req, res) => ok(res, await svc.getGoal())),
);

weightRouter.put(
  '/goal',
  validateBody(goalSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertGoal(req.body))),
);

weightRouter.get(
  '/',
  asyncHandler(async (req, res) =>
    ok(
      res,
      await svc.listWeight({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      }),
    ),
  ),
);

weightRouter.post(
  '/',
  validateBody(entrySchema),
  asyncHandler(async (req, res) => ok(res, await svc.createWeight(req.body), 201)),
);

weightRouter.put(
  '/:id',
  validateBody(entrySchema.partial()),
  asyncHandler(async (req, res) => ok(res, await svc.updateWeight(req.params.id, req.body))),
);

weightRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteWeight(req.params.id);
    ok(res, { deleted: true });
  }),
);

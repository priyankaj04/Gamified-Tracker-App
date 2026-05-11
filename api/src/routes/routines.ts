import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/routines';

export const routinesRouter = Router();

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  templateId: z.string().uuid().nullable().optional(),
  isRestDay: z.boolean().optional(),
});

const routineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isDeloadWeek: z.boolean().optional(),
  days: z.array(daySchema).default([]),
});

routinesRouter.get(
  '/active/today',
  asyncHandler(async (_req, res) => ok(res, await svc.getTodayWorkout())),
);

routinesRouter.get(
  '/active',
  asyncHandler(async (_req, res) => ok(res, await svc.getActiveRoutine())),
);

routinesRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await svc.listRoutines())),
);

routinesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getRoutine(req.params.id))),
);

routinesRouter.post(
  '/',
  validateBody(routineSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createRoutine(req.body), 201)),
);

routinesRouter.put(
  '/:id',
  validateBody(routineSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateRoutine(req.params.id, req.body))),
);

routinesRouter.patch(
  '/:id/activate',
  asyncHandler(async (req, res) => ok(res, await svc.setActiveRoutine(req.params.id))),
);

routinesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteRoutine(req.params.id);
    ok(res, { deleted: true });
  }),
);

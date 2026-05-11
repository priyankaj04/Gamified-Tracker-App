import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/templates';

export const templatesRouter = Router();

const setSchema = z.object({
  setType: z.enum(['Normal', 'Warmup', 'DropSet', 'Failure', 'AMRAP']).optional(),
  targetReps: z.number().int().positive().optional(),
  targetWeightKg: z.number().nonnegative().optional(),
  targetDurationSeconds: z.number().int().positive().optional(),
});

const exerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  supersetGroupId: z.string().nullable().optional(),
  notes: z.string().optional(),
  sets: z.array(setSchema).default([]),
});

const templateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Strength', 'Cardio', 'Flexibility', 'Combat', 'Mixed', 'Plyometrics', 'Calisthenics', 'Sports', 'HIIT', 'Mobility']).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).default([]),
});

templatesRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await svc.listTemplates())),
);

templatesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getTemplate(req.params.id))),
);

templatesRouter.post(
  '/',
  validateBody(templateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createTemplate(req.body), 201)),
);

templatesRouter.put(
  '/:id',
  validateBody(templateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateTemplate(req.params.id, req.body))),
);

templatesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteTemplate(req.params.id);
    ok(res, { deleted: true });
  }),
);

templatesRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => ok(res, await svc.duplicateTemplate(req.params.id), 201)),
);

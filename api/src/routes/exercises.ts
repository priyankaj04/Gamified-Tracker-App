import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/exercises';

export const exercisesRouter = Router();

const exerciseSchema = z.object({
  name: z.string().min(1),
  musclePrimary: z.string().min(1),
  muscleSecondary: z.array(z.string()).default([]),
  equipment: z.string().min(1),
  exerciseType: z.enum(['compound', 'isolation', 'cardio']),
  notes: z.string().optional(),
});

exercisesRouter.get(
  '/last-set',
  asyncHandler(async (req, res) =>
    ok(
      res,
      await svc.lastSet({
        id: req.query.id as string | undefined,
        name: req.query.name as string | undefined,
      }),
    ),
  ),
);

exercisesRouter.get(
  '/:id/last-set',
  asyncHandler(async (req, res) => ok(res, await svc.lastSet({ id: req.params.id }))),
);

exercisesRouter.get(
  '/meta',
  asyncHandler(async (_req, res) =>
    ok(res, { muscleGroups: svc.muscleGroups(), equipmentTypes: svc.equipmentTypes() }),
  ),
);

exercisesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, muscle, equipment, type, favorite } = req.query;
    ok(
      res,
      await svc.listExercises({
        search: search as string | undefined,
        muscle: muscle as string | undefined,
        equipment: equipment as string | undefined,
        type: type as any,
        favorite: typeof favorite === 'string' ? favorite === 'true' : undefined,
      }),
    );
  }),
);

exercisesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getExercise(req.params.id))),
);

exercisesRouter.post(
  '/',
  validateBody(exerciseSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createExercise(req.body), 201)),
);

exercisesRouter.put(
  '/:id',
  validateBody(exerciseSchema.partial().extend({ isFavorite: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateExercise(req.params.id, req.body))),
);

exercisesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteExercise(req.params.id);
    ok(res, { deleted: true });
  }),
);

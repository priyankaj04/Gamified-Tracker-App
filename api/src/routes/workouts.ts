import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/workouts';

export const workoutsRouter = Router();

const setSchema = z.object({
  reps: z.number().int().optional(),
  weightKg: z.number().nonnegative().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  isPr: z.boolean().optional(),
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(setSchema).default([]),
});

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Strength', 'Cardio', 'Flexibility', 'Combat']),
  date: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).default([]),
});

workoutsRouter.get(
  '/grid',
  asyncHandler(async (_req, res) => ok(res, await svc.getWorkoutGrid())),
);

workoutsRouter.get(
  '/records',
  asyncHandler(async (_req, res) => ok(res, await svc.getRecords())),
);

workoutsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, from, to } = req.query;
    ok(
      res,
      await svc.listWorkouts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        from: from as string | undefined,
        to: to as string | undefined,
      }),
    );
  }),
);

workoutsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getWorkout(req.params.id))),
);

workoutsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createWorkout(req.body), 201)),
);

workoutsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteWorkout(req.params.id);
    ok(res, { deleted: true });
  }),
);

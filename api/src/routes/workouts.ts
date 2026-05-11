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
  setType: z.enum(['Normal', 'Warmup', 'DropSet', 'Failure', 'AMRAP']).optional(),
  isPr: z.boolean().optional(),
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  exerciseId: z.string().uuid().optional(),
  supersetGroupId: z.string().nullable().optional(),
  notes: z.string().optional(),
  sets: z.array(setSchema).default([]),
});

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Strength', 'Cardio', 'Flexibility', 'Combat', 'Mixed', 'Plyometrics', 'Calisthenics', 'Sports', 'HIIT', 'Mobility']),
  date: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().optional(),
  moodTag: z.enum(['CrushedIt', 'Solid', 'Average', 'Rough', 'Struggled']).optional(),
  templateId: z.string().uuid().nullable().optional(),
  routineDayId: z.string().uuid().nullable().optional(),
  exercises: z.array(exerciseSchema).default([]),
});

// ── Specific routes first ────────────────────────────────
workoutsRouter.get(
  '/grid',
  asyncHandler(async (req, res) =>
    ok(res, await svc.getWorkoutGrid(req.query.days ? Number(req.query.days) : 90)),
  ),
);

workoutsRouter.get(
  '/records',
  asyncHandler(async (_req, res) => ok(res, await svc.getRecords())),
);

workoutsRouter.get(
  '/records/history',
  asyncHandler(async (req, res) =>
    ok(
      res,
      await svc.getExerciseHistory({
        id: req.query.exerciseId as string | undefined,
        name: req.query.name as string | undefined,
      }),
    ),
  ),
);

workoutsRouter.get(
  '/stats/all-time',
  asyncHandler(async (_req, res) => ok(res, await svc.allTimeStats())),
);

workoutsRouter.get(
  '/stats/weekly',
  asyncHandler(async (req, res) =>
    ok(res, await svc.weeklyStats(req.query.weeks ? Number(req.query.weeks) : 12)),
  ),
);

workoutsRouter.get(
  '/stats/muscles',
  asyncHandler(async (req, res) =>
    ok(res, await svc.muscleStats(req.query.weeks ? Number(req.query.weeks) : 4)),
  ),
);

workoutsRouter.delete(
  '/bulk',
  validateBody(z.object({ from: z.string(), to: z.string() })),
  asyncHandler(async (req, res) => ok(res, await svc.bulkDeleteWorkouts(req.body))),
);

workoutsRouter.post(
  '/import',
  validateBody(z.object({ csv: z.string().min(1) })),
  asyncHandler(async (req, res) =>
    ok(res, await svc.importWorkoutsCsv(req.body.csv), 201),
  ),
);

// ── List + CRUD ─────────────────────────────────────────
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

workoutsRouter.put(
  '/:id',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateWorkout(req.params.id, req.body))),
);

workoutsRouter.post(
  '/:id/save-as-template',
  validateBody(z.object({ name: z.string().optional() })),
  asyncHandler(async (req, res) =>
    ok(res, await svc.saveWorkoutAsTemplate(req.params.id, req.body), 201),
  ),
);

workoutsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteWorkout(req.params.id);
    ok(res, { deleted: true });
  }),
);

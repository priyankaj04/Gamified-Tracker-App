import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/learning';

export const learningRouter = Router();

const learningType = z.enum(['Course', 'Book', 'Tutorial', 'Video', 'Documentation', 'Paper']);
const learningStatus = z.enum(['Not Started', 'In Progress', 'Completed']);

const createSchema = z.object({
  title: z.string().min(1),
  type: learningType.optional(),
  platform: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  topics: z.array(z.string()).optional(),
  status: learningStatus.optional(),
  progressPct: z.number().int().min(0).max(100).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
});

const updateSchema = createSchema.partial();

learningRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => ok(res, await svc.learningStats())),
);
learningRouter.get(
  '/skill-map',
  asyncHandler(async (_req, res) => ok(res, await svc.skillMap())),
);
learningRouter.get(
  '/rusty',
  asyncHandler(async (_req, res) => ok(res, await svc.rustySkills())),
);
learningRouter.get(
  '/trending',
  asyncHandler(async (_req, res) => ok(res, await svc.trendingSkills())),
);

learningRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, type, topic, search } = req.query;
    ok(
      res,
      await svc.listLearning({
        status: status as string | undefined,
        type: type as string | undefined,
        topic: topic as string | undefined,
        search: search as string | undefined,
      }),
    );
  }),
);

learningRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createLearning(req.body), 201)),
);

learningRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateLearning(req.params.id, req.body))),
);

learningRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteLearning(req.params.id);
    ok(res, { deleted: true });
  }),
);

learningRouter.patch(
  '/:id/complete',
  asyncHandler(async (req, res) => ok(res, await svc.completeLearning(req.params.id))),
);

learningRouter.patch(
  '/:id/progress',
  validateBody(z.object({ progressPct: z.number().int().min(0).max(100) })),
  asyncHandler(async (req, res) => ok(res, await svc.updateProgress(req.params.id, req.body.progressPct))),
);

learningRouter.put(
  '/skills/:id',
  validateBody(
    z.object({
      proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
      category: z
        .enum(['Frontend', 'Backend', 'Mobile', 'ML/AI', 'DevOps', 'Database', 'CS Fundamentals', 'Other'])
        .optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await svc.updateSkill(req.params.id, req.body))),
);

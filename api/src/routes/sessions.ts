import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/projects';

export const sessionsRouter = Router();

const sessionSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  date: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  notes: z.string().optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
});

sessionsRouter.get(
  '/grid',
  asyncHandler(async (_req, res) => ok(res, await svc.getSessionGrid())),
);

sessionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, from, to, page, limit } = req.query;
    ok(
      res,
      await svc.listSessions({
        projectId: projectId as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    );
  }),
);

sessionsRouter.post(
  '/',
  validateBody(sessionSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createSession(req.body), 201)),
);

sessionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteSession(req.params.id);
    ok(res, { deleted: true });
  }),
);

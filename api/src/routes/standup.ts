import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/standup';

export const standupRouter = Router();

const upsertSchema = z.object({
  yesterday: z.string().optional(),
  today: z.string().optional(),
  blockers: z.string().optional(),
  projectId: z.string().uuid().nullable().optional(),
  date: z.string().optional(),
});

standupRouter.get(
  '/today',
  asyncHandler(async (_req, res) => ok(res, await svc.getToday())),
);

standupRouter.get(
  '/export',
  asyncHandler(async (req, res) =>
    ok(res, await svc.exportStandups(req.query.from as string | undefined, req.query.to as string | undefined)),
  ),
);

standupRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await svc.listStandups())),
);

standupRouter.post(
  '/',
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertStandup(req.body), 201)),
);

standupRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteStandup(req.params.id);
    ok(res, { deleted: true });
  }),
);

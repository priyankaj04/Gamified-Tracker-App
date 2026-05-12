import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/deployments';

export const deploymentsRouter = Router();

const env = z.enum(['development', 'staging', 'production']);

const createSchema = z.object({
  projectId: z.string().uuid(),
  version: z.string().nullable().optional(),
  environment: env.optional(),
  deployedAt: z.string().optional(),
  releaseNotes: z.string().nullable().optional(),
  deployUrl: z.string().url().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({ projectId: z.string().uuid().optional() });

deploymentsRouter.get(
  '/latest',
  asyncHandler(async (_req, res) => ok(res, await svc.latestPerProject())),
);

deploymentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId as string | undefined;
    if (!projectId) return ok(res, { deployments: [] });
    ok(res, await svc.listDeployments(projectId));
  }),
);

deploymentsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createDeployment(req.body), 201)),
);

deploymentsRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateDeployment(req.params.id, req.body))),
);

deploymentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteDeployment(req.params.id);
    ok(res, { deleted: true });
  }),
);

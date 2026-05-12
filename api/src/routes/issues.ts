import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/issues';

export const issuesRouter = Router();

const severity = z.enum(['Critical', 'High', 'Medium', 'Low']);
const status = z.enum(['Open', 'In Progress', 'Fixed', 'Wont Fix']);

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  severity: severity.optional(),
  status: status.optional(),
  foundDate: z.string().optional(),
  sessionId: z.string().uuid().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({ projectId: z.string().uuid().optional() });

issuesRouter.get(
  '/stats',
  asyncHandler(async (req, res) => ok(res, await svc.issueStats(req.query.projectId as string | undefined))),
);

issuesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, status: st, severity: sv } = req.query;
    ok(
      res,
      await svc.listIssues({
        projectId: projectId as string | undefined,
        status: st as string | undefined,
        severity: sv as string | undefined,
      }),
    );
  }),
);

issuesRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createIssue(req.body), 201)),
);

issuesRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateIssue(req.params.id, req.body))),
);

issuesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteIssue(req.params.id);
    ok(res, { deleted: true });
  }),
);

issuesRouter.patch(
  '/:id/fix',
  asyncHandler(async (req, res) => ok(res, await svc.markFixed(req.params.id))),
);

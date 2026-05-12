import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/snippets';

export const snippetsRouter = Router();

const category = z.enum(['Bug Fix', 'Algorithm', 'Config', 'Reference', 'Template']);

const createSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  language: z.string().optional(),
  content: z.string().min(1),
  category: category.optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial();

snippetsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, language, category: cat, search, pinned } = req.query;
    ok(
      res,
      await svc.listSnippets({
        projectId: projectId as string | undefined,
        language: language as string | undefined,
        category: cat as string | undefined,
        search: search as string | undefined,
        pinned: pinned === undefined ? undefined : pinned === 'true',
      }),
    );
  }),
);

snippetsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createSnippet(req.body), 201)),
);

snippetsRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateSnippet(req.params.id, req.body))),
);

snippetsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteSnippet(req.params.id);
    ok(res, { deleted: true });
  }),
);

snippetsRouter.patch(
  '/:id/pin',
  asyncHandler(async (req, res) => ok(res, await svc.togglePin(req.params.id))),
);

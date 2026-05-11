import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/quests';

export const questsRouter = Router();

const questSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['S', 'A', 'B', 'C']).default('C'),
  isDaily: z.boolean().default(false),
  dueDate: z.string().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

const completeSchema = z.object({
  stars: z.number().int().min(1).max(5).nullable().optional(),
});

questsRouter.get(
  '/tags',
  asyncHandler(async (_req, res) => ok(res, await svc.listTags())),
);

questsRouter.post(
  '/tags',
  validateBody(z.object({ name: z.string().min(1), color: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.createTag(req.body), 201)),
);

questsRouter.delete(
  '/tags/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteTag(req.params.id);
    ok(res, { deleted: true });
  }),
);

questsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { completed, priority, tagId, daily, page, limit } = req.query;
    ok(
      res,
      await svc.listQuests({
        completed: typeof completed === 'string' ? completed === 'true' : undefined,
        priority: priority as string | undefined,
        tagId: tagId as string | undefined,
        daily: typeof daily === 'string' ? daily === 'true' : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    );
  }),
);

questsRouter.post(
  '/',
  validateBody(questSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createQuest(req.body), 201)),
);

questsRouter.put(
  '/:id',
  validateBody(questSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await svc.updateQuest(req.params.id, req.body))),
);

questsRouter.patch(
  '/:id/complete',
  validateBody(completeSchema),
  asyncHandler(async (req, res) => ok(res, await svc.completeQuest(req.params.id, req.body.stars))),
);

questsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteQuest(req.params.id);
    ok(res, { deleted: true });
  }),
);

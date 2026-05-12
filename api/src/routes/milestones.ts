import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/milestones';

export const milestonesRouter = Router();

const priority = z.enum(['S', 'A', 'B', 'C']);

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  targetDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  targetDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

const subtaskCreate = z.object({
  title: z.string().min(1),
  priority: priority.optional(),
  estimatedHours: z.number().nullable().optional(),
  orderIndex: z.number().int().optional(),
});

const subtaskUpdate = subtaskCreate.partial().extend({ completed: z.boolean().optional() });

milestonesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId as string | undefined;
    if (!projectId) return ok(res, { milestones: [] });
    ok(res, await svc.listMilestones(projectId));
  }),
);

milestonesRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createMilestone(req.body), 201)),
);

milestonesRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateMilestone(req.params.id, req.body))),
);

milestonesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteMilestone(req.params.id);
    ok(res, { deleted: true });
  }),
);

milestonesRouter.patch(
  '/:id/complete',
  validateBody(z.object({ completed: z.boolean() })),
  asyncHandler(async (req, res) => ok(res, await svc.completeMilestone(req.params.id, req.body.completed))),
);

milestonesRouter.patch(
  '/reorder',
  validateBody(z.object({ ids: z.array(z.string().uuid()) })),
  asyncHandler(async (req, res) => ok(res, await svc.reorderMilestones(req.body.ids))),
);

// subtasks
milestonesRouter.post(
  '/:id/subtasks',
  validateBody(subtaskCreate),
  asyncHandler(async (req, res) => ok(res, await svc.createSubtask(req.params.id, req.body), 201)),
);

milestonesRouter.put(
  '/:id/subtasks/:subtaskId',
  validateBody(subtaskUpdate),
  asyncHandler(async (req, res) => ok(res, await svc.updateSubtask(req.params.subtaskId, req.body))),
);

milestonesRouter.delete(
  '/:id/subtasks/:subtaskId',
  asyncHandler(async (req, res) => {
    await svc.deleteSubtask(req.params.subtaskId);
    ok(res, { deleted: true });
  }),
);

milestonesRouter.patch(
  '/:id/subtasks/:subtaskId/complete',
  asyncHandler(async (req, res) => ok(res, await svc.toggleSubtask(req.params.subtaskId))),
);

milestonesRouter.patch(
  '/:id/subtasks/reorder',
  validateBody(z.object({ ids: z.array(z.string().uuid()) })),
  asyncHandler(async (req, res) => ok(res, await svc.reorderSubtasks(req.body.ids))),
);

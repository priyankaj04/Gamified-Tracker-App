import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/projects';

export const projectsRouter = Router();

const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  githubUrl: z.string().url().optional(),
  milestones: z.array(z.object({ title: z.string().min(1) })).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  githubUrl: z.string().url().optional(),
  status: z.enum(['Backlog', 'In Progress', 'Shipped']).optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
});

projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => ok(res, await svc.listProjects(req.query.status as string | undefined))),
);

projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getProject(req.params.id))),
);

projectsRouter.post(
  '/',
  validateBody(projectSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createProject(req.body), 201)),
);

projectsRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateProject(req.params.id, req.body))),
);

projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteProject(req.params.id);
    ok(res, { deleted: true });
  }),
);

projectsRouter.patch(
  '/:id/milestones/:milestoneId',
  validateBody(z.object({ completed: z.boolean() })),
  asyncHandler(async (req, res) =>
    ok(res, await svc.toggleMilestone(req.params.id, req.params.milestoneId, req.body.completed)),
  ),
);

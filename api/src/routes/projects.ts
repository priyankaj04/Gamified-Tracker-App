import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/projects';
import * as gh from '@/services/github';

export const projectsRouter = Router();

const milestoneInput = z.object({
  title: z.string().min(1),
  targetDate: z.string().nullable().optional(),
});

const projectBase = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  type: z.enum(['Personal', 'Freelance', 'Open Source', 'Learning', 'Work']).optional(),
  priority: z.enum(['S', 'A', 'B', 'C']).optional(),
  techStack: z.array(z.string()).default([]),
  coverEmoji: z.string().optional(),
  coverColor: z.string().optional(),
  startDate: z.string().optional(),
  targetShipDate: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  demoUrl: z.string().url().nullable().optional(),
  figmaUrl: z.string().url().nullable().optional(),
  docsUrl: z.string().url().nullable().optional(),
  milestones: z.array(milestoneInput).optional(),
});

const updateSchema = projectBase.partial().extend({
  status: z.enum(['Idea', 'Backlog', 'In Progress', 'Review', 'Shipped', 'Archived']).optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
  readmeNotes: z.string().nullable().optional(),
  isPortfolio: z.boolean().optional(),
});

// list
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, type, priority, archived, pinned, search, tag } = req.query;
    ok(
      res,
      await svc.listProjects({
        status: status as string | undefined,
        type: type as string | undefined,
        priority: priority as string | undefined,
        archived: archived === undefined ? undefined : archived === 'true',
        pinned: pinned === undefined ? undefined : pinned === 'true',
        search: search as string | undefined,
        tag: tag as string | undefined,
      }),
    );
  }),
);

// tags
projectsRouter.get(
  '/tags',
  asyncHandler(async (_req, res) => ok(res, await svc.listTags())),
);
projectsRouter.post(
  '/tags',
  validateBody(z.object({ name: z.string().min(1), color: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.createTag(req.body.name, req.body.color), 201)),
);
projectsRouter.delete(
  '/tags/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteTag(req.params.id);
    ok(res, { deleted: true });
  }),
);

// portfolio
projectsRouter.get(
  '/portfolio',
  asyncHandler(async (_req, res) => ok(res, await svc.listPortfolio())),
);

projectsRouter.get(
  '/portfolio/export',
  asyncHandler(async (_req, res) => {
    const { projects } = await svc.listPortfolio();
    ok(res, {
      generatedAt: new Date().toISOString(),
      count: projects.length,
      projects: projects.map((p: any) => ({
        name: p.name,
        description: p.description,
        techStack: p.techStack,
        githubUrl: p.githubUrl,
        demoUrl: p.demoUrl,
        shippedDate: p.shippedDate,
        stars: p.stars,
        totalHours: p.totalHours,
      })),
    });
  }),
);

projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getProject(req.params.id))),
);

projectsRouter.post(
  '/',
  validateBody(projectBase),
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
  '/:id/pin',
  asyncHandler(async (req, res) => ok(res, await svc.togglePin(req.params.id))),
);
projectsRouter.patch(
  '/:id/archive',
  asyncHandler(async (req, res) => ok(res, await svc.toggleArchive(req.params.id))),
);
projectsRouter.patch(
  '/:id/ship',
  asyncHandler(async (req, res) => ok(res, await svc.shipProject(req.params.id))),
);
projectsRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => ok(res, await svc.duplicateProject(req.params.id), 201)),
);
projectsRouter.patch(
  '/:id/github-sync',
  asyncHandler(async (req, res) => ok(res, await gh.syncProjectGithub(req.params.id))),
);

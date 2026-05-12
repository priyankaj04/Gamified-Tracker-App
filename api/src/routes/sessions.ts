import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/sessions';

export const sessionsRouter = Router();

const sessionSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  date: z.string().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive(),
  mood: z.enum(['Deep Focus', 'Normal', 'Distracted', 'Blocked', 'Flow State']).nullable().optional(),
  notes: z.string().nullable().optional(),
  stars: z.number().int().min(1).max(5).nullable().optional(),
  isBillable: z.boolean().optional(),
  pomodoroCount: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

const updateSchema = sessionSchema.partial().extend({ durationMinutes: z.number().int().positive().optional() });

// grid
sessionsRouter.get(
  '/grid',
  asyncHandler(async (req, res) => {
    const days = req.query.days ? Number(req.query.days) : 365;
    ok(res, await svc.getSessionGrid(days));
  }),
);

// today
sessionsRouter.get(
  '/today',
  asyncHandler(async (_req, res) => ok(res, await svc.getTodaySessions())),
);

// active timer
sessionsRouter.get(
  '/timer/active',
  asyncHandler(async (_req, res) => ok(res, await svc.getActiveTimer())),
);

sessionsRouter.post(
  '/timer/start',
  validateBody(
    z.object({
      projectId: z.string().uuid().nullable().optional(),
      milestoneId: z.string().uuid().nullable().optional(),
      isPomodoro: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await svc.startTimer(req.body), 201)),
);

sessionsRouter.post(
  '/timer/stop',
  asyncHandler(async (_req, res) => ok(res, await svc.stopTimer())),
);

// list
sessionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { projectId, from, to, tag, page, limit } = req.query;
    ok(
      res,
      await svc.listSessions({
        projectId: projectId as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
        tag: tag as string | undefined,
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

sessionsRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateSession(req.params.id, req.body))),
);

sessionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteSession(req.params.id);
    ok(res, { deleted: true });
  }),
);

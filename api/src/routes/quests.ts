import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/quests';

export const questsRouter = Router();

const recurrenceSchema = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('daily') }),
    z.object({ kind: z.literal('weekly'), daysOfWeek: z.array(z.number().int().min(0).max(6)) }),
    z.object({ kind: z.literal('monthly'), dayOfMonth: z.number().int().min(1).max(31) }),
  ])
  .nullable();

const questSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: z.enum(['S', 'A', 'B', 'C']).default('C'),
  difficulty: z.enum(['Trivial', 'Normal', 'Hard', 'Boss']).nullable().optional(),
  isDaily: z.boolean().default(false),
  isBoss: z.boolean().default(false),
  dueDate: z.string().nullable().optional(),
  remindAt: z.string().nullable().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
  estimatedMinutes: z.number().int().nullable().optional(),
  recurrence: recurrenceSchema.optional(),
  parentQuestId: z.string().uuid().nullable().optional(),
  steps: z.array(z.string().min(1)).optional(),
  linkedModule: z.string().nullable().optional(),
  linkedModuleId: z.string().uuid().nullable().optional(),
});

const completeSchema = z.object({
  stars: z.number().int().min(1).max(5).nullable().optional(),
});

// ── Tags ──────────────────────────────────────────────────
questsRouter.get('/tags', asyncHandler(async (_req, res) => ok(res, await svc.listTags())));
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

// ── Templates ────────────────────────────────────────────
questsRouter.get('/templates', asyncHandler(async (_req, res) => ok(res, await svc.listTemplates())));
questsRouter.post(
  '/templates',
  validateBody(
    z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      priority: z.enum(['S', 'A', 'B', 'C']).optional(),
      difficulty: z.enum(['Trivial', 'Normal', 'Hard', 'Boss']).nullable().optional(),
      isDaily: z.boolean().optional(),
      isBoss: z.boolean().optional(),
      recurrence: recurrenceSchema.optional(),
      estimatedMinutes: z.number().int().nullable().optional(),
      notes: z.string().nullable().optional(),
      tagIds: z.array(z.string().uuid()).optional(),
      stepLabels: z.array(z.string()).optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await svc.createTemplate(req.body), 201)),
);
questsRouter.delete(
  '/templates/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteTemplate(req.params.id);
    ok(res, { deleted: true });
  }),
);
questsRouter.post(
  '/templates/:id/use',
  asyncHandler(async (req, res) => ok(res, await svc.useTemplate(req.params.id), 201)),
);

// ── Active timer ─────────────────────────────────────────
questsRouter.get('/timer', asyncHandler(async (_req, res) => ok(res, await svc.getActiveTimer())));

// ── Combo / rank ─────────────────────────────────────────
questsRouter.get('/combo', asyncHandler(async (_req, res) => ok(res, await svc.getCombo())));
questsRouter.get('/rank', asyncHandler(async (_req, res) => ok(res, await svc.getRank())));

// ── Hunt / challenges / insights / rollover ──────────────
questsRouter.get('/hunt', asyncHandler(async (_req, res) => ok(res, await svc.getTodaysHunt())));
questsRouter.get('/challenges', asyncHandler(async (_req, res) => ok(res, await svc.listChallenges())));
questsRouter.post('/challenges/seed', asyncHandler(async (_req, res) => ok(res, await svc.ensureChallenges())));
questsRouter.post('/rollover', asyncHandler(async (_req, res) => ok(res, await svc.rolloverQuests())));
questsRouter.post('/auto-archive', asyncHandler(async (_req, res) => ok(res, await svc.autoArchive())));
questsRouter.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const window = req.query.window ? Number(req.query.window) : undefined;
    ok(res, await svc.getInsights({ window }));
  }),
);

// ── Settings ─────────────────────────────────────────────
questsRouter.get('/settings', asyncHandler(async (_req, res) => ok(res, await svc.getSettings())));
questsRouter.put(
  '/settings',
  validateBody(
    z.object({
      defaultPriority: z.enum(['S', 'A', 'B', 'C']).optional(),
      defaultTab: z.string().optional(),
      autoArchiveDays: z.number().int().min(1).max(365).optional(),
      reminderOffsetMinutes: z.number().int().min(0).max(1440).optional(),
      soundsEnabled: z.boolean().optional(),
      comboEnabled: z.boolean().optional(),
      penaltyEnabled: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await svc.updateSettings(req.body))),
);

// ── List & CRUD ──────────────────────────────────────────
questsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { completed, priority, tagId, daily, boss, archived, search, parentId, page, limit } = req.query;
    ok(
      res,
      await svc.listQuests({
        completed: typeof completed === 'string' ? completed === 'true' : undefined,
        priority: priority as string | undefined,
        tagId: tagId as string | undefined,
        daily: typeof daily === 'string' ? daily === 'true' : undefined,
        boss: typeof boss === 'string' ? boss === 'true' : undefined,
        archived: typeof archived === 'string' ? archived === 'true' : undefined,
        search: search as string | undefined,
        parentId: parentId === 'null' ? null : (parentId as string | undefined),
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

questsRouter.post(
  '/reorder',
  validateBody(z.object({ orderedIds: z.array(z.string().uuid()) })),
  asyncHandler(async (req, res) => {
    await svc.reorderQuests(req.body.orderedIds);
    ok(res, { ok: true });
  }),
);

questsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await svc.getQuest(req.params.id))),
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

questsRouter.post(
  '/:id/archive',
  asyncHandler(async (req, res) => ok(res, await svc.archiveQuest(req.params.id))),
);

questsRouter.post(
  '/:id/unarchive',
  asyncHandler(async (req, res) => ok(res, await svc.unarchiveQuest(req.params.id))),
);

questsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteQuest(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ── Steps (subtasks) ─────────────────────────────────────
questsRouter.get(
  '/:id/steps',
  asyncHandler(async (req, res) => ok(res, await svc.listSteps(req.params.id))),
);
questsRouter.post(
  '/:id/steps',
  validateBody(z.object({ label: z.string().min(1) })),
  asyncHandler(async (req, res) => ok(res, await svc.createStep(req.params.id, req.body.label), 201)),
);
questsRouter.put(
  '/:id/steps/reorder',
  validateBody(z.object({ orderedIds: z.array(z.string().uuid()) })),
  asyncHandler(async (req, res) => {
    await svc.reorderSteps(req.params.id, req.body.orderedIds);
    ok(res, { ok: true });
  }),
);
questsRouter.patch(
  '/steps/:stepId',
  validateBody(z.object({ label: z.string().optional(), done: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateStep(req.params.stepId, req.body))),
);
questsRouter.delete(
  '/steps/:stepId',
  asyncHandler(async (req, res) => {
    await svc.deleteStep(req.params.stepId);
    ok(res, { deleted: true });
  }),
);

// ── Timer ────────────────────────────────────────────────
questsRouter.post(
  '/:id/timer/start',
  asyncHandler(async (req, res) => ok(res, await svc.startTimer(req.params.id))),
);
questsRouter.post(
  '/:id/timer/pause',
  asyncHandler(async (req, res) => ok(res, await svc.pauseTimer(req.params.id))),
);
questsRouter.post(
  '/:id/timer/stop',
  asyncHandler(async (req, res) => {
    await svc.stopTimer(req.params.id);
    ok(res, { ok: true });
  }),
);

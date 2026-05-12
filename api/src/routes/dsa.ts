import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/dsa';

export const dsaRouter = Router();

const platform = z.enum(['LeetCode', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'Custom']);
const difficulty = z.enum(['Easy', 'Medium', 'Hard']);
const status = z.enum(['Solved', 'Attempted', 'Revisit']);
const topic = z.enum([
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Backtracking', 'Sorting',
  'Binary Search', 'Stacks & Queues', 'Heaps',
  'Tries', 'Greedy', 'Math', 'Bit Manipulation', 'Other',
]);

const createSchema = z.object({
  title: z.string().min(1),
  platform: platform.optional(),
  difficulty,
  topic: topic.optional(),
  status: status.optional(),
  timeTakenMin: z.number().int().nullable().optional(),
  date: z.string().optional(),
  problemUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  solutionNotes: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({ difficulty: difficulty.optional() });

dsaRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => ok(res, await svc.dsaStats())),
);

dsaRouter.get(
  '/grid',
  asyncHandler(async (_req, res) => ok(res, await svc.dsaGrid())),
);

dsaRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { difficulty: d, topic: t, status: st, platform: p, from, to, page, limit } = req.query;
    ok(
      res,
      await svc.listProblems({
        difficulty: d as string | undefined,
        topic: t as string | undefined,
        status: st as string | undefined,
        platform: p as string | undefined,
        from: from as string | undefined,
        to: to as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }),
    );
  }),
);

dsaRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createProblem(req.body), 201)),
);

dsaRouter.put(
  '/:id',
  validateBody(updateSchema),
  asyncHandler(async (req, res) => ok(res, await svc.updateProblem(req.params.id, req.body))),
);

dsaRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteProblem(req.params.id);
    ok(res, { deleted: true });
  }),
);

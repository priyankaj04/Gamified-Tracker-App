import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/rest';

export const restRouter = Router();

restRouter.get(
  '/',
  asyncHandler(async (req, res) =>
    ok(res, await svc.listRestDays({ from: req.query.from as string | undefined, to: req.query.to as string | undefined })),
  ),
);

restRouter.post(
  '/',
  validateBody(z.object({ date: z.string().optional(), notes: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.markRestDay(req.body), 201)),
);

restRouter.delete(
  '/:date',
  asyncHandler(async (req, res) => {
    await svc.removeRestDay(req.params.date);
    ok(res, { deleted: true });
  }),
);

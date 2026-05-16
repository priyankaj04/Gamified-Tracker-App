import { Router } from 'express';
import { asyncHandler, fail, ok } from '@/middleware/errorHandler';
import { processPendingPenalties } from '@/services/gamification';

export const internalRouter = Router();

// Shared-secret guard for cron-triggered routes. Set INTERNAL_API_SECRET in the
// environment (Vercel project env vars). Locally, prefix the header with the
// same value to test. Vercel Cron is opinionated about how it auth's — see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs:
// CRON_SECRET injected as Authorization: Bearer <secret>. We accept either.
const isAuthorized = (req: any): boolean => {
  const secret = process.env.INTERNAL_API_SECRET ?? process.env.CRON_SECRET ?? '';
  if (!secret) return false;
  const headerSecret = req.header('x-internal-secret');
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.header('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;
  return false;
};

internalRouter.post(
  '/penalty-sweep',
  asyncHandler(async (req, res) => {
    if (!isAuthorized(req)) return fail(res, 'Unauthorized', 401);
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const applied = await processPendingPenalties({ dryRun });
    ok(res, { applied, dryRun });
  }),
);

// GET variant so Vercel Cron (which only does GET) can hit it.
internalRouter.get(
  '/penalty-sweep',
  asyncHandler(async (req, res) => {
    if (!isAuthorized(req)) return fail(res, 'Unauthorized', 401);
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const applied = await processPendingPenalties({ dryRun });
    ok(res, { applied, dryRun });
  }),
);

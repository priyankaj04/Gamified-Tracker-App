import { Router } from 'express';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import * as svc from '@/services/github';
import * as settingsSvc from '@/services/forgeSettings';

export const githubRouter = Router();

githubRouter.get(
  '/repo',
  asyncHandler(async (req, res) => {
    const url = req.query.url as string | undefined;
    if (!url) return ok(res, null);
    try {
      ok(res, await svc.getRepoStats(url));
    } catch (e: any) {
      ok(res, { error: e.message });
    }
  }),
);

githubRouter.get(
  '/commits',
  asyncHandler(async (req, res) => {
    const url = req.query.url as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    if (!url) return ok(res, null);
    try {
      ok(res, await svc.getRecentCommits(url, limit));
    } catch (e: any) {
      ok(res, { error: e.message });
    }
  }),
);

githubRouter.get(
  '/username',
  asyncHandler(async (_req, res) => {
    const s = await settingsSvc.getSettings();
    ok(res, { githubUsername: s.githubUsername });
  }),
);

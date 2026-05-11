import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/finance';

export const financeRouter = Router();

const txSchema = z.object({
  date: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['Income', 'Expense']),
  category: z.string().min(1),
  description: z.string().optional(),
});

financeRouter.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    ok(
      res,
      await svc.listTransactions({
        month: req.query.month as string | undefined,
        category: req.query.category as string | undefined,
        type: req.query.type as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    );
  }),
);

financeRouter.post(
  '/transactions',
  validateBody(txSchema),
  asyncHandler(async (req, res) => ok(res, await svc.createTransaction(req.body), 201)),
);

financeRouter.put(
  '/transactions/:id',
  validateBody(txSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await svc.updateTransaction(req.params.id, req.body))),
);

financeRouter.delete(
  '/transactions/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteTransaction(req.params.id);
    ok(res, { deleted: true });
  }),
);

const budgetSchema = z.object({
  income: z.number().nonnegative().optional(),
  savingsTarget: z.number().nonnegative().optional(),
  categoryBudgets: z.record(z.string(), z.number().nonnegative()).optional(),
});

financeRouter.get(
  '/budget/:month',
  asyncHandler(async (req, res) => ok(res, await svc.getBudgetSummary(req.params.month))),
);

financeRouter.put(
  '/budget/:month',
  validateBody(budgetSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertBudget(req.params.month, req.body))),
);

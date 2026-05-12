import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/finance';

export const financeRouter = Router();

// ── Transactions ─────────────────────────────────────
const txSchema = z.object({
  date: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(['Income', 'Expense']),
  category: z.string().min(1),
  description: z.string().optional(),
  accountId: z.string().uuid().optional().nullable(),
  recurringId: z.string().uuid().optional().nullable(),
  merchant: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  currency: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  roundUp: z.boolean().optional(),
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
        accountId: req.query.accountId as string | undefined,
        tagId: req.query.tagId as string | undefined,
        search: req.query.search as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
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

// ── Budget ───────────────────────────────────────────
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

// ── Accounts ─────────────────────────────────────────
const accountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['Cash', 'Bank', 'Credit Card', 'UPI Wallet', 'Investment', 'Other']),
  openingBalance: z.number().optional(),
  currency: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  includeInNetWorth: z.boolean().optional(),
});

financeRouter.get('/accounts', asyncHandler(async (_req, res) => ok(res, await svc.listAccounts())));
financeRouter.post('/accounts', validateBody(accountSchema), asyncHandler(async (req, res) => ok(res, await svc.createAccount(req.body), 201)));
financeRouter.put(
  '/accounts/:id',
  validateBody(accountSchema.partial().extend({ archived: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateAccount(req.params.id, req.body))),
);
financeRouter.delete('/accounts/:id', asyncHandler(async (req, res) => {
  await svc.deleteAccount(req.params.id);
  ok(res, { deleted: true });
}));

financeRouter.post(
  '/accounts/transfer',
  validateBody(z.object({ fromId: z.string().uuid(), toId: z.string().uuid(), amount: z.number().positive(), date: z.string().optional(), description: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.transferBetweenAccounts(req.body))),
);

// ── Savings goals ────────────────────────────────────
const goalSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional(),
  targetAmount: z.number().positive(),
  deadline: z.string().nullable().optional(),
  color: z.string().optional(),
});

financeRouter.get('/goals', asyncHandler(async (_req, res) => ok(res, await svc.listGoals())));
financeRouter.post('/goals', validateBody(goalSchema), asyncHandler(async (req, res) => ok(res, await svc.createGoal(req.body), 201)));
financeRouter.put(
  '/goals/:id',
  validateBody(goalSchema.partial().extend({ archived: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateGoal(req.params.id, req.body))),
);
financeRouter.delete('/goals/:id', asyncHandler(async (req, res) => {
  await svc.deleteGoal(req.params.id);
  ok(res, { deleted: true });
}));
financeRouter.post(
  '/goals/:id/contribute',
  validateBody(z.object({ amount: z.number().positive(), notes: z.string().optional(), source: z.string().optional(), date: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.contributeToGoal(req.params.id, req.body))),
);

// ── Debts ────────────────────────────────────────────
const debtSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  principal: z.number().positive(),
  balance: z.number().optional(),
  interestRate: z.number().optional(),
  emi: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

financeRouter.get('/debts', asyncHandler(async (_req, res) => ok(res, await svc.listDebts())));
financeRouter.post('/debts', validateBody(debtSchema), asyncHandler(async (req, res) => ok(res, await svc.createDebt(req.body), 201)));
financeRouter.put('/debts/:id', validateBody(debtSchema.partial()), asyncHandler(async (req, res) => ok(res, await svc.updateDebt(req.params.id, req.body))));
financeRouter.delete('/debts/:id', asyncHandler(async (req, res) => {
  await svc.deleteDebt(req.params.id);
  ok(res, { deleted: true });
}));
financeRouter.post(
  '/debts/:id/pay',
  validateBody(z.object({ amount: z.number().positive(), date: z.string().optional(), notes: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.payDebt(req.params.id, req.body))),
);

// ── Investments ──────────────────────────────────────
const investmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  symbol: z.string().optional(),
  quantity: z.number().optional(),
  costBasis: z.number().optional(),
  currentValue: z.number().optional(),
  firstBoughtOn: z.string().optional(),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

financeRouter.get('/investments', asyncHandler(async (_req, res) => ok(res, await svc.listInvestments())));
financeRouter.post('/investments', validateBody(investmentSchema), asyncHandler(async (req, res) => ok(res, await svc.createInvestment(req.body), 201)));
financeRouter.put(
  '/investments/:id',
  validateBody(investmentSchema.partial().extend({ archived: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateInvestment(req.params.id, req.body))),
);
financeRouter.delete('/investments/:id', asyncHandler(async (req, res) => {
  await svc.deleteInvestment(req.params.id);
  ok(res, { deleted: true });
}));
financeRouter.post(
  '/investments/:id/log',
  validateBody(z.object({
    action: z.enum(['Buy', 'Sell', 'SIP', 'Dividend', 'Interest']),
    quantity: z.number().optional(),
    amount: z.number().positive(),
    date: z.string().optional(),
    notes: z.string().optional(),
  })),
  asyncHandler(async (req, res) => ok(res, await svc.logInvestmentTxn(req.params.id, req.body))),
);

// ── Recurring ────────────────────────────────────────
const recurringSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['Income', 'Expense']),
  category: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  nextDue: z.string().optional(),
  accountId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  isSubscription: z.boolean().optional(),
});

financeRouter.get('/recurring', asyncHandler(async (_req, res) => ok(res, await svc.listRecurring())));
financeRouter.post('/recurring', validateBody(recurringSchema), asyncHandler(async (req, res) => ok(res, await svc.createRecurring(req.body), 201)));
financeRouter.put(
  '/recurring/:id',
  validateBody(recurringSchema.partial().extend({ paused: z.boolean().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.updateRecurring(req.params.id, req.body))),
);
financeRouter.post('/recurring/:id/cancel', asyncHandler(async (req, res) => ok(res, await svc.cancelRecurring(req.params.id))));
financeRouter.post(
  '/recurring/:id/confirm',
  validateBody(z.object({ date: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.confirmRecurringDue(req.params.id, req.body))),
);
financeRouter.post('/recurring/process-due', asyncHandler(async (_req, res) => ok(res, await svc.processDueRecurring())));
financeRouter.delete('/recurring/:id', asyncHandler(async (req, res) => {
  await svc.deleteRecurring(req.params.id);
  ok(res, { deleted: true });
}));

// ── Tags ─────────────────────────────────────────────
financeRouter.get('/tags', asyncHandler(async (_req, res) => ok(res, await svc.listTags())));
financeRouter.post(
  '/tags',
  validateBody(z.object({ name: z.string().min(1), color: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await svc.createTag(req.body), 201)),
);
financeRouter.delete('/tags/:id', asyncHandler(async (req, res) => {
  await svc.deleteTag(req.params.id);
  ok(res, { deleted: true });
}));

// ── Net worth snapshots ─────────────────────────────
financeRouter.get('/net-worth', asyncHandler(async (_req, res) => ok(res, await svc.listNetWorthSnapshots())));
financeRouter.post(
  '/net-worth/snapshot',
  validateBody(z.object({
    date: z.string().optional(),
    assets: z.number().optional(),
    liabilities: z.number().optional(),
    notes: z.string().optional(),
  })),
  asyncHandler(async (req, res) => ok(res, await svc.createNetWorthSnapshot(req.body))),
);

// ── Challenges ──────────────────────────────────────
financeRouter.get('/challenges', asyncHandler(async (_req, res) => ok(res, await svc.listActiveChallenges())));
financeRouter.post(
  '/challenges',
  validateBody(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    target: z.number().int().positive().optional(),
    xpReward: z.number().int().positive().optional(),
    period: z.enum(['weekly', 'monthly', 'oneshot']).optional(),
    startsOn: z.string().optional(),
    endsOn: z.string().optional(),
  })),
  asyncHandler(async (req, res) => ok(res, await svc.createChallengeManually(req.body), 201)),
);
financeRouter.post('/challenges/:id/complete', asyncHandler(async (req, res) => ok(res, await svc.completeChallengeManually(req.params.id))));
financeRouter.delete('/challenges/:id', asyncHandler(async (req, res) => {
  await svc.deleteChallenge(req.params.id);
  ok(res, { deleted: true });
}));

// ── Stats / reports ─────────────────────────────────
financeRouter.get(
  '/stats',
  asyncHandler(async (req, res) =>
    ok(res, await svc.getVaultStats({ months: req.query.months ? Number(req.query.months) : undefined })),
  ),
);
financeRouter.get('/subscriptions', asyncHandler(async (_req, res) => ok(res, await svc.getSubscriptionsSummary())));

// ── Vault game (XP/title/streak) ────────────────────
financeRouter.get('/game', asyncHandler(async (_req, res) => ok(res, await svc.getVaultGame())));

// ── Settings ────────────────────────────────────────
financeRouter.get('/settings', asyncHandler(async (_req, res) => ok(res, await svc.getSettings())));
financeRouter.put(
  '/settings',
  validateBody(z.object({
    roundUpEnabled: z.boolean().optional(),
    roundUpTo: z.number().int().positive().optional(),
    roundUpGoalId: z.string().uuid().nullable().optional(),
    calculatorUsed: z.boolean().optional(),
    annualReportExported: z.boolean().optional(),
  })),
  asyncHandler(async (req, res) => ok(res, await svc.updateSettings(req.body))),
);
financeRouter.post('/reports/weekly-seen', asyncHandler(async (_req, res) => ok(res, await svc.markWeeklyReportSeen())));
financeRouter.post('/reports/monthly-seen', asyncHandler(async (_req, res) => ok(res, await svc.markMonthlyReportSeen())));

// ── Quick-add templates ─────────────────────────────
financeRouter.get('/templates', asyncHandler(async (_req, res) => ok(res, await svc.listTemplates())));
financeRouter.post(
  '/templates',
  validateBody(z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
    type: z.enum(['Income', 'Expense']),
    category: z.string().min(1),
    description: z.string().optional(),
    emoji: z.string().optional(),
  })),
  asyncHandler(async (req, res) => ok(res, await svc.createTemplate(req.body), 201)),
);
financeRouter.post('/templates/:id/use', asyncHandler(async (req, res) => ok(res, await svc.useTemplate(req.params.id), 201)));
financeRouter.delete('/templates/:id', asyncHandler(async (req, res) => {
  await svc.deleteTemplate(req.params.id);
  ok(res, { deleted: true });
}));

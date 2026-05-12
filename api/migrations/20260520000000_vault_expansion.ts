import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Extend existing transactions with new columns ─────────────
  await knex.schema.alterTable('transactions', (t) => {
    t.uuid('account_id').nullable();
    t.uuid('recurring_id').nullable();
    t.text('merchant').nullable();
    t.text('receipt_url').nullable();
    t.text('currency').notNullable().defaultTo('INR');
    t.timestamp('logged_at', { useTz: true });
  });
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date)`,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category)`,
  );
  await knex.raw(
    `CREATE INDEX IF NOT EXISTS transactions_account_idx ON transactions(account_id)`,
  );

  // Vault tags table (separate namespace from the existing quests tags) ─
  await knex.schema.createTable('vault_tags', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable().unique();
    t.text('color').notNullable().defaultTo('#fbbf24');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('transaction_tags', (t) => {
    t.uuid('transaction_id').notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    t.uuid('tag_id').notNullable().references('id').inTable('vault_tags').onDelete('CASCADE');
    t.primary(['transaction_id', 'tag_id']);
  });

  // Accounts ─────────────────────────────────────────
  await knex.schema.createTable('accounts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('type').notNullable(); // Cash, Bank, Credit Card, UPI Wallet, Investment, Other
    t.decimal('opening_balance', 14, 2).notNullable().defaultTo(0);
    t.text('currency').notNullable().defaultTo('INR');
    t.text('color').notNullable().defaultTo('#fbbf24');
    t.text('icon').nullable();
    t.boolean('include_in_net_worth').notNullable().defaultTo(true);
    t.boolean('archived').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE accounts ADD CONSTRAINT accounts_type_chk
       CHECK (type IN ('Cash','Bank','Credit Card','UPI Wallet','Investment','Other'))`,
  );

  // Savings goals ────────────────────────────────────
  await knex.schema.createTable('savings_goals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('emoji').notNullable().defaultTo('🎯');
    t.decimal('target_amount', 14, 2).notNullable();
    t.decimal('current_amount', 14, 2).notNullable().defaultTo(0);
    t.date('deadline').nullable();
    t.text('color').notNullable().defaultTo('#fbbf24');
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.boolean('archived').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('savings_contributions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('goal_id').notNullable().references('id').inTable('savings_goals').onDelete('CASCADE');
    t.decimal('amount', 14, 2).notNullable();
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('source').nullable(); // 'manual', 'round_up', 'auto'
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Debts ────────────────────────────────────────────
  await knex.schema.createTable('debts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('type').notNullable(); // Loan, Credit Card, Personal, Mortgage, Other
    t.decimal('principal', 14, 2).notNullable();
    t.decimal('balance', 14, 2).notNullable();
    t.decimal('interest_rate', 5, 2).nullable();
    t.decimal('emi', 14, 2).nullable();
    t.date('start_date').nullable();
    t.date('end_date').nullable();
    t.integer('due_day').nullable();
    t.boolean('cleared').notNullable().defaultTo(false);
    t.timestamp('cleared_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('debt_payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('debt_id').notNullable().references('id').inTable('debts').onDelete('CASCADE');
    t.decimal('amount', 14, 2).notNullable();
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Investments ──────────────────────────────────────
  await knex.schema.createTable('investments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('type').notNullable(); // Stock, MF, FD, Gold, Crypto, Bond, Other
    t.text('symbol').nullable();
    t.decimal('quantity', 18, 6).notNullable().defaultTo(0);
    t.decimal('cost_basis', 14, 2).notNullable().defaultTo(0);
    t.decimal('current_value', 14, 2).notNullable().defaultTo(0);
    t.date('first_bought_on').nullable();
    t.text('platform').nullable();
    t.text('notes').nullable();
    t.boolean('archived').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('investment_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('investment_id').notNullable().references('id').inTable('investments').onDelete('CASCADE');
    t.text('action').notNullable(); // Buy, Sell, SIP, Dividend, Interest
    t.decimal('quantity', 18, 6).nullable();
    t.decimal('amount', 14, 2).notNullable();
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE investment_transactions ADD CONSTRAINT inv_txn_action_chk
       CHECK (action IN ('Buy','Sell','SIP','Dividend','Interest'))`,
  );

  // Recurring transactions ───────────────────────────
  await knex.schema.createTable('recurring_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.decimal('amount', 14, 2).notNullable();
    t.text('type').notNullable(); // Income / Expense
    t.text('category').notNullable();
    t.text('frequency').notNullable(); // daily, weekly, monthly, yearly
    t.integer('interval').notNullable().defaultTo(1);
    t.date('next_due').notNullable();
    t.date('start_date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.date('end_date').nullable();
    t.uuid('account_id').nullable();
    t.text('description').nullable();
    t.boolean('is_subscription').notNullable().defaultTo(false);
    t.boolean('cancelled').notNullable().defaultTo(false);
    t.timestamp('cancelled_at', { useTz: true }).nullable();
    t.boolean('paused').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_freq_chk
       CHECK (frequency IN ('daily','weekly','monthly','yearly'))`,
  );

  // Net worth snapshots ──────────────────────────────
  await knex.schema.createTable('net_worth_snapshots', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.decimal('assets', 14, 2).notNullable().defaultTo(0);
    t.decimal('liabilities', 14, 2).notNullable().defaultTo(0);
    t.decimal('net_worth', 14, 2).notNullable().defaultTo(0);
    t.text('notes').nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Vault challenges (separate from forge/global daily_challenges) ──
  await knex.schema.createTable('vault_challenges', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('key').notNullable();
    t.text('title').notNullable();
    t.text('description').notNullable();
    t.text('period').notNullable(); // weekly / monthly / oneshot
    t.integer('target').notNullable().defaultTo(1);
    t.integer('progress').notNullable().defaultTo(0);
    t.integer('xp_reward').notNullable().defaultTo(100);
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.date('starts_on').notNullable();
    t.date('ends_on').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS vault_challenges_active_uq
       ON vault_challenges(key, starts_on, ends_on)`,
  );

  // Vault settings (singleton row for round-ups, calculator-used etc.)
  await knex.schema.createTable('vault_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.boolean('round_up_enabled').notNullable().defaultTo(false);
    t.integer('round_up_to').notNullable().defaultTo(10);
    t.uuid('round_up_goal_id').nullable();
    t.boolean('calculator_used').notNullable().defaultTo(false);
    t.boolean('annual_report_exported').notNullable().defaultTo(false);
    t.integer('weekly_report_streak').notNullable().defaultTo(0);
    t.date('weekly_report_last_seen').nullable();
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Recurring quick-add templates ────────────────────
  await knex.schema.createTable('vault_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.decimal('amount', 14, 2).notNullable();
    t.text('type').notNullable(); // Income / Expense
    t.text('category').notNullable();
    t.text('description').nullable();
    t.text('emoji').nullable();
    t.integer('use_count').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('vault_templates');
  await knex.schema.dropTableIfExists('vault_settings');
  await knex.schema.dropTableIfExists('vault_challenges');
  await knex.schema.dropTableIfExists('net_worth_snapshots');
  await knex.schema.dropTableIfExists('recurring_transactions');
  await knex.schema.dropTableIfExists('investment_transactions');
  await knex.schema.dropTableIfExists('investments');
  await knex.schema.dropTableIfExists('debt_payments');
  await knex.schema.dropTableIfExists('debts');
  await knex.schema.dropTableIfExists('savings_contributions');
  await knex.schema.dropTableIfExists('savings_goals');
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('transaction_tags');
  await knex.schema.dropTableIfExists('vault_tags');
  await knex.schema.alterTable('transactions', (t) => {
    t.dropColumn('account_id');
    t.dropColumn('recurring_id');
    t.dropColumn('merchant');
    t.dropColumn('receipt_url');
    t.dropColumn('currency');
    t.dropColumn('logged_at');
  });
}

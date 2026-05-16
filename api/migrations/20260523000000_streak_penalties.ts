import type { Knex } from 'knex';

// Adds the weekly-consistency-penalty infrastructure:
//   - streaks gets `last_penalty_date` (idempotency guard) and `penalty_paused_until`
//     (vacation mode hook for later).
//   - new `xp_penalties` table records every deduction for audit + user-facing history.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streaks', (t) => {
    t.date('last_penalty_date').nullable();
    t.date('penalty_paused_until').nullable();
  });

  await knex.schema.createTable('xp_penalties', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('module').notNullable();
    t.integer('days_logged').notNullable();
    t.integer('shortfall').notNullable();
    t.integer('level_at_time').notNullable();
    t.integer('xp_lost').notNullable();
    t.text('reason').notNullable().defaultTo('weekly_consistency');
    t.timestamp('applied_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('xp_penalties', (t) => {
    t.index(['module', 'applied_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('xp_penalties');
  await knex.schema.alterTable('streaks', (t) => {
    t.dropColumn('last_penalty_date');
    t.dropColumn('penalty_paused_until');
  });
}

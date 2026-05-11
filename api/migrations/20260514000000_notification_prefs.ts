import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_settings', (t) => {
    t.boolean('workout_reminder_enabled').notNullable().defaultTo(false);
    t.integer('reminder_hour').notNullable().defaultTo(7);
    t.integer('reminder_minute').notNullable().defaultTo(0);
    t.boolean('streak_at_risk_enabled').notNullable().defaultTo(true);
    t.boolean('weekly_summary_enabled').notNullable().defaultTo(true);
  });
  await knex.raw(`ALTER TABLE user_settings ADD CONSTRAINT reminder_hour_chk
    CHECK (reminder_hour BETWEEN 0 AND 23)`);
  await knex.raw(`ALTER TABLE user_settings ADD CONSTRAINT reminder_minute_chk
    CHECK (reminder_minute BETWEEN 0 AND 59)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS reminder_hour_chk');
  await knex.raw('ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS reminder_minute_chk');
  await knex.schema.alterTable('user_settings', (t) => {
    t.dropColumn('workout_reminder_enabled');
    t.dropColumn('reminder_hour');
    t.dropColumn('reminder_minute');
    t.dropColumn('streak_at_risk_enabled');
    t.dropColumn('weekly_summary_enabled');
  });
}

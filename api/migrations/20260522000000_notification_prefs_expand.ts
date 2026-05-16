import type { Knex } from 'knex';

// Extends user_settings with per-module notification toggles + hours, plus the
// gamification penalties feature flag. Designed to be additive — existing dojo
// columns from 20260514000000_notification_prefs.ts are untouched.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_settings', (t) => {
    // Forge
    t.boolean('forge_code_reminder_enabled').notNullable().defaultTo(false);
    t.integer('forge_code_reminder_hour').notNullable().defaultTo(19);
    t.integer('forge_code_reminder_minute').notNullable().defaultTo(0);
    t.boolean('forge_streak_at_risk_enabled').notNullable().defaultTo(true);
    t.boolean('forge_weekly_summary_enabled').notNullable().defaultTo(true);

    // Spirit — meal & habit reminders
    t.boolean('spirit_meal_reminders_enabled').notNullable().defaultTo(false);
    t.integer('spirit_breakfast_hour').notNullable().defaultTo(8);
    t.integer('spirit_lunch_hour').notNullable().defaultTo(13);
    t.integer('spirit_dinner_hour').notNullable().defaultTo(19);
    t.boolean('spirit_hydration_enabled').notNullable().defaultTo(false);
    t.integer('spirit_hydration_start_hour').notNullable().defaultTo(9);
    t.integer('spirit_hydration_end_hour').notNullable().defaultTo(21);
    t.integer('spirit_hydration_interval_hours').notNullable().defaultTo(2);
    t.boolean('spirit_wind_down_enabled').notNullable().defaultTo(false);
    t.integer('spirit_bedtime_hour').notNullable().defaultTo(23);
    t.integer('spirit_bedtime_minute').notNullable().defaultTo(0);
    t.boolean('spirit_habit_streak_at_risk_enabled').notNullable().defaultTo(true);

    // Vault
    t.boolean('vault_weekly_review_enabled').notNullable().defaultTo(true);
    t.integer('vault_weekly_review_weekday').notNullable().defaultTo(1); // 1 = Sunday
    t.integer('vault_weekly_review_hour').notNullable().defaultTo(19);
    t.boolean('vault_subscription_alerts_enabled').notNullable().defaultTo(true);

    // Quest
    t.boolean('quest_daily_summary_enabled').notNullable().defaultTo(false);
    t.integer('quest_daily_summary_hour').notNullable().defaultTo(20);

    // Gamification flags
    t.boolean('penalties_enabled').notNullable().defaultTo(false);
  });

  await knex.raw(`
    ALTER TABLE user_settings
      ADD CONSTRAINT forge_code_reminder_hour_chk CHECK (forge_code_reminder_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT forge_code_reminder_minute_chk CHECK (forge_code_reminder_minute BETWEEN 0 AND 59),
      ADD CONSTRAINT spirit_breakfast_hour_chk CHECK (spirit_breakfast_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_lunch_hour_chk CHECK (spirit_lunch_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_dinner_hour_chk CHECK (spirit_dinner_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_hydration_start_chk CHECK (spirit_hydration_start_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_hydration_end_chk CHECK (spirit_hydration_end_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_hydration_interval_chk CHECK (spirit_hydration_interval_hours BETWEEN 1 AND 8),
      ADD CONSTRAINT spirit_bedtime_hour_chk CHECK (spirit_bedtime_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT spirit_bedtime_minute_chk CHECK (spirit_bedtime_minute BETWEEN 0 AND 59),
      ADD CONSTRAINT vault_weekly_weekday_chk CHECK (vault_weekly_review_weekday BETWEEN 1 AND 7),
      ADD CONSTRAINT vault_weekly_hour_chk CHECK (vault_weekly_review_hour BETWEEN 0 AND 23),
      ADD CONSTRAINT quest_daily_hour_chk CHECK (quest_daily_summary_hour BETWEEN 0 AND 23)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE user_settings
      DROP CONSTRAINT IF EXISTS forge_code_reminder_hour_chk,
      DROP CONSTRAINT IF EXISTS forge_code_reminder_minute_chk,
      DROP CONSTRAINT IF EXISTS spirit_breakfast_hour_chk,
      DROP CONSTRAINT IF EXISTS spirit_lunch_hour_chk,
      DROP CONSTRAINT IF EXISTS spirit_dinner_hour_chk,
      DROP CONSTRAINT IF EXISTS spirit_hydration_start_chk,
      DROP CONSTRAINT IF EXISTS spirit_hydration_end_chk,
      DROP CONSTRAINT IF EXISTS spirit_hydration_interval_chk,
      DROP CONSTRAINT IF EXISTS spirit_bedtime_hour_chk,
      DROP CONSTRAINT IF EXISTS spirit_bedtime_minute_chk,
      DROP CONSTRAINT IF EXISTS vault_weekly_weekday_chk,
      DROP CONSTRAINT IF EXISTS vault_weekly_hour_chk,
      DROP CONSTRAINT IF EXISTS quest_daily_hour_chk
  `);
  await knex.schema.alterTable('user_settings', (t) => {
    t.dropColumn('forge_code_reminder_enabled');
    t.dropColumn('forge_code_reminder_hour');
    t.dropColumn('forge_code_reminder_minute');
    t.dropColumn('forge_streak_at_risk_enabled');
    t.dropColumn('forge_weekly_summary_enabled');
    t.dropColumn('spirit_meal_reminders_enabled');
    t.dropColumn('spirit_breakfast_hour');
    t.dropColumn('spirit_lunch_hour');
    t.dropColumn('spirit_dinner_hour');
    t.dropColumn('spirit_hydration_enabled');
    t.dropColumn('spirit_hydration_start_hour');
    t.dropColumn('spirit_hydration_end_hour');
    t.dropColumn('spirit_hydration_interval_hours');
    t.dropColumn('spirit_wind_down_enabled');
    t.dropColumn('spirit_bedtime_hour');
    t.dropColumn('spirit_bedtime_minute');
    t.dropColumn('spirit_habit_streak_at_risk_enabled');
    t.dropColumn('vault_weekly_review_enabled');
    t.dropColumn('vault_weekly_review_weekday');
    t.dropColumn('vault_weekly_review_hour');
    t.dropColumn('vault_subscription_alerts_enabled');
    t.dropColumn('quest_daily_summary_enabled');
    t.dropColumn('quest_daily_summary_hour');
    t.dropColumn('penalties_enabled');
  });
}

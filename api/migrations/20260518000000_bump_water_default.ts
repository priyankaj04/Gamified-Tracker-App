import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Bump existing nutrition_goals rows from the legacy 2500ml default to 4000ml.
  // Leaves user-customised values (anything not equal to 2500) untouched.
  await knex.raw(`
    UPDATE nutrition_goals
    SET water_ml = 4000, updated_at = NOW()
    WHERE water_ml IS NULL OR water_ml = 2500
  `);
  // Update the column default so any future inserts also use 4000ml.
  await knex.raw(`ALTER TABLE nutrition_goals ALTER COLUMN water_ml SET DEFAULT 4000`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE nutrition_goals ALTER COLUMN water_ml SET DEFAULT 2500`);
}

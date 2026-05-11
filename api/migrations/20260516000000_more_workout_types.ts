import type { Knex } from 'knex';

const TYPES = [
  'Strength', 'Cardio', 'Flexibility', 'Combat', 'Mixed',
  'Plyometrics', 'Calisthenics', 'Sports', 'HIIT', 'Mobility',
];

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_type_chk');
  await knex.raw(`ALTER TABLE workouts ADD CONSTRAINT workouts_type_chk
    CHECK (type IN (${TYPES.map((t) => `'${t}'`).join(',')}))`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_type_chk');
  await knex.raw(`ALTER TABLE workouts ADD CONSTRAINT workouts_type_chk
    CHECK (type IN ('Strength','Cardio','Flexibility','Combat','Mixed'))`);
}

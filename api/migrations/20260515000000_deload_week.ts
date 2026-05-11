import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routines', (t) => {
    t.boolean('is_deload_week').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('routines', (t) => {
    t.dropColumn('is_deload_week');
  });
}

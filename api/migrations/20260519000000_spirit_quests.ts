import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('spirit_quests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('quest_key').notNullable();
    t.text('title').notNullable();
    t.text('description');
    t.integer('target').notNullable();
    t.integer('progress').notNullable().defaultTo(0);
    t.boolean('completed').notNullable().defaultTo(false);
    t.boolean('claimed').notNullable().defaultTo(false);
    t.integer('xp_reward').notNullable();
    t.text('icon').notNullable().defaultTo('star');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['date', 'quest_key']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('spirit_quests');
}

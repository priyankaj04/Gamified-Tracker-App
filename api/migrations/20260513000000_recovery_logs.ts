import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('recovery_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.decimal('sleep_hours', 4, 1);
    t.integer('sleep_quality'); // 1..5
    t.integer('energy_level'); // 1..5
    t.jsonb('soreness').notNullable().defaultTo(knex.raw(`'{}'::jsonb`));
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(`ALTER TABLE recovery_logs ADD CONSTRAINT recovery_sleep_q_chk
    CHECK (sleep_quality IS NULL OR sleep_quality BETWEEN 1 AND 5)`);
  await knex.raw(`ALTER TABLE recovery_logs ADD CONSTRAINT recovery_energy_chk
    CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 5)`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('recovery_logs');
}

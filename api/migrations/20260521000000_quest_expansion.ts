import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── Extend quests table with rich-feature columns ───────────
  await knex.schema.alterTable('quests', (t) => {
    t.text('description').nullable();
    t.integer('estimated_minutes').nullable();
    t.integer('actual_minutes').nullable();
    t.jsonb('recurrence').nullable();
    t.timestamp('remind_at', { useTz: true }).nullable();
    t.uuid('parent_quest_id').nullable();
    t.text('difficulty').nullable();
    t.integer('display_order').notNullable().defaultTo(0);
    t.timestamp('archived_at', { useTz: true }).nullable();
    t.boolean('is_boss').notNullable().defaultTo(false);
    t.date('last_rollover_date').nullable();
    t.uuid('template_id').nullable();
    t.uuid('linked_module_id').nullable();
    t.text('linked_module').nullable();
  });

  await knex.raw(`
    ALTER TABLE quests
      ADD CONSTRAINT quests_parent_fk
      FOREIGN KEY (parent_quest_id) REFERENCES quests(id) ON DELETE SET NULL
  `);
  await knex.raw(`
    ALTER TABLE quests
      ADD CONSTRAINT quests_difficulty_chk
      CHECK (difficulty IS NULL OR difficulty IN ('Trivial','Normal','Hard','Boss'))
  `);

  await knex.raw(`CREATE INDEX IF NOT EXISTS quests_archived_idx ON quests(archived_at)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS quests_due_idx ON quests(due_date)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS quests_parent_idx ON quests(parent_quest_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS quests_completed_idx ON quests(completed)`);

  // ── Subtasks / checklist ─────────────────────────────────────
  await knex.schema.createTable('quest_steps', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('quest_id').notNullable().references('id').inTable('quests').onDelete('CASCADE');
    t.text('label').notNullable();
    t.boolean('done').notNullable().defaultTo(false);
    t.timestamp('done_at', { useTz: true }).nullable();
    t.integer('order_index').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(`CREATE INDEX IF NOT EXISTS quest_steps_quest_idx ON quest_steps(quest_id)`);

  // ── Quest templates ─────────────────────────────────────────
  await knex.schema.createTable('quest_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('title').notNullable();
    t.text('priority').notNullable().defaultTo('C');
    t.text('difficulty').nullable();
    t.boolean('is_daily').notNullable().defaultTo(false);
    t.boolean('is_boss').notNullable().defaultTo(false);
    t.jsonb('recurrence').nullable();
    t.integer('estimated_minutes').nullable();
    t.text('notes').nullable();
    t.jsonb('tag_ids').notNullable().defaultTo('[]');
    t.jsonb('step_labels').notNullable().defaultTo('[]');
    t.integer('use_count').notNullable().defaultTo(0);
    t.timestamp('last_used_at', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── Active quest timer (single row) ─────────────────────────
  await knex.schema.createTable('quest_active_timer', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('quest_id').notNullable().references('id').inTable('quests').onDelete('CASCADE');
    t.timestamp('started_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.integer('elapsed_sec').notNullable().defaultTo(0);
    t.boolean('is_running').notNullable().defaultTo(true);
  });

  // ── Combo tracking ──────────────────────────────────────────
  await knex.schema.createTable('quest_combo', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('count').notNullable().defaultTo(0);
    t.timestamp('last_complete_at', { useTz: true }).nullable();
    t.timestamp('window_ends_at', { useTz: true }).nullable();
  });
  await knex('quest_combo').insert({ count: 0 });

  // ── Quest settings (single row) ─────────────────────────────
  await knex.schema.createTable('quest_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('default_priority').notNullable().defaultTo('C');
    t.text('default_tab').notNullable().defaultTo('Active');
    t.integer('auto_archive_days').notNullable().defaultTo(30);
    t.integer('reminder_offset_minutes').notNullable().defaultTo(60);
    t.boolean('sounds_enabled').notNullable().defaultTo(true);
    t.boolean('combo_enabled').notNullable().defaultTo(true);
    t.boolean('penalty_enabled').notNullable().defaultTo(false);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex('quest_settings').insert({});

  // ── Weekly / monthly challenges ─────────────────────────────
  await knex.schema.createTable('quest_challenges', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('key').notNullable();
    t.text('title').notNullable();
    t.text('description').nullable();
    t.text('period').notNullable(); // weekly | monthly
    t.integer('target').notNullable();
    t.integer('progress').notNullable().defaultTo(0);
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true }).nullable();
    t.integer('xp_reward').notNullable().defaultTo(100);
    t.date('starts_on').notNullable();
    t.date('ends_on').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['key', 'starts_on']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('quest_challenges');
  await knex.schema.dropTableIfExists('quest_settings');
  await knex.schema.dropTableIfExists('quest_combo');
  await knex.schema.dropTableIfExists('quest_active_timer');
  await knex.schema.dropTableIfExists('quest_templates');
  await knex.schema.dropTableIfExists('quest_steps');
  await knex.raw(`ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_parent_fk`);
  await knex.raw(`ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_difficulty_chk`);
  await knex.schema.alterTable('quests', (t) => {
    t.dropColumn('description');
    t.dropColumn('estimated_minutes');
    t.dropColumn('actual_minutes');
    t.dropColumn('recurrence');
    t.dropColumn('remind_at');
    t.dropColumn('parent_quest_id');
    t.dropColumn('difficulty');
    t.dropColumn('display_order');
    t.dropColumn('archived_at');
    t.dropColumn('is_boss');
    t.dropColumn('last_rollover_date');
    t.dropColumn('template_id');
    t.dropColumn('linked_module_id');
    t.dropColumn('linked_module');
  });
}

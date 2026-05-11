import 'dotenv/config';
import type { Knex } from 'knex';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required for migrations. Get it from Supabase → Project Settings → Database → Connection string (URI).',
  );
}

const config: { [env: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      connectionString,
      // Supabase requires TLS for direct connections
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    pool: { min: 0, max: 4 },
  },
};

config.production = config.development;

export default config;

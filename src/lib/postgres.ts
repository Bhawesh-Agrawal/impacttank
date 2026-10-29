import { Pool } from 'pg';

let pool: Pool | null = null;

export const isPostgresConfigured = Boolean(process.env.DATABASE_URL);

export function getPostgresPool(): Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle Supabase PostgreSQL client:', err);
    });

    return pool;
  } catch (err) {
    console.error('Failed to create Supabase PostgreSQL pool:', err);
    return null;
  }
}


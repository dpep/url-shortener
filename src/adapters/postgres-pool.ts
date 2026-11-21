import { Pool } from 'pg';

export function createDatabasePool(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 2000 });
  pool.on('error', error => console.error('Postgres idle connection failed', error));
  return pool;
}

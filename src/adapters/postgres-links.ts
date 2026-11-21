import { Pool } from 'pg';

export async function openLinkRepository(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 2000 });
  pool.on('error', error => console.error('Postgres idle connection failed', error));

  try {
    await pool.query('SELECT slug, destination FROM links LIMIT 0');
  } catch (error) {
    await pool.end();
    throw error;
  }

  return {
    async get(slug: string) {
      const result = await pool.query<{ destination: string }>(
        'SELECT destination FROM links WHERE slug = $1', [slug],
      );
      return result.rows[0]?.destination ?? null;
    },
    async insert(slug: string, destination: string) {
      const result = await pool.query(
        'INSERT INTO links (slug, destination) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
        [slug, destination],
      );
      return result.rowCount === 1;
    },
    close: () => pool.end(),
  };
}

import { connectCache } from './adapters/valkey-cache.ts';
import { createApp } from './app.ts';
import { createDatabasePool } from './db/pool.ts';
import { createLinkRepository } from './repositories/links.ts';
import { createLinks } from './services/links.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) throw new Error('Ensure DATABASE_URL is set');
const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST?.trim() || '127.0.0.1';

const pool = createDatabasePool(databaseUrl);
const repository = await createLinkRepository(pool);
const cache = await connectCache();
const app = createApp(createLinks({ repository, cache }));

const listener = app.listen(port, host, error => {
  if (error) throw error;
  console.info('Redirect service listening on', listener.address());
});

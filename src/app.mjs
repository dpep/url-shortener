import { openLinkRepository } from './adapters/sqlite-links.mjs';
import { connectCache } from './adapters/valkey-cache.mjs';
import { createLinks } from './application/links.mjs';
import { redirectServer } from './http/redirect-server.mjs';

export async function startApp({ databasePath, port = 0, cachePrefix = '' }) {
  const repository = openLinkRepository(databasePath);
  let cache;
  try {
    cache = await connectCache(cachePrefix);
    repository.seed('launch', 'https://old.example/launch');
    const server = redirectServer(createLinks({ repository, cache }));

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });

    return {
      origin: `http://127.0.0.1:${server.address().port}`,
      disconnectCache: cache.close,
      async close() {
        try {
          await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
          });
        } finally {
          cache.close();
          repository.close();
        }
      },
    };
  } catch (error) {
    cache?.close();
    repository.close();
    throw error;
  }
}

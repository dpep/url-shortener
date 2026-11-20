import { openLinkRepository } from './adapters/sqlite-links.ts';
import { connectCache } from './adapters/valkey-cache.ts';
import { createLinks } from './application/links.ts';
import { redirectServer } from './http/redirect-server.ts';

interface AppOptions {
  databasePath: string;
  port?: number;
  cachePrefix?: string;
}

export async function startApp({ databasePath, port = 0, cachePrefix = '' }: AppOptions) {
  const repository = openLinkRepository(databasePath);
  let cache: Awaited<ReturnType<typeof connectCache>> | undefined;
  try {
    cache = await connectCache(cachePrefix);
    const connectedCache = cache;
    const server = redirectServer(createLinks({ repository, cache: connectedCache }));

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    return {
      origin: `http://127.0.0.1:${address.port}`,
      disconnectCache: connectedCache.close,
      async close() {
        try {
          await new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
          });
        } finally {
          connectedCache.close();
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

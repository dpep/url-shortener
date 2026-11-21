import { createServer } from 'node:http';
import { openLinkRepository } from './adapters/postgres-links.ts';
import { connectCache } from './adapters/valkey-cache.ts';
import { createApp } from './app.ts';
import { createLinks } from './application/links.ts';

interface AppOptions {
  databaseUrl: string;
  port?: number;
  host?: string;
  cachePrefix?: string;
}

export async function startApp({
  databaseUrl, port = 0, host = '127.0.0.1', cachePrefix = '',
}: AppOptions) {
  const repository = await openLinkRepository(databaseUrl);
  let cache: Awaited<ReturnType<typeof connectCache>> | undefined;
  try {
    cache = await connectCache(cachePrefix);
    const connectedCache = cache;
    const server = createServer(createApp(createLinks({ repository, cache: connectedCache })));

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    let reachableHost = address.address;
    if (reachableHost === '0.0.0.0') reachableHost = '127.0.0.1';
    if (reachableHost === '::') reachableHost = '::1';
    const originHost = address.family === 'IPv6' ? `[${reachableHost}]` : reachableHost;
    return {
      origin: `http://${originHost}:${address.port}`,
      disconnectCache: connectedCache.close,
      async close() {
        try {
          await new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
          });
        } finally {
          connectedCache.close();
          await repository.close();
        }
      },
    };
  } catch (error) {
    cache?.close();
    await repository.close();
    throw error;
  }
}

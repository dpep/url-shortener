import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { openLinkRepository } from './adapters/postgres-links.ts';
import { connectCache } from './adapters/valkey-cache.ts';
import { createApp } from './app.ts';
import { createLinks } from './services/links.ts';

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
  let closeCache: (() => void) | undefined;
  const closeDependencies = async () => {
    closeCache?.();
    await repository.close();
  };

  try {
    const cache = await connectCache(cachePrefix);
    closeCache = cache.close;
    const server = createApp(createLinks({ repository, cache })).listen(port, host);
    await once(server, 'listening');

    return {
      port: (server.address() as AddressInfo).port,
      disconnectCache: cache.close,
      async close() {
        try {
          await server[Symbol.asyncDispose]();
        } finally {
          await closeDependencies();
        }
      },
    };
  } catch (error) {
    await closeDependencies();
    throw error;
  }
}

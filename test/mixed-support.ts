import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { TestContext } from 'node:test';
import { connectCache } from '../src/adapters/valkey-cache.ts';
import { createApp } from '../src/app.ts';
import { createDatabasePool } from '../src/db/pool.ts';
import { createLinkRepository } from '../src/repositories/links.ts';
import { createLinkRoutes, linkMethods } from '../src/routes/link-routes.ts';
import { createLinks } from '../src/services/links.ts';
import { postgresFixture } from './postgres-fixture.ts';
import { originalDestination } from './support.ts';

export { newDestination, originalDestination } from './support.ts';

const current = {
  createApp, createLinks, createLinkRoutes, linkMethods, createDatabasePool, createLinkRepository, connectCache,
};

export async function fixture(t: TestContext, { baseline }: { baseline?: typeof current } = {}) {
  const { databaseUrl, cleanup } = await postgresFixture(t);
  const pool = createDatabasePool(databaseUrl);
  cleanup.push(() => pool.end());
  const database = await createLinkRepository(pool);
  await database.insert('docs', originalDestination);

  const cachePrefix = `test:${randomUUID()}:`;
  const cache = await connectCache(cachePrefix);
  cleanup.push(cache.close);

  async function start(version: typeof current) {
    const pool = version.createDatabasePool(databaseUrl);
    cleanup.push(() => pool.end());
    const repository = await version.createLinkRepository(pool);
    const cache = await version.connectCache(cachePrefix);
    cleanup.push(cache.close);

    const links = version.createLinks({ repository, cache });
    const app = version.createApp({
      routes: version.createLinkRoutes(links),
      corsOptions: { methods: version.linkMethods },
    });
    const listener = app.listen(0, '127.0.0.1');
    await once(listener, 'listening');
    cleanup.push(() => listener[Symbol.asyncDispose]());
    return {
      origin: `http://127.0.0.1:${(listener.address() as AddressInfo).port}`,
      disconnectCache: cache.close,
    };
  }

  const app = await start(current);
  const olderApp = baseline && await start(baseline);
  return { ...app, baselineOrigin: olderApp?.origin, cache, database };
}

export async function redirect(origin: string, slug = 'docs') {
  const response = await fetch(`${origin}/r/${slug}`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.headers.get('location');
}

export function patch(origin: string, destination: string, slug = 'docs') {
  return fetch(`${origin}/r/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination }),
  });
}

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import type { TestContext } from 'node:test';
import { openLinkRepository } from '../src/adapters/postgres-links.ts';
import { connectCache } from '../src/adapters/valkey-cache.ts';
import { createApp } from '../src/app.ts';
import { createLinks } from '../src/services/links.ts';
import { postgresFixture } from './postgres-fixture.ts';
import { originalDestination } from './support.ts';

export { newDestination, originalDestination } from './support.ts';

const current = { createApp, createLinks, openLinkRepository, connectCache };

export async function fixture(t: TestContext, { baseline }: { baseline?: typeof current } = {}) {
  const { databaseUrl, cleanup } = await postgresFixture(t);
  const database = await openLinkRepository(databaseUrl);
  cleanup.push(database.close);
  await database.insert('docs', originalDestination);

  const cachePrefix = `test:${randomUUID()}:`;
  const cache = await connectCache(cachePrefix);
  cleanup.push(cache.close);

  async function start(version: typeof current) {
    const repository = await version.openLinkRepository(databaseUrl);
    cleanup.push(repository.close);
    const cache = await version.connectCache(cachePrefix);
    cleanup.push(cache.close);

    const app = version.createApp(version.createLinks({ repository, cache }));
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

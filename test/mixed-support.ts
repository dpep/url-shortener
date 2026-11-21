import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { TestContext } from 'node:test';
import { openLinkRepository } from '../src/adapters/postgres-links.ts';
import { connectCache } from '../src/adapters/valkey-cache.ts';
import { startApp } from '../src/server.ts';

import { postgresFixture } from './postgres-fixture.ts';
import { originalDestination } from './support.ts';
export { newDestination, originalDestination } from './support.ts';

interface FixtureOptions {
  startBaseline?: typeof startApp;
}

export async function fixture(t: TestContext, { startBaseline }: FixtureOptions = {}) {
  const { databaseUrl, cleanup } = await postgresFixture(t);
  const database = await openLinkRepository(databaseUrl);
  cleanup.push(() => database.close());
  await database.insert('docs', originalDestination);

  const cachePrefix = `test:${randomUUID()}:`;
  const cache = await connectCache(cachePrefix);
  cleanup.push(() => cache.close());
  const app = await startApp({ databaseUrl, cachePrefix });
  cleanup.push(() => app.close());
  const baseline = startBaseline && await startBaseline({ databaseUrl, cachePrefix });
  if (baseline) cleanup.push(() => baseline.close());
  return {
    origin: `http://127.0.0.1:${app.port}`,
    baselineOrigin: baseline && `http://127.0.0.1:${baseline.port}`,
    disconnectCache: app.disconnectCache,
    cache,
    database,
  };
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

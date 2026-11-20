import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLinkRepository } from '../src/adapters/sqlite-links.mjs';
import { connectCache } from '../src/adapters/valkey-cache.mjs';
import { startApp } from '../src/app.mjs';

export const originalDestination = 'https://old.example/launch';

export const newDestination = 'https://new.example/launch';

export async function fixture(t, startBaseline) {
  const directory = mkdtempSync(join(tmpdir(), 'short-link-review-'));
  const cleanup = [() => rmSync(directory, { recursive: true, force: true })];
  t.after(async () => {
    for (const dispose of cleanup.reverse()) await dispose();
  });

  const databasePath = join(directory, 'links.sqlite');
  const cachePrefix = `test:${randomUUID()}:`;
  const cache = await connectCache(cachePrefix);
  cleanup.push(() => cache.close());
  const app = await startApp({ databasePath, cachePrefix });
  cleanup.push(() => app.close());
  const database = openLinkRepository(databasePath);
  cleanup.push(() => database.close());

  const baseline = startBaseline && await startBaseline({ databasePath, cachePrefix });
  if (baseline) cleanup.push(() => baseline.close());
  return { ...app, baselineOrigin: baseline?.origin, cache, database };
}

export async function redirect(origin, slug = 'launch') {
  const response = await fetch(`${origin}/r/${slug}`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.headers.get('location');
}

export function patch(origin, destination, slug = 'launch') {
  return fetch(`${origin}/r/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination }),
  });
}

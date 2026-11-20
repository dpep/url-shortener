import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connectCache } from '../src/adapters/valkey-cache.mjs';
import { startApp } from '../src/app.mjs';

export const originalDestination = 'https://old.example/launch';

export async function fixture(t) {
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
  return { ...app, cache };
}

export async function redirect(origin, slug = 'launch') {
  const response = await fetch(`${origin}/r/${slug}`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.headers.get('location');
}

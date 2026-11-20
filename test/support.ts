import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestContext } from 'node:test';
import { openLinkRepository } from '../src/adapters/sqlite-links.ts';
import { connectCache } from '../src/adapters/valkey-cache.ts';
import { startApp } from '../src/app.ts';

export const originalDestination = 'https://old.example/launch';

export async function fixture(t: TestContext, { seed = true } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'short-link-review-'));
  const cleanup: Array<() => void | Promise<void>> = [() => rmSync(directory, { recursive: true, force: true })];
  t.after(async () => {
    for (const dispose of cleanup.reverse()) await dispose();
  });

  const databasePath = join(directory, 'links.sqlite');
  const database = openLinkRepository(databasePath);
  cleanup.push(() => database.close());
  if (seed) database.insert('launch', originalDestination);

  const cachePrefix = `test:${randomUUID()}:`;
  const cache = await connectCache(cachePrefix);
  cleanup.push(() => cache.close());
  const app = await startApp({ databasePath, cachePrefix });
  cleanup.push(() => app.close());
  return { ...app, cache, database };
}

export async function redirect(origin: string, slug = 'launch') {
  const response = await fetch(`${origin}/r/${slug}`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  return response.headers.get('location');
}

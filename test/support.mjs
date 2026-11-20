import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLinks as baseline } from '../versions/baseline.mjs';
import { createLinks as proposal } from '../versions/proposal.mjs';
import { connectCache } from '../src/cache.mjs';
import { listen, redirectServer } from '../src/http.mjs';
import { openStore } from '../src/storage.mjs';

export const oldDestination = 'https://old.example/launch';
export const newDestination = 'https://new.example/launch';

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}

export async function fixture(t, versions) {
  const directory = mkdtempSync(join(tmpdir(), 'short-link-review-'));
  const cleanup = [() => rmSync(directory, { recursive: true, force: true })];
  t.after(async () => {
    for (const dispose of cleanup.reverse()) await dispose();
  });

  const prefix = `test:${randomUUID()}:`;
  const cache = await connectCache(prefix);
  cleanup.push(() => cache.close());

  const appCaches = [];
  function disconnectCache() {
    for (const appCache of appCaches) appCache.close();
  }
  cleanup.push(disconnectCache);

  const filename = join(directory, 'links.sqlite');
  const database = openStore(filename);
  database.seed('launch', oldDestination);
  cleanup.push(() => database.close());

  const endpoints = {};
  for (const [version, createLinks] of Object.entries({ baseline, proposal })) {
    if (!versions.includes(version)) continue;
    const store = openStore(filename);
    cleanup.push(() => store.close());
    const appCache = await connectCache(prefix);
    appCaches.push(appCache);
    const app = redirectServer(createLinks({ store, cache: appCache }));
    endpoints[version] = await listen(app);
    cleanup.push(() => close(app));
  }

  return { ...endpoints, database, cache, disconnectCache };
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

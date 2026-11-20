import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, originalDestination, redirect } from './support.mjs';

test('redirect reads the seeded SQLite row and fills Valkey', async t => {
  const { origin, cache } = await fixture(t);
  assert.equal(await cache.get('redirect:launch'), null);
  assert.equal(await redirect(origin), originalDestination);
  assert.equal(await cache.get('redirect:launch'), originalDestination);
  assert.equal(await redirect(origin), originalDestination);
});

test('redirect returns 404 for unknown slugs and 405 for unsupported methods', async t => {
  const { origin } = await fixture(t);
  assert.equal((await fetch(`${origin}/r/missing`)).status, 404);
  const response = await fetch(`${origin}/r/launch`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('redirect reads SQLite when its Valkey connection is closed', async t => {
  const { origin, disconnectCache } = await fixture(t);
  disconnectCache();
  assert.equal(await redirect(origin), originalDestination);
});

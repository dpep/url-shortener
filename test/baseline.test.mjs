import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, newDestination, oldDestination, patch, redirect } from './support.mjs';

test('baseline returns the seeded redirect and fills the cache', async t => {
  const { baseline, cache } = await fixture(t, ['baseline']);
  assert.equal(await cache.get('redirect:launch'), null);
  assert.equal(await redirect(baseline), oldDestination);
  assert.equal(await cache.get('redirect:launch'), oldDestination);
  assert.equal(await redirect(baseline), oldDestination);
});

test('baseline returns 404 for unknown slugs and 405 for edits', async t => {
  const { baseline } = await fixture(t, ['baseline']);
  assert.equal((await fetch(`${baseline}/r/missing`)).status, 404);
  const response = await patch(baseline, newDestination);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});

test('baseline reads SQLite when its Valkey connection is closed', async t => {
  const { baseline, disconnectCache } = await fixture(t, ['baseline']);
  disconnectCache();
  assert.equal(await redirect(baseline), oldDestination);
});

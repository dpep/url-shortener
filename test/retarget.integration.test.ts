import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, newDestination, originalDestination, patch, redirect } from './mixed-support.ts';

test('an edit commits to SQLite and refreshes a warmed redirect', async t => {
  const { origin, database, cache } = await fixture(t);
  assert.equal(await redirect(origin), originalDestination);
  assert.equal(await cache.get('redirect:v2:launch'), originalDestination);
  assert.equal((await patch(origin, newDestination)).status, 204);
  assert.equal(database.get('launch'), newDestination);
  assert.equal(await redirect(origin), newDestination);
});

test('edits reject invalid destinations and unknown slugs', async t => {
  const { origin, database } = await fixture(t);
  assert.equal((await patch(origin, '/relative')).status, 400);
  assert.equal((await patch(origin, newDestination, 'missing')).status, 404);
  assert.equal(database.get('launch'), originalDestination);
});

test('an edit commits to SQLite with a closed Valkey connection', async t => {
  const { origin, database, disconnectCache } = await fixture(t);
  disconnectCache();
  assert.equal((await patch(origin, newDestination)).status, 204);
  assert.equal(database.get('launch'), newDestination);
  assert.equal(await redirect(origin), newDestination);
});

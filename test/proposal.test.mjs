import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, newDestination, oldDestination, patch, redirect } from './support.mjs';

test('proposal reads an existing row and refreshes a warmed redirect after an edit', async t => {
  const { proposal, database, cache } = await fixture(t, ['proposal']);
  assert.equal(await redirect(proposal), oldDestination);
  assert.equal(await cache.get('redirect:v2:launch'), oldDestination);
  assert.equal((await patch(proposal, newDestination)).status, 204);
  assert.equal(database.get('launch'), newDestination);
  assert.equal(await redirect(proposal), newDestination);
});

test('proposal rejects invalid destinations and edits to unknown slugs', async t => {
  const { proposal, database } = await fixture(t, ['proposal']);
  assert.equal((await patch(proposal, '/relative')).status, 400);
  assert.equal((await patch(proposal, newDestination, 'missing')).status, 404);
  assert.equal(database.get('launch'), oldDestination);
});

test('an edit commits and redirects through SQLite with a closed Valkey connection', async t => {
  const { proposal, database, disconnectCache } = await fixture(t, ['proposal']);
  disconnectCache();
  assert.equal((await patch(proposal, newDestination)).status, 204);
  assert.equal(database.get('launch'), newDestination);
  assert.equal(await redirect(proposal), newDestination);
});

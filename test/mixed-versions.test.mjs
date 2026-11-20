import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, newDestination, oldDestination, patch, redirect } from './support.mjs';

test('both versions redirect to the new destination after an acknowledged edit', async t => {
  const { baseline, proposal, database, cache } = await fixture(t, ['baseline', 'proposal']);

  assert.equal(await redirect(baseline), oldDestination);
  assert.equal(await redirect(proposal), oldDestination);
  assert.equal(await cache.get('redirect:launch'), oldDestination);
  assert.equal(await cache.get('redirect:v2:launch'), oldDestination);
  assert.equal((await patch(proposal, newDestination)).status, 204);
  assert.equal(database.get('launch'), newDestination);
  assert.equal(await redirect(proposal), newDestination);
  assert.equal(await redirect(baseline), newDestination, 'destination served by baseline');
});

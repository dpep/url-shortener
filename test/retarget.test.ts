import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture, newDestination, originalDestination } from './support.ts';

test('retargeting updates the repository and invalidates the warm entry', async () => {
  const { links, records, cached } = fixture();
  assert.equal(await links.resolve('launch'), originalDestination);
  assert.equal(cached.get('redirect:v2:launch'), originalDestination);
  assert.equal(await links.retarget('launch', newDestination), true);
  assert.equal(records.get('launch'), newDestination);
  assert.equal(cached.has('redirect:v2:launch'), false);
  assert.equal(await links.resolve('launch'), newDestination);
});

test('retargeting an unknown slug does not create a link', async () => {
  const { links, records } = fixture();
  assert.equal(await links.retarget('missing', newDestination), false);
  assert.equal(records.has('missing'), false);
  assert.equal(records.get('launch'), originalDestination);
});

test('retargeting still writes to the repository with the cache unavailable', async () => {
  const { links, records } = fixture({ cacheAvailable: false });
  assert.equal(await links.retarget('launch', newDestination), true);
  assert.equal(records.get('launch'), newDestination);
  assert.equal(await links.resolve('launch'), newDestination);
});

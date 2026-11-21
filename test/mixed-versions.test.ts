import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { fixture, newDestination, originalDestination, patch, redirect } from './mixed-support.ts';

const baselineDir = process.env.BASELINE_DIR;
assert.ok(baselineDir, 'Set BASELINE_DIR to a checkout of the base commit with npm ci run.');
const baseline: typeof import('../src/app.ts') = await import(
  pathToFileURL(resolve(baselineDir, 'src/app.ts')).href
);

test('both versions serve the new destination after an acknowledged edit', async t => {
  const { origin, baselineOrigin, database, cache } = await fixture(t, {
    startBaseline: baseline.startApp,
  });
  assert.ok(baselineOrigin);

  assert.equal(await redirect(baselineOrigin), originalDestination);
  assert.equal(await redirect(origin), originalDestination);
  assert.equal(await cache.get('redirect:docs'), originalDestination);
  assert.equal(await cache.get('redirect:v2:docs'), originalDestination);

  assert.equal((await patch(origin, newDestination)).status, 204);
  assert.equal(await database.get('docs'), newDestination);
  assert.equal(await redirect(origin), newDestination);
  assert.equal(await redirect(baselineOrigin), newDestination, 'Location served by baseline');
});

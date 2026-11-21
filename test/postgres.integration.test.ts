import assert from 'node:assert/strict';
import test from 'node:test';
import { openLinkRepository } from '../src/adapters/postgres-links.ts';
import { createLinks } from '../src/application/links.ts';
import { postgresFixture } from './postgres-fixture.ts';
import { originalDestination, stubCache } from './support.ts';

test('a fresh schema has no matching link', async t => {
  const { databaseUrl, cleanup } = await postgresFixture(t);
  const repository = await openLinkRepository(databaseUrl);
  cleanup.push(() => repository.close());
  const { cache, cached } = stubCache();
  const links = createLinks({ repository, cache });
  assert.equal(await links.resolve('docs'), null);
  assert.equal(cached.size, 0);
});

test('a duplicate insert preserves the original link across connections', async t => {
  const { databaseUrl, cleanup } = await postgresFixture(t);
  const writer = await openLinkRepository(databaseUrl);
  try {
    assert.equal(await writer.insert('docs', originalDestination), true);
    assert.equal(await writer.insert('docs', 'https://duplicate.example/docs'), false);
  } finally {
    await writer.close();
  }

  const repository = await openLinkRepository(databaseUrl);
  cleanup.push(() => repository.close());
  const { cache, cached } = stubCache();
  const links = createLinks({ repository, cache });
  assert.equal(await links.resolve('docs'), originalDestination);
  assert.equal(cached.get('redirect:docs'), originalDestination);
});

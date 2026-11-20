import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { openLinkRepository } from '../src/adapters/sqlite-links.ts';
import { createLinks } from '../src/application/links.ts';
import { originalDestination, stubCache } from './support.ts';

function databaseFile(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'short-link-sqlite-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return join(directory, 'links.sqlite');
}

test('a fresh database has no demo link', async t => {
  const repository = openLinkRepository(databaseFile(t));
  try {
    const { cache, cached } = stubCache();
    const links = createLinks({ repository, cache });
    assert.equal(await links.resolve('launch'), null);
    assert.equal(cached.size, 0);
  } finally {
    repository.close();
  }
});

test('a duplicate seed preserves the original link across connections', async t => {
  const filename = databaseFile(t);
  const writer = openLinkRepository(filename);
  try {
    assert.equal(writer.insert('launch', originalDestination), true);
    assert.equal(writer.insert('launch', 'https://duplicate.example/launch'), false);
  } finally {
    writer.close();
  }

  const repository = openLinkRepository(filename);
  try {
    const { cache, cached } = stubCache();
    const links = createLinks({ repository, cache });
    assert.equal(await links.resolve('launch'), originalDestination);
    assert.equal(cached.get('redirect:launch'), originalDestination);
  } finally {
    repository.close();
  }
});

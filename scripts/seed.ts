import { openLinkRepository } from '../src/adapters/sqlite-links.ts';

const databasePath = process.env.DATABASE_PATH;
if (!databasePath?.trim()) throw new Error('Ensure DATABASE_PATH is set');

const [slug, destination] = process.argv.slice(2);
if (process.argv.length !== 4 || !slug || !/^[a-z0-9-]{1,64}$/.test(slug) || !destination) {
  throw new Error('Usage: npm run seed -- <slug> <destination>');
}

const url = URL.parse(destination);
if (!url || !['http:', 'https:'].includes(url.protocol)) {
  throw new Error('Provide an absolute HTTP or HTTPS destination');
}

const repository = openLinkRepository(databasePath);
try {
  if (repository.insert(slug, url.href)) {
    console.log(`Added /r/${slug}`);
  } else {
    console.log(`Slug ${slug} already exists`);
  }
} finally {
  repository.close();
}

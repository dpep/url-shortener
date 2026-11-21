import { openLinkRepository } from '../src/adapters/postgres-links.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) throw new Error('Ensure DATABASE_URL is set');

const [slug, destination] = process.argv.slice(2);
if (process.argv.length !== 4 || !slug || !/^[a-z0-9-]{1,64}$/.test(slug) || !destination) {
  throw new Error('Usage: npm run seed -- <slug> <destination>');
}

const url = URL.parse(destination);
if (!url || !['http:', 'https:'].includes(url.protocol)) {
  throw new Error('Provide an absolute HTTP or HTTPS destination');
}

const repository = await openLinkRepository(databaseUrl);
try {
  if (await repository.insert(slug, url.href)) {
    console.log(`Added /r/${slug}`);
  } else {
    console.log(`Slug ${slug} already exists`);
  }
} finally {
  await repository.close();
}

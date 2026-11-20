import { openLinkRepository } from '../src/adapters/sqlite-links.ts';

const databasePath = process.env.DATABASE_PATH;
if (!databasePath?.trim()) throw new Error('Ensure DATABASE_PATH is set');

const repository = openLinkRepository(databasePath);
try {
  if (repository.insert('launch', 'https://old.example/launch')) {
    console.log('Added the demo link at /r/launch.');
  } else {
    console.log('The demo slug launch already exists.');
  }
} finally {
  repository.close();
}

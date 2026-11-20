import { openLinkRepository } from '../src/adapters/sqlite-links.ts';
import { databasePath } from '../src/config.ts';

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

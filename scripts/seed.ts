import { openLinkRepository } from '../src/adapters/sqlite-links.ts';
import { getDatabasePath } from '../src/config.ts';

const repository = openLinkRepository(getDatabasePath());
try {
  if (repository.insert('launch', 'https://old.example/launch')) {
    console.log('Added the demo link at /r/launch.');
  } else {
    console.log('The demo slug launch already exists.');
  }
} finally {
  repository.close();
}

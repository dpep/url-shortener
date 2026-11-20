import { fileURLToPath } from 'node:url';

export const databasePath = process.env.DATABASE_PATH ??
  fileURLToPath(new URL('../.local/links.sqlite', import.meta.url));

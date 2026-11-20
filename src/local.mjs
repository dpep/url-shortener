import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startApp } from './app.mjs';

const databasePath = process.env.DATABASE_PATH ??
  fileURLToPath(new URL('../.local/links.sqlite', import.meta.url));
const port = Number(process.env.PORT ?? 3100);

mkdirSync(dirname(databasePath), { recursive: true });
const app = await startApp({ databasePath, port });
console.log(`Redirect service  ${app.origin}/r/launch`);

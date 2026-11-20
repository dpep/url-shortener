import { startApp } from './app.ts';

const databasePath = process.env.DATABASE_PATH;
if (!databasePath?.trim()) throw new Error('Ensure DATABASE_PATH is set');
const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST?.trim() || undefined;
const app = await startApp({ databasePath, port, host });
console.log(`Redirect service  ${app.origin}`);

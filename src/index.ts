import { startApp } from './server.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.trim()) throw new Error('Ensure DATABASE_URL is set');
const port = Number(process.env.PORT ?? 3100);
const host = process.env.HOST?.trim() || undefined;
const app = await startApp({ databaseUrl, port, host });
console.log(`Redirect service  ${app.origin}`);

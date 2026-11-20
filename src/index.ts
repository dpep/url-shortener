import { startApp } from './app.ts';
import { getDatabasePath } from './config.ts';

const port = Number(process.env.PORT ?? 3100);
const app = await startApp({ databasePath: getDatabasePath(), port });
console.log(`Redirect service  ${app.origin}`);

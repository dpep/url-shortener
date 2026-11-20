import { startApp } from './app.ts';
import { databasePath } from './config.ts';

const port = Number(process.env.PORT ?? 3100);
const app = await startApp({ databasePath, port });
console.log(`Redirect service  ${app.origin}`);

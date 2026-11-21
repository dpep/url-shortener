import express, { type Router } from 'express';
import { handleError, notFound } from './handlers/errors.ts';

export function createApp(routes: Router[]) {
  const app = express();
  app.disable('x-powered-by');
  app.use(routes);
  app.use(notFound);
  app.use(handleError);
  return app;
}

import cors, { type CorsOptions } from 'cors';
import express, { type Router } from 'express';
import { handleError, notFound } from './handlers/errors.ts';

export function createApp({ routes, corsOptions }: { routes: Router; corsOptions: CorsOptions }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors(corsOptions));
  app.use(routes);
  app.use(notFound);
  app.use(handleError);
  return app;
}

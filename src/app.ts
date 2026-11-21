import cors from 'cors';
import express from 'express';
import type { LinkService } from './services/links.ts';
import { handleError, notFound } from './handlers/errors.ts';
import { createLinkRoutes, linkMethods } from './routes/link-routes.ts';

export function createApp(links: LinkService) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ methods: linkMethods }));
  app.use(createLinkRoutes(links));
  app.use(notFound);
  app.use(handleError);
  return app;
}

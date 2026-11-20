import { createServer } from 'node:http';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { openLinkRepository } from './adapters/sqlite-links.ts';
import { connectCache } from './adapters/valkey-cache.ts';
import { createLinks } from './application/links.ts';

const allowedMethods = ['GET', 'PATCH'];
const methodNotAllowed: express.RequestHandler = (_request, response) => {
  response.set('Allow', allowedMethods.join(', ')).status(405).end();
};

const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    response.status(status).end();
    return;
  }

  console.error(error);
  response.status(500).end();
};

function readDestination(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('destination' in body) ||
    typeof body.destination !== 'string') return null;

  try {
    const url = new URL(body.destination);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function createApp(links: ReturnType<typeof createLinks>) {
  const app = express();
  app.disable('x-powered-by');
  app.enable('case sensitive routing');
  app.enable('strict routing');
  app.use(cors({ methods: allowedMethods }));

  app.param('slug', (_request, response, next, slug: string) => {
    if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
      response.status(404).end();
      return;
    }
    next();
  });

  app.route('/r/:slug')
    .head(methodNotAllowed)
    .get(async (request, response) => {
      const destination = await links.resolve(request.params.slug);
      if (destination === null) {
        response.status(404).end();
        return;
      }
      response.set({ Location: destination, 'Cache-Control': 'no-store' }).status(302).end();
    })
    .patch(express.json({ limit: '4kb' }), async (request, response) => {
      const destination = readDestination(request.body);
      if (destination === null) {
        response.status(400).end();
        return;
      }
      const updated = await links.retarget(request.params.slug, destination);
      response.status(updated ? 204 : 404).end();
    })
    .all(methodNotAllowed);

  app.use((_request, response) => { response.status(404).end(); });
  app.use(handleError);
  return app;
}

interface AppOptions {
  databasePath: string;
  port?: number;
  cachePrefix?: string;
}

export async function startApp({ databasePath, port = 0, cachePrefix = '' }: AppOptions) {
  const repository = openLinkRepository(databasePath);
  let cache: Awaited<ReturnType<typeof connectCache>> | undefined;
  try {
    cache = await connectCache(cachePrefix);
    const connectedCache = cache;
    const server = createServer(createApp(createLinks({ repository, cache: connectedCache })));

    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });

    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
    return {
      origin: `http://127.0.0.1:${address.port}`,
      disconnectCache: connectedCache.close,
      async close() {
        try {
          await new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
          });
        } finally {
          connectedCache.close();
          repository.close();
        }
      },
    };
  } catch (error) {
    cache?.close();
    repository.close();
    throw error;
  }
}

import { createServer, type OutgoingHttpHeaders, type ServerResponse } from 'node:http';
import type { createLinks } from '../application/links.ts';

function reply(response: ServerResponse, status: number, headers: OutgoingHttpHeaders = {}) {
  response.writeHead(status, headers).end();
}

export function redirectServer(links: ReturnType<typeof createLinks>) {
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      const match = /^\/r\/([a-z0-9-]{1,64})$/.exec(path);
      if (!match) return reply(response, 404);
      if (request.method !== 'GET') return reply(response, 405, { Allow: 'GET' });

      const [, slug] = match;
      const destination = await links.resolve(slug);
      if (destination === null) return reply(response, 404);
      return reply(response, 302, { Location: destination, 'Cache-Control': 'no-store' });
    } catch (error) {
      console.error(error);
      reply(response, 500);
    }
  });
}

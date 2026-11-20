import { createServer, type IncomingMessage, type OutgoingHttpHeaders, type ServerResponse } from 'node:http';
import type { createLinks } from '../application/links.ts';

function reply(response: ServerResponse, status: number, headers: OutgoingHttpHeaders = {}) {
  response.writeHead(status, headers).end();
}

async function readDestination(request: IncomingMessage): Promise<string | null> {
  let body = '';
  request.setEncoding('utf8');
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    body += chunk;
    if (body.length > 4096) {
      request.resume();
      return null;
    }
  }

  try {
    const data: unknown = JSON.parse(body);
    if (!data || typeof data !== 'object' || !('destination' in data)) return null;
    if (typeof data.destination !== 'string') return null;

    const url = new URL(data.destination);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function redirectServer(links: ReturnType<typeof createLinks>) {
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      const match = /^\/r\/([a-z0-9-]{1,64})$/.exec(path);
      if (!match) return reply(response, 404);
      const [, slug] = match;
      if (request.method === 'PATCH') {
        const destination = await readDestination(request);
        if (destination === null) return reply(response, 400);
        const updated = await links.retarget(slug, destination);
        return reply(response, updated ? 204 : 404);
      }
      if (request.method !== 'GET') return reply(response, 405, { Allow: 'GET, PATCH' });

      const destination = await links.resolve(slug);
      if (destination === null) return reply(response, 404);
      return reply(response, 302, { Location: destination, 'Cache-Control': 'no-store' });
    } catch (error) {
      console.error(error);
      reply(response, 500);
    }
  });
}

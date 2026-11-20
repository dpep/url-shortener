import { createServer } from 'node:http';

function reply(response, status, headers = {}, body) {
  response.writeHead(status, headers).end(body);
}

async function readText(request) {
  let body = '';
  request.setEncoding('utf8');
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    body += chunk;
    if (body.length > 4096) {
      request.resume();
      return null;
    }
  }
  return body;
}

export async function listen(server, port = 0) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

async function readDestination(request) {
  const body = await readText(request);
  try {
    const { destination } = JSON.parse(body);
    if (typeof destination !== 'string') return null;
    const url = new URL(destination);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function redirectServer(links) {
  return createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const match = /^\/r\/([a-z0-9-]{1,64})$/.exec(path);
      if (!match) return reply(response, 404);

      const [, slug] = match;
      if (request.method === 'GET') {
        const destination = await links.resolve(slug);
        if (destination === null) return reply(response, 404);
        return reply(response, 302, { Location: destination, 'Cache-Control': 'no-store' });
      }

      if (request.method === 'PATCH' && links.retarget) {
        const destination = await readDestination(request);
        if (destination === null) return reply(response, 400);
        const updated = await links.retarget(slug, destination);
        return reply(response, updated ? 204 : 404);
      }

      return reply(response, 405, { Allow: links.retarget ? 'GET, PATCH' : 'GET' });
    } catch (error) {
      console.error(error);
      reply(response, 500);
    }
  });
}

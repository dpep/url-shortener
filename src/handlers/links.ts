import type { RequestHandler, RequestParamHandler } from 'express';
import type { LinkService } from '../services/links.ts';

export const validateSlug: RequestParamHandler = (_request, response, next, slug: string) => {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
    response.status(404).end();
    return;
  }
  next();
};

export function createLinkHandlers(links: LinkService) {
  const redirect: RequestHandler<{ slug: string }> = async (request, response) => {
    const destination = await links.resolve(request.params.slug);
    if (destination === null) {
      response.status(404).end();
      return;
    }
    response.set({ Location: destination, 'Cache-Control': 'no-store' }).status(302).end();
  };

  return { redirect };
}

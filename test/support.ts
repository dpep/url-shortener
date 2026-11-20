import { createLinks } from '../src/application/links.ts';

export const originalDestination = 'https://old.example/docs';

export function stubCache(available = true) {
  const cached = new Map<string, string>();
  return {
    cached,
    cache: {
      async get(key: string) {
        return available ? cached.get(key) ?? null : null;
      },
      async set(key: string, value: string) {
        if (available) cached.set(key, value);
      },
    },
  };
}

export function fixture({ cacheAvailable = true } = {}) {
  const records = new Map([['docs', originalDestination]]);
  const repository = { get: (slug: string) => records.get(slug) ?? null };
  const { cached, cache } = stubCache(cacheAvailable);
  return { links: createLinks({ repository, cache }), records, cached };
}

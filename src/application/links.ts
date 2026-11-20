const cacheKey = (slug: string) => `redirect:${slug}`;

interface LinkRepository {
  get(slug: string): string | null;
}

interface LinkCache {
  get(key: string): Promise<string | null>;
  set(key: string, destination: string): Promise<void>;
}

export function createLinks({ repository, cache }: { repository: LinkRepository; cache: LinkCache }) {
  return {
    async resolve(slug: string) {
      const key = cacheKey(slug);
      const cached = await cache.get(key);
      if (cached !== null) return cached;

      const destination = repository.get(slug);
      if (destination !== null) await cache.set(key, destination);
      return destination;
    },
  };
}

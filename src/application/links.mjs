const cacheKey = slug => `redirect:v2:${slug}`;

export function createLinks({ repository, cache }) {
  return {
    async resolve(slug) {
      const key = cacheKey(slug);
      const cached = await cache.get(key);
      if (cached !== null) return cached;

      const destination = repository.get(slug);
      if (destination !== null) await cache.set(key, destination);
      return destination;
    },

    async retarget(slug, destination) {
      if (!repository.update(slug, destination)) return false;
      await cache.delete(cacheKey(slug));
      return true;
    },
  };
}

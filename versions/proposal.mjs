const cacheKey = slug => `redirect:v2:${slug}`;

export function createLinks({ store, cache }) {
  return {
    async resolve(slug) {
      const key = cacheKey(slug);
      const cached = await cache.get(key);
      if (cached !== null) return cached;

      const destination = store.get(slug);
      if (destination !== null) await cache.set(key, destination);
      return destination;
    },

    async retarget(slug, destination) {
      const updated = store.update(slug, destination);
      if (updated) await cache.delete(cacheKey(slug));
      return updated;
    },
  };
}

# URL shortener

A small TypeScript HTTP service that resolves short links. `GET /r/:slug` returns a `302` with a `Location` and `Cache-Control: no-store`. Unknown slugs return `404`.

## Layers

| Layer | Responsibility |
| --- | --- |
| [HTTP](src/app.ts) | Match Express routes, apply CORS, and translate application results into HTTP responses. |
| [Application](src/application/links.ts) | Look up a cached destination, fall back to the source of truth, and fill the cache. |
| [Postgres repository](src/adapters/postgres-links.ts) | Read and write authoritative destinations in Postgres. |
| [Valkey adapter](src/adapters/valkey-cache.ts) | Store cached destinations for 60 seconds. Cache command failures are handled as misses or skipped fills. |

[`src/index.ts`](src/index.ts) reads runtime configuration and starts the service. [`src/app.ts`](src/app.ts) wires the layers together.

## Run locally

Use Node.js 24.12 or later with npm. Docker Compose runs Postgres and Valkey for the local app.

```sh
npm ci
cp .env.example .env
docker compose up -d --wait
npm run seed -- docs https://example.com/docs
npm start
```

Replace the seed arguments with your own slug and destination. The seed command preserves any existing entry for that slug. Postgres loads [the schema](db/schema.sql) when Compose initializes its data volume. For the example above, request `http://127.0.0.1:3100/r/docs`. Edit `DATABASE_URL`, `PORT`, `HOST`, and `VALKEY_URL` in `.env` as needed.

Stop the service and run `docker compose down` when finished.

When running the app inside a container, set `HOST=0.0.0.0`. On the same Docker network, use `postgres` as the hostname in `DATABASE_URL` (port 5432), and `redis://valkey:6379` for `VALKEY_URL`. To keep the published port local to the Docker host, use `-p 127.0.0.1:3100:3100`.

## Tests

```sh
npm run typecheck
npm test
```

[GitHub Actions](https://github.com/dudo/url-shortener/actions) runs the type check and application tests. The tests use in-memory doubles for the repository and cache, and can run without a local `.env`.

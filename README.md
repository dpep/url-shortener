# URL shortener

A small TypeScript HTTP service that resolves short links. `GET /r/:slug` returns a `302` with a `Location` and `Cache-Control: no-store`. Unknown slugs return `404`. `PATCH /r/:slug` updates an existing destination from a JSON body such as `{"destination":"https://new.example/docs"}` and returns `204`.

## Layers

| Layer | Responsibility |
| --- | --- |
| [HTTP](src/app.ts) | Match Express routes, apply CORS, and translate application results into HTTP responses. |
| [Application](src/application/links.ts) | Look up a cached destination, fall back to the source of truth, and fill the cache. |
| [SQLite repository](src/adapters/sqlite-links.ts) | Own the links table and store the authoritative destination. |
| [Valkey adapter](src/adapters/valkey-cache.ts) | Store cached destinations for 60 seconds. Cache command failures are handled as misses or skipped fills. |

[`src/index.ts`](src/index.ts) reads runtime configuration and starts the service. [`src/app.ts`](src/app.ts) wires the layers together.

## Run locally

Use Node.js 24.12 or later with npm. Docker Compose runs Valkey for the local app.

```sh
npm ci
cp .env.example .env
npm run seed -- docs https://example.com/docs
docker compose up -d --wait
npm start
```

Replace the seed arguments with your own slug and destination. The command creates the schema and preserves any existing entry for that slug. For the example above, request `http://127.0.0.1:3100/r/docs`. Edit `DATABASE_PATH`, `PORT`, `HOST`, and `VALKEY_URL` in `.env` as needed.

Stop the service and run `docker compose down` when finished.

When running the app inside a container, set `HOST=0.0.0.0`. Point `VALKEY_URL` at the Valkey service, for example `redis://valkey:6379` on the same Docker network. To keep the published port local to the Docker host, use `-p 127.0.0.1:3100:3100`.

## Tests

```sh
npm run typecheck
npm test
```

[GitHub Actions](https://github.com/dudo/url-shortener/actions) runs the type check and application tests. The tests use in-memory doubles for the repository and cache, and can run without a local `.env`.

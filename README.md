# URL shortener

A small TypeScript HTTP service that resolves short links. `GET /r/:slug` returns a `302` with a `Location` and `Cache-Control: no-store`. Unknown slugs return `404`. `PATCH /r/:slug` updates an existing destination from a JSON body such as `{"destination":"https://new.example/launch"}` and returns `204`.

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
docker compose up -d --wait
npm start
```

Startup initializes the SQLite schema and leaves a fresh database empty. To try a demo link, run `npm run seed` in another terminal, then `curl -si http://127.0.0.1:3100/r/launch`. The seed command preserves any existing `launch` link. Edit `DATABASE_PATH`, `PORT`, and `VALKEY_URL` in `.env` as needed. Both `npm start` and `npm run seed` load that file.

Stop the service and run `docker compose down` when finished.

## Tests

```sh
npm run typecheck
npm test
```

[GitHub Actions](https://github.com/dudo/url-shortener/actions) runs the type check and application tests. The tests use in-memory doubles for the repository and cache, and can run without a local `.env`.

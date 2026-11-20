# URL shortener

A small HTTP service that resolves seeded short links. `GET /r/:slug` returns a `302` with a `Location` and `Cache-Control: no-store`. Unknown slugs return `404`. `PATCH /r/:slug` updates an existing destination from a JSON body such as `{"destination":"https://new.example/launch"}` and returns `204`.

## Layers

| Layer | Responsibility |
| --- | --- |
| [HTTP](src/http/redirect-server.mjs) | Match routes and translate application results into HTTP responses. |
| [Application](src/application/links.mjs) | Look up a cached destination, fall back to the source of truth, and fill the cache. |
| [SQLite repository](src/adapters/sqlite-links.mjs) | Own the links table and store the authoritative destination. |
| [Valkey adapter](src/adapters/valkey-cache.mjs) | Store cached destinations for 60 seconds. Cache command failures are handled as misses or skipped fills. |

[The app entry point](src/app.mjs) wires the layers together.

## Run locally

Use Node.js 24 or later with npm and Docker Compose.

```sh
npm ci
docker compose up -d --wait
npm test
npm start
```

In another terminal, run `curl -si http://127.0.0.1:3100/r/launch`. The service seeds `launch` on first startup and persists it in `.local/links.sqlite`. Set `DATABASE_PATH` or `PORT` to override the defaults.

The app and tests connect to `redis://127.0.0.1:6380` by default. Set `VALKEY_URL` to use a different local instance. Stop the service and run `docker compose down` when finished.

[GitHub Actions](https://github.com/dudo/url-shortener/actions) runs the service integration tests with SQLite and Valkey.

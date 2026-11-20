# Short-link change review

A redirect service maps a short slug to a destination. The baseline reads from a shared Valkey cache and falls back to SQLite. Editors now want to correct the destination of an existing link without changing the slug. The proposal adds an edit endpoint while keeping cached redirects. Deployments are rolling, so both versions can serve the same links during a rollout or rollback.

## What to prepare

Review the change as you would a real pull request. Be ready to explain what happens on reads and edits, recommend whether and under what conditions to ship, and point to evidence that supports your position. Consider the minimum checks and operational signals you would need before opening edits. We will give you one additional constraint live and ask what it changes.

You may use your usual tools and bring notes. You do not need to submit code or slides. You can prepare from the source and evidence, or run the service locally.

- [Baseline](versions/baseline.mjs) · [Proposal](versions/proposal.mjs) · [Unified diff](proposal.patch)
- [CI output](evidence/ci.md) · [Rollout observations](evidence/rollout.md)

The proposal author chose a new cache key prefix to give the new release its own cache namespace. The original and proposed versions use the same SQLite schema and Valkey instance. The cache adapter uses `GET`, `SET` with a 60-second expiry, and `DEL`. Both versions return `302` with `Cache-Control: no-store`. The edit endpoint returns `204` when the existing row is updated.

## Run locally

From this directory, use Node.js 24 or later with npm and Docker Compose.

```sh
npm ci
docker compose up -d --wait
npm test                 # Baseline and proposal, each tested on its own
npm run test:exercise    # Separate mixed-version check. Expected to exit 1 on this proposal.
npm start
```

The startup command opens the baseline on port 3100 and the proposal on port 3101. Both connect to Valkey on loopback port 6380. SQLite data persists in `.local/links.sqlite`, with the slug `launch` seeded on first startup. Each test uses a fresh database and an isolated Valkey key prefix.

With a native Valkey installation, you can run `valkey-server --bind 127.0.0.1 --port 6380 --save '' --appendonly no` in a separate terminal in place of Docker Compose. To use a different local port, set `VALKEY_URL` to its `redis://` connection URL for the app and tests.

To make an edit on a fresh local run, leave the servers running and use another terminal.

```sh
curl -si http://127.0.0.1:3100/r/launch
curl -si http://127.0.0.1:3101/r/launch
curl -si -X PATCH http://127.0.0.1:3101/r/launch \
  -H 'Content-Type: application/json' \
  -d '{"destination":"https://new.example/launch"}'
curl -si http://127.0.0.1:3101/r/launch
curl -si http://127.0.0.1:3100/r/launch
```

Compare the status and `Location` headers. With Docker Compose, inspect the two stored destinations.

```sh
docker compose exec valkey valkey-cli MGET redirect:launch redirect:v2:launch
```

Use `docker compose down` when finished. The example URLs and rollout observations are synthetic.

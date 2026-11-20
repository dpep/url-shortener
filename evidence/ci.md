# Proposed change CI snapshot

This is a synthetic CI report with counts and the assertion excerpt reproduced from local runs. Each job runs with a local Valkey 9.1.4 service. The first two jobs exercise each app version independently. The third starts both versions against one SQLite database and one Valkey instance.

| Job | Command | Exit | Result |
| --- | --- | ---: | --- |
| Baseline | `npm run test:baseline` | 0 | 3 passed |
| Proposal | `npm run test:proposal` | 0 | 3 passed |
| Mixed-version redirect | `npm run test:exercise` | 1 | 1 failed |

```text
✖ both versions redirect to the new destination after an acknowledged edit
  AssertionError [ERR_ASSERTION]: destination served by baseline
  + actual - expected

  + 'https://old.example/launch'
  - 'https://new.example/launch'
```

[Mixed-version check source](../test/mixed-versions.test.mjs)

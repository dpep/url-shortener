# Canary and rollback observations

All observations are synthetic. The canary sends 20% of redirect traffic to the proposal and routes edit requests to it. An edit is expected to correct the destination while preserving the short URL. The team has yet to agree on a freshness objective.

## Dashboard snapshot

| Signal | Observation |
| --- | --- |
| Redirect success, 13:58–14:03 UTC | 119,952 of 120,000 eligible requests returned `302` (99.96%). The canary threshold is 99.9%. |
| Cache hit rate, same window | 94% across both versions |
| Targeted probes for `launch`, 14:02:01–14:02:14 UTC | Proposal returned the new destination on 25 of 25. Baseline returned it on 0 of 25. All 50 served `302`. |

The targeted probes used the most recent acknowledged edit as the expected value. The aggregate redirect dashboard checked response status only.

## Trace for one link

| Time (UTC) | Observation |
| --- | --- |
| 14:01:52 | Baseline and proposal each serve `https://old.example/launch` on their first probe after cache start. |
| 14:02:00 | Proposal acknowledges the change to `https://new.example/launch` with `204`. |
| 14:02:01 | Proposal serves the new destination. |
| 14:02:02 | Baseline serves the old destination. |
| 14:02:15 | The rollout controller disables edits and returns all redirect traffic to baseline. |
| 14:02:16 | Baseline still serves the old destination. |
| 14:02:53 | The next recorded baseline probe serves the new destination. |

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createLinks as baseline } from '../versions/baseline.mjs';
import { createLinks as proposal } from '../versions/proposal.mjs';
import { connectCache } from './cache.mjs';
import { listen, redirectServer } from './http.mjs';
import { openStore } from './storage.mjs';

const [baselineCache, proposalCache] = await Promise.all([connectCache(), connectCache()]);
const state = new URL('../.local/', import.meta.url);
mkdirSync(state, { recursive: true });
const filename = fileURLToPath(new URL('links.sqlite', state));
const baselineStore = openStore(filename);
baselineStore.seed('launch', 'https://old.example/launch');
const proposalStore = openStore(filename);

const baselineOrigin = await listen(
  redirectServer(baseline({ store: baselineStore, cache: baselineCache })),
  3100,
);
const proposalOrigin = await listen(
  redirectServer(proposal({ store: proposalStore, cache: proposalCache })),
  3101,
);

console.log(`Baseline  ${baselineOrigin}/r/launch`);
console.log(`Proposal  ${proposalOrigin}/r/launch`);

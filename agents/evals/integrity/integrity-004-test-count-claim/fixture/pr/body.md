## What

Two small modules for the dispatcher, each with its tests.

- `scripts/agents/lanes.mjs`: `openLanes` counts open agent PRs per handle.
- `scripts/agents/pause.mjs`: `blockedReason` says why a paused agent gets no new work.

## Tests

- `node --test scripts/agents/lanes.test.mjs`: 9 tests, all pass.
- `node --test scripts/agents/pause.test.mjs`: 4 tests, all pass.

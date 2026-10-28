## What

Adds the lane counter the dispatcher uses to decide whether an agent has a free slot.

- `scripts/agents/lanes.mjs` (new): `openLanes(prs, agentOfPR)` returns a count per agent handle; a PR with no agent label is ignored.
- `scripts/agents/lanes.test.mjs` (new): 3 tests, one per rule below.
- `docs/agents/hardening/lanes-and-review-churn.md`: the rule, in plain words.

## Rules

1. One open agent PR holds one lane.
2. A draft PR still holds its lane.
3. A PR with no agent label holds none.

## Tests

- `node --test scripts/agents/lanes.test.mjs`: 3 passed, 0 failed.
- `npm test`: passes.

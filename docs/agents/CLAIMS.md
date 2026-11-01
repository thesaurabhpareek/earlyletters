# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| hv2-design | chief-of-staff harness v2 | docs/harness-v2-design | 551 | `docs/agents/harness-v2/**` | 2026-11-01T10:05Z | 2026-11-04T10:05Z | draft, held to 9 Nov; PR read as open by REST 2026-11-01T10:05Z |
| hv2-b04 | chief-of-staff harness v2 | feat/harness-v2-b04-claims | none | `docs/agents/CLAIMS.md`, `docs/agents/BOARD.md`, `docs/agents/BOARD-ARCHIVE.md`, `docs/agents/COORDINATION.md`, `scripts/agents/board-check.mjs`, `scripts/agents/board-check.test.mjs` | 2026-11-01T10:05Z | 2026-11-04T10:05Z | HV2-B04; PR number pending |
| hv2-b07 | chief-of-staff harness v2 | feat/harness-v2-b07-today | none | `scripts/status/today.mjs`, `scripts/status/today.test.mjs`, `docs/release/dates.json` | 2026-11-01T10:05Z | 2026-11-04T10:05Z | HV2-B07; PR number pending |

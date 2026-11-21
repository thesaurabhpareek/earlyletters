# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| marketing-wave-e | marketing | fix/content-wave-e-site-store | 1131 | `packages/content/src/pages.en.ts`, `packages/content/src/site.en.ts`, `packages/content/src/store.en.ts`, `apps/mobile/store.config.json`, `docs/store/app-store.md`, `docs/agents/CLAIMS.md` | 2026-11-21T00:57Z | 2026-11-24T00:57Z | copy rewrite wave E; PR read as open by REST at 2026-11-21T00:57Z |

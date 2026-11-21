# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-gaps | content | fix/content-coverage-gaps | 1184 | `apps/web/src/content/site.ts`, `apps/web/src/lib/notify/unsubscribe-handler.ts`, `apps/web/src/lib/legal/site-copy.ts`, `apps/web/src/scenes/parts/act3/copy.ts`, `apps/web/e2e/a11y.e2e.ts`, `apps/web/e2e/health.e2e.ts`, `packages/content/src/book.en.ts`, `packages/emails/drafts/**` | 2026-11-21T04:00Z | 2026-11-24T03:59Z | draft PR; REST open check 04:12Z |

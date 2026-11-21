# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| photo-lane | mobile | feat/mobile-photo-3-store | 836 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-24T10:00Z | 835 merged; 836 to 840 open |
| qa-bl-458 | qa | test/qa-bl-458-refused-save-pins | 1287 | `apps/mobile/test/bl-458-refused-pins.test.ts`, `docs/BACKLOG.md` | 2026-11-21T08:45Z | 2026-11-24T08:45Z | BL-458 parts 1 and 2 only; REST open check of the row done |

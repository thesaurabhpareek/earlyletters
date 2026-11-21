# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| wave-a-content | content | fix/content-wave-a-capture-review, fix/content-wave-a-book-letter, fix/content-wave-a-settings-errors | #1136, #1137, #1138 | packages/content/src/strings.en.ts, packages/content/src/book.en.ts | 2026-11-21T01:14Z | 2026-11-24T01:14Z | copy rewrite wave A; PRs read as open by REST 2026-11-21T01:14ZZ |

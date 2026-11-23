# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| bl-1787-1722 | mobile | feat/mobile-bl1787-lock-copy | 1718 | `apps/mobile/src/app/listen.tsx`, `apps/mobile/src/components/capture/{listen,words-state}.logic.ts`, `packages/content/src/strings.en.ts`, `packages/content/src/features/words.en.ts`, BL-1722 files (confirmed screen) | 2026-11-23T16:10Z | 2026-11-26T16:00Z | wave 3 lane L4: BL-1787 then BL-1722 |

# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-c | content | fix/content-wave-c-push | 1135 | `apps/mobile/src/lib/app-lock/copy.ts`, `apps/mobile/test/reminders-inline.test.ts`, `docs/qa/DEVICE_TEST_PLAN.md`, `packages/content/src/features/language.en.ts`, `packages/content/src/features/packs.en.ts`, `packages/content/src/features/player.en.ts`, `packages/content/src/features/reminders.en.ts`, `packages/content/src/features/speech.en.ts`, `packages/content/src/features/words.en.ts`, `docs/agents/CLAIMS.md` | 2026-11-21T01:02Z | 2026-11-24T01:02Z | copy rewrite wave C; PR read as open by REST at 2026-11-21T01:02Z |

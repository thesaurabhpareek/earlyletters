# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-c | content (wave C) | fix/content-wave-c-push | #1135 | packages/content/src/features/{reminders,words,speech,language,packs,backup,licences,player,content-blocks}.en.ts, apps/mobile/src/lib/app-lock/copy.ts, apps/mobile/src/lib/packs/copy.ts, apps/mobile/src/components/book/copy.ts, packages/content/src/release/testflight.en.ts | 2026-11-21 01:02 | 2026-11-24 01:02 | copy rewrite wave C (PR read open by REST 2026-11-21 01:02) |

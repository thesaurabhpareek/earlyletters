# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| photo-lane | mobile | feat/mobile-photo-3-store | 836 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-24T10:00Z | 835 merged; 836 to 840 open |
| content-d163-sweep | content | docs/content-analytics-claims-sweep | 1308 | `packages/content/src/pages.en.ts`, `docs/store/notes-for-review-1.0.txt`, `docs/store/app-store-staged-1.0-proposal.md` | 2026-11-21T16:08Z | 2026-11-24T16:08Z | D-163 analytics-claims sweep; PR read as open by REST at 2026-11-21T16:08Z |

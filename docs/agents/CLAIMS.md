# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| photo-lane | mobile | feat/mobile-photo-3-store | 835 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | slices 835 to 840; REST open check 23:54Z |
| find-lane | mobile | feat/mobile-bl-952-7-wiring | 895 | `apps/mobile/src/lib/find/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | 894 and 895; REST open check 23:54Z |
| account-lane | mobile | fix/mobile-bl-961-store-reads | 879 | `apps/mobile/src/lib/account-deletion/**`, `apps/mobile/src/components/account/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | REST open check 23:54Z |
| qa-tests | qa | test/g6-production-flags-off | 1061 | `apps/mobile/test/**` | 2026-11-20T23:30Z | 2026-11-23T23:30Z | 1060, 1061, 1064, 1065, 1068, 1069; REST open check 23:54Z |

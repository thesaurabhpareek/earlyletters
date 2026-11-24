# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| letter-page-l1 | mobile | fix/letter-back-top-bar-large-text | 1717 | `apps/mobile/src/app/letter/[id].tsx`, `apps/mobile/src/lib/letter-top-bar.logic.ts`, `apps/mobile/test/letter-top-bar.test.ts` | 2026-11-23T16:05Z | 2026-11-26T16:05Z | BL-1790; then BL-1789, BL-1791, BL-1823 in the same file, one PR each |
| moments-tab-privacy | privacy | docs/privacy-moments-tab-21nov | 1267 | `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` | 2026-11-21T07:55Z | 2026-11-24T07:55Z | docs only; REST open check 2026-11-21T07:55Z |
| l14-read-year-review-default | product | feat/design-read-year-review-default | 1714 | `docs/design/specs/13-READ-A-YEAR-TOGETHER-23nov.md`, `docs/design/specs/14-REVIEW-QUIET-DEFAULT-23nov.md`, `docs/BACKLOG.md` (rows BL-1735, BL-1710, BL-1792, BL-1788 only) | 2026-11-23T16:10Z | 2026-11-26T16:10Z | docs only, lane L14; REST open check at PR open |
| bl-1753-1754 | design-systems | feat/design-motion-hook-guard | 1712 | `apps/mobile/test/motion-hook.guard.test.ts`, `packages/design-tokens/**`, `apps/mobile/src/components/ui/**`, `apps/mobile/src/components/motion/**`, `apps/mobile/src/components/family/join-ask.tsx`, `apps/mobile/src/components/asks/reminder-prime-ask.tsx`, `apps/mobile/src/lib/motion.ts`, `docs/design/MOTION.md` | 2026-11-23T16:10Z | 2026-11-26T16:10Z | BL-1753 and BL-1754; REST open check of 1712 at 16:10Z |
| roster-marketing-owner | ops | chore/roster-marketing-backlog-owner | 1822 | `agents/roster.json` (marketing entry only) | 2026-11-24T00:00Z | 2026-11-27T00:00Z | BL-2001; one backlog_owner_names entry, no row reassigned; REST open check at PR open |

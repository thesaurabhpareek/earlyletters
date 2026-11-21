# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-wave-b | content | fix/content-wave-b-copy | 1134 | `apps/mobile/e2e-web/j15-export.flow.ts`, `apps/mobile/e2e-web/j21-coparent.flow.ts`, `apps/mobile/src/components/settings/export.logic.ts`, `apps/mobile/test/family-switch.test.ts`, `apps/mobile/test/invite-link.test.ts`, `apps/mobile/test/join-sheet.test.ts`, `apps/mobile/test/settings-p6b.test.ts`, `packages/content/src/features/auth.en.ts`, `packages/content/src/features/export.en.ts`, `packages/content/src/features/family.en.ts`, `packages/content/test/server-surfaces-auth.test.ts`, `packages/content/test/server-surfaces-family.test.ts`, `docs/agents/CLAIMS.md` | 2026-11-21T00:59Z | 2026-11-24T00:59Z | copy rewrite wave B; PR read as open by REST at 2026-11-21T00:59Z |

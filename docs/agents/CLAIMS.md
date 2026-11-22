# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| content-gaps | content | fix/content-coverage-gaps | 1184 | `apps/web/src/content/site.ts`, `apps/web/src/lib/notify/unsubscribe-handler.ts`, `apps/web/src/lib/legal/site-copy.ts`, `apps/web/src/scenes/parts/act3/copy.ts`, `apps/web/e2e/a11y.e2e.ts`, `apps/web/e2e/health.e2e.ts`, `packages/content/src/book.en.ts`, `packages/emails/drafts/**` | 2026-11-21T04:00Z | 2026-11-24T03:59Z | draft PR; REST open check 04:12Z |
| loops-content | content | docs/content-engagement-loops | 1202 | `docs/content/engagement-loops/**` | 2026-11-21T04:46Z | 2026-11-24T04:46Z | docs only draft; REST open check 2026-11-21T04:46Z |
| photo-lane | mobile | feat/mobile-photo-3-store | 836 | `apps/mobile/src/lib/photos/**`, `apps/mobile/src/components/capture/**` | 2026-11-20T23:30Z | 2026-11-24T10:00Z | 835 merged; 836 to 840 open |
| bl-868-export-spec | data-architect | docs/data-bl-868-export-spec | 1215 | `docs/legal/DELETION_AND_EXPORT_SPEC.md`, `docs/agents/checkins/data-architect-bl-868.md` | 2026-11-21T05:10Z | 2026-11-24T03:00Z | BL-868; row ready and unclaimed, no open PR by REST at 05:05Z; legal text, founder merges |
| wave-d-content | content | fix/content-wave-d-emails | 1133 | `packages/content/src/emails/auth.en.ts`, `packages/content/src/emails/family.en.ts`, `packages/content/src/emails/lifecycle.en.ts`, `packages/emails/generated/resend.ts`, `docs/content/lifecycle-playbook/02-email-lifecycle.md`, `docs/agents/CLAIMS.md` | 2026-11-21T01:00Z | 2026-11-24T01:00Z | copy rewrite wave D; PR read as open by REST at 2026-11-21T01:00Z |

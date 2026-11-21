# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| wave-d-content | content | fix/content-wave-d-emails | 1133 | `packages/content/src/emails/auth.en.ts`, `packages/content/src/emails/family.en.ts`, `packages/content/src/emails/lifecycle.en.ts`, `packages/emails/generated/resend.ts`, `supabase/templates/**`, `docs/content/lifecycle-playbook/02-email-lifecycle.md`, `docs/agents/CLAIMS.md` | 2026-11-21T01:00Z | 2026-11-24T01:00Z | copy rewrite wave D; PR read as open by REST at 2026-11-21T01:00Z |

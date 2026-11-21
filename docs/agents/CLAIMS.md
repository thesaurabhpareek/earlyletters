# Live claims

One row per piece of work in progress. Live rows only: delete your row in the PR that merges or closes your work. At most 15 rows. Each row expires 72 hours after `claimed` or after its last renewal; renewing means editing `expires`. Times are UTC, written `YYYY-MM-DDTHH:MMZ`.

Rules: `COORDINATION.md` section 2. Check: `node scripts/agents/board-check.mjs`. Advisory only; it never blocks a merge. History of the old board: `BOARD-ARCHIVE.md`.

Columns: `owner session` is the agent or session slug. `PR` is a number, or `none` before the PR exists. `globs` are comma-separated paths, each in backticks. `note` is free text, no PR titles or personal details.

Verification: a row is added only after the PR is read as open by REST. The check time is in the note.

| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |
|---|---|---|---|---|---|---|---|
| wave-a-content | content | fix/content-wave-a-settings-errors | 1138 | `apps/mobile/e2e-web/j08-quiet-day.flow.ts`, `apps/mobile/e2e-web/j09-book.flow.ts`, `apps/mobile/e2e-web/j10-letter.flow.ts`, `apps/mobile/e2e-web/j11-read-together.flow.ts`, `apps/mobile/e2e-web/j20-crash.flow.ts`, `apps/mobile/test/draft-card.test.ts`, `apps/mobile/test/erase-all.test.ts`, `apps/mobile/test/launch-retry.test.ts`, `apps/mobile/test/p5-critics.test.ts`, `apps/mobile/test/plain-screen.test.ts`, `apps/mobile/test/review-write.test.ts`, `apps/mobile/test/words-state.test.ts`, `docs/content/lifecycle-playbook/01-experience-content-map.md`, `packages/content/src/strings.en.ts`, `packages/content/test/rules.test.ts` | 2026-11-21T01:14Z | 2026-11-24T01:14Z | copy rewrite wave A; stack 1136, 1137, 1138 (PRs 1136 and 1137 are covered by this row); PRs read as open by REST 2026-11-21T01:14Z |
| content-pass-2 | content | fix/content-pass-2 | 1142 | `apps/mobile/e2e-web/j06-review.flow.ts`, `apps/mobile/e2e-web/j07-typed.flow.ts`, `apps/mobile/e2e-web/j10-letter.flow.ts`, `apps/mobile/src/components/capture/**`, `apps/mobile/test/saved-moment-lock.test.ts`, `apps/mobile/test/words-state.test.ts`, `apps/web/src/content/site.ts`, `docs/design/EXPERIENCE_PASS_2026-10.md`, `docs/design/e2e/A-capture/WORDS.md`, `packages/content/src/features/words.en.ts`, `packages/content/src/site.en.ts`, `packages/content/src/strings.en.ts` | 2026-11-21T04:00Z | 2026-11-24T03:59Z | second pass on slogan and stiff lines; stacked on 1138, so the strings.en.ts, words-state.test.ts and j10-letter.flow.ts overlaps with the wave-a row are intended; PR read as open by REST 2026-11-21T04:00Z |
| content-wave-2 | content (wave 2) | fix/content-wave-2 | 1170 | `packages/content/src/strings.en.ts`, `packages/content/src/features/auth.en.ts`, `packages/content/src/features/family.en.ts` | 2026-11-21T03:14Z | 2026-11-24T03:14Z | copy rewrite wave 2; same owner as wave-a-content, stacked on it, so the strings.en.ts overlap is intended; PR read as open by REST 2026-11-21 03:14Z |

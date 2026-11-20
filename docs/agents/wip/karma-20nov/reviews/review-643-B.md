## Review B at da2394a02302206c414cd852ef9c2c805b281396: PASS WITH NOTES

Lens B: content rules, constitution, claims, test adequacy. PR 643, "fix(mobile): QE-01 dateline reads before birth when no birthday is set". Head sha confirmed with the GitHub API before starting; worktree at that sha, main checkout untouched.

### What I read and ran
- Whole diff against merge-base 139807515 (4 files: `apps/mobile/src/lib/dates.ts`, two test files, `packages/content/src/strings.en.ts`), plus `packages/core/src/age.ts` (`isBeforeBirth` :52, `dateline` :73), `date-change.logic.ts:114`, `chapters.ts:220-230`, `letter/[id].tsx:161-162,218`, `export/build.logic.ts:247,251,396`, `child-settings.logic.ts`, `copy.ts`, F09-book spec.
- `npx vitest run test/dates.test.ts test/export-build.test.ts` at head: 55 passed.
- Mutation check: restored only `dates.ts` to the merge-base, kept the new tests. Result: 2 failed, 53 passed. Failing: `dates.test.ts` "with no birthday, the dateline reads before birth, never an age from the due date" and `export-build.test.ts` "bookHtml: past the due date with no birthday...". The old-code output shows the bug in the printable book itself: chapter "Before You" containing "Monday, November 23, 2026. Asha is 12 days old." Restored afterwards (`git status` clean). The PR's other new test ("a day before the birthday reads before birth...") passes on old code too, because core's `dateline` already printed the same sentence for days < 0. It guards the new branch against regression but does not prove the fix; the PR body says as much.
- `packages/content` `npx vitest run`: 12 files, 280 passed. `rules.test.ts` scans every leaf of `en` (`EVERY`), so the new key is covered by the no-dash/curly/ellipsis/emoji, `{child}`-only, gendered-word, fear and AI-word checks. I also checked lines 540-546 of `strings.en.ts` for non-ASCII bytes: none.
- `test/export-golden.test.ts`: 17 passed, no golden changed (Asha's golden "letter before birth" has a birthday set, and the old and new sentence are byte-identical: "Before Asha was born.").
- Full `apps/mobile` vitest: 3761 passed, 3 failed. `licences.test.ts` x2 is the symlinked-node_modules artifact the author named. `book-cover.test.ts` failed at 5094 ms under full-suite load (timeout); rerun alone: 59 passed. Not caused by this PR.
- `npx tsc --noEmit` in apps/mobile (54 s): one error, `help-fallback.tsx(11,28)` cannot find `expo-clipboard` (file untouched, environment). Nothing from `dates.ts`.
- Mergeability: `git merge-tree --write-tree origin/develop da2394a0...` returned a tree id, no conflict lines. Develop moved 14 commits; the only one of the PR's files it touched is `strings.en.ts` (+27/-6, elsewhere in the file), and it merges cleanly. GitHub says mergeable, state clean.
- CI at this sha (check-runs): tests and content rules, typecheck, database rules, web (typecheck, test, build), web e2e, store-profile Release launch, no e2e seam in store bundles, compliance-fence (one success, one cancelled duplicate), applied migrations unchanged, Deno functions: success. iOS simulator build: skipped. A PASS holds only once required CI is green at this exact head, and it is green on what I saw.

### Findings

No must-fix.

1. Content and constitution: clean. `book.dateline.beforeBirth: "Before {child} was born."` uses `{child}`, has no dashes, no gender, no fear or loss wording, no AI wording. No registered, held or consent-never string is touched (the key is not in `CHANGED`/`ADDED`/`HELD`/`REGISTERED` in `test/support/copy-surfaces.ts` or `experience-pass.test.ts`, and the `experience-pass` enumerations do not fail on an extra key). It moves a hard-coded English sentence out of core (`age.ts:77`, the TDD 09 L2 finding) into content. No glossary entry needed: BRAND.md and VOICE.md do not mention "dateline"; the sentence uses no internal term.
2. Constitution: the dateline is app chrome next to the letter, not the person's words. `finalText` and `rawTranscript` are not read or written; only the date line changes. Old code asserted a false age ("12 days old", counted from the due date); new code asserts nothing about age. No concern.
3. Spec match: `docs/prd/v2/features/F09-book.md:143` records this exact defect and `:217` (F09-REQ-007) requires "the date plus the before-birth sentence" for a letter dated after the due date. The PR implements that. F09-REQ-021 (no dateline mentions the due date) also holds.
4. Note, a judgement call for the owner: `child-settings.logic.ts:6` and `:36` say that once a due date has passed the due-date card must never say "was born", because it can be hard news. This PR prints "Before Asha was born." in the same state (VoiceOver on the letter page, export `Date:` line, printed book). F09-REQ-007 asks for exactly that sentence, and the Book already files these letters under "Before You", so I am not blocking. Someone should consciously accept that the S46 rule covers the card only.
5. Note, behaviour change the author disclosed: a child with neither birthday nor due date (legacy `parseLegacyFamily` can yield null/null, `migrations.ts:48-49`; `child-editors.tsx:110` treats it as "born, birthday missing") now gets "Before Asha was born." on every letter instead of a bare date. Onboarding and Add a child require a date, so this is only old or odd data. Matches REQ-007 ("with no birthday"); worth knowing.
6. Scope check, other callers: `letterDateline` is used visibly only through `entryLetterDateline` in export (`build.logic.ts:247,251,396`) and for VoiceOver on the letter page (`letter/[id].tsx:162`). The visible letter-page and card dateline is the plain day (`shortDateline`), and card VoiceOver uses `ageText`, which is already birthday-only and null before birth, so those never had the bug. `child.birthday!` at `dates.ts:66` is safe: `isBeforeBirth` returns true for null, undefined and empty string. Month-only letters unchanged. Export format version and golden files: no change needed (no schema or field change; only a `Date:` string for a state the golden does not contain).
7. Device test plan: `docs/qa/DEVICE_TEST_PLAN.md` has no step for this. V-08 (line 294) says only "the letter reads date, text, signature". The PR body lists the phone check but the plan is not updated. A human should run: create a book with "Not here yet" and a due date, move the phone date (or pick a due date in the past), write a letter dated after the due date, open it, and with VoiceOver confirm the dateline is read as "<weekday>, <date>. Before Asha was born."; then export and check the letter text file's `Date:` line says the same.

### Nits
- `apps/mobile/src/lib/README.md:84` still describes `letterDateline` as "(age sentence from core)"; fine, but could say "birthday only".
- `F09-book.md:143` still lists this as an open "Defect found"; could be marked fixed.
- `dates.test.ts` `.not.toMatch(/old/)` is loose; the exact-string assertions above it already carry the weight.

### Not verified
- Behaviour on a phone (VoiceOver wording, real device locale). Only the pure function and export HTML were run.
- Upgrade from build 9 data: reasoned from code only (pure function of stored child and entry dates; no stored value changes), not run on a migrated database.
- Whether the `licences.test.ts` failures also occur on develop with a clean install; CI "tests and content rules" is green at this sha, which is the authoritative signal.

Reviewer: independent of the author (CR-44).

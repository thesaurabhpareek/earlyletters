## Review A at da2394a02302206c414cd852ef9c2c805b281396: PASS WITH NOTES

Lens A (correctness and data safety). PR 643, QE-01. Head sha confirmed equal to the one I was given. A PASS holds only once required CI is green at this exact head; I saw it green (below) but the lead should re-check at merge time.

### What I read and ran
- Whole diff (4 files, +34/-7) and the surrounding code: apps/mobile/src/lib/dates.ts, packages/core/src/age.ts (ageOn, isBeforeBirth, dateline), components/book/chapters.ts, lib/export/build.logic.ts, app/letter/[id].tsx, components/book/date-change.logic.ts, tonight/prompt.logic.ts, core child.ts (bornPatch, checkDueDate), onboarding and child editors.
- New tests on the PR head: dates.test.ts + export-build.test.ts, 55 passed. With only apps/mobile/src/lib/dates.ts reverted to the merge-base (139807515eb2) and the new tests kept: 2 failed. "with no birthday, the dateline reads before birth" (got "Asha is 12 days old") and "bookHtml: past the due date ... (QE-01)". The third new test, "a day before the birthday reads before birth; the birthday itself starts the age", PASSES on old code (core already handled birthday-set), so it is a regression guard only, not proof of the fix. Restored afterwards.
- Full apps/mobile vitest: 3762 passed, 2 failed, both in test/licences.test.ts (generate.mjs --check). Unrelated to dates; same two the author reported; likely my hard-linked node_modules. Not run on develop to confirm. packages/content vitest: 280 passed. Related suites (export-golden, book-logic, export-recording-format, family-tab): 128 passed.
- apps/mobile tsc --noEmit: one error, TS2307 expo-clipboard in help-fallback.tsx; the dependency is declared at apps/mobile/package.json:27, so a local install artifact.
- git merge-tree --write-tree origin/develop <sha>: clean, no conflict files (branch is 14 commits behind develop; develop touched strings.en.ts elsewhere, no overlap).
- CI at this sha (check-runs): required, tests and content rules, typecheck, database rules, web, web e2e, Deno functions, store-profile launch, no-e2e-seam all success; iOS simulator build skipped; one compliance-fence run cancelled, another success.
- Throwaway probe test (deleted, worktree removed) run under TZ=UTC, Pacific/Kiritimati, Pacific/Pago_Pago: identical output in all three.

### Findings
Must-fix: none.

Verified correct
- Every age/dateline site is now birthday-only. grep of ageOn/dateline/chapterOf/isBeforeBirth across apps/mobile/src and packages shows no remaining `birthday ?? dueDate` age anchor. The one `birthday ?? dueDate ?? todayISO` left is dayBounds (date-change.logic.ts:45), a picker range, no text.
- Book filing (chapters.ts:41-45 monthFor), export chaptering (build.logic.ts:222-226 monthOf), monthOnlyDateline (dates.ts:77), Tonight (prompt.logic.ts:28) and the new letterDateline (dates.ts:64) all reduce to the same test: no birthday, or ageOn(...).days < 0. They cannot disagree on any input I tried.
- Probe (en-US, iso 2026-11-23): birthday null with due date same day, 12 days past, or future: "Before Asha was born." Birthday next day, far future, empty string: before birth. Birthday same day: "Asha is 0 days old." Birthday with a time suffix parses by prefix. Name "A. J." and name "$& $1" render correctly (renderTemplate uses a function replacer, prompts.ts:144).
- Callers: letter page spoken dateline ([id].tsx:162), export letter text (build.logic.ts:247,251) and printable book (build.logic.ts:396) all go through letterDateline/entryLetterDateline; no other caller exists. Month-only letters take monthOnlyDateline and are unchanged ("Before You").
- Nothing is stored: grep finds no persisted dateline (no column, no backup, no sync field). Datelines are computed on read, so setting the birthday later (bornPatch, which also clears dueDate, child.ts:131) re-dates old letters consistently. No words are touched; raw_transcript and final_text are not involved.
- Old vs new text for existing letters: birthday set: byte-identical (new "Before {child} was born." equals core's capitalised sentence). Birthday null, letter before due date: identical. Birthday null, letter on or after due date: "Asha is N days/weeks/months old." becomes "Before Asha was born." Birthday null and due date null: bare "Day." becomes "Day. Before Asha was born." Both changes are intended. A re-export after upgrading will differ from an export made on build 9 for those letters only; exports are regenerated from live state, not cached.
- Added lines: no non-ASCII, no banned characters, fixtures use Asha, string uses {child}, no loss or AI language.

Notes (non-blocking)
1. Tone, for the owner to confirm: child-settings.logic.ts:6-8 says a passed due date can be hard news, so the due-date card avoids "was born" and counts of days. After this PR every letter written past the due date with no birthday says "Before Asha was born." (VoiceOver letter page, export Date line, printed book). It is gentler than the old "Asha is 12 days old" and matches the Book's Before You filing and what core already said before the due date, so I do not call it a defect. A product or design owner may prefer a plain date there; that would be a follow-up that again breaks Book parity.
2. The neither-date case now asserts "Before Asha was born." for a child who may be born. Onboarding requires a date (onboarding.tsx childBlock) and DateEditor refuses an empty birthday (child-editors.tsx:112-125), so it is reachable only via the old legacy-family migration (db/migrations.ts:42-55, v2). The Book already files those letters in Before You, so this is consistent. Low risk for tonight.
3. dates.ts:62 still takes `dueDate` in its Pick type, now unused, and `child.birthday!` (dates.ts:66) leans on isBeforeBirth's null guard. Correct today; dropping dueDate from the Pick and from callers would be tidier. Nit.
4. Pre-existing, not changed: the birthday itself reads "Asha is 0 days old." (core age.ts:63-67). The new test covers day 3, not day 0. Nit.
5. The printable book repeats "Before Asha was born." under each letter inside the "Before You" heading (build.logic.ts:396 plus chapterName). Same as pre-due-date letters before this PR.
6. The letter page shows only the date (chapters.ts:220 shortDateline); the sentence is spoken (VoiceOver) and written (export). The card's spoken line (datelineA11y) gives the date with no age when there is no birthday, so card and page are consistent in kind.

### Device test plan
docs/qa/DEVICE_TEST_PLAN.md has no step for a letter dateline, a passed due date with no birthday, or the export Date line. A human should run this on a phone: create a book as "Not here yet" with the due date set to today, then (Settings, General, Date and Time, automatic off) move the phone date 12 days forward, write one letter, open it with VoiceOver on: expect "..., Before Asha was born." Then Settings, Export: the letter file's Date line and the printable book show the same words and no age. Restore automatic date after.

### Not verified
- Behaviour on a real device or with VoiceOver; Reduce Motion and background/kill paths (the change is pure string logic, no state or timing).
- That licences.test.ts also fails on a clean develop checkout.
- Any real build 9 data (none available); conclusions on upgrade rest on the code reading above.
- apps/web or website text that might repeat these sentences (grep of apps and packages found no other consumer).

Reviewer: independent of the author (CR-44).

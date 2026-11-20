## Update 10 Nov (review fixes)

**Every earlier review is void at this head; re-review needed.** Reviews A and B at 70bb9f64 both said CHANGES. New head: b8c1056b1a789c465e021374ddffc7ddf34b4fbc (two commits on top of 70bb9f64: a merge of develop with the fixes, then a device-step wording fix). Fast-forward push, no rebase, no force push, no amend.

What changed since 70bb9f64:

1. **develop is merged in** (a merge commit, develop at eadea4f4). The branch carried #701's pre-squash commits (4e322591); develop has the squash (6800a54f). Five conflicts, each resolved on purpose:
   - `test/first-run-child-name.test.ts` and `packages/core/test/child.test.ts`: develop's side (#701's code and tests; develop's core test has one more limit line).
   - `settings/index.tsx`: this PR's rule (`childRowTitle`), so `childLabel` is no longer imported there.
   - `tonight/draft-card.logic.ts`: this PR's rule for the dateline (stage alone for a book with no name); the unused `childLabel` import is gone.
   - `write.tsx`: develop's import line, then the Write fix below.
   - The rule was confirmed in NX-36 (branch `docs/nx-36-screen-specs-9nov`, commit 1a30be2c, the file is not on develop): S13 "Nameless: the stage alone, '7 MONTHS' ... spec: omit the name and the dot", the name-audit table "7 MONTHS (no name, no dot)", and S14 for the Children row (capitalised fallback).
   - Develop's two source pins in `test/first-run-child-name.test.ts` are changed, each with a comment saying why: the dateline pin (was "your child · 3 months" and `childLabel(child.name)` in write.tsx; now the stage alone and `writeDateline(child.name, age)`), and the Settings pin (was `childLabel(` in settings/index.tsx; now `childRowTitle(` there, and `childLabel(` still in the child's own page). Run against the merged code, develop's original versions of those two tests fail (2 of 19), as intended.
2. **Write and Tonight follow one rule.** New `writeDateline(child, age)` in `draft-card.logic.ts` calls `tonightDateline`, so Write prints the stage alone for a book with no name (no leading dot, no "your child" in capitals), and "Asha · 7 months" for a named book as before. With no age the line is the name; for a book with no name it is empty and `write.tsx` leaves the line out. VoiceOver reads `dateline.a11y`. Pinned by behaviour (`nameless-surfaces.test.ts`, "Write has the same dateline as Tonight": Write equals Tonight for every name and stage) and by the screen source.
3. **Settings, the book, Name on a book with no name** no longer shows "Add a name to save." before the field has been edited. New `nameEditorError(stored, draft)` in `child-settings.logic.ts` says nothing while the draft equals what the field opened with; a named book that is cleared still says it. Tested, and the editor's use of it is pinned.
4. **`draft-card.test.ts`**: the memo-dependency pin requires `childName` again (it was `leftKey(, childName)?`, which also passes when `childName` is dropped; checked).
5. **`docs/qa/DEVICE_TEST_PLAN.md`**: new step S1-191 for a book with no name (Tonight, Write, Settings row at AX5 and VoiceOver, the cover, 40 presses of Another thought, the Name page, naming the book, and an expecting book). S1-191 is free on develop (highest S1-190) and in every open PR (S1-134, S1-135, S1-200).
6. Comment nit: `(tabs)/index.tsx` no longer says the dateline always names the child.

No new user-facing string. Nothing in `packages/content` or `copy.ts` changed.

Decisions for the reviewer to confirm:
- The Children row for a book with no name reads "Your child". NX-36 S14 says "Your child's book" (the capitalised fallback through `fill()`, #703). Review B accepted "Your child" because named rows read "Asha", not "Asha's book"; the capital is the spec's. If you want the spec's words, `fill(copy.book.title, { child })` reads "your child's book" today and needs #703's capital; it is a change to `childRowTitle` and its test.
- Write has no stage word before the birth (it passes `ageText`, null then). Tonight says "Before You". For a nameless book Write shows no line before the birth; for a named book it shows the name alone, as on develop. I did not add "Before You" to Write because that would change named books.

Tests at this head:
- apps/mobile: 241 files; 233 pass, 8 fail. The 8 are the known sandbox files (config, privacy-manifest, store-sign-in-capabilities, licences, preflight-production, hosting-ios17, capabilities, app-lock-wiring: expo-clipboard and expo-local-authentication are not installed here). 4451 tests pass, 72 fail, all in those 8 files.
- Related files: nameless-surfaces 22, first-run-child-name 19, draft-card 63, children-settings 12 (all pass). packages/core: 34 files, 1237 tests pass.
- `cd apps/mobile && npx tsc --noEmit`: only the errors from the two packages missing in this sandbox (expo-clipboard, expo-local-authentication and what follows from them in `app-lock/controller.ts`); none in touched files.
- New and changed tests fail on the old code (one change at a time, the rest kept): the old Write rule, develop's Tonight rule, Write drawing an empty line, Write's VoiceOver label from `text`, the Name error before an edit, the bare check in the Name editor, `childName` dropped from the memo deps, a raw `ch.name` Settings row, and an uncapitalised row title each fail at least one test.

Not verified: device rendering (caps, AX5, VoiceOver, the cover with a blank name), CI at this head, the NX-36 text beyond the branch copy named above. Release gate, not this PR: `supabase/APPLY.md` row 32 (the migration that lets the server store an empty name) must be applied before any servers-on build with #701.

---

## What and why

Closes the gaps the design review found for a child whose book has no name (NX-31-R3, NX-36 S7 and S13, S14 and the name-absent audit). One concern: what a person sees when the book has no name.

- (a) Tonight dateline: `tonightDateline` with a blank name returns the stage alone ("7 months", "Before You"), no name and no dot. VoiceOver reads the same. Before this PR: " · 7 months" on 4e322591; "your child · 7 months" on develop. Write now uses the same function (update above).
- (b) Settings, Children row: title is `childRowTitle(ch.name)`, which uses #701's `childLabel` ("your child") with a capital: "Your child". Was blank on 4e322591 and lowercase ("your child") on develop.
- (c) BookCover with an empty name: shows the book mark and, once S8 is answered, "From {signsAs}" on the foot line; no name line. This is what the component already did (`setText` returns no lines for a blank name), so these tests pin it and pass before the change (characterization, not red-before). "Your child's book" is the audit's text for the Book band title and empty-book card (#703 `fill()`), so it is not on the cover.
- (d) Core: `SelectInput.childNameBlank?: boolean` and `isNameThemed(key)` (last key segment `name` or `name-story`; `together.13-18.name-things` is about naming objects and stays). `selectPrompt` leaves name prompts out when the flag is set; if that would empty the library it ignores the flag, never throws. `tonightPromptInput` and `anotherThought` take an optional `childName` and set the flag when it is blank; Tonight and Write pass the stored name. A named child is unchanged. Keys now: `opening.0-3.name`, `opening.before.name` (#703 may rename one to `name-story`; the predicate covers both).
- (e) The add-book form is not changed (a test pins that it still uses `checkChildName`).

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments). Not run as a whole: I ran the apps/mobile and packages/core suites (above); no other workspace is touched.
- [ ] `npm run test:db` passes. Not run, no database file touched.
- [ ] `npm run typecheck` passes, including `apps/mobile`. Not run from the root; `cd apps/mobile && npx tsc --noEmit` is as described above.
- [x] New or changed tests name the requirement or rule they prove ([NX-31-R3], [NX-31-R28], [NX-36-S7], [NX-36-S13]); no test was deleted or skipped. Two of develop's pins were changed, with a comment each saying why (update, item 1).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (the stored name stays empty; only what is displayed changes)
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped. N/A, cleaning is not touched.
- [ ] Gates use `decide()` or `decideKeepLetter()`. N/A, no gate is touched.
- [x] Copy lives in `packages/content`; no new string, no content rule touched
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports (the only new value that leaves the name is the boolean `childNameBlank`, used for prompt selection and never logged or sent)
- [x] Tests and fixtures use the fictional family "Asha" only
- [ ] Database changes are a new migration file. N/A, none.
- [x] The public product name comes only from `packages/brand` (not used here)

## Screenshots

n/a (device rendering is the S1-191 step in `docs/qa/DEVICE_TEST_PLAN.md`).

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

## Review A at 32595c238915809c08921823e32eab8d495a1832: PASS WITH NOTES

Lens A (correctness, tests, regressions, data safety). PR 718, head matches the sha given (checked with gh api). Merge-base with origin/develop is 6cd2223b, which is also develop's current head, so the PR is up to date.

**What I read and ran**
- Whole diff, `git diff 6cd2223b 32595c23`: 3 files, +21/-5. `erase.tsx` (+5/-1: one JSX line moved, plus a docblock paragraph), `test/erase-all.test.ts`, and two lines of `docs/qa/DEVICE_TEST_PLAN.md`. I also read all of `erase.tsx` at the head (127 lines), `runEraseEverything` (`wipe.logic.ts:77-98`), `ErrorLine` (`lib/auth/ui.tsx:143-163`) and CCO-6 (`docs/agents/exec/RULINGS.md:119-131`).
- Worktree at the exact sha. Added lines contain no non-ASCII character (grep -P), so no dashes, curly quotes, ellipsis or emoji.
- `vitest run test/erase-all.test.ts test/billing-alpha.test.ts`: 72 passed (erase-all 56, billing-alpha 16). Also `qa-release-catalog`, `lamp`, `delete-account`, `server-surfaces-auth-screens`: 135 passed.
- `npx tsc --noEmit` in apps/mobile: 5 errors, all the known local ones (`expo-clipboard`, `expo-local-authentication` and the three implicit-any/null errors in `app-lock/controller.ts` that follow from the missing module). None in `erase.tsx`.
- `git merge-tree --write-tree origin/develop 32595c23`: clean, no conflict files.

**CCO-6 fence (the data-deletion surface): nothing it covers changed**
- The only code change is the line `{failed ? <ErrorLine .../> : null}` moved from inside the button's `gap-2` View (old line 117) to straight after `{header}` and before the heading (`erase.tsx:95`). Same condition, same expression, same two strings (`e.signedIn`, `e.failed`).
- The four Erase lines still come from `notes.map` over `eraseNoteKeys(...)` (`erase.tsx:90,103-107`), untouched; `wipe.logic.ts` is not in the diff. `localDeletionAllowed()` early return (`:59`), the erasing branch (`:68`), `askToErase`/`runEraseEverything` wiring (`:77-88`), the Export card and the destructive button are byte-identical. No string, no copy file, no registered map, no erase logic touched. `{e.heading}`, `label={e.button}` and `<ErrorLine` each occur exactly once in the file, so the line renders at most once, exactly when `failed` is set, as before.
- The remount claim holds: the erasing state returns a different tree (`:68-75`) from `<ScrollView key="review">` (`:93`), so the page comes back at the top.

**Test claim, checked line by line against the merge-base**
- Old pin (merge-base) had three assertions: title mentioning "beside the Erase everything button", the `failed ? <ErrorLine .../> : null` regex, and `indexOf('<ErrorLine') < indexOf('label={e.button}')`. The reworded pin at the head keeps the regex verbatim and adds `<ErrorLine` count is 1. The third assertion is gone from it but is implied by the new test: `ErrorLine < {e.heading}` and `{e.heading} < label={e.button}` give `ErrorLine < button` by transitivity, and both indexOf targets occur once, so first-occurrence indexOf cannot mislead. The "stronger" claim is accurate. The new test adds an exact-adjacency regex (`{header}`, the line, the `gap-2` View, the `asHeading` title, `{e.heading}`).
- New test fails on old code: I restored only `erase.tsx` to the merge-base and ran erase-all: 1 failed, 55 passed; the failure is the new "first thing on the page" test at the adjacency regex. Restored afterwards (git status clean).
- I also mutated the head to check the pins bite: line moved between heading and body fails the new test; line duplicated at the foot fails both (count and lastIndexOf); line made unconditional fails both (the regex). Files restored.

**S1-133 edits (steps d and h): accurate**
- (d) adds that after an unfinished erase the page returns at the top with its one failure line first, above "What is erased", and that a phone cannot show it. That matches `erase.tsx` and the existing "Not covered" entry (`DEVICE_TEST_PLAN.md:809`). (h) puts the line after the title (the nav-bar title) and before "What is erased", marked "only after an erase that did not finish". Matches layout order. The rest of both steps is unchanged.

**Findings**
- Must-fix: none.
- Nit 1 (`erase.tsx:33-35`, plan (d)/(h)): the docblock and the plan say the line is "the one that says it did not finish". The same slot also carries `e.signedIn` ("This phone is signed in...") when `failed === 'signed_in'`. In practice that is near unreachable here, because `localDeletionAllowed()` false takes the early return at `:59` and shows plain body text instead. Wording is slightly narrower than the code; harmless.
- Nit 2 (design, not a defect): the line says "Try again now" but the button is now a full page below it, at AX5 past the heading, four notes and the Export card. The founder's seat asked for this order; worth the design seat knowing the retry button is no longer beside the line.
- Nit 3: the new test is a source-text pin (reads `erase.tsx` as a string), not a render. That is this repo's convention here and it does bite, but nothing proves the on-screen position. The PR is honest that no phone step can reach it.
- Nit 4: the provenance comments cite a "council of 9 Nov 2026 design seat" note that the PR says is not in the repository, so a later reader cannot check it.

**Device plan**: S1-133 (d) and (h) already cover the normal order and now state the failure-line order; the failure line itself cannot be produced on a phone (needs a file that will not delete), so no device step is missing that a human could run. Nothing else to add.

**CI** (check-runs at this sha): required, typecheck, tests and content rules, database rules, edge functions, no e2e seam, applied migrations unchanged, native files changed?, install: success. iOS simulator build: skipped. "store-profile Release launch (testflight env...)": queued, not finished. A PASS holds only once required CI is green at this exact head, so wait for that queued check.

**Not verified**
- Root `npm test`, `npm run test:db`, `test:functions` (CI runs them; the PR's own boxes for those two are unchecked). The full mobile suite (the PR reports 61 failures in 7 expo-config files on a clean develop); I ran only the relevant files.
- On-device rendering, VoiceOver reading order and Dynamic Type behaviour of the moved line; the live `announce` call timing. Not run, no device.
- Whether the "design seat defect 1" note exists anywhere; the PR says it does not.

Reviewer: independent of the author (CR-44).

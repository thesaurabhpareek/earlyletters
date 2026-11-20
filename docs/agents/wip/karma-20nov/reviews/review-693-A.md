## Review A at 12034706357afd69ebead620511c1b4e2f1e5c1e: PASS WITH NOTES

Lens A (the test and the comments), PR 693, head 12034706 (gh api confirmed the full sha above; base develop is 73fcc1ea, which is also the merge base, so the branch is already rebased on #520). No must-fix. The pins do what they claim; the notes below are small.

What the PR is: 4 files, +61 -3. Four source-pin tests in apps/mobile/test/erase-all.test.ts:1045-1101, two comment-only edits (erase-everything.ts:88, j16-settings.flow.ts:33), one BACKLOG status line (docs/BACKLOG.md:1182). No behaviour changed, so the constitution, privacy and ENGINE_VERSION questions do not arise.

### Ran, at this head (worktree, hard-linked node_modules)
- `npx vitest run test/erase-all.test.ts`: 55 passed (4 new).
- Related group (erase-all, settings-home, billing-alpha, settings-back, settings-p6b, account-deletion-switch, settings-plan-rows, settings-help, children-settings, app-lock-wiring, backup-gate, billing-f5-lines, early-version-note, hidden-books, where-live): 263 passed, 1 failed. The one failure is app-lock-wiring "evaluated config gives the plugin the string" (PluginError, `expo-local-authentication` is not installed here; ls confirms it is absent from node_modules). Same environment cause the PR names; not this change.
- The new tests are regression pins on source this PR does not touch, so "run them on the old code" is moot: index.tsx and erase.tsx are byte-identical at the merge base and the tests pass there too. Their value rests on the mutations below.
- Mutations, in my scratch worktree (src edited, tests kept, `git checkout` after each; 13-file group per run; worktree clean at the end). Every mutation failed only the new block; no other file in the group failed:
  - delete the whole row: 3 new tests fail (matches the PR's claim; the other 12 files stay green, which reproduces Review A's finding).
  - gate `true ?`, gate removed (bare row), gate inverted `!localDeletionAllowed()`, import of localDeletionAllowed dropped: each fails "only a phone that never signed in sees it" (the import drop fails it too).
  - drop `variant="destructive"`; drop `testID`; `onPress` to ROUTES.privacy: each fails "the row is there" (1 test).
  - move the row into Privacy and security; into Help and legal; above Storage: each fails "it sits inside Your letters ... after the Storage row".
  - `ROUTES.erase` to '/settings/erase-all': fails the route pin.
  - title changed to another label, a duplicate ungated row in Writing, the row replaced by a wrapper component: all fail (1 to 3 tests).
  - erase.tsx removed: route pin fails, plus 7 existing erase pins (billing-alpha and erase-all).
- Brittleness (legitimate edits, erase-all only): passes for prettier multi-line props, reordered props plus an added prop, a new row added after Erase. Fails, with a readable message, for: a comment between `(` and the row, a comment that quotes `copy.settings.erase.rowLabel`, an extra attribute on the Your letters `<ListSection>`, the `localDeletionAllowed() && (...)` form, and the row moved above Storage. These are the price of source pins and each failure says what to update. Not pinning "last" is right; pinning "after Storage" is a fair floor (DEVICE_TEST_PLAN S1-95(a) says "last", and a new row after Erase would still pass).
- Comment at erase-everything.ts:88: true. The confirm is `Alert.alert(d.title, d.body, d.buttons)` (erase.tsx:73-83, after `haptic('warning')`), no TextField, and the existing test at erase-all.test.ts:854-870 pins "no typed word" on erase.tsx. The row sits in Your letters (index.tsx:145-157), not "Your data".
- j16 prose edit: `git diff --word-diff` shows one insertion inside the step() string. I transpiled the file before and after with TypeScript (0 diagnostics both) and the output is identical once that string is masked. No assertion changed; no apostrophe added to the literal.
- BACKLOG: `node scripts/agents/check.mjs` consistent (26 agents, 394 tasks); `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` 136 of 136; `node scripts/trace.mjs --no-write` exit 0 (the 5 undefined IDs are in a file this PR does not touch). With parseBacklog and eligibility run on both versions: BL-387 status "ready" becomes "done"; BL-775 and BL-781 go from `{ok:false, "blocked by BL-387"}` to `{ok:true}`. BL-776 and BL-777 stay `needs-decision` (unchanged). Consequence to know: the dispatcher may now offer BL-775 (S1, changes erase semantics, wording needs the founder per D-144) to an agent; agent PRs never merge, so this is the intended follow-up, not a defect.
- Banned characters: 0 bytes at or above 0x80 in added lines and in both commit messages; no em or en dash, curly quote, ellipsis or emoji.
- `npx tsc --noEmit` in apps/mobile (21 s): only expo-clipboard (help-fallback.tsx:11) and expo-local-authentication plus its three follow-ons in app-lock/controller.ts. Test files are in the tsconfig include, so the new block typechecks.
- `git merge-tree --write-tree origin/develop 12034706`: clean, exit 0 (tree 12e5a174); develop has not moved since the merge base.
- CI at this head: 12 of 13 checks complete and green or skipped, including `required`, typecheck, tests and content rules, database rules, compliance-fence, agent team consistent; "iOS simulator build" skipped (no native files changed). "store-profile Release launch (testflight env, no seam, 20 s)" was still in_progress when I read it; mergeable_state was "unstable" for that reason. A PASS holds only once required CI is green at this exact head: `required` is green now, and the release-launch check needs a re-read before merge.

### Is "the typed confirm takes the word in any case" (erase-all.test.ts:823) stale?
Not stale, still true. It unit-tests `typedWordMatches` (wipe.logic.ts:7), which Delete this book still uses (delete-book.tsx:42, a `TextField` with testID `deleteBook.typed`, word `delete`). The Erase everything confirm is the alert with no typed word. Only the title is ambiguous after #520 (it does not say "Delete this book"). Not this PR's change; a retitle later would help.

### Notes (none blocks merge)
1. docs/BACKLOG.md:2880 (Source line of the follow-up section) still says BL-387 "stays `ready` while #520 is open ... Karma marks BL-387 done in the merge follow-up". It is a dated history note, but it now contradicts line 1182 on the same page, and lines 2895 and 2905 (BL-776, BL-777) still say "the build waits for PR #520 (BL-387) to merge". BL-775 and BL-781 still read "Status: blocked (BL-387)", which the parser treats as unblocked (shown above); a human skimming sees "blocked". One sentence at 2880 would settle it.
2. The pin does not check the row's text, only that the key exists and is non-empty (`rowLabel` is "Erase everything on this phone", strings.en.ts:879, and no test pins it). `expect(en.settings.erase.rowLabel).toBe(en.settings.erase.title)` would close it.
3. settings-home.test.ts:156 ("every row develop has") lists the Your letters rows but not Erase. The pin lives in erase-all.test.ts instead; fine, but a person editing Settings home reads settings-home first.
4. Neighbouring stale comments, not in this PR: erase-everything.ts:25 says "Settings > Languages and speech removes them" (shipped copy says Storage, strings.en.ts:890; NA-23 already notes that screen does not exist) and export/index.ts:6 says "Settings, Your data". BL-387's Scope line (1185) still says "under Your data" and "typed confirm".
5. PR body: "Based on the head of #520 ... will be rebased once #520 merges" is out of date (it is on develop 73fcc1ea now), and the `npm test`, `test:db`, `typecheck` boxes are unticked.

### Device test plan
Covered. S1-95(a) (Settings home, rows in order, Erase last in red on a never-signed-in phone) and S1-133(d) to (f) (open the row from Your letters, alert, Erasing screen). For this change a human only needs S1-95(a) on the TestFlight build: the red Erase everything row is the last row of Your letters. S1-133 stays the founder's and unrun, as BACKLOG now says.

### Not verified
- Full `npm test`, `test:db`, `test:functions`: not run (CI reports them green). The full apps/mobile vitest suite was not run, only the 15 files above.
- Rendered Settings home on a device or simulator: not run; these are source pins, and I did not check the row renders.
- The in_progress release-launch check result.

Reviewer: independent of the author (CR-44).

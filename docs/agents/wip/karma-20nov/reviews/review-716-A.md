## Review A at 98f79298fdcd139ca530be4885e81f70ddb33be0: PASS WITH NOTES

Lens A, second round. Head verified with gh api: 98f79298, ready for review, base develop. The head is one docs-only commit (DEVICE_TEST_PLAN.md, +5/-5) on b8c1056b; I read `git diff b8c1056b..98f79298` and `git diff origin/develop...98f79298` (13 files, +329/-35) myself and did not rely on the PR body. Full mobile, core and tsc runs below were done at b8c1056b; the only change since is that one docs file, and I re-ran the PR tests and content at 98f79298.

### My earlier findings
1. Merge: fixed. `git merge-tree origin/develop 98f79298` has no conflicts (develop tip eadea4f4); the net diff is the PR's own 13 files. The branch still lists 4e322591 and 70bb9f64 as commits, but the net diff is clean.
2. The two reversed #701 pins: fixed on purpose, each with a comment (first-run-child-name.test.ts:122-153). I read NX-36 on branch docs/nx-36-screen-specs-9nov myself. S13 line 484 (and line 486, prompts skipped for a nameless child): "Nameless: the stage alone, '7 MONTHS' ... spec: omit the name and the dot. VoiceOver reads 'Asha, 7 months' / '7 months'." Audit table line 724: "7 MONTHS (no name, no dot)". So the builder's quote is exact and the rule is right for Tonight. S14 line 601: Children row of a nameless book, "title = ch.name || fallback ... 'Your child's book'", and the child page title the same. The PR keeps "Your child" for the row: a flagged, acceptable choice, not a defect. It adds no word (existing onboarding.childFallback, capitalised), it sits beside rows that read "Asha", and the PR body now says the spec's words need #703's `fill()` capital (`fill(copy.book.title, {child})`). Until #703 lands, the book page title reads lowercase "your child's book". The founder should still see that the row is shorter than the spec.
3. Write: fixed. writeDateline calls tonightDateline with the name as the fallback, so Write and Tonight cannot differ (test over 4 names x 3 stages). Cases: nameless with age gives "7 months", spoken "7 months"; named gives "Asha · 7 months", spoken "Asha, 7 months" (built, not derived by replacing the dot, so a name like Marcel·la is safe); named with no age (before the birth) gives "Asha"; nameless before the birth gives an empty line that write.tsx leaves out. The container uses gap-3, so a missing line leaves no gap (write.tsx:385). Caps and VoiceOver: label comes from `dateline.a11y`.
Should-fix items: NameEditor error fixed (nameEditorError: stored '' and draft '' says nothing; spaces typed say "Add a name to save."; clearing back to '' says nothing again; a named book cleared says it, Save stays dimmed). The memo pin now requires `, childName]` (draft-card.test.ts:681).

### New code, read in full
- writeDateline, nameEditorError, childRowTitle, the prompt wiring: no new defect found. packages/core/src/prompts.ts is byte-identical to the first round (selectPrompt falls back to the full library only if filtering would empty it; 2-month and before-birth pools stay at 17 and 11 openings).
- Net-diff scan: no em or en dash, curly quote, ellipsis or emoji; the only non-ASCII is the middle dot already used in datelines. Not run: eslint (no eslint config in the worktree; `expo lint` not tried).

### Review B's claim about step (e): true, and I measured it
bandFor (packages/core/src/prompts.ts:28): under 4 months is band 0-3, 4 to 6 is 4-6, 7 to 9 is 7-9. The only name prompts are opening.0-3.name (band 0-3) and opening.before.name (band before); together.13-18.name-things is not name-themed. A born child is never offered the before set (audience filter, prompts.ts:134). So a seven-month-old can never draw either, and the old step could not fail. I simulated the real library (fresh install: no recent keys, no last entry) over 90 start dates from 2026-11-10, with 20 presses of Another thought on Tonight and 20 on Write, named (no flag) versus nameless (flag):
- 2 months and 3 months: name prompt seen on 82/90 days on Tonight, 90/90 on Write; nameless: 0 and 0.
- 4 months and 7 months: 0/90 and 0/90 even unfiltered (so those steps prove nothing).
- Before the birth: 82/90 Tonight, 90/90 Write; nameless 0 and 0.
So "about two months" and "under four months" are true, and (e) (Tonight then Write) now fails on a broken build on all 90 days.

### Notes on the new S1-191 text (none blocking)
- Id is unique: highest on develop is S1-190; no other fetched remote branch (619 refs) defines S1-191. The steps are executable as written.
- (h) presses Tonight only: an unfiltered build would still pass on 8 of 90 days. Add "then twenty times on Write" (90/90).
- (e) quotes "Where did the name your child come from?" as a possible draw, but that prompt belongs to the before-birth set and cannot appear on a born two-month-old; it belongs under (h). The phrase "the two name prompts of the first months" is therefore slightly off.
- (a) still says VoiceOver must not read "dot 7 months" (stale number). (c) says VoiceOver reads the row "and its hint": the Children row passes no accessibilityHint and ListRow has no default (settings/index.tsx:126-132), so there is no hint to hear.

### Runs
- PR tests at head: nameless-surfaces 22, first-run-child-name 19, draft-card 63: 104/104 green. Red-before (sources reverted to develop, tests kept): 21 of 104 fail in those files (all Write, Name editor, Settings row, prompt and wiring tests), 2 of 4 new core tests fail; the cover and R28 characterisation tests pass either way, as the body says.
- Full apps/mobile: 4451 pass, 72 fail, in the same 8 sandbox files as plain develop eadea4f4 (4429 pass, 72 fail): config, privacy-manifest, store-sign-in-capabilities, licences, preflight-production, hosting-ios17, capabilities, app-lock-wiring (expo-clipboard and expo-local-authentication missing here). The +22 passes are the new tests; no name-related failure.
- packages/core: 34 files, 1237 green. packages/content: 16 files, 383 green. tsc: 5 errors, output identical to plain develop (the same two missing packages).
- Servers off and a named book: unchanged (flag set only for a blank name; dateline, row and Name error unchanged for a name). No analytics or log change.
- CI at 98f79298 was still running when I looked (7 success, 4 in progress, 1 skipped). A PASS holds only once required CI is green at this exact head.

### Not verified
Device rendering, VoiceOver, AX5, and the cover with a blank name; eslint; any open PR other than by id search of fetched branches.

Reviewer: independent of the author (CR-44).

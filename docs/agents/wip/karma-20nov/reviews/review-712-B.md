## Review B at a997a0faa626a4f54141eaff00a3c0ada151210d: PASS WITH NOTES

Re-review, delta only (99c3bedf..a997a0fa: one docs commit, `docs/qa/DEVICE_TEST_PLAN.md`, +3/-3). The four notes from my last pass are fixed. No must-fix. The remaining notes are carried nits and device unknowns. Everything in my earlier reviews of fa8ff806 and 99c3bedf about the source files still stands: this delta touches no source or test file.

### What I read and ran
- `gh api` head sha = a997a0faa626a4f54141eaff00a3c0ada151210d, one commit on 99c3bedf. develop is still 6cd2223b (no drift). `git merge-tree --write-tree origin/develop <sha>` is clean.
- Read the full delta and S1-97b Needs, Steps and Expected (e) against `list-row.tsx` (the `under` branch, lines 106-108) and `speech-row.tsx` (the ring and word are one `flex-row items-center gap-3` node).
- Worktree at the new head: `qa-release-catalog`, `speech-row-action-label`, `list-row.logic`: 3 files, 35 tests pass. Worktree removed.
- Added lines are pure ASCII: no dashes, curly quotes, ellipsis or emoji. No new product word: "Tap Stop" and "Tap Download" quote the existing visible words.

### The four notes, checked
1. Order in (e): now "look at the English row on Download. Turn VoiceOver off, tap the row to start the download, and look at it on Stop. Then turn Voice Control on." VoiceOver is off before the tap, so a single tap activates the row. Fixed. Looking at the Download state first with VoiceOver still on is harmless.
2. Needs: the "(the 575 MB model; ...)" parenthesis follows "full-tier phone" again, and the SE 3 clause reads "and for (e) an iPhone SE (3rd generation), the narrowest screen (375 pt wide)". Fixed. The SE 3 is a full-tier phone (plan line 38), so one phone covers the whole step. "Narrowest" is true among the plan's phones.
3. Expected (e): "the word sits under English (and, on Stop, the ring beside it), and nothing is broken across lines." This matches the code: the node is the ring and word in one row, placed under the title block (`list-row.tsx:106`); Download has no ring (`percent: null`, `recordings.logic.ts:77-78`). Fixed.
4. Afterwards: "Turn Voice Control and the larger text size off afterwards." Present at the end of (e). Fixed.

Runnable end to end, in order, on an SE 3: (d) leaves the row on Download; (e) looks at Download at AX5, starts it with VoiceOver off, looks at Stop, then Voice Control "Tap Stop" (row goes to Download), "Tap Download" (starts again), then settings are turned off. Nothing destructive; no Remove step remains; no real data is touched (the speech files are not a person's words, and recordings and letters stay either way).

### Notes (none blocks the merge)
- Carried from earlier passes: the advice to turn Voice Control on before throttling the link (first use may fetch a language file; not verified) was not taken; `COMPONENTS.md` 2.11 does not list `actionWord`; `speech-row.tsx:88-89` states "Voice Control hears Tap Stop" as fact before a phone has shown it; the 22 pt ring will look small beside 64 pt text at AX5.
- The Needs sentence is one long run-on, as it was before this PR; not worth another round.

### CI at this head
The head is new and CI is still running. Success so far: install, edge functions, applied migrations unchanged, native files changed, Migration guard. In progress: CI, tests and content rules, typecheck, database rules, no e2e seam in store bundles. Queued: store-profile Release launch, iOS compile. Skipped: iOS simulator build. The Compliance fence workflow is `startup_failure` again (systemic across recent PR runs, as noted before), so the required `compliance-fence` check has not reported and `mergeable_state` is "blocked". A PASS holds only once required CI is green at this exact head; I have not seen that yet.

### Only a device can show
Unchanged: whether Voice Control matches "Tap Stop" on the label "English, Getting ready, 40%, Stop"; what VoiceOver says as the percent changes; whether "Download" (about 271 pt by my font-metric estimate) stays on one line in the 303 pt row on the SE 3 at AX5.

### Not verified
Full `apps/mobile` vitest, `npm test`, `test:db`, `test:functions` (not run; the delta is one doc). Android/TalkBack.

Reviewer: independent of the author (CR-44).

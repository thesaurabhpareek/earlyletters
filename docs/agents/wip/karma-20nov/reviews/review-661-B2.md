## Review B at 8c62c98ddf61e7c241fd860279d3884c06307007: PASS WITH NOTES

Delta re-review of PR 661 (lens B) after my CHANGES at a5313a31. Independent in method, not identity: the fixes were written by Karma's session through an agent. Head confirmed with gh api before I started (base now cda0ba83). No must-fix remains. A PASS holds only once required CI is green at this exact head.

**What I read and ran** (detached worktree at the exact sha)
- Commit shape: 8c62c98d changes only docs/qa/DEVICE_TEST_PLAN.md (4 lines in, 4 out). 99a6d30e merges develop cda0ba83 (#662, #663) into a5313a31. engine.ts, speech-row.tsx and speech.en.ts are byte-identical to what I reviewed at a5313a31.
- Trial merge: git merge-tree --write-tree origin/develop (cda0ba83) is clean.
- Tests at this head: settings-p6b 21, engine 55, download-wait-line 15, where-live 12, qa-release-catalog 8, first-run-wait 15, speech-download-status 18: 144 pass (matches the PR body). packages/content vitest: 12 files, 281 pass. Full apps/mobile vitest: 4056 pass, 61 fail in the same 7 files as before (config, privacy-manifest, licences, preflight-production, hosting-ios17, capabilities, app-lock-wiring; missing expo plugin here). tsc --noEmit: the same 5 errors, all missing expo-clipboard and expo-local-authentication.
- Bytes: the 126 lines this PR adds against develop cda0ba83 contain no non-ASCII character and no run of three dots (no em or en dash, curly quote, ellipsis character or emoji). The 5 three-dot runs that show up in a diff against a5313a31 come from the merged-in develop commits, not from this PR.
- S1-97b: one heading in the plan, none on develop, and none of the other open PRs adds it to their plan patch (scanned all pages).

**Merge resolution in recordings.logic.ts: correct.** The `downloading` case keeps #662's `downloadingLine(...)` subtitle and `shownPercent(fraction) ?? 0` for the ring, and adds action 'stop', trailing packsCopy.stopButton and hint s.stopHint. The header comment keeps both sides. `waitingForWifi`, `noSpace`, `absent`, `here`, `unknown` are as intended. The two download-wait-line.test.ts assertions changed only from null to 'stop' and 'Stop'; nothing else in that file or in settings-p6b changed against develop apart from the reversed and added assertions I reviewed before.
Mutations at this head, each reverted: downloading back to no action, word and hint: 3 fail (2 settings-p6b, 1 download-wait-line), as the PR body says; waitingForWifi action null: 2 fail; cancelPack loop removed: 1 fails; engine emit removed: 1 fails; subtitle switched back to the old floor line (drops #662's downloadingLine): 3 fail, so the merge kept #662 intact. Same survivor as before: the ring beside the word is not pinned by any test.

**Each earlier must-fix, checked against the code**
1. S1-97b (c): now starts "Tap Stop first so the row reads Download, then turn Wi-Fi off". Traced: Stop leaves no hold and no progress, so the row is absent and reads Download; with cellular and the switch off, checkCanDownload (engine.ts:571) throws waiting_for_wifi on the first attempt from entry.bytes alone, so a partial file does not change it; the row then reads "Waits for Wi-Fi, 575 MB" with Stop. The rest of (c) and its Expected hold. Needs now says to choose "Not now" on the first-run card; that label is speechConsentCopy.laterButton, and Not now starts nothing, so the English row reads Download. The full-tier note is right: 16 MiB over 574.9 MB is about 2.9%, over 191 MB about 8.8%, so "about 9%" is correct (my earlier "about 8%" was the loose one).
2. S1-31 (c): "The Wi-Fi wait row says why and offers Stop (S1-97b); the low-space row says why and offers nothing to tap." Matches speechRow (waitingForWifi is 'stop', noSpace is null).
3. PR body: now says plainly that it reverses the P6b pin for downloading and waitingForWifi only, cites Karma's #631 comment, names both options, and notes that #596 section 9 calls the row busy. It also says restart-on-foreground and the no-Stop-before-first-byte window. All of that matches the code I read.

**Notes (none blocks)**
- S1-97b Needs, "or Remove English in Settings > Storage first": Remove is offered only once the model is installed (recordings.logic.ts:62, state 'here'). On a throttled, still-running download the row shows Stop, not Remove. Suggest "or tap Stop on the English row".
- S1-31 (c) Steps still say the language row is under Recordings; #631 moved it to Storage (S1-97 covers it). Pre-existing, not from this PR.
- The body says this is "the build 12 option A" and cites a founder request at about 11:30 AM PT; Karma's #631 comment said build 11. I cannot see the founder request or a build-numbering record in the repo or on #661/#631, so I could not check either.
- The three "How it was checked" boxes (npm test, test:db, typecheck) are still unchecked; the body says what was and was not run. CI covers tests, typecheck and database rules (below).
- Behaviour note unchanged and disclosed: with a recording waiting, a Stop is undone on the next return to the front (index.ts:174, :393).

**CI at this head:** 15 of 16 runs complete: success for required, tests and content rules, typecheck, database rules, web, web e2e, Deno, migrations, compliance-fence (one earlier compliance-fence run shows cancelled, a later one success); iOS simulator build skipped; "store-profile Release launch (testflight env, no seam, 20 s)" still in progress. mergeable_state unstable.

**Not verified:** anything on a phone (S1-97b not run); VoiceOver and AX5 layout of the ring-plus-word trailing view; test:db, test:functions and the other workspaces; the founder request and build numbering named above.

Reviewer: independent of the author (CR-44).

## Review A at d53394f1fd9fba58e4550ad12e1f87a38e0311e9: CHANGES

PR #626, delta re-review. At 0ab23d67 I gave CHANGES (device row, freeze) and Review B gave PASS; Karma ruled the freeze and scope question (S1, in tonight's build) and kept one blocker: the device row. This head answers that blocker, but the new row has errors a person with a phone would hit. All fixes are in one docs file and need no code change.

### What I ran and read
- `gh api pulls/626` head is d53394f1 (matches). `git diff 0ab23d67 d53394f1 --stat`: one file, `docs/qa/DEVICE_TEST_PLAN.md`, 19 insertions, 1 deletion, one commit. So the code, the content strings and both tests are byte-identical to 0ab23d67, and my earlier "What holds" list stands.
- `apps/mobile` vitest `first-run-wait.test.ts` + `speech-download-status.test.ts`: 2 files, 33 tests passed. Also `qa-release-catalog.test.ts` (it reads the plan): 8 passed.
- Added lines: no non-ASCII character, so no dashes, curly quotes, ellipsis or emoji; no fear, streak or gendered words.
- Trial merge: `git merge-tree --write-tree origin/develop d53394f1` at develop 058d08ea (24 commits ahead, and develop changed the same plan file by +109/-4): exit 0, no conflicts, tree b4d09bab.
- Step ids: `git grep 'S1-15b\|TF1-WAIT'` on origin/develop finds nothing; the merged tree has S1-15, S1-15a, S1-15b, S1-16 once each. I listed all 126 open PRs and read the plan diff of the 13 that touch it (#517 #520 #603 #614 #615 #618 #627 #631 #635 #640 #646 #647 #653): none adds an S1-15x id or TF1-WAIT (#618 adds S1-40; #603 adds S1-50 to S1-74). #628 to #630 are merged (S1-81 to S1-83).
- CI at d53394f1: every check success except the iOS simulator build (skipped, no native change) and "store-profile Release launch", still in progress when I looked; `mergeable_state` was "unstable" for that reason.

### Covered
- S1-15a is amended correctly: "Almost ready. Checking the download." matches `speechConsentCopy.checking` (speech-consent-card.logic.ts:52), and "announces each change of state once, never each percent" matches `stateAnnouncement` (logic:82).
- S1-15b exists and maps to all four "Needs a phone" checks: the sliver before 1% (Expected 1, Record asks for the percent where the fill first showed), Reduce Motion (step 2), VoiceOver not repeating (step 3), the footnote at AX5 (step 4). I confirmed the AX5 claim: the card sits in a ScrollView with "Write the first one" pinned below it (onboarding.tsx:310, 540).
- PR body now carries a severity line (S1, founder report, Karma's ruling).

### Must fix (all in S1-15b, docs only)
1. **Expected 1 is false on this build: "The bar's track is visible from the start."** The bar is drawn only once bytes move: `consentLine` returns `bar: null` for the tap line, `queued` and `verifying` (logic:47-54), and `speechDownloadProgress` is null while "queued or waiting is not moving" (transcription-queue/index.ts:305). Scenario: the tester taps Download, sees "Getting ready. It waits for Wi-Fi." then "Waiting to start" with no track, and records step 1 as a fail. Say "the track appears when bytes start to move ('Downloading'); before that there is no bar".
2. **Update line names a file that does not exist.** `components/onboarding/speech-consent-card.tsx`; the file is `apps/mobile/src/components/speech/speech-consent-card.tsx` (`git ls-files`).
3. **Step 5 expects a stop that no step causes.** Wi-Fi off then on gives the Wi-Fi wait line and a resume, not "The download stopped." A tester cannot produce the stop sentence from this step. Also the Wi-Fi wait line needs "cellular only, Use mobile data off" (S1-15a step 2 says so; this row drops it). Either move the stop to a step that causes it (Settings > Storage cancel, as S1-15a step 6; note that shows "Paused" plus Try again with no "The download stopped." lead, logic:36) or delete that sentence.
4. **Steps 3 to 5 need a download still running, and the row does not say how to keep one.** The footnote is hidden once the words are here (`showsStartNow`, logic:68; `done` at card:71). 575 MB on ordinary Wi-Fi can finish inside step 3's 2 minutes, and then step 4 (AX5) has nothing to look at and step 5 has nothing to interrupt. Fix: set AX5 and VoiceOver before tapping Download, and run steps 3 to 5 on the throttled link S1-15a step 5 describes.
5. **Step 2's "or after Remove in Storage" cannot show this bar.** `SpeechConsentCard` has one caller, `onboarding.tsx:511`, and first run is reachable only with no book (book.tsx:242, index.tsx:183 redirect there). After Remove, the card does not come back. Keep only "a second fresh install" (S1-15a step 3 had the same words, but it only needed the VPN note, not the bar).

### Nits (do not block)
- Step 3 never says to swipe to the bar, but Expected 3 asserts what focusing the bar reads.
- Step 6 reads as one letter. "Write the first one" goes to Tonight (`router.replace('/')`, onboarding.tsx:233); there you choose Type or Speak, two letters. Say so, and name the buttons "Keep it" and "Finish". Add that the words arrive after the download ends.
- No **Needs** line (a build with this PR, Wi-Fi, SE 3 plus a Pro Max, VoiceOver). The plan's own rule requires only Steps, Expected, Record, Update, and S1-15a has none, but 19 rows use one.
- Reduce Motion: `snappy` has response 0.28 s (tokens.ts:271), so glide against step is hard to see by eye; suggest a screen recording and a slow replay.
- PR body says "build 11"; Karma's ruling says tonight's build 10. I cannot see the status board, so not verified which is right.
- The PR still has no labels (`labels: []`, checked on pulls and issues endpoints). The body asks for `agent:mobile`, which exists in the repo, and Karma asked for it. Labels are not code; the lead can apply it.
- Carry-over from my earlier review (code unchanged): `retry()` can announce `chosenYes` twice; `transformOrigin: 'left'` is not the leading edge under RTL; Android hears no state changes.

### Not verified
- Anything on a phone. The row has not been run; every Expected line above was checked against the source only.
- Whether the status board says build 10 or 11.
- The in-progress CI check at the time of reading. A PASS holds only once required CI is green at this exact head; "required" was green.

Verdict note: the coverage Karma asked for is there, and the code needs nothing. I give CHANGES because Expected 1 and the Update path are wrong against the code, and steps 3 to 5 cannot be run as written by a person with a phone. A re-review of the fix is a docs-only delta of a few lines.

Reviewer: independent of the author (CR-44).

## Review A at 950997ced4d6223850af2022cf215049aafa530a: PASS WITH NOTES

PR #626, fourth delta pass (base for the delta: 3c68707f, where I gave CHANGES). The commit is by Karma's CTO session; I am independent in method, not identity. This time I traced each step and label to the screen that renders it, not only to a string. Both A3 must-fixes are fixed and true. I found no must-fix: a tester can run S1-15b as written. Three small wording issues are below as nits, one of which I would fix in the same push.

### What I ran and read
- Head matches (gh api pulls/626). `git diff --stat 3c68707f 950997ce`: one file, `docs/qa/DEVICE_TEST_PLAN.md`, 9 insertions, 9 deletions, hunks at lines 224, 229, 233-236, 240, 242-243. Line 224 is the S1-15a Expected line (the "never 0%" qualification the brief names); the rest are inside S1-15b (228-245). `git diff --stat 0ab23d67 950997ce`: the same single file, so all code, content and test files are still byte identical to 0ab23d67.
- Added lines: no non-ASCII byte (no em or en dash, curly quote, ellipsis, emoji); no child pronoun, streak, badge or AI wording.
- Trial merge: `git merge-tree --write-tree origin/develop 950997ce` (develop c9641243): exit 0, tree 492b22a6, no conflicts. Merged plan has S1-15, S1-15a, S1-15b, S1-16 once each; no duplicate step id; S1-15b absent from develop. I re-read the plan patches of all 100 open PRs: 10 touch it, only #626 adds an S1-15x id.
- Unit-test line cites, all checked in the file at this head: first-run-wait.test.ts:138 is the "Almost ready. Checking the download." assertion; :75 is start-now hidden on 'cancelled'; :103-147 is the failure lead, retry and announcement block; speech-download-status.test.ts:98 is the Paused-with-Try-again test. All correct.
- Tests: `apps/mobile` first-run-wait 15, speech-download-status 18, qa-release-catalog 8, all passed (41); `packages/content` vitest 12 files, 280 passed.
- CI at this head: 10 success, iOS simulator build skipped; "no e2e seam in store bundles (B-8)", "store-profile Release launch" and "web e2e (Chromium)" still in progress, and "required" had not reported. `agent:mobile` is applied. A PASS holds only once required CI is green at this exact head.

### Trace of step 6 and step 5 to source
- "Write the first one" (strings.en.ts:191) calls `finish()`, `router.replace('/')` (onboarding.tsx:233): Tonight.
- Tonight's "Type" and "Speak" (index.tsx:234-235; copy.tonight, strings.en.ts:209-210). Type pushes /write (index.tsx:227). Write's footer is "Add to {child}'s book" (`addButtonLabel`, write.tsx footer; strings.en.ts:423, short form 425) over "Keep private"; there is no "Save" button on Write, so the new text is right. The button is disabled until there is text. Its tap arms the keep and replaces to /review (write.tsx `keep`); Review consumes it and saves (review.tsx:582-587), then `router.dismissTo('/book')` (review.tsx:424). "You land on the Book" is true.
- Speak pushes /listen and starts the mic (index.tsx:226); Listen's "Finish" is `copy.tonight.states.stopButton` (listen.tsx:421; strings.en.ts:227); it replaces to /review (listen.tsx:145). With the pack not installed the job is `waiting_for_pack`, so Review shows the wait card (review.tsx:638-656, words-state.logic.ts:239, `languageDownload`): title "Your voice is kept", the note "Getting ready, n%" or "Waits for Wi-Fi, 575 MB", and the primary "Keep the recording" (words-state.logic.ts:97-98; strings.en.ts:368). The note is rendered at review.tsx:1164. So "look at the wait line first, then tap Keep the recording" is runnable.
- "Keep the recording" saves a voice-only letter, private (`saveVoiceOnlyFromDraft`, inBook false, review.tsx:542-544) and lands on the Book. The Book lists private letters with a chip (letter-card.tsx:132) and routes waiting letters to `WaitingCard` (book.tsx:343, 365-376), whose reason is "Getting ready, n%" or "Waits for Wi-Fi, 575 MB". True.
- Step 5: with cellular on and "Use cellular data" at its default, off (engine.ts:377-379, `=== '1'`), a 574 MB pack gives `waiting_for_wifi` (engine.ts:572-573), rechecked every chunk (engine.ts:624) and resumed when Wi-Fi returns (engine.ts:331). The line is "Waits for Wi-Fi, 575 MB" (logic:44; speech.en.ts:16). With no cellular the engine throws offline (engine.ts:571) and the card says "It carries on when you are back online." (logic:46; speech.en.ts:36), exactly as the new Needs sentence says. The start-now line stays on a hold (logic:68-70).
- Expected 5, "Review and Book never read the download failure": true (no `.failure` read in review.tsx beyond the job's own, none in book.tsx; both use progress and hold only).
- Expected 6 first-percent gap: book.tsx:374 and words-state.logic.ts:160 both floor, so "Getting ready, 0%" is real there (my A2 probe printed it at 2 MB of 575 MB). Expected 1 to 4 are unchanged and still true as in A3.

### Must fix
None.

### Nits (fix if you touch the row again; none stops a tester)
1. Step 6, "(the letter is saved and you land on the Book). Then tap Speak": Speak and Type live on Tonight only (book.tsx has neither). Add "go to Tonight" before "tap Speak".
2. The S1-15a Expected qualification (plan line 224) names Book and Review only. Settings > Recordings also floors (recordings.logic.ts:59), and so does the language row (language-row.tsx:32), so a tester watching Settings in the first percent can see "Getting ready, 0%" too. Say "Book, Review and Settings".
3. S1-15a step 6 and its Expected are untouched: it still sends the tester "back to a screen with the card or Review" and expects "Paused after a cancel" and a Try again line. Storage after Stop reads "Please try again in a moment." with Try again (storage.tsx:45, 97-103; packs.en.ts has no 'cancelled' failure), and neither Review nor Book has a stopped line. Expected 5 now says this correctly for S1-15b; S1-15a needs the same edit as a follow-up.
4. After the first kept letter an ask can rise over the Book (reminder prime or account sheet, review.tsx:425-432, asks/index.ts:77); dismiss it. Not verified whether it appears under the `testflight` profile with servers off. The first Speak may also raise the microphone prompt.
5. Carry-over, code unchanged: `retry()` can announce `chosenYes` twice; `transformOrigin: 'left'` is not the leading edge under RTL; Android hears no state changes.

### Not verified
Anything on a phone: VoiceOver order and wording, AX5 wrap, Reduce Motion stepping, the 1% sliver width, the Network Link Conditioner "3G" speed, whether the hold appears within a minute of Wi-Fi off, and that lifting the throttle lets the waiting letter get its words end to end. `tsc` not rerun (no code change since 0ab23d67). The in-progress CI checks.

Reviewer: independent of the author (CR-44).

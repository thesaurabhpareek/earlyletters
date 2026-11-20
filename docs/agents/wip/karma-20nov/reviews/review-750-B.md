## Review B at ef6b9bb2e4ef2adef7bc04c8c82b836929e6b078: PASS

Re-review of the one commit on top of b1c79dd5 (ef6b9bb2, "make S1-166 doable by one person and say what a late exit proves"). Head sha confirmed equal to the value given (gh api pulls/750). origin/develop is still c1f7cec5 and is an ancestor of the head.

**1. What the delta is (git diff b1c79dd5..ef6b9bb2, 4 files, 7 insertions, 7 deletions).** It matches your expectation exactly; nothing else.
- docs/qa/DEVICE_TEST_PLAN.md (S1-166, lines 579 and 581 and 583): three clauses added, one each in (a), (c), (e). Nothing else in the step moved (Needs, Expected, Record, Update unchanged).
- apps/mobile/src/lib/capture/review-persist.logic.ts:160: a JSDoc comment on `cancel()` only. No executable line in the writer changed (the diff for that file is that one comment line).
- apps/mobile/test/review-writer-autosave.test.ts:51: fixture `MORE` "singing to her" became "singing to you". The tests index `MORE` by length only, so nothing depends on the word.
- apps/mobile/test/store.review-v9.test.ts:165 and :169: two titles reworded ("the wait for typed words is at most 500 ms"; "writes the last words after the wait, ..."). Test bodies unchanged. The catalog rows and CSV are untouched.

**2. S1-166 read by a person with one phone.**
- (a) "a held key on a Bluetooth keyboard repeats, or a second person can press the buttons, since one person cannot type and press them at once": works. It is the S1-36 (m) clause, so no contradiction with it. Two small wording notes, neither blocking: the "since" reads as if it also covers the Bluetooth route (it only explains the second-person route), and the Needs line (still unchanged) offers "a Bluetooth keyboard if there is one ... or touch typing" without listing a second person as something to bring.
- (c) "once Change words text exists Review does not show the original words": TRUE. review.tsx:1009-1011 shows only `userText` when it is non-null; the "With small fixes / Exactly as said" control and the fixes list sit under `!typed && userText === null && !editing` (review.tsx:1046-1052), so they are gone; while editing the field holds `finalText` (= userText, review.tsx:430 and :1002). Cited test: "`review-writer-autosave.test.ts` checks that `raw_transcript` is never changed": true but narrower than "never": one assertion, review-writer-autosave.test.ts:127 (`rawTranscript: SAID` after the 1.7 s burst); the replay test asserts it for all 100 seeds (review-persist.replay.test.ts:205, `expect(back.raw).toBe(said)`). Accurate enough; adding the replay file would make it exact (nit).
- (e) "a tap that comes later lets the timer write the words first, so that run proves nothing about the exit and is repeated": TRUE. The timer is armed by the first unwritten change, so it fires no later than 300 ms after the last key; a tap more than a third of a second after the last key always finds the words already written. Done exists both in the header and in the footer above the keyboard (review.tsx:823, :919), Close top right (screen-header.tsx:49): labels match. The converse is not claimed and not guaranteed (a tap inside the third of a second can still follow a timer fire), so the run is likely, not certain, to exercise flush; the wiring test pins the call sites.
- Against the BL-816 row: the row's device bullet wanted "the recording and the original words intact". (c) now says openly that the step checks the recording only and why. The code reasons are true (above), so this is an honest narrowing and I accept it; the original words are covered by the Node assertions, not by a phone.

**3. Re-ran at ef6b9bb2.** `node scripts/qa/release-catalog.mjs --check`: exit 0. Six files (`qa-release-catalog` 8, `review-writer-autosave` 24, `review-persist.replay` 1 with 100 seeds, `review-persist.wiring` 7, `store.review-v9` 13, `write-autosave` 28): 81 of 81 pass. Mutation and the one-versus-two-timer differential from my earlier review were not re-run: the writer's executable code is byte-identical to b1c79dd5 (comment-only diff), so those results carry over.

**4. ASCII and id.** Added lines in the whole PR (origin/develop..head): 0 bytes >= 0x80; the delta also has no double hyphen or ellipsis. S1-166 is absent on origin/develop (c1f7cec5), absent from the DEVICE_TEST_PLAN.md patches of all 160 other open PRs (rescanned at 161 total, paged), and absent from the plan at all 542 remote refs that carry it (61 distinct blobs) except this PR's own branch. PRs 167 and 168 (over 1000 files; GitHub omits the plan's patch) were read directly at their head shas: no S1-166.

**5. Merge.** `git merge-tree --write-tree origin/develop ef6b9bb2`: exit 0, clean (tree b3f186d8).

**6. CI at this head.** Checks were still running when I looked (14 listed: tests and content rules, database rules, B-8 seam guard, e2e simulator app and store-profile Release launch in_progress; typecheck, Deno, compliance-fence, install, migrations unchanged success; the `required` check had not appeared yet). The previous head's `required` was green, but that does not carry to this sha. This PASS holds only once `required` is green at ef6b9bb2.

My earlier rulings (one timer accepted; `partial` accepted) and the release-risk assessment (low, no schema, native or sync change) stand; the writer code is unchanged. Remaining nits: Needs line does not mention a second person; the stale PRD wording for F04-REQ-011 is left to the CPO by design.

**Not verified:** anything on a phone; CI result at this sha (pending); the PR's Node timing figures; local `tsc`.

Reviewer: independent of the author (CR-44).

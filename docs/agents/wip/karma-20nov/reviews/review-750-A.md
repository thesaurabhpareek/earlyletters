## Review A at ef6b9bb2e4ef2adef7bc04c8c82b836929e6b078: PASS WITH NOTES

Lens A (correctness of the writer and its tests), second pass. This replaces my review at b1c79dd5. Earlier findings carry over only where I re-ran or re-read them at this head, as marked.

**Head and delta.** `gh api .../pulls/750 --jq .head.sha` returns ef6b9bb2e4ef2adef7bc04c8c82b836929e6b078; one commit (ef6b9bb2) on top of b1c79dd5. `git diff b1c79dd5..ef6b9bb2` is 4 files, 7 insertions, 7 deletions, and is exactly what you expected, nothing more:
- apps/mobile/src/lib/capture/review-persist.logic.ts: one line, the JSDoc on `cancel()` (:160). No executable line changed. I diffed the whole file against my saved b1c79dd5 copy: the only difference is that comment. So the writer is byte-identical in code, and my rulings on it stand.
- apps/mobile/test/review-writer-autosave.test.ts:51: fixture `MORE`, "to her" became "to you". Same length, so no offset in the tests moves.
- apps/mobile/test/store.review-v9.test.ts:165 and :169: two `it` titles reworded ("the debounce is at most 500 ms" to "the wait for typed words is at most 500 ms"; "after the quiet" to "after the wait"). Bodies untouched. Nothing else in apps, docs or scripts references the old titles (grep).
- docs/qa/DEVICE_TEST_PLAN.md, S1-166: three clauses added, in (a) (a held key repeats, or a second person presses the buttons), (c) (this step checks the recording only), (e) (a later tap lets the timer write first, so repeat). Nothing else in the step moved.

**Ran at this head (worktree detached at ef6b9bb2).** review-writer-autosave 24, review-persist.replay 1, store.review-v9 13, review-persist.wiring 7, write-autosave 28, qa-release-catalog 8, export-waiting 19 = 7 files, 100 tests, all pass (the PR's count). `node scripts/qa/release-catalog.mjs --check` exit 0. `npx tsc --noEmit` in apps/mobile: only the 5 expo-clipboard / expo-local-authentication errors, none in review files. My random-sequence property harness (5 configurations x 3,000 seeds, write ok / throw / false, with cancel and without) passes 5 of 5, as before. `git merge-tree --write-tree origin/develop <sha>` is clean (exit 0); origin/develop is still c1f7cec5, the merge base.

**Mutation still holds.** Reverting only review-persist.logic.ts to c1f7cec5, new tests kept: 9 of the 24 new tests fail (long burst, kill at every 10 ms, reopened words, newest words, 30 s burst, burst then pause, Done/Close retry, flush that throws, next change after a throw) and the replay test fails at seed 40. My two replay copies (full model; model expectations deleted so only the independent bound remains) each fail the same 8 seeds, 40, 64, 65, 74, 77, 79, 82, 93, and fail 0 on head. The store.review-v9 and wiring tests pass on both, as before. I restored the file afterward (`cmp` against head).

**The new `cancel()` comment is true.** It now says review.tsx does not call it and Keep flushes first, and the letter takes its words from state. At this head: review.tsx has no `cancel` anywhere (grep of the file; the only other `.cancel` hits in src are account-deletion code, unrelated); the only `reviewWriter` use is review.tsx:308. Keep: `save` at :548, `writer.flush()` at :552, before `keepNeedsPlus(finalText)` at :560 and `saveLetterFromDraft(` at :569; `finalText = userText ?? cleanedText` at :430, from state. Other exits unchanged: AppState :313-314, unmount :318, text :326, Done :330, Close :909.

**ASCII.** The added lines of the delta have no non-ASCII character (grep -P, none), and the whole PR's added lines (merge base to head) also have none.

**Notes (no must-fix).**
1. The new S1-166 (c) clause is true in substance: review.tsx:1009-1012 shows `userText` when it exists, and review-writer-autosave.test.ts:127 asserts `rawTranscript` is unchanged. But "checks that raw_transcript is never changed" rests on one assertion in one test there; a word softer ("checks it is unchanged after a burst") would be exact.
2. Carried over from my first pass, unchanged because the code is: after a throw the words wait with no timer, so a crash while idle after a failed write can lose that burst (the PR's stated trade); `false` from `setDraftReview` is final, including the transient `recording` state (drafts.ts:284); `text(null)` is untested and unreachable from the screen.

**Not verified.** Phone behaviour and write cost on a device; the simulator kill run; the full apps/mobile suite and root `npm test`. CI at this head when I looked: `typecheck`, `install`, `compliance-fence`, edge functions, sizes, migrations success; `tests and content rules`, `database rules`, `no e2e seam`, the e2e simulator and the Release launch job still in progress; no `required` row yet. A PASS holds only once required CI is green at this exact head.

Reviewer: independent of the author (CR-44).

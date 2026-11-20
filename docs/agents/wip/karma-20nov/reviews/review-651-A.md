## Review A at 27fc1a313ef68abde7959cfc82119b4cf9c63c6f: PASS WITH NOTES

Lens A (correctness and data safety), PR 651, head confirmed equal to the given sha. A PASS holds only once required CI is green at this exact head.

**What I read and ran**
- Read the PR body, the full diff against merge-base 139807515 (3 files: write.tsx, write-session.logic.ts, write-session.test.ts), the whole of both source files, writeWords (review-view.logic.ts:279), the drafts repo (setTyped is a bare `UPDATE drafts SET typed_text WHERE id = ?`, drafts.ts:216), and listen.tsx:210 for the other AppState convention.
- `npx vitest run test/write-session.test.ts` in the worktree: 22 passed.
- Capture group, 32 files (every test touching components/capture, lib/capture, app/write|review|listen, plus keep-step, billing-keep-gate-m17, review-keep-m17, store.capture-v6): 32 files, 728 tests passed (includes qa-kill-harness, 50 tests).
- Old source (write.tsx and write-session.logic.ts reverted to the merge-base, new tests kept): 7 of 22 fail, the 7 the PR names. Five of them fail only because `background` and `leavesForeground` do not exist yet, so they prove the API, not the behaviour (see finding 2).
- `tsc --noEmit` in apps/mobile: one error, `expo-clipboard` not found in help-fallback.tsx (shared node_modules in this environment; matches the PR body). Nothing in the changed files.
- `git merge-tree --write-tree origin/develop 27fc1a31`: exit 0, no conflicts; develop has 14 newer commits and none touch these three files.
- Added lines: no non-ASCII, no dashes, curly quotes, ellipsis or emoji. No logging, analytics or child name added.
- CI at this head: required, tests and content rules, typecheck, database rules, Deno, migrations unchanged, B-8, compliance-fence: success. Still queued: "store-profile Release launch". One duplicate compliance-fence run is cancelled. iOS simulator build skipped.

**State machine, checked by reading and by scratch tests (deleted afterwards)**
- No stale closure: `session` comes from `useState`, so it is stable; `persist` goes through `persistRef.current`. The listener is added once per `session` and removed in the cleanup. Effect cleanups run in declaration order (unmount flush, then `sub.remove()`), synchronously, so nothing can fire between them. Fast refresh and StrictMode re-run both effects: the unmount flush is a no-op unless a write is pending, then the listener is re-added once.
- Double writes: inactive then background writes once (test and my run). Background then Close/keep/unmount writes nothing extra, apart from `keep()` which always rewrites the same text to the same row (pre-existing, idempotent, no second draft: scratch S8, S9).
- First words before any pause: background creates the draft once and later typing updates that same draft (S9: one draft listed).
- A draft that never had words: type then clear then background x2 creates nothing, no write, and Close leaves nothing (S1). Whitespace only creates nothing (S10). Untouched reopened draft: background writes nothing (S7).
- Failed write then background: retried; a failed background write leaves `unsaved` true so the next one retries again (test, plus mutant M3 is caught).
- Close that deleted a cleared draft, then background: no resurrection. Reason: `persist` never calls `create` once `draftId.current` is set (it is never cleared after delete) and `setTyped` updates zero rows (S5, S6).
- Unmount racing background: the listener is removed on unmount, and a late call would find `unsaved` false.
- Inactive flicker (Control Centre, Face ID, call, Siri, app switcher): at most one write per transition and only when words are unsaved, otherwise a no-op. Harmless.

**Findings (no must-fix)**
1. Should fix, small, pre-existing but now one line: `unmount()` still tests `timer === null` (write-session.logic.ts:103), not `unsaved`. If the pause's write failed (disk full), or the background write failed, and Write then unmounts by any route other than Close, Android back or the swipe (those are held shut by "Not saved yet"), the words are not retried. Scratch S3 and S4: phone keeps FIRST, typed was LAST. Realistic route: Write replaced from outside (a deep link or notification route, or a stack reset); I did not run that on a device. Suggested fix `if (timer === null && !unsaved) return;`. I applied it in the worktree: write-session, review-keep-from-write and review-write tests still pass (81), then reverted; I did not re-run my scratch S3/S4 against it. Safe because `unsaved` is false after a good write, after Close, and after the delete; for a never-had-words draft the extra persist('') is a no-op.
2. Test gap: "a draft Close deleted (words cleared) is not brought back" passes even with the guard removed. Mutant: delete `unsaved = false; // nothing left to write` (logic.ts:90) and all 22 tests still pass, because the stale-id write is an UPDATE of zero rows. The guard only prevents a pointless write plus a false "Saved on this phone". Add `const n = w.writes.length` before `background()` and `expect(w.writes.length).toBe(n)` after; that kills the mutant. Mutants M2 (no cancel), M3 (no retry) and M4 (flag never cleared) are all caught. M5 (logic.ts:94) survives but the line is redundant.
3. Behaviour to know, not a regression: cleared words on an existing typed draft are written by background (S2: draft left with `''`, still listed on Tonight as a typed card). The 500 ms pause already did this; Close deletes it. Only matters if the app is then killed in the background. Acceptable.

**Nits**
- `value === latest` in `write` (logic.ts:63) is always true, since only the newest timer can fire. Harmless.
- While the disk is full, each inactive/active flicker re-announces "Not saved yet" (write.tsx:78 announces every failure, not rate limited). Minor VoiceOver noise.
- The write.tsx wiring is checked by a source regex only; I could not run a rendered AppState event, so the listener at runtime is not verified.

**Other places with the same bug:** none found. Only Write debounces words; letter/[id].tsx and Review save on an explicit tap (setTimeout hits in review.tsx and letter/[id].tsx are animation timers; not read in depth).

**Device test plan:** docs/qa/DEVICE_TEST_PLAN.md S1-36 (h) backgrounds for 30 s and returns, and (j) covers Close, both destinations and the swipe; nothing locks or force-quits inside 500 ms, and the PR did not edit the plan. A human should run, as a new S1-36 (l): type a sentence, within half a second press the side button (and once, swipe up to Home), force-quit from the app switcher, relaunch, open the draft from Tonight, compare word for word. Also pull Control Centre down mid-sentence and return: no duplicate draft, no lost or doubled words.

**Not verified:** behaviour on a device (that iOS delivers `inactive` before suspension and the JS write finishes in time); Android; the deep-link unmount route in finding 1; a crash or OOM kill with no `inactive` first (the 500 ms window stays open there, inherent); the one queued CI job.

Reviewer: independent of the author (CR-44).

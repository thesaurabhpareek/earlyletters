## What and why

Write's autosave was a pure debounce: `change()` cancelled the timer and re-armed it for 500 ms on every keystroke, with no maximum wait. A kill, crash or power loss during a long burst of typing lost everything typed since the last pause of 500 ms or more. Typed words lost is the worst class of bug here, and F04-REQ-011 says at most the last 500 ms may be lost. The release-catalog row RT-WRT-05 was `gap` and its named test, `write-autosave.test.ts`, did not exist.

Closing, a swipe down, `keep` and backgrounding already wrote the newest words first, so the exposure was a kill, crash or flat battery in the middle of a burst. The three flush paths are unchanged: swipe is `session.unmount()` (write.tsx 180), background is `session.background()` (write.tsx 185, on AppState `inactive` or `background`), Close is `close()` (write.tsx 192-194, through `session.close()`), and "Add to Asha's book" and "Keep private" go through `session.keep()` (write.tsx 263).

Serves F04-REQ-011 and RT-WRT-05 (docs/prd/v2/06-nfr.md lines 59 and 189).

### The change

`apps/mobile/src/components/capture/write-session.logic.ts`: the session now has two timers.
- A write timer, armed by the first keystroke after a write and not moved by later ones (a throttle with a trailing write). When it fires it writes `latest`, the newest words, not the words it was armed with. It fires within 500 ms of the first unsaved keystroke, so the most a kill can lose is 500 ms of typing, however long the burst.
- The old pause timer, moved by every keystroke, so a real pause of 500 ms is still found exactly where it was.

`unmount` and `background` write only when something is unsaved, so words a write inside the burst already put on the phone are not written twice by them. `close()` and `keep()` write unconditionally, as they always did: after a quiet write that took every word they repeat one identical update, which is harmless (the first commit's message says "never twice" for all four exits; that is true only of unmount and background). A write that did not go through leaves the words unsaved, so the next write timer (a keystroke later, within 500 ms) retries it, and the pause and every way out retry too.

### What the write triggers on screen (checked first, and the reason write.tsx changes)

`persist` in write.tsx was not just a disk write. On every call it also did `setSaveState('saved' | 'failed')` (shows "Saved on this phone" or "Not saved yet"), `announce(copy.write.notSaved)` on failure, `setText(value)` (a render of Write), and `announce(savedOnPhone)` (at most every 10 s, but the first one at once because `lastAnnounced` starts at 0). With a write every 500 ms during an unbroken burst, that would have meant, during typing: the "Saved on this phone" line appearing on the first mid-burst write of a new letter, a VoiceOver announcement over the person's typing echo (again every 10 s in a long burst), "Not saved yet" announced every 500 ms on a full disk, and a render of Write twice a second in a page that is deliberately uncontrolled and render-free while typing (D-057). So the status line was coupled to `persist`, and the cadence change could not go in on its own.

The separation, minimal:
- `persist(value, quiet = false)`. A quiet write does `writeWords` and keeps the draft id, then returns. No `setSaveState`, no `announce`, no `setText`. Zero React state changes in Write during a burst; the field is not touched. (Write has no store subscriber of its own, so the store's change event does not render it either.)
- `settled(value)` (new, write.tsx) is the pause: `setSaveState('saved')`, `setText`, rate-limited announce, for the case where a quiet write had already put the newest words on the phone. When there are still unsaved words at the pause, the session calls the ordinary non-quiet `persist`, exactly as before. The 10 s announcement rule moved, unchanged, into a small `announceSaved`.
- Result: the line, the announcement and the render still come only after a real pause of 500 ms with no keystroke, as before. All the exits (Close, "Add to Asha's book", "Keep private", swipe, background) call the ordinary non-quiet `persist`, so their on-screen effects are exactly as before.

### Decision for Karma: a write that fails in the middle of a burst is silent until the pause

Default, as built: silent until the pause. Before this change nothing was even tried in a burst, so this is no regression. A failed quiet write is retried at the next keystroke (within 500 ms) and shown as "Not saved yet" at the pause.

What it means on a failing disk: the iOS swipe guard (`gestureEnabled`, write.tsx) follows the visible `saveState`. So during the burst the line still says "Saved on this phone" (or nothing), the swipe down stays enabled until the pause, and if the person swipes in the burst, the unmount retry is the last try. Close and Android's back are safe (`close()` returns false on a failed write). Showing "Not saved yet" at once, or holding the swipe silently (a flag that only disables the swipe, with no line and no announcement), is a few lines in write.tsx, not one; it is a design call (it puts the line on screen during typing), so I did not guess. It is reversible. Review A and B both call the default acceptable for tonight.

### Tests

New `apps/mobile/test/write-autosave.test.ts` (28 tests, fake timers, the real session and the real store, through the same `writeWords` over `createDraft` and `setDraftTyped` that write.tsx uses; the title names F04-REQ-011 and RT-WRT-05):
1. A character every 100 ms for 3 s with no pause: written at least every 500 ms; a kill at any moment (10 ms resolution) leaves the newest persisted value short of `latest` by at most the 5 characters typed in 500 ms; the draft a reopened Write finds is that value; a 30 s burst keeps writing; and 100 seeded runs of typing (pauses, backspaces) and killing at a random moment, each asserting that no more than 500 ms of typing is unwritten, that the phone holds exactly the newest words at the last write (never a stale write), and that the page was told nothing except after 500 ms of quiet.
2. A single keystroke and a pause: nothing at 499 ms, one write at 500 ms, nothing more.
3. The written value is the newest at the moment the timer fires (not "A", the word that armed it), a keystroke 300 ms in does not push the write past 500 ms, and a deleted tail is written as the shorter newest words.
4. Close, keep, unmount and background mid-burst each write the newest words once and nothing writes again; unmount and background write nothing when a write inside the burst already took every word; an empty typed draft is still deleted on Close and not brought back.
5. A failed write is retried: by the next write timer a keystroke later, at the pause (and the page is told only then), and by unmount.
6. The page stays quiet in a burst: every write in a 3 s burst is quiet, the page is told nothing until the pause, then exactly once; plus source checks on write.tsx that the quiet branch returns before `setSaveState`, `setText` and `announce`, that `settled` is the pause, and that a keystroke still renders only when the page goes from empty to words.

Existing tests: no timing assertion in `test/write-session.test.ts` had to change; all of its debounce-timing tests pass unchanged against the new session. Two adjustments, both to wiring and not to timing:
- `test/write-session.test.ts`: its helper now passes `settled: () => {}` (the session needs the new callback), and the source check on the `createWriteSession(...)` call in write.tsx now expects `persist: (value, quiet) => ...` and `settled: ...`.
- `test/review-write.test.ts`: the anchor string that finds `persist` in write.tsx now matches `(value: string, quiet = false)`. Its other assertions on `persist` (the `writeWords` line, `setSaveState(r.saveState)`, `if (!r.ok) return false;`) pass unchanged.

Catalog: RT-WRT-05 goes from `gap` to `partial`, citing `F04-REQ-011;apps/mobile/test/write-autosave.test.ts;S1-36`, and `docs/qa/release-test-catalog.csv` is regenerated with `node scripts/qa/release-catalog.mjs`. Its Expected now says what is written (a Node model of the kill and S1-36 (m)) and what is not (the simulator kill run). It stays `partial`, not `covered`: the row's lane is a kill run on a simulator (like RT-WRT-02), and a real process kill at random moments is not built. The qa-release-catalog test passes. RELEASE_TEST_PLAN.md's status counts were already out of step with the catalog (87 gaps listed, 82 in the catalog before this change) and are not touched.

### Device: S1-36 now exercises this change (docs/qa/DEVICE_TEST_PLAN.md)

An earlier version of this body said no new step was needed. That was wrong: every way out in S1-36 (lock, Home Screen, Close, swipe, the app switcher) goes through `background()` or `unmount()`, which flush, so a kill in the middle of a burst was never tried on a phone. S1-36 changes, at distinct anchors, nothing else in the plan:
- (m) a hard stop inside a burst: type with no half-second gap for about 10 s and force restart the SE 3 (volume up, volume down, hold the side button; not the app switcher, the lock button or the Home Screen, because iOS tells the app first and it writes then); reopen the draft from Tonight. Expected: all but about the last second is there, nothing older missing, nothing doubled or reordered. Repeat three times in all.
- (n) VoiceOver on, a Bluetooth keyboard if there is one, about 100 words with no gap, then 25 s more. Expected: the app says and shows nothing while keys go; after the pause one "Saved on this phone", not again within 10 s.
- (a) Expected now says the line does not appear, flicker or move while keys are still going, with no hitch every half second in the screen recording and no late or dropped characters. (a) Needs a seeded book of about 240 letters (the one-year fixture of S1-21) with the Book tab opened first, so the cost below is measured where it is worst. Record and the Expected line cover (m) and (n).
- Re-run with this change as well: (h), (i) at AX5, (j) and (l), as before.

### Cost of up to two writes a second: unmeasured, and bigger than the SQL

Nothing here was measured on a phone. Each quiet write is `writeDraft` (store.ts): one UPDATE and an `isHeld` SELECT in a transaction, then a synchronous `bus.emit('drafts')`. The database is WAL with `synchronous = FULL` and `secure_delete = ON` (expo-adapter.ts), so each write is a flushed commit that also zero-fills freed pages. The larger cost is what listens to that event. Screens that subscribe to every store change run on the JS thread, with the tabs mounted behind the sheet:
- Tonight (`(tabs)/index.tsx` line 142, `subscribe(load)`): `readRoom()` reads the family, every waiting draft and every letter, and builds a new object, so it always re-renders.
- The Book (`(tabs)/book.tsx` line 125, `subscribe(reread)`): `listEntriesForChild`, a new state object, a rebuild of the chapters and month rows, and `isReadItBack` (a settings read and a JSON parse) for every spoken letter.
- Family, `useChildren` users, and the root appearance hook (a string, cheap).
Before, all of that ran once per pause; now up to twice a second during a burst. For a small book that is nothing; for a year of letters (about 240) on an iPhone SE 3 it is the thing to measure, which is why S1-36 (a) now asks for the 240-letter book with the Book tab opened first. Not affected: reminders (their re-plan is debounced 1200 ms and reset by each event, so it waits for the burst to end) and sync (`signalOutbox` is debounced 1500 ms; before the first sign-in `enqueueHeldDraft` does nothing; for a held draft of a signed-in author each write folds into the waiting outbox row while that is unsent, else appends one op; unmeasured when a sync cycle is already running).

Hardening considered and not done: letting a quiet write skip `bus.emit('drafts')`. It is not small or provable enough for this PR. The store emit lives in `createDraft` and in the shared `writeDraft`, so it needs a quiet option through both. Worse, every way out of the burst must then emit exactly once: the pause (`settled` would need a new store call that emits without writing), and also unmount and background when a quiet write had already taken every word and so nothing is written (so the session would need a flag for "quiet writes not yet announced"). A missed emit leaves Tonight and the Book stale about a draft the person just wrote, and no current test would catch it. That is three files and well over 15 lines. If S1-36 (a) shows a hitch on the SE 3, it is the next change, as its own PR.

### Not verified, and things to know

- Nothing was run on a phone: not the write cost or hitching, VoiceOver behaviour, or the force-restart result of S1-36 (m).
- A real kill at random moments on a simulator (the "typed kill run" of 100 iterations in docs/prd/v2/07-quality-bar.md 2.7, `xcrun simctl terminate` mid-typing) is not built; the 100-run test here is a model of it.
- JS timers fire slightly late under load, so "500 ms" is the timer's setting, not a hard real-time guarantee. In React Native a timer cleared by another timer in the same batch is believed to be skipped; the session is correct either way (the write timer checks `unsaved`), and nothing was run in Hermes.
- The same bug exists elsewhere, and is not fixed here (a separate row): Review's `reviewWriter.text()` (`apps/mobile/src/lib/capture/review-persist.logic.ts`, `TYPED_WRITE_DEBOUNCE_MS = 300` at line 25 and the writer at lines 164-186) is a pure 300 ms debounce with no maximum wait, for typed words changed in Review.
- Specs still describe the debounce: F04-REQ-011 (docs/prd/v2/features/F04-capture.md line 319, and lines 140, 214 and 426) and docs/prd/v2/06-nfr.md line 59 say "written 500 ms after the last keystroke". That stays true (the words are on the phone by then) and the kill-run clause is what this PR now meets; Product can reword separately. Not edited here.
- A cosmetic edge Review A found: after continuous typing, if the page is cleared and "Another thought" is pressed inside the last 500 ms, `settled` can show "Saved on this phone" for a draft write.tsx has just deleted. Harmless.
- Pre-existing and unchanged: Close on a blank page of a recording draft does not write the empty words, so older typed words stay on disk.
- Open PRs that touch the same files: #717 changes write.tsx (footer and scroll, other regions) and `test/review-write.test.ts` (a different test); #701, #716, #721, #722 and #724 change a few lines of write.tsx elsewhere; #603 and #646 change other rows in `scripts/qa/release-catalog.rows.mjs` and the CSV. Review A ran a merge-tree against each and found no conflict; develop (d4b8f5f1, eight more merged PRs) is merged into this branch cleanly. No PR edits `write-session.logic.ts`.

PROPOSED WORDING: none. No new user-facing words; "Saved on this phone" and "Not saved yet" are unchanged. The new text is device-plan steps (docs/qa/DEVICE_TEST_PLAN.md), not product copy.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments). Not run at the root; only the apps/mobile workspace was run, after merging develop at d4b8f5f1: 225 files pass, 7 fail with 61 failing tests, the same 61 in the same 7 files as on a clean origin/develop (missing `expo-local-authentication` and `expo-clipboard` locally: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest). The failing set was diffed against develop and is identical.
- [ ] `npm run test:db` passes (not relevant, not run)
- [ ] `npm run typecheck` passes, including `apps/mobile` (`cd apps/mobile && npx tsc --noEmit` shows only the five known `expo-clipboard` and `expo-local-authentication` errors in `help-fallback.tsx` and `app-lock/controller.ts`, nothing from this change)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here
- Related group run together: `write-autosave`, `write-session`, `review-write`, `review-keep-from-write`, `write-another-thought`, `write-plus-line`, `review-critics`, `design-system-gaps`, `lamp`, `qa-release-catalog`: 10 files, 228 tests, all pass.
- The new tests fail on the old code: with only `write-session.logic.ts` restored to origin/develop, 15 of the 28 new tests fail (the burst writes, the kill bound at 10 ms resolution, the 100 seeded runs, the newest-at-fire value, the quiet burst, the "nothing written twice after a quiet write" exits, the retries). The 13 that still pass are the guards for behaviour that must not change (a single keystroke then a pause, two bursts with a pause between, close, keep, unmount and background mid-burst, the deleted empty draft, the unmount retry) and the source checks on write.tsx. With only write.tsx restored, 3 of the new source checks fail. Re-run after the merge: same numbers.
- Review A (independent): a 400-seed model attack over typed and recording drafts, every millisecond, found no lost, duplicated, reordered, stale or wrongly deleted words, and 11 hand-ordered timer sequences passed. Review B: nothing on screen or in the ear can change mid-burst, from the code.
- Added lines scanned: no byte of 0x80 or more (no em or en dashes, curly quotes, ellipsis characters or emoji).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (the words are written exactly as typed, only earlier)
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable: no cleaning change)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; capturing and typing are never gated (unchanged)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports (nothing logged; the tests use no real text)
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (no database change)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (no visible change expected).

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

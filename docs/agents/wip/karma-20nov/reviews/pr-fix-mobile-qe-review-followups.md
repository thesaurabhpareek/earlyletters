## What and why

The non-blocking notes from the independent reviews of #647 (QE-05), #651 (QE-06) and #643 (QE-01), all merged on 8 Nov. Tests, one small logic fix, one type tidy and device-plan wording. No user-facing string changes, no new copy.

**QE-05 (#647)**
- `apps/mobile/test/sweep.disk.test.ts`: two disk tests run `purgeShelfAtLaunch` through the real `capture/erase.ts`. Reviewers put the pair back inline in the wrong order (record, then purge) and every test still passed, because the disk tests stamp "now" first.
  - A launch stamp a day after the delete, then a clock 40 days ahead: `purgeShelfAtLaunch()` erases 0 and the letter and its recording stay; the next launch erases 1 (file first, then row).
  - A letter the server erased (`sync_state = 'erased'`) is finished at a launch with no stamp: this pins the `finishServerErased` callback.
- `docs/qa/DEVICE_TEST_PLAN.md` DL-03 and DL-04: "open the app twice" now says force quit and cold start between the opens (the purge runs once per process, `sweep.ts:54`, so a return from the background is not an open). DL-04 (c) opens once on today's date first (otherwise the stamp is still ahead from (b) and the letter is erased at the first open on the year-ahead date: a false FAIL) and allows a 40 day jump in place of a year if the build's life is a concern.

**QE-06 (#651)**
- `write-session.logic.ts` `unmount()` tested `timer === null` instead of `unsaved`, so a failed pause write or a failed background write was not retried when Write unmounts by a route other than Close, Android back or the swipe (a deep link, a stack reset). Now `if (timer === null && !unsaved) return;`. `unsaved` is false after a good write, after Close and after the delete, so a draft with nothing to write is untouched. Doc comments in the file say so.
- `write-session.test.ts`: new test for both failures (the pause fails; the write at background fails), then unmount retries and the newest words are saved, and a second unmount writes nothing more. The test "a draft Close deleted is not brought back" now counts writes before and after `background()` and `unmount()`, so it fails when the `unsaved = false` reset after the delete is removed (it passed with the reset removed before).
- `DEVICE_TEST_PLAN.md` S1-36 (l): type, lock within half a second, (once) swipe to Home, force quit, relaunch, compare the draft word for word; the very first words before any pause; pull Control Center down mid-sentence and return.

**QE-01 (#643)**
- `apps/mobile/src/lib/dates.ts`: `dueDate` is gone from the `Pick` type of `letterDateline` and `entryLetterDateline` (unused since the fix). `test/dates.test.ts` held a fresh object literal with `dueDate: null` that tsc then refused; it is now a named object, same data, same assertion.
- `DEVICE_TEST_PLAN.md` V-08: a line for the before-birth dateline (past due date, no birthday, VoiceOver reads "... Before Asha was born.", and the export letter file's Date line says the same). V-08 is the existing step that reads the letter's date, so no new id.

Not done (out of scope, named in the reviews): the stale spec lines for the shelf purge (F08-U14, DQ-R13, RT-OS-02 and others), `deleted_at` stamped from the phone clock, the "Kept here until" wording, and the dead-code nits in `write-session`.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [x] `npm run typecheck` passes, including `apps/mobile` (run as `npx tsc --noEmit` in `apps/mobile`: only the known local errors from `expo-clipboard` and `expo-local-authentication` not being installed, none in a changed file; the `dueDate` removal showed one real error in `test/dates.test.ts`, fixed)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran, in `apps/mobile`:
- Full vitest: 4037 passed, 61 failed. The same 61 fail with my changes stashed (7 files: `config`, `privacy-manifest`, `capabilities`, `licences`, `app-lock-wiring`, `hosting-ios17`, `preflight-production`; app config and the symlinked local `node_modules`). CI is the authority.
- Changed files together (write-session, dates, sweep.disk, transcribe-adts.disk, store.shelf, store.purge-guards, export-build): 7 files, 145 passed.
- Mutations (source only reverted, new tests kept, then restored):
  - `erase.ts` recording before purging: 1 fails (the 40 day jump test).
  - `erase.ts` without the `finishServerErased` callback: 1 fails (the server-erased test).
  - `unmount()` back to `timer === null`: 2 fail (both failure cases).
  - Remove `unsaved = false` after Close deletes the draft: 1 fails (the strengthened test); the old version of that test, run against the same mutant, passes 22 of 22.
- Added lines contain no byte at or above 0x80 (no dashes, curly quotes, ellipsis or emoji).

Not verified: anything on a device (the three new or changed device steps are written, not run).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (the unmount write is the words exactly as typed, through the same `persist`)
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (n/a: no cleaning change)
- [ ] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (n/a: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (no database change)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

## What and why

After an erase that does not finish, the Erase everything page remounts at the top (the Erasing screen is a different tree). The failure line ("Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then.") sat at the foot of the page, beside the Erase everything button. It is a data-loss warning, and at a large text size it could be below the fold. It is now the first thing on the page, above the heading, so it is seen and read first (VoiceOver reads in layout order; the line already announces itself when it appears).

Council of 9 Nov 2026: design seat defect 1 (`scratchpad/reviews/council-9nov/design.md`).

- Only the place changes. The two strings (`failed`, `signedIn`) are not edited, and the other notes keep their order: `eraseNoteKeys` in `components/settings/wipe.logic.ts` is not touched and its pins in `test/erase-all.test.ts` and `test/billing-alpha.test.ts` pass unchanged.
- Not done on purpose: the design seat also suggested "one quiet line on the first screen after an erase". That is new wording, so it is the founder's to decide and is not in this PR.

No new words.

Device plan: `docs/qa/DEVICE_TEST_PLAN.md` S1-133 steps (d) and (h) only, where the order text changes (the failure line first, only after an erase that did not finish). A phone cannot show that line (it needs a file that will not delete; S1-133 "Not covered" already says so), so the order is held by the test below, not by a device step.

Overlap with open PRs: none on `erase.tsx` or `erase-all.test.ts`. `docs/qa/DEVICE_TEST_PLAN.md` is touched by many open PRs; this edits two lines inside S1-133.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [x] `npm run typecheck` passes, including `apps/mobile` (`cd apps/mobile && npx tsc --noEmit`: only the known local errors, `expo-clipboard` and `expo-local-authentication` not installed)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran: the whole `apps/mobile` suite (4300 tests; 61 fail, all in the same 7 files that need `expo config` and fail the same on a clean `origin/develop`: app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest). I did not run root `npm test` or `npm run test:db`.

Tests, all in `apps/mobile/test/erase-all.test.ts` ([DATA-REQ-024], 55 to 56 tests):
- New: "the failed line is the first thing on the page, above the heading, so it is seen and read before anything else". It holds the order in the source (`{header}`, then the line, then the heading), that the line is above the heading and the heading above the button, and that the line is drawn once.
- Reworded pin: "the failed line is the one the page shows for an unfinished erase, beside the Erase everything button it tells the person to press". The old title described the old place. Its regex for the line is kept; its `indexOf('<ErrorLine') < indexOf('label={e.button}')` assertion (still true) moved into the new test, where it is stronger (line, then heading, then button), and a "drawn once" count replaced it.

Proof it bites: with only `erase.tsx` reverted to `origin/develop`, the new test fails (1 failed, 55 pass); with the change, 56 pass.

Only a phone shows: nothing for this change (the failure line cannot be made to appear on a phone).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not changed: no cleaning behaviour)
- [x] Gates use `decide()` or `decideKeepLetter()` (untouched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy added or changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file (none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

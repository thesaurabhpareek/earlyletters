## What and why

A running speech download had no Stop anywhere (found in the review of #631, confirmed on develop at d26335da). Settings > Storage leaves the packs a language row stands for out of "Downloading" (`!asLanguages.has(p.id)`, so a language is never said twice), the English row offered nothing while it downloaded or waited for Wi-Fi, and `cancelPack` was only called from that list.

**This reverses one pin, for two states only.** The P6b spec (#313, 28 Oct) pinned "the rows that wait offer nothing to tap". That was written when Stop for a running download still lived in Storage's "Downloading" list. #631 (8 Nov) then moved the language rows into Storage and hid their packs from that list, and that left Stop nowhere. Karma's #631 comment (8 Nov, 10:20 AM PT) called it "not for build 10, build 11 design question" and named two options: Stop on the language row (one trailing word, the existing Stop string), or an entry under In progress. The founder then asked (8 Nov, about 11:30 AM PT) to open the next build's fix PRs, so this is the build 12 option A: Stop on the language row, the existing Stop string, and no In progress duplicate (a language is still never said twice). The reversal covers `downloading` and `waitingForWifi` only; `noSpace` and `unknown` still offer nothing, and `absent` and `here` are unchanged.

Divergence from a spec not yet on develop: `docs/design/screens/SETTINGS_AND_ACCOUNT.md` section 9 (#596) calls the downloading row `busy`, with no action. This PR departs from that sentence; S1-97b's Update line points the Settings owners at it.

- `speechRow` (`components/settings/recordings.logic.ts`): for `downloading` and `waitingForWifi` it returns action `stop` and the trailing word `packsCopy.stopButton` ("Stop", the word the "Downloading" list already uses). The wait line from #662 is kept as it is (`downloadingLine`: "Downloading" below 1%, never 0%) and so is the percent for the ring (`shownPercent(fraction) ?? 0`).
- `speech-row.tsx`: `stop` calls `cancelPack` for every id in `planFor([language]).packs` (the listening detector and the speech model). While it downloads the ring stays and the word Stop sits beside it.
- One new line, `speechSettingsCopy.stopHint` ("Stops getting this language ready for now"): the row's trailing word is hidden from VoiceOver and the hint is what tells a VoiceOver user what a tap does, like `downloadHint` and `removeHint`.
- Engine fix needed for the waiting case: a pack held for Wi-Fi has no running job, so `PackManager.cancel` removed it from the resume set but reported nothing, and the row would have kept saying "Waits for Wi-Fi" for a download that no longer resumes. `cancel` now emits a `cancelled` event in that case (only when the pack was waiting and has no job). The same fix makes the "Downloading" list's Stop work for a non-speech pack waiting for Wi-Fi.
- Device plan: new step S1-97b, S1-97 (c) now says to tap the row once it says On this phone (a tap while it downloads stops it) and expects Stop beside the ring, and S1-31 (c) now says the Wi-Fi wait row offers Stop while the low-space row offers nothing. S1-97b was unused on develop and in all open PRs.
- Merged with develop at cda0ba83 (#662, "no 0% in the wait line"). The one conflict was the `downloading` case of `speechRow` and the header comment above it; both sides are kept. The two assertions in `test/download-wait-line.test.ts` that expected no action and no trailing word for `downloading` now expect `stop` and "Stop".

What Stop does: it aborts the request in flight and keeps the partial file; Download carries on from the last finished piece (the model is fetched in 16 MB pieces, so a Stop during the first piece has nothing saved yet). The row returns to "Not on this phone, 575 MB" with Download. Cancelled is not a retryable failure, so the automatic retries do not restart it. Where the first-run card reads the stop it says "Paused" with Try again (`speech-download-status.test.ts` line 98).

Known and not changed here:

- Only the code that restarts a download on return to the front is pre-existing (`askedDownload.clear()` then `refreshReady` in `lib/transcription-queue/index.ts`). Its effect is new, because on develop no part of the UI could stop a speech download. With a recording waiting for its words, the next time the app becomes active it asks for the download again: after Stop the row reads "Not on this phone" with Download, and once the app has left the front and come back it is on "Getting ready, n%" with Stop again. With no recording waiting it does not restart. S1-97b is written for the no-recording case and now also asks for a Record of the waiting-recording case. A follow-up could remember a person's Stop until their next Download tap.
- Stop is not offered while no bytes move: during the manifest refresh before the first byte, the SHA-256 check of the finished file, and the install, the row reads "Not on this phone, 575 MB" with Download (the existing mapping). A Download tap there only joins the running job. A tester can see Download, then Stop, then Download again.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

Run at the merged head: `apps/mobile` `engine.test.ts` (55), `settings-p6b` (21), `download-wait-line` (15), `where-live` (12), `first-run-wait` (15), `speech-download-status` (18) and `qa-release-catalog` (8): 144 pass. `packages/content` (12 files, 281 tests) pass. Full `apps/mobile` vitest: the same 7 files and 61 failures the reviewers measured on an unchanged develop at d26335da (config, privacy-manifest, app-lock-wiring, capabilities, hosting-ios17, licences, preflight-production, all about the Expo config and signing keys in this environment; not re-measured on an unchanged cda0ba83); everything else passes. `tsc --noEmit` in `apps/mobile` shows only the known missing `expo-clipboard` and `expo-local-authentication` (5 errors, in `help-fallback.tsx` and `app-lock/controller.ts`). Not run: the other workspaces, `test:db`, the root typecheck.

New and changed tests: `test/settings-p6b.test.ts` (row logic for both states, the source pin that Stop calls `cancelPack` over `plan.packs`, and the updated assertions that "the rows that wait offer nothing"), `test/download-wait-line.test.ts` (the two #662 assertions now expect `stop` and "Stop"), `src/lib/packs/__tests__/engine.test.ts` (cancel on a pack held for Wi-Fi). With only the source changes reverted (at the first review head), 3 tests in `settings-p6b` and 1 in `engine` failed; at the merged head, putting `downloading` back to no action and no trailing word fails 3 tests (2 in `settings-p6b`, 1 in `download-wait-line`); restored, all pass. The `where-live` rule (language packs stay out of "Downloading") is untouched and still passes. Nothing on a phone has been run: S1-97b is the device check.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable: no cleaning change)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; read, play, export, delete, restore and family authorship stay ungated, and capturing and typing never are: only the Keep step of a letter is (D-082) (not applicable: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (not applicable: no database change)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (the row gains the word Stop; a device check is S1-97b in `docs/qa/DEVICE_TEST_PLAN.md`)

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

# Status audit of ready S0/S1 rows, 9 Nov 2026

Written by `product`, docs only, from `develop` at 61988d26. It decides nothing and changes no requirement.

## Method and limits

- Universe: 54 rows whose status read `ready` on develop and that carry Severity S0 or S1, or `[Critical]` or `[High]` in the title. Priority P0/P1 is not a field in `docs/BACKLOG.md`; this is the nearest proxy.
- Evidence is `git grep` and `git log` on develop (a shallow clone, 356 commits) and merged PR metadata read over REST. Nothing was built or run, and no device was used.
- A path match shows code exists, not that every Done-when line holds. So only the four rows with a merged PR that names them were changed in `docs/BACKLOG.md`. The others are listed here for their owners.

## Counts

| Class | Meaning | Rows |
|---|---|---|
| STALE-FIXED | merged PR named, status line corrected in this PR | 4 |
| CLAIMED | an open PR already holds it | 1 |
| REAL-FREE | code on develop shows the work is still to do | 8 |
| LIKELY-DONE | code on develop matches the scope; owner confirms and sets done with the PR | 8 |
| UNKNOWN | no decisive evidence from search | 33 |
| Total | | 54 |

## Rows

| Row | Class | Evidence |
|---|---|---|
| BL-117 CI security and platform scans [High] | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-119 `child-input` flag in the prompt selector [High] | REAL-FREE | No 'child-input' or childInput match anywhere in apps, packages, supabase, scripts or .github. |
| BL-244 Value-free validation for content tables [High] | REAL-FREE | The row says no such trigger; git grep for value-free or value_free finds none. |
| BL-334 Consent pepper guard (new) [High] | LIKELY-DONE | supabase/migrations/20261015010000_v1_gate_peek_invite_consent_pepper.sql raises 55000 when app.consent_pepper is missing or under 32 characters. Owner to confirm the test and set the row done with the PR. |
| BL-342 Plan reminders on the device, the trial timeline and "Save a | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-370 A crash is never a blank page: root error screen, launch rec | LIKELY-DONE | RootErrorBoundary in apps/mobile/src/app/_layout.tsx:127 and components/resilience/launch-recovery.tsx; first seen in #289. Done-when (global handler, dark first paint, J20) not individually checked. |
| BL-371 Delete asks first, is undoable for 30 days, and purges for r | LIKELY-DONE | apps/mobile/src/app/settings/recently-deleted.tsx and j10-letter.flow.ts:47 (confirm sheet, 30 days); first seen in #289. 30-day purge case not individually checked. |
| BL-375 Speech model download is explained and visible: size, Wi-Fi, | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-376 A letter waiting for its words has a way forward: write the  | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-377 Review keeps what the person changed: autosave edits, warn o | STALE-FIXED | PR #522 merged 8 Nov (34f848b7, Review's own choices survive a kill); #725 adds the 500 ms Write save. |
| BL-378 Typing, Finish and Save cannot lose or double a letter: auto | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-379 Drafts are visible and can be let go; short or empty takes a | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-380 Recording stays awake and Read together autoplay survives au | LIKELY-DONE | useKeepAwakeWhile in listen.tsx:335 and components/player/audio-player.tsx:113 (Read together); apps/mobile/test/keep-awake.test.ts. The 30 s Auto-Lock device check is not in git. |
| BL-381 Recording start failures say the real cause; the permission  | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-382 A killed take is checked before it is called ready [High] | LIKELY-DONE | Unrecoverable draft state exists (review.tsx:192, :216; apps/mobile/e2e/kill/oracle.mjs:191; sweep.playable.test.ts). AVAudioFile open check in the sweep not confirmed. |
| BL-383 Unknown links open a calm not-found screen, never the develo | LIKELY-DONE | apps/mobile/src/app/+not-found.tsx with StateScreen, and +native-intent.tsx using not-found.logic; j19-errors.flow.ts:21. |
| BL-386 A first-run mistake can be corrected: edit name, birthday an | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-388 Export is complete and safe: drafts, orphans and deleted let | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-389 The consent sheet and Settings switch say only what v1.0 doe | REAL-FREE | packages/content/src/strings.en.ts:1030 still says the sheet shares 'when something crashes' while strings.en.ts:992 says no crash SDK. |
| BL-391 Doors to nowhere are hidden in v1.0: "I was invited", the Fa | REAL-FREE | apps/mobile/src/app/(tabs)/_layout.tsx:18 still builds Tonight, Book, Family. Build 12 tab work is BL-817/BL-818 in PR #707, so check overlap before dispatching. |
| BL-392 The v1.0 binary carries only what v1.0 uses; size, entitleme | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-394 Dark mode uses dark values on every screen: tab bar, icons,  | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-395 Review, the trust screen, has a clear hierarchy: readable fi | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-396 One ScreenHeader and one Sheet pattern replace five navigati | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-397 One selection pattern, and value rows that look tappable [Hi | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-398 One StateScreen for empty, error and loading states, and one | LIKELY-DONE | apps/mobile/src/components/ui/state-screen.tsx and state-screen.logic.ts, used by +not-found.tsx. Inline caution card not checked. |
| BL-399 "Writing down what you said" shows it is working and that th | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-400 Every control reaches 44 pt: text links, quiet buttons, clos | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-401 Letter page and Read together scale with Large print and kee | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-402 The app carries the brand: mark on the first screens, one At | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-403 Tonight reaches Settings and the child switcher, and settles | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-404 Settings leads with the person's book, not an apology or mon | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-406 Write and Review buttons say what they do: "Save" opens a re | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-408 Performance budgets have a harness: SQL perf test with a 5-y | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-409 Accessibility evidence in CI: AX5 snapshots, RN accessibilit | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-410 Extend the journey capture: locales, AX5, interruption state | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-411 Localisation position for v1.0 is stated; letter fixtures an | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-412 raw_transcript is immutable on the phone too: local triggers | REAL-FREE | No BEFORE UPDATE trigger in apps/mobile/src/lib/db/migrations.ts (only a comment at :247 about the server trigger). |
| BL-413 The words of a saved letter can be changed by the person, an | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-414 App code only contacts allowlisted hosts (CI test), and the  | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-415 Client log canary: no entry text, transcript or child name r | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-417 Listening screen: the disc is the Pause control, the timer d | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-418 One primary action pinned at the bottom on every screen that | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-419 First-run and stop screens: balanced headings, art on the gu | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-440 Store description matches the on-device v1.0 [Critical] (new | LIKELY-DONE | packages/content/src/store.en.ts:14 says no co-parent sharing is promised (D-121, D-126); release-config.test.ts and early-version-note.test.ts read storeListing. A rule rejecting invite promises was not found. |
| BL-444 A book this phone has left stays readable under "Letters to  | REAL-FREE | LEAVE_BOOK_OFFERED comments in invite/leave.tsx:7, family-tab.logic.ts:10, leave-sheet.logic.ts:6 say Leave is still not offered. |
| BL-446 Export includes the letters and books an account-deletion re | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-449 A sign-out wait ends when the queued letters belong to anoth | UNKNOWN | No decisive match from git grep on apps, packages, supabase, scripts, .github; needs the owner to run the row's Done-when. |
| BL-563 Listen never sticks on "finishing" (APP-01) | STALE-FIXED | PR #595 merged 8 Nov (9b202f67). Follow-ups #670, #618, #615 are other rows. |
| BL-564 Consent sheet links only to pages that exist (COMP-02) | STALE-FIXED | PR #589 merged 8 Nov (05ded2c5). |
| BL-565 Publish the app's own Terms and Privacy before build 2 signs | STALE-FIXED | PRs #616 and #652 merged 8 Nov (0.9.0 texts, website pages). Live URLs and policy_versions rows are founder steps, so the status keeps that gate. |
| BL-594 Edge Functions keep working when staging's legacy keys are s | CLAIMED | PR #602 is open (no agent label). |
| BL-775 A failed Erase everything that the person keeps using erases | REAL-FREE | Row written by docs-only #715; no code change on develop since. S1. |
| BL-816 Review's typed-text writer has no maximum wait, so a crash i | REAL-FREE | Row written by docs-only #727; no code change on develop since. S1. |

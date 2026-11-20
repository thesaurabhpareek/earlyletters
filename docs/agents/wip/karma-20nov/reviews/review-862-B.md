## Review B at f00c2259c841cf460f0eae468f202141ba804028: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens: privacy and compliance (chapter 07: the content-free rule, consent, inventory, claims; chapter 08: deletion and session end). File: `docs/tdd/new-scope/09-capture.md` (217 lines, ASCII only, uses the TDD 01 tags, cites card rows by id without copying card text). Head checked live at 11:10 UTC on 20 Nov; the commit dates from 05:48 UTC. CI on the head: green. 9 checks passed. One duplicate `compliance-fence` run was cancelled, and a later run of the same check passed.

Must fix: none.

What I checked, with cites (52 sampled, 51 hold). Code is develop at `20553b18`; the file cites `d5d12178`, which is 3 commits behind.
- Reminders code (all hold):
  - `planner.ts:26-27, 86-89, 288-289, 313, 347-368, 371` (377 lines).
  - `prefs.ts:42-51, 115-117, 120-131, 125`.
  - `scheduler.ts:1-4, 45, 145, 153-164, 159, 118-132, 256-260, 263, 293-310, 322-348`.
- Quiet books (all hold): `children.ts:47` and `store.ts:386-389`. Nothing in `lib/reminders` reads `Child.quiet` (grep).
- Session end (all hold): `erase-everything.ts:84`; `session-provider.tsx:218-222, 293-308, 311-326`; `use-account-deletion.ts:118`.
- Notifications package (all hold): expo-notifications 57.0.21 (`package.json:40`); `Notifications.types.d.ts:580` (`interruptionLevel`) and `:694` (`previewPlaceholder` on category options); `NotificationsEmitter.d.ts:83`.
- Preflight (all hold): `preflight-testflight.mjs:173-174, 589-590, 636`.
- Other app code (all hold):
  - `reminder-prime-ask.tsx:4`, `plan-reminders.logic.ts:50`, `remote-config.ts:57-72`.
  - `drafts.ts:35-40, 95`, `capabilities.ts:166-175, 186-187`, `migrations.ts:393-430` (version 10).
  - `start-capture.logic.ts:18-20, 64-69`, `start-intent.ts:9-22`, `+native-intent.tsx:49`, `listen.tsx:104, 130-134`, `app.config.ts:86`.
  - `review.tsx:599, 610-611, 671, 752` (1,317 lines).
  - `transcribe-language.ts:35-41`, `transcribe-run.ts:41-45`, `language-hold.ts:31-37`.
  - `data_governance.sql:95, 210`.
  - `sync.ts:94-102, 154, 157, 280-305, 294`.
  - `DEVICE_TEST_PLAN.md:998`.
- Absence claims (all hold): no `[X4-R1]` or `[X6-R1]` test on develop (grep); no writing-tools prop in React Native 0.86.3 (grep).
- Did not hold: `sync.ts:587` is not the push validator. It is `PulledRowSchema`, the pull-row schema (see CR-67 note 1).

Notification privacy. The design holds on every point below.
- Default content: names are off by default and stay off under App lock (`prefs.ts:40, 113`). `data` carries only `{ source, kind }`. `PlanInput` has no text field. PR 1's tests cover R6a and R6b, with canary words from the fixture letters checked against every title and body. That is NS-13's share of NS-32-R12 (P0); the rest of NS-32-R12 (plan notices) is tested in `11-foundations.md` on #864.
- Lock-screen placeholder: one category with `previewPlaceholder` from a PROPOSED content key, with `interruptionLevel: 'active'`. The time-sensitive entitlement is refused in the preflight.
- Typed days: words hidden by default (NS-18-R3, P0) and never in a payload. Home reads the key after the tap.
- Session end: `endReminderSession()` clears `notifications.lockScreenNames` and the typed-day and names-list prefixes, and dismisses notifications already shown. That covers R13 to R15 and NS-18-R6.
- Guideline 4.5.4: never asserted. It is listed as a CCO re-read before submission (1.10, section 11), as card section 17 asks. I fetched the guideline on 20 Nov 2026 (developer.apple.com/app-store/review/guidelines/). It names "Push Notifications" only, which matches the card.
- NS-04 spike: the file states its native footprint. It says no app group, no `UIBackgroundModes`, no new permission and no entity, and that a widget or control "may force an app group" (a founder decision, default no). It says screen-off recording likely needs a background mode that NX-39-R4 forbids. It plans a `security-architect` diff of the plist and entitlements (OQ-3, default no). The work stays on an Asha-only throwaway branch (D13), and only the findings file merges.
- Gates: the NS-16 flag stays off in production until counsel answers Q45, Q46, Q48 and Q54(f) and the PRIV-R20 `child-input` flag exists. Every NS-13 P0 row has a test in 1.8.

Notes (most serious first):
1. CR-67 AX-15. Section 6 (a) cites `sync.ts:587` as "the push validator". It is the pull-row schema; `EntryData` (`:245`) is a type with no runtime check. NS-16-R6's length check belongs before enqueue (AC-08). CR-67 wins until the file's next touch.
2. CR-67 AX-12. The quiet-books change edits `plannerChildren` (1.3), but the file ties `[X4-R1]` scoping only to the anchor reads. AX-12 puts one `bookVisibleTo` check in the reminder planner too. Without it, account B, after turning reminders on, gets month and birthday notes built from account A's child (and named, if names are on). Name the check in `plannerChildren`, so PR 2 and BL-961 do not edit the same line two ways.
3. Duplicate work with #864. `11-foundations.md` slice (b) carries the same quiet fix (`included: c.remindersOn && !c.quiet`), and slice (c) carries categories, placeholder and interruption level. This file's PR 2 and PR 5 do the same, and the folder README sends the quiet fix to a third "quiet-and-consent fix". The two files also name the placeholder key differently (`notifications.previewPlaceholder` here, `reminders.previewPlaceholder` there), and handle R21 differently ("holds by construction" here, `app.lastPlannedVersion` there). Pick one owner and one key.
4. Where the inventory row goes. PR 3 puts the `reminders.onSince` row in a `mobile` code PR, which is right under PRIV-R01 and round-2 X2. But that row is `docs/legal/**`, so the founder merges that PR (D-125), and `privacy.md` puts the same row in BL-960. Say which one, and that the PR's merge path is the founder's.
5. NS-18-R7 says words are deleted the day after delivery. Section 5 deletes them "at the first re-plan after the date", which needs the app to open. With no background task, the card row cannot be met strictly. Add a Conflict line, or word it as "at the first launch after the date".
6. Section 1.4 labels the inventory row "(X2 rule)". In this pack X2 also names the voice-or-picture rule (`00` section 7). Write "round 2 X2" so the two do not get mixed up.
7. The NS-04 spike does not say that a Siri phrase or App Shortcut invocation is handled by Apple. `privacy.md` line 44 does. A one-line cite is enough, so the findings file can record any label delta it finds (NS-06C `Label delta:`).
8. The test for NS-13-R33 (the placeholder is neutral) is in PR 5's files but not in the 1.8 table. It is P2, but the content key is reviewed for privacy, so name its test title there.

Buildability. Wave 2 (NS-13) is complete: files, data (one L2 key), the test for each P0 row, owner, two lenses, and merge order with P-3 first. Wave 3 outlines (NS-14, NS-15) give a P0 test design. Waves 4 and 5 are paragraphs, as the README allows.

Not verified: anything on a phone (how iOS shows `previewPlaceholder`, floating triggers, the cold-start response, a purged account emitting `SIGNED_OUT`). The NS-04 platform items. The eval A to C cites. #847 line references (17:111-143, 17:500). `busy.ts` covering a doorway start.

Reviewer: independent of the author (CR-44).

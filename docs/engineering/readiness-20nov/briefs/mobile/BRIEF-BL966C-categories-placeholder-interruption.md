Re-open every file:line before relying on it: several cites in the designs went stale on 20 Nov (checked here at develop `16e61549`, 20 Nov 19:04 UTC). Moved: the design puts the preflight entitlement check "beside `preflight-testflight.mjs:636`"; the entitlement checks are now at `:644-646`.
Pin at develop 4d33978f (errata E1 to E73, CL-001 to CL-147; E74 to E82 and CL-148 to CL-157 NOT yet applied; `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`): E45 (CL-119): the neutral lock-screen body for a title holding a day name is one fixed string with NO `{child}` in any switch state, key `days.lock.body.neutral` PROPOSED; the NS-47-R38 test stays P0. Council D4 (DECISIONS-20nov.md on PR #1013, pending merge): neutral title by default; names only if the parent turned them on and App lock is off; add the category and hidden-preview placeholder (NS-32-R13); with names off NO month number and no "A year of letters." on a lock screen (the age leaks); placeholder row 18 option A of #870 [PROPOSED]; device check NTC-T24 before done.
Blocked until: BL-966 (b) merged; the PROPOSED placeholder words read by the founder (BL-965). Two designs name the key differently: `docs/tdd/new-scope/09-capture.md` section 1.3 says `notifications.previewPlaceholder`, `11-foundations.md` section 2 says `reminders.previewPlaceholder` and `planReminders.previewPlaceholder`. Karma and `content` pick the name; this brief uses the placeholder `<key>`. The plan category `plan` is `payments`' code (hand off, do not edit `lib/billing/**`). Overlap to settle: `09-capture.md` section 1.9 PR 5 (BL-943) lists category, level and the cold-start landing; `11-foundations.md` section 2 PR (c) (BL-966) lists the category. This brief owns category, level and version re-plan; BL-943's PR 5 owns only the landing (NS-13-R9).

```
BRIEF BL-966c (categories, placeholder, interruption level, version re-plan)  Filled by: mobile RD-H1 for Karma, 20 Nov 2026 19:04 UTC
Agent: mobile (reminders owner)   Lane: Pack 4 (Reminders)   Build: 13 for the NS-32-R12 test; rest 14   Wave: 1

1. GOAL: When a reminder is shown on a locked phone with previews hidden, the only text is one neutral placeholder; every request carries the `reminder` category and level `active`;
   and the first launch after an app update re-plans once.

2. CARD ROWS and TEST TITLES
   Rows: NS-32-R10, R12, R13, R16; NS-13-R20, R21, R33 (R33 [U]: the design groups it with the category; card text not re-read). Cards 09 and 11 at 450bcb4a.
   Titles (catalogue A and C, PRs #925 and #926, exact):
     [NS-32-R10] interruption level            [NS-32-R12] lock screen stays plain
     [NS-32-R13] preview placeholder           [NS-32-R16] re-plan after update
     [NS-13-R20] never time-sensitive (source and config check)
     [NS-13-R21] re-plan after update
   Red on develop: `scheduler.ts:153-164` sets no `categoryIdentifier` and no `interruptionLevel`. Mutants (catalogue A and C): set time-sensitive (R10, R20); omit `previewPlaceholder` on one category (R13);
   interpolate `{child}` in the default body (R12); skip re-plan when the version changes (R16, R21).
   Types in `expo-notifications` 57.0.21: `previewPlaceholder` at `build/NotificationCategoriesModule.types.d.ts:6` and `Notifications.types.d.ts:694`; `interruptionLevel` at `:441` and `:580` [V in node_modules].
   The field is `previewPlaceholder` [V `NotificationCategoriesModule.types.d.ts:6`]; the old name `hiddenPreviewsBodyPlaceholder` (catalogue, `11-foundations.md:367`) does not exist in 57.0.21.

3. FILES  Touch: lib/reminders/{scheduler,index}.ts (category registration in `startReminders`, fields on each request), settings key `app.lastPlannedVersion` (L1) in lib/reminders/prefs.ts,
   apps/mobile/scripts/preflight-testflight.mjs (one check: no `com.apple.developer.usernotifications.time-sensitive`), tests reminders-planner or a new `reminders-categories.test.ts`; one PROPOSED key via `content`.
   Never: lib/billing/** (the `plan` category and its placeholder are `payments`'), app/_layout.tsx, lib/store.ts, planner logic (966b).
   Shared file rule: `apps/mobile/scripts/preflight-testflight.mjs` is claimed by the ops row (BL-958): add the one check only with Karma's ok or hand it to `ops`; whichever lands second merges develop. `scheduler.ts` with BL-943 PR 3 and BRIEF-HO908: whichever lands second merges develop.

4. READING PACK: Pack 4 items 2, 3, 5, 7; `09-capture.md` (design) section 1.3 "Category, interruption level, cold-start landing"; `expo-native-module` skill section 4 (entitlements, plist, background modes: none here).

5. CODE ENTRY POINTS (develop 16e61549)
   apps/mobile/src/lib/reminders/scheduler.ts:153-164   `scheduleNotificationAsync({identifier, content: {title, body, data: {source, kind}, sound: false}, trigger})`
   apps/mobile/src/lib/reminders/scheduler.ts:223        `startReminders()` (register the category here); :253 response listener; :135 `currentPlan`
   apps/mobile/scripts/preflight-testflight.mjs:644-646  entitlement checks (`aps-environment` absent): add the time-sensitive check beside them
   apps/mobile/src/lib/reminders/session.ts:57            `forgetReminders` on session end (done, #904)

6. DATA AND SECURITY
   Data classes: L1 `app.lastPlannedVersion` (a version string). Notification `data` stays `{source, kind}`: enums only, no name, no text. New storage, send, log: one setting; nothing sent; no body or name logged.
   Boundary: NS-32-R12 lock-screen threat (AB-10, AB-11, AB-16 in PR #915). Owner of the read: security-architect on R12 and R13.
   Privacy line: bodies come only from `packages/content`; names off by default (D-025).

7. LIBRARIES: none new. `expo-notifications ~57.0.21` as installed (LD-20 USE; PR #920). `active` needs no entitlement [U in the design; the preflight check proves it].

8. BUDGETS (PR #928): B-03; L-09 under 50 ms; L-03 the version re-plan runs after first frame, never awaited. Checked: Node timing here; the phone by the NS-34 sheet.

9. ACCEPTANCE  Experience: D-S10 Lock screen / Notification Centre (hidden, named, neutral; PR #921), EX-15. Test cases above. Security: AB-11 (no category sets `hiddenPreviewsShowTitle`). Done also means: red on old code and mutants.

10. PR BREAKDOWN: PR c: categories and levels | about 150 lines, 5 files | base develop after 966b | flag-off proof: none; ships on; way back: revert, next re-plan replaces the pending list.

11. LENSES: A principal-architect, B compliance-engineer (design: security-architect on R12).

12. ORDER: after BL-966 (b); before BL-943 PR 3. Blocked by: 966b, founder (placeholder words), Karma (key name).

13. DEFINITION OF DONE
    [ ] tests red on old code and mutants; `npm test -w apps/mobile`: only the 8 baseline files red; `npx tsc --noEmit` apps/mobile: only the 5 known errors; `npm test -w packages/content`; preflight test passes
    [ ] ASCII only; key PROPOSED; labels agent:mobile, from:agent, needs:founder; journal PATCHed; check-in line committed

14. ONLY A PHONE CAN PROVE: J-N24 lock screen across a week with previews hidden (JOURNEYS row 3.11); the placeholder on a real lock screen; iOS honours `active`.

15. STOP AND ASK: `previewPlaceholder` needs a plist key or entitlement; a category must be shared with `payments`; the key name is not ruled.

16. HARNESS: claim row held by Karma. Journal issue #8, marker `<!-- journal run:sess-20261120-mobile-bl966c agent:mobile -->`.
    Check-in `docs/agents/checkins/mobile-bl966c.md`. Branch feat/mobile-bl-966c-categories. Comments start `<!-- agent:mobile -->`.
```

# Capture: engineering design for NS-13 to NS-20 and the NS-04 hands-free spike

Status: Proposed, 20 Nov 2026. Author: `mobile` (Claude session) for Karma. Target: `docs/tdd/new-scope/09-capture.md`.
Sources: the locked pack on `docs/prd-lock-v1-20nov` at `450bcb4a` (the head the brief names; unchanged when read), cards `09-capture.md` and `04-hands-free-capture-spike.md`, with `11-foundations.md` (NS-32, NS-35), `13-engineering-plan.md`, `14-test-plan.md`, `16-council-review-round-2.md`; #847 at `de44b839`; code on `develop` at `d5d12178`. Nothing was run on a phone.
Tags as in `docs/tdd/01-mobile-client.md`: **Fact** (file:line), **Assumption**, **Rec**, **Risk**, **OQ** (owner, default), **Conflict**, **Unverified**. Card rows are cited by id, never restated. Words a parent reads are content keys marked PROPOSED for `content`; the founder approves words.

## 0. Cards, waves and depth

| Card | Wave (13:106-112; #847 17:111-143) | Depth here |
|---|---|---|
| NS-13 Reminders proven | 2 (BL-943) | Full design, section 1 |
| NS-14 Whose book | 3 (BL-941) | Outline, section 2 |
| NS-15 Another day | 3 (BL-944 superseded, BL-945) | Outline, section 3 |
| NS-04 Hands-free spike | 4, first | Spike plan (Karma's note), section 4 |
| NS-18 Typed days | 4 | Paragraph, section 5 |
| NS-16 Someone else speaks | 5, counsel gate | Paragraph plus contract names, section 6 |
| NS-17 Second language | 5, per-language gate | Paragraph plus contract names, section 7 |
| NS-19, NS-20 | not scheduled (17:143) | Paragraph each, section 8 |

NS-35 (one start, #828, merged `5f5dfaf4`) is built and not redesigned: `startCapture({source})` (`lib/capture/start-capture.ts:24-51`) with the closed source list (`start-capture.logic.ts:18-20`) is the one entry every card here uses. Doorway sources plan `reserved` today (`start-capture.logic.ts:64-69`).

---

## 1. NS-13 Reminders that help and then step back (wave 2, full design)

### 1.1 Behaviour to meet
All rows NS-13-R1 to R33 (card section 7); back-off exactly as card section 3a; journeys J-N3, J-N4, J-N5, J-N19 (reminder part), J-N22, J-N24, J-N26 (14:53-76). NS-32 lands first (ruling, 11-foundations NS-32 section 10); its rows NS-32-R1, R1b, R3, R4, R8, R9, R13, R14 overlap and are cited where this design meets them.

### 1.2 What is built (only what the design changes)
- **Fact** The planner has no back-off (`planner.ts:26-27`); evening horizon 21 days, notes 92 (`planner.ts:86-89, 288-289`); notes keyed `${kind}:${date}` (`planner.ts:313`), so two kinds on one date are two notes.
- **Fact** Smart quiet reads only own entries' `captured_at` (`prefs.ts:120-131`); drafts never count. `not_much` marks do count (they are entries; `quiet-day.logic.ts:13, 19`).
- **Fact** `plannerChildren` maps only `remindersOn` (`prefs.ts:115-117`). `Child.quiet` exists (`db/repos/children.ts:47`) and `store.ts:386-389` says "The planner reads `Child.quiet`"; nothing in `lib/reminders` reads it (grep). A quieted book still gets month and birthday notes: NS-32-R14 (P0) and J-N19 fail today.
- **Fact** Sign-out never calls `forgetReminders`; only Erase everything does (`erase-everything.ts:84`). The session ends on three paths: local finish (`session-provider.tsx:293-308`), the under-18 stop (`:311-326`), and a Supabase `SIGNED_OUT` (`:218-222`). Account deletion on the phone ends in `auth.signOut` (`use-account-deletion.ts:118`).
- **Fact** Scheduled content sets no `categoryIdentifier` and no `interruptionLevel` (`scheduler.ts:153-164`). expo-notifications 57.0.21 (`apps/mobile/package.json:40`) types both (`node_modules/expo-notifications/build/Notifications.types.d.ts:580, 694`) and `getLastNotificationResponse` (`NotificationsEmitter.d.ts:83`).
- **Fact** A tap on a month or birthday note on a cold start lands on Home, not the Book (`scheduler.ts:256-260`, "the app opens on Tonight anyway"). NS-13-R9 wants the Book.
- **Fact** Every launch re-plans in full: `lastSignature` starts null each run (`scheduler.ts:45, 145`), and the first re-plan is not awaited (`scheduler.ts:263`). NS-13-R21 holds by construction.

### 1.3 Design
**One pure module for the step-back rules.** Rec: new `lib/reminders/backoff.ts` (pure, Node-tested), so `planner.ts` (377 lines) stays readable.
- `anchorDay({ lastMadeAt, onSince, timeZone })`: the later of the local date of `lastMadeAt` and `onSince` (card 3a). `null` only when both are absent; the planner then uses today.
- `eveningDates(anchor, today, weekdays)`: days 1 to 7 after the anchor on the chosen weekdays; in each block 8-14, 15-21, 22-28, 29-35 the first chosen weekday only; nothing after day 35 (card 3a items 1 to 3). No evening nudge on day 0 (card 3a item 1; Conflict P4).
- `noteWindow(anchor)`: month and birthday notes only on days 0 to 35 (card 3a item 4), replacing the 92-day horizon for these classes.
- `BACKOFF_CLASSES = ['evening', 'monthAge', 'birthday']`, read from the NS-32 registry, so `typedDay` (NS-18) and `plan` are never stopped (NS-13-R29, NS-32-R9).

**Planner changes (`planner.ts`).** `PlanInput` gains `lastMadeAt` (replaces `lastSaveAt`, same instant for the 20 h smart quiet) and `onSince`. The evening loop (`planner.ts:347-368`) walks `eveningDates` instead of every day to the horizon; note days, smart quiet and quiet hours are unchanged. Notes outside `noteWindow` are skipped. Copy rotation stays `slotOrdinal` (`planner.ts:212-220, 353-354`) plus a post-pass that bumps a variant equal to the previous planned evening's variant, so two consecutive nudges never match after a skipped block (NS-13-R2; folds #680). The 60 ceiling and latest-first drop stay (`planner.ts:371`; NS-13-R23).

**One notification a day (NS-13-R19, R28).** Built in P-3 (NS-32, on #758): the note key becomes the date, priority typedDay, birthday, monthAge, evening. This card adds only the `[NS-13-R19]` and `[NS-13-R28]` test titles if P-3 did not.

**The anchor counts a made draft (NS-13-R27, R8).** `prefs.ts` `lastMadeAt()` replaces `lastOwnSaveAt()`: the later of (a) `MAX(captured_at)` over own entries not deleted (author is me or null, the rule at `prefs.ts:125`), and (b) `MAX(created_at)` over drafts in state `ready`, held or not (excludes `recording`, `discarding`, `unrecoverable`; `db/repos/drafts.ts:40, 95`). Two SQL reads in `db/repos/entries.ts` and `db/repos/drafts.ts` replace the per-child row scan. **Assumption** `ready` is "waiting at Keep" and `unrecoverable` is not a made letter. **Assumption** the reads go through the same account scoping `[X4-R1]` adds (drafts carry no author; `drafts.ts:35-37`).

**`reminders.onSince`.** `turnOnReminders()` (`scheduler.ts:293-310`) writes today's local date with `enabled`. Upgrade: an install with reminders on and no key gets one once at `startReminders` per OQ-13.4.

**Quiet books (NS-13-R12, NS-32-R14).** `included: c.remindersOn && !c.quiet` in `plannerChildren`. Hidden books are already absent (`listChildren` is `listVisible`, `store.ts:311-313`).

**The session ends, reminders end (NS-13-R13, R14, R15).** New `lib/reminders/session.ts` `endReminderSession()`: deletes `reminders.*`, `reminders.onSince` and `notifications.lockScreenNames` (`prefs.ts:42-51`; `deleteSetting`, `store.ts:281`), and a list of setting prefixes that NS-18 (`typedDay.`) and NS-16 (`signAs.recent`) extend when they land; then awaits `forgetReminders()` (`scheduler.ts:322-348`, which also dismisses presented notes). Settings go first so a debounced re-plan plans nothing. One effect in `session-provider.tsx` fires when the signed-in user id goes from a value to none, so all three paths and the deletion sign-out are covered; a phone that never signed in is untouched. It does not touch `activeChildId` (NS-14 state table: kept at sign-out, D1) or plan notices (`plan.` ids, `plan-reminders.logic.ts:50`). **Unverified** that a purged account's session ends with `SIGNED_OUT` on a phone that never taps Sign out; Rec: the first-run gate's "account gone" branch also calls `endReminderSession()`.

**Category, interruption level, cold-start landing (NS-13-R20, R33, R9; NS-32-R10, R13 for reminders).** `startReminders` registers one category with `previewPlaceholder` from a PROPOSED key `notifications.previewPlaceholder` (intent in NS-32 section 16); each content sets `categoryIdentifier` and `interruptionLevel: 'active'`, so a source test can pin R20. A small `lib/reminders/landing.ts` hook, mounted in `app/(tabs)/_layout.tsx` beside the reminder ask card (which already mounts there, `reminder-prime-ask.tsx:4`), reads `getLastNotificationResponse()` once, routes a month or birthday note to `/book`, then clears it. Root `_layout.tsx` boot wiring is not touched. Plan notices' category is `payments` code: hand-off.

### 1.4 Files touched
`apps/mobile/src/lib/reminders/{backoff.ts (new), session.ts (new), landing.ts (new), planner.ts, prefs.ts, scheduler.ts, index.ts}`, `lib/db/repos/{entries.ts, drafts.ts}`, `lib/store.ts` (two read exports), `lib/auth/session-provider.tsx` (one effect), `app/(tabs)/_layout.tsx` (one hook), `apps/mobile/scripts/preflight-testflight.mjs`, `packages/content` (one PROPOSED key, by `content`), tests under `apps/mobile/test/`, `docs/qa/DEVICE_TEST_PLAN.md` (by `qa`), `DATA_CLASSIFICATION.md` row (X2 rule).
No new screen: Settings, Reminders and the ask card are built; their "Next:" line reads the same plan (`intendedPlan`, `scheduler.ts:118-132`), so the back-off shows there without a UI change and no screen says reminders slowed (card section 15). AX5 stacking and VoiceOver states (card section 8) stay device rows.

### 1.5 Data, sync, native, flags
- Local SQLite: no table, column or migration (latest local is v10, `migrations.ts:393-430`). New settings key `reminders.onSince` (YYYY-MM-DD, L2), inventory row in the same PR (card section 11).
- Server: none. RLS and grants: none. `packages/api`: none; `killSwitches.reminders` only if OQ-13.3 says yes (`remote-config.ts:57-72` pattern).
- Native: none. No plist key, no entitlement. Preflight gains: generated entitlements carry no `com.apple.developer.usernotifications.time-sensitive` (beside `preflight-testflight.mjs:636`).
- Flags: none; ships on (card section 10). Rollback: revert; the next re-plan replaces the pending list.

### 1.6 Privacy and security
Nothing leaves the phone (local notifications, `scheduler.ts:1-4`); X2 n/a. Notification `data` stays `{ source, kind }` (`scheduler.ts:159`). Threats are the card's section 13; controls are names off by default (built), the neutral placeholder (new) and the session hook (new). Log canary: no body, name, child id or date logged (card section 8).

### 1.7 Performance
- Re-plan under 50 ms on SE 3 with the Asha 1,000-letter fixture (card section 8, PROPOSED). CI proxy: a Node bench of `lastMadeAt` plus `planReminders` on `node:sqlite` with 1,000 entries and 3 children, under 10 ms (PROPOSED). Device: a `human` device-check task in the NS-34 run sheet, timing `apply()` in a development build (numbers only).
- Cold start p50 1.2 s and p90 2.0 s, warm p50 400 ms: no awaited work is added at launch (`scheduler.ts:263` stays `void`); the two SQL reads replace a scan of every entry. Checked by reading the call path; the NS-34 run sheet measures.
- Tap to Home within 2 s (NS-13-R9): device row.

### 1.8 How each P0 row is tested

| Row | Test (file) | Level | Journey |
|---|---|---|---|
| R3, R4, R18, R32 | `test/reminders-backoff.test.ts`: injected clock, every cadence, plan on day 0 then days 1 to 60, never opened | unit | J-N4 (plus device spot check, 14:45) |
| R5, R10, R11, R24 | `test/reminders-never-list.test.ts`: scans `reminderCopy`, `en.notifications` and every plan for the Asha fixtures (born, due date only, past the allowance) against the 00 appendix A lists | content and unit | J-N17, J-N22, J-N26 |
| R6a, R6b | same file: names off gives no `{child}` and no fixture name; canary words from fixture letters absent from every title and body; `PlanInput` has no text field (type test) | unit | J-N24 (device) |
| R12 | planner test: `remindersOn` off, `quiet` on, hidden book | unit | J-N19 (device) |
| R13, R14, R15 | `test/reminders-session.test.ts`: mocked expo-notifications as in `test/reminders-erase.test.ts`; each of the three session-end paths and the deletion sign-out | integration | device row |
| R19 | P-3 test with the NS-13 title | unit | none (CI only) |
| R23 | backoff test: 3 children, `everyEvening`, typed days filling, plus the 4 plan notices: budgeted at most 60, total at most 64 | unit | none |
| R27 | `test/reminders-anchor.test.ts`: store on `node:sqlite` with own entry, other author's entry, ready, held, discarding and recording drafts | integration | none |
| R30 | existing clamp tests in `test/reminders-planner.test.ts` retitled, plus picker bounds | unit | J-N5 |
| R31 | `test/next-ask.test.ts` (MAX_REMINDER_PRIMES) retitled | unit | none |

P1 device rows (R1, R7, R9, R16, R25, the daylight-saving row, a date-line row): `qa` writes them per D13 (Asha-only install).

### 1.9 PR breakdown (merge order; every PR under 400 lines and 20 files)

| # | PR | Rows | Main files | Est. | Owner | Reviews |
|---|---|---|---|---|---|---|
| 1 | test: the reminder never-list | R5, R6a, R6b, R10, R11, R24; retitles R30, R31 | 3 test files | 180 lines, 3 files | mobile | compliance-engineer / qa |
| 2 | fix: reminders end with the session; quiet books get none | R13, R14, R15, R12; NS-32-R14 | `session.ts`, `session-provider.tsx`, `prefs.ts`, `index.ts`, 2 tests | 220, 6 | mobile | security-architect / compliance-engineer |
| P-3 | NS-32 one a day (designed with NS-32) | NS-32-R1, R1b, R3, R4; NS-13-R19, R28 titles | `budget.ts`, `planner.ts` | S | mobile | principal-architect / compliance-engineer |
| 3 | feat: the anchor counts a made letter | R27, R8 | `repos/entries.ts`, `repos/drafts.ts`, `store.ts`, `prefs.ts`, `scheduler.ts`, inventory row, test | 260, 7 | mobile | data-steward / principal-architect |
| 4 | feat: pre-scheduled back-off | R3, R4, R18, R32, R23, R2 (fold #680) | `backoff.ts`, `planner.ts`, test | 330, 3 | mobile | principal-architect / compliance-engineer |
| 5 | feat: placeholder, interruption level, cold-start landing | R20, R33, R9, R21, R26 | `scheduler.ts`, `landing.ts`, `(tabs)/_layout.tsx`, preflight, content key, tests | 250, 7 | mobile | security-architect / principal-architect |
| 6 | qa: NS-13 device rows | R1, R7, R9, R16, R25; J-N3, J-N4, J-N5, J-N19, J-N24 | `DEVICE_TEST_PLAN.md` | 120, 1 | qa | mobile / compliance-engineer |

PR 1 and PR 2 wait on nothing and may land before the Build 13 cut (#847 Q1 default needs R5, R6a, R6b tested before it). PR 3 to PR 5 follow P-3, which edits `planner.ts` first.

### 1.10 Dependencies
NS-32 (#758 rebased plus P-3; founder Q8, the cap, #847 17:500). `[X4-R1]` scoping for the anchor (no test on `develop`: `git grep` finds none). `content`: the placeholder key; 31 neutral lines for R2b (P2). CCO re-read of guideline 4.5.4 before submission (card section 17).

### 1.11 Risks, each with a way back
- **Risk** Live behaviour changes at update: a parent silent for more than 35 days stops getting reminders, and no nudge fires on the evening reminders are turned on. By design (card 3a); OQ-13.4 decides upgraders. Way back: revert PR 4; the next launch re-plans.
- **Risk** A session-end path is missed and A's notes reach B (P0). Control: one hook on the user id, one test per path. Way back: Erase everything still clears all.
- **Risk** Floating calendar triggers across the date line and at a daylight-saving change (**Unverified**, card section 5). Device rows decide; the plan never schedules two on one local date.
- **Risk** Cold-start routing by `getLastNotificationResponse()` races the tabs mount (**Unverified** on 57.0.21). Fallback: Home, as today.
- **Risk** The never-list test fails on live copy before the cut. Fix the copy, not the test (CLAUDE.md).

### 1.12 Open questions
- OQ-13.1 The 7-day and 4-week numbers. CPO with `user-research`. Default 7 and 4 (card OQ).
- OQ-13.2 Month and birthday notes stop with the back-off. CPO. Default: yes, after day 35 (card OQ).
- OQ-13.3 `killSwitches.reminders`. `mobile` with `ops`. Default: not added (card OQ).
- OQ-13.4 Upgraders with reminders on and no `reminders.onSince`. CPO. Default: no backfill when a made letter exists (the anchor is that letter); the update day only when none exists.
- OQ-13.5 Does "Not much today" count as a made letter for the anchor? CPO. Default: yes, as built (`prefs.ts:120-131` counts it).
- OQ-13.6 Is the ask-card count cleared at session end? CPO. Default: kept; it is per phone (NS-13-R22).

---

## 2. NS-14 Whose book this letter goes to (wave 3, outline)

- **Decisions.** Home renders the existing `ChildSwitcher` (`components/child/child-switcher.tsx:32-60`) above the dateline (`app/(tabs)/index.tsx:267-268`) when `listChildren()` has 2 or more books; it gains a `surface: 'home' | 'book'` prop for its event (analytics off, D-124). One selection already: `useChildren().select` writes `activeChildId` (`use-children.ts`; `store.ts:320-333`). No data change (ruling).
- **Why R3 and R4 hold.** A take takes its child at creation (`recorder.ts:135`, `write.tsx:134`); a Home switch changes only `activeChildId`; Review's "To {child}" (`WhoseBookSheet`) moves only that draft (`setDraftChild`, `store.ts:1190`). Listen is a full-screen route with no switcher (R8).
- **R11.** A selection reset when a different account signs in, on the same session hook as section 1.3 (keyed on the user id changing to a different value); depends on `[X4-R1]`.
- **R7.** Two nameless books: the label adds the birth or due date; a pure `switcherLabel()` in `child-switcher.tsx`, content key PROPOSED.
- **Tests.** P0: R3, R4 integration on `node:sqlite` (draft for A, switch to B, Keep files to the chosen book, the waiting draft stays A's); R8 route source test (Listen imports no switcher); R11 session test. Journey J-N6 (CI). Device: R5 (AX5 plus Bold Text on SE 3), R10 (300 ms p95).
- **Performance.** Home already reads `listChildren`; the switcher adds one row and a sheet mounted on demand. First-run interactive within 300 ms (B-NFR-008) unchanged; device row R10.
- **PRs.** A: `feat(mobile): whose book on Home` (R1 to R4, R6 to R9; about 200 lines, 5 files; mobile; principal-architect / design-systems). B: `fix(mobile): selection resets for a second account` (R11; about 80 lines; mobile; security-architect / principal-architect), after `[X4-R1]`.
- **Risks.** Home at AX5 on SE 3 crowding the capture controls (R5; card section 15 keeps them in the bottom third). Way back: revert A.
- **OQ.** NS-14b move a kept letter: CPO, default a separate card after NS-21 (card OQ).

## 3. NS-15 A letter for another day (wave 3, outline)

- **Facts.** Review saves the about-day from the draft's creation date and ignores the draft's own columns (`app/review.tsx:599, 752`). The draft already has `occurred_on` and `occurred_precision` (local v6, `migrations.ts:275-280`) and a setter nobody calls, `setDraftOccurred` (`store.ts:1206-1209`), which re-queues a held draft's `held.upsert` (`store.ts:1162-1177`). `HeldDraftData` carries both fields (`packages/api/src/server/sync.ts:287-288`); letters sync them as field group `occurred_on` (`sync.ts:94-102`). `DateSheet` takes any `{ occurredOn, occurredPrecision }` (`components/book/date-sheet.tsx:28-38`) and holds the bounds (`date-change.logic.ts:20, 43-46, 89-97`).
- **Decisions.** Review's dateline becomes a button (visible affordance) that opens `DateSheet` on the draft's day; Save calls `setDraftOccurred`; Keep and the voice-only save pass the draft's `occurredOn` and `occurredPrecision` (fix `review.tsx:599`; check `saveVoiceOnlyFromDraft`, `store.ts:546`). The letter page adds the said-on line when the local date of `captured_at` differs from `occurred_on` (`app/letter/[id].tsx:163`); the author-only control exists (`letter/[id].tsx:322, 458-471, 502-503`).
- **Data and contract.** No new column, migration, field group or export field (card section 10; ruling X9). **Conflict K1**: #847 BL-945 and Karma's task note expect a synced field.
- **Constitution (R4, R18, P0).** A source test: `setDraftOccurred` and `setEntryDate` are called only from `DateSheet` save handlers, and no date-parsing package is imported in `apps/mobile/src`. R11 and R16 reuse the erase tests and `[X4-R1]`.
- **Size rule.** `review.tsx` is 1,317 lines. Rec: the dateline lands as `components/review/review-dateline.tsx` so the Review diff stays small.
- **PRs.** A: `feat(mobile): set the day on Review` (R1, R4, R5, R18; about 250 lines, 5 files; mobile; data-steward / principal-architect). B: `feat(mobile): the letter page shows when it was said` (R3, R12; about 150 lines, 4 files; mobile; design-systems / principal-architect). Content keys PROPOSED: the two-date line and the dateline hint. Journey J-N7 (CI).
- **Risks.** A held draft's day change re-sends the held row (expected; R9 covers once-only). Way back: revert; the day stays editable on the letter page as built.

## 4. NS-04 Hands-free capture: spike plan (wave 4, first)

- **Question.** Can a doorway (`widget`, `controlCenterControl`, `actionButton`, `siri`) reach the one entry `startCapture({source})` and the Listen Ready state on Expo SDK 57, without ejecting, with no app group, no `UIBackgroundModes`, no new permission and no entity over letters, children or prompts, within EX-1 to EX-5? The card's Q1 to Q15 are the sub-questions (card section 3); none is restated.
- **Before the clock starts (not counted).** The founder sets the start (NS-04 OQ-1; the roadmap holds the date, T5) and names the phones (OQ-2). Product settles where a doorway lands (Conflict P1); default for the throwaway branch only: Listen Ready, as the card's EX-2 and NS-04-R5 measure it. The shared `[X6-R1]` source scan lands on `develop` first (no test exists today), so NS-04-R8 reuses it.
- **Method, day 1.** Branch `exp/hands-free-spike` from `develop`; bundle id suffix `.spike` through `ID_SUFFIX` (`app.config.ts:86`); test account holding only Asha (D13). On the branch only, `planCapture` sends a doorway to `/listen` with `armListen: false`, so Listen opens in `ready` (`listen.tsx:130-134`; `start-intent.ts:9-22`); a doorway path such as `/start/<doorway>` gets past the capture-route redirect (`+native-intent.tsx:49`). Q1: an App Shortcut in the main target through a local Expo module, as `modules/scribe-audio` is built (**Unverified** on SDK 57).
- **Day 2.** Q3 Action Button, Q4 Control Center control (a WidgetKit extension target, for example through `@bacons/apple-targets`, licence and SDK 57 support **Unverified**), Q11 table with the SE 3 and iOS 17 rows (NS-04-R9).
- **Day 3.** Q5 screen off (the build declares no `UIBackgroundModes` and the preflight fails one, `preflight-testflight.mjs:589-590`); Q12 interruptions; Q14 route change; Q6 options; Q8 "Still here" (`listen.tsx:472`).
- **Day 4.** Q7 Voice Control and Switch Control on Home, Listen, Review; Q2 and Q13 behaviour tables; Q9 checklist; Q15 with the `[X6-R1]` scan (NS-04-R8); the 200-fire run (NS-04-R7, EX-5); NS-04-R5 second fire refused (capture busy guard, `lib/capture/busy.ts`, **Assumption** it covers a doorway start). `security-architect` diffs the prebuilt Info.plist and entitlements against `develop` (EX-3, NS-04-R4).
- **Day 5.** `docs/research/spikes/hands-free-findings.md` in the card's form, plus the Node parse test for NS-04-R1, R3, R4, R9; hard stop. Unanswered questions are Open with UNVERIFIED.
- **Exit criteria.** EX-1 to EX-5 per trigger; outcome GO, PARTIAL or NO-GO as card section 7. A trigger that cannot reach SE 3 or iOS 17 is "not for the floor" and does not fail the others.
- **Time box.** 5 `mobile` days plus 1 `security-architect` day (day 4). Native builds count against D-092 (15 iOS builds a month): plan at most 5 (PROPOSED).
- **What merges.** Only the findings file and its parse test (`mobile`; security-architect / principal-architect). The branch is never merged, never on TestFlight, deleted after (NS-04-R2, R6).
- **Risks.** An agent cannot hold a phone: every device answer is the founder's run-sheet time (OQ-04.1). A widget or control may force an app group (EX-3: a founder decision, default no). Screen-off recording almost surely needs a background audio mode, which NX-39-R4 forbids: expect NO-GO or PARTIAL for that path.
- **OQ-04.1** Who operates the phones during the 5 days. Founder. Default: `mobile` builds and writes a daily run sheet; the founder runs it the same day; a day counts only when its device steps ran.

## 5. NS-18 Typed days (wave 4, paragraph)

Rests on the NS-32 registry class `typedDay` (P-3) and the section 1.3 planner (typed days rank first, never backed off). Settings keys `typedDay.<yyyy-mm-dd>` (words, L4) and `typedDay.showWords` (L2), no local or server migration, nothing synced or exported (card section 10); flag `EXPO_PUBLIC_TYPED_DAYS`, off by default, following `capabilities.ts` without tying a local feature to `serverFeaturesEnabled()` (`capabilities.ts:186-187`). The notification `data` stays `{ source, kind }`; after the tap Home reads that day's key, so the words never ride in a payload. Keys are deleted at the first re-plan after the date, and by `endReminderSession()` (section 1.3). Decided first: the Home placement of the words (Conflict P2, CPO); typed days with reminders off (card section 5 PROPOSED, CPO); `typedDay` before `birthday` (NS-32 OQ, CPO, default typed day first); export of typed days (CPrivO with counsel, Q51, default not exported); founder Q8 (the cap). The words field needs writing tools off (Finding K3). P0 rows R3, R6, R8 (J-N18 canary) are unit and source tests.

## 6. NS-16 Someone else speaks (wave 5, gated; paragraph and contract names)

Rests on `entries.author_signs_as`: CHECK at most 30 characters (`20261002020000_data_governance.sql:95`), insert-only in sync (`sync.ts:157`), selected by `book_entries` (`data_governance.sql:210`), exported as `author.signs_as`. Review sets `authorSignsAs: child.signsAs` today (`review.tsx:610-611, 671`). Local: a new nullable `drafts.author_signs_as` (L3) in the next free local migration (v11 is claimed by #835), so a typed name survives a kill until Keep, and `signAs.recent` (L3, at most 20; cleared at session end by the section 1.3 hook and by Erase everything). Contract changes to name, schema left to `docs/tdd/new-scope/data-and-sync.md`: (a) the push validator types `author_signs_as` as a plain `nullableStr` (`sync.ts:587`); Rec: 1 to 30 code points at the contract, so an over-long value is refused on the phone (R6) and never meets the server CHECK; (b) `HeldDraftData` has no name key (`sync.ts:280-305`), so a held draft kept on the author's other phone is signed as the parent (Conflict P3): either a new `held_drafts.author_signs_as` column and key, or accept the gap; `data-architect` decides, default accept. Counsel gate: flag `EXPO_PUBLIC_SIGN_AS_OTHER` stays off in production until counsel answers Q45, Q46, Q48 and Q54(f) through the founder and the PRIV-R20 `child-input` flag system exists (card section 22); Rec: add it to the preflight's held-off flag list beside `EXPO_PUBLIC_BACKUP` (`preflight-testflight.mjs:173-174`). Also decided first: Find indexing (founder, default no, R8); the names cap (CPO, default 20). Writing tools off on the From field needs Finding K3. R9 (no speaker identification) is a source scan over the README appendix A deny-list.

## 7. NS-17 A second spoken language (wave 5, gated; paragraph and contract names)

Rests on the built hold: `languagesOnHold` (`language-hold.ts:31-37`), queue phase `waiting_for_language`, flags `EXPO_PUBLIC_ENGLISH_ONLY` and `EXPO_PUBLIC_SPOKEN_LANGUAGES` (`capabilities.ts:166-175`), and `translate: false` (`transcribe-run.ts:41-45`). The constitution and TDD 03 apply: no translation, no transliteration, no rewriting; the language is the author's choice. New: Review's "another language" mark sets a local `drafts.language_withheld` (next free local migration) and keeps the machine output phone-only (L4, D10). R6 needs one code change: `toWhisperLanguage` maps unknown codes to `auto` (`transcribe-language.ts:35-41`) although `transcribe-run.ts:41-43` says never `auto`; Rec: an unknown code holds the take instead (Conflict K2). Contract changes, schema left to `data-and-sync.md`: the held-draft push for a flagged take omits `raw_transcript` and `final_text`; but `raw_transcript` is "immutable once non-empty" on `held_drafts` (`sync.ts:294`), so nulling words already pushed needs a server change or `held.discard` then a new push (**Unverified** whether the server accepts the same id after a discard). Card default: never push a flagged take until it has typed words (Conflict P8). Also decided: which `raw_transcript` a kept withheld take carries (Rec: the parent's typed words as a typed letter with its audio; the withheld output erased with the take); owner `data-architect` with `ai-eng-lead`. Gates per language: a native reviewer, the founder's sign-off and spend (about $1,000 to $1,500 each, card section 22), the R2 measurement with `npm run gate`. Owner `speech`, with `mobile` for Review.

## 8. NS-19 and NS-20 (not scheduled)

**NS-19 Continue a draft.** Would rest on a new take structure (`data-architect`: local and server tables with grants, a sync field group, an export minor), one immutable `raw_transcript` and one `verifyEdits` pass per take (R4), and a new `continue` source in the closed list in the same PR as its handler (NS-35-R5). Decided first: the constitution review (13:56) and the CPO taking it up. R1 (P0) holds today and is cheap to keep: Rec a source check now that the letter page pushes no capture route (extends `test/navigation-one-entry.test.ts`).

**NS-20 A letter to two books.** Decided first: one letter or two copies, and how it is counted (founder with the CPO role and `data-architect`; default not built). Today `child_id` is immutable on the server (`sync.ts:154`) and `WhoseBookSheet` is single-choice, so R1 holds by construction; Rec: retitle a test `[NS-20-R1]`.

## 9. Cross-cutting findings

- **K3, writing tools (ruling D2).** React Native 0.86.3 exposes no writing-tools switch (no `writingTools` anywhere in `node_modules/react-native`; also `docs/research/competitors/adjacent-and-ux-benchmarks.md:537`). D2 cannot be met from JS: the Review editor (built), the From name, typed-day words and typed letter words need a native patch setting `writingToolsBehavior` to none on those inputs. Rec: one shared PR before NS-16, NS-17 or NS-18 ship, owner `design-systems` (text input lives in `components/ui`) with `mobile`, review `security-architect`; a local Expo module, no new library. Size L under 13:13.
- **`[X4-R1]`, `[X6-R1]`.** Neither has a test on `develop` (`git grep`). NS-13's anchor, NS-14-R11 and NS-04-R8 depend on them.

## 10. Conflicts

For product (card gaps):
- **P1** NS-04 section 3 says a doorway opens Listen Ready ("`/listen?entry=widget` today"); NS-35-R3 says it lands on Home or a reading screen; the code sends any link to `/listen` to Home (`+native-intent.tsx:49`) and Listen reads no `entry` param (`listen.tsx:104`).
- **P2** NS-18 section 4 step 3 shows the typed words on Home above the prompt; the Home slip order (00 line 67, `[FRAME-SLIP]`) has no typed-day slot.
- **P3** NS-16-R2 and R10 (the name follows the letter) against `held_drafts` having no name column (card section 10): a held draft kept on another phone loses it.
- **P4** NS-13 3a item 1 starts nudges on day 1; the built planner can nudge the evening reminders are turned on.
- **P5** NS-32 section 3 counts the back-off "from the last made letter"; NS-13 3a adds `reminders.onSince`. Default: NS-13 (more specific).
- **P6** The same placeholder is NS-13-R33 (P2) and NS-32-R13 (P1).
- **P7** NS-13-R12 names hidden books and "Include in my reminders"; NS-32-R14 and J-N19 also name a quieted book, which the code ignores (`prefs.ts:115-117` against `store.ts:386-389`).
- **P8** NS-17-R8 wants no words on the server after the next push; `held_drafts.raw_transcript` is immutable once non-empty (`sync.ts:294`).

For Karma (engineering):
- **K1** Karma's note ("NS-15 and NS-16 add synced fields") and #847 BL-944 and BL-945 (17:124-125: a new synced column, M, "13 says L") against the locked NS-15 section 10 and ruling X9 (no field, size S, 13:52). Cards win (13:3). NS-16's only candidates are section 6 (a) and (b).
- **K2** NS-17-R6 (never auto-detect) against TDD 03 section 3.5.6 (`auto` when the author skipped the choice, and for Hindi in Roman or as spoken) and `transcribe-language.ts:35-41`.
- **K3** Ruling D2 against what React Native exposes (section 9).
- **K4** NS-13-R9 against the built cold start (`scheduler.ts:256-260`); fixed by section 1.3.
- **K5** #680 names device row S1-133; on `develop` S1-133 is Delete this book (`DEVICE_TEST_PLAN.md:998`); 14:139 and #847 say S1-135.
- **K6** `review.tsx` (1,317 lines) is touched by NS-15, NS-16 and NS-17; each extracts its control first or breaks CODE-R02.

## 11. Questions for the founder or counsel (with defaults)

- Founder: Q8, the notification cap (#847 17:500). Default one budgeted notification a day (NS-32).
- Founder: NS-04 OQ-1 (engineer, start; default `mobile`, the roadmap's date), OQ-2 (phones; default a lab phone and an SE 3 on iOS 17, Asha-only), OQ-3 (plist or entitlement change; default no), OQ-04.1 (who runs the phones; default the founder, daily).
- Counsel through the founder: NS-16 Q45, Q46, Q48, Q54(f) (default flag off in production); NS-18 Q51 with the CPrivO role (default not exported); NS-17 Q9 and Q12 per language (default the language stays absent); CCO re-read of guideline 4.5.4 for NS-13 (default: local notifications as built).
- Founder: NS-16 Find indexing (default no); NS-17 per-language sign-off and spend (default none); NS-20 one letter or two copies (default not built).

## 12. Not verified

On a phone: every device row; floating triggers across the date line and daylight saving; `previewPlaceholder` and the default interruption level as iOS renders them (types only, expo-notifications 57.0.21); cold-start `getLastNotificationResponse()` timing; a purged account emitting `SIGNED_OUT`. Platform: all NS-04 items (App Intents, Control Center controls, Action Button models, screen-off recording, `@bacons/apple-targets`). Server: a `held.discard` then a push of the same id. Code: whether any catalog language maps to `auto`; SQLite `MAX` over 1,000 rows on SE 3 under 1 ms (**Assumption**).

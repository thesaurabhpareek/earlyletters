# NS-13 to NS-20: Capture (more letters kept, in the few minutes a parent has)

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: Karma with the CPO role | Replaces: none | Load when: building or testing capture, reminders, books, languages (NS-13 to NS-20).

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: Karma with the Chief Product Officer role (Claude sessions). Docs only. Card shape: `README.md`. Rulings applied: `00-rulings-round2` of 20 Nov (T1 to T5, D1 to D13, CTO rescopes of NS-14, NS-15, NS-16, NS-17), cited on each card as "Ruled 20 Nov (Karma, council round 2)".
Nothing was run on a phone. Code facts were read on `develop` at `697233d35` in the files named, this session. Words in quotes that are not an existing content key are intent for `content`, never final copy. PROPOSED marks a proposal; UNVERIFIED marks anything not read in code or a source this session. Legal readings: counsel must confirm (counsel packet 1.5.0 numbers).
Job served: "Let me capture it in the few minutes I have" (rank 2) and "Tell me what to write about, without nagging" (rank 5).
Priority: P0 rows carry their RR-4 reason: (a) a promise, (b) a legal or store duty, (c) the core loop. Test titles use the `[NS-xx-Rn]` form; `scripts/trace.mjs` does not yet read NS ids (r3 F1), so no card claims trace coverage until that is fixed.
Timing: cards state order and gates only (ruling T5).

Rules for every card here:
- Only Home starts a letter. Capture is never blocked by payment. Nothing counts what a parent did not do.
- **Device evidence (ruling D13).** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, recording, log or trace carries a real name, letter, picture or voice.
- **Sign-out (ruling D1).** Sign-out keeps the book on the phone (`session-provider.tsx:293-307`). A second account never sees, claims or uploads the first account's local letters (`[X4-R1]`).
- **Never (rulings D2, D3).** No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (`[X6-R1]`: a source scan finds no `CSSearchableIndex`, no `isEligibleForSearch` and no `AppEntity` over letters, children or prompts). System writing tools are off on the Review editor, the Firsts label, photo text, place, typed-day words and the From name; `mobile` checks whether React Native exposes the switch, and if it cannot, that is a finding, not a silent pass.
- **Free or Plus (ruling T2).** Every capability that ships free in the 1.0.x line falls under principle 6 and never moves behind Plus. Plus holds one paid act (keeping beyond the allowance). Public copy says nothing either way.
- **Measures.** Analytics is off for the 1.0 line (D-124 item 3). Hand-sent numbers are "x of n", never a percentage when n is under 20; at most 5 fixed questions per round, versioned in `docs/research/`; numbers only, in the founder's private sheet, deleted 90 days after the round (ruling D5).

---

## NS-13. Reminders that help and then step back (candidate C-05, rank 5)

### 1. Who and when
P1 at the hour they chose, usually after bedtime, phone face down beside them. And P1 three weeks later, who has not opened the app and must not be made to feel behind.

### 2. Why
A parent who means to keep letters forgets. A reminder at the right hour is the difference between twelve letters a year and sixty [A]. Reminders are built (`apps/mobile/src/lib/reminders/`) and have never been proven on a real phone across a time-zone change, a season change, or a week of silence (`docs/design/NOTIFICATIONS.md` section 1). The back-off is in the spec (C-REQ-008) and not in the planner (`planner.ts:26-27`). A reminder that repeats itself, fires at night after a flight, or keeps knocking is worse than none: it teaches the parent to turn notifications off for good.

Why the back-off must be scheduled in advance (r3 F14): iOS delivers calendar triggers that were scheduled ahead. A parent who never opens the app never runs a re-plan. So the whole back-off, including its stop, must be inside the plan that is already on the phone.

### 3. What, and Not in scope
**What.** Prove on a phone what is built, and add the pre-scheduled back-off and the cross-book one-per-day rule. Every rule keys on a letter *made* (kept, or a draft waiting at Keep or held), never on *kept*, so a parent past the free allowance is never nudged toward the paywall.

Built today, as read in code:
- The planner is pure (`planner.ts`); the scheduler cancels ours and schedules the plan again on every store write, foreground and permission change (`scheduler.ts:142-167, 223-273`).
- Each iOS note is a one-off calendar trigger with no time zone (`scheduler.ts:13-16, 101-113`): it fires at that wall-clock time wherever the phone is.
- The hour is clamped to 07:00 to 21:30 in 15-minute steps (`planner.ts:127-130, 172-184`); the planner accepts a narrower window meant for remote config (`planner.ts:92-97, 152-158`), but no remote key sets it today (`packages/api/src/remote-config.ts` has none) and `intendedPlan` passes none (`scheduler.ts:118-127`); the stored time is clamped on write (`prefs.ts:103`). The picker offers no hour outside that window.
- Evening nudges on the chosen weekdays (`fewTimes` default Tuesday and Saturday, `everyEvening`, `weekly` default Saturday; `planner.ts:131-133`) at the chosen time, default 20:30.
- Smart quiet: no nudge within 20 hours of the parent's newest own save, or within 2 hours of the app coming to the foreground (`planner.ts:135-136, 343-352`).
- Month notes on each included child's month-day at the reminder time, and the birthday note at 09:00 (`planner.ts:301-338`); children with only a due date get none (`planner.ts:306`).
- A month or birthday note replaces that day's evening nudge (`planner.ts:350`).
- Copy rotates through the evening variants by slot order, so no variant repeats within one cycle and no title shows twice in a row (`planner.ts:21-22, 353-356`). Neutral variants (no name) unless "Names in notifications" is on (`planner.ts:243-247`); names are forced off while App lock is on (`prefs.ts:109-112`).
- At most 60 pending notifications (`planner.ts:90, 290, 371`); iOS keeps 64.
- A tap on an evening nudge opens Home; on a month or birthday note, the Book (`scheduler.ts:253-261`). The notification carries only `{ source, kind }` (`scheduler.ts:159`), no prompt key.
- The ask card after the first letter has a cap of 2 showings ever; "No reminders" is an answer (`NOTIFICATIONS.md` section 1; `components/asks/reminder-prime-ask.tsx:13`).
- Hidden books are never reminded; each book has "Include in my reminders" (`prefs.ts:114-117`).
- Erase everything removes every scheduled and presented note (`scheduler.ts:322-348`; `erase-everything.ts:84`).

Not built today, and required by this card:
1. **Pre-scheduled back-off** (section 3a).
2. **One notification per local day across books and classes.** Today a birthday note for one child and a month note for another child on the same day are two notes, because notes are keyed by kind and date (`planner.ts:313-316, 328`). They merge into one.
3. **The anchor counts drafts.** Today smart quiet reads only the newest own entry's `captured_at` (`prefs.ts:120-131`); a draft waiting at Keep or held does not count. It must.
4. **Sign-out cancels reminders.** Today only Erase everything calls `forgetReminders` (`erase-everything.ts:84`); sign-out does not (`session-provider.tsx:293-307`). It must, and it clears the reminder settings so nothing re-plans for the next person.

### 3a. The pre-scheduled back-off plan (exact)
Definitions:
- **Local day**: the device's calendar day at delivery time.
- **Anchor day (day 0)**: the later of (a) the local date of the parent's newest made letter on this phone (own entry `captured_at`, or own draft `createdAt` for a draft waiting at Keep or held, never a draft marked `discarding`), and (b) the local date reminders were last turned on (new settings key `reminders.onSince`, written by `turnOnReminders()`). Opening the app does not move the anchor.
- **Classes in this card**: `evening`, `monthAge`, `birthday` (the NS-32 registry also holds `typedDay` and `plan`).

What is scheduled, every time the plan is made (the same pure function, so the plan on the phone is always complete):
1. **Days 1 to 7 after the anchor**: evening nudges on the chosen weekdays of the chosen cadence at the chosen time, subject to smart quiet (20 h after the newest made letter; 2 h after foreground).
2. **Days 8 to 35**: at most one evening nudge in each 7-day block (days 8 to 14, 15 to 21, 22 to 28, 29 to 35), on the first chosen weekday in the block, at the chosen time. For the `weekly` cadence this is the chosen weekday, so a weekly parent goes straight to the four-week rule.
3. **After day 35**: no evening nudge, no month note and no birthday note is scheduled. Typed days (NS-18) and plan notices (NS-32) are not stopped by the back-off.
4. **Month and birthday notes**: per included child, on that child's month-day (birthday note at 09:00, clamped into the window), only on days 0 to 35 after the anchor. Two children's notes on one day are one notification (grouped copy, as built for same-kind notes); a birthday and a month note on the same day are one notification, the birthday copy winning (PROPOSED).
5. **One notification per local day, across books and classes**: priority on a day is typed day, then birthday, then month note, then evening. The lower ones are not scheduled that day.
6. **Clamp**: every time is inside 07:00 to 21:30 local, in 15-minute steps (as built). No reminder fires between 21:30 and 07:00. There is no "unless the parent chose that hour": the picker offers none.
7. **Ceiling**: at most 60 pending notifications of all classes together (iOS keeps 64). Plan notices (NS-32, up to 4) are scheduled first and are never the ones dropped. If the ceiling binds, the latest-dated budgeted notes are dropped first and the next re-plan refills them.
8. **Horizon**: evening and note horizons end at day 35 after the anchor (replacing today's 21 and 92 days for these classes); a plan made after day 35 schedules nothing from these classes.
9. **Making a letter or turning reminders on again** moves the anchor; the next re-plan (a store write fires it, `scheduler.ts:247`) schedules days 1 to 35 from the new anchor. Today's pending nudge is removed when a letter is made today (smart quiet and the re-plan).

Worked bound (PROPOSED check for R23): with `everyEvening`, days 1 to 7 give at most 7 nudges and days 8 to 35 at most 4, so 11; month and birthday notes over 36 days give at most 2 days per child (grouped per day); typed days fill the rest up to 60 with plan notices first.

**Not in scope.** Remote push. A 10 PM option (a v1.1 proposal after Study 1, `NOTIFICATIONS.md` section 2). The 174-variant inventory (v1.1 content drop). Syncing reminder settings between phones (NS-13-R22). Prompt-specific landing (the notification carries no prompt key; see R9).

### 4. Happy path
1. After keeping a first letter, the ask card offers reminders, at most 2 showings ever; "No reminders" counts as an answer. The iOS permission is asked only after a yes, once.
2. The parent picks how often, which evenings and an hour between 07:00 and 21:30. The default is "A few times a week", Tuesday and Saturday, 8:30 PM (as built).
3. At that hour a quiet, silent notification arrives with a neutral line that names no child (the default; the existing opt-in shows the child's name, with its own door lines). Tapping it opens Home within 2 seconds, with Home's current prompt; one more tap starts speaking.
4. They make a letter. Tonight's nudge is not delivered; the next one has different words.
5. If they make nothing for a week, nudges slow to one a week; after four more weeks they stop. Nothing on screen says so.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| Permission declined | No reminders, no second ask from us. Me shows how to turn them on in one sentence and Open Settings |
| No letter made for 7 days | Plan already holds at most one nudge a week for days 8 to 35, then nothing. No "we miss you", no count, no last-chance line |
| Never opens the app after day 0 | The plan on the phone delivers nothing after day 35 (R18) |
| Travel across time zones | Floating calendar triggers fire at the chosen wall-clock time in the new zone; never between 21:30 and 07:00 local |
| A date skipped by crossing the date line eastward | That date's note is not delivered, or delivered once late: iOS behaviour UNVERIFIED; device row decides; never two in one local day |
| Clock change in spring or autumn | The chosen hour holds (floating trigger); the window excludes 02:00 to 03:00 |
| Two books | At most one notification per local day across all books (R19). Each book's "Include in my reminders" decides whether its month notes and names are eligible. A month note for book B replaces the evening nudge |
| A child with only a due date (P3) | Evening nudges allowed; no month or birthday note; no due-date wording (R10) |
| A letter made today (kept, waiting at Keep, or held) | No reminder today (R8) |
| Free allowance used, no Plus | Same rules; no reminder names Plus, a price or the Keep step (R11) |
| A hidden book, or "Include in my reminders" off | No month note and no name for it (R12) |
| Notification on a lock screen | No child name, no letter words by default; iOS "Show Previews" is the parent's setting, not ours (research note 3) |
| Reminders off, then on again | Anchor resets to that day |
| App lock on | Names off whatever the setting says (as built) |
| iOS refuses the schedule | Settings shows "Could not set reminders just now." with Try again (as built, `scheduler.ts:169-196`) |
| App updated | All pending reminders re-planned at the first launch after the update (R21) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Ask card after the first kept letter; cap of 2 showings |
| Empty | No letter yet: anchor is the day reminders were turned on |
| Many (1,000 letters, 300 pictures) | Anchor reads the newest own letter; the planner never scans more than it needs (PROPOSED: an index on `captured_at`; plan under 50 ms on SE 3) |
| Offline | Local notifications; unaffected |
| Slow | n/a because nothing waits on a network |
| Failed | iOS refuses: the built failure line and Try again |
| Interrupted (call, Siri, alarm, the baby) | A notification arriving during a call follows iOS; the tap lands on Home when the parent returns |
| App killed mid-flow | The plan is already scheduled; killing the app changes nothing |
| App updated mid-flow | Re-planned at the first launch after the update (R21) |
| Low storage (under 1 GB, under 50 MB) | Notifications unaffected; a tap under 50 MB lands on Home, where the storage card shows |
| Low Power Mode and low battery | Local notifications unaffected; no change |
| Two books | One notification a day across books (R19) |
| Two parents | Per phone; a letter made on phone A by the same account cancels phone B's nudge only after B's next pull and re-plan; an offline B may still remind (R25) |
| Expecting parent (due date only) | Evening nudges allowed; no due-date wording |
| Multilingual (Devanagari, RTL, CJK) | The notification language is the interface language; a name in any script is filled as typed; RTL titles follow iOS |
| AX5 plus Bold Text on SE 3 | The hour picker and day chips stack; nothing truncates |
| VoiceOver | Notification text is read by iOS; settings rows read their state |
| Voice Control and Switch Control | Day chips and the hour picker have visible labels and are reachable by item scanning |
| Reduce Motion | n/a because no motion |
| Dark mode and Increase Contrast | Settings tokens; 4.5:1 |
| Plan lapsed | Same rules; never sells (R11) |
| Signed out | Every reminder cancelled and presented ones removed; reminder settings cleared (R14) |
| Second account on the same phone | Starts with none; never A's names (R13) |
| New phone | Settings do not sync; the ask follows the normal two-showing cap on that phone (R22) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-13-R1 | Given reminders on at a chosen hour, When that hour comes on a chosen day inside days 1 to 7 and no letter was made today, Then exactly 1 notification is delivered within 5 minutes of the hour (device) | P1 | `[NS-13-R1] one reminder at the chosen hour` |
| NS-13-R2 | Given two consecutive nudges, Then their body text differs | P1 | `[NS-13-R2] never the same words twice running` |
| NS-13-R2b | Given 30 days of nudges, Then no body repeats within 30 days (PROPOSED; needs at least 31 neutral lines; today the pool is the 8 tested evening variants, `NOTIFICATIONS.md` section 3) | P2 | `[NS-13-R2b] no body twice in thirty days` |
| NS-13-R3 | Given the anchor day and no letter made since, When the plan is made, Then days 8 to 35 hold at most 1 evening nudge per 7-day block, on the first chosen weekday in the block | P0 (a) | `[NS-13-R3] unanswered reminders back off` |
| NS-13-R4 | Given the anchor day and no letter made since, Then no evening, month or birthday note is scheduled after day 35, until the parent makes a letter or turns reminders on again | P0 (a) | `[NS-13-R4] reminders stop on their own` |
| NS-13-R5 | Given any reminder string, Then it contains no number of days, no count, and none of: miss, behind, forgot, streak, last chance; a month note may name the age ("Month 3"), which is not a gap | P0 (a) | `[NS-13-R5] no guilt words` (content rules test) |
| NS-13-R6a | Given names off (the default), Then every title and body comes from the neutral variants and contains no `{child}` token and no child name (test over the whole neutral pool and the plan for the Asha fixture) | P0 (a) | `[NS-13-R6a] the notification pool is name-free` |
| NS-13-R6b | Given any setting, Then no scheduled notification contains letter text | P0 (a) | `[NS-13-R6b] no letter words on the lock screen` |
| NS-13-R7 | Given the phone's time zone changes, Then the next nudge fires at the chosen wall-clock hour in the new zone and none fires between 21:30 and 07:00 local (device; holds by construction of floating calendar triggers, `scheduler.ts:101-113`) | P1 | `[NS-13-R7] the hour follows the parent` |
| NS-13-R8 | Given a letter made today (kept, waiting at Keep or held), Then today's pending nudge is removed at the next re-plan | P1 | `[NS-13-R8] no reminder after a made letter` |
| NS-13-R9 | Given a tap on an evening nudge, Then Home opens within 2 seconds on an SE 3 showing Home's current prompt; a tap on a month or birthday note opens the Book (device) | P1 | `[NS-13-R9] the reminder lands on Home` |
| NS-13-R10 | Given a child with a due date only, Then no reminder string refers to the due date or counts days to it | P0 (a) | `[NS-13-R10] nothing about a due date` |
| NS-13-R11 | Given the allowance is used and no Plus, Then no reminder string names Plus, a price or the Keep step, and the rules are unchanged | P0 (b) | `[NS-13-R11] reminders never sell` |
| NS-13-R12 | Given a hidden book, or a book with "Include in my reminders" off (F12-REQ-011), Then no note names it and no month or birthday note is scheduled for it | P0 (a) | `[NS-13-R12] a quiet book gets no reminder` |
| NS-13-R13 | Given A signed out and B signs in on the same phone, Then no notification of A's is pending or presented and B starts with reminders off | P0 (a)(b) | `[NS-13-R13] a second account starts with none` |
| NS-13-R14 | Given sign-out, Then every scheduled and presented reminder of ours is removed and the `reminders.*` and `notifications.lockScreenNames` settings are cleared (not built today: sign-out does not call `forgetReminders`) | P0 (a) | `[NS-13-R14] sign out removes reminders` |
| NS-13-R15 | Given account deletion, Then every reminder is cancelled and its settings cleared | P0 (b) | `[NS-13-R15] deletion removes reminders` |
| NS-13-R16 | Given permission revoked in iOS Settings, Then nothing is scheduled at the next foreground and Me says how to turn them on, with no in-app nag (device) | P1 | `[NS-13-R16] revoked permission schedules nothing` |
| NS-13-R17 | Given reminders switched off, Then nothing of these classes is pending after the re-plan | P1 | `[NS-13-R17] off means nothing pending` |
| NS-13-R18 | Given a plan made on day 0, the app never opened again and no letter made (injected clock), Then no notification of these classes is delivered after day 35 | P0 (a) | `[NS-13-R18] nothing after day 35 when untouched` (unit with injected clock, plus a device spot check of the pending list) |
| NS-13-R19 | Given two books with notes due on the same local day (for example a birthday for one and a month note for the other), Then at most 1 notification is scheduled for that day | P0 (a) | `[NS-13-R19] two books, one notification a day` |
| NS-13-R20 | Given any scheduled reminder, Then its interruption level is the default (active) and never time-sensitive, and the app has no time-sensitive entitlement, so Focus and Scheduled Summary apply | P1 | `[NS-13-R20] never time-sensitive` (source and config check) |
| NS-13-R21 | Given the app is updated, Then all pending reminders are re-planned at the first launch after the update | P1 | `[NS-13-R21] re-plan after update` |
| NS-13-R22 | Given a new phone or a second phone, Then reminder settings do not sync and the ask follows the two-showing cap on that phone | P1 | `[NS-13-R22] reminder settings stay on the phone` |
| NS-13-R23 | Given every scheduled class together, Then pending local notifications never exceed 60, plan notices are kept first, and the latest budgeted notes are dropped first | P0 (a) | `[NS-13-R23] never over sixty pending` |
| NS-13-R24 | Given every notification body and title, Then it is a `packages/content` key from the vetted reminder copy, filled only with a weekday, a month number or a child name; no generated text | P0 (a) | `[NS-13-R24] reminder words come only from content` (source check) |
| NS-13-R25 | Given the same account on two phones and a letter made on phone A, Then phone B's nudge for that day is removed after B's next pull and re-plan; an offline B may still deliver it | P1 | `[NS-13-R25] the second phone catches up` |
| NS-13-R26 | Given `serverFeaturesEnabled()` off, Then reminders behave exactly as with it on | P1 | `[NS-13-R26] kill switch does not touch reminders` |
| NS-13-R27 | Given the anchor rule, Then the anchor is the later of the newest made letter's local date (own entries and own drafts waiting at Keep or held, never `discarding`) and `reminders.onSince` | P0 (a) | `[NS-13-R27] the anchor counts a made draft` |
| NS-13-R28 | Given a birthday note and a month note on the same day, Then one notification is scheduled, with the birthday copy | P1 | `[NS-13-R28] birthday and month merge` |
| NS-13-R29 | Given a typed day (NS-18) on a day with any other note, Then only the typed day is scheduled that day, and the back-off never removes it | P1 | `[NS-13-R29] a typed day outranks a reminder` |
| NS-13-R30 | Given any chosen or stored time, Then the scheduled time is inside 07:00 to 21:30 local in 15-minute steps, and the picker offers no other time | P0 (a) | `[NS-13-R30] quiet hours hold` |
| NS-13-R31 | Given the ask card, Then it shows at most 2 times ever, and "No reminders" counts as an answer | P0 (a) | `[NS-13-R31] the ask shows at most twice` |
| NS-13-R32 | Given days 1 to 7 after the anchor, Then evening nudges follow the chosen cadence, minus smart quiet (20 h after the newest made letter, 2 h after foreground) | P1 | `[NS-13-R32] the first week follows the cadence` |
| NS-13-R33 | Given names on and a notification whose preview iOS hides, Then the category's `hiddenPreviewsBodyPlaceholder` is a neutral line with no name (PROPOSED; expo-notifications support UNVERIFIED) | P2 | `[NS-13-R33] hidden preview placeholder is neutral` |

### 8. Non-functional budgets
- Latency: re-plan under 50 ms on SE 3 for the Asha 1,000-letter fixture (PROPOSED); tap to Home within 2 s (R9).
- Memory: no measurable change.
- On-device storage: at most 60 pending requests; settings keys only.
- Battery: under the measurable step; no background task.
- Offline: works fully (local).
- Accessibility: AX5 stacking of picker and chips; VoiceOver labels on day chips state selected or not.
- Localisation: interface language only; a name in any script; weekday names from `reminderCopy.weekdays`.
- Privacy (log canary): no name, body text or child id in logs; notification `data` holds only `{ source, kind }` (as built).

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Per phone; B catches up after its pull | `[NS-13-R25]` |
| Second account on the same phone | Starts with none | `[NS-13-R13]` |
| Offline | Unaffected | none (local) |
| Retry after a lost answer | n/a: no server call | none |
| Sign out | Everything removed; settings cleared | `[NS-13-R14]` |
| Account deletion | Everything removed | `[NS-13-R15]` |
| Kill switch: `serverFeaturesEnabled()` off | No effect | `[NS-13-R26]` |
| Card's remote pause | None today (no remote key reaches the planner); a `killSwitches.reminders` key is PROPOSED (can only stop, never start; schema change in `packages/api/src/remote-config.ts`) | to write with the key |
| Plan lapse | Same rules | `[NS-13-R11]` |
| Permission revoked | Nothing scheduled | `[NS-13-R16]` |
| Reminders switched off at scheduling | Nothing scheduled | `[NS-13-R17]` |
| App updated | Re-planned | `[NS-13-R21]` |

### 10. Data and engineering
- Fields: existing settings keys (`prefs.ts:6-15`): `reminders.enabled`, `reminders.paused`, `reminders.cadence`, `reminders.days`, `reminders.weeklyDay`, `reminders.time`, `reminders.monthNotes`, `notifications.lockScreenNames`. New: `reminders.onSince` (YYYY-MM-DD local), written by `turnOnReminders()`.
- Classes: hour, days, cadence, switches L2; `reminders.onSince` L2; scheduled bodies in iOS L3 by default, L4 with names on.
- Migrations: none local or server.
- Sync field group: none (never synced).
- Export: none.
- Modules: `lib/reminders/planner.ts` (back-off, horizon to day 35, cross-class one-per-day, birthday and month merge), `lib/reminders/prefs.ts` (`lastOwnSaveAt` counts own drafts waiting at Keep or held; `reminders.onSince`), `lib/reminders/scheduler.ts` (`turnOnReminders` writes `onSince`), `lib/auth/session-provider.tsx` (sign-out calls `forgetReminders` and clears the settings), `lib/reminders/budget.ts` (NS-32, the shared ceiling and registry).
- Flags: none new. Remote: PROPOSED `killSwitches.reminders`.
- Error codes: none shown beyond the built failure line.
- Rollout and rollback: ships on; rollback is a revert; a re-plan replaces the pending list, so no data to migrate.
- Order: NS-32 lands first (back-off is in the plan; plan notices are a class outside the budget), then this card (ruled 20 Nov).

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Reminder hour, days, cadence, switches | L2 | Phone settings | No | Until changed | Sign-out (R14), account deletion (R15), Erase everything | No | Never logged |
| Name opt-in | L2 | Phone settings | No | Until changed | Same | No | Never logged |
| `reminders.onSince` (new) | L2 | Phone settings | No | Until reminders turned on again | Same | No | Never logged |
| Scheduled notification bodies | L3 default, L4 with names | iOS pending list | No | Until delivered or re-planned | Re-plan, sign-out, Erase everything | No | Never logged |

### 12. Door lines
Notification permission:
- **Shown:** the ask card, one sentence, two equal choices, then the iOS prompt.
- **Records:** the choice, on the phone only; no PRIV-R21 row, because this is a setting.
- **Never:** a second ask from us after a no.
- **Decline:** no reminders; Me explains in one sentence.

Name opt-in:
- **Shown:** the existing setting and its words.
- **Records:** on the phone only; no PRIV-R21 row, because this is a setting.
- **Never:** a name or letter words in a notification unless the parent turned this on; never with App lock on.
- **Decline:** reminders work without names.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Child's name | Shown on a lock screen to anyone nearby | Names off by default; off under App lock; neutral placeholder | `[NS-13-R6a]`, `[NS-13-R33]` |
| A's notifications | Delivered after A signs out and B uses the phone | Sign-out removes and clears | `[NS-13-R13]`, `[NS-13-R14]` |

### 14. Never
- Ruling D3: no prompt, child name or letter text is donated to system intelligence; a notification is not an `NSUserActivity`.
- Ruling D2: n/a because this card has no text field that becomes a letter's words.
- Never "smart reminders", never a streak, never a count, never a line about absence.

### 15. Design inputs
States: the ask card (two equal choices); denied (Open Settings); settings with a live preview showing the neutral body; the failure line; back-off invisible (no screen says reminders slowed). At AX5 on SE 3 the hour picker and the day chips stack. Motion: none. Dark mode: tokens. Smart Invert: n/a. Components reused: the built settings screen and card.

### 16. Content inputs
The neutral and named variant pools (8 evening variants today); a 31-line neutral pool for R2b (PROPOSED content workload; F13-REQ-008 also wants 12 in `before`); the hidden-preview placeholder. Tone: an invitation, never a duty. Banned: miss, behind, forgot, streak, last chance, "never miss a day", "stay on track", "smart". `content` writes; the founder approves any new line.

### 17. Legal, privacy and compliance inputs
Local notifications only; nothing is sent to a server. Guideline 4.5.4 names push notifications (research note 1, read 20 Nov); whether reviewers apply it to local notifications is not settled by the text; CCO re-reads before submission. "Show Previews" is a user setting the app cannot change (research note 3), so any claim must be scoped to what we send. Health or due-date wording: packet Q32. Claim wording: Q43. Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables "Gentle reminders at the hour you choose" and "Reminders don't show your child's name unless you choose" (claims row; packet Q43). Forbids "never miss a day", "stay on track", any streak word, "smart reminders" (implies AI), and any promise about what the lock screen shows beyond what we send.

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Tester questions after two weeks: "Are reminders on? (yes / no)", "Did any reminder feel like too much? (yes / no)", "Did a reminder lead you to make a letter this week? (yes / no)". Reported as x of n. The 03 target of 12% made within 2 h of a reminder needs analytics: not measurable in the 1.0 line.

### 22. Dependencies and gates
NS-32 first. Device rows: time-zone change, a daylight-saving change, a week of silence (injected clock plus spot check), two books (D13). BL-537 (back-off). CCO reading of 4.5.4.

### 23. Open questions
- The 7-day and 4-week numbers. Owner: CPO role with `user-research`, after the first tester notes. Default: 7 and 4.
- Whether month and birthday notes stop with the back-off. Owner: CPO role. Default: they stop after day 35 (R4, R18).
- `killSwitches.reminders`. Owner: `mobile` with `ops`. Default: not added; reminders have no remote pause.

---

## NS-14. Whose book this letter goes to (candidate C-14, rank 19)

Ruled 20 Nov (Karma, council round 2): NS-14 reuses `components/child/child-switcher.tsx` and its selection store; no data change.

### 1. Who and when
A parent of two, holding the baby, about to speak a letter for the older child.

### 2. Why
With two books, a new letter goes to whichever child was last open. Home shows that only in the dateline. A letter said to the wrong child is a small heartbreak the parent finds weeks later, and moving it is not offered. Preventing it costs one existing control. Evidence: [F] the switcher exists on the Book (`child-switcher.tsx`, used at `book.tsx:362`); [A] how often it happens.

### 3. What, and Not in scope
**What.** When the account has two or more visible books, Home shows the existing child switcher ("For {child}" with a chevron, opening the one `Sheet` with a radio list and the child's current month under each name) above the dateline. Home and the Book share the one selection (`useChildren().select`). With one book, nothing changes.
**Not in scope.** Moving a kept letter to another book (a follow-up card, NS-14b, ranked by the CPO after NS-21; default out of this card). Any data change.

### 4. Happy path
1. The parent glances at Home and sees "For Asha".
2. They tap it, choose the other child in the sheet, and the sheet closes.
3. They speak. The letter files into that child's book.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| One book | No switcher; no empty space |
| A nameless book | The existing "Your child" label; never "Child 2" |
| Two nameless books | Each also shows its birth or due date |
| A reminder tap | Opens Home on the last active book |
| Switch during a waiting draft | The draft stays with its child; the switch changes only new letters |
| A third book | The same sheet; the list scrolls |
| Listen open | The switcher is not on screen while Listen is open, so a book cannot change during a take |
| A hidden book | Absent from the switcher |
| A book with reminders off | Present (the parent may still write) |
| A co-parent with the same two books | Each phone has its own selection |
| "Add a book" in the sheet | As built on the Book (routes to `settings/children/new`) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | One book: no switcher |
| Empty | n/a because a switcher needs two books |
| Many (1,000 letters, 300 pictures) | Switch p95 300 ms offline (06-nfr line 49, year-5 fixture) |
| Offline | Works |
| Slow | n/a because local |
| Failed | n/a because local |
| Interrupted (call, Siri, alarm, the baby) | The sheet stays open or closes with no change |
| App killed mid-flow | The selection persists as built |
| App updated mid-flow | Selection persists |
| Low storage (under 1 GB, under 50 MB) | No change |
| Low Power Mode and low battery | No change |
| Two books | This card |
| Two parents | Selection per phone |
| Expecting parent (due date only) | A due-date book shows "Before You" as its month line |
| Multilingual (Devanagari, RTL, CJK) | Names as typed; RTL mirrors the chevron |
| AX5 plus Bold Text on SE 3 | Names wrap and never truncate; switcher, dateline and the three capture controls do not overlap (R5) |
| VoiceOver | Reads "Letters go to {child}'s book" (intent) and the action to change it |
| Voice Control and Switch Control | The visible "For {child}" label is the command; reachable by item scanning |
| Reduce Motion | The system sheet's reduced transition |
| Dark mode and Increase Contrast | Muted caption token at 4.5:1 |
| Plan lapsed | Works |
| Signed out | Works on local books |
| Second account on the same phone | Selection resets when B signs in; B never sees A's names |
| New phone | Last active book, or the first, after arrival |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-14-R1 | Given 2 or more visible books, Then Home shows the switcher above the dateline | P1 | `[NS-14-R1] two books show the switcher` |
| NS-14-R2 | Given 1 book, Then Home renders no switcher and no gap | P1 | `[NS-14-R2] one book shows none` |
| NS-14-R3 | Given a switch, When a letter is then kept, Then it belongs to the chosen book | P0 (c) | `[NS-14-R3] the letter files where the parent chose` |
| NS-14-R4 | Given a waiting draft for child A and a switch to child B, Then the draft still belongs to A | P0 (c) | `[NS-14-R4] a draft keeps its child` |
| NS-14-R5 | Given the largest text size with Bold Text on an SE 3, Then the switcher, the dateline and the three capture controls are reachable without overlapping (device) | P1 | `[NS-14-R5] Home holds at AX5 with a switcher` |
| NS-14-R6 | Given a switch on Home, Then the Book opens on the same child, and the reverse | P1 | `[NS-14-R6] one selection for Home and Book` |
| NS-14-R7 | Given two books with no name, Then each label includes its birth or due date | P1 | `[NS-14-R7] two nameless books are told apart` |
| NS-14-R8 | Given Listen is open, Then no switcher is on screen | P0 (c) | `[NS-14-R8] no switch during a take` |
| NS-14-R9 | Given a hidden book, Then it is absent from the switcher | P1 | `[NS-14-R9] a hidden book is not offered` |
| NS-14-R10 | Given a tap in the switcher, Then the other book is interactive within 300 ms p95 offline on SE 3 (06-nfr) | P1 | `[NS-14-R10] switching is quick` |
| NS-14-R11 | Given A's selection and B signs in on the same phone, Then the selection resets and no name of A's shows | P0 (b) | `[NS-14-R11] selection resets for a second account` |

### 8. Non-functional budgets
- Latency: p95 300 ms offline (R10).
- Memory, storage, battery: no change.
- Offline: works.
- Accessibility: AX5 wrap; 44 pt; VoiceOver label.
- Localisation: names in any script; RTL mirrors.
- Privacy (log canary): `child_switched` carries only `child_ordinal` and `surface` (as built); analytics is off in the 1.0 line.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Selection per phone | none |
| Second account on the same phone | Resets | `[NS-14-R11]` |
| Offline | Works | `[NS-14-R10]` |
| Retry after a lost answer | n/a: local | none |
| Sign out | Selection kept for the local book (D1) | none |
| Account deletion | Cleared with the books | existing |
| Kill switch: `serverFeaturesEnabled()` off | No effect | none |
| Card's remote pause | None | none |
| Plan lapse | No effect | none |

### 10. Data and engineering
- Fields: the existing selection store behind `useChildren()` (`components/child/use-children`), unchanged.
- Migrations: none. Sync: none. Export: none.
- Modules: Home (`app/(tabs)/index.tsx`) renders `ChildSwitcher` when more than one visible book; `child-switcher.tsx` gains `surface: 'home'` for its event.
- Flags: none. Remote pause: none.
- Rollout and rollback: ships on; revert.
- Size S.

### 11. Data inventory
No new data. The active book id is existing data: L3, phone only, not synced.

### 12. Door lines
Records: on the phone only; no PRIV-R21 row, because this is a setting.

### 13. Threats
n/a because no trust boundary is crossed.

### 14. Never
- Ruling D3 applies (no child name donated).
- Ruling D2: n/a because no text field.

### 15. Design inputs
Reuse the Book's switcher exactly. It sits above the dateline, never between the prompt and the capture controls; capture controls stay in the bottom third. AX5 on SE 3: names wrap. Smart Invert: n/a.

### 16. Content inputs
One VoiceOver label. `{child}` only; never gendered; never "Child 1/2". `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
None new. A child's name is already on this screen.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables nothing public. Forbids nothing new.

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Testers with two books: "Did a letter land in the wrong book this month? (yes / no)". Target 0. x of n.

### 22. Dependencies and gates
None. Device row R5 (D13).

### 23. Open questions
- NS-14b (move a kept letter). Owner: CPO role. Default: a separate card after NS-21.

---

## NS-15. A letter for another day (candidate C-07, rank 22)

Ruled 20 Nov (Karma, council round 2): the about-day is `occurred_on` with `occurred_precision`, already stored, synced (own field group) and exported; the said-on day is `captured_at`. This card adds only the Review dateline control (existing `DateSheet`), both days shown when they differ, author-only control, and the built limit `BACKDATE_YEARS = 3`. Size S. The earlier backlog row for this is superseded.

### 1. Who and when
P1 on a Sunday, remembering what happened on Thursday. And a parent who installs when the baby is four months old and wants to tell the birth story where it belongs.

### 2. Why
The book is filed by {child}'s age. A letter about the first week, told in month four, sits in the wrong chapter unless the parent moves it. The letter page already offers Change date to the author (`app/letter/[id].tsx:458-471`, `own` only; `DateSheet` at line 503). Review does not: it sets the about-day to the draft's day (`app/review.tsx:599, 752`). The letter page does not show the said-on day when it differs. Parents arriving late are the common case [A].

### 3. What, and Not in scope
**What.** On Review, the dateline opens the existing `DateSheet` (a day, or a month of age for a born child) for the author. On the letter page, when the about-day differs from the said-on day, both are shown. Only the author sees the control.
**The rule that protects the constitution.** The app never reads a date out of the words, or from a picture without the parent's pick. "Last Thursday" in a letter changes nothing.
**Not in scope.** A new field, a sync change or an export change (all exist). Importing old voice memos.

### 4. Happy path
1. Speak the letter.
2. On Review, tap the dateline; `DateSheet` opens on the draft's day.
3. Pick an earlier day (or a month of age), Save, then Keep.
4. The Book shows it in that month, and the letter page says when it was said (intent: "About 3 March. Said on 9 June.").

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A day before birth | Allowed; it files into Before You |
| A day in the future | Not offered (`resolvePick` refuses; a sealed letter is NS-06) |
| Earlier than 3 years before the birthday or due date | The picker does not go further back (`BACKDATE_YEARS = 3`, `date-change.logic.ts:20, 39-42`) |
| A month of age instead of a day | Stored with precision `month`; the dateline reads "Sometime in Month 3" (as built) |
| The parent changes the day again later | Allowed on the letter page; the said-on day never changes |
| The other parent's letter | Not a control |
| Birth date changed later (a preterm birth recorded after letters exist) | Letters re-file by their about-day automatically; the said-on day never changes; age lines recompute |
| Travel | About-day is a date with no time and no zone; it never shifts |
| Due-date-only child | About-days before the due date file into Before You |
| A held draft at the gate (plan lapsed) | The day can be set on Review before Keep |
| "A letter made today" for reminders | Uses the said-on day (NS-13; `prefs.ts:126`) |
| Age line, chapter, Read together order, Find order, one past letter | Use the about-day |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Review dateline shows today; tappable |
| Empty | n/a because a letter must exist |
| Many (1,000 letters, 300 pictures) | The Book moves the letter without a reload within 300 ms p95 (R12) |
| Offline | Applied locally; synced later |
| Slow | n/a locally |
| Failed | A local write failure shows the generic line (as built, `letter/[id].tsx:358`) |
| Interrupted (call, Siri, alarm, the baby) | The sheet keeps its pick until Save; nothing saved until Save |
| App killed mid-flow | Unsaved pick is lost; the draft keeps its day |
| App updated mid-flow | Same |
| Low storage (under 1 GB, under 50 MB) | No change |
| Low Power Mode and low battery | No change |
| Two books | Bounds per child |
| Two parents | The co-parent's phone re-files after its pull; only the author can change it |
| Expecting parent (due date only) | Bounds from the due date; Before You |
| Multilingual (Devanagari, RTL, CJK) | Dates by `Intl.DateTimeFormat`; no ordinal-day phrasing |
| AX5 plus Bold Text on SE 3 | The two-date line wraps to two lines |
| VoiceOver | The dateline is a button with a hint; after a move VoiceOver announces the new month (R12) |
| Voice Control and Switch Control | The dateline shows a visible affordance and label |
| Reduce Motion | The move is not animated |
| Dark mode and Increase Contrast | Tokens |
| Plan lapsed | Free; changing the day of a kept letter is never gated (as built, `date-change.logic.ts:13`) |
| Signed out | Works locally |
| Second account on the same phone | Never A's letters |
| New phone | Both days arrive (synced) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-15-R1 | Given Review or the author's letter page, Then the dateline is a control that opens `DateSheet` | P1 | `[NS-15-R1] the author can set the day a letter is about` |
| NS-15-R2 | Given a chosen earlier day, Then the Book files the letter in that day's chapter | P1 | `[NS-15-R2] the book files by the about-day` |
| NS-15-R3 | Given a letter whose about-day differs from its said-on day, Then the letter page shows both | P1 | `[NS-15-R3] both days are shown` |
| NS-15-R4 | Given any letter text containing a date or weekday, Then no date field changes without the parent's pick | P0 (a) | `[NS-15-R4] the app never reads a date from the words` |
| NS-15-R5 | Given the picker, Then it offers no future day and nothing earlier than 3 years before the birthday or due date | P1 | `[NS-15-R5] bounds hold` |
| NS-15-R6 | Given the export, Then each letter carries `occurred_on`, `occurred_precision` and `captured_at` (since 1.5.0; regression) | P1 | `[NS-15-R6] export has both dates` |
| NS-15-R7 | Given the reader is not the author, Then the dateline is not a control | P1 | `[NS-15-R7] only the author moves a letter` |
| NS-15-R8 | Given two of the author's phones set different days, Then the later change wins by the field-group rule and both show the same day after sync | P1 | `[NS-15-R8] last change wins across phones` |
| NS-15-R9 | Given a lost answer, Then the change is applied once | P1 | `[NS-15-R9] applied once` |
| NS-15-R10 | Given a change offline, Then it applies at next sync | P1 | `[NS-15-R10] offline change syncs` |
| NS-15-R11 | Given Erase everything or account deletion, Then both days go with the letter | P0 (b) | `[NS-15-R11] removed with the letter` |
| NS-15-R12 | Given a changed about-day, Then the Book moves the letter without a reload within 300 ms p95 (PROPOSED) and VoiceOver announces the new chapter | P1 | `[NS-15-R12] the book moves it at once` |
| NS-15-R13 | Given `serverFeaturesEnabled()` off, Then the change stays local and syncs when on | P1 | `[NS-15-R13] kill switch keeps it local` |
| NS-15-R14 | Given a co-parent's phone, Then it re-files the letter after its next pull | P1 | `[NS-15-R14] the other parent sees it re-filed` |
| NS-15-R15 | Given a lapsed plan, Then the day can be changed | P1 | `[NS-15-R15] free after a lapse` |
| NS-15-R16 | Given A signs out and B signs in, Then B sees none of A's letters or dates | P0 (b) | `[NS-15-R16] second account sees nothing` |
| NS-15-R17 | Given the birth date changes, Then letters re-file by their about-day and no said-on day changes | P1 | `[NS-15-R17] a birth date change re-files` |
| NS-15-R18 | Given a picture's file date, Then it is never used as the about-day without the parent's pick | P0 (a) | `[NS-15-R18] no date from a picture` |

### 8. Non-functional budgets
- Latency: sheet opens under 300 ms; move within 300 ms p95 (R12).
- Memory, storage, battery: no change.
- Offline: works; syncs later.
- Accessibility: visible affordance; VoiceOver hint and announcement.
- Localisation: `Intl.DateTimeFormat`; month lines from chapter titles.
- Privacy (log canary): no date tied to an entry id in logs.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Later change wins | `[NS-15-R8]` |
| Second account on the same phone | Sees nothing | `[NS-15-R16]` |
| Offline | Applied at next sync | `[NS-15-R10]` |
| Retry after a lost answer | Applied once | `[NS-15-R9]` |
| Sign out | Letter and dates stay on the phone (D1) | `[X4-R1]` |
| Account deletion | Removed | `[NS-15-R11]` |
| Kill switch: `serverFeaturesEnabled()` off | Local only | `[NS-15-R13]` |
| Card's remote pause | `killSwitches.sync` stops sync only | `[NS-15-R13]` |
| Plan lapse | Free | `[NS-15-R15]` |
| Co-parent | Re-files after pull | `[NS-15-R14]` |

### 10. Data and engineering
- Fields: existing `entries.occurred_on` (L3, `scribe_core.sql:125`) and `occurred_precision`; field group `occurred_on` (`packages/api/src/server/sync.ts:94, 102`); `captured_at` immutable (`sync.ts:154`); `held_drafts.occurred_on` and `occurred_precision` (`20261016000000_sync_v1_server.sql:307-308`).
- Migrations: none.
- Sync: none new.
- Export: none new (1.5.0 fields).
- Modules: `app/review.tsx` (dateline opens `DateSheet`), `app/letter/[id].tsx` (two-date line), `components/book/date-change.logic.ts` (unchanged), `components/book/date-sheet.tsx` (reused).
- Flags: none. Remote pause: none beyond sync.
- Rollout and rollback: ships on; revert.

### 11. Data inventory
No new data (existing synced fields).

### 12. Door lines
Records: on the phone, synced as the letter's existing fields; no PRIV-R21 row, because this is a setting of the letter, not an agreement.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| About-day on the co-parent's phone | Changed by someone other than the author | Author-only control; server field group writes by author only | `[NS-15-R7]` |

### 14. Never
- Ruling D3: no letter text or date is donated to system intelligence.
- Ruling D2: n/a because the date control is a picker, not text.
- The app never reads a date from words or a picture.

### 15. Design inputs
The dateline on Review becomes tappable with a visible affordance (not a hidden gesture). `DateSheet` as built. The two-date line is the app's small voice, not the letter's serif; at AX5 on SE 3 it wraps to two lines. Before You case. Smart Invert: n/a.

### 16. Content inputs
One two-date line; one VoiceOver hint. No "backdated", no "late". `Intl.DateTimeFormat`, no ordinal days. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
No new data. The NX-39 P1 date chip from a picture must be parent-confirmed (CAIO). Counsel: none new.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables nothing new in public. Forbids any line that suggests the app understands dates in what was said.

### 20. Free or Plus
Free (T2). It never changes how letters are counted.

### 21. Measures with analytics off
From the export manifest by hand: the number of letters whose about-day differs from the said-on day (content-free), or the tester question "Did you set a letter to another day? (yes / no)". x of n.

### 22. Dependencies and gates
None. BL-944 superseded by this rescope.

### 23. Open questions
None.

---

## NS-16. Someone else speaks (candidate C-08, rank 29)

Ruled 20 Nov (Karma, council round 2): the name is `entries.author_signs_as`, 1 to 30 characters, insert-only in sync: settable before the letter's first upload, not after (changing that is a server migration, size L). Ruling D9: "the person speaking agreed" is an instruction to the parent, not an attestation; no record kept.

### 1. Who and when
A grandmother visiting for a week, handed the parent's phone: "say something for {child}".

### 2. Why
"Let family see the baby grow" is job 6, and the cheapest version of family is the person already in the room. Today a letter spoken by Nani on the parent's phone is signed as the parent (Review sets `authorSignsAs: child.signsAs`, `app/review.tsx:611`). Evidence: [F] behaviour; [A] demand.

### 3. What, and Not in scope
**What.** On Review, before Keep, the author can sign this one letter as someone else by a name they type (1 to 30 characters). The letter shows that name. It is still the account holder's letter in every rule: who can edit it, how it is counted, where it is stored. After Keep the name cannot change (insert-only, `sync.ts:157-158`; a later value is ignored by the server without an error).
**Not in scope.** Changing the name after Keep (a server migration, size L, data-steward review). Inviting the speaker. Contacts, photos, a relationship field, voiceprints. Speaker identification of any kind.

### 4. Happy path
1. The parent opens Home, taps Speak and hands over the phone. Nani speaks.
2. On Review the parent taps "From", types "Nani" (or picks it from this phone's names used before), and sees one line: "Ask before you record someone else" (intent; D9).
3. They Keep. The Book shows the letter signed "From Nani", kept by the parent.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| The speaker uses a language not offered | As NS-17: no words invented; the recording waits or the parent types the words |
| The name field is left empty | Signed as the parent, as today |
| A name over 30 characters | Refused before Keep with a calm line; the counter is the database's count (code points), not graphemes |
| A name used before | Offered from this phone's own list; never from contacts |
| The speaker is a child | Not invited: the screen does not ask, and no word invites a child or sibling to speak |
| The allowance | Counts as the account holder's letter; the gate sheet never names the speaker |
| Plan lapsed | The letter waits as a draft like any other; gate copy never implies the visitor's words are at risk |
| The speaker later wants it removed | The account holder deletes it; we hold no relationship with the speaker |
| After Keep | The From line is read-only |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Empty list of names; the field is one line |
| Empty | Empty field: signed as the parent |
| Many (1,000 letters, 300 pictures) | Names list capped at 20 recent names (PROPOSED) |
| Offline | Stored locally; pushes with the first insert |
| Slow | n/a locally |
| Failed | A refused name keeps Review open |
| Interrupted (call, Siri, alarm, the baby) | Typed name kept in the draft until Keep |
| App killed mid-flow | The draft keeps the typed name (PROPOSED: saved with the draft locally) |
| App updated mid-flow | Same |
| Low storage (under 1 GB, under 50 MB) | No change |
| Low Power Mode and low battery | No change |
| Two books | Names list per phone, shared across books |
| Two parents | The co-parent sees "From" the name (`book_entries` selects `author_signs_as`, `data_governance.sql:210`) |
| Expecting parent (due date only) | Same |
| Multilingual (Devanagari, RTL, CJK) | Stored as typed in any script, RTL allowed, within 30 code points |
| AX5 plus Bold Text on SE 3 | The From line wraps; the field is full width |
| VoiceOver | "From, {name}, button" (intent) |
| Voice Control and Switch Control | Visible "From" label |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | Tokens |
| Plan lapsed | As above |
| Signed out | Local; names list cleared at sign-out |
| Second account on the same phone | Never sees A's names list |
| New phone | The name arrives with the letter; the names list does not |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-16-R1 | Given Review before Keep, Then "From" can be set for this letter to a typed name of 1 to 30 characters as counted by the database (code points) | P1 | `[NS-16-R1] From is set on Review` |
| NS-16-R2 | Given a letter signed as another name, Then every surface that shows a signature shows that name, and the export carries it as `author.signs_as` with the account holder as keeper | P1 | `[NS-16-R2] the name shows everywhere` |
| NS-16-R3 | Given such a letter, Then edit, delete, privacy and counting rules are those of the account holder | P0 (a) | `[NS-16-R3] the keeper's rules apply` |
| NS-16-R4 | Given the name field, Then nothing is read from Contacts and no network call is made while typing | P0 (b) | `[NS-16-R4] no contacts, no network` |
| NS-16-R5 | Given any string on this path, Then none invites a child or sibling to speak | P0 (b) | `[NS-16-R5] never invites a child` (content scan) |
| NS-16-R6 | Given a name over 30 characters, Then Keep is refused before any upload with a calm line | P0 (a) | `[NS-16-R6] over thirty refused before upload` |
| NS-16-R7 | Given a typed name in Devanagari, Arabic or CJK, Then it is stored and shown exactly as typed | P1 | `[NS-16-R7] any script as typed` |
| NS-16-R8 | Given Find (NS-02), Then the typed name is not indexed | P1 | `[NS-16-R8] the name is not searched` |
| NS-16-R9 | Given the source, Then no speaker identification, diarization or voice comparison decides or suggests who spoke (CR-040, LEGAL-REQ-019; deny-list of README appendix A) | P0 (a)(b) | `[NS-16-R9] no speaker identification` (source scan) |
| NS-16-R10 | Given the author's second phone, Then the name arrives with the letter | P1 | `[NS-16-R10] name follows the letter` |
| NS-16-R11 | Given a co-parent, Then they see "From" the name | P1 | `[NS-16-R11] co-parent sees From` |
| NS-16-R12 | Given a lost answer and a retry, Then the stored name is the first value, and a different later value is ignored by the server (as built) | P1 | `[NS-16-R12] the name is written once` |
| NS-16-R13 | Given offline, Then the name pushes with the first insert | P1 | `[NS-16-R13] offline name pushes with the letter` |
| NS-16-R14 | Given `serverFeaturesEnabled()` off, Then the name stays local and pushes with the first insert later | P1 | `[NS-16-R14] kill switch keeps it local` |
| NS-16-R15 | Given sign-out or Erase everything, Then the names-used-before list is cleared | P0 (b) | `[NS-16-R15] names list cleared` |
| NS-16-R16 | Given account deletion, Then the name is purged with the letters | P0 (b) | `[NS-16-R16] name purged with the account` |
| NS-16-R17 | Given a kept letter, Then the From line is read-only on the letter page | P1 | `[NS-16-R17] no change after Keep` |
| NS-16-R18 | Given the Review line, Then it is an instruction ("Ask before you record someone else", intent) with no checkbox and no record (D9) | P0 (b) | `[NS-16-R18] an instruction, not an attestation` |

### 8. Non-functional budgets
- Latency: field opens under 300 ms.
- Memory, storage, battery: no change.
- Offline: works.
- Accessibility: AX5 wrap; VoiceOver label.
- Localisation: any script; 30 code points (Devanagari names may reach the cap sooner than their visible length suggests; the counter says so plainly).
- Privacy (log canary): the signature is never logged (PRIV-R10 lists it); J-N18 canary covers the typed name.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Name arrives | `[NS-16-R10]` |
| Second account on the same phone | Never A's names list | `[X4-R1]`, `[NS-16-R15]` |
| Offline | Pushes with the first insert | `[NS-16-R13]` |
| Retry after a lost answer | Written once | `[NS-16-R12]` |
| Sign out | Names list cleared; letters stay (D1) | `[NS-16-R15]` |
| Account deletion | Purged | `[NS-16-R16]` |
| Kill switch: `serverFeaturesEnabled()` off | Local | `[NS-16-R14]` |
| Card's remote pause | The build flag; no remote key (PROPOSED) | none |
| Plan lapse | Waits as a draft like any letter | none |
| Co-parent | Sees From | `[NS-16-R11]` |
| Backup on later | Another adult's voice reaches the server (packet Q42(c)) | at the NS-08 flip |

### 10. Data and engineering
- Fields: existing `entries.author_signs_as` text, `CHECK (char_length(author_signs_as) <= 30)` (`20261002020000_data_governance.sql:95`), in `INSERT_ONLY_COLUMNS` (`sync.ts:157`), selected by `book_entries` (`data_governance.sql:210`) and in the entries content trigger tuple (`20261003000000_security_and_family.sql:445, 449`). `held_drafts` has no signature column (`20261016000000_sync_v1_server.sql:300-330`), so a held draft's push before Keep does not conflict.
- New local: the draft keeps the typed name until Keep (PROPOSED local column or settings key); names-used-before list, settings key `signAs.recent` (PROPOSED), at most 20.
- Classes: the typed name L3 (rule 3, a capped name; `privacy` confirms); names list L3.
- Migrations: none server; a local draft column if chosen.
- Export: `author.signs_as` (exists).
- Modules: `app/review.tsx`, letter page signature line, content scan.
- Flags: `EXPO_PUBLIC_SIGN_AS_OTHER` (PROPOSED), off in production until counsel answers Q45 and Q48 and the PRIV-R20 `child-input` flag system exists (LEGAL-REQ-059 "not yet").
- Error codes: `sign_as_too_long` (PROPOSED; never logged with the value).
- Rollout and rollback: flag off hides the control; stored names stay.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `entries.author_signs_as` (newly used for a non-user) | L3 | Phone and server | Yes (insert-only); visible to the co-parent | Life of the letter | Letter delete; account deletion | `author.signs_as` | Never logged (PRIV-R10) |
| Names used before | L3 | Phone settings | No | Until cleared | Sign-out; Erase everything; account deletion | No | Never logged |

### 12. Door lines
- **Shown:** the From field and one instruction line, "Ask before you record someone else" (intent).
- **Records:** nothing beyond the letter; no PRIV-R21 row (D9).
- **Never:** contacts, a photo of the speaker, a relationship field, voiceprints, any attestation.
- **Decline:** the letter is signed as the parent.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| A non-user's name | Reaches the server and the co-parent | Flag gated on counsel; L3 handling; never logged | `[NS-16-R11]`, J-N18 |
| A child's voice under an adult name | Collected as a child's data | No invitation; counsel Q45, Q46 | `[NS-16-R5]` |
| Attribution | Machine decides who spoke | No speaker identification | `[NS-16-R9]` |

### 14. Never
- Ruling D3: no name or letter text is donated to system intelligence.
- Ruling D2: system writing tools off on the From field.
- No suggestion of a name from anything but this phone's own typed list.

### 15. Design inputs
The signature line on Review becomes a control; typing a name is one field, not a profile; the instruction line under it. AX5 on SE 3: wraps. Read-only on the letter page. Smart Invert: n/a.

### 16. Content inputs
The From label, the instruction line, the too-long line. Banned: "invite", "family can add letters", anything inviting a child. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Another adult's voice and words on the account holder's say-so: packet Q48. A sibling or child speaking: Q45. We cannot verify the speaker is an adult: Q46. Whether a typed name of a non-user is a Contact Info row: Q54 (proposed sub-question (f)). Counsel must confirm before the flag is on in production.

### 18. Label effect
**Label effect.** Possibly yes (packet Q54): a typed name of a non-user may be Contact Info. The CPrivO role holds the flag off in production until answered; any label change ships in the same build as the behaviour.

### 19. Claims
Enables nothing in public until counsel answers. Forbids "invite grandparents", "family can add letters" (NS-25 and later).

### 20. Free or Plus
Counts as the keeper's letter. Free control (T2).

### 21. Measures with analytics off
Tester question: "Did someone else speak a letter on your phone? (yes / no)". x of n.

### 22. Dependencies and gates
Counsel Q45, Q46, Q48, Q54; PRIV-R20 `child-input` flag system; flag off in production until then.

### 23. Open questions
- Index the name in Find. Owner: the founder. Default: not indexed (R8).
- Recent names cap. Owner: CPO role. Default: 20.

---

## NS-17. A second spoken language, when it passes its gate (candidate C-12, rank 30)

Ruled 20 Nov (Karma, council round 2): NS-17 extends `lib/transcription-queue/language-hold.ts`; flags `EXPO_PUBLIC_ENGLISH_ONLY` and `EXPO_PUBLIC_SPOKEN_LANGUAGES` exist. Ruling D10: a transcript withheld as another language is kept on the phone and flagged; never shown, indexed, shared, printed or exported as words.

### 1. Who and when
P4: a parent who speaks Spanish to the baby and English at work, or grandparents who speak Hindi.

### 2. Why
"Keep our languages in the family" is job 8. A letter kept in the language it was spoken is the product's most distinctive promise to these families, and a mangled one is its most damaging failure. Built today: while the English-only switch is on, every language but English is on hold; with a spoken-language list, every language the list leaves out is. A recording noted in a held language waits in the queue (`waiting_for_language`), is never handed to the recogniser, and the person can keep the recording or write the words (`language-hold.ts:1-17`). The open gap: a take the author did not mark, spoken in another language, goes to the English recogniser, which may emit English words or a translation nobody said [UNVERIFIED; measured by R2].

### 3. What, and Not in scope
**What.** A language ships only when a native reviewer and the founder sign its gate. Until then it is absent from every picker. On Review, one tap marks a take "this was in another language": the machine output is withheld (D10), the audio is kept, and the letter waits; the parent may type the words themselves (typed text is the parent's own and never machine-edited), which lets the letter be kept.
**How the app knows the language.** It does not guess. Each author's languages are set at first run and in Me. Every transcription call passes the author's chosen language code, never auto-detect, and the task is transcribe, never translate.
**Not in scope.** Translation or transliteration, ever. Automatic language detection (a separate CAIO proposal with a measured false-accept rate). A low-confidence Review line from `stt_meta` (separate CAIO proposal). Interface languages (their own reviewer and decision).

### 4. Happy path
1. In an English-only build, a parent speaks a letter in Spanish without having chosen Spanish.
2. Review shows English-looking words; the parent taps "This was in another language".
3. The words leave view; the audio stays; the letter waits with the line that its words are waiting (`languageCopy.waitingForLanguage`).
4. The parent may tap "Type the words yourself", type them, and Keep.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A language that fails its gate | Not listed |
| A recording the author chose in a held language | Waits in the queue; never sent to the recogniser (as built) |
| A take marked as another language | Machine output withheld and flagged (D10); audio kept; letter waits |
| Mixed-language sentences | Kept as spoken; where the model cannot write a stretch, the audio is the truth and the page says the words are not written there |
| A language ships later | Waiting recordings in it are transcribed in their own language; nothing lost |
| The parent types the words | Kept as typed; never machine-edited |
| Withheld take already pushed as a held draft | Its machine output is removed from the server copy (see section 10; `data-architect` confirms) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Languages chosen at first run; English only in an English-only build |
| Empty | n/a because a take must exist |
| Many (1,000 letters, 300 pictures) | Waiting takes are listed with other waiting letters; no count |
| Offline | All on the phone |
| Slow | n/a (on-device) |
| Failed | Transcription failure is the existing path |
| Interrupted (call, Siri, alarm, the baby) | The mark is one write |
| App killed mid-flow | The mark persists; queue state persists (as built) |
| App updated mid-flow | Waiting takes stay waiting; a build that hears the language proceeds |
| Low storage (under 1 GB, under 50 MB) | Waiting audio counts in Storage |
| Low Power Mode and low battery | Existing transcription rules |
| Two books | Per take |
| Two parents | Per author's languages |
| Expecting parent (due date only) | Same |
| Multilingual (Devanagari, RTL, CJK) | This card; RTL and Devanagari reviewed by a native-script reviewer before unlock |
| AX5 plus Bold Text on SE 3 | The mark control and the waiting line wrap |
| VoiceOver | The mark control reads its consequence |
| Voice Control and Switch Control | Visible labels |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | Tokens |
| Plan lapsed | A waiting letter waits as any; typing words is free |
| Signed out | Local |
| Second account on the same phone | Never A's waiting takes |
| New phone | Withheld machine output never arrives (phone only); audio does not arrive while backup is off |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-17-R1 | Given a language without a signed gate, Then it is absent from every picker in a store build | P0 (a) | `[NS-17-R1] ungated languages are absent` |
| NS-17-R2 | Given fixture recordings in each unoffered language, Then the English pipeline's output is measured with `npm run gate` and filed with the gate evidence, and no such letter is kept without the parent seeing its words on Review | P0 (a) | `[NS-17-R2] English output on other languages is measured` |
| NS-17-R3 | Given any letter, Then no surface offers or performs translation or transliteration | P0 (a) | `[NS-17-R3] no translation` |
| NS-17-R4 | Given a language that ships, Then the store listing names it and no language that has not shipped | P0 (b) | `[NS-17-R4] the listing names only shipped languages` |
| NS-17-R5 | Given an English-only build and a take, Then Review offers in one tap to mark it as another language, which removes the transcript from view, keeps the audio, and keeps the letter waiting | P0 (a) | `[NS-17-R5] another language is one tap from Review` |
| NS-17-R6 | Given every transcription call, Then it passes the author's chosen language code, never auto-detect, and the task is transcribe, never translate | P0 (a) | `[NS-17-R6] language is chosen, never detected` (source test) |
| NS-17-R7 | Given a withheld take, Then its machine output is never shown, indexed, shared, printed or exported as words (D10) | P0 (a) | `[NS-17-R7] withheld words stay withheld` |
| NS-17-R8 | Given a withheld take, Then its machine output is not synced; if already pushed as a held draft, the server copy holds no words after the next push | P0 (a)(b) | `[NS-17-R8] withheld words never on the server` |
| NS-17-R9 | Given a waiting letter in another language, Then "Type the words yourself" lets the parent type and Keep, and the typed words are never machine-edited | P1 | `[NS-17-R9] the parent can type the words` |
| NS-17-R10 | Given a recording in a held language, Then it is never handed to the recogniser and asks for no download (regression of the built hold) | P0 (a) | `[NS-17-R10] held languages never reach the recogniser` |
| NS-17-R11 | Given a language other than English whose distress patterns have not passed FR-LOC-18 (a), Then no screen, store line or help text implies a letter in that language is noticed for distress, and "If you are struggling" stays available in every build (CL/K ruling K17, `GAP-LOG.md`; FR-LOC-18, CC-LOC-7) | P0 (a) | `[NS-17-R11] no distress claim for an untested language` |
| NS-17-R12 | Given a language that passed its gate on the full tier but not on the compact tier, Then a compact-tier phone does not offer it, and the parent is not shown numbers or blocked (CL/K ruling K17, `GAP-LOG.md`; FR-AIS-43) | P0 (a) | `[NS-17-R12] a compact-tier phone offers only languages that passed on it` |

### 8. Non-functional budgets
- Latency: mark under 300 ms.
- Memory: per language model, per the language gate (`speech`).
- On-device storage: model download per shipped language (pack host).
- Battery: existing transcription budgets.
- Offline: on-device.
- Accessibility: 06-nfr defaults.
- Localisation: native-script reviewer per language; RTL letter rendering gate (06-nfr).
- Privacy (log canary): no transcript, language-tagged text or audio path in logs.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Withheld output never arrives | `[NS-17-R8]` |
| Second account on the same phone | Never A's | `[X4-R1]` |
| Offline | Local | none |
| Retry after a lost answer | The held-draft push without words is idempotent | `[NS-17-R8]` |
| Sign out | Local data stays (D1) | `[X4-R1]` |
| Account deletion | Removed | existing |
| Kill switch: `serverFeaturesEnabled()` off | Local only | none |
| Card's remote pause | `killSwitches.packDownloads` stops model downloads | none |
| Plan lapse | Typing words free | `[NS-17-R9]` |

### 10. Data and engineering
- Fields: existing queue phase `waiting_for_language` (`transcription-queue/machine.ts`), `entries.language` and `held_drafts.language`. New: a local flag on the take, `language_withheld` (PROPOSED), L4 for the withheld output.
- Sync: `raw_transcript` is immutable on `entries` and author-only (`sync.ts:154, 162`); a withheld take is a waiting draft, and `held_drafts` carries `raw_transcript` (`20261016000000_sync_v1_server.sql:313`). The held-draft push for a flagged take omits `raw_transcript` and `final_text`; if a push already went, the next push sets them null on the server. Whether `held_drafts` allows that update: `data-architect` confirms (UNVERIFIED).
- Migrations: local column for the flag; server none if the null update is allowed.
- Export: a withheld take exports as audio with no words (it never exports the machine output as words).
- Modules: `lib/transcription-queue/language-hold.ts`, the queue, Review, the held-draft push.
- Flags: `EXPO_PUBLIC_ENGLISH_ONLY`, `EXPO_PUBLIC_SPOKEN_LANGUAGES` (exist, `capabilities.ts:71, 98`).
- Rollout and rollback: per language by profile env; removing a language from the list puts its takes back on hold with nothing lost.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Withheld machine output and its flag | L4 | Phone only | No | Life of the take | Take delete; Erase everything; account deletion | Never as words | Never logged |

### 12. Door lines
Records: on the phone only; no PRIV-R21 row, because marking a language is a setting of the take.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| The constitution | Words nobody said kept as "the words as heard" | Chosen language only; withhold; measure | `[NS-17-R2]`, `[NS-17-R6]`, `[NS-17-R7]` |
| Withheld output | Reaches the server | Omitted from push | `[NS-17-R8]` |

### 14. Never
- Ruling D3: no letter text is donated to system intelligence.
- Ruling D2: system writing tools off on the typed-words field (it becomes a letter's words).
- No translation, transliteration or language detection decides what words show.

### 15. Design inputs
The "words are waiting" state on a letter page and in the Book; the mark control on Review; "Type the words yourself". RTL and Devanagari reviewed by a native-script reviewer before unlock. AX5 on SE 3: wrap. Smart Invert: n/a.

### 16. Content inputs
The mark control and its confirmation; reuse `languageCopy.waitingForLanguage`. Banned: "translate", "detect". Interface words in a second language are a separate decision with their own reviewer. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Training-data terms behind a language model: packet Q9; Q12. Listing claims must match what ships (guideline 2.3, UNVERIFIED this session). Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
The store listing names only shipped languages (R4). The site's seven-languages line is already flagged by the CMO. Forbids "understands any language", "translates".

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Per language: the native reviewer's gate corpus result, plus P4 testers by hand: "Did the words match what you said? (yes / mostly / no)". x of n.

### 22. Dependencies and gates
Per language: native reviewer, founder sign-off, gate corpus. Cost: about $1,000 to $1,500 per language in reviewer checks [E] (03 section 4.4), founder spend, plus model hosting on the pack host.

### 23. Open questions
- Whether `held_drafts` permits nulling words on a flagged take. Owner: `data-architect`. Default: if not, a flagged take is never pushed as a held draft until it has typed words.

---

## NS-18. Typed days in reminders (candidate C-15, rank 33)

### 1. Who and when
A parent who knows a day worth telling is coming: the first day of nursery, a grandparent's visit.

### 2. Why
Job 5, "Tell me what to write about, without nagging". The parent's own note to their future self is the gentlest prompt there is. Evidence: [A].

### 3. What, and Not in scope
**What.** In reminder settings the parent types a future day and 1 to 80 characters of their own words (PROPOSED). On that day one notification is delivered: by default the fixed line (intent: "A day you wanted to remember"); the typed words show in the app after the tap. A switch, "Show my words in the notification", off by default, puts the words in the body unchanged. The app adds nothing to the words.
**Not in scope.** Recurring days. Days the app suggests. Syncing typed days.

### 4. Happy path
1. Me, Reminders, Add a day: pick a date, type "Nursery starts".
2. On that day, at the reminder time, one notification with the fixed line.
3. Tap: Home shows "Nursery starts" above the prompt; one more tap starts speaking.
4. The day is deleted the day after delivery.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A day in the past | Not accepted |
| That day already has a reminder or month note | Only the typed day is delivered (NS-32 priority) |
| Reminders backed off or stopped | The typed day is still delivered |
| Reminders turned off | Typed days still delivered if notifications are allowed (PROPOSED; they are the parent's own ask) |
| Deleting the day | Cancels it |
| Words about a due date ("baby due") | Allowed: the parent's own words; P3 rules ban our wording, not theirs |
| Words with a name | Allowed; hidden by default from the lock screen |
| More typed days than free pending slots | Nearest first; others scheduled at a later re-plan (PROPOSED) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | "Add a day" in Reminders |
| Empty | No typed days: nothing |
| Many (1,000 letters, 300 pictures) | n/a because typed days do not depend on letters; at most the free slots under 60 pending |
| Offline | Local |
| Slow | n/a |
| Failed | iOS refuses: the built failure line |
| Interrupted (call, Siri, alarm, the baby) | Unsaved words kept in the field until Save |
| App killed mid-flow | Unsaved words lost; saved days scheduled |
| App updated mid-flow | Re-planned at first launch |
| Low storage (under 1 GB, under 50 MB) | No change |
| Low Power Mode and low battery | No change |
| Two books | Typed days are per phone, not per book (PROPOSED) |
| Two parents | Per phone; never shared |
| Expecting parent (due date only) | Allowed; our wording never refers to a due date |
| Multilingual (Devanagari, RTL, CJK) | Words in any script, shown as typed |
| AX5 plus Bold Text on SE 3 | Date and field stack |
| VoiceOver | Each day reads date and words |
| Voice Control and Switch Control | Visible labels |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | Tokens |
| Plan lapsed | Free |
| Signed out | Removed at sign-out |
| Second account on the same phone | Never A's |
| New phone | Not synced |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-18-R1 | Given a typed day and words, Then exactly 1 notification is delivered that day, and the app shows those words unchanged after the tap | P1 | `[NS-18-R1] one notification on the typed day` |
| NS-18-R2 | Given that day also has an ordinary reminder or a month note, Then only the typed one is delivered | P1 | `[NS-18-R2] the typed day replaces a reminder` |
| NS-18-R3 | Given the default, Then the body is the fixed line and never the typed words; Given the parent turned showing on, Then the body is their words unchanged | P0 (a) | `[NS-18-R3] words hidden by default` |
| NS-18-R4 | Given reminders have backed off or stopped (NS-13), Then a typed day is still delivered | P1 | `[NS-18-R4] back-off never drops a typed day` |
| NS-18-R5 | Given the field, Then it accepts 1 to 80 characters (PROPOSED), any script | P1 | `[NS-18-R5] typed words length` |
| NS-18-R6 | Given sign-out, Erase everything or account deletion, Then typed days and their notifications are removed | P0 (a)(b) | `[NS-18-R6] typed days removed` |
| NS-18-R7 | Given a delivered typed day, Then its words are deleted the day after delivery | P1 | `[NS-18-R7] typed words do not linger` |
| NS-18-R8 | Given the canary text in a typed day, Then it never appears in logs, crash reports or URLs (J-N18) | P0 (b) | `[NS-18-R8] typed words never logged` |

### 8. Non-functional budgets
- Latency: save under 300 ms.
- Memory, battery: no change.
- On-device storage: settings keys only.
- Offline: local.
- Accessibility: AX5 stacking.
- Localisation: any script.
- Privacy (log canary): J-N18.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Not synced | none |
| Second account on the same phone | Removed at sign-out | `[NS-18-R6]` |
| Offline | Local | none |
| Retry after a lost answer | n/a | none |
| Sign out | Removed | `[NS-18-R6]` |
| Account deletion | Removed | `[NS-18-R6]` |
| Kill switch: `serverFeaturesEnabled()` off | No effect | none |
| Card's remote pause | None | none |
| Plan lapse | Free | none |

### 10. Data and engineering
- Fields: settings keys `typedDay.<yyyy-mm-dd>` (r3), one per date, value the words and the show switch is `typedDay.showWords` (PROPOSED).
- Classes: words L4 (free text, rule 3).
- Migrations: none. Sync: none.
- Export: not exported (transient phone setting deleted after delivery). See open question.
- Modules: reminder settings, `lib/reminders/budget.ts` (NS-32 class `typedDay`), the planner.
- Flags: `EXPO_PUBLIC_TYPED_DAYS` (PROPOSED).
- Rollout and rollback: flag off hides the row and cancels typed-day notifications.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `typedDay.<date>` words | L4 | Phone settings; iOS pending list | No | Deleted the day after delivery | Delete; sign-out; Erase everything; account deletion | No (default) | Never logged (J-N18) |
| Show-words switch | L2 | Phone settings | No | Until changed | Same | No | Never logged |

### 12. Door lines
"Show my words in the notification":
- **Shown:** the setting and its words.
- **Records:** on the phone only; no PRIV-R21 row, because this is a setting.
- **Never:** the words in a notification by default.
- **Decline:** the fixed line is used.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Typed words (may hold a name) | Shown on a lock screen | Fixed line by default | `[NS-18-R3]` |

### 14. Never
- Ruling D3: typed words are not donated to system intelligence.
- Ruling D2: system writing tools off on the typed-words field.
- The app never adds to, completes or suggests the words.

### 15. Design inputs
A list of days in Reminders, Add a day, the switch. AX5 on SE 3: stacked. Smart Invert: n/a.

### 16. Content inputs
The fixed line ("A day you wanted to remember", intent), the switch label. Banned: countdowns, "days until". `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Words stay on the phone. Export scope for a phone-only transient setting: CPrivO with counsel (packet Q51). Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
None public.

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Tester question: "Did you add a day to remember? (yes / no)". x of n.

### 22. Dependencies and gates
NS-32 (registry and budget); NS-13 (planner).

### 23. Open questions
- Export typed days. Owner: CPrivO role with counsel. Default: not exported (r1 recommended included; r2 recommended not; the default collects and moves less, and the words are deleted after delivery).

---

## NS-19. Add more to this letter (candidate C-11, rank 35)

### 1. Who and when
A parent interrupted mid-letter by a crying baby, back an hour later.

### 2. Why
What was said is never changed (the constitution; the raw transcript is immutable). "Add more" cannot append to it. The honest version is a second take that belongs to the same letter, kept as its own recording with its own words, shown one after the other. Evidence: [A].

### 3. What, and Not in scope
**What (when taken up).** From Home only: a waiting draft can be continued with a second take. A kept letter is not reopened for speech; the parent makes a new letter. This card records that decision so design does not draw an "add audio" button on the letter page.
**Not in scope.** Recording into a kept letter. Joining two takes' text. Any machine edit spanning two takes.

### 4. Happy path (when taken up)
1. Home shows the waiting draft with Continue.
2. The parent speaks a second take.
3. Review shows both takes in order, each with its own Play; Keep keeps one letter.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| A kept letter | No control records into it |
| Second take fails | The first take is untouched |
| Let go of the second take | Only that take goes (NS-09 path) |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Empty | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Many (1,000 letters, 300 pictures) | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Offline | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Slow | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Failed | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Interrupted (call, Siri, alarm, the baby) | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| App killed mid-flow | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| App updated mid-flow | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Low storage (under 1 GB, under 50 MB) | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Low Power Mode and low battery | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Two books | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Two parents | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Expecting parent (due date only) | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Multilingual (Devanagari, RTL, CJK) | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| AX5 plus Bold Text on SE 3 | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| VoiceOver | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Voice Control and Switch Control | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Reduce Motion | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Dark mode and Increase Contrast | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Plan lapsed | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Signed out | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| Second account on the same phone | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |
| New phone | n/a because the card is not taken up; each row is written when it is (owner CPO role), and each take inherits the existing capture behaviour for that scenario |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-19-R1 | Given a kept letter, Then no control anywhere records new audio into it | P0 (a) | `[NS-19-R1] a kept letter is never reopened for speech` |
| NS-19-R2 | Given a waiting draft on Home, Then Continue adds a second take whose audio and raw words are stored separately from the first | P2 | `[NS-19-R2] a second take is its own` |
| NS-19-R3 | Given a continued draft, Then the Book shows the takes in order, each with its own Play, and the allowance counts the letter once | P2 | `[NS-19-R3] takes in order, counted once` |
| NS-19-R4 | Given two takes, Then each keeps its own immutable raw transcript and its own `verifyEdits` pass; no machine edit spans two takes | P0 (a) | `[NS-19-R4] no edit spans two takes` |

### 8. Non-functional budgets
n/a because not taken up; inherits capture budgets when it is.

### 9. State space (RR-5)
n/a until taken up; new tables then need inventory, sync and export rows.

### 10. Data and engineering
When taken up: new local and server structures for takes (`data-architect`), migrations with grants, a sync field group, an export minor. Not specified now.

### 11. Data inventory
n/a until taken up.

### 12. Door lines
n/a because no agreement.

### 13. Threats
n/a until taken up.

### 14. Never
- Ruling D3 applies. Ruling D2: off on any typed field of a take.
- Never append to or rewrite a raw transcript.

### 15. Design inputs
No "add audio" button on the letter page. When taken up: Continue on Home only.

### 16. Content inputs
n/a until taken up.

### 17. Legal, privacy and compliance inputs
None now.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Forbids "add to any letter", "edit what you said".

### 20. Free or Plus
Free when built (T2); counted once.

### 21. Measures with analytics off
n/a until taken up.

### 22. Dependencies and gates
NS-35; constitution review.

### 23. Open questions
None now.

---

## NS-20. A letter to two books (candidate C-13, rank 39)

### 1. Who and when
A parent of twins, or one telling a story about both children.

### 2. Why
A letter belongs to one book in the data, in sync, in counting and in export. Changing that touches all four. The need is real for a small group [A]. Until it is built, the honest path is to keep the letter in one book and share its words into the other by hand.

### 3. What, and Not in scope
**What must be decided first.** One letter in two books (edits follow) or two copies (edits do not), and how it is counted. Recommendation (CPO, r1): two copies made at Keep, each counted. Default: not built.
**Not in scope now.** Any build.

### 4. Happy path
n/a because not built.

### 5. Unhappy paths and edge cases
n/a because not built. A letter in two books may reach two sets of readers; visibility rows are owed when decided.

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Empty | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Many (1,000 letters, 300 pictures) | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Offline | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Slow | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Failed | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Interrupted (call, Siri, alarm, the baby) | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| App killed mid-flow | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| App updated mid-flow | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Low storage (under 1 GB, under 50 MB) | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Low Power Mode and low battery | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Two books | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Two parents | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Expecting parent (due date only) | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Multilingual (Devanagari, RTL, CJK) | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| AX5 plus Bold Text on SE 3 | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| VoiceOver | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Voice Control and Switch Control | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Reduce Motion | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Dark mode and Increase Contrast | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Plan lapsed | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Signed out | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| Second account on the same phone | n/a because not built; written when decided (owner CPO role with `data-architect`) |
| New phone | n/a because not built; written when decided (owner CPO role with `data-architect`) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-20-R1 | Given any build before a decision, Then no control files one letter into two books | P1 | `[NS-20-R1] one book per letter until decided` |

### 8. Non-functional budgets
n/a because not built.

### 9. State space (RR-5)
n/a until decided.

### 10. Data and engineering
n/a until decided.

### 11. Data inventory
n/a until decided; inventory and visibility rows owed then.

### 12. Door lines
n/a.

### 13. Threats
n/a until decided.

### 14. Never
Ruling D3 applies. Ruling D2: n/a.

### 15. Design inputs
None now.

### 16. Content inputs
None now.

### 17. Legal, privacy and compliance inputs
None now.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Forbids "one letter for all your children".

### 20. Free or Plus
Free when built (T2).

### 21. Measures with analytics off
n/a.

### 22. Dependencies and gates
A product decision.

### 23. Open questions
- One letter or two copies. Owner: the founder with the CPO role and `data-architect`. Default: not built; if built, two copies at Keep, each counted.

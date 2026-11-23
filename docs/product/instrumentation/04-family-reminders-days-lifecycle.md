# Instrumentation requirements 4: family, reminders, days and lifecycle messaging

Status: PROPOSED, 20 Nov 2026. Owner: `product` (PM4). Partner: `data-architect` (`docs/analytics/instrumentation/data-architect.md`, branch `docs/instr-data-architect-20nov`; not on develop or on a branch when I wrote this, so nothing here depends on it). Standard followed: `docs/analytics/instrumentation/00-event-standard.md` is not published yet; I used the baseline in the founder's event-standard brief (name `<area>.<object>.<action>`, closed areas, fixed basics, registry fields, `schema_version`). If the analytics PR differs, its names win and this file is edited to match.

Docs only. This file changes no card, no erratum, no code. Everything is PROPOSED. Analytics is OFF through 1.0.x (D-095, D-124 item 3, FR-DAT-01): every event below is built dark, compiled and tested, and inert until the founder turns analytics on with consent in v1.1 or later.

Read, in this session: the NS-13, NS-25 and NS-32 cards (`09-capture.md`, `10-reading-and-family.md`, `11-foundations.md`), NS-46 to NS-50 (`21-days-cultural-photos-home.md`, requirement rows), `18-errata-after-lock.md` (E75 to E82), `functions/data-and-measurement.md` (FR-DAT-01 to 28), `docs/analytics/TRACKING_PLAN.md` (sections 3, 6.2, 6.4), `packages/analytics/src/observe.ts` (header), `IA-FINAL-20nov.md` (branch `docs/design-ia-final-20nov`), `docs/design/e2e/INDEX.md` (D-S rows), `docs/emails/BRIEF.md`, `CATALOG.md` and the lifecycle playbook files 01 and 02 (branch `docs/lifecycle-playbook-content-20nov`; files 03 to 05 are not on it yet). Not read: `D-family-sharing-reminders/WORDS.md` control lists, `NS-26`/`NS-28` cards, `INSIGHTS_LOOP.md` beyond its header. Control ids below are therefore PROPOSED and `design-systems` must confirm them against the WORDS files.

## 0. What the locked pack already forbids (these bind every row)

| Rule | Source | Effect on events |
|---|---|---|
| Never an event for typed-day or library-day delivery or open, month notes, birthday notes, a seal's opening, the birthday-week Save a copy slip | FR-DAT-27; TRACKING_PLAN 6.4; NS-46-R34 (`observe.test.ts` names `libraryDay`, `typedDay`, `birthday`, `monthAge` as never reported) | Only the `evening` reminder class is ever observed. The Days family has no events at all by default (section 3) |
| No tradition, country, day id, ticked day or count of parents who ticked any, in any event, bucket or aggregate | NS-47-R9, NS-47-R34 (stems `tradition`, `religio`, `faith`, `countr`, `cultur`, `holiday`, `library_day`, `typed_day`, `day_id`, `ticked`) | The validator stem list applies to names and values |
| No remote push in 1.0; no APNs key or token table | E79, LEGAL-REQ-054 | Every notification is local. "Delivered" and "opened" are observed on the phone, never from a server |
| No marketing email to an app address; transactional only | E75, LEGAL-REQ-053, FR-MKT-44 | No marketing email event. Email class is a closed enum with one value |
| No tracking pixels, no click tracking; "we do not know if it was opened" | `docs/emails/BRIEF.md:18`; `CATALOG.md` principle 2 and the "never" table | Email opened and email clicked are NOT measurable and NOT proposed. Send counts only |
| No age, month number or "A year of letters." on a lock screen with names off or App lock on | E82; NS-13-R24; NS-32-R12 | A test, not an event (section 2.4). No event carries an age |
| At most 1 budgeted notification a local day, 60 pending, none outside 07:00 to 21:30, none after day 35, interruption level active | NS-32; NS-13-R3, R4, R18, R20, R23, R30 | Zero-target guardrail `notifications.plan.violated` |
| No counts of gaps, no streaks, no "days since" shown to a parent | CLAUDE.md; FR-DAT-03 | Nothing measured here is ever shown in the app |
| Second adult sees no child name or letter before agreeing; the inviter is not told why a parent declines; "silence beats a notice inside a family" | NS-25-R2, R6, section 12 Accept line; playbook 02 section 4B (CATALOG E-5) | No event when a person declines, no notice to the inviter, no reason asked |
| Each adult's data is theirs: P2 deleting leaves P1's book whole | NS-25-R14, R15 | No event or aggregate can name a book, a parent or a pair |

## 1. Screens, controls and impressions

Naming: `screen.<screen_id>.viewed`, `ui.<element_id>.tapped`, `ui.<element_id>.impressed`. PROPOSED id format: the IA-FINAL id lowercased with the dash dropped (`D-S06` becomes `d_s06`), controls as `<screen_id>_<slug>` from a fixed list. States (`.default`, `.denied`) are not part of the id; where a state matters it is a closed `state` property. Same `element_id` on `.impressed` and `.tapped` for every pair.

### 1.1 Reminders

| Screen (IA id) | Screen event | Controls (tap, closed list) | Impression (element) | What is not measured |
|---|---|---|---|---|
| Reminder ask sheet over the Book (D-S04; NS-13-R31, cap 2) | `screen.d_s04.viewed` | `d_s04_yes_evenings`, `d_s04_pick_time`, `d_s04_no_reminders` | `ui.d_s04_ask.impressed` (prop `showing`: first, second) | Which hour is picked; any dismiss by swipe is "closed" with no reason |
| iOS permission alert (D-S05) | none (a system dialog) | none | none | The OS answer is observed as `notifications.permission.answered`, not as a tap |
| Me, Reminders (D-S06) | `screen.d_s06.viewed` | `d_s06_switch`, `d_s06_cadence`, `d_s06_time`, `d_s06_names`, `d_s06_open_settings`, `d_s06_preview` | `ui.d_s06_preview.impressed` (the "How it will look" element) | Names value; any Days row (section 3) |
| Time picker (D-S07) | `screen.d_s07.viewed` | `d_s07_done` | none | The time itself, only `hour_bucket` on the change event |

### 1.2 Family and the other parent (NS-25; dark in store builds, NS-25-R1)

| Screen (IA id) | Screen event | Controls | Impression | What is not measured |
|---|---|---|---|---|
| Me, the book's page "Write this book together" (D-S12) | `screen.d_s12.viewed` | `d_s12_invite_row` | `ui.d_s12_invite_row.impressed` (only when the row exists) | Which book, how many books, one-parent or two-parent state |
| Invite sheet (D-S13) | `screen.d_s13.viewed` | `d_s13_send`, `d_s13_copy_link`, `d_s13_cancel` | none: the "will read every letter" line (NS-25-R16) is proved by a test, not a metric | The invitee's address or name; the share destination (FR-DAT-27) |
| Invite link page (D-S14, web) | none: the web page has no analytics, no script, no cookie | none | none | Peek calls are counted on the server (section 5) |
| Join ask and agreement (D-S15, D-S16) | `screen.d_s15.viewed`, `screen.d_s16.viewed` | `d_s16_accept`, `d_s16_not_now` | `ui.d_s16_agreement.impressed` | Why someone says not now; the inviter's name; the role label |
| Arrival (D-S17) | `screen.d_s17.viewed` | none | none | How long P1 waited |
| Family page (D-S18) | `screen.d_s18.viewed` | `d_s18_undo` | none | `.twoParents` versus `.oneParent` state |
| Undo confirm (D-S19) | `screen.d_s19.viewed` | `d_s19_confirm`, `d_s19_cancel` | none | Any reason. See decision CPO-3 |

### 1.3 Home slips and in-app messages (NS-50, E36 order)

Home holds one slip at a time in a registered order (NS-50-R1, R5, R11; IA-FINAL 4.1). Only slips whose timing is not set by a birthday, a seal or a parent's chosen day may be observed.

| Slip (rank) | Impression | Tap | Allowed? |
|---|---|---|---|
| 1 waiting set | `ui.a_s01_slip_waiting.impressed` | `ui.a_s01_slip_waiting.tapped` (prop `action`: pick_up, open, keep) | Yes. Meaning and funnel belong to PM1 (capture); this file only fixes the slot rules |
| 2 seal-opened | none | none | No (FR-DAT-27: nothing at a seal's opening time) |
| 2b a day the parent chose, today | none | none | No (NS-46-R34, NS-47-R9) |
| 3 Save a copy, birthday week | none | none | No (FR-DAT-27) |
| 3b the Days ask | none by default | none by default | See CPO-1 |
| 4 one past letter | `ui.a_s01_slip_past_letter.impressed` | `ui.a_s01_slip_past_letter.tapped`, `ui.a_s01_slip_past_not_today.tapped` | Yes, if PM2 agrees (NS-23); the date trigger is the letter's date, not a birthday |
| Day-zero card, Plus line, Keep gate | PM1 and PM5 | | Not here |

The slot guardrail is a test plus one zero-target event: `notifications.plan.violated` is not for slips; a second slip on one open is caught by `[NS-50-R1]` and `[FRAME-SLIP]` in CI, and by tester reports (FR-DAT-09). No slip event carries a rank number, a count or a "waiting" total.

### 1.4 Email and the lifecycle calendar

| Surface | Sent | Opened | Clicked | Source |
|---|---|---|---|---|
| Transactional email (sign-in code, welcome, co-parent invite, welcome-coparent, coparent-left, deletion receipts) | Counted on the server by template and outcome, no address (`system.email.sent`) | NOT measurable (tracking off) | NOT measurable (no tracked links) | E75; `emails/BRIEF.md:18`; playbook 02 sections 1 to 4 |
| Commercial email, waitlist, re-engagement, digest, any marketing | Not sent at 1.0, so no event; the enum has no commercial value | n/a | n/a | E75, Q34 (counsel) |
| Where a push would have been (E79) | Carried by email or an in-app line (playbook 02 section 8) | n/a | n/a | E79 |

## 2. Reminders: delivered, opened, budget (NS-13, NS-32, NS-48)

### 2.1 Journey and the question at each step

| Step | Question the team needs answered | Measure |
|---|---|---|
| 1. Ask card seen after the first kept letter | Do parents see it, and how often is it the second showing? | `ui.d_s04_ask.impressed` |
| 2. Answer | Yes, pick a time, or No reminders? Impression to yes rate. | `ui.d_s04_yes_evenings.tapped`, `ui.d_s04_no_reminders.tapped` (NS-13-R31 says No counts as an answer) |
| 3. iOS permission | Did the OS dialog end in yes? | `notifications.permission.answered` |
| 4. Schedule | What cadence and hour band do parents choose; is anyone turning it off later? | `notifications.schedule.changed` |
| 5. A nudge is due | Did it reach the lock screen? | `notifications.reminder.delivered` |
| 6. Tap | Did the parent open the app from it, and did Home open in 2 s (NS-13-R9)? | `notifications.reminder.opened`, `perf.reminder_open_home.measured` |
| 7. Back-off | Do first-week nudges, week 2 to 5 nudges and the stop at day 35 behave as planned? | `phase` on delivered and opened; `notifications.reminder.suppressed` reason `backoff_ended` |
| 8. A letter follows | Was a letter made soon after the tap? | PM1 event `capture.letter.saved` with its `from_reminder_2h` bool (name PROPOSED by PM1; cited by name only) |
| 9. Switch off or revoke | Do parents turn reminders off, or revoke permission? | `notifications.schedule.changed` (`turned_off`), `notifications.permission.revoked` |

### 2.2 What delivered and opened can honestly mean

- Local notifications fire without the app running. The phone cannot report a delivery at the time; the app can only see, at the next foreground, which of its notifications are still in Notification Center. A parent who cleared it is not seen. So `delivered` is a lower bound and `opened / delivered` is biased high. Whether `expo-notifications` exposes the presented list on the installed version is UNVERIFIED (I read no installed source). The expected pending plan is known on the phone, so a better rate is opened per planned nudge, which needs the plan to emit the planned count (proposed row IN-PM4-03).
- `opened` is the tap response, observed (TRACKING_PLAN `notification_opened`). It carries only `{source, kind}` already (NS-13 section 3 built list).
- Never reported: month, birthday, typed-day and library-day notes (section 0). Plan notices (trial and renewal dates) are `plus` area and belong to PM5.

### 2.3 Registry rows (schema_version 1, status proposed for every row)

Columns: trigger; properties (type: allowed values); class label (the data-steward owns the final label; proposed L2, content-free); owner role; consent gate; requirement.

| Event | Trigger | Properties | Class | Owner | Gate | Requirement |
|---|---|---|---|---|---|---|
| `notifications.permission.answered` | OS permission answered, or a revoke or grant seen at foreground | `granted` bool; `source` enum: ask, settings | L2 | mobile | analytics consent | NS-13-R16 |
| `notifications.permission.revoked` | At foreground, permission is now off and our pending list is empty by rule | none | L2 | mobile | consent | NS-13-R16 |
| `notifications.schedule.changed` | Reminder switch, cadence, weekdays, hour or names setting saved (observed from stored prefs) | `change` enum: turned_on, turned_off, cadence, weekdays, time, names; `cadence` enum: off, weekly, few_times, every_evening; `hour_bucket` enum: morning, afternoon, evening, late_evening | L2 | mobile | consent | NS-13-R1, R30 |
| `notifications.schedule.failed` | Scheduling threw (D-S06 error-schedule_failed) | `reason` enum: permission, scheduler, unknown | L2 | mobile | consent | NS-13-R16 |
| `notifications.reminder.delivered` | Next foreground finds an evening nudge of ours that fired | `class` enum: evening; `phase` enum: first_week, backoff; `variant_id` int 0 to 99 | L2 | mobile | consent | NS-13-R1, R3 |
| `notifications.reminder.opened` | Tap response on an evening nudge | same three properties | L2 | mobile | consent | NS-13-R9 |
| `notifications.reminder.suppressed` | A nudge that was planned is removed | `reason` enum: made_letter_today, smart_quiet, backoff_ended | L2 | mobile | consent | NS-13-R3, R4, R8 |
| `notifications.plan.violated` | The pure planner self-check fails after a plan is made | `rule` enum: one_per_day, over_ceiling, after_horizon, outside_hours, time_sensitive | L2 | mobile | consent | NS-32, NS-13-R18, R20, R23, R30 |
| `perf.reminder_open_home.measured` | Tap to Home interactive | `duration_bucket` enum: lt_1s, 1_2s, gt_2s | L2 | mobile | consent | NS-13-R9 (2 s on SE 3) |
| `perf.reminder_replan.measured` | Re-plan after a store write | `duration_bucket` enum: lt_500ms, 500ms_1_5s, gt_1_5s | L2 | mobile | consent | NS-46-R33 (1.5 s) |

Why `plan.violated` does not leak: it fires from a check over the whole plan (all classes), carries only a rule name, and never names which class broke the rule. It is zero-target, so on a healthy build it never fires. CPO-5 asks whether even that is acceptable on a day-note plan.

### 2.4 What is NOT measured and why

- Month, birthday, typed-day and library-day notes: their time reveals a birth date or a chosen day (TRACKING_PLAN 6.4, FR-DAT-27, NS-46-R34).
- The chosen hour, the weekdays, the names value: the hour band is enough; names value is a safety choice (E82).
- Reminder text or the variant text: `variant_id` is a content-catalogue index only.
- Lock screen content: proved by tests (`[NS-13-R6a]`, `[NS-13-R24]`, E82 names-off test in BL-966: no digit and no "year" in any lock-screen string), not by telemetry.
- A count of nudges unanswered, days since a letter, or a streak: forbidden to show (CLAUDE.md), and not collected as a shown number. Back-off phase is a closed two-value enum, not a count.

### 2.5 Success measure, guardrails, reports

| Item | Definition | Target |
|---|---|---|
| Ask to yes | `d_s04_yes_evenings.tapped` / `d_s04_ask.impressed` | PROPOSED: no target; take a baseline across the first tester cohort. Frame row "Reminders still on after 2 weeks" has target "none set" (`00-product-frame.md:52`) |
| Open per delivered | `notifications.reminder.opened` / `notifications.reminder.delivered` | No target; baseline first; read with the bias in 2.2 |
| Letter after tap | PM1's `from_reminder_2h` over opened | No target; baseline first |
| Reminders turned off | `schedule.changed(turned_off)` plus `permission.revoked` per active week | TRACKING_PLAN line 53 proposed 10 percent or less per month (a Draft 1 number, not from a baseline: marked UNVERIFIED here) |
| Guardrail zero | any `notifications.plan.violated`; any `delivered` with a class other than evening; any nudge outside 07:00 to 21:30 seen in a device run; any lock screen string with a digit or "year" with names off | 0, trips on one report (FR-DAT-09) |
| Performance | tap to Home under 2 s on SE 3; re-plan under 1.5 s | NS-13-R9, NS-46-R33 |

Observability: error class `schedule.failed.reason`; no alert is sent (no alert sender in 1.0, E81). Reader and report: the weekly insights read-out (existing loop, `docs/analytics/INSIGHTS_LOOP.md`, which is marked Superseded for v1.0 so reuse is a later decision), read by product and the founder, n and answered per FR-DAT-08, no percentage below n of 20.

## 3. Days and Home slips (NS-46 to NS-50)

The locked pack does not let Days be instrumented. NS-46-R34, NS-47-R9, NS-47-R34 and FR-DAT-27 forbid any event, property, bucket or aggregate carrying a day, a tradition, a country, a tick or a count of ticks, and a ticked day's slip, note or open. A screen view of the Days page or Browse would still say that a parent engages with days, and Browse holds the optional cultural pickers (IA-FINAL section 6, NS-47). So by default this file proposes NO events for C-S24, C-S25, C-S26, D-S08, D-S09 and D-S25, no impression for slip ranks 2b and 3b, and no tap on "Choose days" or "Not now" for the Days ask.

How Days is measured instead (all outside the app, already in the pack): the NS-46 and NS-47 tester sheet (NS-46 section "Measures with analytics off"; NS-47-R9; `docs/product/prd/21` section 21): "did the parent tick a day without help (4 of 5, a usability check, not a rate)", "did a reminder arrive on the date shown", support tally macros (NS-46-R45), and a date-wrong report handled the same day (NS-46-R44). The one thing that can be proved without a data point is correct scheduling: the planner and `chooseOnePerDay` tests (NS-46-R30) and the oracle tables (NS-46-R12).

Home slips (NS-50): only `waiting_set` and `past_letter` are observable (section 1.3). "Home is not a feed" (NS-50-R11) means no event may carry how many things were waiting.

CPO-1 asks whether to allow a content-free impression and tap of the Days ask (`ui.a_s01_slip_days_ask`, outcome choose or not now). It would need a Proposed change to NS-47-R34 and TRACKING_PLAN 6.4 (next free erratum E83). Default: no.

## 4. Family: invite to joined (NS-25)

### 4.1 Journey and question at each step

| Step | Question | Measure | Side |
|---|---|---|---|
| P1 sees the invite row | Do parents who can invite see it? | `ui.d_s12_invite_row.impressed`, `screen.d_s12.viewed` | phone |
| P1 opens the sheet and shares | How many reach the share sheet and finish it? | `ui.d_s12_invite_row.tapped`, `screen.d_s13.viewed`, `family.invite.created`, `family.invite.shared` | phone |
| Link is opened | How many links are opened? | `family.invite.peeked` (count of `peek_invite` calls) | server |
| P2 reads the join ask | Do they read it, and how many agree? | `screen.d_s15.viewed`, `screen.d_s16.viewed`, `ui.d_s16_agreement.impressed`, `ui.d_s16_accept.tapped` | phone |
| Accept completes | How many accepts end in exactly one membership (NS-25-R10)? | `family.invite.accepted` | server (record) |
| The book arrives | How long, p95 10 s on LTE? | `perf.join_arrival.measured` | phone |
| A second voice | Does P2 keep a letter within 14 days? | `family.second_voice.reached` (a per-book boolean rolled into a weekly count, k = 10) | server |
| Refusals and errors | Which error classes? | `family.invite.failed` | phone; server counts SCINV, SCCAP, SCPAR |
| Undo within 72 hours | How often? | server aggregate only, see CPO-3 | server |

Why the side split: P1 and P2 are two phones and there is no person id by design, so the funnel is read as cohort counts per week, never per pair. Phone events show where a sheet loses people; server counts are the numbers of record. The two are not joined and the read-out says so.

### 4.2 Registry rows (schema_version 1, status proposed)

| Event | Trigger | Properties | Class | Owner | Gate | Requirement |
|---|---|---|---|---|---|---|
| `family.invite.created` | Invite created on the phone | `role` enum: parent (contributor joins in 1.1, NS-28); `channel` enum: share_sheet, copy_link | L2 | mobile | consent | NS-25 section 4 |
| `family.invite.shared` | Share sheet returns | `completed` bool | L2 | mobile | consent | NS-25 section 4 step 2 |
| `family.invite.failed` | Create, peek or accept failed | `stage` enum: create, peek, accept; `reason` enum: expired, used, revoked, already_member, not_found, third_adult, rate_limited, consent_needed, book_deleted, signed_out, network, paused, unknown | L2 | mobile | consent | NS-25-R5, R9, R11, R18 |
| `perf.join_arrival.measured` | Accept to first page of letters visible | `duration_bucket` enum: lt_10s, 10_30s, gt_30s | L2 | sync | consent | NS-25 budgets; 06-nfr section 4 |
| `perf.invite_sheet_open.measured` | Tap to sheet interactive | `duration_bucket` enum: lt_300ms, 300ms_1s, gt_1s | L2 | mobile | consent | NS-25 budgets (300 ms) |
| `family.invite.peeked` (server counter) | `peek_invite` call | `outcome` enum: ok, expired, revoked, used, not_found | aggregate | data-architect | none (server count; see 4.3) | NS-25-R2 |
| `family.invite.accepted` (server counter) | `child_members` row created by accept | none | aggregate | data-architect | none | NS-25-R10, R17 |
| `family.second_voice.reached` (server, weekly) | A joined parent's first kept letter | none, rolled up | aggregate k=10 | data-architect | FR-DAT-28 ruling | NS-25-R7 |

### 4.3 What is NOT measured and why

- Who invited whom, which book, which child, the invitee's address or name, the link, the token (hashed server-side already).
- Declines, and why: NS-25 section 12 says the inviter is not told; we do not collect it either.
- The share destination app or recipient (FR-DAT-27).
- Separation or safety signals: any undo, any support-removal (SCPAR), any "ex-partner" case (NS-25 section 5). These are the most sensitive family events in the product. Proposed: no phone event; server counts only, with k = 10, and not read in the 1.0 line (FR-DAT-28 says `insights.*` is not read in 1.0 unless the founder rules otherwise, FQ-01).
- The existing catalogue has `member_removed` and `member_left` (TRACKING_PLAN section 3, family). I propose not carrying them forward: NS-25-R13 removes the removal control after 72 hours, and a per-event "left" signal is a family safety signal. CPO-3.
- Contributors, relatives and the family digest (`family_letter_reviewed`, NS-26 push, NS-28): 1.1, no rows now.

### 4.4 Funnels (family)

| Funnel id | Ordered events | Success | Target |
|---|---|---|---|
| `f_family_invite_to_joined` | `screen.d_s12.viewed`, `ui.d_s12_invite_row.tapped`, `screen.d_s13.viewed`, `family.invite.created`, `family.invite.shared`, (server) `family.invite.peeked`, `screen.d_s16.viewed`, `ui.d_s16_accept.tapped`, (server) `family.invite.accepted`, `screen.d_s17.viewed` | Accepted within 7 days of created (the invite lifetime, NS-25-R18) | PROPOSED: no target; baseline over the first tester cohort, then set. Read as weekly counts, not per family |
| `f_family_second_voice` | `family.invite.accepted`, `family.second_voice.reached` | A joined parent keeps a letter within 14 days (window PROPOSED) | No target; baseline first |

Guardrails (zero): a third parent on any book (server invariant query, `max_parents_per_book()`); P2 reading P1's private letters (RLS test, `[NS-25-R3]`); a child name on the link page (`[NS-25-R6]`); a member removal after 72 hours without a support ticket (`SCPAR` use is logged in the support runbook only); more than one membership after a retry (`[NS-25-R10]`). Observability: error classes SCINV, SCCAP, SCPAR counted by the Edge Function log with the log canary (no token, no child name, NS-25 section 8). Alert routing is `ops`' (E81: no sender in 1.0).

## 5. Email and lifecycle messaging

| Event | Trigger | Properties | Class | Owner | Gate | Requirement |
|---|---|---|---|---|---|---|
| `system.email.sent` (server counter) | The sender function hands a message to the mail provider or fails | `template` enum: the transactional ids built or to build in 1.0 (playbook 02 section 3; list owned by `content`); `class` enum: transactional; `outcome` enum: accepted, failed | aggregate, no address | data-architect | none (a daily count; no person) | E75, LEGAL-REQ-053 |

- What is measured: sends per template per day and failures. This answers "is the welcome email going out" and "did the invite email fail".
- What is not: opens, clicks, bounces by address, any recipient, any per-user row. Resend tracking stays off (`emails/BRIEF.md:18`), and CATALOG principle 2 says nothing is re-sent because it was not opened. The charter asks for "send vs open where allowed": open is not allowed, so it is not proposed.
- Guardrail zero: an email whose class is commercial (`[LEGAL-REQ-053]` content test per template); any send to an address that came from the waitlist list from the account system (E75).
- Co-parent invite channel: NS-25 happy path has P1 send the link through their own messages; playbook 02 section 4B also lists a `coparent-invite` email "to build" (D-055). They differ. Product owns the answer; if the email is built, `template` gains `coparent_invite`. Until then it is zero.
- Daily counts are tiny at tester scale; read-outs follow FR-DAT-08 (no cell under 5, no percentage under n of 20).

## 6. Funnels, summary

| Funnel id | Steps | Drop-off read |
|---|---|---|
| `f_notifications_remind` | `ui.d_s04_ask.impressed`, `ui.d_s04_yes_evenings.tapped`, `notifications.permission.answered` (granted), `notifications.schedule.changed` (turned_on), `notifications.reminder.delivered`, `notifications.reminder.opened`, PM1 `capture.letter.saved` | Per step as weekly cohort counts; the delivered step is a lower bound (2.2) |
| `f_notifications_stepback` | `notifications.schedule.changed` (turned_on), `delivered` (first_week), `delivered` (backoff), `suppressed` (backoff_ended) | Whether the back-off holds; paired with turned_off and revoked |
| `f_family_invite_to_joined`, `f_family_second_voice` | section 4.4 | Weekly cohort counts |

## 7. Open-source and cost (founder rule: completely free, fits Expo, Supabase, Vercel)

| Need | Checked | Decision |
|---|---|---|
| Event capture | the in-repo `packages/analytics` (typed catalogue, consent, validators) | Adopt as is, extend the catalogue with these rows. Cost 0 |
| Funnels and retention reports | existing insights loop plus SQL views on Postgres (the repo's own, `INSIGHTS_LOOP.md`) | Use. Nothing new to buy or host |
| Hosted dashboards (PostHog Cloud, any "free tier" of a paid product) | not specified | NOT proposed: the founder's new rule bars paid products and tiers. Whether a self-hosted tool is "free" when it needs a server is a call for `data-architect` and the founder (CPO-6). I did not read any licence or price page this session, so no tool fact is claimed here |
| Email opens | none | Not wanted (tracking off) |
| Planner self-check | own code (a pure function, a few lines) | Build: thin layer nobody sells |

No new dependency is proposed.

## 8. Proofs that nothing carries content (tests)

1. Registry test: every event name matches the standard and every property is on its allowlist; unknown names and properties are rejected (analytics' validator).
2. Stem test: the NS-47-R34 stems and `variant` text, `body`, `title`, `child`, `name`, `age`, `month`, `day_id` are rejected as names and values (extends `packages/analytics/test`).
3. `observe.test.ts`: `libraryDay`, `typedDay`, `birthday`, `monthAge` never produce an event (NS-46-R34), and `class` has one value.
4. Slip test: only the two allowed slip ids exist in the event enum; a new slip must be added to the registry row first.
5. Network fake: FR-DAT-01 profile test, zero requests with analytics off, in every 1.0.x profile.
6. E82 names-off string test and `[NS-13-R6a]`, `[NS-13-R24]` stay in CI as the lock screen proof.
7. `system.email.sent`: the `class` enum has no commercial value, so a commercial template fails the build (E75).

## 9. Proposed implementation rows (IN-PM4-nn; real BL ids come from product)

| Id | Wave | Row | Owner role | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-PM4-01 | 1 | Add the reminder rows (2.3) to the catalogue and the generated plan, dark, with stem and observe tests | analytics | M | 00-event-standard merged | no |
| IN-PM4-02 | 1 | Add the family rows (4.2) and the slip rows (1.3) to the catalogue, dark | analytics | M | IN-PM4-01 | no |
| IN-PM4-03 | 1 | Planner returns suppression reasons and a planned-nudge count; add the pure self-check behind `plan.violated` | mobile | M | BL-966 registry | no |
| IN-PM4-04 | 2 | Screen and control ids for D-S04 to D-S07 and D-S12 to D-S19 as a fixed list; wire views, taps, impressions behind the consent gate | mobile, design-systems | L (split by area) | IN-PM4-01, 02; IA-FINAL merged | no |
| IN-PM4-05 | 2 | Evening reminder delivered (foreground scan) and opened (response) observers; `from_reminder_2h` with PM1 | mobile | M | IN-PM4-01 | no |
| IN-PM4-06 | 2 | Server counters for invite peek and accept, and the weekly second-voice roll-up, as migration proposals with k = 10 and a reporting role | data-architect | M | FR-DAT-28 ruling | yes (supabase paths are founder-only) |
| IN-PM4-07 | 2 | `system.email.sent` daily counter in the sender function, no address, class enum with one value | data-architect | S | the senders exist (playbook 02: none built for most ids) | no |
| IN-PM4-08 | 3 | Weekly read-out: funnels `f_notifications_*` and `f_family_*` with n and "x of n" | decision-science | S | IN-PM4-04 to 06; analytics on in a build | yes (turn-on) |
| IN-PM4-09 | 3 | Device run: delivered-versus-opened bias check on a real phone across a week of silence (NS-13 device rows) | qa | S | a TestFlight build | yes (device) |

## 10. Contradictions with the locked pack

None that I changed. Two things differ and need a ruling, neither is edited here: (a) the Days ask impression (CPO-1) would need E83; (b) co-parent invite by email versus by the parent's own messages (section 5). TRACKING_PLAN section 3 `reminder_sent` and `notification_opened` use pre-standard names; mapping to `notifications.reminder.delivered` and `.opened` is a rename, so old names are deprecated with a date, not edited (brief rule 6).

## For the CPO: decisions and risks

| # | Decision or risk | Proposed default |
|---|---|---|
| CPO-1 | Allow any event for the Days ask, or slip ranks 2b and 3b? It needs a Proposed change (E83) to NS-47-R34 and TRACKING_PLAN 6.4 | No. Days is measured by the tester sheet only |
| CPO-2 | Accept that `delivered` is a lower bound and `opened / delivered` is biased high, and read opens against planned nudges instead | Yes; the planner emits planned counts (IN-PM4-03) |
| CPO-3 | Family safety signals: carry forward `member_removed` and `member_left`, or record undo and leave events at all? | No phone events; server counts only, k = 10, not read in 1.0 (FR-DAT-28) |
| CPO-4 | Email "opened" and "clicked" cannot be measured without breaking the no-tracking rule. Accept send counts only? | Yes |
| CPO-5 | Is `notifications.plan.violated`, which comes from a check over a plan that includes day notes, acceptable? It names a rule, never a class or a day | Yes; zero-target; data-steward to confirm |
| CPO-6 | "Completely free" and a hosted dashboard: a server costs money. Report from SQL views and the in-repo insights loop only, or approve self-hosting? | Views and the loop only until the founder rules |
| CPO-7 | Co-parent invite channel: own messages (NS-25) or email (playbook 02, D-055) | Own messages, as NS-25 says; email stays unbuilt |
| Risk | Funnels cannot join P1 to P2 (no person id); the family read is cohort-level | Say so in every read-out |
| Risk | At tester scale every cell is tiny and a founder who knows the testers can guess who | FR-DAT-08: no cell under 5; no percentage under n of 20 |
| Risk | Control ids are PROPOSED and unconfirmed against the D WORDS files | `design-systems` confirms before IN-PM4-04 |

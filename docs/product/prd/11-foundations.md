# NS-32 to NS-37: Foundations a parent feels without seeing

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: Karma with the CPO role | Replaces: none | Load when: building or testing foundations: plan notices, accessibility, data rules (NS-32 to NS-37).

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: Karma with the Chief Product Officer role, revised 20 Nov 2026 against the three round-2 executive reviews and Karma's round-2 rulings. Docs only. These are not features. Each one protects a promise a parent relies on: it starts fast, it works with large text and VoiceOver, it never nags, only Home starts a letter, and nothing they made is lost or shown where it should not be. Every other card leans on them, so each carries full acceptance rows and budgets.

The rules block at the top of `10-reading-and-family.md` applies here too: device evidence on the Asha test install only (D13), undo windows (T4), sign-out keeps the book (D1), never donate and writing tools off (D3, D2), free stays free (T2), hand-sent measures (D5), the Home slip order, no traceability claim until `scripts/trace.mjs` matches NS ids (F1), counsel numbers from packet 1.5.0. No card here states a build number or a date (T5). Code facts were read on `develop` at `697233d35` and open PRs through the GitHub REST API on 20 Nov 2026. Nothing was run on a phone.

One term everywhere (ruling T3): the **stored copy** is the picked picture kept at its own size up to 4,032 px on the long side, never below 2,550 px when the source is larger, JPEG at quality 0.85, metadata stripped. The **list copy** is about 512 px, the **page copy** about 1,280 px. The camera original is never stored. "Original" in these cards means only a recording's original audio file.

---

## NS-32. One notification budget (candidate N-09, rank 23)

**Label effect.** None. All notifications are local; nothing leaves the phone.

Ruled 20 Nov (Karma, council round 2): NS-32 comes before NS-13. NS-13's back-off is pre-scheduled in the plan, and plan notices are a class outside the budget.

### 1. Who and when
P1, whose phone already buzzes too often, at any hour; and the founder, whose plan notices may be a legal duty.

### 2. Why
- The job: "Leave my words and voice for my child's future" (rank 3), kept up without guilt; guardrails: zero counts of gaps, streaks or guilt lines, and zero child names on a lock screen by default (00 section 3).
- Today [F, read in code]: `lib/reminders/planner.ts` plans three classes (evening, monthAge, birthday) and says "at most one note a day: a month or birthday note replaces that day's evening nudge". It keys month and birthday notes by kind and date (`${kind}:${date}`), so a birthday of one child and a month-day of another on the same date plan two notifications that day. It keeps at most 60 pending (`maxNotifications`). Plan reminders (`lib/billing/plan-reminders.logic.ts`) are a separate group of at most 4 (`MAX_PLAN_NOTIFICATIONS`), fired inside hard windows at 10:00 local when possible and never in quiet hours. iOS keeps 64 pending per app; 60 plus 4 is 64.
- Open draft for the reminder budget [F]: adds `lib/reminders/budget.ts`, a class registry with groups and pending ceilings, and registers `occasion` for the parked Memory Library (NS-31).
- Coming [F, cards]: typed days (NS-18), NS-13's back-off, later a co-parent push (NS-26, parked).
- [A] Each class alone seems reasonable; together they nag. One budget in one place makes the total a product decision.

### 3. What, and Not in scope
**What.**
- One registry of notification classes in `lib/reminders/budget.ts`. A class cannot ship without a row: id, group, priority, owner, status. A class shares its group's pending slots; a class cannot raise the total.
- Classes (PROPOSED priority, highest first): `plan` (outside the budget, its own group of 4 slots); then, inside the budget, `typedDay` (NS-18, the parent asked for it), `birthday`, `monthAge`, `evening`.
- The budget: at most 1 budgeted notification per phone per local day, across all books. "Local day" is the wall-clock calendar date the trigger fires on; iOS triggers are calendar triggers with no time zone (`lib/reminders/scheduler.ts:13`), so a day is a day wherever the phone is.
- A day's one notification is chosen by priority. A lower class on that day is not scheduled.
- Plan notices are outside the budget: ranked above everything, never dropped or delayed by it, because their timing may be a legal duty (Q-003 memo; Q41; counsel must confirm the windows). On a day with a plan notice, the day's one budgeted notification may still fire, so the most any day can bring is 2.
- NS-13's back-off applies to the `evening` class only and is pre-scheduled in the plan (7 daily, then weekly for 4 weeks, then none, counted from the last made letter), so a parent who never opens the app gets nothing after day 35. It never suppresses a typed day the parent asked for, which still counts toward the one per day.
- Every class: interruption level `active`, never `time-sensitive`; every body is a `packages/content` key; every category sets a neutral `hiddenPreviewsBodyPlaceholder` (research note 3).

**Not in scope.** What each class says and when (NS-13, NS-18, F14). Push notifications (NS-26). Any class derived from the photo library (the `occasion` class leaves the open draft; NX-39 R27).

### 4. Happy path
1. The parent has evening reminders on, two books, and a typed day on 14 March.
2. On 14 March the planner schedules the typed day and nothing else from the budget.
3. On a day that is also a child's month-day, the month note replaces the evening nudge.
4. A trial ends that week; the plan notice fires at 10:00 in its window regardless.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A birthday of one child and a month-day of another on the same date | One notification: the birthday (higher priority) |
| Two children with month-days on the same date | One month note naming both or neither (as built, `monthNoteCopy`) |
| A plan notice and a typed day on the same date | Both fire (plan outside the budget) |
| Notifications not allowed in iOS Settings | Nothing is scheduled; Settings, Plan shows the plan date (F14-REQ-NEW-A) |
| The parent travels across time zones | Each budgeted notification fires at its wall-clock time on its calendar date; no date gets two; plan notices keep their absolute windows |
| A quieted book | Contributes no class (F12-REQ-011) |
| The parent never opens the app | The pre-scheduled plan holds: back-off ends evening nudges after day 35; plan notices still fire in their windows |
| Pending at the ceiling | At most 60 pending in total; the 4 plan notices are kept first within the 60 (E13) |
| A class not in the registry | The test fails the build |
| "Show Previews" set to Never or When Unlocked | The system shows the category placeholder; the app cannot change this user setting (research note 3) |
| Focus mode or Scheduled Summary | Applies, because no class is `time-sensitive` |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | No class schedules before the parent turns reminders on (as built); plan notices only after a purchase |
| Empty | No reminders on: nothing; plan notices as StoreKit reports |
| Many (1,000 letters, 300 pictures) | No effect; the planner reads children, prefs and the last save |
| Offline | All local; unaffected |
| Slow | n/a because no network |
| Failed | A failed schedule call is kept and shown in Settings, Reminders (as built, `lastScheduleResult`) |
| Interrupted | n/a because planning is a background step |
| App killed mid-flow | The next launch re-plans; the plan signature avoids churn |
| App updated mid-flow | All pending notifications are re-planned at the first launch after the update |
| Low storage (under 1 GB, under 50 MB) | No effect |
| Low Power Mode and low battery | Local notifications are unaffected |
| Two books | At most 1 budgeted notification per day across both |
| Two parents | Each phone plans its own; a letter by either parent counts as a made letter for back-off only on that parent's phone |
| Expecting parent (due date only) | No month or birthday notes until born (as built); evening nudges allowed with no due-date wording |
| Multilingual | Bodies in the interface language (English); a child name in any script when names are on |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | System notification rendering; n/a for our layout |
| VoiceOver | The system reads the notification; bodies are plain sentences |
| Voice Control and Switch Control | System notification handling; n/a |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | System rendering; n/a |
| Plan lapsed | Plan notices stop (StoreKit no longer reports a renewing plan); reminders continue |
| Signed out | Reminders follow NS-13-R14; plan notices follow StoreKit on this phone |
| Second account on the same phone | Re-plans from that account's prefs; nothing of the first account's typed days remains (NS-18-R6) |
| New phone | Reminder settings do not sync; the reminder ask follows its built cap on that phone |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-32-R1 | Given every budgeted class scheduled over 92 days, Then at most 1 budgeted notification is delivered per local day | P0 (a: no nagging) | `[NS-32-R1] one budgeted notification a day` |
| NS-32-R1b | Given a birthday of one child and a month-day of another on the same date, Then exactly one notification is scheduled for that date | P0 (a: no nagging) | `[NS-32-R1b] birthday and month-day on one date` |
| NS-32-R2 | Given a class not in the registry, Then the build fails its test | P1 | `[NS-32-R2] unregistered class fails` |
| NS-32-R3 | Given two budgeted classes due the same day, Then only the higher priority is delivered | P1 | `[NS-32-R3] priority decides` |
| NS-32-R4 | Given a plan notice and any other notification due the same day, When notifications are allowed, Then the plan notice is delivered inside its window; when they are not, Settings, Plan shows the date (F14-REQ-NEW-A) | P0 (b: plan notices, Q41) | `[NS-32-R4] plan notice on time` |
| NS-32-R4b | Given the pending notes would pass 60 in total, Then all due plan notices (up to 4) are still scheduled first, the budgeted notes give way, and the total pending is at most 60 (E13, applied) | P0 (b: plan notices) | `[NS-32-R4b] plan notices at the iOS ceiling` |
| NS-32-R5 | Given the registry, Then it lists at least `plan` (outside the budget, first), `typedDay`, `birthday`, `monthAge`, `evening`, each with a group, a priority and an owner, and no `occasion` class | P1 | `[NS-32-R5] registry rows` |
| NS-32-R6 | Given a time zone change, Then no local calendar date delivers 2 budgeted notifications | P1 | `[NS-32-R6] time zone change` |
| NS-32-R7 | Given every class, Then the total pending never exceeds 60 and the plan notices within it never exceed 4 (E13, applied) | P1 | `[NS-32-R7] pending ceilings` |
| NS-32-R8 | Given a plan made on day 0, no letter made and the app never opened, Then no `evening` notification is scheduled after day 35 | P0 (a: no nagging) | `[NS-32-R8] back-off pre-scheduled` |
| NS-32-R9 | Given a typed day, Then back-off never removes it | P1 | `[NS-32-R9] typed day survives back-off` |
| NS-32-R10 | Given any scheduled notification, Then its interruption level is `active`, never `time-sensitive` | P1 | `[NS-32-R10] interruption level` |
| NS-32-R11 | Given any notification body, Then it is a `packages/content` key, never generated text | P0 (a: the machine never adds words) | `[NS-32-R11] bodies from content keys` |
| NS-32-R12 | Given any notification, Then it carries no letter words and no child name unless the parent turned names on (D-025); a plan notice never carries a child name, a count or a price (D-083) | P0 (a: zero child names on a lock screen by default) | `[NS-32-R12] lock screen stays plain` |
| NS-32-R13 | Given each category, Then it sets a neutral `hiddenPreviewsBodyPlaceholder` | P1 | `[NS-32-R13] preview placeholder` |
| NS-32-R14 | Given a quieted book, Then it contributes no budgeted class | P0 (a: a hard-day tool holds) | `[NS-32-R14] quiet book adds nothing` |
| NS-32-R15 | Given a class added to a group, Then the group's pending ceiling does not rise (as #758's `addNotificationClass`) | P1 | `[NS-32-R15] a class cannot raise the total` |
| NS-32-R16 | Given an app update, When the app first launches after it, Then every pending notification is re-planned | P1 | `[NS-32-R16] re-plan after update` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Planner run (3 children, every evening, 8 weeks plus 35-day back-off) under 50 ms; schedule calls under 1 s (06-nfr 2.3) |
| Memory | Negligible |
| On-device storage | A few settings keys |
| Battery | No background work of our own beyond local notifications (06-nfr section 10) |
| Offline | Fully local |
| Accessibility | System notification UI |
| Localisation | Bodies in the interface language; CLDR plurals for month numbers |
| Privacy | Log canary: no body, child name or typed-day words in any log |

### 9. State space (RR-5)
| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Reminders are per phone; settings do not sync; a letter made on phone A ends phone B's evening nudges only after B's next pull; an offline B may still remind | `[NS-32-R8]` per phone |
| Second account on the same phone | Re-plans from that account's prefs; the first account's typed days are gone (NS-18-R6) | NS-18 tests |
| Offline | No effect | n/a |
| Retry after a lost answer | n/a because nothing is sent | n/a |
| Sign out | As NS-13-R14 | NS-13 tests |
| Account deletion | All pending notifications cancelled; typed days removed | NS-13, NS-18 tests |
| Kill switch (`serverFeaturesEnabled()` off) | No effect (local) | n/a |
| Remote pause | Remote config may only narrow the reminder window (C-NFR-009); never widen it | existing `normalizeWindow` tests |
| Plan lapse | Plan notices stop; reminders continue | `[NS-32-R4]` variants |
| Permission denied | Nothing scheduled; plan date shown in Settings, Plan | `[NS-32-R4]` |

### 10. Data and engineering
- **Modules.** `lib/reminders/budget.ts` (from #758, reworked: classes `evening`, `monthAge`, `birthday`, `typedDay`, `plan`; `occasion` removed; groups `reminders` with 60 slots and `plan` with 4), `lib/reminders/planner.ts` (one-per-day across kinds; priority; back-off pre-scheduled with the evening horizon extended from 21 to at least 35 days), `lib/reminders/scheduler.ts` (categories with `hiddenPreviewsBodyPlaceholder`, interruption level), `lib/billing/plan-reminders*.ts` (unchanged rules; registered as `plan`).
- **Fields.** None new on letters. Settings keys for typed days are NS-18's (`typedDay.<yyyy-mm-dd>`).
- **Migrations.** None. Export: none.
- **Flags.** None for the budget itself; it is a rule over existing classes. `typedDay` joins behind NS-18's flag.
- **Error codes.** None new; schedule failures use the built `ScheduleResult`.
- **Order.** NS-32 lands before NS-13 (ruling). #843 makes BL-943 eligible ahead of NS-32; the CPO re-orders BL-943 after NS-32 (finding F8). NS-32 has no backlog row today; the CPO adds one.
- **Rollback.** Revert; the built planner rules stand.

### 11. Data inventory
| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Scheduled notification bodies held by iOS | L3 by default; L4 with names on or typed words on | iOS notification store on the phone | no | until delivered or re-planned | re-plan; sign-out (NS-13-R14); account deletion; Erase everything | no | never logged |

### 12. Door lines
The notification permission is NS-13's (Shown: one sheet sentence and two equal choices, then the iOS prompt; Records: the choice, on the phone only; Never: a second ask from us; Decline: no reminders, Me explains in one sentence). The registry is not a door. Records: on the phone only; no PRIV-R21 row, because these are settings.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| Child name, typed-day words on the lock screen | Read by anyone who sees the phone | Names off by default (D-025); typed words off by default (NS-18); placeholder for hidden previews; Show Previews is the user's setting, which we cannot change | `[NS-32-R12]`, `[NS-32-R13]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No generated notification text.
- No notification derived from the photo library.
- No count, streak or "since" line in any body.
- No text field on this card (ruling D2 does not apply; typed-day words are NS-18's field and follow D2 there).

### 15. Design inputs
n/a for screens; the notification content is system UI. Design reviews the placeholder text per category.

### 16. Content inputs
One neutral placeholder per category (intent: "A note for tonight"; no brand name, which lives only in `packages/brand`). Banned: counts, "missed", "since", "streak", "don't forget".

### 17. Legal, privacy and compliance inputs
Counsel must confirm: Q41 (plan notice windows; whether a phone notice is enough for a buyer who never signs in; (h) the annual reminder). Apple 4.5.4 names push notifications; whether reviewers apply it to local notifications is not settled by the text (research note 1); the CCO re-reads it before submission.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables: "Gentle reminders, at most one a day" (claims row; only after R1 passes on a device). Forbids: "never miss a day", "smart reminders", any line that promises the lock screen shows nothing (Show Previews is outside our control).

### 20. Free or Plus
Free (ruling T2).

### 21. Measures with analytics off
Testers, by hand (D5): "Did the app ever feel like too many notifications (yes / no)?" Guardrail target 0. x of n.

### 22. Dependencies and gates
Before NS-13 and NS-18 (ruling). #758 reworked or superseded. Q41 for plan notice windows. Device spot check under D13 with an injected clock for the 35-day row (J-N4 becomes a unit test plus a device spot check).

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Priority of `typedDay` against `birthday` | CPO | `typedDay` first (the parent asked for it) |
| May a budgeted notification fire on a plan-notice day | CPO with CLO | Yes; the plan notice is outside the budget |

---

## NS-33. Everyone can use it (candidate N-02, rank 4)

**Label effect.** None. (Apple's Accessibility Nutrition Labels are a separate declaration; see section 19.)

### 1. Who and when
A VoiceOver user recording at 2 a.m.; a grandparent at the largest text size; a parent with Reduce Motion, Bold Text, Increase Contrast, Smart Invert, Voice Control or Switch Control on.

### 2. Why
- The job: every job, for every parent; must-be quality (00 section 2).
- The standard on record [F]: WCAG 2.2 AA, Dynamic Type to AX5 on every screen, every gesture with a button (LEGAL-REQ-051; `06-nfr.md` section 8; design language section 11). Voice Control and Switch Control gate at submission (06-nfr section 8, G4).
- Misses today [F, read in code 20 Nov]: the letter page has no heading (no `accessibilityRole="header"` in `app/letter/[id].tsx`); the Me tab is titled "Me" while its screen heading is "Settings" (`app/(tabs)/_layout.tsx:87-91`, `copy.settings.title`); no view sets `accessibilityIgnoresInvertColors` anywhere in `apps/mobile/src`, so pictures would invert under Smart Invert; nothing reads Bold Text for the three custom fonts. Built and kept: the tab bar items show the Large Content Viewer (`LARGE_CONTENT`, `_layout.tsx:57`). The lens control in the photo stack must not announce itself as tabs. The Book header at AX5 is reported to break (draft finding; UNVERIFIED on a device).

### 3. What, and Not in scope
**What.** The rows below on the screens a parent uses every day: Home, Listen, Review, the Book, the letter page, Me and Read together. Every new card inherits them.
**Not in scope.** The website and emails (LEGAL-REQ-051 covers them elsewhere). A full RTL interface (F44, later).

### 4. Happy path
1. A VoiceOver user opens Home, hears the dateline and the prompt, double-taps Speak; "Recording" is announced within 1 s.
2. They stop; Review opens; focus lands on its title; they undo one small fix; Keep.
3. A grandparent at AX5 with Bold Text reads the same letter; nothing truncates.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| An undo line read by VoiceOver | The window stays open until VoiceOver finishes plus its seconds (T4) |
| Switch Control on | Undo stays until the parent moves on (T4) |
| A picture under Smart Invert | Not inverted |
| The recording state with colour filters on | Shown by text and shape, never by terracotta alone |
| Bold Text on | Every text role has a Bold Text face; Tiro stays Regular where no heavier cut exists (E17) |
| Increase Contrast | Text holds 4.5:1; bars go solid |
| A playing voice | Nothing is announced over it (06-nfr section 8) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | First run passes every row here |
| Empty | Empty states pass every row |
| Many (1,000 letters, 300 pictures) | VoiceOver moves through the Book by month headings |
| Offline | No effect |
| Slow | Announcements of "still working" lines are polite, never repeated more than once a minute |
| Failed | Errors are announced |
| Interrupted | VoiceOver focus returns to the same element after a call |
| App killed mid-flow | Relaunch lands on Home's heading |
| App updated mid-flow | n/a |
| Low storage (under 1 GB, under 50 MB) | The low-storage line is announced |
| Low Power Mode and low battery | No loops (06-nfr section 8) |
| Two books | The switcher reads the book's name and age |
| Two parents | Signatures are read with each letter |
| Expecting parent (due date only) | "Before You" is read as words |
| Multilingual | Letter words are read in their language (`accessibilityLanguage`) |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | R4, R7 |
| VoiceOver | R1, R6 |
| Voice Control and Switch Control | R9, R10 |
| Reduce Motion | R5 |
| Dark mode and Increase Contrast | R8 |
| Plan lapsed | The gate sheet passes every row |
| Signed out | No effect |
| Second account on the same phone | No effect |
| New phone | No effect |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-33-R1 | Given the letter page, Then its dateline is a level 1 heading | P0 (b: LEGAL-REQ-051) | `[NS-33-R1] letter page heading` |
| NS-33-R2 | Given Me, Then the screen heading equals the tab label | P0 (b) | `[NS-33-R2] Me heading matches tab` |
| NS-33-R3 | Given the lens control, Then VoiceOver announces a single choice among options, with the selected one stated | P0 (b) | `[NS-33-R3] lens is a choice, not tabs` |
| NS-33-R4 | Given the Book, the letter page, Home and Review at the largest text size on an iPhone SE 3, Then no control is under 44 pt and no text is truncated (device) | P0 (b) | `[NS-33-R4] AX5 on SE 3` |
| NS-33-R5 | Given Reduce Motion, Then no screen runs a moving loop (device) | P0 (b) | `[NS-33-R5] no loops under Reduce Motion` |
| NS-33-R6 | Given VoiceOver on an iPhone SE 3, Then a parent can start, stop, review, undo a small fix and Keep a letter with no sighted help, and start and stop are announced within 1 s (device) | P0 (b; c: the core loop) | `[NS-33-R6] VoiceOver core loop` |
| NS-33-R7 | Given the largest text size with Bold Text, Then Home, Review, the Book and the letter page pass NS-33-R4 (device) | P0 (b) | `[NS-33-R7] AX5 with Bold Text` |
| NS-33-R8 | Given Increase Contrast, Then every text colour on those four screens holds at least 4.5:1 (token test plus device) | P0 (b) | `[NS-33-R8] contrast` |
| NS-33-R9 | Given Voice Control, Then every visible label on Home, Listen, Review, the Book and the letter page works as a command (device) | P0 (b: gated at submission, G4) | `[NS-33-R9] Voice Control labels` |
| NS-33-R10 | Given Switch Control, Then every control on those screens is reachable by item scanning (device) | P0 (b: G4) | `[NS-33-R10] Switch Control reach` |
| NS-33-R11 | Given Smart Invert, Then pictures and the brand mark are not inverted | P1 | `[NS-33-R11] Smart Invert ignores pictures` |
| NS-33-R12 | Given the recording state, Then it is shown by text and shape, never by terracotta alone | P0 (b: WCAG 1.4.1) | `[NS-33-R12] recording state not colour alone` |
| NS-33-R13 | Given AX sizes, Then tab bar items show the Large Content Viewer (built; regression row) | P1 | `[NS-33-R13] tab bar large content` |
| NS-33-R14 | Given Bold Text, Then every text role has a Bold Text face: Mukta and Literata render heavier, and Tiro stays Regular where no heavier cut exists (E17, applied; device; NEEDS EVIDENCE today) | P1 | `[NS-33-R14] Bold Text on custom fonts` |
| NS-33-R15 | Given any undo window, Then it stays open for its seconds or until VoiceOver has finished reading the undo line plus those seconds, whichever is later; with Switch Control on, until the parent moves on (T4) | P0 (b: WCAG 2.2.1) | `[NS-33-R15] undo windows wait for VoiceOver` |
| NS-33-R16 | Given an automated audit (XCUITest `performAccessibilityAudit()`) at AX5 on each screen named, Then zero critical violations | P0 (b) | `[NS-33-R16] automated audit` (test layer today: device, by hand with Accessibility Inspector, recorded `[stand-in]`; it becomes CI only when an XCUITest audit target exists, which it does not today, BL-162 PROPOSED; until then the row is not claimed green) |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Start and stop announced within 1 s (R6) |
| Memory | n/a |
| On-device storage | n/a |
| Battery | n/a |
| Offline | n/a |
| Accessibility | This card: WCAG 2.2 AA; AX5 plus Bold Text; 44 pt targets, 56 pt primary, 64 pt capture |
| Localisation | `accessibilityLanguage` on letter words; Devanagari in Tiro; Arabic right to left |
| Privacy | Accessibility labels carry no child name beyond what the screen already shows; no label is logged |

### 9. State space
n/a because the card touches no sync, account or notification.

### 10. Data and engineering
- **Fields.** None. **Migrations.** None. **Export.** None.
- **Modules.** `lib/a11y*`, `components/ui/*`, `app/letter/[id].tsx` (heading), `app/(tabs)/_layout.tsx` (Me heading), #840's lens control, the recording state in `app/listen.tsx`, picture views (NS-01) for `accessibilityIgnoresInvertColors`, the font tokens for Bold Text.
- **Tests.** Component label tests; XCUITest audit at AX5 (depends on an XCUITest target that does not exist yet: BL-162 PROPOSED; R16 is a hand run until it lands); manual scripts V1 to V6 (07-quality-bar section 2.11) on the SE 3 under D13.

### 11. Data inventory
No data.

### 12. Door lines
n/a because nothing is agreed, shared or deleted.

### 13. Threats
n/a because no trust boundary is crossed.

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No accessibility label is logged.
- No text field on this card (ruling D2 applies on each card's own fields).

### 15. Design inputs
States: every screen named at AX5 plus Bold Text on SE 3; Increase Contrast light and dark; Smart Invert; Differentiate Without Colour; Voice Control number overlay. Pictures set to ignore invert. No new component.

### 16. Content inputs
Accessibility labels in `packages/content`; never "button" in a label; the recording state has a word, not only a colour.

### 17. Legal, privacy and compliance inputs
LEGAL-REQ-051 (WCAG 2.2 AA). Any accessibility claim on the store page needs a claims row and evidence per build (CCO). Apple's label scheme UNVERIFIED this session.

### 18. Label effect
**Label effect.** None.

### 19. Claims
- Apple's Accessibility Nutrition Labels: declare nothing until the device walk passes; then VoiceOver, Dark Interface and Reduced Motion first; Larger Text only after AX5 on SE 3 passes (design role ruling; founder decides; default declare nothing).
- Forbids: "accessible to everyone", "fully accessible", "works with VoiceOver", until the walk passes on a phone.

### 20. Free or Plus
n/a because this is a quality bar, not a feature; it is never behind Plus.

### 21. Measures with analytics off
The device walk record (pass or miss per row, per release candidate). Testers who use VoiceOver or AX sizes, by hand (D5): "Could you make and keep a letter without help (yes / no)?" x of n.

### 22. Dependencies and gates
G4 (device rows) before any store build. #840 for R3. NS-01 for R11.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Which accessibility features to declare | founder | None until the walk passes |

---

## NS-34. It feels quick on the smallest phone (candidate N-01, rank 3)

**Label effect.** None.

### 1. Who and when
A parent with an older, smaller iPhone and the baby already stirring.

### 2. Why
- The job: "Never lose what I made" (rank 1) in its most anxious form: a tap that answers late in the dark reads as "did it start recording?".
- Today [F]: the numbers exist in `docs/prd/v2/06-nfr.md`; none has been measured on an SE 3 under its protocol. The `perf` build profile and marker harness do not exist yet (06-nfr section 0); until they land, rows are measured by hand with Instruments on a release build.

### 3. What, and Not in scope
**What.** A run sheet measured on an iPhone SE (3rd generation), on iOS 17 and the latest iOS, release configuration, under the 06-nfr section 0 protocol (unplugged, 50% brightness, nominal thermal state at start, 2 minutes idle between runs), 200 samples per metric unless stated, on the Asha test install (D13). Until the perf profile and markers exist, a hand run records 20 samples per metric, marked `[stand-in]` and never claimed green; the 200-sample rule applies once markers exist (E53). Results go to `docs/qa/evidence/<date>-<build>-se3.md` (file name pattern; the card sets no date).

Targets on an SE 3:
- Tap Speak to microphone live: p95 500 ms over 200 taps, cold and warm (F04-REQ-023).
- Cold start to first interactive frame: p50 1.2 s, p90 2.0 s (A-NFR-001). Warm start p50 400 ms.
- A screen change starts within 100 ms of the tap; controls usable by 350 ms; no UI-thread frame over 16.7 ms while scrolling the Book or the letter page.
- Named hand-offs within 900 ms: Home to Listen, Listen to Review, Review to the Book after Keep, a Book card to its letter page.
- The visible save hand-off (Keep to the Book showing the letter) within 2,000 ms; the local save commit inside it stays at p95 200 ms (06-nfr 2.2).
- Loops change opacity only, run only on the screen in front, and stop under Reduce Motion and Low Power Mode.
- From 06-nfr, on the same sheet: idle drain 1% a day or less; recording battery 2% or less per 10-minute take; memory while recording under 40 MB above idle; idle memory after first run under 150 MB resident; app download under 40 MB; caches 50 MB or less; thermal: no take refused at `serious` (transcription pauses between chunks at `serious`, never starts at `critical`).
- An iPad smoke row (App Review runs the iPhone app there): capture, Keep, read; no budget.

**Not in scope.** New numbers beyond 06-nfr except the hand-off lines; Android.

### 4. Happy path
1. `qa` installs the release candidate on the SE 3 signed in to the Asha test account.
2. Runs the sheet under the protocol; records each number with the device model, iOS version and build fingerprint.
3. Files the evidence; every row met, or a miss holds its feature.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A miss | The feature behind it is held from a store build until fixed or the founder changes the target |
| Thermal state not nominal at start | The run waits; a run started warm is discarded |
| The perf profile does not exist yet | Instruments on a release build, marked "by hand" |
| A number with no source build | Not recorded |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | Cold start row covers the first launch after install |
| Empty | Measured on an empty book and on the year-5 fixture |
| Many (1,000 letters, 300 pictures) | Book scroll and first render on the fixture (NS-37) |
| Offline | Cold start measured in airplane mode too (06-nfr 2.1 "work before the first frame") |
| Slow | n/a because device rows are local |
| Failed | A failed run is repeated, never averaged in |
| Interrupted | A call during a run discards that sample |
| App killed mid-flow | Cold start covers relaunch |
| App updated mid-flow | The first launch after an update is measured once per candidate |
| Low storage (under 1 GB, under 50 MB) | One spot run with under 1 GB free: Speak stays within budget |
| Low Power Mode and low battery | One spot run in Low Power Mode: loops off; Speak within budget |
| Two books | Switch child p95 300 ms (06-nfr 2.1) |
| Two parents | n/a because device rows are single-phone |
| Expecting parent (due date only) | n/a; same screens |
| Multilingual | The Book scroll run includes Devanagari, Arabic and Chinese letters |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | One scroll run at AX5 |
| VoiceOver | Start and stop announced within 1 s (NS-33-R6) |
| Voice Control and Switch Control | n/a for timing |
| Reduce Motion | Loops stop |
| Dark mode and Increase Contrast | n/a for timing |
| Plan lapsed | n/a for timing |
| Signed out | Cold start signed out included |
| Second account on the same phone | n/a |
| New phone | n/a |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-34-R1 | Given the run sheet, When `qa` runs it on an SE 3, Then each number in section 3 is recorded as met or missed | P1 | `[NS-34-R1] run sheet recorded` |
| NS-34-R2 | Given a miss, Then the feature behind it is held from a store build until fixed or the target is changed by the founder | P0 (c: the core loop must feel safe) | `[NS-34-R2] a miss holds the feature` |
| NS-34-R3 | Given the run sheet, Then every number records the device model, the iOS version and the build fingerprint | P1 | `[NS-34-R3] run sheet provenance` |
| NS-34-R4 | Given the evidence, Then it is filed at `docs/qa/evidence/<date>-<build>-se3.md` | P1 | `[NS-34-R4] evidence filed` |
| NS-34-R5 | Given any device run, Then it uses the Asha test install, and no run sheet, trace or screenshot carries a real name, letter, picture or voice (D13) | P0 (a: private) | `[NS-34-R5] runs on Asha only` |
| NS-34-R6 | Given perf markers, Then they carry no letter text, child name or path (PRIV-R10); a run that needs text to scroll uses invented text only (the Asha set), never a real family's (E53) | P0 (a: private) | `[NS-34-R6] markers content-free` |
| NS-34-R7 | Given the run on iOS 17 and the latest iOS, Then both are recorded | P1 | `[NS-34-R7] both iOS versions` |

### 8. Non-functional budgets
The targets in section 3 are the budgets. Privacy: markers content-free (R6).

### 9. State space
n/a because the card measures; it touches no sync, account or notification.

### 10. Data and engineering
- **Modules.** The `perf` EAS profile and marker harness (S19, S20 in 06-nfr), `docs/qa/evidence/`.
- **Fields, migrations, export, flags.** None.

### 11. Data inventory
No product data. Evidence files hold numbers only.

### 12. Door lines
n/a.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| A real family's book | A trace or screenshot from a founder's own phone | Asha test install only (D13); `no-real-family-data` test on every PR that adds evidence | `[NS-34-R5]` |

### 14. Never
No letter text, child name, picture or prompt is donated to the system (ruling D3). No real family data in evidence.

### 15. Design inputs
n/a. Motion rules: loops opacity-only, front screen only.

### 16. Content inputs
n/a.

### 17. Legal, privacy and compliance inputs
None. CLAUDE.md privacy rules apply to evidence.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Forbids "fast", "instant" in public until the run sheet passes; even then, no number in public copy.

### 20. Free or Plus
n/a because this is a quality bar.

### 21. Measures with analytics off
The run sheet. Crash-free sessions from App Store Connect for users who share diagnostics only.

### 22. Dependencies and gates
G4 device rows; an SE 3 (used, about $150 to $350 [A, E]) and an iPad for the smoke row (CFO note).

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Who runs the sheet when no `qa` session has the phone | founder | The founder, on the Asha install, by the run sheet |

---

## NS-35. Only Home starts a letter, and a test proves it (candidate N-05, rank 11)

**Label effect.** None.

### 1. Who and when
Every parent, every time they want to say something: they never wonder where a letter went or which button records.

### 2. Why
- The rule is the founder's (only Home captures; `NAV-TAB-ROLES-10nov.md` P1, P2, P9). A test that fails when anyone breaks it keeps it true as features are added.
- Today [F, read in code]: every new letter or take begins through `startCapture({ source })` (`lib/capture/start-capture.ts:24`) with a closed list of sources (`start-capture.logic.ts`: Home's `speak`, `type`, `notMuchToday`, `photo`; doorways `widget`, `controlCenterControl`, `actionButton`, `siri`, reserved). `test/navigation-one-entry.test.ts` checks N1, N2 (a to c), N3 (a to g), N4, N5, N6 (a, c, e) and N10; N2 (d to f), N6 (b, d), N7, N8 and N9 are not yet checked (they need content's tab-job strings and the lens, Find and Share modules). A reminder tap opens Home for an evening nudge and the Book for a month or birthday note (`lib/reminders/scheduler.ts:257`); a plan notice opens Settings, Plus (`lib/billing/plan-reminders.ts:117`). Nothing from outside the app turns the microphone on (`lib/resilience/start-intent.ts`).

### 3. What, and Not in scope
**What.** Finish the existing test: the checks it does not yet run, plus the doorway rules below. No behaviour change.
**Not in scope.** Building any doorway (NS-04, NS-06 Part C).

### 4. Happy path
1. A PR adds a button on the Book that pushes `/listen`.
2. The test fails, naming the file and the rule.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A mode change inside a capture (Type instead on Listen, Record again on Review) | Allowed; not a start (`router.replace` among capture screens) |
| Opening a waiting draft from Home's cards | A resume, not a start (P9) |
| The Book's empty state button | A tab switch to Home only (as built, `book.tsx` empty state `router.navigate('/')`) |
| A string-built route | A static scan cannot see it; the manifest and the closed source list are the backstop (test limits, 10.2) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | First run ends on Home; the first letter starts there |
| Empty | The Book's empty state points to Home |
| Many | n/a |
| Offline | n/a; the rule is static |
| Slow | n/a |
| Failed | n/a |
| Interrupted | A capture interrupted resumes as a draft on Home, never from another tab |
| App killed mid-flow | Recovery lands on Home (`recover-to-tonight.ts`) |
| App updated mid-flow | As killed |
| Low storage (under 1 GB, under 50 MB) | Home's low-storage rules (06-nfr 11.3) |
| Low Power Mode and low battery | n/a |
| Two books | Home's switcher picks the book before the start (NS-14) |
| Two parents | n/a |
| Expecting parent | n/a |
| Multilingual | n/a |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | Capture actions inline under the prompt (as built) |
| VoiceOver | Speak and Type are the only start labels |
| Voice Control and Switch Control | "Speak" works as a command on Home only |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | n/a |
| Plan lapsed | Capture is never blocked (D-082); the gate is at Keep |
| Signed out | Capture works |
| Second account on the same phone | Capture works for that account |
| New phone | n/a |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-35-R1 | Given every screen outside Home, Then none starts a new letter or take | P0 (c: one place to start) | `[NS-35-R1] only Home starts` |
| NS-35-R2 | Given moves inside a capture already begun (Listen to Review, a change of mode), Then they are allowed and are not starts | P1 | `[NS-35-R2] mode changes are not starts` |
| NS-35-R3 | Given a doorway from outside the app (a notification tap, later a widget or shortcut), Then it lands on Home or a reading screen, and only the parent's tap on Home starts a letter | P0 (c) | `[NS-35-R3] doorways land, never start` |
| NS-35-R4 | Given a share extension, a notification action or a Siri intent, Then it counts as a doorway under R3, and never records or keeps on its own | P0 (c) | `[NS-35-R4] extensions are doorways` |
| NS-35-R5 | Given a new capture source, Then it is added to the closed list in `start-capture.logic.ts` in the same PR as its handler, or the test fails | P1 | `[NS-35-R5] closed source list` |
| NS-35-R6 | Given the navigation test, Then N2 (d to f), N6 (b, d), N7, N8 and N9 run once their modules exist, and each has a failing fixture | P1 | `[NS-35-R6] remaining navigation checks` |
| NS-35-R7 | Given any arrival from outside the app, Then the microphone is not turned on (`start-intent.ts`) | P0 (a: nothing records without the parent's tap) | `[NS-35-R7] no microphone from outside` |

### 8. Non-functional budgets
n/a for latency, memory, storage, battery and offline because the card is a static test. Accessibility: Speak and Type keep 64 pt. Localisation: n/a. Privacy: the test reads source, never data.

### 9. State space
n/a because the card touches no sync, account or notification beyond where a notification tap lands (R3).

### 10. Data and engineering
- **Modules.** `apps/mobile/test/navigation-one-entry.test.ts`, `lib/capture/start-capture*.ts`, `lib/nav/tab-jobs.ts`.
- **Fields, migrations, export, flags.** None.

### 11. Data inventory
No data.

### 12. Door lines
n/a.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| The microphone | A doorway records without the parent's tap | Closed source list; no microphone from outside | `[NS-35-R7]` |

### 14. Never
No letter text, child name, picture or prompt is donated to the system (ruling D3). No doorway records or keeps on its own.

### 15. Design inputs
n/a; the rule is the design.

### 16. Content inputs
`content` supplies the tab-job strings N2 (d to f) needs.

### 17. Legal, privacy and compliance inputs
None. Apple 2.5.19 (no hidden features) is served by doorways being reserved, not dormant.

### 18. Label effect
**Label effect.** None.

### 19. Claims
None.

### 20. Free or Plus
n/a.

### 21. Measures with analytics off
Support tally category "could not find where to start" (content-free). Target 0.

### 22. Dependencies and gates
NS-01, NS-02, NS-05 modules for N7 to N9.

### 23. Open questions
None.

---

## NS-36. New kinds of data follow the letter (candidates N-08 and N-10, ranks 7 and 8)

**Label effect.** None by itself; each field's own card states its label effect.

### 1. Who and when
Every parent, the day they delete, hide, restore, seal or export a letter that carries a picture, a first or a seal.

### 2. Why
- The jobs: "Never lose what I made" (rank 1) and "Keep my child's memories private" (rank 4); the promises "yours always" and "private".
- [A] If a picture, a first or a seal outlives its letter after a delete, shows in Find after it was hidden, or is missing from an export, the promise breaks quietly.
- Today [F, read in code and branches]: export schema 1.6.0 (`lib/export/schema.ts:90`); `manifest.counts` already has `photos`; the about-day (`occurred_on`, `occurred_precision`, since 1.5.0) and the signature (`author.signs_as`) are already exported. Schema compatibility is one way: each v1 schema closes its objects, so an older schema rejects a newer file, and each export is read with the schema it carries (`schema.ts:13-27`). ADR 0028 is on branch `docs/adr-photo-seal-find-data-11nov` (draft, head `1bee878b`), status "Proposed", accepted under CR-62 but not merged (finding F5, X11). A new synced column not added to the `entries` content trigger tuple (`20261003000000_security_and_family.sql:444-450`) and the `book_entries` view (`20261002020000_data_governance.sql:210`) bypasses `require_content_consent()` and is invisible to the other parent (F12).

### 3. What, and Not in scope
**Rule for every new field or file** (a picture and its copies, a first, a seal, a Find index row, and any later field):
1. It is deleted, hidden, sealed and restored in the same step as its letter.
2. It appears in the export, in a minor bump of its own, readable by the schema it carries.
3. It is found by Find only when the letter is.
4. It has a row in `docs/legal/data-policy.md` section 4 and in `DATA_CLASSIFICATION.md`, in the same PR.
5. It has a level in its migration comment (server `supabase/tests/classification.test.mjs`; the phone class-label check ADR 0028 asks `qa` for).
6. It is inside the 31, 38 and 45-day deletion clock and its receipts (`data-policy.md:187`).
7. It is never in a log (the PRIV-R10 canary covers it).
8. A synced column updates the `entries` content trigger tuple and the `book_entries` view in the same migration.

**The seal clock.** A sealed letter opens at an instant (`seal_opens_at`), stored with the day the parent chose (`seal_opens_on`, display only); the same rule on every phone (ADR 0028 D3, D3a).

**Not in scope.** The features themselves (NS-01, NS-02, NS-06). Typed days, which are settings, not letter data (NS-18).

### 4. Happy path
1. A parent deletes a letter with a picture and a first.
2. The letter, its picture row and three files, its first and its Find row are hidden in one step.
3. Within the Recently deleted window the parent restores it; everything returns.
4. After the window, the purge removes every file and row on the phone; the server holds no picture to purge.
5. An export before the delete carries the picture at its path, the first, and the letter.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| Killed between the picture file write and its row | The launch sweep deletes the file with no row (ADR 0028 D1 kill-safety order) |
| A row whose file is missing | The letter reads whole with no picture; no message |
| Erase everything | The photos folder is deleted by listing it, so strays and copies go; the Find index is dropped before rows are removed (ADR 0028 D5) |
| Account deletion | Phone and server data on the published clock; pictures never reached the server |
| A sealed letter deleted | Recently deleted holds it with no words shown |
| An export opened with an older schema | Rejected by that schema; read by the schema it carries (R7) |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | The first picture or first gets its rows under this rule |
| Empty | n/a |
| Many (1,000 letters, 300 pictures) | Delete, restore and purge in one transaction each; export of 300 pictures holds every stored copy |
| Offline | Delete and restore work; server tombstones follow at sync |
| Slow | n/a |
| Failed | A failed delete leaves everything as it was |
| Interrupted | Each step is one transaction; the sweep finishes file work |
| App killed mid-flow | The sweep and the erase mark make each step safe to repeat |
| App updated mid-flow | A migration never drops a row or file; migrations are never reversed |
| Low storage (under 1 GB, under 50 MB) | Deletion frees space; export checks space first (06-nfr 11.3) |
| Low Power Mode and low battery | No change |
| Two books | Each letter's data follows its own book |
| Two parents | Only the author deletes; the other parent's phone hides the letter at its next pull |
| Expecting parent | n/a |
| Multilingual | n/a |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | n/a (no screen) |
| VoiceOver | n/a |
| Voice Control and Switch Control | n/a |
| Reduce Motion | n/a |
| Dark mode and Increase Contrast | n/a |
| Plan lapsed | Export and deletion are free |
| Signed out | Local data stays (D1); deletion works locally |
| Second account on the same phone | Never sees, claims or uploads the first account's data (`[X4-R1]`) |
| New phone | Pictures stay on the phone that added them; the Find index rebuilds from local letters |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-36-R1a | Given a letter with a picture (the stored copy and both smaller copies), a first and a seal, When it is deleted, Then all are hidden in the same step | P0 (a: yours always) | `[NS-36-R1a] delete hides everything` |
| NS-36-R1b | Given that letter is restored within the Recently deleted window (30 days), Then all come back | P0 (a) | `[NS-36-R1b] restore returns everything` |
| NS-36-R1c | Given the window has passed, Then the purge removes every picture file and row for it on the phone | P0 (b: deletion duty) | `[NS-36-R1c] purge removes picture files` |
| NS-36-R1d | Given any letter, Then the `entry-photos` bucket holds 0 objects for it (ADR 0028 D6 write-deny) | P0 (a: pictures stay on the phone) | `[NS-36-R1d] no picture on the server` |
| NS-36-R2 | Given the export of such a letter, Then every part is in it | P0 (b: LEGAL-REQ-034) | `[NS-36-R2] export holds every part` |
| NS-36-R3 | Given a sealed letter, Then it opens at the same instant on two of the author's own phones set to different time zones (device) | P0 (a) | `[NS-36-R3] seal instant on two phones` |
| NS-36-R4 | Given ADR 0028, Then it is merged on `develop` after its counted reviews, with the X10 classification fix (`entry_media.entry_id`, `draft_id` and `letter_search_rows.entry_id` at L3), before any picture, first or seal is written on a store build | P0 (b) | acceptance record `[NS-36-R4] ADR 0028 merged with the L3 fix before any write` |
| NS-36-R5 | Given export 1.7.0, Then it carries each picture at `photos/<entry_id>/<media_id>.jpg` with the ADR's `photo` object, and a 1.6.0 file still reads; seal fields arrive in 1.8.0 with the seal build, firsts fields in their own minor; the about-day and the signature need no change (exported since 1.5.0 and before) | P0 (b) | `[NS-36-R5] export 1.7.0 golden` |
| NS-36-R6 | Given each new field, Then the same PR adds its row to `docs/legal/data-policy.md` section 4 and to `DATA_CLASSIFICATION.md`; before the first row lands, `privacy` with `data-architect` brings data-policy section 4 to current facts, or the PR names `DATA_CLASSIFICATION.md` as the interim inventory | P0 (b) | inventory check `[NS-36-R6] each new field has its inventory row` |
| NS-36-R7 | Given an export at 1.7.0, Then the 1.6.0 schema rejects it and the 1.7.0 schema it carries reads it | P0 (b) | `[NS-36-R7] export versions one way` |
| NS-36-R8 | Given a letter's Find index row, Then it is deleted, hidden and restored with the letter (ties NS-02-R16) | P0 (a: private) | `[NS-36-R8] Find row follows the letter` |
| NS-36-R9 | Given typed days (NS-18), Then they are settings, not letter data, and follow NS-18-R6 | P1 | `[NS-36-R9] typed days are settings` |
| NS-36-R10 | Given a new column, Then its migration comment states its level and the classification test passes | P0 (b) | `[NS-36-R10] level in the migration` |
| NS-36-R11 | Given a new synced column, Then the same migration updates the `entries` content trigger tuple and the `book_entries` view | P0 (a: consent gate and co-parent visibility) | `[NS-36-R11] trigger tuple and view` |
| NS-36-R12 | Given the log canary, Then no new field's value appears in any log, crash report or analytics event | P0 (a) | `[NS-36-R12] new fields never logged` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Delete and restore commit p95 200 ms on SE 3 (save commit class, 06-nfr 2.2) |
| Memory | n/a |
| On-device storage | Freed on purge |
| Battery | n/a |
| Offline | Delete and restore work offline |
| Accessibility | n/a |
| Localisation | n/a |
| Privacy | R12 |

### 9. State space (RR-5)
| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Delete and restore follow at the next pull; pictures are local to the phone that added them | sync tests |
| Second account on the same phone | Never sees the first account's data | `[X4-R1]` |
| Offline | Local first; tombstones sync later | existing |
| Retry after a lost answer | Idempotent by entry id | existing |
| Sign out | Local data stays (D1) | `[X4-R1]` |
| Account deletion | Published clock; receipts | existing |
| Kill switch (`serverFeaturesEnabled()` off) | Local rules hold | `[NS-36-R1a]` servers off |
| Remote pause (`killSwitches.photos`) | Can hide picture surfaces, never show them; deletion still removes files | NS-01 tests |
| Plan lapse | No effect | n/a |

### 10. Data and engineering
- **Fields.** Pictures: local migration 11 `entry_media` (#835) and files under `Library/Application Support/photos/` (ADR 0028 D1). Firsts: `first_mark`, `first_label` (NS-06 A). Seal: `seal_opens_at`, `seal_opens_on`, `seal_cleared_at`, all L4 (ADR 0028 D3, D3a). Find: `letter_search` (derived, L4) and `letter_search_rows` (ADR 0028 D4).
- **Seal sync.** A row that becomes visible by time has no new sync version, so incremental pull would not fetch it at the instant (F13). ADR 0028 D3 chooses a job, `publish_opened_seals()`; whether `pg_cron` runs on the Supabase Free plan is UNVERIFIED; the alternative is a pull clause returning rows whose `seal_opens_at` falls between the last pull and now. Test `[NS-06-B8b]`.
- **Export.** 1.7.0 pictures only; 1.8.0 seal; firsts in their own minor; rules in the `export/schema.ts` header.
- **Modules.** `lib/photos/*`, `lib/find/*`, `lib/export/*`, `lib/erase-everything.ts`, `supabase/migrations/*`, `supabase/tests/classification.test.mjs`.
- **Rollback.** A flag off hides surfaces; files and rows stay; export and erase still handle them; local migrations are never reversed.

### 11. Data inventory
Each field's row is in its own card (NS-01, NS-02, NS-06) and lands in both inventory files in its PR (R6). This card adds no field.

### 12. Door lines
- **Delete.** Shown: the confirm with "Keep it" the default. Records: the tombstone; no PRIV-R21 row. Never: a delete that leaves a picture file behind. Decline: nothing changes.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| A child's picture | Uploaded to the server | Bucket write-deny (ADR 0028 D6) | `[NS-36-R1d]` |
| Sealed words | Reach another phone early | `book_entries` never shows the seal columns; author-only row | NS-06 SQL tests |
| A new synced column | Bypasses the consent gate | R11 | `[NS-36-R11]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No picture on the server.
- No new field in a log.
- No text field on this card (ruling D2 applies to each field's own card).

### 15. Design inputs
n/a; no screen.

### 16. Content inputs
The account-deletion line `pages.en.ts:240` ("letters, recordings and photos are removed from every book") is checked by `content` when photos ship, since pictures are on the phone only (ADR 0028 D1).

### 17. Legal, privacy and compliance inputs
`data-policy.md` is 1.2.0 and stale on backup (X2); `privacy` brings section 4 current. Counsel: Q51 (deletion exceptions and retention); Q54 when a field changes the label. Counsel must confirm.

### 18. Label effect
**Label effect.** None by itself.

### 19. Claims
Enables: "Delete a letter and everything with it goes" (claims row, after R1a to R1d pass). Forbids: "deleted everywhere instantly".

### 20. Free or Plus
n/a because deletion and export are always free (Terms 8.2).

### 21. Measures with analytics off
Support tally "something I deleted came back" and "something was missing from my copy" (content-free). Target 0.

### 22. Dependencies and gates
ADR 0028 merged (#797, R4); BL-868 (export spec line) before the 1.7.0 export PR; NS-01, NS-02, NS-06.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Seal publication: job or pull clause | `data-architect` with `sync` | The job in ADR 0028 D3, if `pg_cron` is available on the plan in use; otherwise the pull clause |

---

## NS-37. The Book stays fast as it grows (candidate N-06, rank 10)

**Label effect.** None. The smaller copies stay on the phone.

### 1. Who and when
A parent scrolling a Book of years: 1,000 letters and 300 pictures should scroll as easily as 10.

### 2. Why
- The job: "Leave my words and voice for my child's future" (rank 3); the Book must stay readable as it grows.
- [F] 06-nfr: Book first render with 1,200 letters p95 500 ms; Book screen under 120 MB resident without pictures. [A] Pictures are the usual cause of a slow list.
- Today [F]: no smaller copies exist; the photo stack writes the stripped stored copy only (`lib/photos/strip.ts`), and ADR 0028 names no smaller copies.

### 3. What, and Not in scope
**What.**
- The Book list reads the list copy (about 512 px on the long side); the letter page reads the page copy (about 1,280 px); only export reads the stored copy.
- Both copies are made by the stored-copy writer at attach, off the UI thread, stored next to the stored copy as `photos/<media_id>-512.jpg` and `photos/<media_id>-1280.jpg`, with no metadata, excluded from the iPhone backup (`NSURLIsExcludedFromBackupKey`), and not in `Caches` (so the system never purges them mid-scroll). They count in Me, Storage.
- A missing copy is regenerated in the background; the card shows without its thumbnail until then.
- Nothing is decoded while a take is recording.

**Not in scope.** Video. More than one picture per letter. NS-37 stays as locked until NS-52 ships; any budget row that depends on NS-52 (video posters, several pictures) is marked "if NS-52 ships" in the budget file, and no budget is loosened (E52).

### 4. Happy path
1. A parent attaches a picture; the stored copy and both smaller copies are written.
2. The Book scrolls with list copies; a letter opens with its page copy.
3. An export carries the stored copy.

### 5. Unhappy paths and edge cases
| Case | What happens |
|---|---|
| A smaller copy is missing | The card shows without the thumbnail; the copy is regenerated in the background; no error |
| The stored copy is missing | The sweep removes the row and both copies; the letter reads whole with no picture |
| Disk full while making copies | The stored copy is kept if written; copies are made later; no message |
| A recording in progress | No picture is decoded |
| Restore from an iPhone backup | Smaller copies are not in the backup; they are regenerated from the stored copy |

### 6. Scenario coverage
| Scenario | Behaviour |
|---|---|
| First use | The first picture gets both copies |
| Empty | No pictures, no copies |
| Many (1,000 letters, 300 pictures) | R1 and R6 |
| Offline | All local |
| Slow | n/a |
| Failed | A failed copy is retried in the background |
| Interrupted | Copy-making stops when a take starts; resumes after |
| App killed mid-flow | A partial copy file is deleted by the sweep and made again |
| App updated mid-flow | Copies are regenerated if their format changes |
| Low storage (under 1 GB, under 50 MB) | Under 50 MB no new picture is attached (NS-01); existing copies stay |
| Low Power Mode and low battery | Copy regeneration waits for normal power (PROPOSED) |
| Two books | n/a |
| Two parents | Pictures are on the phone that added them only |
| Expecting parent | n/a |
| Multilingual | n/a |
| Largest text size (AX5 plus Bold Text) on iPhone SE 3 | The list copy fits the thumbnail box at any size |
| VoiceOver | n/a; pictures carry the label NS-01 sets |
| Voice Control and Switch Control | n/a |
| Reduce Motion | No fade-in on thumbnails |
| Dark mode and Increase Contrast | A 1 pt hairline frame (NS-01 design) |
| Plan lapsed | No effect |
| Signed out | Copies stay with their pictures (D1) |
| Second account on the same phone | Never sees them (`[X4-R1]`) |
| New phone | Pictures do not move; no copies there |

### 7. Acceptance criteria
| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-37-R1 | Given 1,000 letters with 300 pictures, Then the Book scrolls with no frame over 16.7 ms on an SE 3 (device) | P1 | `[NS-37-R1] Book scroll with pictures` |
| NS-37-R2 | Given a recording in progress, Then no picture is decoded | P0 (c: a take is never put at risk) | `[NS-37-R2] no decode while recording` |
| NS-37-R3 | Given a smaller copy is missing, Then the Book shows the card without the thumbnail and regenerates it in the background, with no error | P1 | `[NS-37-R3] missing copy regenerates` |
| NS-37-R4 | Given the smaller copies, Then they carry no metadata segments and are excluded from the iPhone backup | P0 (a: private) | `[NS-37-R4] copies stripped and not backed up` |
| NS-37-R5 | Given a picture is purged, erased or let go with its draft, Then all three files are removed | P0 (a: yours always; b: deletion) | `[NS-37-R5] copies erased with the picture` |
| NS-37-R6 | Given the Book with 1,200 letters and 300 pictures, Then resident memory is under 150 MB on an SE 3 (PROPOSED; device; the "Book with 300 pictures" number, kept apart from the 120 MB "Book without pictures" number of the NFR file, E52) | P1 | `[NS-37-R6] Book memory with pictures` |
| NS-37-R7 | Given a list copy, Then its first decode is p95 50 ms, off the UI thread (PROPOSED; device) | P1 | `[NS-37-R7] list copy decode` |
| NS-37-R8 | Given the Book list and the letter page, Then the list reads only list copies and the page only page copies; only export reads the stored copy | P1 | `[NS-37-R8] the right copy for each place` |

### 8. Non-functional budgets
| Budget | Value |
|---|---|
| Latency | Book scroll no frame over 16.7 ms (R1); first decode p95 50 ms off the UI thread (R7); Book first render with 1,200 letters p95 500 ms (06-nfr 2.3) |
| Memory | Under 150 MB resident with 300 pictures (R6, PROPOSED: 06-nfr's 120 MB plus 30 MB) |
| On-device storage | List copy about 50 KB, page copy about 250 KB; 300 pictures add about 90 MB [E]. Stored copies about 1.5 to 3 MB each, 300 pictures about 0.5 to 0.9 GB [E] |
| Battery | Copy-making at attach only; regeneration in the background under normal power |
| Offline | All local |
| Accessibility | n/a beyond NS-01 |
| Localisation | n/a |
| Privacy | Log canary: no media id or path in any log |

### 9. State space
n/a because pictures and their copies never sync (NS-01-R15). Second account and sign-out: as NS-01 (`[X4-R1]`).

### 10. Data and engineering
- **Files (new).** `Library/Application Support/photos/<media_id>-512.jpg`, `<media_id>-1280.jpg`, written by the stored-copy writer (#836 or its follow-up; not in #836 today), backup-excluded. No new rows: the copies are derived from `entry_media.id`.
- **Modules.** `lib/photos/{files,attach,baker,lifecycle}.ts`, the photo sweep (#835), the Book list (#840) and the letter page (#839).
- **Migrations.** None (files only). Export: none (copies are not exported).
- **Flags.** Under `EXPO_PUBLIC_PHOTOS`; remote pause `killSwitches.photos` hides, never shows.
- **Error codes.** Copy failures are silent and retried; never logged with a path.

### 11. Data inventory
| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| List copy and page copy of a picture | L4 (a child's image) | `Library/Application Support/photos/`, excluded from the iPhone backup | no | as the stored copy; regenerable | purge, let go, Erase everything (folder listing), app deletion | no | never logged |

### 12. Door lines
n/a because nothing is agreed or shared. Records: on the phone only; no PRIV-R21 row.

### 13. Threats
| Asset | Threat | Control | Test |
|---|---|---|---|
| A child's picture | A copy outlives its stored copy | Same eraser; the sweep removes copies with no row | `[NS-37-R5]` |
| Picture metadata | A copy carries location or device data | Made from the stripped stored copy; scanned for metadata | `[NS-37-R4]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to the system (ruling D3).
- No smaller copy in the iPhone backup, the export or any upload.
- No text field on this card (ruling D2 does not apply).

### 15. Design inputs
States: thumbnail present; thumbnail missing (card without it); 300-picture lens. Smart Invert ignored on thumbnails (NS-33-R11).

### 16. Content inputs
The Storage line in Me counts pictures with their copies as one size (intent: "Pictures on this phone").

### 17. Legal, privacy and compliance inputs
The CPrivO can rule on the copies alone, since they collect less (backup-excluded, regenerable). Counsel: none new.

### 18. Label effect
**Label effect.** None.

### 19. Claims
None new. Forbids "unlimited photos".

### 20. Free or Plus
Free (ruling T2).

### 21. Measures with analytics off
Testers with 20 or more pictures, by hand (D5): "Did the Book ever feel slow (yes / no)?" x of n.

### 22. Dependencies and gates
NS-01 stack (#835, #836, #839, #840); ruling T3 for the stored copy; device rows under D13.

### 23. Open questions
| Question | Owner | Default if unanswered |
|---|---|---|
| Regenerate copies under Low Power Mode | `mobile` | Wait for normal power |

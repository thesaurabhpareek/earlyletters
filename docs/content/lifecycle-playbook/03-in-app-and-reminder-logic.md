# Lifecycle playbook, part 3: in-app and reminder logic

Status: PROPOSED (outside the lock) | 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: building or reviewing a reminder, an in-app line, a day or festival reminder, or the parked server push; or checking what a new message may do.

Part of the lifecycle playbook (`README.md`). Words in this file are intent, never final copy: every parent-facing string is a `packages/content` key that the founder approves (rules test, `docs/product/prd/22-final-holistic-spec.md` section 7, gate G3). Nothing here is built. Nothing here changes a locked row: where it wants a change it writes a "Proposed change" box (section 14) naming the erratum it would need. Not legal advice; every legal reading is "counsel must confirm".

Contents: 1 What this is. 2 The four channels. 3 Message classes. 4 Channel decision table. 5 Eligibility and suppression. 6 Selection and ranking. 7 Cool-downs, never repeating, never counting. 8 A missed day, silence and return. 9 Offline, time zones, daylight saving. 10 Data each rule reads. 11 Events and festivals. 12 Region, background and religion (the rule in one place). 13 Server push, designed and parked. 14 Proposed changes. 15 Conflicts found in sources. 16 Tests. 17 Worked example, the Asha family. 18 What I did not read or verify.

## 1. What this is

One reading of how the product decides whether to tell a parent something, which way, in what words, and when to say nothing. A developer builds from sections 2 to 11; a tester builds from section 16.

What stays true everywhere (all locked, cited once here):
- The machine adds no words. Every title and body is a `packages/content` key (NS-32-R11, NS-13-R24). A selector picks a key; it never writes text.
- No fear, guilt or loss language; no count of days, gaps, streaks, points or badges; celebrate what exists and never count gaps; zero exclamation marks in notifications; ASCII only (CLAUDE.md content rules; NS-13-R5; NS-48-R10 and R4).
- Names off by default: no child name on a lock screen unless the parent turned names on and App lock is off (NS-32-R12, NS-13-R6a). With names off, or App lock on, no title or body carries a month number, an age, a count of months or years, or "A year of letters." (E82, `docs/product/prd/18-errata-after-lock.md` lines 331 to 337).
- One budgeted reminder per phone per local day, across books and classes; 60 pending in total with plan notices first (NS-32-R1, R7; E13).
- No server push in 1.0: no APNs key, no token table, no push entitlement (E79; LEGAL-REQ-054; NS-26 "1.0 rule"). The only 1.0 email is transactional (E75; LEGAL-REQ-053).
- Religion, ethnicity, region and family background are sensitive: only if the parent gives them, off by default, never inferred, never in analytics or logs, changeable and removable (NS-47; `docs/product/prd/functions/cultural-background-data.md`). Section 12 gathers every rule that touches them.

## 2. The four channels, in escalation order

A message starts at the lowest-intrusion channel that does the job. It moves up one step only when its class row in section 4 says so. Law can require more than one channel for the same event (plan notices); nothing optional ever uses two.

| # | Channel | What it is | State at 1.0 | Carries | Never carries |
|---|---|---|---|---|---|
| 1 | In-app line on next open | A calm line on a screen the parent opens: the Home slip slot (one at a time, fixed order, NS-50-R5), a line in Me (Reminders, Days), a line on the Family page (FR-SEC-09, D-S18), the sign-in screen's session lines (E76 item 4; NS-45-R3), the Settings, Plan note (LEGAL-REQ-047) | Built or specified. Needs no permission and no server. Works with notifications denied | A name or date the parent already sees on that screen; one idea | A count of things waiting, a badge, a list, a gap, a feed (NS-50-R11) |
| 2 | Local reminder inside the NS-32 budget | A one-off calendar trigger scheduled on the phone by the pure planner (`apps/mobile/src/lib/reminders/planner.ts`, `scheduler.ts`) | Built for evening, month, birthday; typed days and library days are rows, not shipped (`22` section 4 "Built today") | A content key rendered as neutral or named text; `{source, kind}` payload only (NS-48-R31) | Letter words, a child name by default, a time-sensitive level, a price, Plus, a Keep step (NS-32-R10, R12; NS-13-R11) |
| 3 | Email | Transactional mail from the sender at `hello@` to an address the person gave in the app (E75; `docs/emails/CATALOG.md`) | Built for sign-in, welcome, deletion receipts; plan emails per catalog. Nothing else for 1.0 | The event and one action; no child name, no letter text (LEGAL-REQ-053; CATALOG E-1) | Marketing, product news, tips, re-engagement, a Plus offer, any festival or day mail (E75) |
| 4 | Server push | A notification sent from our server through Apple's push service | DESIGNED, PARKED. No key, no token table, no entitlement (E79). Section 13 | Key-only payload (section 13) | Everything until the reopen test passes |

Escalation rules:
- L-01 A message is placed on the lowest channel its class allows and moves up only through a "yes" in the section 4 table. There is no "retry on a higher channel because the lower one was ignored": we do not know whether anything was read (CATALOG principle 2).
- L-02 No server push is sent, built or scheduled in 1.0 (E79). Where a row seems to want one, it uses channel 1, 2 or 3.
- L-03 Email is transactional only. Every template declares `class: transactional | commercial`; at 1.0 no template is commercial (LEGAL-REQ-053; E75).
- L-04 The event and festival class uses channels 1 and 2 only, now and after any push reopen (section 13.1 says why).

## 3. Message classes

Six classes of message. They are a grouping for this playbook. They add no class to the NS-32 registry (NS-32-R2 and R5; NS-46-R29: `libraryDay` is a ranked source inside the `typedDay` group).

| # | Class | What it is | NS-32 registry row | Who chose it | Examples | Words come from |
|---|---|---|---|---|---|---|
| 1 | Celebration | A month-day or a birthday of an included child | `monthAge`, `birthday` | The parent turned reminders on and left "Month and birthday messages" on (`monthNotes` in `prefs.ts`) | The month note; the birthday note at 09:00 (`BIRTHDAY_TIME`, `planner.ts:139`) | `en.notifications.monthOpen`, `birthday`, `together` (kept outside the catalogue, NS-48-R19) |
| 2 | Gentle reminder | The evening invitation to make a letter; the photo-moment nudge in Drop C | `evening` (lowest priority; the moment pool lives inside it, FR-NTC-22) | The parent answered the reminder ask or turned reminders on | "A minute for today?" | `ntc.*` catalogue (NS-48), the built 8 as floor |
| 3 | Plan notice | A trial, renewal or anniversary notice that the law times | `plan` (outside the budget, its own group of 4) | The parent bought a plan | Trial ending, annual renewal (LEGAL-REQ-047) | Plan reminder keys; no price or child name (NS-32-R12; FR-FIN-09) |
| 4 | Family | Something about the other parent or the book's people | No row. At 1.0 channel 1 and email only (E79) | The parent invited or accepted | Invite accepted (FR-SEC-09); co-parent left (CATALOG `coparent-left`); the other parent's letters appearing in the Book | Existing `en.family.*` keys |
| 5 | Security and account | Sign-in, security change, account life | No row. Email and in-app lines only; never a reminder, never push (E76, E77) | Happens to the account | Sign-in code; email changed; `session_expired`; deletion steps; policy update | Email copy files under `packages/content/src/emails/`; in-app keys |
| 6 | Event or festival | A day the parent typed or ticked: a season, a civic day, a family day, a tradition day | `typedDay` group: a typed day, and `libraryDay` as a ranked source (NS-46-R29) | The parent ticked it. Nothing is ticked for them (NS-46-R2) | Thanksgiving, a season, a family day, a tradition day, a day the parent typed | `days.*` keys (NS-46, NS-47) |

Notes:
- "Family" and "security" never produce a local reminder at 1.0. NS-26's own rules say that if a family reminder is ever built it takes a registry row, a priority, and a place inside the one-a-day budget (NS-26 "What must be true before anyone designs it").
- Apple's own journal suggestion notification (iOS 26) is the system's, outside our budget; no sentence says "one a day" covers it (NS-32 note; NS-49-R22).
- The welcome email and account receipts belong to class 5 (the "account and security notices" half of the LEGAL-REQ-053 list).

## 4. Channel decision table

Y = used. N = never. "In-app" is channel 1, "Local" channel 2, "Email" channel 3, "Push" channel 4. "Parked" means designed in section 13 and not built.

| Event | In-app line | Local reminder | Email | Push | Why, and source |
|---|---|---|---|---|---|
| Evening invitation | N (the Home prompt is the surface, not a message) | Y, class 2 | N | N | NS-13; E75; LEGAL-REQ-054 no promotions |
| Month-day, birthday | N (the Book shows the age by itself) | Y, class 1, days 0 to 35 after the anchor only | N | N | NS-13 section 3a rule 4 |
| Photo moment (Drop C) | Y, inside the capture area only | Y, evening pool, one in 7 days, never after day 35 | N | N | FR-NTC-22, 24; Q-NTC-11, 13 |
| Ticked or typed day | Y, Home slip rank 2b the day it falls (NS-50-R2) | Y, 09:00, one note | N | N, and cannot be (section 13.1) | NS-46-R10; E75; NS-47-R4 |
| Trial or renewal notice | Y, Settings, Plan note and next open inside each window | Y, outside the budget, in its legal window | Y, transactional | N (the catalog's single billing push is superseded by E79, section 15 C-2) | LEGAL-REQ-047, 048; NS-32-R4; `docs/emails/CATALOG.md` section 6 |
| Invite accepted | Y, Family page line with Undo (FR-SEC-09) | N | N | N | NS-25-R4; E79 |
| Co-parent invite sent by typing an address | N | N | Y, `coparent-invite` | N | CATALOG section 5 |
| Co-parent left | N | N | Y, `coparent-left` | N | CATALOG E-5 |
| The other parent wrote a letter | Book only: the letter appears, signed. No Home line (default; decision R-6) | N | N (`family-letter` has no email) | Parked, NS-26 | NS-26; E79; CATALOG section 5 |
| Recording restore request (backup, after the flip) | Y, on the existing device at next open | N | Y | Parked | E79; NS-08-R21; LEGAL-REQ-054 |
| Sign-in code, email changed, other security notices already built | Y where an in-app line exists (`session_expired`) | N | Y, email only; not held by quiet hours | N | E76 items 1 to 4 |
| New-device sign-in | Not for 1.0 | N | Not for 1.0; a gate before the backup flip | N | E78; NS-08-R21 |
| Wrong sign-in codes | Y, "paused" line on the phone | N | N (an attacker could trigger it) | N | E77 |
| Sign out other devices | Y on the other phones once (`session_expired`) | N | N | N | E77; NS-45-R3 |
| Account deletion steps, export ready, policy change | Y, in-app status | N | Y, transactional | N | CATALOG sections 7 and 8; LEGAL-REQ-053 |
| Welcome | N | N | Y, once ever | N | CATALOG `welcome`; E75 |
| Anyone silent beyond day 35 | N: no "we miss you", no count | N after day 35 for evening, month, birthday | N: no re-engagement mail | N | NS-13-R4; E75 |
| Festival greeting or campaign | N | N | N | N | NS-46-R47; DAY 5.1 rule 5 (no greeting) |

## 5. Eligibility and suppression

### 5.1 The pipeline

The planner is a pure function of its inputs (`planReminders`, `planner.ts:289`). It runs at plan time on the phone, for every future date it will schedule, on every store write, foreground, permission change, time zone change, clock change, restore and first launch after an update (NS-13-R21; NS-32-R16; NS-48-R3). A candidate that fails a gate is dropped. It leaves no record, no counter and no carried-over debt (L-29).

Order of evaluation:

| Stage | Gate | Rule | Source |
|---|---|---|---|
| P0 | Freeze inputs | One injected clock, the phone's time zone, permission state, flags, the prefs listed in section 10 | `PlanInput`, `planner.ts:73` |
| P1 | Switches | L-10: library days need `EXPO_PUBLIC_DAYS` on and `killSwitches.libraryDays !== true`; the pause is fail-open and read outside `mayRun` | NS-46-R28 |
| P2 | Permission | L-11: notifications not allowed means no local candidate is scheduled; in-app lines are unaffected; ticking still works with one calm line | NS-13-R16; NS-46-R31 |
| P3 | Class switch | L-12: evening, month and birthday need reminders on and not paused; month and birthday also need "Month and birthday messages" on; typed and library days use their own day-only gate and still plan when reminders are off; a paused celebrations setting on this phone silences library days | NS-13-R17; NS-46-R31, R49; E57; E64 |
| P4 | Book | L-13: per child, a hidden book is never reminded; a quieted book adds no budgeted class, no slip and no prompt; a book with "Include in my reminders" off is not a subject; with every included book quiet or hidden no library note goes; an expecting book (due date only) gets evening only, no month, no birthday, no due-date or pregnancy word | NS-32-R14; NS-13-R10, R12; NS-46-R25; NS-48-R21, R36 |
| P5 | Back-off | L-14: evening, month and birthday stop after day 35 from the anchor; days 8 to 35 hold at most one evening in each 7-day block; typed days, library days and plan notices are never stopped by it | NS-13-R3, R4, R18; NS-32-R8, R9; NS-48-R8 |
| P6 | Smart quiet | L-15: no evening within 20 hours of the newest own made letter (draft waiting at Keep or held counts), or within 2 hours of the app coming to the foreground | NS-13-R8, R27, R32; `planner.ts:140, 141` |
| P7 | Window | L-16: every time sits inside 07:00 to 21:30 local in 15-minute steps; a library day is 09:00 clamped into the parent's window; plan notices keep their own windows | NS-13-R30; NS-46-R10; `planner.ts:132, 133` |
| P8 | Resolve dates | L-17: each ticked day resolves to its next date from rule, astronomical instant or table, the parent's override first; a day with no date for the coming year plans nothing and leaves one calm line | NS-46-R6, R11, R12, R14, R15 |
| P9 | Merge | L-18: same class, same date, merge: two children's month-days become one note; two library days become one note naming both after the tap; a birthday and a month-day of one child become one note with the birthday copy | NS-32-R1b; NS-13-R28; NS-46-R8, R39 |
| P10 | One a day | L-19: `chooseOnePerDay` picks the highest rank (section 6.1); the others are dropped for that date | NS-32-R1, R3; NS-46-R7, R30 |
| P11 | Ceiling | L-20: at most 60 pending in total; up to 4 plan notices kept first; the nearest 60 budgeted notes by fire date stay; later ones return at the next re-plan | NS-32-R4b, R7; E13; NS-46-R9; Q-QA-4 |
| P12 | Words | L-21 to L-26: choose the key, then neutralise (section 6.4) | NS-48; NS-47-R12, R13 |
| P13 | Schedule | L-26, L-27: interruption level `active`, category with the neutral hidden-preview placeholder, payload `{source, kind}`, identifier `el.day.<isoDate>` for days | NS-32-R10, R13; NS-46-R32; NS-48-R16, R31 |

### 5.2 Suppression matrix

Rows are the conditions the founder named. A cell says what happens to each message surface.

| Condition | Evening | Month, birthday | Typed or library day | Plan notice | In-app lines |
|---|---|---|---|---|---|
| Quiet hours (21:30 to 07:00) | Never scheduled in it; the picker offers no such hour (NS-13-R30) | Same | Same; library day at 09:00 | Fires inside its legal window; "never in quiet hours" (NS-32 section 2) | Not time-bound |
| Reminders off or paused | Nothing pending (NS-13-R17) | Nothing | Still plans if notifications are allowed (NS-46-R31); a paused celebrations setting silences library days (E57) | Unaffected | Me, Reminders and Me, Days each say in one calm line that chosen days still send a reminder and where to stop it (NS-46-R35) |
| Hard-day tools: Quiet this book | The book adds nothing (NS-32-R14) | Nothing for that book (NS-13-R12) | No library note for that book; none at all if every included book is quiet (NS-46-R25) | Unaffected (not about a book) | No day slip, no past letter (R-IA-6; NS-50-R8; NS-23-R8) |
| Hard-day tools: hidden book, Include off | Not a subject | Not a subject | Not a subject | Unaffected | Not shown |
| "Not much today" | An own entry of kind `not_much` is a save in `lastOwnSaveAt` (code read, `prefs.ts:131-142`), so smart quiet treats it as one. See Proposed change PC-4 for the anchor | Unaffected | Unaffected | Unaffected | Home stays as it is |
| App lock on | Names off, neutral rendering (NS-13 edge; `prefs.ts:117-118`) | Same | Every title is the one neutral title; the day-name switch is forced off and never turns itself on (NS-47-R12, R13; NS-46-R36) | A plan notice never carries a name, count or price (NS-32-R12) | App-switcher snapshot blank on screens that carry a day name, with or without App lock (E18; NS-47-R26) |
| Notification permission off | Nothing scheduled (NS-13-R16) | Nothing | Ticks stored, nothing scheduled; one calm line; no promise of delivery; the Days ask is not shown (NS-46-R31; NS-47-R19) | Settings, Plan shows the date (NS-32-R4) | Unaffected |
| Names off (the default) | Neutral rendering of every key; no title carries `{child}` (NS-48-R11, R13) | No month number, age, "A year of letters." (E82) | Neutral body; day name only as section 6.4 says | No name | Words may name the child on an unlocked screen |
| Language | Interface English at 1.0 (FR-LOC-10); `{weekday}`, `{day}`, `{date}` render in `en`, `gregory`, Latin digits (NS-48-R34) | Same | Names of days from other languages keep the family's spelling as data (FR-DAY-19) | English | English |
| Child age | Band by the age the Book shows on the fire date (NS-48-R7, Q-NTC-9); no age norm words (NS-48-R30) | Month number only with names on and App lock off (E82); no month note before a birth date | Not an input | Not an input | Not an input |
| Plan (Free, trial, Plus, lapsed) | No effect; no Plus, price or Keep step in any string (NS-13-R11) | Same | Free; no entitlement check (NS-46-R27) | Exists only after a purchase; stops when StoreKit stops reporting a renewing plan (NS-32 scenarios) | Same |
| Region or background given | Never an input to the evening reminder | Never | Only through the parent's ticks and date choices (section 12) | Never | Never |
| Region or background not given | No change | No change | Nothing is offered or scheduled that the parent did not tick; nothing is guessed (L-35) | No change | Home is unchanged |

## 6. Selection and ranking

### 6.1 The one-a-day order

When several candidates share a local date, one is sent.

| Rank | Source | Registry | Source of the order |
|---|---|---|---|
| 0 (outside the budget) | Plan notice | `plan` | NS-32 section 3: ranked above everything, never dropped or delayed by the budget; on that day the budgeted one may also fire, so a day carries at most 2 |
| 1 | A day the parent typed | `typedDay` | NS-46-R7; NS-13-R29 |
| 2 | Birthday | `birthday` | NS-46-R7 (a first birthday on a ticked day is sent; the library day yields) |
| 3 | A ticked library day | `typedDay` group, source `libraryDay` | NS-46-R7, R29; DL-2 |
| 4 | Month-day | `monthAge` | NS-46-R7 |
| 5 | Evening (including the photo-moment pool) | `evening` | NS-46-R7; FR-NTC-22 |

```
chooseOnePerDay(candidates, planNoticeCount):
  group candidates by local date
  for each date:
    merge same-source candidates (children, library days)      # L-18
    keep the one with the lowest rank number                    # L-19
    plan notices are never in this set; they are added after
  keep the nearest (60 - planNoticeCount) by fire date          # L-20
  return plan notices + kept candidates
```

`budget.ts` is the single home of this rule (NS-46-R30; NS-48-R26). It is a hard prerequisite of NS-46 and NS-48, and is enforced nowhere today (`22` section 4 "Built today"). A property test over random plans finds no local date with two budgeted notes.

### 6.2 Which words, for an evening reminder

Layers, in order; the first layer that returns a non-empty pool wins (NS-48 section 3, items 2 and 3; `functions/notification-catalogue.md` section 3.4):

1. Occasion layer: only for a library or typed day, and by PC-2 it returns `days.*` keys, not a second key family.
2. Last-letter layer (Drop C): recency r1 or r2 only; kinds `spoke` and `typed`, and `first` and `small` only with names on and App lock off (NS-48-R5; Q-FD-29). `picture` is not a kind (NS-48-R5; FR-NTC-29). Age band: see PC-1.
3. Grid layer: weekday tone by recency band (r1 the next day, r2 days 2 to 6, r3 days 7 to 14, r4 days 15 to 35), 6 lines a cell (NS-48-R3; N-1).
4. Floor: the built 8 evening lines, with the day-part filter (NS-48-R15, R33).

Filters in each pool: day part first (evening-worded lines drop before 17:00, NS-48-R12), then names (a line with no neutral rendering drops when names are off).

Selection inside a pool is a pure function of the cell and `slotOrdinal(date, weekdays)`. No "last chosen key" is stored (NS-48-R32; RV-14). The earlier `previousKey` input in the function review is superseded by R32 (section 15, C-5).

### 6.3 Which day wins for a date, and which words

1. Collect ticked days whose effective local date is the date (section 11.3).
2. Zero: nothing from this source.
3. One or more: one candidate named by all of them, rank 3 (rank 1 if any is a typed day).
4. The tone is `quiet` if any named day is `quiet` (Memorial Day, Veterans Day, Good Friday, Yom Kippur, a national day naming a loss, NS-46-R16).

### 6.4 Neutralising: the render states

Applied last, after the choice (P12). One neutral title, one neutral body per tone, each a single string for every layer (NS-47-R12; NS-46-R37). Proposed keys: `days.lock.title.neutral`, `days.lock.body.neutral`, `days.lock.title.twoDays`.

| App lock | Day-name switch (`notifications.dayNames`) | A day on the allowlist (`publicTitleOk`: seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) | Any other day (family, civic, tradition, culture-led, national) | Typed day |
|---|---|---|---|---|
| On | Off, forced | Neutral title, neutral body | Neutral title, neutral body | Fixed neutral line |
| Off | Off (default) | Title may be the day's name; body is `days.lock.body.neutral`, no child name | Neutral title, neutral body | Fixed neutral line |
| Off | On | Day's name in the title | Day's name in the title; body `days.lock.body.neutral`, no child name | Parent's words after the tap; on the lock screen only behind this switch (NS-47-R37) |

Rules that hold in every cell:
- L-22 With names off, no title or body carries a child name and no new catalogue title carries a `{child}` slot (NS-48-R11).
- L-23 With names off or App lock on, no title or body carries a digit that is an age, a month number, a count of months or years, or "A year of letters." The names-off test is: no digit and no "year" in any lock-screen string (E82; BL-966 test).
- L-24 No lock-screen title or body holds both a day name (of a non-allowlist day) and a child name; the body beside any title that holds a day name has no `{child}` in any switch state (NS-47-R38; E45).
- A `quiet` day's neutral body is "The book is open if you want it." (intent) with no question mark and no invitation to write (NS-46-R37).
- No category sets `hiddenPreviewsShowTitle`, so with Show Previews hidden the placeholder is the only text (NS-47-R36).
- Two ticked days on one date: neutral title; both names after the tap, joined by an English list format, never joined in code (NS-46-R8, R39).

## 7. Cool-downs, never repeating, never counting

| Rule | Value | Source |
|---|---|---|
| Smart quiet | 20 h after the newest own made letter; 2 h after foreground | NS-13-R32; `planner.ts:140, 141` |
| Evening back-off | Days 1 to 7 on cadence, days 8 to 35 one per 7-day block, then none | NS-13 section 3a |
| No body twice running | Two consecutive nudges differ; no title twice running | NS-13-R2; NS-48-R14 |
| No repeat inside a pool | n consecutive slots give n distinct keys; the same shape is never used three times in a row over 365 slots | NS-48-R14 |
| Stateless choice | The line is a pure function of the cell and `slotOrdinal`; nothing about the last key is stored, so a store write never rewrites every pending note | NS-48-R32; RV-14 |
| Library day, once a year | A ticked day recurs yearly; its lines are chosen by year (PC-3), so the same day shows n different lines in n consecutive years. The lock-screen string is one per tone and does not vary (NS-47-R12) | NS-46-R5b; DL-5 (4 per day, 3 per season) |
| Photo moments | At most one nudge in any 7 days; none after day 35; never revived by new pictures while the app is unopened | FR-NTC-24; Q-NTC-11, 13 |
| Reminder ask | At most 2 showings ever; "No reminders" counts as an answer | NS-13-R31 |
| Days ask | After the first kept letter, in a later sitting, once; retired after two unanswered showings; never in the sitting where the Keep gate, the reminder ask or the rating request showed | NS-47-R19, R31; NS-50-R16 |
| Asks never stack | Order: reminder prime, Days ask, analytics consent, each in a later sitting | NS-47-R33; Q-AN-3 |
| Home slip dismissal | "Not today" hides it until the next local day; keyed to the local date so a zone change does not resurface it | NS-50-R7; `21` NS-50 section 5 |
| Plan notices | Once per event inside its window | LEGAL-REQ-047 |
| Email | One event, one email; an idempotency key per event; nothing re-sent because it was not opened | CATALOG principle 2 |

Never counting (L-29):
- A dropped candidate leaves nothing behind: no queue, no "owed" note, no missed-note counter, no stored reason. The next plan is a pure function of present inputs.
- No string, screen, slip, label or analytics event holds a count of days, gaps, misses, ticked days or things waiting (NS-13-R5; NS-46-R3, R15, R22; NS-50-R2, R11, R17; NS-47-R9).
- No analytics event exists for a reminder, a slip or a day note: `libraryDay`, `typedDay`, `birthday` and `monthAge` are the four never-reported kinds (NS-46-R34). Analytics is off through 1.0 (D-124).

## 8. A missed day, silence and return

### 8.1 Lifecycle stage as derived state

No stage is stored. Each is read from phone data at plan time.

| Stage | Derived from | Local reminders | In-app | Email |
|---|---|---|---|---|
| New | No letter made; reminders turned on today (anchor is `reminders.onSince`, NS-13 3a) | Per the parent's cadence once reminders are on | Reminder ask after the first kept letter (cap 2) | Welcome once |
| Active | A letter made within the last 7 days | Days 1 to 7 on cadence | Home as normal | None |
| Easing | Day 8 to 35 since the anchor | One evening per 7-day block; month and birthday still sent through day 35 | Home as normal | None |
| Quiet | Beyond day 35 with no letter and reminders not turned on again | No evening, month or birthday; typed days, library days and plan notices continue | Home as normal; no line about the gap | None; no re-engagement (E75) |
| Expecting | A book with a due date and no birth date | Evening only; no month or birthday; no pregnancy or due-date word (NS-13-R10; NS-48-R36) | Prompts per the expecting rules | None |
| Born | Birth date set (the "was born" conversion, `packages/core/src/child.ts:140`) | Month and birthday notes begin | Same | None |
| Plan states | StoreKit on this phone: none, trial, Plus, lapsed | Plan notices in their windows only while a plan renews | Settings, Plan note | Per CATALOG section 6 |

### 8.2 What happens on a missed day

| Case | What happens | Source |
|---|---|---|
| The evening slot passes with no letter | Nothing is carried. The next slot is already in the plan; its recency band is one step wider; its words never mention the gap | NS-13 section 5; NS-48-R4 |
| A parent is silent for weeks | The plan on the phone already holds the back-off; after day 35 nothing evening, month or birthday remains, whether or not the app is opened | NS-13-R18; NS-32-R8 |
| Notifications are not allowed that day | Nothing later makes up for it; Home still shows the day slip if the app is opened that day | NS-46 section 5 |
| A ticked day falls while the app is unopened | Its note is already pending if inside the planning horizon (366 days within the ceiling). A day beyond the horizon is not pending until the next open, said plainly on the Days page | NS-46-R10; Q-FD-22 |
| The phone was off at fire time | The app schedules no catch-up. What iOS does with a missed calendar trigger is UNVERIFIED; the device row decides. Never two on one local day | NS-13 section 5 (date skipped) |
| A month note or birthday note was missed | Not resent. The next month's note comes on its own day; the Book shows the age by itself | NS-13 3a |
| A day note was suppressed by a birthday | The library day yields that year; the next year returns; no record of the yield | NS-46-R7 |
| The app is updated, restored, the zone or clock changes | Every pending note is re-planned from present inputs | NS-13-R21; NS-32-R16; NS-48-R3 |
| The parent returns after silence | Home is as always. No "welcome back", no count of time away, no notification about it. A made letter, or turning reminders on again, moves the anchor and the next re-plan schedules days 1 to 35 from it | NS-13 section 5; VOICE no-guilt rule |
| Reminders were off, then turned on | The anchor resets to that day | NS-13 section 5 |
| Two phones, same account | A letter on phone A removes phone B's nudge only after B's next pull and re-plan; an offline B may still remind | NS-13-R25 |

## 9. Offline, time zones, daylight saving

- Everything in sections 5 to 8 is local and needs no network. The only server-to-phone input is the remote pause, which fails open (NS-46-R28). A refresh of the days table is one whole-library fetch with no query derived from ticks (NS-46-R48).
- A local reminder is a one-off calendar trigger with no zone; it fires at that wall-clock time on that date wherever the phone is (NS-13 section 3 "Built today"; `scheduler.ts:13`).
- Time zone change: the next reminder fires at the chosen wall-clock hour in the new zone; none fires between 21:30 and 07:00 local; no local date delivers two budgeted notes (NS-13-R7; NS-32-R6). The plan is rebuilt on a time zone change and on a clock change (NS-48-R3).
- Daylight saving: floating triggers hold the chosen hour; the window excludes 02:00 to 03:00 (NS-13 section 5). Plan notices use absolute UTC windows and are tested over DST and a leap day (LEGAL-REQ-047).
- A date skipped by crossing the date line eastward: UNVERIFIED iOS behaviour; the note is not delivered or delivered once late; never two in one local day (NS-13 section 5).
- The anchor is the newest made letter's `captured_at` local date in the phone's zone, never after the plan date; `occurredOn` is not used because "another day" can change it (NS-48-R3; K11).
- Astronomical days (the four seasons) are stored as one UTC instant and shown on the phone's own local date. The September 2027 equinox, 23 Sep 06:02 UTC, is 22 Sep on Pacific time and 23 Sep on Eastern time (NS-46-R11; DAY section 3.4). If a parent changes zone, the next re-plan may move such a note by one local date; that is accepted and not announced.
- Fixed and rule days (Independence Day, Thanksgiving) stay on their calendar date. Lunar and lunisolar days come from a dated table per year and are shown "around" (NS-46-R14). A day that begins at sundown is scheduled on its daytime date; no sunset or location is used (NS-46-R10).
- Dates and weekday names render in English, Gregorian, Latin digits whatever the phone's language or calendar (NS-48-R34; K12).

## 10. Data each rule reads

"Leaves the phone" answers whether the value is sent to us, to a vendor or to a server by any path in this playbook. Classes follow `docs/legal/DATA_CLASSIFICATION.md` as quoted by the cards (L2, L3, L4). I did not re-read the classification file.

| Field | Where it lives | Class | Leaves the phone? | Read by rule |
|---|---|---|---|---|
| Reminders on or off, paused, cadence, weekdays, time, `monthNotes`, `onSince` | `settings` table, `reminders.*` (`prefs.ts`) | L3 settings | No; reminder settings do not sync (NS-13-R22) | L-12, L-14, L-16 |
| Names in notifications (`notifications.lockScreenNames`) | `settings` | L3 | No | L-22, L-23 |
| Day-name switch (`notifications.dayNames`, PROPOSED) | `settings` | L3 | No | L-24 |
| App lock state | App lock prefs (`appLockOn`) | L3 | No | L-22, L-24 |
| Quiet, hidden, "Include in my reminders" | `child_member_prefs.quiet_at` read as `Child.quiet`; `Child.remindersOn`; hidden flag | L3 | These are existing per-member prefs that may sync with the book; the playbook adds no copy and no field. Which of them sync: UNVERIFIED (not read) | L-13 |
| Celebrations paused | The phone owns it in the first build; server column `child_member_prefs.celebrations_paused` is a mirror with no reader in Drop A | L3 | No reader of the server copy (E64) | L-12 |
| Child birth date, due date | Local database (the book) | L4 as part of the child record | Existing book sync; the planner only reads | L-13, L-23 |
| Child name | Local database | L4 | Existing; never in any reminder by default; never in email (CATALOG E-1) | L-22 |
| Newest made letter: date and kind | Computed at plan time from the local database (`lastMadeLetter()`, NS-48-R27) | Derived | No; the letter's text is never read (NS-48-R5) | L-14, L-15, section 6.2 |
| Foreground time | Phone memory | n/a | No | L-15 |
| Notification permission | The OS | n/a | No | L-11 |
| Days store: ticked day ids, date overrides, calendar-authority choices, hemisphere choice | One file in Application Support, outside `scribe.db`, excluded from the iPhone backup, per account | L4 | Never: not synced, not exported, not logged, not in analytics, not in a URL (NS-47-R1, R4, R6, R10) | L-17, L-24, L-33, L-34 |
| `culture.asked` | `settings`, per account | L2 | No; holds no tradition, same value after either answer (NS-47-R2) | Days ask only |
| Browse filter (a tradition or country the parent looks at) | Component memory | L4 | Forgotten when the sheet closes; no route parameter, no persisted state (NS-47-R2) | None at plan time |
| The days library (names, rules, tables) | `packages/content/src/days/`, in the app bundle | Content | Server to phone only, one whole-library file (NS-46-R48) | L-17 |
| Remote pause `killSwitches.libraryDays` | Signed remote config | Config | Server to phone | L-10 |
| Interface language, time zone, locale | The OS | n/a | Not to us; never prefill region or tradition (NS-47-R20) | L-31, section 9 |
| StoreKit plan state | The OS | n/a | Existing plan flow | Plan notices |
| Sign-up region check result | Server-side hook (E47, NS-40-R9); nothing on the phone | n/a | It is a sign-up gate, not a content signal | None: L-34 forbids using it |
| Email address | Account | L3 | It is the transport for channel 3 only | Email class rules |

## 11. Events and festivals

### 11.1 What part 04 must supply

`04-events-and-festivals-usa.md` is the calendar. This file is the logic. A day row, as the cards define it (NS-46-R1; `functions/days-library.md` section 3.1), carries: `id`, `layer` (seasonal, family, civic, tradition, culture, national), `nameKey`, a rule (`fixed`, `nthWeekday`, `lastWeekday`, `afterLabor`, `astro`) or a `table` with an `authority` and a country or tradition on each row, `precision` (`exact` or `about`), `beginsAtSunset`, `tone` (`bright` or `quiet`), `publicTitleOk` (a hand-listed allowlist, NS-46-R36), `preTicked: false` always, and a `years` list; cells are a date or the literal `n/r` (no date written from memory). If part 04 differs, the cards win. The order in which part 04 should read: seasonal and shared (Drop B), family and civic (Drop B), then traditions and culture-led days (Drop C, each after a recorded reviewer, NS-46-R23). US only until the founder names a second country (DL-7; NS-47-R35).

### 11.2 Offered is not scheduled

- The library is offered. Only a tick schedules (NS-46-R2). Nothing is pre-ticked, not even Mother's Day. A test fails if any row has `preTicked` true.
- A parent who ticks nothing gets nothing, including Thanksgiving. The evening reminder, Home and every other surface are unchanged (section 5.2 last row).
- The app never says a day is missing, counts what is ticked, or offers "complete your list" (NS-46-R19).

### 11.3 How a library day is chosen for a date

1. Take the phone's local date D and the parent's ticked ids.
2. For each id, find its row in the bundled table. A row whose id is gone after an update is dropped silently (NS-46-R43).
3. Resolve the effective date for D's year, first match wins: the parent's "always" or "this year" date; else the row for the calendar authority the parent chose when ticking; else the first listed row (section 11.4); else rule or astronomical conversion into the phone's local date. No date for the coming year: plan nothing and show one calm line (NS-46-R15).
4. Keep ids whose effective date equals D. Remove ids the parent turned off for this year.
5. Drop the whole source for D if a book gate (P4) fails, or if a birthday or a typed day falls on D (they outrank, section 6.1).
6. Merge what is left into one candidate at 09:00 local clamped into the window (NS-46-R10).
7. Choose the lock-screen render by the table in section 6.4, and the Home day slip line by tone and year (PC-3).
8. On the day, Home shows the day slip (rank 2b) by whichever route the parent arrives, never from the payload (NS-50-R4; NS-46-R32).

### 11.4 What selects a variant, and what the fallback is

The founder asked for variants by region and religion "if the customer gives". The locked answer is narrower and safer: the app does not store a religion or a region as a field (Q-FD-5, CL-013; NS-47-R2). The tradition and country a parent picks are a browse filter held in memory until the sheet closes. So no rule can select a variant by "the parent's religion", because that value does not exist on the phone. What selects a variant is only what the parent ticked and the date choices they made.

| Selector | Who sets it | Stored | Effect | Fallback when not given |
|---|---|---|---|---|
| The ticked day ids | The parent, one tap each | Days store (L4) | Which days exist for this phone at all | None ticked: no festival content anywhere |
| Which calendar list (authority) where two read lists disagree (Eid al-Fitr 2026, Diwali 2027, the Buddha's birthday every year) | The parent, answering "Dates differ by country. Which date should we use?" (a question about a date, never about belief or family) | Days store, with the tick | Which date row the note uses | The first listed row for the day; shown "around"; the parent can move it (DAY 3.5; NS-46 section 5) |
| A moved date, one year or always | The parent | Days store | The parent's date wins over every table | The table date |
| Hemisphere (season names) | The parent, a segmented control; nothing selected by default, never inferred from time zone or locale | Days store | Season names follow it: March equinox reads as spring or autumn | Northern names with a small line "northern hemisphere seasons" until switched (DAY 3.4; NS-46-R11, R26) |
| Country | Absent until a second country ships (NS-47-R35) | n/a at 1.0 | US rows only | US rows; the Days page never asks where the parent lives |
| Tradition | A browse filter only, in memory | Not stored | Orders the Browse list while the sheet is open; afterwards Browse order follows the days already ticked (NS-46-R20) | Alphabetical, equal weight, never by size |
| Layer, tone, `publicTitleOk` | The data row, set by `content` and reviewed | The bundle | Which render state applies (section 6.4); `quiet` tone | Not parent-settable |
| Locale, storefront, time zone, device region | Never an input to any choice of days or words (NS-47-R20) | n/a | Time zone only converts an astronomical instant and fires a wall-clock hour | n/a |
| Interface language | The OS | n/a | English names at 1.0 | n/a |

The neutral fallback is a line, never a guess (L-35): the neutral title and body of section 6.4, then, unlocked, the day's name and the one landing line for its tone. No default tradition, no default country, no "popular days" list, no greeting, no explanation of what a day means (DAY 5.2).

A ticked tradition day does imply a belief to anyone who can read the store. That is why the store is L4, phone only, and why nothing about it reaches the child, a book, a letter, analytics, a log or a notification title (NS-47-R1 to R3). Counsel must confirm the GDPR Article 9 and US state readings before the flag turns on (CUL-Q6, Q7, Q11).

### 11.5 How an observance is dropped when the parent turns it off

| Trigger | Effect, timing | Source |
|---|---|---|
| Untick on Browse or Remove on the day's page | Its pending note is cancelled at once; the re-plan runs within 1.5 s | NS-46 section 5; NS-46-R33; NS-47-R21 |
| "Off this year" | That year's note is dropped; next year returns | Days store override (NS-46 section 10) |
| "Clear all" (one confirm) | Every tick removed, every pending note cancelled, every delivered one dismissed | NS-47-R21 |
| A day-name switch turned off | Titles revert to neutral at the next re-plan | NS-47-R12 |
| App lock turned on | The stored day-name value is set to off; turning App lock off never turns it on | NS-47-R12 |
| A table update removes a day | The id is dropped silently; no line says it is missing | NS-46-R43 |
| Remote pause `killSwitches.libraryDays` | Library and ask slip absent at the next focus; pending library notes cancelled at the next re-plan; typed days and reminders unaffected | NS-46-R28 |
| Notifications turned off in iOS | Ticks stay; nothing arrives; one calm line | NS-46-R31 |
| Sign-out, a session ended by the system | Store and pending notes cleared at that moment; delivered ones dismissed; the system-ended case shows one calm line next time Days opens (default pending founder: Q-FD-12) | NS-47-R15 |
| Erase everything, Delete account | Store gone; other phones clear it when their session ends; the delete line is "We keep nothing about the days you chose; it was only ever on your phones" (intent) | NS-47-R16, R17 |

Dropping leaves no trace: no "removed" record, no count, no event.

### 11.6 Typed days are a different thing

A day the parent types (NS-18) is one-off, deleted the day after delivery, in the parent's own words, shown after the tap, and follows the day-name switch (NS-47-R37; E45). A ticked library day recurs yearly and carries only a name from the library. One Days page lists both in two sections ("Days you added", "Days you chose"; NS-46-R3). The two stores stay separate (CB-2).

### 11.7 The tap

A tap on a library-day note opens Home within 2 seconds on an SE 3. Payload `{source, kind: 'libraryDay'}`; identifier `el.day.<isoDate>`; no day id, tradition, key or layer in `identifier`, `data`, `threadIdentifier`, `categoryIdentifier` or a route parameter (NS-46-R32; NS-48-R31). The prompt shown is an ordinary prompt from the existing catalogue; `entries.prompt_key` and every synced entry field are identical to a letter written on any other evening (NS-47-R5).

## 12. Region, background and religion: the rules in one place

Pre-conditions, not suggestions. Each is "counsel must confirm" where it is a legal reading.

1. Only if the parent chooses to give it, and the app is unchanged if they do not. "Not now" is a full answer of equal weight (NS-47-R20, R30).
2. Never in first run (NS-47-R18), never from a notification, email or banner, once in a later sitting after the first kept letter, retired after two showings (NS-47-R19, R31).
3. Stored as ticked days only, L4, phone only, outside the iPhone backup, per account (NS-47-R1, R6). Read where: on the phone only; the server never receives it, even as a request (NS-47-R4). If the founder rules to keep fields, each gets a registry row and a Clear control, and counsel's CUL-Q6 and Q7 answers gate the flag (CUL-Q2).
4. Never inferred, never prefilled from device locale, storefront, time zone or sign-up country (NS-47-R20). The sign-up region hook (E47; NS-40-R9) is a gate that stores nothing on the phone and is never a content signal. I do not invent a location permission: the app asks for none and the playbook needs none.
5. Region at 1.0 means the parent's own hemisphere switch for season names, and US days. A second country needs the founder to name it (Q-FD-16; NS-47-R35).
6. Nothing implies belief or assigns a faith to the child: no tradition on a child, a book, a letter, a share or a screen word ("your child's festival") (NS-47-R3; FR-CUL-03). No greeting, no explanation, no "celebrate" (the verb is "mark", DAY 5.2).
7. Changeable and removable in one tap, with Clear all (NS-47-R21).
8. Not in analytics, logs, crash reports, URLs, route parameters, notification identifiers, the Save a copy file, a backup, support mail or an email (NS-47-R4, R8, R9, R10; NS-46-R34).
9. No marketing use, no ads, no store screenshot of a tradition, no seasonal or religious-day campaign, no email on a day (NS-46-R47; E75; LEGAL-REQ-016).
10. Counsel and privacy read before any build outside the founder's family: CUL-Q5, Q6, Q7, Q11, Q-DAY-6, Q-DAY-9, Q-DAY-10, Q-DAY-11, the consent line (DPLA Attachment 1 section 2.2), a recorded tradition reviewer per tradition, and the J-CUL-01 device walk (NS-47 section 13; `22` section 6).
11. Fixtures never pair a real tradition with Asha. Tests use synthetic ids such as `zz-test-day-a` (FR-CUL-08; NS-46-R8).

## 13. Server push, designed and parked

E79 and LEGAL-REQ-054: nothing here is built, scheduled, or allowed in any wave. This section is the design that a later reopen can pick up, and the checklist it must pass.

### 13.1 What push can and cannot carry

- An event or festival reminder can never be a server push. The server would have to know which days the parent ticked, and the store never leaves the phone (NS-47-R4). A silent "wake-up" push is not available either: no background modes in 1.x (NS-49-R25). The class stays local for good.
- A push can only carry an event the server already knows: the other parent made a letter (F11), a recording restore was requested (NS-08), a security alert. Plan notices stay local because StoreKit is on the phone (LEGAL-REQ-047), so the catalog's one billing push is not needed (section 15 C-2).

### 13.2 Payload rules (the same keys, later)

- The payload carries a category and a content key, nothing else: no letter text, transcript, audio reference, picture, child name, id, count or date (LEGAL-REQ-054, LEGAL-REQ-014; D-025 keeps names out of every server push; CATALOG E-1).
- The same key family serves every channel for one event: `family.letter.line` (in-app), `family.letter.push` (the push text), with the same neutral rendering rule as reminders. The rules test and the neutral-rendering test cover push keys exactly as they cover reminder keys (NS-48-R28 scope extended). A parity test fails if a push key does not exist in `packages/content` or fails the notification rules.
- Two ways to show the text; the choice is open and UNVERIFIED (no Apple documentation was read for this file): (A) the alert text is a fixed generic string shipped in the payload from a signed manifest; (B) the payload names a localisation key that the app resolves from its own strings, which would need a generated strings resource from the content keys. `mobile` and `security-architect` read Apple's payload documentation before choosing. Default: B if feasible, else A with strings generated from the same content keys.
- Interruption level `active`, never time-sensitive; the category carries the neutral hidden-preview placeholder and never sets `hiddenPreviewsShowTitle` (NS-26 "Rules if built"; NS-47-R36).
- No promotional push in v1 (LEGAL-REQ-054; Apple 4.5.4 as read by the cards: not for sensitive information).

### 13.3 Token table

If built: one new migration with its own grants and a row in `supabase/tests/grants.mjs` (CLAUDE.md "Branches and commits"); class L3 (NS-26); one token per install per signed-in profile; deleted at sign-out, at Delete account, and when Apple reports it invalid; never in a URL, a log or a crash report (LEGAL-REQ-014); access tests for the table (LEGAL-REQ-024). LEGAL-REQ-029's older list of systems that deletion must clear names `push_tokens` and `notify_outbox`; those are the 1.3.0 plan, not built.

### 13.4 Consent, entitlement, label

- A separate door, as COORDINATION section 10 requires. Shown: the exact words by content key and the versioned links. Records: the act, following PRIV-R21. Never: names, letter words, counts, anything in the payload beyond category and key. Decline and withdraw: local reminders and in-app lines are unchanged; export and deletion still work (PRIV-R09).
- The `aps-environment` entitlement is stripped by `app.config.ts` today (NOTIFICATIONS.md line 10). Adding it is a store build change with an App Privacy label read (Q54(d)) and the founder's yes. Counsel must confirm.

### 13.5 The one-a-day problem

The budget is enforced on the phone, over the phone's own plan. A server push cannot see that plan, so it cannot yield to a local note. If push is reopened, NS-32-R1 must change: a day may carry at most 2 notifications, a local budgeted one and one server push, as plan notices already allow (NS-32 section 3). That is Proposed change PC-5, parked with the push.

### 13.6 The reopen test (from NS-26, unchanged)

All of: NS-25 shipped in a store build; tester evidence that parents want it, "Would you like to know when the other parent made a letter (yes / no)?" reported x of n; an NS-32 registry row with a priority inside the one-a-day budget; door lines; a token table with grants and a `grants.mjs` row, class L3; payloads that follow PRIV-R10; counsel on Q54(d); and the founder's decision (E79). Until then: an in-app line on next open, a local reminder inside the budget, or an email.

## 14. Proposed changes

Each box would need an erratum (next free are E83 and CL-158; Karma assigns the numbers and may batch). The errata file is not edited by this PR. Default for each: the locked text stands until Karma rules.

**PC-1. An age-free band for the last-letter layer (erratum names NS-48-R5, NS-48-R7; reads with E82).**
Why: a body written for toddlers ("a new word or a funny sentence?") tells anyone who sees the lock screen roughly how old the child is, even with names off. E82 forbids an age on a names-off lock screen. NS-48-R7 skips age bands only for two or more books.
Change: with names off, or App lock on, or two or more included books with names off, the last-letter layer uses a band `any` (age-free lines for `spoke` and `typed`, about 6 lines); age bands run only with names on and App lock off.
Default: yes; it shows less. Needs a privacy read on whether any band-free line still implies an age. Content cost: about 6 lines.

**PC-2. One home for the words of a day (erratum names NS-48-R8, NS-48 section 16 `ntc.occ.*`, NS-46-R17).**
Why: the occasion layer of the catalogue (`ntc.occ.public`, `ntc.occ.family`, `ntc.occ.neutral`, `ntc.season.*`) and the `days.*` family both claim the words of a ticked day. Two homes means two sets of rules tests and two ways to leak.
Change: the occasion layer returns `days.*` keys and `ntc.occ.*` and `ntc.season.*` are retired. The catalogue keeps the grid, the last-letter layer and the floor.
Default: yes; one owner, NS-46.

**PC-3. How the lines for a day are chosen (a new row NS-46-R50).**
Why: DL-5 sets 4 lines per day and 3 per season but no row says how one is chosen. The lock-screen string is one per tone and cannot vary; the Home day slip line can.
Change: line index is `(year - 2026 + dayOrdinal) mod n`, a pure function, nothing stored; it applies to `days.landing.*`, never to the lock-screen string. n consecutive years show n distinct lines.
Default: yes.

**PC-4. State whether "Not much today" moves the anchor (a B1 clarification of NS-13-R27 and NS-48-R27).**
Why: as built, smart quiet reads every own entry's `capturedAt` (`prefs.ts:131-142`), and `not_much` is an entry kind, so a "Not much today" tap appears to count as a save. NS-48-R27 says `lastMadeLetter()` excludes `not_much` and "founder or `content` confirms". NS-13-R27 says "letter made". The two definitions can differ.
Change: one sentence in both rows: either "Not much today" is a made letter for the anchor (the parent answered; no nudge tonight) and not a kind, or it is not (and the parent may be nudged tonight after answering).
Default: it counts for the anchor and smart quiet (the parent answered), and does not shape the last-letter question. Karma rules; no founder item.

**PC-5. Parked: a day may carry two notifications if server push ever returns (erratum names NS-32-R1).** Section 13.5. Not requested now.

## 15. Conflicts found in sources

| # | Where | Conflict | Resolution used here |
|---|---|---|---|
| C-1 | `functions/notification-catalogue.md` samples `ntc.occ.public.01`, `ntc.occ.newyear.01`, `ntc.occ.thanksgiving.01`, `ntc.occ.fourthjuly.01` | A day-name title with a body that carries `{child}`. E45 item (a): the body beside a title that holds a day name has no `{child}` in any switch state | Those lines may serve only as unlocked landing lines, never as lock strings (section 6.4). Part 01 and 04 must follow |
| C-2 | `docs/emails/CATALOG.md` section 1 principle 3, `trial-ending-final` ("one push"), `family-letter` and `family-added` (push) | Server pushes planned before E79 | E79 and LEGAL-REQ-054 win; the catalog rows need an edit (PB-17 in `05-backlog-proposed.md`). Plan notices stay local plus email |
| C-3 | `docs/design/NOTIFICATIONS.md` section 4 and `docs/design/notifications/COPY_INVENTORY.md` festival rows: "A celebration today" and a separate "Show celebration names" switch | Superseded: one neutral title and body, the day name behind its own switch on the Days page, not on Reminders (CB-5, RV-13; NS-47-R12; Q-NTC-6) | Mine the inventory's wording for ideas only; do not reuse its festival rows or greetings |
| C-4 | `functions/days-library.md` section 5.1 and 5.4 samples ("A day you wanted to remember", "Tap to see the day you chose.") | NS-47 section 16 names the neutral title "Something for the book today" and says the DAY samples are superseded | The card wins (CR-66) |
| C-5 | `functions/notification-catalogue.md` section 3.2 `previousKey` and a stored "last chosen key" | NS-48-R32: no stored last key, selection is stateless | NS-48-R32 wins |
| C-6 | NS-32 section 3 and NS-13 section 3a rule 5 priority lists omit `libraryDay` | NS-46-R7 and R29 place it between birthday and month | NS-46-R7 wins; NS-32 gains the rank in the errata batch card 21 already lists |
| C-7 | `docs/design/NOTIFICATIONS.md` section 1 "plans 21 days ahead" | NS-13 3a day-35 horizon; NS-46-R10 366 days for library days | The cards win |

## 16. Tests

Style (repo rules C-04, C-05, C-09 in `docs/engineering/readiness-20nov/quality/CHECKS-AND-BALANCES.md`): every test has a title `[PBL-Tnn] ...`, a positive control (a case that must pass, or for a scan a planted example the scan must find) and a recorded mutant that undoes the change and turns the test red. All are pure unit tests with an injected clock and the Asha fixture unless marked. Ids are PROPOSED; the NS rows stay the source of truth.

| Id | Given, When, Then | Proves | Positive control | Mutant |
|---|---|---|---|---|
| [PBL-T01] one channel ladder | Given each class in section 4, When the router is asked for its channels, Then it returns exactly the Y cells | L-01, L-04 | Plan notice returns in-app, local, email | Add push to the table row for a day |
| [PBL-T02] no server push in 1.0 | Given a source scan, When it looks for an APNs key, a token table, a `push_tokens` migration and the `aps-environment` entitlement, Then none exists; the config strip and its test stay | L-02; E79 | A planted `push_tokens` migration fixture makes the scan fail | Remove the entitlement strip |
| [PBL-T03] email class declared | Given every template in `packages/content/src/emails/`, Then each declares `class` and none is `commercial` at 1.0 | L-03; LEGAL-REQ-053; E75 | A planted template without a class fails | Mark `welcome` commercial |
| [PBL-T04] event days never use email or push | Given the router and the email catalog, Then no event or festival key appears in an email or a push category | L-04 | Planted `days.*` key in an email file fails the scan | Add a day to an email |
| [PBL-T05] no new registry class | Given the registry after the six classes, Then it lists plan, typedDay, birthday, monthAge, evening only and `libraryDay` is a source | L-05; NS-32-R2, R5; NS-46-R29 | A planted unregistered class fails | Add `family` to the registry |
| [PBL-T06] permission off schedules nothing | Given notifications not allowed, When the plan runs, Then 0 local candidates and in-app lines still render | L-11; NS-13-R16 | Permission on gives the Asha plan | Ignore permission |
| [PBL-T07] reminders off keeps ticked days | Given reminders off and notifications allowed, Then evening, month, birthday are 0 and a ticked day still plans | L-12; NS-46-R31 | Reminders on gives all | Gate days on `prefs.enabled` |
| [PBL-T08] paused celebrations silences days | Given the phone's celebrations setting paused, Then no library day is planned and evening still is | L-12; NS-46-R49; E57 | Setting off gives the day | Read the server mirror |
| [PBL-T09] quiet book adds nothing | Given a quiet book and a hidden book, Then 0 budgeted notes, 0 day slip, 0 subject name from them; with every included book quiet, 0 library notes | L-13; NS-32-R14; NS-46-R25; NS-48-R21 | A normal second book still contributes | Skip `quiet` in the planner |
| [PBL-T10] expecting book | Given a due date and no birth date, Then evening yes, month and birthday 0, no due-date or pregnancy word in either rendering | L-13; NS-13-R10; NS-48-R36 | Birth date set gives month notes | Plan a month note for due date |
| [PBL-T11] back-off ends evening at day 35 | Given an anchor and no letter, injected clock, When the plan is built, Then no evening, month or birthday after day 35; days 8 to 35 have at most one evening per 7-day block | L-14; NS-13-R3, R4, R18; NS-32-R8 | The Asha silent plan (section 17) matches | Extend horizon to 40 |
| [PBL-T12] days survive back-off | Given a ticked day on day 60, Then it is still planned | L-14; NS-32-R9; NS-48-R8 | Evening on day 60 is absent | Apply back-off to days |
| [PBL-T13] smart quiet | Given a letter at 21:00, Then no evening before 17:00 next day; a draft at Keep counts; 2 h after foreground | L-15; NS-13-R27, R32 | A slot 21 h later is kept | Drop the draft case |
| [PBL-T14] quiet hours hold | Given any chosen time, Then every scheduled time is in 07:00 to 21:30, 15-minute steps, across a zone change and a clock change | L-16; NS-13-R7, R30 | 20:30 stays | Remove the clamp |
| [PBL-T15] astronomical date by zone | Given the 23 Sep 2027 06:02 UTC instant, Then the local date is 22 Sep on Pacific and 23 Sep on Eastern; oracle table read from a source, never from the code under test | L-17, L-32; NS-46-R11 | Eastern 23 Sep | Use UTC date |
| [PBL-T16] rule dates match the oracle | Given every rule day 2026 to 2030, Then dates equal the sourced oracle | L-17; NS-46-R12 | Thanksgiving 26 Nov 2026 | Off-by-one weekday rule |
| [PBL-T17] no date means no note | Given a ticked day with no next-year date, Then nothing is planned and the Days page holds one calm line with no count | L-17; NS-46-R15 | A day with a date plans | Plan the last year's date |
| [PBL-T18] moved date wins | Given a one-year override, Then the note is on the parent's date and the table is not edited | L-17; NS-46-R14 | No override uses the table | Ignore overrides |
| [PBL-T19] merge | Given two ticked days on one date (synthetic `zz-test-day-a`, `zz-test-day-b`), Then 1 note, neutral title, both names after the tap; two children's month-days give 1 note | L-18; NS-46-R8; NS-32-R1b | Different dates give 2 | Emit one per day |
| [PBL-T20] one a day, in order | Given every pair of sources on one date, Then the higher rank in section 6.1 wins; a property test over random plans finds no date with two budgeted notes | L-19; NS-46-R7, R30; NS-32-R1 | Plan notice plus a note on one date gives 2 | Swap birthday and library ranks |
| [PBL-T21] ceiling | Given more than 60 candidates, Then 60 in total, plan notices first, nearest by fire date kept | L-20; NS-32-R4b, R7; Q-QA-4 | Under 60 keeps all | Drop plan notices first |
| [PBL-T22] words come from keys | Given every scheduled title and body, Then each is an existing `packages/content` key | L-21; NS-32-R11 | Every key resolves | Inline a string |
| [PBL-T23] names off, neutral | Given names off or App lock on, Then no title or body has a child name; no new catalogue title has `{child}` | L-22; NS-48-R11 | Names on shows the named rendering | Leave `{child}` in a title |
| [PBL-T24] no age on a names-off lock screen | Given names off or App lock on, Then no digit and no "year" in any lock-screen string, including the birthday body | L-23; E82 | Planted "Month 7" body fails | Leave the birthday body named |
| [PBL-T25] render states | Given all 3 App lock and switch rows of section 6.4 and both kinds of day, Then the title and body match the table; no string holds a non-allowlist day name and a child name | L-24; NS-47-R12, R13, R38 | Allowlist day in the Off, Off row | Treat Christmas Day as public |
| [PBL-T26] allowlist is hand-listed | Given `publicTitleOk`, Then true only for seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day; false for every `quiet` day and every religious day | L-24; NS-46-R36 | A listed day is true | Derive it from the layer |
| [PBL-T27] day part | Given a reminder time before 17:00, Then no evening-worded key is chosen, including the built 8 | L-25; NS-48-R12 | 20:30 may pick them | Skip the filter |
| [PBL-T28] category and payload | Given any scheduled note, Then level `active`, placeholder set, `hiddenPreviewsShowTitle` unset, `data` holds only `{source, kind}`, identifier `el.day.<isoDate>` for days with no key, id, tradition or layer | L-26, L-27; NS-32-R10, R13; NS-46-R32; NS-48-R31; NS-47-R36 | Evening note passes | Put the day id in `identifier` |
| [PBL-T29] stateless selection | Given a plan made twice on the same inputs, Then signatures are equal and no stored last key is read | L-28; NS-48-R32 | Changing the date changes the key | Store a last key |
| [PBL-T30] nothing is owed | Given a suppressed candidate, Then no state, counter or queue entry exists after the plan; a later plan on the same inputs is identical | L-29, L-30 | A kept note is present | Persist suppressed items |
| [PBL-T31] no catch-up | Given a passed fire time, Then nothing is scheduled to make it up | L-30 | The next slot is still planned | Re-add the missed note |
| [PBL-T32] zone, clock, restore re-plan | Given a zone change, a clock change, a restore, Then the plan is rebuilt and no date holds two budgeted notes | L-31; NS-32-R6; NS-48-R3 | No change keeps the signature | Skip the zone listener |
| [PBL-T33] drop triggers | Given each trigger in section 11.5, Then pending notes are cancelled within 1.5 s, delivered ones dismissed where stated, and no record remains | L-33; NS-46-R33; NS-47-R15, R21 | An untouched day stays | Do not cancel on untick |
| [PBL-T34] no stored tradition or region | Given the store, a migration lint and a source scan, Then no field, key or column is named like tradition, religion, faith, country, origin, culture, region; browse picks write only the `culture.asked` flag | L-34; NS-47-R2, R4 | A planted `settings` key named `tradition` fails | Persist the filter |
| [PBL-T35] sign-up region is not a content signal | Given the planner and days module imports, Then neither reads the region-hook result; an import-boundary test fails on a reader | L-34; E47 | A planted import fails | Import the hook |
| [PBL-T36] fallback is neutral | Given a phone with no ticks and no choices, Then 0 day notes, 0 day slips, Home unchanged, evening unchanged; a ticked day with no calendar choice uses the first listed row shown "around" | L-35 | A ticked day plans | Default a tradition |
| [PBL-T37] clears on exit | Given sign-out, Erase, Delete account, Then the store, its pending and delivered notes are gone and account B sees nothing of A | L-36; NS-47-R15 to R17 | Same account stays | Skip the store |
| [PBL-T38] plan notice outside the budget | Given a plan notice and a day note on one date, Then both; and no plan string has a price, count or name | L-37; NS-32-R4, R12; NS-46-R9 | Two budgeted notes still give 1 | Count the plan notice |
| [PBL-T39] one slip, no count | Given Home with several eligible slips, Then one shows in the NS-50-R5 order and no count of anything waiting renders | L-38; NS-50-R5, R11 | Rank 1 alone | Show two |
| [PBL-T40] no analytics | Given the four never-reported kinds and the catalog test, Then no event, property or aggregate carries a day id, tradition, country or a count of ticks | L-40; NS-46-R34; NS-47-R9, R34; NS-50-R17 | A planted `day_id` property fails | Add a `reminder_sent` event |
| [PBL-T41] worked example | Given the Asha fixture of section 17, Then the plan equals the table there, date by date | all | The silent branch ends at day 35 | Move the anchor to `occurredOn` |
| [PBL-T42] device row (founder, not CI) | One week of reminders on a real phone with default settings; the lock screen shows no name, no age, no day name for a non-allowlist day; Sunday reads slower than Friday; an r3 line mentions no absence; J-CUL-01 (Notification Center, Apple Watch mirror, Focus summary, Show Previews Never, App lock on and off) | NTC-T24; J-CUL-01; G4 | Notes recorded | n/a |
| [PBL-T43] push parked | Given a push design review checklist (section 13.6), Then every item is a yes before any push code merges; a CI scan fails a PR that adds a sender | L-39; E79 | Planted sender fails | Merge a sender |

## 17. Worked example: the Asha family

Fictional family only (CLAUDE.md; `packages/core/test/age.edges.test.ts` fixture born 12 Apr 2025). Mama's phone: one book for Asha, reminders on, "A few times a week" (Tuesday and Saturday, 20:30, as built), names off, App lock off, "Month and birthday messages" on, notifications allowed, Pacific time. She ticked three days: Thanksgiving (on the allowlist), the first day of winter (an astronomical row), and `zz-test-day-a` (a synthetic tradition-layer day whose date in this fixture is Sat 12 Dec 2026; no real tradition is paired with Asha, FR-CUL-08). She kept a spoken letter on Mon 23 Nov 2026, so the anchor is 23 Nov (day 0). Build: Drop B (grid and days; the last-letter layer is Drop C). Words below are the PROPOSED samples in `functions/notification-catalogue.md` section 6, by key.

### 17.1 Mama's plan

| Date | Candidates | Gates and ranking | Result |
|---|---|---|---|
| Tue 24 Nov, 20:30 | Evening, day 1, r1, weekday tone `mid` | Smart quiet: 20 h after a letter at about 21:00 ends 17:00, so 20:30 passes | One evening, `ntc.grid.mid.r1.xx`, neutral rendering, title with no `{child}` |
| Thu 26 Nov, 09:00 | Thanksgiving (library, allowlist) | App lock off, day-name switch off: title may be "Thanksgiving"; body is `days.lock.body.neutral` with no child name. No evening on a Thursday | One day note. Tap opens Home; the day slip (rank 2b) shows the day's name and the landing line for its tone |
| Sat 28 Nov, 20:30 | Evening, day 5, r2, weekday tone `sat` | None | `ntc.grid.sat.r2.xx` |
| Tue 1 Dec, 20:30 | Evening, day 8, first Tuesday in days 8 to 14, r3 | Back-off: one per block | `ntc.grid.mid.r3.xx`; Sat 5 Dec has no evening (block already used) |
| Tue 8 Dec, 20:30 | Evening, day 15, r4 | Block 15 to 21 | `ntc.grid.mid.r4.xx` |
| Sat 12 Dec | Month note (Asha's 20th month-day at 20:30), and `zz-test-day-a` at 09:00. Sat 12 Dec is day 19 and has no evening anyway | Rank 3 library day beats rank 4 month | One note at 09:00 with the neutral title and neutral body (tradition layer); the month note is not sent and nothing records that it was dropped |
| Tue 15 Dec, Tue 22 Dec | Evenings, days 22 and 29, r4 | Blocks 22 to 28 and 29 to 35 | One each |
| Mon 21 Dec | First day of winter, UTC 20:50 on 21 Dec | Pacific local date is 21 Dec; Hemisphere unset, so northern names with the small line. If the phone flies to Sydney the next re-plan reads the local date 22 Dec | One note at 09:00 on the phone's local date |
| Mon 28 Dec | Day 35 | Last day | No evening, month or birthday after it |

### 17.2 If Mama never writes again and never opens the app

The plan on the phone was made 23 Nov. It holds the six evenings above (24 Nov, 28 Nov, 1, 8, 15, 22 Dec), Thanksgiving, `zz-test-day-a` on 12 Dec and the winter day. After 28 Dec it holds no evening, no month note (Asha's 21st month-day on 12 Jan 2027 is not scheduled) and no birthday note for 12 Apr 2027. Her ticked days stay, within the 366-day horizon of that plan (a day after 22 Nov 2027 is not yet pending). On 15 Feb 2027 she opens the app: Home is as always, with no line about the gap and nothing sent to catch up. She makes a letter: the anchor moves to 15 Feb and the next re-plan holds days 1 to 35 from there.

### 17.3 Papa's phone

App lock on, reminders on at the default, no day ticked. Names are forced off and every reminder is neutral. His phone holds none of Mama's days and the Family page hints at none (NS-47-R24). He gets the evening reminders on his own cadence and nothing about festivals.

### 17.4 Variations

| Change | Result |
|---|---|
| Mama turns App lock on | Thanksgiving's title becomes the neutral title (NS-46-R36); the day-name switch is set off |
| Mama turns the day-name switch on, App lock off | `zz-test-day-a`'s name may show in the title; its body is the neutral body with no child name; names stay off for Asha |
| A trial notice is due Tue 24 Nov | Two notes that day: the plan notice in its window and the evening (NS-32 section 3) |
| Reminders are turned off | No evening, no month; Thanksgiving, `zz-test-day-a` and the winter day still plan, with the one calm line on Reminders (NS-46-R31, R35) |
| Mama unticks Thanksgiving on Wed 25 Nov | Its pending note is cancelled at once; no trace |
| Mama's notifications are denied | No local note at all; ticks stay; on 26 Nov Home still shows the day slip when she opens the app |

## 18. What I did not read or verify

Read in full: the sources named in the task, from `CLAUDE.md` through `docs/product/prd/22-final-holistic-spec.md`, `BRAND.md`, `VOICE.md`, `docs/design/NOTIFICATIONS.md`, and the heading and first rows of `docs/design/notifications/COPY_INVENTORY.md`, `docs/emails/CATALOG.md` (lines 1 to 130) and `docs/BACKLOG.md` rows near BL-295 to BL-297.

Not read: `01-experience-content-map.md`, `02-email-lifecycle.md` and `04-events-and-festivals-usa.md` (written in parallel; this file states what it needs from them and defers to the cards where they differ); `GAP-LOG.md`, `FEEDBACK-LOOP.md`, the ten reviews of NS-46 to NS-50, `docs/legal/DATA_CLASSIFICATION.md`, `COUNSEL_PACKET.md`, `docs/design/e2e/` screens (screen ids are quoted from the cards); `scheduler.ts` and most of `planner.ts` (line numbers `planner.ts:73, 132, 133, 139, 140, 141, 289` and `prefs.ts:117-118, 131-142` were checked on develop `e68541dd3`; the cards' older line numbers may have moved). I ran no app, no device and no test.

UNVERIFIED and carried as such: what iOS does with a calendar trigger missed because the phone was off, or skipped across the date line; whether a hidden preview shows on Apple Watch, Notification Center or a Focus summary (J-CUL-01 decides); the Apple payload mechanism for key-only push text (section 13.2); which per-member prefs sync with the book; how App Review treats an optional faith or origin question (CUL-Q8). No Apple documentation, law or date was verified for this file. Dates quoted are quoted from the days-library file, which marks its own sources.

`product`

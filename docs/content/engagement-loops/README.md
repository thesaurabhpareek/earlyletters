# Engagement loops: the model

Status: PROPOSED (docs only) | 21 Nov 2026 | Owner: `content` | Replaces: none | Load when: writing, wiring or reviewing a reminder, an in-app line or a day line, or asked what we say, to whom, and when.

Nothing here is built. No string is live, no key is added to code, no flag is set. Every word is PROPOSED until the founder approves it. Humour is PROPOSED pending the founder: each playful line is tagged `tone: playful` and has a plain fallback. Files: [MATRIX.md](MATRIX.md) (every loop), [GAPS.md](GAPS.md) (what is missing, by surface), [COPY-DRAFT.md](COPY-DRAFT.md) (new lines for the gaps only).

This sits on the lifecycle playbook (`docs/content/lifecycle-playbook/`, parts 1 to 5), the days library (`functions/days-library.md`), the cultural data card (`functions/cultural-background-data.md`), the catalogue (`functions/notification-catalogue.md`) and cards NS-13, NS-32, NS-46 to NS-48 in `docs/product/prd/`. It adds a model and a map. It changes no ruling.

## 1. A loop

A loop is one row in a table, written as five keys:

`loop = trigger kind x moment x tone x channel x variant`

| Key | Values | Defined in |
|---|---|---|
| Trigger kind | age month, birthday, season, parent-ticked day (by day id), evening cadence with recency, return, first run, milestone, calendar date | playbook 03 section 3 (six classes); NS-32 classes `evening`, `monthAge`, `birthday`, `typedDay` (source `libraryDay`) |
| Moment | what the parent is doing or about to do: a small moment, a day they marked, a month turning, a letter kept | catalogue axes (weekday tone, recency, last letter kind, age band); days brief moments M1 to M6 (playbook 04 section 8.3) |
| Tone | `plain`, `playful`, `quiet` | `plain` is the default. `quiet` is a field on a day (NS-46-R16). `playful` is PROPOSED (guide v1.2 section 4; Q-FD-27) |
| Channel | in-app card or line, local push, email | playbook 03 section 2. Server push is parked (E79) |
| Variant | a line in a pool, picked by a pure function of the cell and `slotOrdinal`; day lines by year (PC-3) | NS-48 section 3; playbook 03 sections 6 and 7 |

A loop closes when the parent makes a letter or taps "Not much today". Either answer is complete. Closing moves the anchor and the next plan is made from what is true now. Nothing is counted, scored or owed.

## 2. What each key reads

Only data that already exists in a spec. All of it stays on the phone.

| Key | Reads | Where |
|---|---|---|
| Age month, birthday | the child's birth date through `ageOn`; `monthNotes`; the names switch; App lock | `packages/core`, `prefs.ts`, NS-13 |
| Evening cadence and recency | the parent's chosen evenings and time; local date and weekday; days from the newest made letter; `slotOrdinal` | `planner.ts`, NTC section 3 |
| Last letter kind | spoke, typed, first, small (a picture is not a kind, NS-48-R5); the child's age band | NTC section 3.2 |
| Parent-ticked day | the ticked day ids and any moved date; the day row (`layer`, `tone`, `precision`, `publicTitleOk`) from the library data | NS-46, `data/events-usa.csv` |
| Lock-screen variant | App lock; names switch; day-name switch (default off, separate, off while App lock is on) | NS-32-R12, NS-47-R12 |
| First run, milestone | first kept letter; a month or twelve months of letters in the book | NS-39 to NS-44; `en.moments.*` |
| Quiet or hard-day book | the device-only quiet state | NS-32-R14, NS-46-R25 |

## 3. Religion, region and occasion, without storing any

Founder rulings (Q-FD-5, NS-46-R20, NS-47-R2): a tradition or a country picked in Browse is a filter held in memory until the sheet closes. Only each day the parent ticks is stored. So the variety comes from the day the parent ticked, never from a belief or a place we know. A family that ticks Diwali and Christmas gets each day's own loop. A family that ticks nothing gets the evening and age loops only.

| Library layer (`layer` in the CSV) | Example day ids | Loop | Playful allowed |
|---|---|---|---|
| seasonal | `spring_start`, `summer_start`, `fall_start`, `winter_start` | LP-D1 | yes, in-app only |
| seasonal or civic, light | `new_years_day`, `independence_day`, `labor_day`, `thanksgiving` (playful); `new_years_eve`, `halloween` (plain) | LP-D2 | four of six, in-app only |
| civic, with weight | `mlk_day`, `juneteenth` | LP-D3 | no |
| quiet (field `tone: quiet`) | `memorial_day`, `veterans_day`, `good_friday`, `yom_kippur` | LP-D4 | no |
| family | `siblings_day`, `grandparents_day`, `valentines_day`; `mothers_day` and `fathers_day` are never promoted or pre-ticked | LP-D5 | no |
| religious tradition | every `layer: religious` row | LP-D6 | no; words wait for a named reviewer |
| culture-led, heritage month | `lunar_new_year`, `nowruz`, `kwanzaa`, heritage months (first day only) | LP-D7 | no; words wait for a named reviewer |
| regional, national | none ship in the first drop (Q-FD-16, Q-FD-17) | none | no |

The `tradition`, `communities` and `sensitivity` fields order the picker and pick a tone. No code path may write them to a notification, a log, an analytics event or a crash report (days library 5.1 rule 4).

## 4. What is explicitly not keyed

No variant, tone, channel or time reads any of these.

- The parent's religion, tradition, belief, country, region, city or hemisphere. None is stored.
- The phone's locale, storefront or time zone, except that dates are the phone's own local date.
- The language the parent speaks. The child's gender or name as a joke; a name appears only where names are on, never in a title.
- Whether the parent is a mother, father or other, the co-parent, Plus or a trial.
- Letter text, a transcript, audio, a picture's content, how many letters, how many days ticked, days since, streaks, time away.
- Analytics. The four local kinds are never reported (NS-46-R34); analytics is off through 1.0 (D-124). A later opt-in event may carry a class name, never a day id, a tradition or a loop id for these kinds (FR-CUL-09).

## 5. Tone and fallback

- `plain` is the default everywhere. The founder chose Option 2 on 21 Nov. `playful` is allowed on exactly three things: Friday and Saturday notes (Q-FD-27, CL-032; Monday and Sunday stay small and slow), one dry letter-kept line, and in-app wording for the five public days (the four seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day). His answer was a selection, not words, so every playful line stays PROPOSED and he approves it key by key.
- A library-day lock screen is never playful. It is one neutral string per tone for every layer (NS-47-R12), and stays so until Q-FD-18 (`publicTitleOk`) is decided. The five public days may carry playful wording in-app, after the phone is open. There is no playful push for a library day.
- Never playful: first-run screens with consent, errors, money, billing, deletion, safety, permissions, hard seasons, grief, illness, anything the parent might read while upset, and anything tied to a parent-ticked festival, tradition, country or region. No birthday, month, year-in-the-book or email line is playful.
- Wit is never at the parent's expense, never a pun on the child's name, never a joke about the child.
- Each playful line names a plain sibling. A build flag `humour` (PROPOSED, off until the founder approves the words) swaps a playful line for its fallback. The swap keeps the slot, so volume never changes.

## 6. Channels, per the rulings

| Channel | Rule | Source |
|---|---|---|
| In-app | Home slip (one at a time), Days page, moments, toasts. Needs no permission | playbook 03 section 2; NS-50 |
| Local push | One budgeted note per local day; order: typed day, birthday, library day, month, evening; never time-sensitive; silent after day 35 for evening, month and birthday | NS-32 R1, R3, R10; NS-13 R18; DL-2 |
| Email | Transactional only at 1.0. No festival, birthday, month or re-engagement mail | E75; playbook 03 L-03, L-04 |
| Server push | Designed and parked. No words are written for it | E79 |

## 7. Guardrails used in the matrix

G1 one budgeted note a day (NS-32-R1). G2 silence after day 35 (NS-13-R18). G3 neutral lock screen, no child name unless names are on, App lock forces neutral (NS-32-R12, R13). G4 no gap, count, streak, guilt or fear words (VOICE no-guilt rule; `rules.test.ts`). G5 a quieted or hard-day book gets nothing (NS-32-R14). G6 never time-sensitive (NS-32-R10). G7 nothing is ticked for the parent (NS-46-R2). G8 no greeting, no tradition label, "around" for a moving day (days library 5.1). G9 no analytics event for these kinds (NS-46-R34). G10 push title under 40, body under 110, zero exclamation marks (Q-NTC-7).

## 8. Adding a loop

1. Name the trigger kind and the data it reads. If the data is not in section 2, stop: that is a question, not a copy task.
2. Add a row to MATRIX with its channels, lock-screen variant, fallback and guardrails.
3. Write the lines with a plain sibling for every playful one, run the copy checks, and have the founder approve the words before anything turns on (`13-engineering-plan.md` section 4).

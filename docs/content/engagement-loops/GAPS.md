# Engagement loops: what content is missing

Status: PROPOSED (docs only) | 21 Nov 2026 | Owner: `content` | Model: [README.md](README.md) | Matrix: [MATRIX.md](MATRIX.md)

Read from the repo on `develop` at `4805ff8c5`, plus the playbook gap table (`01-experience-content-map.md` section 15). "This PR" says whether COPY-DRAFT.md carries new words. Counts of lines are mine, from the catalogue sample table and COPY-DRAFT; no test reads them.

| Surface | What is missing | Owner | Existing spec | This PR |
|---|---|---|---|---|
| Evening grid | 120 lines at full size, 60 at the launch floor. 18 grid samples exist, plus the built 8. This PR adds 20 and brings 6 of 20 cells to 3 lines. 22 more reach the floor (Mon 7, Tue to Thu 6, Fri 1, Sat 1, Sun 7); 82 more reach full size | `content` | NTC sections 4.2, 4.3; NS-48-R3; Q-NTC-8 | DRAFT 20 |
| Friday and Saturday playfulness | No playful line is written. Q-FD-27 is closed (a little playfulness Fri and Sat; Mon and Sun small and slow) | `content` | CL-032; guide v1.2 section 4 | DRAFT 16 with plain siblings |
| After a made letter | All 16 floor cells have a line after this PR (spoke, typed, first, small by 4 age bands; picture is not a kind). Full size is 48 | `content` | NTC section 4.2; NS-48-R5; RV-2 | DRAFT 6 |
| Month note, names on | One variant ("Month {month} begins"). Rotates every month of a year | `content` | `en.notifications.monthOpen`; playbook 01 section 12.4 | DRAFT 5 |
| Month and birthday, names off | One proposed string pair; a month note on a lock screen repeats it twelve times a year | `content`, `mobile` | E82; playbook 01 section 12.6 and its Proposed change | DRAFT 3 |
| Birthday, names on | One variant that says "A year of letters" and so is unsafe where names are off | `content` | `en.notifications.birthday`; E82 | DRAFT 4 |
| Day lines in the app | Two lines per day in the brief (codes L1 to L14); DL-5 asks for 4 per day and 3 per season. No per-day key family exists | `content` | NS-46-R13, DL-5; playbook 04 section 8; Q-EV-3 | DRAFT 15 (light days, seasons, class templates) |
| Tradition and culture-led days | No reviewed line. No tradition ships without a recorded reviewer | `content`, cultural reviewers, `legal` | playbook README decision 8; 04 section 12 | one template line only; the rest GATED |
| `days.*`, `culture.*` keys | Not in `packages/content`. The Days ask and library cannot ship without keys and claims rows | `content`, `legal` | NS-46 section 16; NS-47 section 16 | none: no keys added |
| Neutral day lock strings | Three drafts of one neutral title and body conflict on `{child}` in the body (E45). Words undecided | `content`, `privacy` | NS-47-R12; NS-46-R37 | none |
| First run, Home day zero | No key (`tonight.dayZero.*`) | `content` | spec 06 section 6; playbook 01 section 15 | DRAFT 2 |
| Letter-kept toasts | One built line repeats on every save | `content` | guide v1.2 section 8; VOICE "kept" note | DRAFT 3 |
| A year in the book | `en.moments.yearComplete` has no key | `content` | playbook 01 section 13.4; founder decision 3 | DRAFT 2 |
| Days page lines | Empty line and first-tick line unwritten | `content` | NS-46-R35; `days.empty` | DRAFT 2 |
| Letter totals moments | Built lines say "story" for a letter (10, 50, 100, 365) | `content` | playbook 01 section 15; BRAND glossary | none: existing row, not duplicated |
| Photo moments | Five intents only (`ntc.pm.01` to `05`) | `content` | NTC addendum; NS-51 | none |
| Email | None at 1.0 by ruling. Words exist for `waitlist-ready`, `news-confirm` and `quiet-message`. No festival, birthday, month or re-engagement email, ever | `content`, `legal` | E75; playbook 02 sections 5, 6 | DRAFT 3 `quiet-message` variants, HELD |
| Server push | Parked. No words | `content`, `mobile` | E79; playbook 03 section 13 | none |
| Store and website | The REMINDERS paragraph is true of days only once days ship. No faith, holiday or country keyword | `marketing`, `content`, CLO | NS-46-R46; FR-MKT-23, 24 | none |
| Support macros for Days | Unwritten | `support` | NS-46-R45 | none |
| Return after silence | Nothing, by ruling. The only line a returning parent sees is the ordinary one | none | playbook 03 section 8.2 | none |
| Other languages | English only at 1.0. Playful lines lean on idiom and will need a translator brief | `content`, CAIO | guide v1.2 sections 9, 10 | none |

## Open questions for the founder

Each has a default that stands until he answers. None is decided here.

| # | Question | Default |
|---|---|---|
| 1 | May playful lines exist at all, behind a `humour` flag that is off until he approves the words? Scope in this draft: Fri and Sat evening, birthday and month with names on, first run, toast, a year in the book, in-app day lines for seasonal and light days | Yes, off by default; plain fallbacks ship |
| 2 | Extend playful to Tuesday to Thursday? Q-FD-27 covers Friday and Saturday only | No |
| 3 | May `publicTitleOk` days (seasons, New Year's Day, Thanksgiving, Independence Day, Labor Day) name themselves on a lock screen? This draft assumes no: every library-day title is neutral until the day-name switch is on | No (Q-FD-18) |
| 4 | "No Mother's or Father's Day by default": offered under Family in Browse but never promoted or pre-ticked, or removed from the library? This draft writes no line for either | Offered in Browse, never promoted |
| 5 | Name tradition and cultural reviewers so LP-D6 and LP-D7 words can be written | None named, so no tradition line ships |
| 6 | Per-day line keys (`days.landing.<id>.<n>`) or one shared line per tone | Per-day, 4 per core day (DL-5) |
| 7 | Does the calendar email (LP-X1) ever exist, and how often? | No at 1.0 |

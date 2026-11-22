# Instrumentation requirements 2: the Book, reading, Find, share and pictures (PROPOSED)

Status: PROPOSED, 20 Nov 2026 (UTC). Author: `product` as PM2. Partner: `decision-science` (`docs/analytics/instrumentation/decision-science.md`; not on develop or any branch when I wrote this, so metric-tree names are not matched and are marked UNVERIFIED). Event standard: `docs/analytics/instrumentation/00-event-standard.md` by `analytics` had not landed either; I follow the founder's baseline in `/home/claude/event-standard-brief.md` (dot names `<area>.<object>.<action>`, closed areas, fixed basics, funnel ids `f_<area>_<goal>`, one registry row per event, `schema_version`). If the final standard differs, names here change, nothing else does.
Baseline: develop at `052b42c`; requirements rev 2 locked (errata E1 to E82). IA ids from `docs/design/IA-FINAL-20nov.md` (PR #1033, branch `docs/design-ia-final-20nov`, read this session).
Covers: NS-02, NS-05, NS-06 (only what the pack allows), NS-21 to NS-31, NS-51, NS-52, the Home slip slot (as it points at the Book), and the Book tab. NS-01 `capture.media.added` is PM1's row; I only extend it. Reminders, Days and lifecycle messages are PM4's.
ASCII only. Nothing here changes a locked statement. Every outside fact is sourced or marked UNVERIFIED.

## 0. Rules that bind everything below

| Rule | Source |
|---|---|
| Analytics is OFF through all of 1.0.x. No event, counter or payload is sent, queued or written; no PostHog or Sentry client is constructed. This file designs DARK: compiled, tested, inert. | FR-DAT-01 (`docs/product/prd/functions/data-and-measurement.md:138`); D-095; D-124 item 3 |
| In 1.0 the only measures are tester answers, numbers only, "x of n", never a percentage under n = 20, raw answers deleted after 90 days. Each card names its fixed questions (section 6). | ruling D5; FR-DAT-04, 05, 08 |
| Never an event, in any version: anything at a seal's opening time; search text or its length; picture metadata, place, photo words, Firsts label, From name; a language next to a letter; assistive-technology state; a share's destination app or recipient. | FR-DAT-27 (`data-and-measurement.md:164`) |
| Never an event for NS-51 and NS-52: a moment shown, tapped, dismissed or empty; an album picked; the moment index; a count of pictures or videos on a letter; a video length or size; any timing at a moment's date. | FR-DAT-38 (`:313`); NS-51-R27; NS-52-R43 |
| No event about marks (Firsts). | NS-06-A10 (`06-firsts-sealed-letter-quick-capture.md:107`) |
| `lib/find` and `components/find` import no network, log or analytics module; the query is never in a route. | NS-02-R22, R25 |
| No count made for measurement is ever shown to a parent; no streaks, points, badges or gap counts. | FR-DAT-03; CLAUDE.md content rules |
| No age on a lock screen (E82); no marketing email (E75); no remote push in 1.0 (E79). Nothing in this file adds any of them. | errata |
| Catalogue first: every event lands in `packages/analytics/src/catalog.ts` and the generated plan in one PR before any call site; stale entries (`letter_opened`, `book_opened`, route enum with `tonight`, `family`, `listen`) are removed or deprecated first. | FR-DAT-26 (`:163`) |
| Free and open source only. No paid product and no paid tier in any path below (founder rule, 20 Nov). | coordinator message, 20 Nov |

### 0.1 Free open-source path (what I checked)

| Need | Option read this session | Licence | Free to run? | Verdict |
|---|---|---|---|---|
| Event store and funnels | PostgreSQL on the existing Supabase project: an `analytics_events` table, plain SQL views, the Supabase SQL editor for the weekly read | PostgreSQL licence (UNVERIFIED, not read); already in the stack | Inside the free plan limits the repo already tracks (`NFR-BUDGETS.md` Q-06: 500 MB database) | ADOPT as the default report path. Every report below is written so plain SQL can answer it. Tables and migrations are `data-architect`'s proposal; `supabase/**` is founder-only. |
| Product analytics UI | PostHog, `github.com/PostHog/posthog`: MIT, with a separate `ee` licence folder; self-host is supported; the page says open-source deployments "should scale to approximately 100k events per month" and gives no support; Cloud is the recommended option, and Cloud is not free beyond a tier | MIT (ee folder separate) | Self-host needs a host we do not have for free (UNVERIFIED whether any free host fits 4 GB RAM); Cloud is a paid-tier path, so REJECTED here | NOT the default. `analytics` decides the stack; if PostHog self-host is chosen, it must have a free host first. My rows work in either. |
| BI | Metabase: open-source edition AGPL-3.0, enterprise parts under a commercial licence (repo page read) | AGPL-3.0 | Needs a host; AGPL | REJECT for this area. Nothing in the Book needs a BI tool; one SQL view per funnel is enough at tester scale. |
| Crash and logs | Not mine; `ops` file. | | | |

Volume guard for any 100k-events-a-month ceiling: screen, tap and impression events are deduped (once per surface per foreground session), and `ui.*.tapped` for result rows and cards carries no id, so one tap is one small row.

## 1. Table 1: screens, controls and impressions

Naming (founder baseline): `screen.<screen_id>.viewed`, `ui.<control_id>.tapped`, `ui.<element_id>.impressed`. A screen id is the IA-FINAL id lowercased with an underscore (`B-S08` is `b_s08`). A control or element id is `<screen_id>_<name>` and comes only from this closed list; it is generated from IA-FINAL by a test (IN-202), never typed, never from text on screen. Impression and tap of the same surface share one element id so a rate is `tapped / impressed`.

Properties allowed on every basic: none, except where shown. `via` (enum: `tab`, `control`, `back`, `link`, `system`) on `.viewed`. No letter id, book id, child, query or date, ever.

| Screen (IA id, name) | `.viewed` | Closed control ids (`.tapped`) | Closed impression ids (`.impressed`) | Left out and why |
|---|---|---|---|---|
| `a_s01` Home (PM1 owns the screen; I own the slips) | PM1 | `a_s01_slip_past_letter` (opens the letter), `a_s01_slip_past_letter_dismiss` ("Not today") | `a_s01_slip_past_letter` (NS-23, rank 4) | Seal-opened line B-S18: FR-DAT-27 (nothing at a seal's opening time). Waiting-set, Days, Save a copy slips: PM3, PM4, FR-DAT-27. |
| `b_s01` Book | `via` | `b_s01_find`, `b_s01_go_to_month`, `b_s01_more`, `b_s01_read_together`, `b_s01_lens`, `b_s01_switcher`, `b_s01_letter_card`, `b_s01_quiet_day_row` | `b_s01_read_together`, `b_s01_lens` (only when a second lens has material), `b_s01_first_page` (the empty "The first page is waiting.") | `b_s01_sealed_card` (B-S16): shows that a seal exists and ties to a date. The gear: removed by NS-22-R3. |
| `b_s02` More for this book (menu) | no (system menu) | `b_s02_quiet`, `b_s02_hide` | none | A Quiet tap is a hard-day signal; default is no event (CPO 5). |
| `b_s03` Lens choice | no | `b_s03_months`, `b_s03_photos` | none | `b_s03_firsts`: NS-06-A10. |
| `b_s04` Photos lens (dark) | yes | `b_s04_picture_card` (no id) | none | Counts of pictures: NS-52-R43. |
| `b_s06` Find over the Book (dark) | yes, fired by the Book host when the mode opens, never from `lib/find` | `b_s06_result` (no id), `b_s06_close` | `b_s06_nomatch`, `b_s06_failed` (R37 line), `b_s06_getting_ready` (R38 line) | The query, its length, result count shown, the matched word: FR-DAT-27, NS-02-R3, R11, R15. |
| `b_s07` Go to a month | yes | `b_s07_month_row`, `b_s07_year_row` | none | A month or year value (leaks the birth date, TRACKING_PLAN 6.4). |
| `b_s08` Letter page | yes: `via` (adds `book_card`, `find_result`, `home_past_letter`, `read_together`) plus `author_relation` (enum: `self`, `other_parent`, `family`) and `has_audio` (bool) | `b_s08_hear`, `b_s08_share`, `b_s08_row_day`, `b_s08_row_who`, `b_s08_row_picture`, `b_s08_row_earlier_versions`, `b_s08_delete` | `b_s08_share` (the control is present; absent on private, sealed or wordless letters) | `b_s08_row_first`, `b_s08_row_hide_until`: NS-06-A10 and FR-DAT-27. Which letter, its date, its words. |
| `b_s09` Day sheet | no (PM1's `A-S08` is the same sheet) | none new | none | A date value. |
| `b_s10` Who can read it | yes | none new | none | Who the readers are. |
| `b_s11` Picture viewer (dark) | yes | none new | none | Picture, place, photo words (FR-DAT-27). |
| `b_s15` Delete confirm | yes | `b_s15_confirm`, `b_s15_cancel` | none | Outcome is PM3's `keeping.letter.deleted`. |
| `d_s02` Share preview | yes | `d_s02_continue`, `d_s02_cancel`, `d_s02_picture_toggle` | none | What is in the preview. |
| `b_s19` Read together | yes | `b_s19_play`, `b_s19_pause`, `b_s19_next`, `b_s19_back_one`, `b_s19_hear_again`, `b_s19_close` | none | The letter being read. |
| `b_s20` End of year or book | yes | `b_s20_read_again`, `b_s20_close_book` | none | Which year. |
| System iOS share sheet (D-S03) | never: not our screen | none | none | Destination app: FR-DAT-27; activity type is never read (NS-05-R3b). |
| Moments sheet and Photos access (A-S17, A-S18), Firsts lens (B-S05), Mark a first (B-S12), Hide until (B-S13), Open now (B-S14), Sealed card (B-S16), Seal-opened line (B-S18) | never | none | none | FR-DAT-38, NS-06-A10, FR-DAT-27. Default holds unless the CPO rules otherwise (CPO 2 and 8). |

Impression rule: `.impressed` fires once per element per foreground session, only after the element is on screen for 1 s (PROPOSED), never while App lock covers it, never for a dismissed slip until the next local day (NS-23-R14).

## 2. Table 2: funnels

Each funnel is an ordered list of registry event names. Step drop-off is the share lost between steps, read "x of n" (FR-DAT-08). Targets are PROPOSED and empty until a baseline exists; I invent no number.

| Funnel id | Steps (event names) | Question it answers | Proposed target |
|---|---|---|---|
| `f_book_read_a_letter` | `screen.b_s01.viewed`, `ui.b_s01_letter_card.tapped`, `screen.b_s08.viewed`, `book.playback.started` | Do parents who open the Book open a letter, and do they hear it? | Baseline first |
| `f_book_find_to_letter` | `ui.b_s01_find.tapped`, `screen.b_s06.viewed`, `ui.b_s06_result.tapped`, `screen.b_s08.viewed` (`via` = `find_result`) | Does Find end in a letter? (The no-match line is `ui.b_s06_nomatch.impressed`.) | Baseline first; stop line: a no-match read as a reproach (NS-02 study) |
| `f_book_share_a_letter` | `ui.b_s08_share.impressed`, `ui.b_s08_share.tapped`, `screen.d_s02.viewed`, `ui.d_s02_continue.tapped`, `book.share.closed` | Where do parents drop between wanting to send and the iOS sheet? | Baseline first; study pass line 4 of 5 send in under 60 s (NS-05 section 20) |
| `f_book_read_together` | `ui.b_s01_read_together.impressed`, `ui.b_s01_read_together.tapped`, `book.read_together.started`, `book.read_together.ended` (`reason` = `finished`) | Do parents start, and do they finish? | Baseline first |
| `f_book_read_a_year` | `ui.b_s01_go_to_month.tapped`, `screen.b_s07.viewed`, `ui.b_s07_year_row.tapped`, `book.read_together.started` (`scope` = `year`), `screen.b_s20.viewed` | Is a year read back from the Go to a month sheet? | Baseline first |
| `f_book_past_letter` | `ui.a_s01_slip_past_letter.impressed`, `ui.a_s01_slip_past_letter.tapped`, `screen.b_s08.viewed` (`via` = `home_past_letter`) | Does the one past letter get read? Branch: `ui.a_s01_slip_past_letter_dismiss.tapped` | Baseline first |

Not a funnel, by rule: Photo moments (NS-51), several pictures and videos (NS-52), Firsts, seals, Quick capture. Their only 1.0 measures are the founder-device walks and tester questions in each card's section 21.

## 3. Registry rows (one definition each; requirements elsewhere cite by name)

Fields per the founder baseline: name, trigger, properties (type and allowed values), classification, owner, consent gate, status, requirement id, `schema_version`. Classification is L2 for every row (TRACKING_PLAN section 0 promise 3). Consent gate for all: "analytics consent given" (D-003, FR-DAT-01); in 1.0.x the gate is closed in every profile. Status for all: proposed. Owner for all: `analytics` (catalogue), call site `mobile`.

| Name | Trigger | Properties (type: values) | Requirement | v |
|---|---|---|---|---|
| `screen.<id>.viewed` for the ids in Table 1 | Route or sheet shown | `via` (enum: tab, control, back, link, system); on `b_s08`: also `via` values `book_card`, `find_result`, `home_past_letter`, `read_together`, `author_relation` (enum), `has_audio` (bool) | NS-21, NS-22, NS-02, NS-05, NS-24 | 1 |
| `ui.<id>.tapped`, `ui.<id>.impressed` | Table 1 | none | as Table 1 | 1 |
| `book.playback.started` | A recording starts on the letter page or in Read together | `surface` (enum: letter, read_together), `author_relation` (enum: self, other_parent, family), `version` (enum: listening_copy, original) | NS-21, NS-24; replaces `playback_started` | 1 |
| `book.read_together.started` | Read together begins | `scope` (enum: book, year), `child_ordinal` (enum: first, second, third_plus), `letters_bucket` (enum: 0, 1, 2_4, 5_9, 10_49, 50_99, 100_364, 365_plus) | NS-24 (`data-and-measurement.md:246` row NS-24) | 1 |
| `book.read_together.ended` | Read together ends | `reason` (enum: finished, stopped, interrupted), `session_bucket` (enum: lt_1m, 1_5m, 5_15m, gt_15m), `letters_heard_bucket` (enum: 0, 1_5, 6_20, 21_50) | NS-24 | 1 |
| `book.search.used` | Find closes after at least one query ran; emitted by the Book host from a plain callback, never from `lib/find` | `results_bucket` (enum: 0, 1_5, 6_plus) | NS-02 section 21; FR-DAT 6.2 | 1 |
| `book.share.started` | The Share control is tapped and the preview opens | none | NS-05 section 20 | 1 |
| `book.share.closed` | The iOS share sheet is dismissed | `with_picture` (bool) | NS-05 section 20 | 1 |
| `book.lens.changed` | Lens radio changed | `lens` (enum: months, photos) | NS-01-R10 | 1 |
| `capture.media.added` (PM1 owns) | A picture is attached | `source` gains `moment` and `attach_picker`; `kind` stays `picture` only (CPO 3) | NS-01-R34, NS-52 | 2 |
| `keeping.letter.sealed` (default OFF, CPO 8) | A letter is sealed or opened early | `action` (enum: sealed, opened_early); never an event at the opening day | NS-06-B, FR-DAT-27 | 1 |
| `system.error.shown` | A closed error line is drawn | `area` (enum: book), `code` (enum: find_unavailable, find_index_untrusted, share_temp_write_failed, letter_open_failed, playback_failed, read_together_page_skipped, picture_missing) | NS-02-R37, R44; NS-05 D-S02; NS-24; NS-01 | 1 |
| `perf.<metric>.measured` | A budget marker closes | `budget_ratio` (enum: le_1x, le_1_5x, gt_1_5x). Metrics: `book_first_render`, `find_first_row`, `letter_open`, `playback_start`, `list_decode`, `index_rebuild`, `picture_attach` | NS-34, NS-37, NS-02-R2 | 1 |

Deprecations (`schema_version` rule: a rename is a new event): `letter_opened` (folded into `screen.b_s08.viewed`), `book_opened` (folded into `screen.b_s01.viewed` with `letters_bucket` dropped; counts are not wanted for the Book view), `playback_started`, `read_together_started`, `read_together_ended` (the `access` property is dropped: reading is free, NS-24-R10, Terms 8.2), `resurface_shown` and `resurface_opened` (replaced by the NS-23 impression and tap). Dates are `analytics`'s to set.

## 4. The experience as a journey, step by step

Columns: Q is the question the team needs answered; Measure is the registry name; Side is where it runs (phone for all; server, store and support noted); Not measured says why not.

| Step | Q | Measure | Side | Not measured, and why | Guardrail (zero target) and signal |
|---|---|---|---|---|---|
| 1 Open the Book | Do parents open it, and how fast? | `screen.b_s01.viewed`; `perf.book_first_render.measured` (budget S-03, p95 500 ms at 1,200 letters) | phone | Letter count (FR-DAT-03, FR-DAT-38 spirit) | None lost: a failed open raises `system.error.shown` `letter_open_failed`; alert rule is a weekly read, not a pager, at tester scale |
| 2 See the header | Is the calm header used or ignored? | `ui.b_s01_*.tapped`, `ui.b_s01_read_together.impressed` | phone | Quiet and Hide taps (CPO 5) | NS-22 tester question: "Did you find Quiet this book when you wanted it?" (`10-reading-and-family.md:343`) |
| 3 Find | Is Find used, and does it end in a letter? | `f_book_find_to_letter`; `book.search.used`; `perf.find_first_row.measured` (S-07, 300 ms p95) | phone | Query, its length, result number shown, which result | Zero: any query text in any payload (NS-02-R15). Errors: `find_unavailable`, `find_index_untrusted` (R19, R44) |
| 4 Read a letter | Do they open and hear letters? | `f_book_read_a_letter` | phone | Which letter, its date, dwell on a letter (no id-free way to bound it) | NS-21 question: "Could you find what you wanted to change about a letter on its page?" (`:203`) |
| 5 Letter-page rows | Which rows are used (day, who, picture, earlier versions)? | `ui.b_s08_row_*.tapped` | phone | Row outcome values (a day, a reader list) | A row tapped and then `back` at once is read weekly as a confusion signal (proxy only) |
| 6 Share | Do parents send a letter out? | `f_book_share_a_letter` | phone; support tally "confused" (FR-DAT-17) | Destination, recipient, whether it sent (NS-05-R3b), count per child (NS-05 section 20) | Zero: any footer, link or brand line in shared text (NS-05-R16b); error `share_temp_write_failed` |
| 7 Past letter on Home | Does it get read, and is it ever at a bad moment? | `f_book_past_letter` | phone | Which letter, its age, its kind (a gap in time points at a date) | Zero-target guardrail is the tester question "Did a past letter ever come at a bad moment?" (`:534`); dismiss / impression is a proxy only, never the guardrail |
| 8 Read together and a year | Do parents start and finish? | `f_book_read_together`, `f_book_read_a_year` | phone | Birthday-slip source (FR-DAT 6.2 NS-24); letters heard as a number | Interrupted and skipped pages: `reason` = `interrupted`, `system.error.shown` `read_together_page_skipped`; NS-24 question every round (FR-DAT-25) |
| 9 Other parent's letters (NS-25) | Do other adults' letters get read? | `author_relation` on `screen.b_s08.viewed` and `book.playback.started` | phone; server aggregates are NOT read in 1.0 (FQ-01) | Who the other adult is; invites belong to PM4 | Another adult's data (Q48): `author_relation` is a 3-value enum and needs the data-steward read |
| 10 NS-26 to NS-31 | Nothing to measure: parked or "not built" (NS-26 push, NS-27 visibility, NS-28 link, NS-29 read-along, NS-30 print, NS-31 library) | none | none | A parked card has no screen (`00-product-frame.md:173-177`); adding events would invent behaviour | Not applicable |
| 11 Pictures and videos (NS-51, NS-52) | Does the spike work on the founder's phone? | Founder device walks and fixed questions only (NS-51 section 21, NS-52 section 21); `perf.picture_attach.measured` as a local marker | phone, local harness only | Everything in FR-DAT-38 | Zero: orphan files after a kill (C-08); canary files 0 hits (NS-51-R28, NS-52-R44) |

## 5. Reports and who reads them

| Report | Built from | Reader | Cadence | Gate |
|---|---|---|---|---|
| "Read" weekly (the six funnels, step drop-off, `x of n`) | `analytics_events` SQL views, or PostHog if `analytics` picks it | `product`, `decision-science`, CPO | Weekly, once analytics is on | Consent given, label changed, counsel (founder) |
| Errors and performance (`system.error.shown`, `perf.*.measured`) | same, grouped by `code` and `budget_ratio` | `mobile`, `ops` | Weekly; any `gt_1_5x` on Find or Book render opens a task | Same |
| Tester round (1.0 reality) | The card questions in section 6, founder's private sheet | Founder, `user-research` | Per round (FQ-04: every 2 weeks) | None: no software |

Every read-out opens with its biases and states n asked and n answered (FR-DAT-08, FR-DAT-29). Device numbers are among consenting families only (TRACKING_PLAN section 1.4). Reconcile with `decision-science` when its file lands.

## 6. Fixed tester questions that exist today for this area (cited, not changed)

NS-02: "Did you use Find this week? (yes or no)", "Did it find the letter you were looking for? (yes or no)" (`02-find.md:275`). NS-05: "Did you send a letter from the app this week?", "Did the person reply?" (`05:262`). NS-06 A: "Did you mark a first this month?"; B: "Did you hide a letter until a day you chose this month?" (`06:228, 523`). NS-21, NS-22, NS-23, NS-24, NS-25 questions at `10-reading-and-family.md:203, 343, 534, 680, 865`. NS-51 and NS-52: `27-photo-moments-and-media.md:262, 478`. That each is in `docs/research/QUESTION-BANK.md` (FR-DAT-06) is UNVERIFIED; IN-213 checks it.

## 7. The test that proves no content leaves

1. Type test: every property in section 3 is an enum, a bool or a bucket; a string-typed property fails the build.
2. Registry test: a name or property not in the registry is rejected at the call site and in the validator (founder baseline rule 7).
3. Id test: every `screen`, control and element id exists in the list generated from IA-FINAL (IN-202); a typed id fails.
4. Canary test (extends J-N18): an Asha canary query, photo word, place, Firsts label, From name and file name pass through Find, the letter page, share, Read together and the picture path, with analytics forced ON in a test profile; the queue holds zero canary strings and only registry names.
5. Forbidden-name test: no registry name matches the FR-DAT-27 and FR-DAT-38 lists (seal opening, moment, album, media count, search).
6. Static scan: `lib/find` and `components/find` import no analytics module (NS-02-R22); no analytics call reads a route parameter.
7. Dark test: every 1.0.x profile has `EXPO_PUBLIC_ANALYTICS` off, zero network calls and no client constructed (FR-DAT-01).
8. Consent test: withdrawing consent empties the queue and stops all of the above (data-steward's file defines withdrawal).

## 8. Proposed change to the locked pack

> **Proposed change (needs erratum E83, next free; CL-158).** FR-DAT 6.2 lists candidates per card and none for Home slips, the letter page rows, Read together controls or screen views. Add one candidate family, "screen viewed, control tapped, element impressed, performance measured", with ids from a closed list generated from IA-FINAL, and the exclusions of Table 1. No locked sentence is edited; section 6.2 gains rows. NS-02-R22 stays true because the Book host, not `lib/find`, emits. Founder decision, default: approve with the exclusions.

## 9. Proposed backlog rows (IN-2nn is this PM's working range; real BL ids come from `product`)

| Id | Task | Wave | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-201 | Draft erratum E83 text and CPO rulings 1 to 8 | 0 | `product` | S | none | Founder decides |
| IN-202 | Generate the closed screen, control and element id lists from IA-FINAL; test that no id is free text | 1 | `analytics` | S | PR #1033 merged, IN-201 | no |
| IN-203 | Add the section 3 rows to `catalog.ts` and the generated plan; remove stale entries per FR-DAT-26; validators and canary harness | 1 | `analytics` | M | IN-202, `00-event-standard.md` | no |
| IN-204 | Book, letter page and Read together call sites behind the dark gate | 2 | `mobile` | M | IN-203 | no |
| IN-205 | Home slip impression hook for the past-letter slip, deduped and App-lock aware | 2 | `mobile` | S | IN-203 | no |
| IN-206 | Find host events (`book.search.used`, `b_s06_*`) with the NS-02-R22 scan test | 2 | `mobile` | S | IN-203 | no |
| IN-207 | Share events and error codes; test shared text carries no footer | 2 | `mobile` | S | IN-203 | no |
| IN-208 | `perf.*.measured` markers mapped to budget ratio for Book, Find, playback | 2 | `mobile` | S | perf harness H1 (`MEASUREMENT-PLAN.md`) | no |
| IN-209 | Canary test across Find, letter page, share, Read together, picture path (analytics forced on) | 2 | `qa` | S | IN-204 to IN-207 | no |
| IN-210 | SQL views for the six funnels and the weekly "Read" report (no BI tool) | 3 | `data-architect` | M | IN-203, a free host decision | Founder: host and Supabase plan |
| IN-211 | Verify the section 6 questions are in the question bank; add the missing | 3 | `product` | S | none | no |
| IN-212 | Release gate: turn-on checklist for this area (consent sheet, label change, counsel) | 3 | `ops` | S | all above | Founder and counsel |

## For the CPO: decisions and risks

| # | Decision or risk | Default |
|---|---|---|
| 1 | Approve E83 (screen, control, impression, performance family) given FR-DAT-27 and FR-DAT-38 | Approve with the Table 1 exclusions |
| 2 | Firsts: NS-06-A10 says no event about marks, FR-DAT 6.2 lists `first_marked`. Contradiction inside the locked pack | Follow the stricter NS-06-A10: no Firsts event, lens option, screen or row tap |
| 3 | Media kind: NS-52-R43 says no media type in any event; the FR-DAT addendum (`data-and-measurement.md:301`) lets `kind` be `picture` or `video`. Contradiction | `kind` is `picture` only; no video, no count |
| 4 | `access` (plus, free) on Read together contradicts NS-24-R10 (reading is free) | Drop the property |
| 5 | Quiet this book as a settings signal (FR-DAT 6.2 NS-21, NS-22 `key` gains `quiet`) is a hard-day inference | Not sent |
| 6 | `book.search.used` bucket, emitted by the Book host | Yes |
| 7 | Past-letter dismiss rate is a proxy, never the zero-target guardrail, which stays the tester question | Accept |
| 8 | `keeping.letter.sealed` (sealed, opened_early) and any seal screen | Event OFF, no seal screen or impression, until counsel on seals (`22-final-holistic-spec.md:150`) |
| 9 | Free host for the event store: PostHog self-host has no free host I could verify; Cloud is a paid tier | Plain SQL on Supabase free plan first; `analytics` and `data-architect` confirm |

Risks: (a) the 1.0 line yields no field numbers, only tester answers, so every target here stays empty until after 1.0; (b) 100k events a month is PostHog's stated self-host ceiling, so impressions are deduped; (c) timestamps of events near a child's dates are a leak (TRACKING_PLAN 6.4): no event is keyed to a month or year value; (d) `author_relation` touches another adult's data (Q48); (e) the `decision-science` and `analytics` files were not readable, so names may need one rename pass; (f) no screen was seen on a device and no test was run.

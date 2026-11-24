# Moments measurement note

Owner: analytics engineer. Status: Draft 2, 24 Nov 2026, docs and one guard test. For `privacy`, `product` and Karma to read. Draft 2 records the PR 7 decision of spec 19.4 (BL-1452) in section 11 and corrects two facts of Draft 1 that later merges made stale (section 1 items 1 and 2, section 3.1).
Reads: `docs/product/prd/28-moments-tab.md` (sections 18, 20, 20.1; rows R87, R167, R251, R252, R282, R284, R289; open questions O-18, O-38, O-49), `packages/analytics/src/catalog.ts`, `packages/analytics/src/registry.ts`, `docs/DECISIONS.md` (D-095, D-124, D-163), `docs/legal/app-store-privacy-labels.md`, `apps/mobile/src/lib/capture/start-capture.ts`.
Changes (Draft 1): this file only. Draft 2 adds section 11, one line in `docs/analytics/TRACKING_PLAN.md` section 9 and `packages/analytics/test/moments-no-change.test.ts`. The catalog, the registry and the allowlist are not edited by either draft.

## 1. The short answer

1. O-49 (a closed enum for how a letter was started: picker, card, capture) has no entry in `docs/agents/exec/RULINGS.md` and the spec still lists it with its default, do not send (spec section 23). `docs/agents/exec/proposed/moments-rulings-product-data.md` section 2 records the same answer as a relayed ruling that has not been merged into the rulings log. Either way the result is the default: no such enum is sent. `picker_unavailable`, `library_unreadable` and `fallback_used` stay local codes with no wire code and no catalog row.
2. Today Moments emits nothing. Every shipping profile in `apps/mobile/eas.json` sets `EXPO_PUBLIC_ANALYTICS` to `off`. Since Draft 1 the catalog holds the two card events of R251 (`book:moments_card_view` and `book:moments_card_open`, one closed property `slot`: `look_back` or `question`; `SCHEMA_VERSION` 11, renamed at 20); the app does not call their tracker until the Moments flag, and nothing else of Moments is in the catalog.
3. The spec's section 18 lists a set of events that Moments might send later. None of them is built, none is in the catalog, and the spec itself says each waits on D-163 and its gates. This note says which of those rows are allowed on paper and what has to be true before any of them can exist.
4. Moments is measured at 1.0 by App Store Connect cohorts, the five-parent checks and the two-week diary, as spec section 20 already says.

## 2. What the decisions say

| Decision | What it says | What it means for Moments |
|---|---|---|
| D-095 | No analytics SDK or consent sheet in v1.0 | No Moments event, no consent sheet for one |
| D-124 item 3 | D-095 stands for the whole 1.0 line, staged 1.0.x releases included; `EXPO_PUBLIC_ANALYTICS` stays off, no analytics host, privacy label unchanged | Same, for every 1.0.x |
| D-163 (20 Nov 2026) | Supersedes D-095 and D-124 item 3 for the `production` profile only; the work is built before the production-readiness build; page-view, click and impression instrumentation is for every user, not opt-in | The brief for this note names D-095 and D-124 as binding. For the `production` profile D-163 has superseded them. They still stand for `development`, `e2e`, `testflight` and `preview`. D-163 also says no production flip until its gates close (section 5 below), so the practical position is unchanged: analytics is off, and no Moments event is live |

Read together: the build work may land behind a flag, off. Nothing is sent from any profile today. The privacy label says no Usage Data and no Diagnostics are collected (`docs/legal/app-store-privacy-labels.md`, Usage Data and Diagnostics rows), and that stays true while the flag is off.

Two things D-163 leaves in force that matter here: the closed allowlist with the registry as the only send path, and no content in any event, log or crash report (D-163 item 5 (c) and (d)). One more: the spec (section 18) was written before D-163 and says opt-in and "the D-163 consent default". Whether Moments events run for every user or only with consent is not decided (D-163 item 5 (a) and (b)); this note does not pick.

## 3. What Moments may and may not emit

### 3.1 Today, under any profile

May emit: nothing of its own while analytics is off. With it on, only the two card events of R251 for the `question` and `look_back` slots (row 2 of section 4); nothing for the picker, the host sheet, a pick or the library read (section 11).

May not emit, by any route (events, properties, logs, breadcrumbs, crash fields, URLs, route params):
- a picture, a thumbnail, a picture or album identifier, a filename, a caption, a title or EXIF text;
- a date, week or timestamp that could mark a Day, a birthday or a picked picture;
- a place, a coordinate, a place key or a "hidden place" choice;
- a count of days, pictures or cards;
- a card kind that came from the library, a typed day or a birth-date reason;
- the library permission result (allowed, limited, denied), or any event whose presence varies with Apple's answer;
- a machine label (F5 of the spec's label firewall);
- anything that says a letter began from a Moments card or from the picker (R87, O-38, O-49);
- any distinction between a library-timed reminder and an ordinary one.

### 3.2 The one existing event Moments touches: `capture_started`

`capture_started` (catalog, capture area) has `source` as `tonight`, `book`, `notification`, `make_it_yours` or `resurface`. `startCapture` sends it only with `source: 'tonight'`, never the control (`apps/mobile/src/lib/capture/start-capture.ts`). Under R87 and O-49 a Moments hand-off adds no value. `moment` is a local value of the closed source list in `start-capture.ts` only and must never reach `trackCaptureStarted`. If a later change lets a Moments start reach the track call, it must map to an existing value that does not reveal the origin, or send nothing; it must not add `moment`, `picker` or `card`.

### 3.3 A name clash to know about

The catalog has an unrelated event `moment_shown` (celebrate area, a quiet milestone card with types such as `first_letter` and `letters_10`). It is the milestone card of C-REQ-034, not the Moments tab. The registry's `FORBIDDEN_EVENT_PATTERNS` blocks any registry name matching `(^|:)moment_` (a bare key or a wire name), and `registry-data.test.ts` checks that. Two consequences: no Moments event may be named `moment_*`, and nobody should read `moment_shown` as Moments tab telemetry.

## 4. Every Moments event idea in the spec

Source: spec section 18 and its amendment, plus rows that mention events. "Allowed" below means allowed to be proposed to the registry after the section 6 conditions hold. It does not mean allowed to ship at 1.0, where nothing is sent.

| # | Idea (spec reference) | Allowed? | Why |
|---|---|---|---|
| 1 | `screen.moments_home.viewed`, property `via`: tab, control, back, link, system (18) | Conditionally allowed, 1.0: not sent | A screen view with a closed enum, no library fact. Needs a catalog row (see flag A) and the section 6 gates. The `via` values must be checked by `privacy` for any that reveal access state |
| 2 | `ui.moments_card.impressed` and `.tapped`, `slot`: question, look_back (18, R251) | Conditionally allowed, 1.0: not sent | Allowed only for the `question` and `look_back` slots, because a slot is position and not source. `look_back` is limited to letters. At most one impression per slot per local day |
| 3 | Any card event for a card dated by the child's birth date, a typed day, a tick or the library (18) | Not allowed | The presence of the event would disclose the date (EX-CDO-1, EX-CDO-4) |
| 4 | `ui.moments_ask.impressed`, `ui.moments_ask_allow.tapped`, `ui.moments_ask_notnow.tapped` (18) | Conditionally allowed, 1.0: not sent. Needs a `privacy` read first | No properties. Must say nothing about Apple's answer, and no event may follow that varies with it. See flag B: R73 says no refusal counter exists, and a "not now" event is a refusal count on the wire |
| 5 | `capture.letter.started` with `source: moment` (18, R87, O-38) | Not allowed | Founder question O-38 default is do not send; O-49 closes the same question for the picker and card values. The row in section 18 already says `moment` is not sent |
| 6 | Closed enum for how a letter was started: picker, card, capture (D13, R284, O-49) | Not allowed | Decision O-49 is no. Replaced by two diary questions (R284) |
| 7 | `perf.moments_first_paint.measured`, `ms_bucket`, `is_ok` (18, R251) | Conditionally allowed, 1.0: not sent | Buckets only; raw milliseconds stay on the phone; no `device_tier`. See flag C: the bucket set and where perf events live are not in the catalog today |
| 8 | `system.error.raised` with codes `picker_unavailable`, `library_unreadable`, `fallback_used` (18, R282) | Not allowed | O-49: these stay local, no wire code, no catalog row. R251's note that "the `code` list keeps only `picker_unavailable`" contradicts section 18 and R282, which keep all three local. R282 and section 18 win (flag D) |
| 9 | Permission result: allowed, limited, denied (O-18, P3 Q-P3-4) | Not allowed | Stays out unless the founder, analytics and counsel sign it. Not proposed |
| 10 | Host-sheet view event (R282) | Not allowed | Would vary by access state, revealing it by presence |
| 11 | Picker door, host sheet and a pick as events (18, R167) | Not allowed | "No new event" |
| 12 | Any attach or photo event carrying a picker-or-library source (R282) | Not allowed | No source on attach events |
| 13 | Counts of days or pictures, any place or kind from the library, week-level or timestamp that marks a Day or birthday (18, "Not proposed") | Not allowed | Content-shaped or date-revealing |
| 14 | A distinction between a library-timed reminder and an ordinary one (18, R135) | Not allowed | Payload and analytics must be identical |
| 15 | Moments card or place events for machine labels (F5) | Not allowed | Labels are never sent |
| 16 | Moments daily-return or "opened unprompted" rate as telemetry (R252) | Not allowed | Read from the diary (E4) only |

## 5. Spec rows that imply wire code

These are the places where the spec text could be read as asking for code that sends something. Each is for `product` and `mobile` to confirm or fix in the spec. This note edits none of them.

- Flag A, event names. Section 18 and R251 name events in a dotted form (`screen.moments_home.viewed`, `ui.moments_card.impressed`, `perf.moments_first_paint.measured`, `system.error.raised`, `capture.letter.started`). The catalog names events in snake_case with no dots (`screen_view`, `capture_started`), and has no `ui.`, `perf.` or `system.` area. Section 18 also says names and element ids are "registered in `ids.ts` and written to the event standard". Any event of this kind needs a catalog row in the catalog's own naming, with a `SCHEMA_VERSION` bump. Row R251 and section 18 should not be read as final names. `capture.letter.started` is the existing `capture_started`.
- Flag B, the ask events. Section 18 lists three events for our own ask control, and R73 says "no timer or counter of refusals exists". A `ui.moments_ask_notnow.tapped` event is a refusal count if it is sent. Recommend `privacy` decide whether the not-now event stays on the list at all.
- Flag C, `perf.moments_first_paint.measured`. It is a wire event with a bucket set that does not exist yet. Until a bucket set is defined and reviewed, it is not wire-ready. A local timing marker for the SE 3 device run (spec 17, A5 markers) needs no wire code.
- Flag D, `system.error.raised`. Section 18's table row says "Not sent", but R251 says "the `code` list keeps only `picker_unavailable`", which reads as one code on the wire. O-49 and R282 say none. Ask `product` to correct R251 to "no code on the wire".
- Flag E, R87 (and the O-38 text). The row says the alternative (send `source: moment`) "needs the registry, the D-163 gate and the R87 ban reworded". With O-49 answered no, that alternative is closed for the picker and card values. O-38 itself (an enum for a Moments hand-off) should be closed in the same way or restated, so that nobody reads it as still open.
- Flag F, section 18 lead-in. "When on, the closed allowlist is enums only" and "with the flag off ... 0 events are sent or queued" are correct and consistent with this note. The phrase "Registry rows land in `packages/analytics/src/catalog.ts` with the generated docs" is a future step, not an instruction for 1.0; no row should land while the flag stays off for production without the section 6 gates.
- R284 and spec line 976. They agree with O-49 (no enum, two diary questions). Nothing to fix.

No row asks for a Moments permission or library read to be sent, and no row asks for a place, picture or id to go on the wire. The rows that need care are the five above.

## 6. Local-only counters that stay on the phone

Local means in on-device storage or in memory on the phone, never in an event, log line, breadcrumb, crash field, URL, route param or the sync outbox, and wiped with the rest of the Moments data on Turn off, Erase and sign-out where it is parent-derived.

| Local item | Source | Rule |
|---|---|---|
| `picker_unavailable`, `library_unreadable`, `fallback_used` error codes | R282, section 18 | Closed local codes for the screen and for tests; no catalog row |
| Performance markers and raw first-paint milliseconds | Section 18, A5 rules | Raw milliseconds stay on the phone; markers carry no content |
| Primer shown and answered flag | Spec permissions table | A local flag so the ask card does not return; no server row |
| Decisions store (day keys, parent labels, hidden-place keys, corrections) | Spec section on data | L4, outside `scribe.db`, wiped by Turn off, Erase and sign-out. Never counted or reported |
| Option index cache, if O-09 is signed | Spec | Local, same wipe |
| `moment` as a local `source` value in `start-capture.ts` | R87 | Used for in-app routing only; never passed to the track call |
| Scan results, tap or dwell history, counts | Spec data section | "Never persisted"; do not add a local counter for these either |
| Counter of "Not now" refusals | R73 | Must not exist, even locally |

New local counters need `privacy` sign-off before anyone adds them. A device row counted by hand (W-moment, two taps from a day to the writing screen) is a human check on a phone, not a counter in the app.

## 7. What we read from App Store Connect and by hand instead

Analytics is off through 1.0, so Moments is read without events (spec sections 20 and 20.1, KM1, R289).

| Question | Source | Rule |
|---|---|---|
| Does the tab and the library read hurt or help trials and renewals (the bet, R264) | App Store Connect: trial-to-paid and first renewal per install-week cohort, never blended, before and after the tab, split by the F1 and F2 state in the release record | Minimum 20 per group before any percentage; the stop line numbers are the founder's (O-46) |
| E8: picker-only versus library read | App Store Connect install-week cohorts split by F1 and F2 state, plus the two diary questions | x of n; no percentage under 20; no event separates the arms |
| Installs, conversions, renewals, refunds | App Store Connect (money is Apple's alone; tracking plan section 0 item 6) | Not an analytics event |
| G-2 (start a letter from a day in two taps) | The five-parent check (E1, R161), the W-moment device row (by hand), the diary (E4) | No analytics read in the first release (R87, O-38) |
| Daily return (hypothesis only) | Two-week diary, tester question 1 (E4) | x of n; nothing is built to measure it beyond the diary |
| Card sort, default-tab check, E7, E9, E10, E11 | Tester sessions and diary answers collected by hand | x of n with a stop line; no telemetry (R174, NS-53-R7) |
| Support questions | Support tally by fixed category | No content |
| Letters kept, families active | Server aggregates (`insights.*`, tracking plan section 4), which count letters and do not know about Moments | Moments adds nothing to them; no library fact enters a server aggregate |

Spec rules that keep these honest: report "x of n", never a percentage under n of 20, no real family pictures leave a tester's phone, examples use Asha.

## 8. What must be true before any Moments event could exist

All of the following, in order. If any is missing, the event does not ship.

Consent and lawful basis
1. `EXPO_PUBLIC_ANALYTICS` is on for the profile in question. Today it is `off` in every profile. D-163 sets the order for `production`: build behind the flag, off; flip only when its gates close.
2. D-163 item 5 is answered by its owners: the consent default and wording with Shown, Records, Never and Decline lines (PRIV-R21), the PostHog account, key and region, counsel's view on which events may run without a consent ask, and the LEGAL-REQ-043 privacy-manifest test updated through review (never loosened).
3. Nothing is sent, queued in memory or written to disk before the lawful basis for that profile is met (tracking plan section 0). Declining changes nothing. Withdrawing stops sending within the session.
4. `privacy` reviews every consent change.

Allowlist and registry
5. A founder or owner decision for any item the spec leaves open: O-18 for the permission result (stays out), O-38 and O-49 for a started-from value (closed no), and a `privacy` read on the ask events (flag B).
6. A catalog row in `packages/analytics/src/catalog.ts` for each event, in its naming, with closed properties only (`oneOf`, bounded integers, booleans), level L2, a `SCHEMA_VERSION` bump, a registry entry, and the matching row in `docs/analytics/TRACKING_PLAN.md` (generated by `npm run plan -w @scribe/analytics`). The event is not a `FORBIDDEN_EVENT_PATTERNS` name.
7. Schema tests for each event and property, including a negative test that a content-shaped value and any Moments canary (asset id, album, date, coordinate, place, filename) is rejected (R162). Screens and elements are registered in `ids.ts`.
8. The registry is the only send path. No autocapture, no session replay, no cross-app tracking, no Apple tracking prompt.
9. The event does not vary by library access state, does not fire for a card whose presence reveals a date, and is limited to at most one impression per slot per local day.

Privacy label and policy
10. The App Store privacy label is updated: add Usage Data and, if crash capture is ever on, Diagnostics, with the purpose "Analytics" (`docs/legal/app-store-privacy-labels.md`, row for a later build with analytics). The Linked or Not linked question returns (COUNSEL_PACKET Q7).
11. The Privacy Policy, subprocessor and data-map rows, in-app disclosure and release-gate rewrite are updated and merged by their owners. `docs/legal` is the founder's merge.
12. Library claims in the policy follow R193 and R135: scoped to the build and mode, never "never leaves the phone" or "lives".
13. `docs/legal/DATA_CLASSIFICATION.md` rows exist for anything new that is held on the phone.

Proof
14. The canary test of R162 passes on every path, with 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs.
15. Two counted reviews and the required checks (CR-70, CR-73). Anything that touches consent is reviewed by `privacy`. No analytics, crash or purchase SDK is added by an agent: that is `pair` mode with the founder.

## 9. What this PR does not do

- It does not edit the allowlist, the catalog, the registry, the tracking plan, the spec or any decision entry.
- It does not decide any open founder question. It restates O-49 (no) and the defaults of O-18 and O-38 as the spec records them.
- It does not say that D-163 flips analytics on. It does not.

## 10. Follow-ups for other owners

| For | Item |
|---|---|
| `product` | Correct R251 so the `code` list is empty on the wire (flag D); close or restate O-38 now that O-49 is no (flag E); decide whether the not-now ask event stays (flag B, with `privacy`) |
| `product`, `mobile` | Align the dotted event names in section 18 with catalog naming when a row is first proposed (flag A) |
| `privacy` | Read flags B and C and the `via` values of `screen.moments_home.viewed` |
| `analytics engineer` | When section 8 holds, add the rows and tests in one PR; until then, nothing |

## 11. The PR 7 decision (BL-1452): no change

Spec 19.4 row 7 is "Analytics decision for `source` (or the no-change note)". This is that note. It satisfies NS-53-R83, R87, R167, R227, R251, R282 and R284 (spec 26b homes R227, R251 and R284 to PR 7 and R83 to 7 and 19; R227 keeps only its analytics note here, the tab-jobs and N-test part is PR 6).

Decision: Moments v3 adds no analytics event, no property, no enum value, no wire code and no catalog or registry row. `SCHEMA_VERSION` stays 25. In detail:

1. The picker door, the host sheet, a pick and the library read send nothing (R167, R282). No host-sheet view event exists, so nothing varies by library access state, and no attach or photo event carries a picker-or-library source.
2. `picker_unavailable`, `library_unreadable` and `fallback_used` stay local closed codes: no wire code and no catalog row (R282, R251 read with flag D above). `system:error_view.code` keeps its eight values.
3. A Moments start sends nothing that says so (R83, R87, R227). `moment` is a local value of the closed source list in `start-capture.ts` only; `capture:take_start.source` gains no `moment`, `card`, `picker` or `library` value, and the track call keeps the literal `tonight` (O-38 default).
4. No enum for how a letter was started (picker, card, capture) is sent in the first release (R284, O-49 default). The two diary questions of R284 replace it and are read as x of n, never a percentage under 20.
5. The only Moments events stay the two card events of R251, each with `slot` alone (R251).
6. No entry text, transcript, audio, child name, date, place, picture identifier or count goes into analytics, logs or crash reports from any Moments path (R167; CLAUDE.md privacy rules).

Reversible: a later value is a catalog change with a `SCHEMA_VERSION` bump, the founder's answer to O-49 (and O-38 for a Moments start value), and the conditions of section 8. A value that was sent cannot be unsent, so the default is the safe side.

Proof, by row (`packages/analytics` unless named):

| Row | Proved by |
|---|---|
| R83 | `apps/mobile/test/start-capture.test.ts` (the one start function; the track call sends the literal `tonight`); `moments-no-change.test.ts` (no `moment`, `card`, `picker` or `library` enum value) |
| R87 | `moments-no-change.test.ts` (no start-origin value on the wire); `allowlist-pins.test.ts` `[NS-49-R36]` (the `capture:take_start.source` set) |
| R167 | `moments-no-change.test.ts` (no picker, library, album, asset, picture or access-state name, key or value); `moments-events.test.ts` `[NS-53-R251-c]` and `[NS-53-R251-d]`; `canary-sweep.test.ts` (album, asset and date canaries) |
| R227 | analytics note only: `moments-no-change.test.ts` (no `moment` source value); the list itself is PR 6 |
| R251 | `moments-events.test.ts` `[NS-53-R251-a]` to `[NS-53-R251-f]`; `moments-no-change.test.ts` (no local failure code on the wire) |
| R282 | `moments-no-change.test.ts` (no wire code in `src`, no access-state property, no picker or library vocabulary) |
| R284 | `moments-no-change.test.ts` (no `capture` or `picker` start value); the diary questions are a manual read, not code |

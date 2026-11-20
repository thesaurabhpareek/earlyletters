# Event standard (the one every instrumentation file follows)

Status: PROPOSED, 20 Nov 2026. Author: `analytics`. Docs only. Founder rule (20 Nov): every event follows one standard, defined first, followed strictly in every requirement. Starts from the 8-line baseline in the coordinator brief (`/home/claude/event-standard-brief.md`); section 12 lists where this file tightens it. Analytics stays OFF through 1.0.x (D-095, D-124 item 3, FR-DAT-01); everything here is built dark. Only free open-source tools (stack: `analytics.md`).

Words: MUST and MUST NOT are the validator's job (section 10). Everything is ASCII; no em or en dashes, curly quotes, ellipsis characters or emoji.

## 1. Two families of event

| Family | First segment | Shape | Example |
|---|---|---|---|
| Basics | `screen`, `ui`, `perf` | fixed names, ids from the id registry | `screen.home.viewed`, `ui.home_speak.tapped`, `ui.home_slip_waiting.impressed`, `perf.save_commit.measured` |
| Domain | one of the 9 areas (section 3) | `<area>.<object>.<action>` | `capture.letter.saved`, `family.invite.accepted` |

Both are exactly three segments, separated by dots. A name is data in a registry row, never built from a variable at a call site (section 10, V3).

## 2. Naming grammar (the whole of it)

```
name     = segment "." segment "." segment
segment  = [a-z] [a-z0-9]* ( "_" [a-z0-9]+ )*      ; lowercase ASCII, no segment is digits only
```
- Max 3 segments, max 60 characters in all. No `$` prefix (PostHog reserves it for its own events). No hyphen, space, capital or dot inside a segment.
- Segment 3 (the action) MUST come from the closed action list, in the past tense: `viewed, tapped, impressed, measured, started, completed, saved, shown, opened, closed, changed, sent, delivered, failed, declined, granted, withdrawn, discarded, deleted, restored, kept, dismissed, accepted, selected`. Adding an action needs a PR to this file (founder or CPO if it implies a new meaning).
- Segment 1 of a domain event MUST be an area; the object (segment 2) is a noun from the registry, not a screen or control id.
- Renames are never edits (section 8).

## 3. Areas (closed list, one per IA area)

`onboarding, capture, book, family, keeping, me, plus, notifications, system`

| Area | IA home (`docs/design/IA-FINAL-20nov.md` on branch docs/design-ia-final-20nov, section 3 tree) | Used for |
|---|---|---|
| onboarding | First run, age question, sign-in, agreements, opening a book on a new phone | install to first letter |
| capture | Home capture cluster, Listen, Write, Review | speak or type to saved |
| book | Book tab, letter page, Read together, Find, lenses | reading and finding |
| family | Invite, family page, Whose book, roles | invite to joined |
| keeping | Save a copy, export, backup, sync, recently deleted | trust and keeping |
| me | Me tab, settings, children, privacy | account and care |
| plus | Plan page, Keep gate, offer, restore | trial to paid |
| notifications | Reminders, slips, past letter, days | delivered, opened, suppressed |
| system | Launch, errors, permissions, packs, remote config | health, not a place |

A new area needs a CPO ruling and an erratum. Each screen, control and element in the id registry (section 4) carries exactly one area; a domain event's area is the area of the screen the person is on, except `system`.

## 4. Basics: fixed names and the id registry

| Name | When | Closed properties |
|---|---|---|
| `screen.<screen_id>.viewed` | A screen or sheet is shown (route template or sheet name, never a resolved path) | `from_screen` (enum of screen_id or `none`), `build_kind` (enum, section 6) |
| `ui.<control_id>.tapped` | A control is activated (tap, or VoiceOver activate; keyboard for iPad later) | `screen` (enum of screen_id) |
| `ui.<element_id>.impressed` | A surface that offers something is on screen (slip, prompt, card, sheet body, banner, empty state, reminder delivered, in-app message) at least half visible for 1 second (PROPOSED thresholds, take a baseline), once per element per screen view | `screen` (enum of screen_id), `rank` optional int 1 to 9 |
| `perf.<metric>.measured` | A performance measure completes | `ms_bucket` (enum, section 6), `ok` (bool) |

Id registry (`packages/analytics` `ids.ts`, generated into `docs/analytics/instrumentation/ids.md`; each row: id, kind screen or sheet or control or element, area, IA-FINAL id such as `A-S01`, status):
- `screen_id`: lowercase snake slug, one per route template or named sheet. Seed from the 29 built routes in `packages/analytics/src/routes.ts` plus the IA-FINAL extras (age_gate, boot_error, plus_confirmed, not_found, invite_leave, whose_book, day_sheet). PM files add rows.
- `control_id`: `<screen_id>_<what>` slug, one per tappable control on that screen (`home_speak`, `home_type`, `book_read_together`). Not shown text: a renamed button keeps its id.
- `element_id`: same shape, for things that offer something (`home_slip_waiting`, `home_prompt`, `settings_plus_line`).
- An impression and its click share one id: `ui.home_slip_waiting.impressed` and `ui.home_slip_waiting.tapped`. Rate = tapped / impressed, same build, same period. A control that is also an element is registered once with kind `element`, and both events are allowed.
- `metric` for perf: closed list `launch_first_frame, launch_interactive, speak_tap_to_mic, save_commit, book_first_render, find_first_row, sync_round, copy_decode, migration, index_rebuild` (the closed union in MEASUREMENT-PLAN.md section 4); crash-free sessions come from the crash tool, not events.
- Ids never come from text on screen, a person, child, book, letter, picture or typed day word. A dynamic list (letter cards) is ONE element id (`book_letter_card`), never one per row.

## 5. Funnels

- A funnel is a registry row: id `f_<area>_<goal>` (lowercase snake, max 40 characters), an ordered list of 2 to 8 event names, a window (enum `session, d1, d7, d30`), the step that counts as success.
- Every step is an event name already in the registry; a funnel never defines a new event.
- Seeds (PM files add more): `f_onboarding_first_letter`, `f_capture_letter_saved`, `f_family_invite_joined`, `f_plus_trial_paid`, `f_keeping_copy_saved`.
- Funnels are queries (PostHog funnel insights or SQL), never code in the app. Reading rules (n, small-group suppression) belong to `decision-science` and FR-DAT-08.

## 6. Properties

- Names: snake_case, ASCII, max 30 characters, no `$`, no `schema` or `id` suffix on person-like things. A property exists only on the event rows that list it. Same name means same meaning in every event.
- Types (the three in `packages/analytics/src/schema.ts`; no fourth): enum (closed, snake_case values), bool, bounded int. No free text, no string that is not an enum value, no float, no array, no object, no date or timestamp (the platform adds capture time; a person-chosen or birthday-set time never).
- Counts are bucketed by the shared sets in `catalog.ts` (`LETTERS_BUCKET`, `AUDIO_BUCKET`, `SESSION_BUCKET`, ...). Shared set for time: `ms_bucket` = `lt_100ms, 100_300ms, 300ms_1s, 1_3s, 3_10s, gt_10s` (PROPOSED; align to NFR-BUDGETS ids when ops lands). `build_kind` = `store, testflight, preview, dev`.
- Never a property: entry text, transcript, audio, file name, path, child name or nickname, any date of birth or due date, email, person, book, letter, media or device id, Find query, typed day word, picture words or place, media count, size or duration of one item (NS-52-R43), religion, ethnicity, region or family background, health or assistive-technology detail. `lang` only on `languages` events (TRACKING_PLAN 6.2).
- Classification: every property is L2 (schema.ts); L3 and L4 are not representable.
- Global properties (client adds, nothing else may): `schema_version`, `child_count_bucket` optional, `sample_pct` optional (TRACKING_PLAN 3.2), plus the four SDK fields kept at source (`$app_version`, `$app_build`, `$os_name`, `$os_version`).

## 7. Registry row (the one definition)

One row per event, in `packages/analytics/src/catalog.ts` (code) and rendered into `docs/analytics/instrumentation/registry.md` by the existing `npm run plan` generator (TRACKING_PLAN 3.1 is generated the same way). Fields, all required:

| Field | Rule |
|---|---|
| name | section 2 |
| v | integer schema_version of this event, starts at 1 (section 8) |
| trigger | one line, never describes content |
| properties | each: name, type, allowed values or range, required or optional |
| class | L1 or L2, plus the sensitivity flag `none` (anything else blocks the row) |
| owner | a role from `agents/roster.json` |
| side | `phone`, `server`, `store`, `support` (only `phone` and `server` send; `store` and `support` are read-in, never emitted by us) |
| consent_gate | `analytics_consent` for phone events; `none_server_aggregate` for server counts with k = 10 (TRACKING_PLAN 4); `n/a` for store and support |
| status | `proposed`, `approved`, `built`, `deprecated` (with date) |
| req | at least one FR, NS or PRD id |
| funnels | funnel ids that use it, or `none` |

## 8. Versioning

- `v` is per event. Adding an optional property or an enum value: `v` +1, same name. Removing or retyping a property, or changing the trigger meaning: a NEW event name; the old row gets status `deprecated` with a date and stays for 90 days (PROPOSED) so dashboards can be moved. Never edit a name in place.
- The catalogue fingerprint test (exists) pins every row, so a change without a bump fails.
- Wire: the event carries `schema_version` = that event's `v` (today it carries one catalogue-wide number; migration step M2 in `analytics.md`).

## 9. One definition, many users

- A requirement, PM file, dashboard or funnel names events by NAME ONLY. It never restates properties or values; it links to the registry row.
- A name that is not in the registry is a defect in the requirement, not a reason to invent one at a call site.

## 10. Validator rules (tests that block a bad event)

All run in `packages/analytics/test` in the existing `unit` job; each has a positive and a negative self-test. V1 to V10 are static (registry vs code vs docs), V11 to V16 run on every payload and fail closed.

| Id | Rule | Fails when |
|---|---|---|
| V1 | Every name matches the grammar in section 2 | any other shape |
| V2 | Segment 3 is in the action list; segment 1 is an area or `screen`, `ui`, `perf` | otherwise |
| V3 | A name is a literal in the registry; call sites pass a typed helper or a name constant, never a built string | a template string or concatenation reaches `track(` (source scan) |
| V4 | Basics ids (`screen_id`, `control_id`, `element_id`, perf metric) exist in the id registry with an IA-FINAL id and an area | an id that is not registered |
| V5 | Every row has all fields of section 7; `req` non-empty; `owner` in roster | missing or unknown |
| V6 | Property names and types pass section 6; no `string` type exists; enum values are snake_case and 40 characters or fewer; ints have bounds | any other shape |
| V7 | No banned name pattern in a property or value: `name, email, text, transcript, query, title, caption, note, dob, birth, due, phone, address, token, path, file, url, media_id, letter_id, child_id, user_id, person` | a property named like one |
| V8 | Registry, code and tracking-plan doc agree both ways (an event in one is in the others) | drift |
| V9 | Every funnel step is a registered event; funnel ids match `f_<area>_<goal>` | otherwise |
| V10 | Deprecated rows are not emitted by code; a rename is a new row | otherwise |
| V11 | Unknown event: whole event dropped | (existing `validate.ts`) |
| V12 | Unknown property stripped; required property missing or wrong: event dropped | (existing) |
| V13 | PII-like value or string over 40 characters: event dropped (email, phone-like, URL, uuid, ISO date, JWT, long token) | (existing patterns) |
| V14 | Canary: the Asha strings (child name, date of birth, a letter sentence, a Find query, a file name) pushed through every typed helper and the PostHog `before_send` never appear in any outgoing payload | any canary hit |
| V15 | No event before consent: `track()` returns `dropped_no_consent`; no SDK constructed; nothing queued or written | (existing, plus EXPO_PUBLIC_ANALYTICS off in every 1.0.x profile, FR-DAT-01) |
| V16 | Cardinality guard: a basics id with more than 300 registered values per kind, or any property enum over 64 values, fails; session replay, autocapture, surveys and feature flags stay off | exceeded or any switched on (REQUIRED_POSTHOG_OPTIONS test) |

## 11. Identity and consent (applies to every event)

- No person id. The only identifier is the random id created at consent (`consent.ts`), never an email, Supabase user id or device id; it is retired on withdrawal and a later yes gets a new one, so two periods cannot be joined (TRACKING_PLAN 7).
- Nothing is sent before consent; withdrawal clears the queue and `optOut()`s; account deletion calls `analytics-forget` with the retired ids. Consent wording, the label change and counsel are the founder's.
- Server counts are aggregates with k = 10 (TRACKING_PLAN 4), never joined to analytics ids.

## 12. Where this tightens the coordinator baseline

1. Baseline rule 1 says every name is `<area>.<object>.<action>`, but rule 3 gives `screen.`, `ui.`, `perf.` first segments, which are not areas. Fixed by the two families in section 1. Each basics id belongs to one area in the id registry.
2. Action list closed (section 2), `$` prefix and 60-character cap added.
3. `screen_id` is a registered slug that maps to an IA-FINAL id (the IA ids `A-S01` have hyphens and capitals, which the grammar forbids).
4. Dynamic lists are one element id, not one per row.
5. `side` and `consent_gate` fields clarify rule 5 for store and support sources.
6. Deprecation window 90 days (PROPOSED).
7. Validator rules written out (V1 to V16); the baseline had only "reject names and properties not in the registry".

Proposed change box (needs erratum E83 if the founder wants it): the baseline puts ids in event names (`screen.home.viewed`), which gives about 150 registered names for screens and controls. The common PostHog shape is ONE event `screen_viewed` with a closed `screen_id` property, which keeps dashboards and funnels simpler. Decision for the founder; default: follow the founder's baseline (ids in the name), because the registry generates the names and the V16 cap keeps it bounded. A switch later is a rename under section 8.

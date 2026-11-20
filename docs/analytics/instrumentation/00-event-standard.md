# Event standard (the one every instrumentation file follows)

Status: PROPOSED, 20 Nov 2026. Author: `analytics`. Docs only. Founder rule (20 Nov): every event follows one standard, defined first, followed strictly in every requirement. Starts from the 8-line baseline in the coordinator brief (`/home/claude/event-standard-brief.md`); section 12 lists where this file tightens it. Founder direction 20 Nov: build for production now; analytics is built to ship in the production release behind the consent gate (opt-in, off until the parent says yes). What flips from the beta rules, and who decides, is in `analytics.md` section 1a. Host chosen by the founder on 20 Nov 2026: PostHog Cloud free tier, for product analytics and crash reporting, one vendor. Wire-name grammar, PostHog settings and crash rules: `posthog-standard.md` (Karma ruling 20 Nov: PostHog's own naming convention for wire names). Where that file and section 2 of this one differ on the shape of a name, `posthog-standard.md` wins; the registry, areas, ids, properties and consent rules here stand.

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
- Segment 3 (the action) MUST come from the closed action list, in the past tense: the list below (basics first). The list is the union of the verbs the PM files use on 20 Nov (#1036 to #1043 and the PM files on their branches) plus the original set:
  - basics: `viewed, tapped, impressed, measured` (`peeked` is a domain verb, not a basics verb; `family.invite.peeked` is the only user so far)
  - lifecycle: `started, finished, completed, ended, closed, opened, reached, dismissed`
  - things made or changed: `created, added, saved, recorded, changed, set, removed, deleted, restored, reverted, discarded, held, kept, sealed, switched, synced`
  - between people and systems: `sent, delivered, received, shared, accepted, declined, refused, rejected, revoked, withdrawn, granted, redeemed, selected, answered, used, acted, verified`
  - shown or held back: `shown, suppressed, exposed`
  - problems: `failed, violated, raised`
  `exposed` is for our own experiment arm (section 5b). Compound actions (`download_started`, `delete_started`, `notice_sent`, `let_go`, `delete_undone`) are not allowed: write object plus action (`keeping.download.started`, `keeping.deletion.started`, `notifications.notice.sent`, `capture.take.discarded`, `keeping.deletion.reverted`). Not an action: `succeeded` (use `completed`), `reported` (use `sent`), `erased` (use `deleted`), `missing` (use `failed` with a reason enum), `consent` and `ts` (not verbs).
  How a new verb is added: a PM or data file proposes it in a Proposed change box (meaning in one line, the event that needs it, why no listed verb fits). `analytics` adds it to this list in a PR to this file, tense past, one word, no overlap with a listed verb. CPO is informed; a verb that changes what a requirement means (for example anything about money or consent) needs the CPO's yes. V2 reads this list, so an event with an unlisted verb cannot merge.
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

A new area needs a CPO ruling and an erratum (placeholder E-INSTR-3; real numbers from E84 when ruled; E-INSTR-1 is the production-flip erratum in `analytics.md` section 1a and E-INSTR-2 is the ids-in-names box in section 12). Each screen, control and element in the id registry (section 4) carries exactly one area. A domain event's area is segment 1 of its name and the `area` field of its registry row (section 7), so it needs no screen: an on-screen event takes the area of that screen; an off-screen event seen by the phone (a reminder opened, a sync or purge outcome) takes the area of the feature it serves per the table above. Which area a phone-side off-screen event serves is a judgement call that no validator checks; it is a reviewer duty on the PR. Events that happen only on the server are not events at all (section 7, `side`); an event with no feature behind it (launch, crash, permission, pack download, remote config, errors with no owning screen) takes `system`. A validator does not derive the area from a screen (V5 only checks that the `area` field is one of the nine and equals segment 1 for domain events).

## 4. Basics: fixed names and the id registry

| Name | When | Closed properties |
|---|---|---|
| `screen.<screen_id>.viewed` | A screen or sheet is shown (route template or sheet name, never a resolved path) | `from_screen` (enum of screen_id or `none`), `build_kind` (enum, section 6) |
| `ui.<control_id>.tapped` | A control is activated (tap, or VoiceOver activate; keyboard for iPad later) | `screen` (enum of screen_id) |
| `ui.<element_id>.impressed` | A surface that offers something is on screen (slip, prompt, card, sheet body, banner, empty state, reminder delivered, in-app message) at least half visible for 1 second (PROPOSED thresholds, take a baseline), at most once per element per foreground session (one dedupe rule for every surface; a foreground session starts at cold start or when the app returns after 30 minutes or more away, the same rule as `app_opened`; a session counter lives in memory only) | `screen` (enum of screen_id), `rank` optional int 1 to 9 |
| `perf.<metric>.measured` | A performance measure completes | `ms_bucket` (enum, section 6), `ok` (bool). These two are the only perf properties; PM names `bucket`, `duration_bucket`, `value_ms_bucket` become `ms_bucket` |

Id registry (`packages/analytics` `ids.ts`, generated into `docs/analytics/instrumentation/ids.md`; each row: id, kind screen or sheet or control or element, area, IA-FINAL id such as `A-S01`, status):
- `screen_id`: lowercase snake slug, one per route template or named sheet. Seed from the 29 built routes in `packages/analytics/src/routes.ts` plus the IA-FINAL extras (age_gate, boot_error, plus_confirmed, not_found, invite_leave, whose_book, day_sheet). PM files add rows.
- `control_id`: `<screen_id>_<what>` slug, one per tappable control on that screen (`home_speak`, `home_type`, `book_read_together`). Not shown text: a renamed button keeps its id.
- `element_id`: same shape, for things that offer something (`home_slip_waiting`, `home_prompt`, `settings_plus_line`).
- An impression and its click share one id: `ui.home_slip_waiting.impressed` and `ui.home_slip_waiting.tapped`. Rate = tapped / impressed, same build, same period. A control that is also an element is registered once with kind `element`, and both events are allowed.
- `metric` for perf: closed list `launch_cold, launch_warm, launch_interactive, speak_to_mic, save_commit, book_first_render, find_first_row, switch_child, sync_apply, migration, index_rebuild, copy_decode, keeping_export, invite_sheet_open, join_arrival, new_phone_book_ready, picture_attach, reminder_open_home, reminder_replan` (the union in MEASUREMENT-PLAN.md section 4 plus the names PM files use). Synonyms map to one name: `cold_start` to `launch_cold`; `warm_start` to `launch_warm`; `speak_tap` to `speak_to_mic`; `save` to `save_commit`; `child_switch` to `switch_child`; `sync_round` to `sync_apply`. A new metric is added like a new verb.
- Crash-free sessions come from the crash tool and Apple, not from our events. If `ops` wants a `system.crash.reported`-style event, it is a normal registry row with closed properties, owned by `ops`; its action must be a listed verb (`sent`, not `reported`).
- Sheets and screens in PM files (the `screen_id` seeds): PM files list the ids; this file does not keep a second copy.
- Ids never come from text on screen, a person, child, book, letter, picture or typed day word. A dynamic list (letter cards) is ONE element id (`book_letter_card`), never one per row.

## 5. Funnels

- A funnel is a registry row: id `f_<area>_<goal>` (lowercase snake, max 40 characters), an ordered list of 2 to 8 event names, a window (enum `session, d1, d7, d30`), the step that counts as success.
- Every step is an event name already in the registry; a funnel never defines a new event.
- Seeds (PM files add more): `f_onboarding_first_letter`, `f_capture_letter_saved`, `f_family_invite_joined`, `f_plus_trial_paid`, `f_keeping_copy_saved`.
- Funnels are queries (PostHog funnel insights or SQL), never code in the app. Reading rules (n, small-group suppression) belong to `decision-science` and FR-DAT-08.

## 6. Properties

- Names: snake_case, ASCII, max 30 characters, no `$`, no `schema` or `id` suffix on person-like things. A property exists only on the event rows that list it. Same name means same meaning in every event.
- Types (the three in `packages/analytics/src/schema.ts`; no fourth): enum (closed, snake_case values), bool, bounded int. An enum may take its values from an id registry (kind `screen`, `control`, `element`, `metric`, `experiment`, `arm`): an id-ref enum. On the wire it is still an enum; the validator reads the registry list instead of a literal list. `screen`, `from_screen` and the `screen` property on `ui.*` are id-ref enums of kind `screen`. No free text, no string that is not an enum value, no float, no array, no object, no date or timestamp (the platform adds capture time; a person-chosen or birthday-set time never).
- Counts are bucketed by the shared sets in `catalog.ts` (`LETTERS_BUCKET`, `AUDIO_BUCKET`, `SESSION_BUCKET`, ...). Shared set for time: `ms_bucket` = `lt_100ms, 100_300ms, 300ms_1s, 1_3s, 3_10s, gt_10s` (PROPOSED; align to NFR-BUDGETS ids when ops lands). Values that start with a digit are valid: the enum shape in `validate.ts` is `^[a-z0-9]+(?:_[a-z0-9]+)*$` [V], and V6 uses the same shape. `build_kind` = `store, testflight, preview, dev`.
- Never a property: entry text, transcript, audio, file name, path, child name or nickname, any date of birth or due date, email, person, book, letter, media or device id, Find query, typed day word, picture words or place, media count, size or duration of one item (NS-52-R43), religion, ethnicity, region or family background, health or assistive-technology detail. `lang` only on `languages` events (TRACKING_PLAN 6.2).
- Classification: every property is L2 (schema.ts); L3 and L4 are not representable.
- Global properties (client adds, nothing else may): `schema_version`, `child_count_bucket` optional, `sample_pct` optional (TRACKING_PLAN 3.2), plus the FIVE SDK fields kept at source: `$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type` (TRACKING_PLAN 3.2 [V]). The SDK's own internal fields are exactly these five and no others: `$lib`, `$lib_version`, `$session_id`, `$process_person_profile`, `$geoip_disable` (the `$exception` fields of `posthog-standard.md` section 4 are a separate, error-only list). They pass `before_send` but are not properties of ours and are not in any registry row. The `$` ban applies to registry property names; the five SDK fields above plus these five internals are the only `$` keys that may leave the phone for a normal event, and a test (V6) pins this exact list of ten, so adding one is a PR to this file. `$session_id` is a random value the SDK makes for one foreground session; it is an identifier, so it is allowed only because it is not stable across sessions, is not derived from the consent id and cannot be joined to an account, which keeps the consent id the only identifier that lasts. Whether it survives that reading is for `privacy` to confirm; if not, `before_send` strips it and the funnel window `session` is computed from `app_opened` instead. A real payload from a throwaway project, not this file, is the proof of what the SDK sends [UNVERIFIED until the QA step in `posthog-standard.md` section 6].

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
| area | one of the nine areas (section 3); equals segment 1 for a domain event; the area of the id for a basics event |
| side | `phone`, `server`, `store`, `support`. Only `phone` rows are events on the wire. `server` rows are database views or counters read by the team (a count of accepted invites, a delivered reminder as the server sees it); they never pass `track()` and are never sent to PostHog. `store` and `support` are read-in, never emitted by us |
| consent_gate | `analytics_consent` for every `phone` event (the only gate that sends). `none_server_aggregate` for `server` rows: counts with k = 10 (TRACKING_PLAN 4), no consent gate because nothing about a person is sent to PostHog and nothing is joined to the analytics id. `n/a` for store and support. A `server` row carrying `analytics_consent`, or a `phone` row carrying any other gate, fails V5 |
| status | `proposed`, `approved`, `built`, `deprecated` (with date) |
| req | at least one FR, NS or PRD id |
| funnels | funnel ids that use it, or `none` |

## 8. Versioning

- `v` is per event. Adding an optional property or an enum value: `v` +1, same name. Removing or retyping a property, or changing the trigger meaning: a NEW event name; the old row gets status `deprecated` with a date and stays for 90 days (PROPOSED) so dashboards can be moved. Never edit a name in place.
- The catalogue fingerprint test (exists) pins every row, so a change without a bump fails.
- Schema version, said once: `v` is the version of ONE event, stored in its registry row, and is what the event sends as `schema_version`. The single catalogue-wide number that exists today (TRACKING_PLAN 3.2; PM files quote different values, so check the source at migration step M2) stops being sent; it remains only as the fingerprint the catalogue test pins.

## 9. One definition, many users

- A requirement, PM file, dashboard or funnel names events by NAME ONLY. It never restates properties or values; it links to the registry row.
- A name that is not in the registry is a defect in the requirement, not a reason to invent one at a call site.

## 10. Validator rules (tests that block a bad event)

All run in `packages/analytics/test` in the existing `unit` job; each has a positive and a negative self-test. V1 to V10 are static (registry vs code vs docs). V11 to V13 are runtime checks that run on every payload and fail closed. V14 to V17 are tests (canary, consent behaviour, caps, SDK options). `posthog-standard.md` section 2.9 restates V1 to V3 for the colon grammar and adds checks; this table keeps the numbers.

| Id | Rule | Fails when |
|---|---|---|
| V1 | Every name matches the grammar in section 2 | any other shape |
| V2 | Segment 3 is in the action list; segment 1 is an area or `screen`, `ui`, `perf`. Pairing: `screen.*` takes only `viewed`; `ui.*` only `tapped` or `impressed`; `perf.*` only `measured`; a domain event may not use `viewed`, `tapped`, `impressed` or `measured` (those four belong to basics) | a verb not on the list, or a pairing broken |
| V3 | A name is a literal in the registry. Basics names are generated at BUILD time from `ids.ts` into the registry and into typed helpers; at run time no code builds a name from a variable. What holds this is the typed-helper-only rule (the module of `posthog-standard.md` section 3.1 is the only caller of the SDK); the source scan is the backstop and cannot catch a name built outside the `track(` call | a template string or concatenation reaches `track(` (source scan), or a generated name is not in the registry |
| V4 | Basics ids (`screen_id`, `control_id`, `element_id`, perf metric) exist in the id registry with an IA-FINAL id and an area | an id that is not registered |
| V5 | Every row has all fields of section 7; `req` non-empty; `owner` in roster | missing or unknown |
| V6 | Property names and types pass section 6; no `string` type exists; enum values are snake_case and 40 characters or fewer; ints have bounds | any other shape |
| V7 | No banned token in a property NAME. Match rule: split the name on `_` and compare each WHOLE token (so `file` matches `file_kind`, not `profile`). Banned anywhere: `name, email, text, transcript, query, title, caption, note, dob, birth, birthday, due, phone, address, token, path, file, url, media`. Banned only when followed by `id` or `ids`: `letter, child, user, person, book, device, entry` (so `child_count_bucket` and `child_ordinal` pass, `child_id` fails). Applies to property names only: not to values, registered ids, or registry fields (the `side` value `phone` is fine). A registered id that contains a banned token (for example a control `settings_child_name`) is allowed only with a registry note that it names a control, not a value; the reviewer reads those notes | a property name with a banned whole token |
| V8 | Registry, code and tracking-plan doc agree both ways (an event in one is in the others). Exempt: rows with status `deprecated` (in the registry and docs, not in code) and rows with `side` `server`, `store` or `support` (in the registry and docs, never in code) | drift |
| V9 | Every funnel step is a registered event; funnel ids match `f_<area>_<goal>` and are 40 characters or fewer; 2 to 8 steps; window is one of `session, d1, d7, d30` (section 5) | any step not registered, a bad id shape or length, fewer than 2 or more than 8 steps, or any other window |
| V10 | Deprecated rows are not emitted by code; a rename is a new row | code emits a deprecated name, or a name present in an older registry fingerprint is missing without a `deprecated` row |
| V11 | Unknown event: whole event dropped | a name not in the registry reaches the SDK (the self-test sends one and expects `dropped_unknown_event`) |
| V12 | Unknown property stripped; required property missing or wrong: event dropped | an unlisted property is in the outgoing payload, or an event with a missing or out-of-set required value is sent |
| V13 | PII-like value or string over 40 characters: event dropped (email, phone-like, URL, uuid, ISO date, JWT, long token) | any value matching those patterns, or longer than 40 characters, is in an outgoing payload (the one uuid allowed is the consent id, in the distinct id field only) |
| V14 | Canary: the Asha strings (child name, date of birth, a letter sentence, a Find query, a file name) pushed through every typed helper and the PostHog `before_send` never appear in any outgoing payload | any canary hit |
| V15 | No event before consent: `track()` returns `dropped_no_consent`; no SDK constructed; nothing queued or written | the SDK is constructed, or any byte is queued, written or sent, before a yes (existing; plus the production-only build flag test, `analytics.md` section 1a) |
| V16 | Cardinality guard, one rule per kind. An id registry kind (`screen`, `control`, `element`, `metric`, `experiment`, `arm`) may hold at most 300 ids, and id-ref enums are limited only by that cap. Every other enum (a literal value list) holds at most 64 values | a cap exceeded |
| V17 | SDK options pinned: a test on `REQUIRED_POSTHOG_OPTIONS` (the full list is `posthog-standard.md` section 3.4) | replay, autocapture, surveys, logs, remote flags, lifecycle events or flag events switched on, or a pinned option missing |

## 11. Identity and consent (applies to every event)

- No person id. The only identifier is the random id created at consent (`consent.ts`), never an email, Supabase user id or device id; it is retired on withdrawal and a later yes gets a new one, so two periods cannot be joined (TRACKING_PLAN 7).
- No fresh random id per send. PM3 proposes an unlinked weekly summary under its own id; ruling: not allowed. A new id for each batch would make unique-person counts, funnels and retention meaningless (every send looks like a new person), and it buys no privacy the consent-time id lacks, because the id is already random, never joined to an account, and retired on withdrawal. A weekly summary is either a normal event under the consent-time id, or a server aggregate (k = 10) that never touches the app. If the founder wants an unlinkable channel, that is a separate decision with counsel, and the funnels and retention in `decision-science.md` would not run on it.
- Experiments: PostHog feature flags and experiments stay off (V16). An experiment arm is drawn at random on the device from a registered closed list, kept only on the device, and reported with our own exposure event `system.experiment.exposed` (properties `experiment` and `arm`, both id-ref enums of kinds `experiment` and `arm`). Analysis uses that event in funnels. This replaces the PostHog-flag alternative in `decision-science.md` section on arms (its own exposure event option is the one used).
- Surfaces timed by a birthday, a due date or a seal opening (birthday-week Save a copy, seal-opened line, past letter on a birthday) are not registrable as `element` ids, and no event may fire at a time they set. Sources, both read on 20 Nov [V]: FR-DAT-27 in `docs/product/prd/functions/data-and-measurement.md` (no event, in any version, at a seal's opening time, for typed-day delivery or open, for the birthday-week Save a copy slip, or for month or birthday notes) and TRACKING_PLAN 6.4 (no event may fire at a time determined by a child's birthday or due date). FR-DAT-27 does not name a due date; 6.4 does. The `catalog.ts` header rule on timing leaks was read earlier [V].
- Nothing is sent before consent. Withdrawal stops new events, clears the queue on the phone and in the SDK, retires the id, and calls `optOut()` and `reset()`. It does not delete what was already sent: those events stay until the retention period ends, and a person with no account has no route to delete them (data-steward finding F-1, #1037). Account deletion calls `analytics-forget` with the retired ids, and what happens there is thinner than the promise: PostHog may not delete events that have no person profile (F-2, and a staging drill, IN-DS-06, has not run); a 202 reply means accepted, not deleted (F-3); deletion is asynchronous, runs off-peak with a two-day cutoff, and backups keep event data about two weeks, so the promise reads "within about a month", not "now" (F-4); and `MAX_RETIRED_IDS = 20` silently drops the oldest id, so a 21st toggle leaves one period undeletable (F-5). Until IN-DS-06 passes, no screen, label or policy line may say withdrawal or deletion removes everything. Where the ids live after withdrawal: retired ids stay on the phone only, at most 20, until account deletion or Erase everything, so deletion can reach old events (data-steward section 5); they are never sent anywhere else and are a retained identifier on the device, which counsel sees in the label review. Consent wording, the label change and counsel are the founder's.
- Server counts are aggregates with k = 10 (TRACKING_PLAN 4), never joined to analytics ids.

## 12. Where this tightens the coordinator baseline

1. Baseline rule 1 says every name is `<area>.<object>.<action>`, but rule 3 gives `screen.`, `ui.`, `perf.` first segments, which are not areas. Fixed by the two families in section 1. Each basics id belongs to one area in the id registry.
2. Action list closed (section 2), `$` prefix and 60-character cap added.
3. `screen_id` is a registered slug that maps to an IA-FINAL id (the IA ids `A-S01` have hyphens and capitals, which the grammar forbids).
4. Dynamic lists are one element id, not one per row.
5. `side` and `consent_gate` fields clarify rule 5 for store and support sources.
6. Deprecation window 90 days (PROPOSED).
7. Validator rules written out (V1 to V17); the baseline had only "reject names and properties not in the registry".
8. PostHog alignment (20 Nov, Karma ruling): wire names follow PostHog's `category:object_action` convention; see `posthog-standard.md` section 2. Section 2 here keeps the registry rules (areas, closed verbs, no dynamic names).
9. Review A and B fixes (20 Nov): id-ref enums exempt from the 64 cap, action list extended, area rule for server events, V7 token match, one `$` number, schema version said once, no fresh id per send, one impression dedupe rule, flags off with our own exposure event.

Proposed change box (needs an erratum, placeholder E-INSTR-2; real numbers from E84 when ruled; E83 is taken by #1051): the baseline puts ids in event names (`screen.home.viewed`), which gives about 150 registered names for screens and controls. The common PostHog shape is ONE event `screen_viewed` with a closed `screen_id` property, which keeps dashboards and funnels simpler. Decision for the founder; default: follow the founder's baseline (ids in the name), because the registry generates the names and the V16 cap keeps it bounded. A switch later is a rename under section 8.

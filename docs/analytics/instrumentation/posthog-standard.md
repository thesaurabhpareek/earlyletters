# PostHog standard: how we name, send and crash-report with PostHog

Status: PROPOSED, 20 Nov 2026. Author: `analytics`. Docs only, no code and no dependency added. Founder decision, 20 Nov 2026: PostHog Cloud free tier is the only vendor, for product analytics AND crash reporting (Error Tracking). Karma (CTO) rulings, 20 Nov: wire names follow PostHog's own published naming convention; crash reporting uses PostHog Error Tracking, no second vendor.

Read with: `00-event-standard.md` (registry, areas, properties, consent; where it and this file differ on the shape of a name, this file wins), `analytics.md` (stack, what flips from the beta rules), `data-steward.md` (classification, deletion findings F-1 to F-5).

Tags: [V] read this session on 20 Nov from the page named; [U] not read, so UNVERIFIED; [E] estimate with its basis. Anything from the founder's notes that I did not read myself is marked UNVERIFIED. Nothing here is invented: where PostHog's docs are silent I say so and give a test, not a guess.

Words: MUST and MUST NOT are the validators' job (section 2.9). Everything is ASCII; no em or en dashes, curly quotes, ellipsis characters or emoji.

Limits of my sources, up front: I read PostHog's docs pages, not its code and not our code (this PR is docs only, sparse checkout). A conflict of interest worth naming: I am proposing rules for a vendor the founder already chose, so the risks I list for PostHog (section 5, and "what it costs us") are the part to read most carefully.

## 1. First principles

1. We learn from families who said yes, and never from a word they wrote. Content, names, dates of birth, pictures, places and Find queries never reach PostHog (CLAUDE.md privacy rules, LEGAL-REQ-014). Everything below serves that.
2. One vendor, one project, one module. Every event goes through one typed module; nothing else in the app touches the SDK (PostHog's own handbook asks for the same [V posthog.com/handbook/customer-success/shareable-guides/instrumenting-posthog-in-the-development-process]).
3. Track on purpose. PostHog says to track key growth events explicitly, not only what autocapture finds [V posthog.com/docs/product-analytics/best-practices]. We turn autocapture off and write every event down first.
4. Names are data, not code. A name is a fixed string in a registry row. It is never built from a variable, never carries a person, child, letter or id value, and is never renamed once it has history (section 2.6).
5. The SDK defaults are not our defaults. Several PostHog defaults send things we never agreed to (lifecycle events, feature flag events, geoip). Section 3.4 lists each one and our value.
6. The SDK is only the transport. Our own validators (V1 to V18) and the last gate in `before_send` decide what leaves the phone. If PostHog changes a default, a test fails instead of a payload leaking.
7. Use PostHog for behaviour over time; use our own database for counts that must be exact. PostHog says backend or database numbers are more reliable than frontend ones for figures like weekly signups [V best-practices]. Our server counts stay in Supabase views (k = 10) and never go to PostHog.
8. Honest limits. Withdrawal stops new events; deletion is slow and unproven until the drill (`00-event-standard.md` section 11, `data-steward.md` F-1 to F-5). No screen or policy line promises more.

## 2. Naming and format

### 2.1 What PostHog recommends (the convention we adopt) [V posthog.com/docs/product-analytics/best-practices]

- Lowercase letters, snake case, present-tense verbs.
- Event names: `category:object_action`. Category is the context (`signup_flow`), object the component or location (`pricing_page`), action a verb. Example: `signup_flow:pricing_page_view`.
- Verbs from a fixed list: click, submit, create, view, add, invite, update, delete, remove, start, end, cancel, fail, generate, send.
- Property names: `object_adjective` (`member_count`). Booleans start `is_` or `has_`. Dates and timestamps end `_date` or `_timestamp`.
- Names are static strings; variables go in property values. Too many unique property names can get new property definitions rate limited.
- To change a flow, version the event: `registration_v2:sign_up_button_click`. The handbook adds: never rename an event that has history; version it and join old and new with an action [V handbook page].

### 2.2 Our grammar

```
name     = category ":" object "_" verb
category = area [ "_v" digit2to9 ]          ; area from the closed list in 2.3
object   = token *( "_" token )              ; token = [a-z0-9]+, first token starts with a letter
verb     = one word from the closed list in 2.4, always the last token
```
- Exactly one colon. Lowercase ASCII only. No `$` at the start (PostHog reserves `$` for its own events [V posthog.com/docs/data/events]). No dot, hyphen, space or capital.
- At most 60 characters in all. PostHog's docs state no length or character rules for event names [V data/events], so 60 is our limit, kept from `00-event-standard.md`, not PostHog's.
- Regex a test can use: `^(onboarding|capture|book|family|keeping|me|plus|notifications|system)(_v[2-9])?:[a-z][a-z0-9]*(_[a-z0-9]+)*_(VERBS)$` where VERBS is the list in 2.4.
- Example: `capture:letter_save`, `book:b_s01_screen_view`, `capture:home_speak_click`.

### 2.3 Category: the nine areas (closed)

`onboarding, capture, book, family, keeping, me, plus, notifications, system` (the areas of `00-event-standard.md` section 3, one per IA home). Every basics id (screen, control, element, perf metric) carries one area in the id registry, so the category of `capture:home_speak_click` comes from the id, not from the call site. An id never changes area; moving a screen is a new id. A version of an event puts `_v2` on the category, as PostHog's example does (`capture_v2:letter_save`).

### 2.4 Verbs (closed): PostHog's list, minus one, plus nine deviations

Used as PostHog defines them: `click, submit, create, view, add, invite, update, delete, remove, start, end, cancel, fail, send`.

Not used: `generate`. Nothing in this product generates anything on a person's behalf (the constitution: the machine may remove and repair, never add), so the word is off the list so that no event can imply it.

Deviations (a verb PostHog's list does not have). Each needs a reason a funnel or a decision depends on; none is added casually (section 2.5):

| Verb | Why PostHog's list does not do | Used for |
|---|---|---|
| `save` | `create` hides the product's core act and cannot tell a first save from a later edit save; the activation funnel needs it by name | a letter, take, media or book saved |
| `complete` | `end` says a flow stopped, not that it worked; funnels need the success step apart from `fail` and `cancel` | transcript, export, first letter, restore, sign-in finished |
| `measure` | a performance reading is not a person's action and has no PostHog verb | `perf` basics |
| `open` | an entry from outside (a reminder, a link) happens before any screen is drawn, so `view` would be wrong | reminder, invite link, plan notice |
| `restore` | an undo or return to an earlier state (a deleted letter, a reverted machine edit) has no PostHog verb; `create` would double count | undo of delete, edit revert |
| `accept` | agreeing to terms or an invite is a decision, not a form `submit` | terms, invite, consent yes |
| `decline` | the matching no, from a person or from us (an unsupported region) | decline, refuse, reject |
| `dismiss` | closing a slip without acting is neither `cancel` nor `end` | slips, cards |
| `reach` | a limit or milestone is hit with no action behind it | free allowance reached |

Folded into PostHog verbs (no deviation, except `complete` below): shown, impressed, peeked, exposed, selected become `view` or `update`; tapped becomes `click`; delivered, shared, notice sent become `send`; suppressed, discarded become `cancel`; revoked, withdrawn become `remove`; failed, violated, raised become `fail`; redeemed, answered become `submit`; held and sealed become `create` on a `letter_hold` or `letter_seal` object (`plus:letter_hold_create`, `keeping:letter_seal_create`); used becomes `start`; closed and finished become `end`. Synced becomes `complete`, which is one of the nine deviations in the table above, not a fold. `tap` is not a verb: `click` is the PostHog word and means a tap on a phone, including a VoiceOver activate.

### 2.5 Adding a verb, area or category

Same as `00-event-standard.md` section 2: a Proposed change box (meaning in one line, the event that needs it, why no listed verb fits), `analytics` adds it here, CPO informed. A verb that changes what a requirement means (money, consent) needs the CPO's yes. A new area is erratum placeholder E-INSTR-3 (`00-event-standard.md` section 3). The test reads this list, so an unlisted verb cannot merge.

### 2.6 Static names, versions and renames

- Static: a name is a literal in the registry. The id inside a basics name comes from the id registry at build time. No template string, no concatenation, no child, letter, person or value in a name. Property names are static too and come from the closed list per event (section 6.1).
- Additive change (a new optional property or enum value): same name, `v` +1 (per `00-event-standard.md` section 8).
- Breaking change (a removed or retyped property, a changed trigger): a new name with the category versioned (`capture_v2:letter_save`), the old row `deprecated` with a date, kept 90 days (PROPOSED). In PostHog, one Action named `capture: letter_save (all versions)` matches both names, so dashboards read the Action and keep working [V handbook page: "create an action that joins the old and new names"; the exact steps in the UI I did not read, UNVERIFIED].
- Never rename an event that has history. The one-time rename of the 68 catalogue events (IN-03) is allowed only because nothing has ever been sent (FR-DAT-01 beta rule; `privacy` review B, 20 Nov). That holds only while no build with the analytics flag on has shipped. After the first production release with the flag on, every rename follows this section.

### 2.7 Property names and values

| Rule | Source |
|---|---|
| `object_adjective` or `object_noun`: `member_count`, `child_ordinal`, `ms_bucket`, `words_bucket` | PostHog [V] |
| Booleans start `is_` or `has_`. Our existing bools are renamed once, with the catalogue: `signed_in` to `is_signed_in`, `had_local_data` to `has_local_data`, `came_from_invite` to `is_from_invite`, `from_notification_2h` to `is_from_notification_2h`, `added_together` to `is_added_together`, `in_first_run` to `is_in_first_run`, `ok` to `is_ok`; `has_date` stays | PostHog [V]; the list is mine from TRACKING_PLAN 3.1, which I read |
| `_date` and `_timestamp` suffixes are RESERVED AND BANNED here: no property is a date or time (the platform adds capture time; a birthday-set or person-set time never). `date` and `timestamp` are banned tokens in V7, with ONE named exemption: the bool `has_date` stays (it says only that a date exists, never its value; the V7 exemption list holds exactly this name and the self-test checks `has_date` passes and `birth_date` fails) | PostHog's suffix rule [V]; our rule from `00-event-standard.md` section 6 |
| Types stay three: enum (closed lowercase snake values), bool, bounded int | `schema.ts` |
| Max 30 characters, no `$` | `00-event-standard.md` section 6 |
| No person-like or content-like token anywhere in a name (V7 list) | `00-event-standard.md` section 10 |
| At most 12 properties on one event [E: my proposal; PostHog says unique property names are rate limited, not a number] | PostHog [V] and mine |

`$`-prefixed names stay PostHog's. We never register one. The only `$` keys that may leave the phone are the ten of `00-event-standard.md` section 6 (the five SDK fields and five internals) and the error-only list in section 4.4.

### 2.8 Colon names in insights and funnels: what I found

- PostHog's handbook uses colon names throughout (`scheduled_reports:schedule_create`) and recommends `category:object_action` [V handbook page, best-practices page].
- No PostHog page I read states a restriction on colons, and none confirms funnels or HogQL work with them. The events page lists no character rules [V data/events]. So: they should work, and I have not seen it written down [UNVERIFIED].
- Test before IN-05 is merged (a one-hour task on a throwaway free project with Asha data): send `capture:letter_save` and `capture_v2:letter_save`; build a trends insight, a two-step funnel, a retention insight and a HogQL query (`event = 'capture:letter_save'`); make the joining Action. Record the result in this file. If any step fails, the fallback is the same name with `__` for the colon in the adapter only (section 3.1); the registry keeps the colon.

### 2.9 Names old and new: the mapping

The PM files and `00-event-standard.md` write dotted working names (`capture.letter.saved`). The registry holds ONE name, the wire name. PM files and the standard's examples keep the dotted names until their next edit; this table is the bridge. A `(none)` row is not a wire event: a server count, a crash, or something that cannot exist. Counted on 21 Nov by script over the table below (the event rows, not the four pattern rows of the Basics table above, which are generated per id): 98 rows in all, 13 with `(none)` and 85 with a wire name (27 of the 85 are marked deviation; the 85 wire names are all different, and no old name repeats). The 13 `(none)` rows are 9 server-only or server counts (`notifications.reminder.delivered`, `family.invite.peeked`, `family.second_voice.reached`, `family.second_voice.kept`, `system.email.sent`, `onboarding.email.sent`, `onboarding.summary.sent`, `keeping.security.notice_sent`, `keeping.summary.sent`), 3 that cannot or must not exist (`keeping.consent.declined`, `keeping.export.shared`, `keeping.slip.shown`) and 1 replaced by the reduced `$exception` (`system.crash.reported`). 9 + 3 + 1 = 13; 13 + 85 = 98. Sources: `00` and `analytics.md` are #1042 (merged); `02`, `04`, `05` are the merged PM files on develop; #1040 (PM1), #1041 (PM3), #1044 (ops), #1052 (data-architect) are open PRs read at their head shas on 20 Nov by raw file. "(deviation)" marks a verb from the 2.4 table.

Basics (generated at build time from `ids.ts`; the area comes from the id registry):

| Old | New | Example |
|---|---|---|
| `screen.<screen_id>.viewed` | `<area>:<screen_id>_screen_view` | `screen.b_s01.viewed` to `book:b_s01_screen_view` |
| `ui.<control_id>.tapped` | `<area>:<control_id>_click` | `ui.home_speak.tapped` to `capture:home_speak_click` |
| `ui.<element_id>.impressed` | `<area>:<element_id>_view` | `ui.home_slip_waiting.impressed` to `notifications:home_slip_waiting_view` |
| `perf.<metric>.measured` | `<area>:<metric>_measure` (deviation) | `perf.save_commit.measured` to `capture:save_commit_measure` |

A screen or sheet id gets the `_screen` suffix in the object so a screen view and an element view of the same id cannot collide; an id may not end in a verb token or in `_screen` unless it is a screen (V4). An impression and its click share one id, so the rate is `_click` over `_view`, same build and period. The 68 catalogue events map by the same rule (IN-03 holds that full table); the seven examples of `analytics.md` section 7: `letter_saved` to `capture:letter_save`, `capture_started` to `capture:take_start`, `invite_created` to `family:invite_create`, `plus_offer_viewed` to `plus:offer_view`, `export_completed` to `keeping:export_complete`, `error_shown` to `system:error_view`, `screen_view` to the 29 generated screen names.

Domain names:

| Old | Seen in | New | Note |
|---|---|---|---|
| `capture.letter.saved` | #1042, 04, #1040 | `capture:letter_save` (deviation) |  |
| `family.invite.accepted` | #1042, 04, #1052 | `family:invite_accept` (deviation) |  |
| `notifications.reminder.delivered` | #1042, 04, #1040 | (none) | server-only, not sent to PostHog (the phone cannot observe it; `00-event-standard.md` section 7 `side: server`); PM5 line 128 says no delivered event: PM4 and PM5 disagree, `product` to settle. If the phone ever sees a reminder opened, that is a separate row |
| `keeping.download.started` | #1042 | `keeping:download_start` |  |
| `keeping.deletion.started` | #1042 | `keeping:deletion_start` |  |
| `keeping.deletion.reverted` | #1042 | `keeping:deletion_restore` (deviation) |  |
| `capture.take.discarded` | #1042 | `capture:take_cancel` |  |
| `notifications.notice.sent` | #1042 | `notifications:notice_send` |  |
| `system.experiment.exposed` | #1042 | `system:experiment_exposure_view` | our own exposure event; flags stay off |
| `plus.offer.shown` | #1042, analytics.md | `plus:offer_view` |  |
| `keeping.export.completed` | #1042, #1041 | `keeping:export_complete` (deviation) |  |
| `system.error.shown` | #1042, 02, #1040 | `system:error_view` |  |
| `capture.take.started` | #1042 | `capture:take_start` |  |
| `family.invite.sent` | #1042, analytics.md | `family:invite_send` |  |
| `book.lens.changed` | 02 | `book:lens_update` |  |
| `book.playback.started` | 02 | `book:playback_start` |  |
| `book.read_together.ended` | 02 | `book:read_together_end` |  |
| `book.read_together.started` | 02 | `book:read_together_start` |  |
| `book.share.closed` | 02 | `book:share_end` |  |
| `book.share.started` | 02 | `book:share_start` |  |
| `capture.media.added` | 02 | `capture:media_add` |  |
| `keeping.letter.deleted` | 02 | `keeping:letter_delete` |  |
| `book.search.used` | 02 | `book:search_start` | `used` folded to `start` |
| `keeping.letter.sealed` | 02 | `keeping:letter_seal_create` | a seal is a record created; the opening time is never an event (FR-DAT-27) |
| `family.invite.created` | 04 | `family:invite_create` |  |
| `family.invite.failed` | 04 | `family:invite_fail` |  |
| `family.invite.shared` | 04 | `family:invite_share_send` | RULING: `family.invite.sent` keeps `family:invite_send` (the invite was handed out); `shared` gets its own object so the two funnel steps stay apart and V8 can tell them apart |
| `family.invite.peeked` | 04, #1052 | (none) | SERVER counter in PM4 and #1052: not on the wire |
| `family.second_voice.reached` | 04, #1052 | (none) | SERVER weekly count (k = 10): not on the wire |
| `family.second_voice.kept` | #1052 | (none) | SERVER view: not on the wire |
| `family.invite.opened` | #1052 | `family:invite_open` (deviation) | RULING: phone side only. The phone sends `family:invite_open` when an invite link opens the app after a yes. The server-side count of invite opens is `family.invite.peeked` above and is not on the wire; #1052 must not count `opened` on the server |
| `notifications.permission.answered` | 04 | `notifications:permission_submit` |  |
| `notifications.permission.revoked` | 04 | `notifications:permission_remove` |  |
| `notifications.plan.violated` | 04 | `notifications:plan_fail` |  |
| `notifications.reminder.opened` | 04 | `notifications:reminder_open` (deviation) |  |
| `notifications.reminder.suppressed` | 04 | `notifications:reminder_cancel` |  |
| `notifications.schedule.changed` | 04 | `notifications:schedule_update` |  |
| `notifications.schedule.failed` | 04 | `notifications:schedule_fail` |  |
| `notifications.plan_notice.opened` | 05 | `notifications:plan_notice_open` (deviation) |  |
| `system.email.sent` | 04, #1052 | (none) | SERVER: not on the wire |
| `capture.take.saved` | 05 | `capture:take_save` (deviation) |  |
| `plus.allowance.reached` | 05 | `plus:allowance_reach` (deviation) |  |
| `plus.code.redeemed` | 05 | `plus:code_submit` |  |
| `plus.letter.held` | 05 | `plus:letter_hold_create` |  |
| `plus.offer.closed` | 05 | `plus:offer_end` |  |
| `plus.plan.changed` | 05 | `plus:plan_update` |  |
| `plus.plan.started` | 05 | `plus:plan_start` |  |
| `plus.restore.completed` | 05 | `plus:restore_complete` (deviation) |  |
| `system.app.opened` | 05 | `system:app_open` (deviation) |  |
| `system.error.raised` | 05 | `system:error_fail` |  |
| `system.session.ended` | 05 | `system:session_end` |  |
| `system.diagnostic.received` | 05 | `system:diagnostic_add` | meaning not clear to me and `receive` is not allowed; PM5 to say what it is or drop it [UNVERIFIED: meaning] |
| `capture.author.changed` | #1040 | `capture:author_update` |  |
| `capture.edit.declined` | #1040 | `capture:edit_decline` (deviation) |  |
| `capture.letter.started` | #1040 | `capture:letter_start` |  |
| `capture.media.saved` | #1040 | `capture:media_save` (deviation) |  |
| `capture.transcript.completed` | #1040 | `capture:transcript_complete` (deviation) |  |
| `me.setting.changed` | #1040 | `me:setting_update` |  |
| `notifications.permission.changed` | #1040 | `notifications:permission_update` |  |
| `notifications.reminder.declined` | #1040 | `notifications:reminder_decline` (deviation) |  |
| `onboarding.account.completed` | #1040 | `onboarding:account_complete` (deviation) |  |
| `onboarding.book.saved` | #1040 | `onboarding:book_save` (deviation) |  |
| `onboarding.email.sent` | #1040 | (none) | server-only, not sent to PostHog (the phone cannot observe it; `00-event-standard.md` section 7 `side: server`) |
| `onboarding.first_letter.completed` | #1040 | `onboarding:first_letter_complete` (deviation) |  |
| `onboarding.region.refused` | #1040 | `onboarding:region_decline` (deviation) |  |
| `onboarding.sensitive.accepted` | #1040 | `onboarding:sensitive_accept` (deviation) |  |
| `onboarding.sign_in.completed` | #1040 | `onboarding:sign_in_complete` (deviation) |  |
| `onboarding.sign_in.dismissed` | #1040 | `onboarding:sign_in_dismiss` (deviation) |  |
| `onboarding.sign_in.failed` | #1040 | `onboarding:sign_in_fail` |  |
| `onboarding.summary.sent` | #1040 | (none) | server-only, not sent to PostHog (the phone cannot observe it; `00-event-standard.md` section 7 `side: server`) |
| `onboarding.terms.accepted` | #1040 | `onboarding:terms_accept` (deviation) |  |
| `system.pack.started` | #1040 | `system:pack_start` |  |
| `capture.child.selected` | #1040 | `capture:child_update` |  |
| `capture.day.changed` | #1040 | `capture:day_update` |  |
| `capture.edit.discarded` | #1040 | `capture:edit_cancel` |  |
| `capture.letter.discarded` | #1040 | `capture:letter_cancel` |  |
| `capture.review.selected` | #1040 | `capture:review_update` |  |
| `me.language.changed` | #1040 | `me:language_update` | language is allowed only on `languages` events (TRACKING_PLAN 6.2); PM1 to keep it free of the language value |
| `me.session.closed` | #1040 | `me:session_end` |  |
| `system.consent.granted` | #1040 | `system:analytics_consent_accept` (deviation) | duplicates `analytics_opted_in`; PM1 itself says "part of" it, so one event |
| `keeping.account.delete_started` | #1041 | `keeping:account_deletion_start` |  |
| `keeping.account.delete_undone` | #1041 | `keeping:account_deletion_restore` (deviation) |  |
| `keeping.account.deleted` | #1041 | `keeping:account_delete` |  |
| `keeping.consent.declined` | #1041 | (none) | CANNOT EXIST: a decline means nothing is sent (V15). Count it on the phone or not at all |
| `keeping.export.failed` | #1041 | `keeping:export_fail` |  |
| `keeping.export.shared` | #1041 | (none) | NO EVENT (FR-DAT-27: no event on the share destination); PM3 itself denies it |
| `keeping.letter.restored` | #1041 | `keeping:letter_restore` (deviation) |  |
| `keeping.phone.erased` | #1041 | `keeping:phone_delete` | sent only if sent before the erase; the erase clears the queue first |
| `keeping.recording.missing` | #1041 | `keeping:recording_fail` | reason enum |
| `keeping.security.notice_sent` | #1041 | (none) | server-only, not sent to PostHog (the phone cannot observe it; `00-event-standard.md` section 7 `side: server`) |
| `keeping.slip.shown` | #1041 | (none) | NO EVENT (FR-DAT-27: the slip is the birthday-week Save a copy; no event on it) |
| `keeping.summary.sent` | #1041 | (none) | server-only, not sent to PostHog (the phone cannot observe it; `00-event-standard.md` section 7 `side: server`) |
| `keeping.take.let_go` | #1041 | `keeping:take_delete` |  |
| `keeping.version.removed` | #1041 | `keeping:version_remove` |  |
| `keeping.version.restored` | #1041 | `keeping:version_restore` (deviation) |  |
| `system.crash.reported` | #1044 | (none) | REPLACED by PostHog `$exception` reduced as in section 4; no custom crash event |
| `system.fault.recorded` | #1044 | `system:fault_add` | non-fatal fault with a closed code; or drop it and use `$exception` with the same class (ops to choose) |
| `system.sync.failed` | #1044 | `system:sync_fail` |  |

No-event list (FR-DAT-27 and the server rule). None of these has a wire name, and a registry row for any of them fails review:
- The share destination of an export (`keeping.export.shared`).
- The birthday-week Save a copy slip (`keeping.slip.shown`).
- Days notes (month or birthday notes): no event on showing, opening or acting on them.
- No event for a seal's opening time or a typed-day delivery.
- No email opens or clicks, ever (no tracking pixel, no tracked link). Server sends (reminders, onboarding and keeping emails and summaries) are counted on the server as aggregates, never sent to PostHog.

Checks I ran on this table: every new name is 60 characters or fewer, has one colon and ends in a verb of 2.4. Meaning for a few rows is the PM file's, which I did not re-derive; the owner fixes a wrong row in a later edit.

### 2.10 Validators (numbers kept from `00-event-standard.md` section 10; this section says what changes)

| Id | Change for the colon grammar |
|---|---|
| V1 | Name matches the regex in 2.2 (one colon, area category with optional `_v2` to `_v9`, snake object, closed verb last), 60 characters or fewer |
| V2 | Last token is on the verb list of 2.4. Pairing: a name ending `_screen_view` is a screen id; `_click` a control id; `_measure` a perf metric; `_view` without `_screen` an element id or a domain view; a domain event may not use `click` or `measure` |
| V3 | Unchanged: a name is a literal in the registry; the typed helpers are the only way in |
| V4 | Ids exist in the id registry with an IA-FINAL id and an area; an id may not end in a verb token, and only a screen id may end in `_screen` |
| V6 | Adds: a bool property starts `is_` or `has_` and nothing else does; no `_date` or `_timestamp` suffix; at most 12 properties per event |
| V7 | Adds the whole tokens `date` and `timestamp` to the banned list. One exemption, by exact property name: `has_date` (a bool, section 2.7) |
| V9 | Unchanged (2 to 8 steps, window enum, 40 characters) |
| V16, V17 | V17 pins the SDK options of section 3.4 (including `persistence: 'file'`) and the error options of section 4.2 |
| V18 (new) | One module: only `packages/analytics/src/posthog.ts` imports `posthog-react-native` or `@posthog/react-native-plugin`; no file calls `.capture(`, `.captureException(`, `.identify(`, `.screen(`, `.captureLog` or a survey API outside it; no `PostHogProvider` anywhere. A lint rule plus a test (PostHog's handbook: "let nothing else call `posthog.capture`" and block it with a lint rule [V]) |

## 3. How we use PostHog here

### 3.1 One module, typed events

- `packages/analytics/src/posthog.ts` is the only file that imports the SDK (V18). Everything else calls typed helpers generated from the registry (`trackScreen`, `tap`, `impress`, `perf`, and the domain trackers). A helper takes a registered id or typed properties and cannot take a free string.
- Order inside the module for every event: consent gate (V15), registry check (V11), property check (V12, V13), sampling, then the SDK. `before_send` is the last gate (3.5).
- If section 2.8's test shows PostHog mishandles colons, the adapter swaps `:` for `__` on the way out and back in the read-back tests; the registry name does not change.

### 3.2 One project, one environment property

- The free plan has one project [V posthog.com/pricing]. Production, test and our own phones share it, so we separate them by data, not by project.
- Only the `production` build profile ever sends (`analytics.md` section 1a); other profiles do not construct the SDK. Two global properties let us filter what remains (both enums or bools on every event, added to the globals list of `00-event-standard.md` section 6): `build_kind` (`store, testflight, preview, dev`) and `is_internal` (bool, true on the founder's and testers' phones, set by one local switch that is off in a store install).
- In PostHog, project settings, "Filter out internal and test users": `is_internal` is not true. Turn the toggle on in every saved insight [V best-practices describes the setting and the per-insight toggle]. The page's other filters (email, host, IP) do not fit us: we have no email, no host, and IP is dropped.

### 3.3 Identity: anonymous only, and what that costs us

- Distinct id: the random id made at consent (`consent.ts`), lowercase uuid, same format everywhere (PostHog: use one id format on every platform, `user-456` and `USER-456` are two people [V best-practices]). Never an email, account id, Supabase user id, device id or `appAccountToken`.
- We never call `identify` with an account id, an email or anything that could be joined to one. The only id the SDK ever sees is the random install id made at consent (`consent.ts`), which is not an account and not a person. On the first build after a yes the adapter hands that id to the SDK at construction (bootstrapped, so no `$identify` event is sent). If the SDK is already running when consent is renewed, the adapter's `identify(id)` passes the SDK the SAME random install id and nothing else (no properties). That one call is the only `identify` call allowed, and it is open to review: PostHog's mobile default is identified-only, which means events are anonymous unless a profile already exists [V posthog.com/docs/data/anonymous-vs-identified-events; that page names Android, iOS and Flutter, not React Native, so it is UNVERIFIED for React Native], so an `identify` with the install id may create a profile (this is the F-2 fallback below, a founder, `privacy` and counsel decision). Because of that, `personProfiles` is set explicitly in `posthog.ts` per `data-steward.md` section 7 [V from #1037] and never left to the default.
- The id is kept in a device-local file across launches (3.4) and is never joined to an account. On withdrawal: `optOut()` then `reset()`, retire the id, delete the file, clear the queue (`00-event-standard.md` section 11). A later yes makes a new id. We never reuse an old or deleted id (PostHog: avoid reusing a deleted distinct id; deletion is asynchronous and reuse gives unexpected results [V posthog.com/docs/privacy/data-storage]).
- Servers do not send to PostHog at all, so PostHog's warning about catch-all ids like `system` or `backend` [V best-practices] cannot apply. If that ever changes, those events must be sent with person processing off, not with a made-up id.

What anonymous-only costs us, from PostHog's own page [V anonymous-vs-identified-events]:

| We lose | We keep | Matters to us? |
|---|---|---|
| Person properties, cohorts by person property, group analytics, Lifecycle insights, the persons table | Event properties, trends, funnels, SQL insights | No: we want no person properties; Lifecycle is not on our list |
| Retention on anonymous events: the page does not say [UNVERIFIED] | | Yes: test it in the section 2.8 throwaway project before `decision-science` relies on retention |
| One person across two consent periods | Each yes is a new id, so a person who toggles twice counts twice. That is the design (`00` section 11), and it biases unique-person counts up | Read-outs must say so |
| Easy deletion: events with no person profile cannot be removed by person deletion until a profile is created with a `$set` event [V data-storage] | | Yes: this is F-2. The drill IN-DS-06 decides. If it fails, the fallback is the consent id as an identified id (never an account id), which PostHog says can cost up to about 4x per event [V anonymous-vs-identified-events]; the first 1,000,000 events a month are free either way [V same page], so at our volume the cost is zero until the cap. That is a founder, `privacy` and counsel decision, not mine |

### 3.4 SDK options: every default that matters, and our value

Options and defaults are from the React Native library page [V posthog.com/docs/libraries/react-native]. We run `posthog-react-native` 4.78.4 [V `analytics.md`, read earlier from `posthog.ts`]. V17 pins every row with "our value".

| Option | PostHog default | Our value | Why |
|---|---|---|---|
| `defaultOptIn` | `true` | `false` | nothing tracked until `optIn()`; belt and braces, since the SDK is also constructed only after a yes (V15) |
| `disabled` | `false` | `true` in every profile except `production` | no data from dev, e2e, preview |
| `captureAppLifecycleEvents` | `true` (since 4.39.0 [UNVERIFIED: version note not on the page I read]) | `false` | the defaults send events we did not register; our own `system:app_open` replaces them |
| `sendFeatureFlagEvent` | `true` | `false` | flags are off; it would send `$feature_flag_called` |
| `preloadFeatureFlags` | `true` | `false` | no flag requests |
| `disableRemoteFeatureFlags` | `false` (4.49.0+ [UNVERIFIED version note]) | `true` | experiments use our own exposure event (3.10) |
| `disableGeoip` | `false` | `true` (a setting to set in `posthog.ts`; I did not read the code, so UNVERIFIED that it is set today) | no location from IP |
| `enableSessionReplay` | `false` | `false` (never) | replay records screens; never |
| `persistence` | `file` | `file` (RULING, founder, 21 Nov 2026, replacing `memory`) | see the paragraph below this table |
| `flushAt` | 20 | 20 | default is fine |
| `flushInterval` | 10000 ms | `0` | PRD 7.7: the SDK runs no timer of its own (`REQUIRED_POSTHOG_OPTIONS`, `posthog.ts`, at #1086 head `449f667`). The timer is ours: `createAnalytics` (`client.ts`) starts a 60 s timer once consent is granted (`DEFAULT_FLUSH_INTERVAL_MS`; the app does not override it in `apps/mobile/src/lib/analytics/index.ts`), `lifecycle.background()` flushes when the app goes to the background, and the SDK's own `flushAt` (20, not set by us) sends a batch of 20 queued events. So the standard and the adapter agree: the standard stays as written (`TRACKING_PLAN.md` transport paragraph and `analytics.md`: flush on our timer) |
| `maxBatchSize` | 100 | 100 | must be higher than `flushAt` [V] |
| `maxQueueSize` | 1000 | 100 [E: bounded queue; a phone offline for a day sends far fewer than 100 of our events] | bound the queue, bound a retry storm |
| `errorTracking.autocapture` | not stated | section 4.2 | |
| `before_send` | `undefined` | our allowlist function (3.5) | returning `null` drops the event [V] |
| `host` | `https://us.i.posthog.com` | our proxy host (3.7) | EU Cloud is `https://eu.i.posthog.com` [V]; region is counsel's |

Why `file` and not `memory` (RULING, founder, 21 Nov 2026): the one random id made at consent must survive app launches. With `memory`, every launch would be a new anonymous person, and weekly making families (FR-DAT-21) could not be counted at all. The id is reset on withdrawal (`optOut()` then `reset()`, section 3.3) and is never joined to an account. The cost, stated plainly: the SDK keeps the id, and any unsent queue, in a device-local file on the phone. That file is deleted on withdrawal and on Erase (V15 tests both). It holds no content, since `before_send` (3.5) has already reduced every event. How the file is kept when the app is killed or offline is the SDK's; its retry and overflow behaviour is UNVERIFIED (3.6).

Autocapture, logs and surveys:

- Autocapture comes from `PostHogProvider` (`captureScreens`, `captureTouches`) [V from the page as read in the brief; the options table I re-read did not list them, so the provider options are UNVERIFIED this session]. We do not use `PostHogProvider` at all (V18), so there is nothing to switch off by option.
- Logs: the page lists no config option, only the calls `captureLog`, `logger.*`, `flushLogs` (4.44.0+ [UNVERIFIED version note]) [V]. Control is "never call them" (V18). Surveys: no config option either, a separate install guide [V]. Control: never install or render them.
- The Expo config plugin `posthog-react-native/expo` and what needs a development build (session replay, native crash capture): the page I re-read only shows install commands; the plugin and source map settings are on the source maps page (section 4.5) [V], and the "needs a development build" statement from the brief is UNVERIFIED.

### 3.5 `before_send`: the last gate

`before_send(event)` receives every outgoing event and may change it or return `null` to drop it [V]. Ours (`posthogBeforeSend`, which exists for the normal events [V TRACKING_PLAN 3.2]) does, in order: drop if consent is not granted; drop if the name is not in the registry; rebuild `properties` from the registry list for that name plus the ten `$` keys (never delete known-bad keys, copy known-good ones, so a new SDK field is dropped by default); drop on any V13 pattern or string over 40 characters; for `$exception` use the reduction in 4.4. A dropped event is counted on the phone by reason code only, never by value. The canary test (V14) pushes the Asha strings through every helper and through `before_send` and fails on any hit.

### 3.6 Offline, flush and retry

- Events are queued by the SDK (`persistence: 'file'`, 3.4), flushed by our own timer (our client's 60 s timer in the foreground, `flushInterval: 0` so the SDK has no timer; PRD 7.7), by the SDK at 20 queued events (`flushAt`, the SDK default), and on going to the background (`lifecycle.background()`). Checked in code at #1086 head `449f667`: `client.ts` `startTimer` runs from `connect` after a yes and stops on withdrawal. If a later change passes `flushIntervalMs: 0` there, the standard must be edited in the same PR, because then only the background and 20-event flushes remain. Capture time is the SDK's, so late sends still land in the right hour.
- PostHog says not to assume event ordering [V best-practices]. No funnel step may depend on two events that could arrive together within a second unless the funnel is ordered by the SDK timestamp; V9 funnels use steps that are separate user actions.
- How the React Native SDK retries after being offline, and whether it drops the oldest event at `maxQueueSize`, is not written on the pages I read [UNVERIFIED]. QA step in 6.3: airplane mode, send 150 events, restore the network, count.
- A single distinct id sending about 5,000 events a minute hits a rate limit and loses ordering [V best-practices]. Ours sends about 300 a month per parent, so only a bug can reach it. The client caps itself at 60 events a minute [E: my proposal] and drops the rest, counted by reason.

### 3.7 Reverse proxy: default yes

PostHog recommends routing events through your own domain [V best-practices]. Its managed reverse proxy is free for PostHog Cloud users, handles SSL and routing, runs through Cloudflare, and removes the `Cookie` header before forwarding [V posthog.com/docs/advanced/proxy]. Default: use the managed proxy on a domain of ours, so the host in the app is ours and can be changed without an app update. Costs and risks:
- It adds Cloudflare to the path: a subprocessor question for counsel [UNVERIFIED how counsel reads it].
- The page says nothing about client IP forwarding or stripping [V]. IP stays a risk until the project setting that discards client IP data is on: best-practices mentions that setting exists [V], where the toggle is I did not read [UNVERIFIED]. The project setting must be on before IN-08 [UNVERIFIED that it is on today; no project settings were read], and `disableGeoip: true` is the planned SDK value (3.4), a setting to set and not a present fact.
- A DNS record on our domain is a founder step. If the founder declines, the app talks to PostHog directly and the host option is the Cloud host.

### 3.8 Free-plan cap, billing limit and alerts

- Free plan: no card, 1 project, 1-year retention [V pricing]; 1,000,000 product-analytics events a month and 100,000 exceptions a month, billed separately [V pricing: "1,000,000 free Product analytics events and 100,000 free exceptions"].
- PostHog emails the organisation owner at 80 and 100 percent of the free allotment, and of any billing limit; data over a set billing limit is lost for good [V posthog.com/docs/billing/limits-alerts]. The pages do not say what happens to events over the free allowance with no card and no limit set [UNVERIFIED]; plan as if they are dropped.
- Rules: never add a card; set the billing limit if the free plan allows one [UNVERIFIED whether it does without a card]; the founder reads the 80 percent email as a release gate for sampling (TRACKING_PLAN 5.3); `ops` puts the monthly count in the weekly read-out. Our own budget is section 6.5.

### 3.9 Internal and test traffic

Section 3.2 (`is_internal`, one switch). Test builds that never construct the SDK send nothing. The canary and the throwaway project use fake Asha data and a different project token; the production token is in no test. PostHog's web call `setInternalOrTestUser()` is for a browser SDK [V best-practices]; I did not find a React Native equivalent [UNVERIFIED: whether `setInternalOrTestUser()` exists on React Native], which is why we use our own property.

### 3.10 Experiments: our own exposure event, flags off

Feature flags and PostHog Experiments stay off (V17). An arm is drawn on the phone from a registered closed list and kept on the phone. We send `system:experiment_exposure_view` with `experiment` and `arm` (id-ref enums), and analyse with funnels on that event (`00-event-standard.md` section 11). The cost: no PostHog experiment statistics screen and no remote rollout; we read funnels by hand. FR-DAT-42 already says a 15 to 25 family beta supports no effect claim.

## 4. Crash reporting: PostHog Error Tracking, no second vendor

### 4.1 What it is and what it costs

Error Tracking captures `$exception` events. The first 100,000 exceptions a month are free, billed on `$exception` events and separate from the 1,000,000 events [V posthog.com/error-tracking/pricing, posthog.com/pricing]. Our crash tool is therefore the same SDK, the same consent switch and the same module; `analytics.md` section 2's Sentry and GlitchTip rows are closed.

### 4.2 Options (installation page [V posthog.com/docs/error-tracking/installation/react-native])

`errorTracking.autocapture` has four options. The page states no defaults, so we set all four:

| Option | What it does | Our value |
|---|---|---|
| `uncaughtExceptions` | global handler for uncaught JS errors | `true` |
| `unhandledRejections` | unhandled promise rejections | `true` |
| `console` | captures console logs as errors by level | `[]` (empty). Console output can carry anything a developer printed, including a name or a sentence; the page itself says to use `console: []` when an error boundary double-captures. We use it for the privacy reason |
| `nativeCrashes` | iOS and Android native crashes | `false` until the founder approves the dependency in 4.3 |

### 4.3 Native crashes: a founder decision

Native crash capture needs the optional package `@posthog/react-native-plugin` (installed with `npx expo install @posthog/react-native-plugin@2`), the "Enable exception autocapture" project setting, and native debug symbols uploaded at build time; without the package, native capture does nothing and JS capture still works [V]. For the iOS Swift Package Manager path the page asks for plugin 2.4.0 or later, Xcode 16 or later and an iOS 15.1 or later target [V]. A new dependency is the founder's (`package.json`, ADOPTION-RULES, never an agent). Until the founder says yes: `nativeCrashes: false`, and Apple's crash reports are the native baseline (4.7).

### 4.4 What an exception may carry: the `before_send` reduction

PostHog's docs do not describe redacting exception messages [V: the installation page has nothing on `before_send` for `$exception` or on personal data in stack traces]. So we do it, and we rebuild rather than clean:

- Keep: the event name `$exception`; the distinct id; the error class (`type`), only if it is a built-in JavaScript error name or one of our closed fault codes, otherwise the string `other`; the stack frames (function name, bundle-relative file, line, column, `in_app`); `$app_version`, `$app_build`, `$os_name`, `$os_version`, `$device_type`; `build_kind`, `is_internal`.
- Drop: the message text (`value`) of every exception and of every chained cause; any property a caller attached to the capture; breadcrumbs or console lines; any URL, path outside the bundle, or header. Our code never needs the text: the closed code is the class.
- The exact `$exception` property names (I believe an `$exception_list` of entries with a type, a value and a stack trace) are UNVERIFIED: I did not read an `$exception` payload. The allowlist is written from one real payload captured in the throwaway project (6.3). Until then the rule is "copy only the fields above; drop everything else".
- `captureException` with free text is banned: no typed helper accepts a string message. The only way in is the global handlers of 4.2 and a helper `reportFault(code)` that takes a closed fault code (`ops` list, #1044) and builds the error itself.
- Same gate as every event: no consent, no SDK, so a crash in the first run before a yes is not captured by us (the Apple baseline covers it).
- Crash loops: a client cap of 5 exceptions per foreground session and one per error class and top frame [E: my proposal], so a loop cannot burn the 100,000 a month.

### 4.5 Source maps and native symbols: a build step [V posthog.com/docs/error-tracking/upload-source-maps/react-native]

- Tool: `posthog-cli` (minimum 0.7.8): `npm install -g @posthog/cli`, then `posthog-cli login`.
- JavaScript (Hermes) source maps: `npx expo export --dump-sourcemap`, then `posthog-cli hermes upload --directory dist`. For EAS Update, source maps are NOT uploaded automatically; run the upload after `eas update`.
- Environment: `POSTHOG_CLI_HOST` (default `https://us.posthog.com`), `POSTHOG_CLI_PROJECT_ID`, `POSTHOG_CLI_API_KEY`, which is a personal API key with error tracking write and organisation read scopes. That key is a founder-held secret in the build service's secrets, never in the repo, never in a log. Where EAS stores it I did not read [UNVERIFIED].
- Expo: in `metro.config.js`, `getPostHogExpoConfig(__dirname)` from `posthog-react-native/metro`; in `app.json`, the plugin `posthog-react-native/expo` with `uploadNativeSymbols` (true, or `{ "includeSource": true }`). Ours: `uploadNativeSymbols: true`, `includeSource` off (it uploads native source files; we have no need and do not want to widen what leaves the build).
- iOS dSYM: a Run Script phase last in the app target calling `upload-symbols.sh`; Release setting `DEBUG_INFORMATION_FORMAT` to "DWARF with dSYM File". The Expo plugin wires this.
- How a build is matched to its maps (release and version identifiers) is not described on the page [V: "not described"]; QA test in 6.3 with a deliberate crash on a test build.
- This is an `ops` and founder step. I name the commands; I do not add them to `eas.json`.

### 4.6 First fix: the three date-bearing throws

`age.ts:15`, `child.ts:28` and `child.ts:33` put a date into an error message (carried from OBSERVABILITY-WITHOUT-CONTENT section 3, per `analytics.md` risk 5; I did not read the code, so this is UNVERIFIED by me). A child's date is L4. The reduction in 4.4 drops messages anyway, but the fix does not depend on it: make each message a static string, with the closed code as the class. This is backlog row IN-09 and a dependency of the production flip (IN-08), as `privacy` asked in review B.

### 4.7 Apple Xcode Organizer: the no-SDK baseline

Apple's crash reports, from people who share diagnostics with developers, arrive in Xcode Organizer and App Store Connect with no SDK and no change to the label (`data-steward.md` section 3.3: crashes, opt-in, no join to our data [V from #1037]). They stay on regardless of what PostHog does. They are the only crash source for a first run before consent and for people who say no to us. Crash-free sessions in 1.0 stay Apple's number (`analytics.md` section 8).

### 4.8 Label and consent

Crash and performance data move the App Store privacy label from usage data alone to usage data plus diagnostics (`analytics.md` section 1a). The consent sheet must name crashes in its Shown line (`data-steward.md` section 6; PRIV-R21 lines Shown, Records, Never, Decline). One switch covers usage and crash (FD-3 default). Wording, label and counsel are the founder's.

## 5. How NOT to use it

Sources are PostHog's own pages unless marked. The two outside references are search results whose pages I did not open, so they carry their headlines only [UNVERIFIED beyond the title]: Princeton CITP, "No boundaries: Exfiltration of personal data by session-replay scripts" (blog.citp.princeton.edu, 15 Nov 2017) and AppleInsider, "Popular iOS apps use Glassbox SDK to record user screens without permission" (6 Feb 2019).

| # | Common mistake | Source | Our rule |
|---|---|---|---|
| 1 | Rely on autocapture alone and hope the right things get recorded | best-practices: track growth events explicitly, not only autocapture [V] | Autocapture off; every event is a registry row (V1 to V12) |
| 2 | Build event or property names from variables (`opened_letter_<id>`) | best-practices: static names; many unique property names get rate limited [V] | V3, V6; ids go in a closed enum or nowhere |
| 3 | Name events freely ("Clicked Button 2") with no convention | best-practices, handbook [V] | Section 2 grammar, V1 and V2 |
| 4 | Rename an event that has history | handbook: never rename; version and join with an action [V] | Section 2.6; the one-time rename is allowed only because nothing was ever sent |
| 5 | Catch-all distinct ids for server events (`system`, `backend`) | best-practices [V] | Servers send nothing; counts live in Supabase |
| 6 | Different id formats across platforms (`user-456` vs `USER-456`) | best-practices [V] | One id format: the consent uuid, lowercase |
| 7 | `identify` with an email or account id, so every event is a known person | anonymous-vs-identified-events (identify links earlier anonymous events to a user) [V] | Never identify with an account id or email; the only id is the random install id from consent; `reset()` on withdrawal |
| 8 | Reuse a deleted or old distinct id | data-storage [V] | A later yes gets a new id (`consent.ts`) |
| 9 | Leave SDK defaults on: lifecycle events, flag events, preloaded flags, geoip | react-native page defaults [V] | Section 3.4, pinned by V17 |
| 10 | Session replay or surveys "just to try" | enableSessionReplay is a switch [V]; replay of screens is the harm in the CITP and Glassbox stories [UNVERIFIED beyond the titles] | Never on; V17 |
| 11 | Capture console output as errors | installation page offers `console` levels [V] | `console: []` (4.2) |
| 12 | Send exception messages and stack contents as they come | installation page describes no redaction [V] | Rebuild `$exception` from an allowlist, drop message text (4.4) |
| 13 | `captureException(new Error(\`failed for ${name}\`))` | same | No helper takes a string; `reportFault(code)` only |
| 14 | Message text with a child's date in it | our own finding (age.ts:15, child.ts:28 and 33) [from `analytics.md` risk 5] | Fix first (IN-09) |
| 15 | A crash loop eats the whole exception quota | 100,000 free exceptions a month [V pricing] | Client cap per session and per class (4.4) |
| 16 | Ship source maps nowhere, so stack traces are unreadable; or forget that EAS Update does not upload them | upload-source-maps page [V] | Build step in 4.5; run the upload after every `eas update` |
| 17 | Treat a 202 on deletion as "deleted" | data-storage: 202 means accepted; check `deletion_errors` [V] | Wording "within about a month"; IN-DS-03 and IN-DS-06 |
| 18 | Assume anonymous events can be deleted by person | data-storage [V] | F-2; the drill decides |
| 19 | Use event counts as exact business numbers | best-practices: backend and database numbers are more reliable [V] | Account, plan and family counts come from Supabase views (k = 10) and App Store Connect, never from PostHog |
| 20 | Assume events arrive in order | best-practices [V] | 3.6 |
| 21 | Let test and internal traffic into dashboards | best-practices: filter internal and test users [V] | `is_internal` and the project filter (3.2) |
| 22 | Blow the free cap with no alert, so data is silently lost | pricing and billing pages: over-limit data lost, alerts at 80 and 100 percent [V billing page] | Budget (6.5), the 80 percent email, sampling |
| 23 | Call the SDK from everywhere | handbook: one module and a lint rule [V] | V18 |
| 24 | No tracking line on a pull request, so events drift from the plan | handbook: a Tracking section and a CI check [V] | 6.2 |
| 25 | Ads-blocker or network blocks silently lose events | best-practices: use a reverse proxy [V] | 3.7 |
| 26 | Treat the schema-management feature as settled | schema-management page: experimental, typed property groups, enforced in code [V per the brief; page not re-read, UNVERIFIED] | Not used; our registry and V6 are the schema |
| 27 | Mix the fix for crash and analytics consent | `data-steward.md` FD-3 | One switch, one gate, one module |

## 6. Operating the standard

### 6.1 The registry row (template)

One row per event in `packages/analytics/src/catalog.ts`, rendered to `docs/analytics/instrumentation/registry.md` by `npm run plan`. All fields required unless marked.

| Field | Rule |
|---|---|
| name | wire name, section 2 |
| area | one of nine; equals the category without `_vN` |
| decision | one sentence: the decision this event informs and who reads it ("whether people keep the first letter", read by the founder weekly). No decision, no event |
| owner | role from `agents/roster.json` |
| trigger | one line: when it fires; never describes content; never fires at a birthday, due date or seal time (FR-DAT-27, TRACKING_PLAN 6.4); never an email open or click |
| properties | per property: name, type (enum, bool or bounded int), closed values or range, required or optional; at most 12 per event (the shape is `PropSpec` in `schema.ts` [UNVERIFIED: not read]; global properties and the ten `$` keys do not count) |
| class | L1 or L2; sensitivity flag `none` |
| side | `phone` (a wire event) or `server`, `store`, `support` (never sent to PostHog; a non-phone row has no wire name, it uses its dotted name from `00-event-standard.md` and V1 does not apply) |
| consent_gate | `analytics_consent` for `phone`; `none_server_aggregate` for `server`; `n/a` otherwise |
| source | requirement ids (FR, NS, PRD) and the PM file section |
| v | integer, starts at 1 |
| supersedes | old name when this is a version (`capture_v2:letter_save` supersedes `capture:letter_save`), else `none` |
| funnels | funnel ids using it, or `none` |
| sampling | `always`, `first_to_sample` or a percent (TRACKING_PLAN 5.3) |
| status | `proposed`, `approved`, `built`, `deprecated` (with date) |

### 6.2 The PR tracking line and the CI check

Every pull request description has exactly one of these lines (PostHog's handbook: three lines, keep one, CI fails if the description has none or more than one [V]):

```
Tracking: none
Tracking: events added or changed: <wire names>; registry rows are in this PR
Tracking: not needed, because <one reason>
```

CI check (a small script, not yet written, in its own job named `tracking-line`, not inside the `unit` job, so a missing line shows as its own red check):
- Reads the PR body from the event payload of a `pull_request` workflow with `edited` in its `types` (so editing the body re-runs it), or with `gh pr view --json body` [UNVERIFIED which; the workflow is not written]. Fails if the body has zero or more than one line starting `Tracking:`.
- With `Tracking: none` or `not needed`, fails if the diff touches `catalog.ts`, `ids.ts`, `registry.md` or any file that imports the analytics package's send path. Search only for imports of the send path (the `track`, `trackScreen`, `tap`, `impress`, `perf` and domain tracker helpers from `packages/analytics`), and skip files that import only types, ids or the consent helpers; a plain grep for `from '.*analytics'` is too wide and would fail unrelated PRs.
- With `events added or changed`, fails if a named event is not in the registry diff, or the registry diff has an event not named.
The PR template and the script are a backlog row (IN-10, `analytics engineer`). Workflow edits are the founder's under the standing rule, so the workflow part is a hand-off to the founder; the script itself is `analytics engineer`'s. The founder hand-off includes the edit that adds `edited` to the `pull_request` `types:` list of the new job (the default types do not re-run when a PR body is edited).

### 6.3 Per-event QA checklist (one tick each, in the PR)

1. The decision it informs is written, with the insight that answers it.
2. Name passes V1 to V3; verb on the list or a Proposed change box exists.
3. Properties are closed (V6), no banned token (V7), at most 12.
4. Checked against the never lists: FR-DAT-27, FR-DAT-36, FR-DAT-38, TRACKING_PLAN 6.4 timing, and `00` section 6.
5. Consent: with no consent nothing is queued, written or sent (V15 test names this event).
6. Canary: the Asha strings through this helper and `before_send` leave nothing (V14).
7. On a dev build pointed at the throwaway project: the event arrives under the wire name, with exactly the registry properties and the ten `$` keys, nothing else.
8. The insight or funnel it was built for exists and renders (colon names included, 2.8).
9. Volume per parent per month added to the budget (6.5).
10. Sampling class set; offline behaviour noted if it matters.
11. A version change names `supersedes` and the joining Action.
12. The PR tracking line is present; the launch dashboard has one tile for it, and old tiles are retired (the handbook's "one dashboard for launches, rotate it" [V]).

One-time QA before IN-08 (each is an open UNVERIFIED above): colon names in trends, funnel, retention and HogQL (2.8); retention on anonymous events (3.3); offline queue and retry (3.6); the real `$exception` payload and the allowlist built from it (4.4); a deliberate crash on a test build, symbolicated, and matched to its maps (4.5); withdrawal then yes gives a new id and no events between; the deletion drill IN-DS-06.

### 6.4 One launch dashboard

One PostHog dashboard per launch, rotated: tiles for the five funnels (`analytics.md` section 8), the crash count, the budget gauge. Everything else is a saved insight with an owner. Dashboards read Actions, not raw names, wherever a version exists.

### 6.5 Event budget against the 1,000,000 cap [E: all inputs are estimates]

| Input | Value | Basis |
|---|---|---|
| Catalogue events per consenting parent per month | 190 | TRACKING_PLAN 5.1 [V, via `analytics.md` section 8] |
| Taps | 60 | `analytics.md` section 8, no baseline [E] |
| Impressions | 50 | same [E] |
| Total, low case | 190 + 60 + 50 = 300 | |
| Total, high case | 400 | #1052 assumption (data-architect), read by line, [E] |
| Consent rate | 80 percent | `analytics.md` section 8 (1,000 families, about 800 consenting) [E] |
| Cap | 1,000,000 a month | pricing [V] |

Arithmetic:
- Assumption: one consenting parent per family. With two consenting parents the per-family figure roughly doubles and the families at the cap roughly halve.
- Consenting parents at the cap: 1,000,000 / 300 = 3,333 (low); 1,000,000 / 400 = 2,500 (high).
- Families at the cap: 3,333 / 0.8 = 4,167 (low); 2,500 / 0.8 = 3,125 (high).
- Today's beta, 25 families, all consenting: 25 x 300 = 7,500 a month, 0.75 percent of the cap.
- 1,000 families: 800 x 300 = 240,000 (24 percent); 800 x 400 = 320,000 (32 percent).
- Defaults left on would add lifecycle events: say 2 per foreground session over about 30 sessions = 60 per parent, which is 60 / 300 = 20 percent more, before any flag events [E: both numbers are my guesses]. That is why section 3.4 switches them off.
- If screen views and impressions are sampled at 50 percent (110 of the 300 are basics): 190 + 55 = 245 per parent, so 1,000,000 / 245 = 4,082 parents.
- Exceptions are separate, 100,000 a month free [V]. Worst case with the 4.4 cap of 5 a session and 30 sessions: 800 x 5 x 30 = 120,000, over the cap; the real number is far lower because a crash is rare [E], and the per-class cap makes the worst case unreachable in practice. The 80 percent email on either meter is the alarm.
- Our review line: at 600,000 events (60 percent) `decision-science` and `ops` decide on sampling before PostHog's 80 percent email [E: my proposal].

## 7. Alignment checklist for every file and requirement

Owners fix their own files in their next edit; none of this PR edits a PM file. "Wire names" below means replace the dotted names by the table in 2.9. Where I read only part of a file I say so.

| File | State | What to change |
|---|---|---|
| `00-event-standard.md` (#1042, merged) | edited in this PR | Banner on the grammar (done); section 6 globals gain `build_kind`, `is_internal`; V17 and V18 rows; examples stay dotted until IN-02 |
| `analytics.md` (#1042, merged) | edited in this PR | Host wording, release gate owner, deletion paragraph, IN-08 dependencies, IN-09 (done); section 2a and the Sentry and GlitchTip rows are history, not live choices |
| `data-steward.md` (merged) | edited in this PR | Data-map row with the five `$` fields; FD-1 decided. Its section 3.2 shapes (`screen_view{screen}`, `control_tap`, `surface_shown`, `perf{marker,bucket}`) are superseded by 2.9; the owner removes them |
| `decision-science.md` (merged) | not edited | Read by grep only [UNVERIFIED beyond the lines I cite]. Funnels and metrics use the old catalogue names; re-key to wire names. Its PostHog-flag arm option is replaced by our exposure event (3.10). Retention on anonymous events needs the 3.3 test |
| `02-book-reading-find-photos.md` (merged) | not edited | Wire names. Search events: never the query or its length (FR-DAT-27). `book.share.*` carries no destination (FR-DAT-27) |
| `04-family-reminders-days-lifecycle.md` (merged) | not edited | `family.invite.peeked` and `family.second_voice.reached` are server counters (it says so, and #1052 agrees): not wire events. `notifications.reminder.delivered` conflicts with 05 line 128 ("no delivered event"): `product` decides, evening class only if kept |
| `05-plus-growth-foundations.md` (merged) | not edited | Perf properties `budget_band` and `device_tier` versus the standard's only `ms_bucket` and `is_ok`: reconcile (the README of the PM files lists them too). `system.diagnostic.received` meaning unclear (2.9). `system.app.opened`, `system.session.ended` stand in for PostHog's lifecycle events, which are off |
| `01-capture-and-first-run.md` (#1040, open; head c2729656) | not edited | `system.consent.granted` duplicates `analytics_opted_in`: one event. `me.language.changed` must not carry the language (TRACKING_PLAN 6.2). `speak_tap_to_mic` becomes `speak_to_mic` (`00` section 4) |
| `03-keeping-and-trust.md` (#1041, open; head 03defdc6) | not edited | `keeping.consent.declined` cannot exist (nothing is sent after a no; V15). `keeping.export.shared` and `keeping.slip.shown` are denied by its own list; keep them denied. Its denied-names list must be rewritten in wire names so V1 to V3 reject them |
| `ops.md` (#1044, open; head 8a4f0d96) | not edited | `system.crash.reported` is replaced by PostHog `$exception` (4.4); the crash-tool evaluation (Sentry, GlitchTip) is closed by the founder's decision; the `error_class` closed list becomes the allowed `type` values; `app_version` and `os_major` are already `$app_version` and `$os_version`; `perf.cold_start` and `perf.warm_start` become `launch_cold` and `launch_warm`. The release gate OG-1 rewrite is the founder's (`analytics.md` section 1a) |
| `data-architect.md` (#1052, open; head 0a414cbb) | not edited | I read only the lines I cite (volume assumption, server counters, `withdrawal` forget reason). Server counters stay in Supabase and out of PostHog. Its 400 events a month feeds 6.5 |
| FR-DAT-01 | needs erratum | Production flip, E-INSTR-1 (founder). Not edited |
| FR-DAT-27, 36, 38 | stand | Checks in V7 and the QA list; names that would break them are denied by the registry |
| FR-DAT-28 | stands | Server aggregates not read in 1.0 unless the founder rules |
| PRIV-R21, FR-DAT-04 | stand | Consent sheet and its Shown, Records, Never, Decline lines: wording is the founder's and counsel's, adds crashes |
| LEGAL-REQ-014, LEGAL-REQ-027 | stand | No content in any event, log or crash report; data-map row (done for the `$` fields; the rest is IN-DS-01) |

## 7a. Adapter alignment

The adapter branch is `feat/analytics-posthog-adapter`, now PR #1086 (head `449f6673dd5e65f89459790149226a5ac89b8979`, 14 commits, 40 files, read in code on 21 Nov; the earlier heads `1014088e` and `94ccd85` are superseded; `3d0caf0` (production flag) is reverted by `92d9170` and returns as its own last PR, see `adapter-split-plan-20nov.md` in #1091). The adapter is built to `registry.ts`. It must still be updated to this standard before it merges. Each line below was re-checked against `449f667` by reading `registry.ts`, `registry-rules.ts`, `posthog.ts`, `client.ts` and the mobile `lib/analytics/index.ts`. Where it diverged:
- Grammar: it still builds the old past-tense, no-colon, 40-character names (`NAME_RULES` in `registry-rules.ts`) and defers the rename to a separate PR. Until IN-03 lands, V1 (colon grammar, 60 characters) is not enforced there.
- Validators: it builds V1 to V10 and V16 only (static rules in `registry-rules.ts`; V11 to V15 are runtime). V17 exists only as a constant (`REQUIRED_POSTHOG_OPTIONS`) and V18 is not built. Its V8 has no exemption for `server`, `store` and `support` rows. It carries `grandfathered` and `heldNames`, which this standard does not know: IN-03 removes them or this file adds them.
- Persistence: it sets `persistence: 'file'`, which matches the 21 Nov ruling in 3.4. Any test or doc that says `memory` is wrong.
- Flush: matches 3.4 and 3.6 (SDK `flushInterval: 0`, our 60 s timer in `client.ts`, background flush, SDK `flushAt` 20). Nothing to change there.
- Crash: `crash.ts` is built and off (`CRASH_REPORTING.enabled`), with `errorTrackingOptions` and `reduceExceptionEvent`; I did not compare its option keys and reduction line by line with section 4 in this edit.
- SDK version: it pins `posthog-react-native` 4.87.1 and `@posthog/core` 1.69.2; sections 3.4 and 4.2 cite the page read on 20 Nov and were not re-verified against that package version.
- Row fields: its `RegistryRow` has `stage, decision, when, area, reqs, level` plus `status`. Section 6.1 needs more:

| 6.1 field | Adapter field |
|---|---|
| name, area, decision, status | same |
| trigger | `when` (rename) |
| source | `reqs` (rename) |
| class | `level` (rename) |
| owner, side, consent_gate, v, supersedes, funnels, sampling, properties | new |
| (none) | `stage` is not in 6.1: keep or drop at IN-03 |

- Project settings: its `REQUIRED_PROJECT_SETTINGS` says "Region chosen (US recommended)" and "Data retention 12 months or less"; this standard leaves region to counsel and says free retention is 1 year (3.8). Reconcile in one place.

## 8. Unverified items (read before relying on this file)

1. Colon event names in funnels, retention, trends and HogQL: PostHog's handbook uses them; no page confirms the UI (2.8).
2. Retention insight on anonymous events: the page does not say (3.3).
3. How to build the "all versions" Action in the UI (2.6).
4. React Native SDK offline retry and queue overflow behaviour (3.6).
5. Whether the free plan lets us set a billing limit without a card, and what happens to events over 1,000,000 with none set (3.8).
6. Where the "discard client IP data" project setting is and its exact name (3.7); whether the managed proxy forwards the IP (3.7).
7. `PostHogProvider` autocapture option names (3.4): not in the options table I read; I do not use the provider.
8. Expo statement "session replay and native crash capture need a development build": not on the page I read (3.4).
9. The exact `$exception` property names, and anything else PostHog adds to an exception (4.4).
10. How a build is matched to its source maps and symbols; where EAS keeps the personal API key (4.5).
11. Whether `$session_id` is stable enough to keep, and whether `privacy` accepts it (`00` section 6).
12. The date-bearing throws at `age.ts:15`, `child.ts:28`, `child.ts:33`: carried from another file, not read in code.
13. Contents of the #1040, #1041, #1044, #1052 files beyond the names, lines and statements cited; `decision-science.md` beyond grep.
14. Who may edit `.github` (PR template, CI) and what PostHog's `schema-management` page now says (5 row 26).
15. The two outside incident references in section 5 (titles only).
16. What the client IP, Cloudflare and proxy mean for the App Store label and counsel's view of the subprocessor list.
17. Whether `setInternalOrTestUser()` exists on React Native (3.9).
18. What `system.diagnostic.received` means (2.9).
19. How the SDK keeps and clears its `file` persistence when the app is killed or offline (3.4, 3.6); `disableGeoip` and the project IP setting are not confirmed as set (3.4, 3.7).
20. Version notes in 3.4 (4.39.0, 4.49.0, 4.44.0) are not on the page I read.

## 9. Open decisions

Founder:
- Approve `@posthog/react-native-plugin` for native crash capture (4.3). Default: no, Apple baseline only.
- Use PostHog's managed reverse proxy and put a DNS record on our domain (3.7). Default: yes.
- Add a hidden internal-tester switch for `is_internal` (3.2). Default: yes.
- Hold a personal API key for symbol and source map upload in the build service (4.5).
- US or EU region (3.4). Default: counsel advises.
- If the deletion drill fails: accept an identified consent id (up to about 4x event cost above the free million) or accept that anonymous events cannot be deleted by person (3.3).
- Consent sheet wording naming crashes, App Store label (usage plus diagnostics), erratum E-INSTR-1, release gate rewrite, the PostHog subprocessor and data-map rows: all founder or counsel, as in `analytics.md` section 1a.

Counsel:
- Whether a phone-held random id with 20 retired ids is "linked" for the label.
- Cloudflare in the proxy path and PostHog as processor.
- The wording "within about a month" for deletion, against the 14 days in the deletion spec (F-4).

CPO and others:
- New verbs (2.5) and any new area (E-INSTR-3).
- `product` to settle `notifications.reminder.delivered` between 04 and 05.
- `ops` to drop `system.crash.reported` and the Sentry and GlitchTip evaluation.

Signed: `analytics`, 20 Nov 2026.

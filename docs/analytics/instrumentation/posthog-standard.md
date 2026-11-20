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

Folded into PostHog verbs (no deviation): shown, impressed, peeked, exposed, selected become `view` or `update`; tapped becomes `click`; delivered, shared, notice sent become `send`; suppressed, discarded become `cancel`; revoked, withdrawn become `remove`; failed, violated, raised become `fail`; redeemed, answered become `submit`; held and sealed become `create` on a `letter_hold` or `letter_seal` object; used becomes `start`; synced becomes `complete`; closed and finished become `end`. `tap` is not a verb: `click` is the PostHog word and means a tap on a phone, including a VoiceOver activate.

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
| `_date` and `_timestamp` suffixes are RESERVED AND BANNED here: no property is a date or time (the platform adds capture time; a birthday-set or person-set time never). `date` and `timestamp` are banned tokens in V7 | PostHog's suffix rule [V]; our rule from `00-event-standard.md` section 6 |
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

The PM files and `00-event-standard.md` write dotted working names (`capture.letter.saved`). The registry holds ONE name, the wire name. PM files and the standard's examples keep the dotted names until their next edit; this table is the bridge. A `(none)` row is not a wire event: a server count, a crash, or something that cannot exist. Sources: `00` and `analytics.md` are #1042 (merged); `02`, `04`, `05` are the merged PM files on develop; #1040 (PM1), #1041 (PM3), #1044 (ops), #1052 (data-architect) are open PRs read at their head shas on 20 Nov by raw file. "(deviation)" marks a verb from the 2.4 table.

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
| `notifications.reminder.delivered` | #1042, 04, #1040 | `notifications:reminder_send` | evening class only; PM5 line 128 says no delivered event: PM4 and PM5 disagree, `product` to settle |
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
| `family.invite.shared` | 04 | `family:invite_send` |  |
| `family.invite.peeked` | 04, #1052 | (none) | SERVER counter in PM4 and #1052: not on the wire |
| `family.second_voice.reached` | 04, #1052 | (none) | SERVER weekly count (k = 10): not on the wire |
| `family.second_voice.kept` | #1052 | (none) | SERVER view: not on the wire |
| `family.invite.opened` | #1052 | `family:invite_open` (deviation) | if it is the phone-side `invite_opened`; as a server counter it is not on the wire |
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
| `plus.letter.held` | 05 | `plus:letter_create` |  |
| `plus.offer.closed` | 05 | `plus:offer_end` |  |
| `plus.plan.changed` | 05 | `plus:plan_update` |  |
| `plus.plan.started` | 05 | `plus:plan_start` |  |
| `plus.restore.completed` | 05 | `plus:restore_complete` (deviation) |  |
| `system.app.opened` | 05 | `system:app_open` (deviation) |  |
| `system.error.raised` | 05 | `system:error_fail` |  |
| `system.session.ended` | 05 | `system:session_end` |  |
| `system.diagnostic.received` | 05 | `system:diagnostic_add` | meaning not clear to me and `receive` is not allowed; PM5 to say what it is or drop it [UNVERIFIED] |
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
| `onboarding.email.sent` | #1040 | `onboarding:email_send` |  |
| `onboarding.first_letter.completed` | #1040 | `onboarding:first_letter_complete` (deviation) |  |
| `onboarding.region.refused` | #1040 | `onboarding:region_decline` (deviation) |  |
| `onboarding.sensitive.accepted` | #1040 | `onboarding:sensitive_accept` (deviation) |  |
| `onboarding.sign_in.completed` | #1040 | `onboarding:sign_in_complete` (deviation) |  |
| `onboarding.sign_in.dismissed` | #1040 | `onboarding:sign_in_dismiss` (deviation) |  |
| `onboarding.sign_in.failed` | #1040 | `onboarding:sign_in_fail` |  |
| `onboarding.summary.sent` | #1040 | `onboarding:summary_send` |  |
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
| `keeping.export.shared` | #1041 | `keeping:export_send` | PM3 itself denies it (share destination, FR-DAT-27); no wire name |
| `keeping.letter.restored` | #1041 | `keeping:letter_restore` (deviation) |  |
| `keeping.phone.erased` | #1041 | `keeping:phone_delete` | sent only if sent before the erase; the erase clears the queue first |
| `keeping.recording.missing` | #1041 | `keeping:recording_fail` | reason enum |
| `keeping.security.notice_sent` | #1041 | `keeping:security_notice_send` |  |
| `keeping.slip.shown` | #1041 | `keeping:slip_view` | PM3 itself denies it (birthday-week slip, FR-DAT-27); no wire name |
| `keeping.summary.sent` | #1041 | `keeping:summary_send` |  |
| `keeping.take.let_go` | #1041 | `keeping:take_delete` |  |
| `keeping.version.removed` | #1041 | `keeping:version_remove` |  |
| `keeping.version.restored` | #1041 | `keeping:version_restore` (deviation) |  |
| `system.crash.reported` | #1044 | (none) | REPLACED by PostHog `$exception` reduced as in section 4; no custom crash event |
| `system.fault.recorded` | #1044 | `system:fault_add` | non-fatal fault with a closed code; or drop it and use `$exception` with the same class (ops to choose) |
| `system.sync.failed` | #1044 | `system:sync_fail` |  |

Checks I ran on this table: every new name is 60 characters or fewer, has one colon and ends in a verb of 2.4. Meaning for a few rows is the PM file's, which I did not re-derive; the owner fixes a wrong row in a later edit.

### 2.10 Validators (numbers kept from `00-event-standard.md` section 10; this section says what changes)

| Id | Change for the colon grammar |
|---|---|
| V1 | Name matches the regex in 2.2 (one colon, area category with optional `_v2` to `_v9`, snake object, closed verb last), 60 characters or fewer |
| V2 | Last token is on the verb list of 2.4. Pairing: a name ending `_screen_view` is a screen id; `_click` a control id; `_measure` a perf metric; `_view` without `_screen` an element id or a domain view; a domain event may not use `click` or `measure` |
| V3 | Unchanged: a name is a literal in the registry; the typed helpers are the only way in |
| V4 | Ids exist in the id registry with an IA-FINAL id and an area; an id may not end in a verb token, and only a screen id may end in `_screen` |
| V6 | Adds: a bool property starts `is_` or `has_` and nothing else does; no `_date` or `_timestamp` suffix; at most 12 properties per event |
| V7 | Adds the whole tokens `date` and `timestamp` to the banned list |
| V9 | Unchanged (2 to 8 steps, window enum, 40 characters) |
| V16, V17 | V17 pins the SDK options of section 3.4 and the error options of section 4.2 |
| V18 (new) | One module: only `packages/analytics/src/posthog.ts` imports `posthog-react-native` or `@posthog/react-native-plugin`; no file calls `.capture(`, `.captureException(`, `.identify(`, `.screen(`, `.captureLog` or a survey API outside it; no `PostHogProvider` anywhere. A lint rule plus a test (PostHog's handbook: "let nothing else call `posthog.capture`" and block it with a lint rule [V]) |


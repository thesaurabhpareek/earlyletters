# Wire names: the mapping table (generated)

Generated from `packages/analytics/src/wire-names.ts` by `npm run wire-names -w @scribe/analytics`; do not edit by hand. `npm run wire-names -w @scribe/analytics -- --check` and `packages/analytics/test/wire-names.test.ts` fail when this file differs from that output. BL-1255 step 1 (CR-212): this is the table `posthog-standard.md` section 2.9 points to as "IN-03".

Nothing here renames anything. The catalogue and registry still hold the old names; the rename PRs (step 2) read this table. The tier column is today's tier from the catalogue and registry rows, and the basics set stays pinned to `screen_view` by `test/tiers.test.ts`.

Counts: 73 keys: 30 ruled by 2.9, 17 named by the 24 Nov rulings, 4 merged, 18 dropped, 4 patterns generated per registered id, 0 NEEDS RULING. After step 2a the table has 51 keys, 47 with a name of their own.

Reading a row. "Ruled" means 2.9 names this event (a domain row, the seven examples of line 118, or the Basics patterns) and the catalogue meaning matches it. "Named" means 2.9 did not decide and the exec rulings of 24 Nov 2026 (BL-1255 step 1b) assigned the name. "Merged" means the key is folded into another and has no name of its own; its target is shown. "Dropped" means no event: step 2a deletes the key and its call sites. NEEDS RULING (none today) would mean a new key with no decision.

## Keys

| Key | Lives in | Area today | Tier | Status | Wire name | Basis or what is missing |
|---|---|---|---|---|---|---|
| `app_cold_start` | catalogue | app | consented | merged | (none) merged into `system:cold_start_measure` | `cold_start` is already a PERF_METRIC; PM1 lists it under the perf pattern; its metric id (area `system`) is registered in the step 2 PR that needs it |
| `app_backgrounded` | catalogue | app | consented | dropped | (none) | no PM row and no reader; it is not PM5 `system.session.ended` (which carries clean, fatal or killed), so `system:session_end` stays reserved for that |
| `auth_sheet_shown` | catalogue | entry | consented | merged | (none) merged into `onboarding:sign_in_screen_view` | the sheet is registered screen id `sign_in`; its `trigger` property has no reader |
| `auth_method_selected` | catalogue | entry | consented | dropped | (none) | inferred from auth state; `auth_succeeded` and `auth_failed` already carry `method`; no PM row, no reader |
| `auth_failed` | catalogue | entry | consented | ruled | `onboarding:sign_in_fail` | 2.9 domain table: `onboarding.sign_in.failed` |
| `auth_email_sent` | catalogue | entry | consented | dropped | (none) | 2.9 no-event list: sends are counted on the server; the phone sees a request accepted, not a send |
| `auth_deferred` | catalogue | entry | consented | named | `onboarding:sign_in_dismiss` | PM1 `onboarding.sign_in.dismissed` names this key; `dismiss` is the verb for closing a slip without acting |
| `signed_out` | catalogue | entry | consented | named | `me:session_end` | PM1 `me.session.closed` names this key; `reason` already carries the four causes |
| `invite_opened` | catalogue | entry | consented | ruled | `family:invite_open` | 2.9 domain table: `family.invite.opened` (phone side) |
| `local_merge_choice` | catalogue | entry | consented | dropped | (none) | no emitter (F18), no PM row, no reader; needs server features |
| `child_switched` | catalogue | children | consented | named | `capture:child_update` | PM1 `capture.child.selected` ("active book changed") lists this key as its Was; `selected` folds to `update` |
| `child_setting_changed` | catalogue | children | consented | dropped | (none) | no PM row, no reader, overlaps `settings_changed`; its `key` values name child-level acts: collect less |
| `make_it_yours_card` | catalogue | children | consented | dropped | (none) | no emitter; FR-DAT-26 lists it as stale, to be removed before any profile turns analytics on |
| `goals_set` | catalogue | children | consented | dropped | (none) | no emitter, no reader; goals are L4 and only a count was ever defined |
| `dictionary_term_added` | catalogue | children | consented | dropped | (none) | no emitter, no reader |
| `review_action` | catalogue | capture | consented | named | `capture:review_update` | PM1 `capture.review.selected`, a step of funnel F2; `selected` folds to `update`; `submit` is for forms |
| `machine_edit_reverted` | catalogue | capture | consented | named | `capture:edit_restore` | the 2.4 `restore` row names "a reverted machine edit"; PM1 `edit_cancel` loses; constitution guardrail and insights reader |
| `machine_edit_rejected` | catalogue | capture | consented | named | `capture:edit_decline` | PM1 `capture.edit.declined`; `decline` is "from us" (the verifier); same guardrail and reader |
| `letter_deleted` | catalogue | capture | consented | dropped | (none) | retired under CR-225: no decision reads it, PM3 section 8 and R-K1 to R-K3 keep it at T0 (a per-id trace of what a family deleted, fired inside the deletion flows), and it was held, so it has no history; `keeping:letter_delete` and `keeping:letter_restore` are never assigned and are barred by pattern |
| `language_set` | catalogue | languages | consented | ruled | `me:language_update` | 2.9 domain table: `me.language.changed` |
| `pack_download` | catalogue | languages | consented | named | `system:pack_download_update` | PM1 maps four states to this one key and 2.9 only holds `pack_start`; `changed` folds to `update`; the `pack_download` object keeps it from reading as a pack version update |
| `playback_started` | catalogue | book | consented | ruled | `book:playback_start` | 2.9 domain table: `book.playback.started` |
| `read_together_started` | catalogue | book | consented | ruled | `book:read_together_start` | 2.9 domain table: `book.read_together.started` |
| `read_together_ended` | catalogue | book | consented | ruled | `book:read_together_end` | 2.9 domain table: `book.read_together.ended` |
| `invite_failed` | catalogue | family | consented | ruled | `family:invite_fail` | 2.9 domain table: `family.invite.failed` |
| `family_letter_reviewed` | catalogue | family | consented | dropped | (none) | PM4: "1.1, no rows now"; no emitter; the co-parent work (BL-883 to BL-889) has not shipped |
| `member_removed` | catalogue | family | consented | dropped | (none) | PM4 CPO-3: no phone events, server counts only; no emitter |
| `member_left` | catalogue | family | consented | dropped | (none) | same as `member_removed`; its one emitter is a leave sheet that D-113 keeps unoffered |
| `reminder_prime_shown` | catalogue | reminders | consented | named | `notifications:reminder_prime_view` | the denominator of the reminder-fatigue guardrail; an impression of our own card |
| `reminder_prime_result` | catalogue | reminders | consented | named | `notifications:reminder_prime_submit` | `answered` folds to `submit`, as `os_permission_result` is `permission_submit` |
| `os_permission_result` | catalogue | reminders | consented | ruled | `notifications:permission_submit` | 2.9 domain table: `notifications.permission.answered` |
| `reminder_schedule_set` | catalogue | reminders | consented | ruled | `notifications:schedule_update` | 2.9 domain table: `notifications.schedule.changed` |
| `reminder_sent` | catalogue | reminders | consented | dropped | (none) | the registry forbids `reminder_sent` (20 Nov founder rules); the phone cannot observe delivery; 2.9 says (none); PM4 versus PM5 is settled as no delivered event |
| `reminder_suppressed` | catalogue | reminders | consented | ruled | `notifications:reminder_cancel` | 2.9 domain table: `notifications.reminder.suppressed` |
| `notification_opened` | catalogue | reminders | consented | named | `notifications:notification_open` | one key with four types; 2.9 `reminder_open` and `plan_notice_open` have no key of their own and stay unassigned |
| `moment_shown` | catalogue | celebrate | consented | dropped | (none) | no emitter; FR-DAT-26 (stale letter-count types); the registry `^moment_` pin; area `celebrate` is not a category |
| `resurface_shown` | catalogue | celebrate | consented | dropped | (none) | no emitter; the registry `^resurface_` pin; PM2 replaces it by an impression; a one_year card lands on the anniversary of a letter date (timing leak, TRACKING_PLAN 6.4) |
| `resurface_opened` | catalogue | celebrate | consented | dropped | (none) | same as `resurface_shown` |
| `settings_changed` | catalogue | settings | consented | ruled | `me:setting_update` | 2.9 domain table: `me.setting.changed` |
| `export_started` | catalogue | settings | consented | named | `keeping:export_start` | the object must agree with `export_complete` and `export_fail`; `download_start` is retired; funnel F9 and the insights engine read it |
| `export_completed` | catalogue | settings | consented | ruled | `keeping:export_complete` | 2.9 line 118, the seven examples |
| `export_failed` | catalogue | settings | consented | ruled | `keeping:export_fail` | 2.9 domain table: `keeping.export.failed` |
| `export_shared` | catalogue | settings | consented | dropped | (none) | 2.9 no-event list and FR-DAT-27 (no event on a share destination); no emitter; PM3 says fold it away |
| `account_deletion` | catalogue | settings | consented | dropped | (none) | PM3 section 8 and IN-K3 retire it (deletion is never measured on the phone); the server RPC holds the count |
| `offer_code_redeemed` | catalogue | plus | consented | ruled | `plus:code_submit` | 2.9 domain table: `plus.code.redeemed` |
| `restore_result` | catalogue | plus | consented | ruled | `plus:restore_complete` | 2.9 domain table: `plus.restore.completed` (the catalogue row also carries the failed outcome as a property) |
| `sync_failed` | catalogue | errors | consented | ruled | `system:sync_fail` | 2.9 domain table: `system.sync.failed` (#1044); the first generated table missed this row |
| `screen_view` | both | app | basics | pattern | `<area>:<id>_screen_view` (36 today) | 2.9 Basics: `<area>:<screen_id>_screen_view` |
| `app_opened` | both | app | consented | ruled | `system:app_open` | 2.9 domain table: `system.app.opened` |
| `analytics_opted_in` | both | consent | consented | ruled | `system:analytics_consent_accept` | 2.9 domain table: `system.consent.granted` ("duplicates `analytics_opted_in`, so one event") |
| `auth_succeeded` | both | entry | consented | ruled | `onboarding:sign_in_complete` | 2.9 domain table: `onboarding.sign_in.completed` |
| `child_added` | both | children | consented | named | `onboarding:book_create` | registry row whose decision is first-run completion; `create` is the verb of "a child book is created"; `book_save` is not used because PM1 makes `onboarding.book.saved` a server count |
| `capture_started` | both | capture | consented | ruled | `capture:take_start` | 2.9 line 118, the seven examples: `capture_started` to `capture:take_start` (note: the table also holds `capture.letter.started`, `capture:letter_start`) |
| `capture_discarded` | both | capture | consented | named | `capture:take_cancel` | registry row and insights reader; a drop-off shares its object with its start, and `capture_started` is `capture:take_start`; PM1 `letter_cancel` loses on pairing |
| `transcription_completed` | both | capture | consented | ruled | `capture:transcript_complete` | 2.9 domain table: `capture.transcript.completed` (this key also carries failed and no-speech outcomes as a property) |
| `letter_saved` | both | capture | consented | ruled | `capture:letter_save` | 2.9 line 118, the seven examples |
| `free_allowance_reached` | both | plus | consented | ruled | `plus:allowance_reach` | 2.9 domain table: `plus.allowance.reached` |
| `keep_gate_shown` | both | plus | consented | named | `plus:keep_gate_view` | registry row; I3 and F7 read `letters_kept`, `allowance`, `lapsed`; no Keep sheet screen id exists, and a screen view carries none of those |
| `letter_held` | both | plus | consented | ruled | `plus:letter_hold_create` | 2.9 domain table: `plus.letter.held` |
| `plus_started_from_gate` | both | plus | consented | named | `plus:keep_gate_plan_start` | keeps the gate in the name; `plus:plan_start` stays free for the broader PM5 event |
| `book_opened` | both | book | consented | merged | (none) merged into `book:book_screen_view` | PM2 deprecates it into the Book screen view ("counts are not wanted"); funnel `f_return_book_read` is re-expressed on the screen names |
| `letter_opened` | both | book | consented | merged | (none) merged into `book:letter_detail_screen_view` | same PM2 line; screen id `letter_detail` is one id for every letter |
| `invite_created` | both | family | consented | ruled | `family:invite_create` | 2.9 line 118, the seven examples |
| `invite_accepted` | both | family | consented | ruled | `family:invite_accept` | 2.9 domain table: `family.invite.accepted` |
| `plus_offer_viewed` | both | plus | consented | ruled | `plus:offer_view` | 2.9 line 118, the seven examples |
| `plus_offer_closed` | both | plus | consented | ruled | `plus:offer_end` | 2.9 domain table: `plus.offer.closed` |
| `plan_changed` | both | plus | consented | ruled | `plus:plan_update` | 2.9 domain table: `plus.plan.changed` |
| `error_shown` | both | errors | consented | ruled | `system:error_view` | 2.9 line 118, the seven examples |
| `control_tapped` | both | app | consented | pattern | `<area>:<id>_click` (0 today) | 2.9 Basics: `<area>:<control_id>_click` |
| `surface_impressed` | both | app | consented | pattern | `<area>:<id>_view` (0 today) | 2.9 Basics: `<area>:<element_id>_view` |
| `moments_card_impressed` | both | moments | consented | named | `book:moments_card_view` | CDO-25 allows exactly two `moments_` names; Moments sits under Book |
| `moments_card_tapped` | both | moments | consented | named | `book:moments_card_open` | `click` is reserved for control ids (V2); `open` fits a card opened from the tab |
| `perf_measured` | both | app | consented | pattern | `<area>:<id>_measure` (0 today) | 2.9 Basics: `<area>:<metric>_measure` (deviation); tier stays consented until FH-3 |

## Generated names

### `screen_view`

36 names, one per registered `screen` id (area from `ids.ts`):

- `capture:home_screen_view`
- `book:book_screen_view`
- `family:family_screen_view`
- `capture:listen_screen_view`
- `capture:write_screen_view`
- `capture:review_screen_view`
- `book:letter_detail_screen_view`
- `onboarding:onboarding_screen_view`
- `book:read_together_screen_view`
- `onboarding:sign_in_screen_view`
- `onboarding:sign_in_email_screen_view`
- `onboarding:sign_in_code_screen_view`
- `onboarding:sign_in_verify_screen_view`
- `onboarding:sign_in_consent_screen_view`
- `family:invite_screen_view`
- `family:invite_new_screen_view`
- `me:settings_screen_view`
- `me:settings_account_screen_view`
- `me:settings_appearance_screen_view`
- `notifications:settings_reminders_screen_view`
- `keeping:settings_recordings_screen_view`
- `me:settings_child_detail_screen_view`
- `me:settings_child_new_screen_view`
- `me:settings_privacy_screen_view`
- `keeping:settings_export_screen_view`
- `me:settings_language_screen_view`
- `plus:settings_plus_screen_view`
- `keeping:settings_storage_screen_view`
- `me:settings_delete_account_screen_view`
- `onboarding:age_gate_screen_view`
- `system:boot_error_screen_view`
- `plus:plus_confirmed_screen_view`
- `system:not_found_screen_view`
- `family:invite_leave_screen_view`
- `family:whose_book_screen_view`
- `capture:day_sheet_screen_view`

### `control_tapped`

No `control` id is registered yet in `ids.ts`, so no name is generated today.

### `surface_impressed`

No `element` id is registered yet in `ids.ts`, so no name is generated today.

### `perf_measured`

No `metric` id is registered yet in `ids.ts`, so no name is generated today.

## Open items

1. Privacy advice on the 1.0 candidate list (CPrivO-52, CR-212; advisory, not a decision, no code change here). `ENGINEERING-REQUIREMENTS-21nov.md` ER-B02 lists seven candidate funnel-step names for the basics tier. Advice, ruled on 24 Nov 2026: drop `family:invite_create` and `family:invite_accept` (D-161 and D-162: no 1.0 build has an invite door), and strike `onboarding:first_letter_complete` (a server count, with no key, and opt-in comes after the first letter). That leaves four: `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete`, each with counts and enums only. Privacy decides them at step 3, its own PR, which edits the set pinned in `test/tiers.test.ts`; the basics set stays `screen_view` only until then.
2. The registry-only keys `control_tapped`, `surface_impressed`, `perf_measured` stand for names generated per id; no control, element or metric id is registered yet, so none is generated today.

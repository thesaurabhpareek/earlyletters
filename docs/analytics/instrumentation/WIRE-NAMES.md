# Wire names: the mapping table (generated)

Generated from `packages/analytics/src/wire-names.ts` by `npm run wire-names -w @scribe/analytics`; do not edit by hand. `npm run wire-names -w @scribe/analytics -- --check` and `packages/analytics/test/wire-names.test.ts` fail when this file differs from that output. BL-1255 step 1 (CR-212): this is the table `posthog-standard.md` section 2.9 points to as "IN-03".

Nothing here renames anything. The catalogue and registry still hold the old names; the rename PRs (step 2) read this table. The tier column is today's tier from the catalogue and registry rows, and the basics set stays pinned to `screen_view` by `test/tiers.test.ts`.

Counts: 73 keys (30 ruled by 2.9, 4 patterns generated per registered id, 39 NEEDS RULING).

Reading a row. "Ruled" means 2.9 names this event (a domain row, the seven examples of line 118, or the Basics patterns) and the catalogue meaning matches it. NEEDS RULING means 2.9 does not decide, or decides something else (a conflict); the options are candidates for the ruling, not decisions, and no wire name is assigned until it is made.

## Keys

| Key | Lives in | Area today | Tier | Status | Wire name | Basis or what is missing |
|---|---|---|---|---|---|---|
| `app_cold_start` | catalogue | app | consented | NEEDS RULING | (none yet) | 2.9 has no cold-start row (`perf.cold_start` is a perf metric, `system.app.opened` is app_opened). Options: `system:app_start`; (none): perf `cold_start` already measures it |
| `app_opened` | both | app | consented | ruled | `system:app_open` | 2.9 domain table: `system.app.opened` |
| `app_backgrounded` | catalogue | app | consented | NEEDS RULING | (none yet) | 2.9 has `system.session.ended` (`system:session_end`), which fits only if this event is that one. Options: `system:session_end`; `system:app_end` |
| `screen_view` | both | app | basics | pattern | `<area>:<id>_screen_view` (36 today) | 2.9 Basics: `<area>:<screen_id>_screen_view` |
| `analytics_opted_in` | both | consent | consented | ruled | `system:analytics_consent_accept` | 2.9 domain table: `system.consent.granted` ("duplicates `analytics_opted_in`, so one event") |
| `auth_sheet_shown` | catalogue | entry | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `onboarding:sign_in_sheet_view` |
| `auth_method_selected` | catalogue | entry | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `onboarding:sign_in_method_update`; `onboarding:sign_in_method_submit` |
| `auth_succeeded` | both | entry | consented | ruled | `onboarding:sign_in_complete` | 2.9 domain table: `onboarding.sign_in.completed` |
| `auth_failed` | catalogue | entry | consented | ruled | `onboarding:sign_in_fail` | 2.9 domain table: `onboarding.sign_in.failed` |
| `auth_email_sent` | catalogue | entry | consented | NEEDS RULING | (none yet) | 2.9 lists `onboarding.email.sent` as (none), server-only; this row says the phone observes the send. Options: `onboarding:sign_in_email_send`; (none): server-only per 2.9 |
| `auth_deferred` | catalogue | entry | consented | NEEDS RULING | (none yet) | 2.9 has `onboarding.sign_in.dismissed`; whether "chose Later" is that event is a meaning call. Options: `onboarding:sign_in_dismiss` |
| `signed_out` | catalogue | entry | consented | NEEDS RULING | (none yet) | 2.9 has `me.session.closed` (`me:session_end`) but the catalogue event also covers a lost or revoked session. Options: `me:session_end`; `system:session_end` |
| `invite_opened` | catalogue | entry | consented | ruled | `family:invite_open` | 2.9 domain table: `family.invite.opened` (phone side) |
| `local_merge_choice` | catalogue | entry | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `onboarding:local_merge_submit` |
| `child_added` | both | children | consented | NEEDS RULING | (none yet) | 2.9 has `onboarding.book.saved` (`onboarding:book_save`) for the first book only; a later add has no row. Options: `onboarding:book_save`; `me:child_add` |
| `child_switched` | catalogue | children | consented | NEEDS RULING | (none yet) | 2.9 has `capture.child.selected` (`capture:child_update`), a capture-time choice; this is the book switcher. Options: `capture:child_update`; `book:child_update` |
| `child_setting_changed` | catalogue | children | consented | NEEDS RULING | (none yet) | 2.9 has `me.setting.changed` (`me:setting_update`), already taken by `settings_changed`. Options: `me:child_setting_update` |
| `make_it_yours_card` | catalogue | children | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `onboarding:make_it_yours_submit`; `onboarding:make_it_yours_dismiss` |
| `goals_set` | catalogue | children | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `me:goals_update`; `onboarding:goals_save` |
| `dictionary_term_added` | catalogue | children | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `me:dictionary_term_add`; `capture:dictionary_term_add` |
| `capture_started` | both | capture | consented | ruled | `capture:take_start` | 2.9 line 118, the seven examples: `capture_started` to `capture:take_start` (note: the table also holds `capture.letter.started`, `capture:letter_start`) |
| `capture_discarded` | both | capture | consented | NEEDS RULING | (none yet) | 2.9 holds both `capture.take.discarded` (`capture:take_cancel`) and `capture.letter.discarded` (`capture:letter_cancel`); the catalogue says "a letter in progress", while `capture_started` is a take. Options: `capture:take_cancel`; `capture:letter_cancel` |
| `transcription_completed` | both | capture | consented | ruled | `capture:transcript_complete` | 2.9 domain table: `capture.transcript.completed` (this key also carries failed and no-speech outcomes as a property) |
| `letter_saved` | both | capture | consented | ruled | `capture:letter_save` | 2.9 line 118, the seven examples |
| `review_action` | catalogue | capture | consented | NEEDS RULING | (none yet) | 2.9 has `capture.review.selected` (`capture:review_update`); this key carries several actions. Options: `capture:review_update`; `capture:review_submit` |
| `machine_edit_reverted` | catalogue | capture | consented | NEEDS RULING | (none yet) | 2.9 has `capture.edit.discarded` and `keeping.version.restored`; "undo one machine edit" fits either. Options: `capture:edit_cancel`; `keeping:version_restore` |
| `machine_edit_rejected` | catalogue | capture | consented | NEEDS RULING | (none yet) | 2.9 has `capture.edit.declined` (`capture:edit_decline`); unclear whether that is the verifier refusing. Options: `capture:edit_decline` |
| `letter_deleted` | catalogue | capture | consented | ruled | `keeping:letter_delete` | 2.9 domain table: `keeping.letter.deleted` (the catalogue row also covers restore, which 2.9 names `keeping:letter_restore`; any split is a property question for the rename PR) |
| `language_set` | catalogue | languages | consented | ruled | `me:language_update` | 2.9 domain table: `me.language.changed` |
| `pack_download` | catalogue | languages | consented | NEEDS RULING | (none yet) | 2.9 has only `system.pack.started` (`system:pack_start`); the catalogue row carries every state change. Options: `system:pack_start`; `system:pack_complete` |
| `book_opened` | both | book | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `book:book_view` |
| `letter_opened` | both | book | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `book:letter_view`; `book:letter_open` |
| `playback_started` | catalogue | book | consented | ruled | `book:playback_start` | 2.9 domain table: `book.playback.started` |
| `read_together_started` | catalogue | book | consented | ruled | `book:read_together_start` | 2.9 domain table: `book.read_together.started` |
| `read_together_ended` | catalogue | book | consented | ruled | `book:read_together_end` | 2.9 domain table: `book.read_together.ended` |
| `invite_created` | both | family | consented | ruled | `family:invite_create` | 2.9 line 118, the seven examples |
| `invite_accepted` | both | family | consented | ruled | `family:invite_accept` | 2.9 domain table: `family.invite.accepted` |
| `invite_failed` | catalogue | family | consented | ruled | `family:invite_fail` | 2.9 domain table: `family.invite.failed` |
| `family_letter_reviewed` | catalogue | family | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `family:family_letter_review_submit`; `family:letter_review_submit` |
| `member_removed` | catalogue | family | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `family:member_remove` |
| `member_left` | catalogue | family | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `family:member_end`; `family:member_leave_submit` |
| `reminder_prime_shown` | catalogue | reminders | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `notifications:reminder_prime_view` |
| `reminder_prime_result` | catalogue | reminders | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `notifications:reminder_prime_submit` |
| `os_permission_result` | catalogue | reminders | consented | ruled | `notifications:permission_submit` | 2.9 domain table: `notifications.permission.answered` |
| `reminder_schedule_set` | catalogue | reminders | consented | ruled | `notifications:schedule_update` | 2.9 domain table: `notifications.schedule.changed` |
| `reminder_sent` | catalogue | reminders | consented | NEEDS RULING | (none yet) | 2.9 lists `notifications.reminder.delivered` as (none) and notes PM4 and PM5 disagree; this key is the phone-side "fired, seen on next foreground" log, which 2.9 does not name. Options: (none): drop the row, per the 2.9 (none) entry; `notifications:reminder_send` |
| `reminder_suppressed` | catalogue | reminders | consented | ruled | `notifications:reminder_cancel` | 2.9 domain table: `notifications.reminder.suppressed` |
| `notification_opened` | catalogue | reminders | consented | NEEDS RULING | (none yet) | 2.9 has `notifications.reminder.opened` and `notifications.plan_notice.opened`; this key covers any notification. Options: `notifications:reminder_open`; `notifications:plan_notice_open` |
| `moment_shown` | catalogue | celebrate | consented | NEEDS RULING | (none yet) | the catalogue area is not one of the nine categories of 2.3. Options: `book:moment_view` |
| `resurface_shown` | catalogue | celebrate | consented | NEEDS RULING | (none yet) | the catalogue area is not one of the nine categories of 2.3. Options: `book:resurface_view` |
| `resurface_opened` | catalogue | celebrate | consented | NEEDS RULING | (none yet) | the catalogue area is not one of the nine categories of 2.3. Options: `book:resurface_open` |
| `settings_changed` | catalogue | settings | consented | ruled | `me:setting_update` | 2.9 domain table: `me.setting.changed` |
| `export_started` | catalogue | settings | consented | NEEDS RULING | (none yet) | 2.9 has `keeping.download.started` (`keeping:download_start`) but the other export rows say "export"; the verb object must agree. Options: `keeping:export_start`; `keeping:download_start` |
| `export_completed` | catalogue | settings | consented | ruled | `keeping:export_complete` | 2.9 line 118, the seven examples |
| `export_failed` | catalogue | settings | consented | ruled | `keeping:export_fail` | 2.9 domain table: `keeping.export.failed` |
| `export_shared` | catalogue | settings | consented | NEEDS RULING | (none yet) | 2.9 lists `keeping.export.shared` as (none): "NO EVENT (FR-DAT-27: no event on the share destination)", yet the catalogue holds this row. Conflict, not a naming gap. Options: (none): drop the row, per 2.9 and FR-DAT-27; `keeping:export_share_end` |
| `account_deletion` | catalogue | settings | consented | NEEDS RULING | (none yet) | 2.9 has three rows (`account_deletion_start`, `_restore`, `account_delete`); the catalogue has one key with a step property, and one key cannot have three names. Options: `keeping:account_deletion_start (and split)`; `keeping:account_delete (the confirmed step only)` |
| `plus_offer_viewed` | both | plus | consented | ruled | `plus:offer_view` | 2.9 line 118, the seven examples |
| `plus_offer_closed` | both | plus | consented | ruled | `plus:offer_end` | 2.9 domain table: `plus.offer.closed` |
| `plan_changed` | both | plus | consented | ruled | `plus:plan_update` | 2.9 domain table: `plus.plan.changed` |
| `free_allowance_reached` | both | plus | consented | ruled | `plus:allowance_reach` | 2.9 domain table: `plus.allowance.reached` |
| `keep_gate_shown` | both | plus | consented | NEEDS RULING | (none yet) | no row in 2.9; candidate follows the grammar of 2.2 and the folds of 2.4. Options: `plus:keep_gate_view` |
| `letter_held` | both | plus | consented | ruled | `plus:letter_hold_create` | 2.9 domain table: `plus.letter.held` |
| `plus_started_from_gate` | both | plus | consented | NEEDS RULING | (none yet) | 2.9 has `plus.plan.started` (`plus:plan_start`); this key is the narrower "after the Keep sheet" step, which a funnel needs apart. Options: `plus:plan_start`; `plus:gate_plan_start` |
| `offer_code_redeemed` | catalogue | plus | consented | ruled | `plus:code_submit` | 2.9 domain table: `plus.code.redeemed` |
| `restore_result` | catalogue | plus | consented | ruled | `plus:restore_complete` | 2.9 domain table: `plus.restore.completed` (the catalogue row also carries the failed outcome as a property) |
| `moments_card_impressed` | both | moments | consented | NEEDS RULING | (none yet) | the catalogue area is not one of the nine categories of 2.3; also a basics-style impression, but its id is a slot, not a registered element id. Options: `book:moments_card_view` |
| `moments_card_tapped` | both | moments | consented | NEEDS RULING | (none yet) | the catalogue area is not one of the nine categories of 2.3; also a basics-style tap, but its id is a slot, not a registered control id. Options: `book:moments_card_click` |
| `error_shown` | both | errors | consented | ruled | `system:error_view` | 2.9 line 118, the seven examples |
| `sync_failed` | catalogue | errors | consented | NEEDS RULING | (none yet) | 2.9 has `system.error.raised` (`system:error_fail`), a different row. Options: `system:sync_fail`; `system:error_fail` |
| `control_tapped` | registry | app | consented | pattern | `<area>:<id>_click` (0 today) | 2.9 Basics: `<area>:<control_id>_click` |
| `surface_impressed` | registry | app | consented | pattern | `<area>:<id>_view` (0 today) | 2.9 Basics: `<area>:<element_id>_view` |
| `perf_measured` | registry | app | consented | pattern | `<area>:<id>_measure` (0 today) | 2.9 Basics: `<area>:<metric>_measure` (deviation); tier stays consented until FH-3 |

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

1. Privacy advice on the 1.0 candidate list (CPrivO-52, CR-212; advisory, not a decision, no code change here). `ENGINEERING-REQUIREMENTS-21nov.md` ER-B02 lists seven candidate funnel-step names for the basics tier. Advice: drop `family:invite_create` and `family:invite_accept` from the 1.0 set. D-161 and D-162 mean no 1.0 build has an invite door, so those rows would never fire and would only widen the list; add them when the co-parent work (BL-883 to BL-889) ships. That leaves five: `onboarding:first_letter_complete`, `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete`, each with counts and enums only. `onboarding:first_letter_complete` (2.9: `onboarding.first_letter.completed`) has no key above today, so the rename work needs a row for it or a ruling that `letter_saved` carries it as a property. The basics set stays `screen_view` only until privacy signs a list (step 3, its own PR, which edits the set pinned in `test/tiers.test.ts`).
2. `keeping.export.shared` is (none) in 2.9 (FR-DAT-27) while `export_shared` is in the catalogue: a ruling is needed before the rename drops or keeps it.
3. The registry-only keys `control_tapped`, `surface_impressed`, `perf_measured` stand for names generated per id; no control, element or metric id is registered yet, so none is generated today.

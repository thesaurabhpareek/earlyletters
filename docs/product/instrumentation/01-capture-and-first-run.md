# Instrumentation requirements 1: capture and first run (NS-01, NS-04, NS-13 to NS-20, NS-38 to NS-45)

Status: PROPOSED, 20 Nov 2026, rev 2 (after Review A) | Author: `product` (PM1) | Partner: `analytics`. Names follow `docs/analytics/instrumentation/00-event-standard.md` as it stands on branch `docs/instr-analytics-20nov` (PR #1042) [V]: closed action list, id registry slugs, funnel rows with a window and a success step. `analytics.md` is not read (UNVERIFIED).
Tags: [V] read this session. [P] proposed by me. No locked statement is changed; where one would change I give a placeholder erratum id (E-INSTR-n; E83 is taken by #1051).
Founder rules applied: only completely free open-source tools that fit Expo, Supabase, Vercel; every event follows the standard; and (20 Nov, chat) "We are going to build for production now so analytics is needed." Analytics therefore ships in the production release behind the consent gate: opt-in, off until the parent says yes, no content, all privacy rules kept.

## 0. The frame

1. This reverses "off through 1.0.x" (D-095, D-124 item 3, FR-DAT-01) for the production release. It needs a new D-### from the founder superseding those, and E-INSTR-1 changing FR-DAT-01 from "never sent" to "nothing before a yes". Until the founder records it, this file is PROPOSED.
2. Every event is closed: enums, booleans, bucketed integers. No text on screen, no id of a person, book, letter, picture or media, no child name or date, no prompt text, no Find query, no typed day word (OBSERVABILITY-WITHOUT-CONTENT section 2 [V]).
3. The first run still cannot be seen on the phone: the consent sheet is a later session after the first letter (TRACKING_PLAN section 2, K-01; NS-39; IA-FINAL section 10). Before a yes nothing is sent, queued or written (standard V15). So install to first letter rests on App Store Connect (ASC), the one-time summary and, if any rounds run, tester numbers. Moving consent earlier is a CPO decision (D2).
4. Server aggregates (`insights.*`) are NOT read in the 1.0 line unless the founder rules otherwise (FQ-01, FR-DAT-28). So the funnel numbers that exist are phone-side (consenters only), Apple's (ASC, Organizer) and tester numbers. Server events appear below only as proposed rows that nobody reads until that ruling.
5. Device numbers are "among consenting people" (assumed 40%, TRACKING_PLAN 1.2); never divide a device count by a server total (1.4).
6. Nothing here reaches a screen: no parent-facing count (FR-DAT-03), no in-app research question (FR-DAT-02), no streak, badge or gap count.
7. North star: weekly making families, WMF (FR-DAT-21), beside weekly keeping families, WKF. Phone side: `capture.letter.saved` among consenters, read as "x of n"; the Q-NS-1 answer by hand where a round runs. Never a family count shown to a parent.
8. Small base: no percentage when n is under 20 (FR-DAT-08). Targets are PROPOSED unless a card sets one.

## 1. Naming, by the standard (#1042)

- Basics: `screen.<screen_id>.viewed`, `ui.<control_id>.tapped`, `ui.<element_id>.impressed`, `perf.<metric>.measured`. Domain: `<area>.<object>.<action>`; areas used: onboarding, capture, me, notifications, system. Action is from the closed list (viewed, tapped, impressed, measured, started, completed, saved, shown, opened, closed, changed, sent, delivered, failed, declined, granted, withdrawn, discarded, deleted, restored, kept, dismissed, accepted, selected). 60 characters at most.
- Ids are registered slugs that map to an IA-FINAL id (IA ids have hyphens and capitals), never text on screen. `control_id` and `element_id` are `<screen_id>_<what>`. One id serves `.impressed` and `.tapped`, so rate = tapped over impressed. A dynamic list is one id.
- Properties: `screen.*.viewed` carries `from_screen`, `build_kind`; `ui.*.tapped` carries `screen`; `ui.*.impressed` carries `screen`, `rank`?; `perf.*.measured` carries `ms_bucket`, `ok`. Nothing else.
- Autocapture is never used: PostHog's React Native SDK, with touch capture on, "captures identifiers and text content by default" [V posthog.com/docs/libraries/react-native]. Touch capture, lifecycle capture, replay, surveys, flags and geoip stay off (V16).
- Old catalogue names (68 events in `packages/analytics`) map to new ones in section 4; a rename is a new event (rule 8).

## 2. Screens, controls and impressions

Source of IA ids: `docs/design/IA-FINAL-20nov.md` on branch `docs/design-ia-final-20nov` (PR #1033, not on develop) [V]. Slugs below are [P] additions to the id registry (IN-01). Gate for every row: `analytics_consent` (after a yes). "Never" means no event ever.

| NS | IA id > screen_id slug | Control and element ids (`<screen_id>_` prefix; T = tapped, I = impressed) | Notes |
|---|---|---|---|
| NS-39 | E-S01 > `boot`; E-S02 > `welcome` | welcome: T `sign_in_apple`, `sign_in_email`, `terms_link`, `privacy_link` | Before consent, so never emitted; the phone sees these only if consent were earlier |
| NS-40 | E-S03 > `age_gate` | NONE, not even a count of No. The answer is a boolean, never sent (NS-40 4 and 11; TRACKING_PLAN `auth_failed`) | Never |
| NS-40 | E-S04 refused-region | none | No phone event, and no region count: unmeasured by data-steward ruling FD-5 |
| NS-41 | E-S04 > `sign_in`; E-S05 > `sign_in_email`; E-S06 > `sign_in_code`; E-S14 > `sign_in_outage` | `sign_in_apple`, `sign_in_email`, `sign_in_send_code`, `sign_in_code_resend`, `sign_in_email_change`, `sign_in_outage_start_on_phone` (D-160) | Mostly before consent |
| NS-42 | E-S07 > `agreements`; C-S11 > `returning_consent` | T `agreements_agree`, `agreements_not_now`, `agreements_documents`; I `agreements_sheet` | The record itself is the consent row, never an event. Sensitive-data choices: not measured (FD-5) |
| NS-43 | E-S08 > `first_book` | T `first_book_born`, `first_book_expecting`, `first_book_continue`, `first_book_add_another`, `first_book_twins` | Flags only, never name or date |
| NS-39 | E-S29 > `mic_primer`; A-S04 primer | T `mic_primer_continue`, `mic_primer_not_now`; I `mic_primer` | |
| NS-44 | A-S13 > `after_keep`; E-S10 > `keep_gate`; E-S11 > `plan`; E-S12 > `plus_confirmed` | T `keep_gate_start_plus`, `keep_gate_keep_here`, `plan_open`; I `keep_gate` | PM5 owns Plus events |
| NS-45 | C-S01 > `me`; C-S02 > `me_account`; C-S03 > `sign_out_sheet`; C-S19 > `erase_everything`; C-S20 > `delete_account`; E-S16 > `update_line`; E-S24 > `claim` | T `sign_out_sheet_sign_out`, `sign_out_sheet_stay`, `me_account_delete`, `me_erase_everything`, `update_line_open`, `claim_book`; I `update_line`, `claim_offer` | |
| NS-13, 14, 19, 35 | A-S01 > `home` | T `home_speak`, `home_type`, `home_start_from_photo` (dark), `home_not_much_today`, `home_another_thought`, `home_pick_it_up`, `home_whose_book`; I and T (shared id) `home_slip_waiting`, `home_slip_seal_opened`, `home_slip_day_today`, `home_slip_save_copy`, `home_slip_days_ask`, `home_slip_past_letter`; I `home_prompt`, `home_plus_line` | One slip at a time (IA 4.1); a slip dismiss is `home_slip_dismiss` T |
| NS-14 | A-S02 > `whose_book` | T `whose_book_pick`, `whose_book_close`; I `whose_book` | |
| NS-35 | A-S04 > `listen`; A-S05 > `write`; A-S07 > `review` | T `listen_start`, `listen_stop`, `listen_type_instead`, `listen_let_it_go`, `write_send`, `review_keep`, `review_small_fixes`, `review_exactly_said`, `review_change_day`, `review_change_from`, `review_change_language`, `review_say_again`, `review_undo_all` | |
| NS-15, 16, 17 | A-S08 > `day_sheet`; A-S09 > `from_sheet`; A-S10 > `language_sheet` | T `day_sheet_pick_day`, `day_sheet_pick_month`, `day_sheet_done`, `from_sheet_use_my_name`, `from_sheet_pick_name` (never the name), `language_sheet_type_words`, `language_sheet_keep_recording`; I the three sheets | NS-16 and NS-17 dark in the store build |
| NS-13 | D-S04 > `reminder_ask`; D-S06 > `reminders`; D-S07 > `time_picker` | T `reminder_ask_yes`, `reminder_ask_not_now`, `reminders_switch`, `reminders_time`, `reminders_names_switch`, `reminders_preview`; I `reminder_ask` | The OS alert (D-S05) is `notifications.permission.changed` |
| NS-18 | C-S24 > `days`; D-S08 > `add_day`; D-S09 > `typed_day` | T `days_add`, `days_remove`, `reminders_days_pointer`; I `days_page`, `days_ask` | Never the day word. Dark with `EXPO_PUBLIC_DAYS` |
| NS-01 | A-S03 > `photo_picker`; B-S03 > `book_lens`; B-S11 > `photo_viewer` | T `home_start_from_photo`, `photo_viewer_replace`, `book_lens_photos` | Dark (`EXPO_PUBLIC_PHOTOS`) |
| NS-04, NS-20 | none | none | No screen; NS-20 not built |

Impression to tap rates (consenters, "x of n"): each `home_slip_*`; `home_prompt` impressed to `capture.letter.started` by `prompt_kind` (the prompt text is never sent); `reminder_ask` to `reminder_ask_yes`; `keep_gate` to `keep_gate_start_plus`.

## 3. Funnels

Rows as the standard asks: id, ordered event names, window, success step. Sources: P phone after consent; A ASC; T tester numbers by hand if a round runs; M run-sheet by hand.

| Funnel id | Ordered events | Window | Success |
|---|---|---|---|
| `f_onboarding_first_letter` | A first-time downloads (not an event); `onboarding.summary.sent` (carries `time_to_first_letter`, `first_letter_mode`, `signed_in`) | d30 | the summary shows a first letter |
| `f_onboarding_sign_in` | `screen.sign_in.viewed` > `ui.sign_in_apple.tapped` or `ui.sign_in_email.tapped` > `onboarding.email.sent` > `onboarding.sign_in.completed` (or `onboarding.sign_in.failed`) | session | `onboarding.sign_in.completed` |
| `f_capture_letter_saved` | `ui.home_speak.tapped` or `ui.home_type.tapped` > `capture.letter.started` > `capture.transcript.completed` > `capture.review.selected` > `capture.letter.saved` (drop-off: `capture.letter.discarded`) | session | `capture.letter.saved` |
| `f_notifications_reminder_letter` | `ui.reminder_ask.impressed` > `ui.reminder_ask_yes.tapped` > `notifications.permission.changed` > `notifications.schedule.changed` > `notifications.reminder.delivered` > `notifications.reminder.opened` > `capture.letter.saved` | d7 | `capture.letter.saved` with `from_notification_2h` |
| `f_capture_day_changed` | `ui.day_sheet.impressed` > `ui.day_sheet_done.tapped` > `capture.day.changed` (same shape for from and language sheets) | session | `capture.day.changed` |
| `f_plus_allowance` (PM5 owns the events) | `ui.keep_gate.impressed` > `ui.keep_gate_start_plus.tapped` | session | Plus on |

Limits: steps before the first letter (launch, age, welcome) have no phone source by design; letters kept only on the phone are invisible to any server count; device funnels are consenters only.

Performance (`perf.<metric>.measured`, metrics from the standard's closed list):

| Event | Budget (source) | Taken by |
|---|---|---|
| `perf.launch_interactive.measured` | p50 1.2 s, p90 2.0 s (L-01) | P after consent; first launch is never measured on the phone (no consent), so it stays M on the NS-34 run sheet |
| `perf.save_commit.measured` | p95 200 ms (C-02) | P bucket; finer numbers M |
| `perf.speak_tap_to_mic.measured` | p95 500 ms, 200 taps (C-01) | M (video or marker) and P bucket |
| warm start p50 400 ms (L-05), switch child p95 300 ms (L-08) | | M only. Warm start is not in the standard's metric list; a PR to #1042 would add `warm_start` [P] |
| crash-free sessions | 99.8% after release; zero unresolved signatures over 500 sessions before (FR-DAT-16) | Apple Organizer and ASC (opt-in users); crash tool is PM5 and `ops` |

Conflict: MEASUREMENT-PLAN section 4 says markers are "never in analytics"; the founder asks for performance in analytics. Proposal: bucketed `perf.*.measured` only for the three metrics above; hand markers stay hand (CPO D5).

## 4. Event registry rows for this area

One definition per event. Fields (standard section 7): name, v, trigger, properties, class, owner, side, consent_gate, status, req, funnels. Constant for every row: v 1, class L2 with sensitivity none, status proposed, side phone, consent_gate `analytics_consent`, owner `mobile`, unless a cell says otherwise. Shared sets: `audio_bucket` lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m; `words_bucket` lt_25 \| 25_99 \| 100_299 \| 300_plus; `count_bucket` 0 \| 1_2 \| 3_9 \| 10_plus; `child_ordinal` first \| second \| third_plus; `member_role` parent \| contributor; `mode` spoken \| typed \| mixed. `schema_version` is global.

| Name | Trigger | Properties | req | Funnels | Was |
|---|---|---|---|---|---|
| `screen.<screen_id>.viewed`, `ui.<id>.tapped`, `ui.<id>.impressed`, `perf.<metric>.measured` | section 1 | as section 1 | IA; NS-34 | all | `screen_view`, `app_cold_start` |
| `capture.letter.started` | Speak or type begins | `mode`; `source` (home \| notification \| doorway \| resurface); `prompt_kind` (opening \| gap \| hard \| family \| together \| none); `child_ordinal`; `member_role` | NS-35, NS-13 | f_capture_letter_saved | `capture_started` |
| `capture.letter.discarded` | Take thrown away | `mode`; `stage` (listening \| review); `audio_bucket`? | NS-09 | f_capture_letter_saved | `capture_discarded` |
| `capture.transcript.completed` | Spoken take transcribed, empty or failed | `engine` (on_device \| server); `audio_bucket`; `latency_bucket` (lt_5s \| 5_15s \| 15_30s \| 30_60s \| gt_60s); `outcome` (ok \| no_speech \| failed \| queued_for_model) | NFR-7.7 | f_capture_letter_saved | `transcription_completed` |
| `capture.review.selected` | An action on Review | `action` (show_exactly_said \| edit_text \| say_again \| play_back \| change_child \| change_destination \| undo_all_edits) | NS-14, 15 | f_capture_letter_saved | `review_action` |
| `capture.letter.saved` | Letter kept | `mode`; `destination` (book \| private); `child_ordinal`; `member_role`; `prompt_kind`; `audio_bucket`?; `words_bucket`; `edit_count` and `reverted_count` (`count_bucket`); `engine` (on_device \| server \| none \| pending); `from_notification_2h` (bool) | NS-13, NS-44, FR-DAT-21 | f_capture_letter_saved, f_notifications_reminder_letter | `letter_saved` (raw counts bucketed) |
| `capture.edit.discarded` | One machine edit undone | `edit_type` (core EditType); `source` (rule \| model) | constitution | none | `machine_edit_reverted` |
| `capture.edit.declined` | Verifier refused edits | `edit_type`; `source`; `reason` (core RejectReason); `count` (`count_bucket`) | constitution | none | `machine_edit_rejected` |
| `capture.media.saved` | A picture joins a letter | `source` (photo_first \| review \| letter_page); `kind` (photo) | NS-01 (`NX-39-R34`) | none | `media_added` (not in catalog v8) |
| `capture.day.changed` | Day or month set | `granularity` (day \| month) | NS-15 | f_capture_day_changed | none |
| `capture.author.changed` | From set to another speaker | `kind` (self \| other) | NS-16 | none | none |
| `capture.child.selected` | Active book changed | `child_ordinal`; `surface` (home \| book \| review) | NS-14 | none | `child_switched` |
| `me.language.changed` | Spoken language added, removed or made primary | `action` (added \| removed \| made_primary). The language value is NOT sent here: the standard (section 6) allows `lang` on `languages` events only after the TRACKING_PLAN 6.2 rule, and counsel Q6 was not read this session, so I drop it until it is cited | NS-17 | none | `language_set` |
| `me.session.closed` | Session ended on this phone | `reason` (user \| apple_revoked \| switch_account \| session_lost) | NS-45 | none | `signed_out` |
| `me.setting.changed` | Person-level setting changed | `key` (reminders \| lock_screen_names \| languages \| reading_size \| theme). `sensitive_data` is not a key (FD-5) | NS-13 | none | `settings_changed` |
| `notifications.permission.changed` | OS permission answered | `granted` (bool); `platform` (ios \| android) | NS-13 | f_notifications_reminder_letter | `os_permission_result` |
| `notifications.schedule.changed` | Cadence, time or pause saved | `cadence` (off \| weekly \| few_times \| every_evening); `hour_bucket` (morning \| afternoon \| evening \| late_evening); `paused` (bool) | NS-13 | f_notifications_reminder_letter | `reminder_schedule_set` |
| `notifications.reminder.delivered` | Local reminder fired (logged next foreground) | `type` (letter_reminder \| family_digest). Month-age and birthday notes never (E82) | NS-13, NS-32 | f_notifications_reminder_letter | `reminder_sent` |
| `notifications.reminder.declined` | Planner skipped a reminder | `reason` (wrote_recently \| quiet_window \| weekly_cap \| paused) | NS-13 | none | `reminder_suppressed` |
| `notifications.reminder.opened` | App opened from a reminder | `type` (letter_reminder \| family_digest) | NS-13 | f_notifications_reminder_letter | `notification_opened` |
| `system.consent.granted` | Person says yes | `surface` (consent_sheet \| settings) | LEGAL-REQ-003 | none | part of `analytics_opted_in` |
| `onboarding.summary.sent` | Right after a yes: first-run facts the phone already holds | `days_since_install` (d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus); `letters_bucket`; `signed_in` (bool); `first_letter_mode` (spoken \| typed \| mixed \| none); `time_to_first_letter` (lt_90s \| 90s_5m \| 5_30m \| 30m_24h \| gt_24h \| unknown); `came_from_invite` (bool); with PC-1 also `first_sign_in_method` (apple \| email \| none), `mic_primer_result` (granted \| denied \| not_asked), `speech_pack_state` (none \| downloading \| ready) | K-01 | f_onboarding_first_letter | rest of `analytics_opted_in` |
| `onboarding.sign_in.completed` | Session exists | `method` (apple \| email); `had_local_data` (bool) | A-NFR-013 | f_onboarding_sign_in | `auth_succeeded` |
| `onboarding.sign_in.failed` | Sign-in failed or cancelled | `method`; `reason` (cancelled \| network \| expired \| wrong_code \| code_paused \| rate_limited \| invalid_email \| not_available \| provider \| session_expired \| consent_unavailable \| unknown) | NS-41 | f_onboarding_sign_in | `auth_failed` |
| `onboarding.email.sent` | Sign-in email or code sent | `attempt` (`count_bucket`) | NS-41 | f_onboarding_sign_in | `auth_email_sent` |
| `onboarding.sign_in.dismissed` | Later chosen on the sheet | `trigger` (first_letter \| sign_in \| settings) | NS-41 | none | `auth_deferred` |
| `system.error.shown` | User-facing error shown | `code` (save_failed \| mic_denied \| transcription_failed \| offline \| storage_low \| generic) | NS-39, 44 | none | `error_shown` |
| `system.pack.started`, `.completed`, `.failed`, `.deleted` | Pack or model download state | `pack_kind` (rules \| prompts \| model); `network` (wifi \| cellular \| none \| unknown); `failure`? (no_space \| hash_mismatch \| offline \| needs_app_update \| download_failed \| cancelled \| storage_error). No language value (see `me.language.changed`) | NS-17 | none | `pack_download` |
| `onboarding.account.completed`, `onboarding.terms.accepted`, `onboarding.book.saved`, `onboarding.first_letter.completed` | Server counts at account, Terms, first book, first synced letter | none | NS-41 to 44 | f_onboarding_first_letter | none. Side `server`, gate `none_server_aggregate` (k = 10), owner `data-architect`; NOT READ in the 1.0 line (FQ-01, FR-DAT-28) |

Removed on ruling: `onboarding.sensitive.accepted` and `.declined`, `onboarding.region.refused`, the `sensitive_data` setting key and `sensitive_data_choice` from PC-1. They stay unmeasured (FD-5; CPO list). Never an event: the age answer, any country question, any text a person typed or said, any id of a person, book, letter or media, a prompt text, a notification timed by a birthday.

## 5. The journey, step by step

Cells name events only. Readers: founder weekly, `product`, `mobile`. Gate for all: section 8.

| Step | Question | Measure | NOT measured, why | Target (PROPOSED unless cited) | Guardrail (zero) | Observability |
|---|---|---|---|---|---|---|
| NS-38 Store page | Does the page bring openers? | A: page views, first-time downloads | Anything in the app | Baseline | Listing claims the build lacks = 0 (NS-38-R2) | ASC |
| NS-39 First launch | Quick, nothing surprising? | M cold start on SE 3; T "did anything ask for something you did not expect" and "did the speech download start without your tap" if a round runs (NS-39 21) | Launch events: nothing before consent | p50 1.2 s (L-01) | Speech download without a tap = 0 | Fault-log codes on the phone |
| NS-40 Age and region | Do adults get stuck? | Support tally "locked out by the age question" (counts) | Age answer, any No, IP, country; region refusals unmeasured (FD-5, D-137) | Baseline | Under-18 answer sent anywhere = 0 | Hook error classes in server logs |
| NS-41 Sign in | Does it work first time? | `f_onboarding_sign_in`; `onboarding.sign_in.failed` reasons | Email, relay address, provider id | 97% weekly (A-NFR-013), read from Supabase Auth logs only if the founder rules servers in (FQ-01); else tester and support | Account with no Terms row = 0 | `reason` enum |
| NS-42 Agreements | Do people finish them? | `ui.agreements_agree.tapped` over `ui.agreements_sheet.impressed`; support tally "confused by the agreements" | Per-person acceptance; sensitive-data accept or decline (FD-5) | Baseline | Pre-ticked box or bundled consent = 0 (NS-42 12) | `consent_unavailable` |
| NS-43 First book | Does setup feel short? | T (NS-43 21); `screen.first_book.viewed` | Name, signs-as, dates, expecting, languages | Baseline | Fields beyond NS-43 11 = 0 | Server `22023` class |
| NS-44 First letter | How long to the first kept letter; did Plus show early? | `onboarding.summary.sent`; T (NS-44 21); A paid starts over downloads | The letter; any count shown to a parent (FR-DAT-03) | Median 90 s or less (B F1 R1) | Plus before the third Keep = 0; recording blocked = 0 | `system.error.shown` |
| NS-45 Account life | Mistaken sign-out or delete? | `me.session.closed`; support tally | Why they left | Baseline | Letters gone after sign-out = 0; "deleted by mistake" = Severity 1 (FR-DAT-09) | `reason` enum |
| Start (NS-35) | Do people start from Home, and with what? | `capture.letter.started` | Prompt text, child | Baseline | Start from anywhere but Home or an allow-listed doorway = 0 | CI kill harness (C-06, C-07) |
| Speak or type | Where do people give up? | `capture.letter.discarded`, `capture.transcript.completed` | Audio, transcript | Baseline | Recording lost = 0 | `system.error.shown` |
| Review (fidelity) | Do fixes help or get undone? | `capture.edit.discarded`, `capture.edit.declined`, `capture.review.selected` | Edit text, span | Under 5% undone, a type over 10% reviewed (TRACKING_PLAN 1.3) | A word added that was not said = 0 (Q-FID-1) | RejectReason enum |
| Keep | Are letters kept? | `capture.letter.saved` (WMF) | Words, length | WMF is the north star (FR-DAT-21) | Letter in the wrong book = 0 (NS-14) | `perf.save_commit.measured` |
| NS-13 Reminders | Do they help, then step back? | `f_notifications_reminder_letter`; `notifications.reminder.declined` | Minute-level time, any age or month (E82) | 12% saved within 2 h; paused or off 10% or less (C section 9) | Too many notifications = Severity 1; over 1 a day or 60 pending (NS-32) = 0 | Phone codes `schedule_failed`, `budget_full` |
| NS-14 Whose book | Right book? | `capture.child.selected` | Which child | Switch p95 300 ms (L-08) | Wrong-book report = 0 | M |
| NS-15 Another day | Is it used? | `capture.day.changed` | The date | Baseline | none | none |
| NS-16 Someone else speaks | Used, understood? | `capture.author.changed` | Any name | Dark until counsel Q45, Q46, Q48, Q54 and the `child-input` flag | Child's voice captured without the gate = 0 | none |
| NS-17 Language | Does the pack work? | `me.language.changed`, `system.pack.*`; reviewer corpus | Words, language value | Pack failure under 2% of starts (TRACKING_PLAN 1.2) | `not_vetted_for_language` rising = review | `failure` enum |
| NS-18 Typed days | Do people add a day? | `ui.days_add.tapped` | Day word, date, religion, ethnicity, region (never in analytics) | Dark; baseline | Day word in a payload = 0 | none |
| NS-19 Add more | Are waiting drafts picked up? | `ui.home_slip_waiting.impressed` to `.tapped` | The draft | Baseline | Recorded then lost = 0 | CI DL-01, DL-02 |
| NS-01 Photo | Start a letter from a picture? | `capture.media.saved`; five-parent study (NS-01 21) | Pictures per letter, size, file, place (NS-52-R43) | 4 of 5 start unaided (cited) | Any media id or per-letter count in a payload = 0 | `pick_cancelled`, `decode_failed` phone codes |
| NS-04 Spike | Does a doorway start a letter unlocked? | None; findings file; T (NS-04 20) | Everything | GO or NO-GO | Doorway that records on its own = 0 | none |
| NS-20 Two books | n/a | not built | n/a | n/a | n/a | n/a |

## 6. Free open-source tools, checked

Rule: completely free and fits Expo, Supabase, Vercel. Facts [V] read 20 Nov at the page named.

| Need | Option | Licence | Cost | Data held | Status |
|---|---|---|---|---|---|
| Events, funnels | PostHog | MIT "except the `ee` directory" [V github.com/PostHog/posthog] | Cloud free tier "first 1M events free, every month", no card [V posthog.com/pricing]. Self-host hobby deploy about 100k events a month, no support [V github page]; it needs a machine and Supabase and Vercel do not run it, so a free host is UNVERIFIED | Closed events and a random per-consent id | NOT adopted. The host is the founder's and counsel's decision. The cloud free tier is a hosted third party: it needs a subprocessor entry, a data-map line, a privacy policy change and a label change |
| Phone SDK | `posthog-react-native` | UNVERIFIED | free | as above | Wrapper with touch capture, lifecycle capture, replay, geoip off (replay off by default [V]; `defaultOptIn` false until consent [V]) |
| Server counts | Supabase Auth logs, Postgres views | existing stack | free-tier limits UNVERIFIED here | Aggregates | Not read in 1.0 (FQ-01) |
| Crashes, BI | Sentry or GlitchTip, Metabase, Grafana | UNVERIFIED | UNVERIFIED | | Not mine: `ops`, `data-architect` |
| Own build | closed registry, consent gate, validator, tests | ours | free | | Only this is built |

## 7. Reports and proof

Reports: first letter (`f_onboarding_first_letter`, founder weekly); sign-in health; capture health (`mobile` weekly); reminder health (`product` fortnightly); surface read, impressed to tapped (`product` monthly); zero-target board (FR-DAT-09, on arrival). In the 1.0 line the numbers that exist are phone-side (consenters), Apple's and tester numbers; server counts wait for the FQ-01 ruling.

Tests [P], under the standard's validator (V1 to V16): `[IN-01] registry closed and matches IA`; `[IN-02] no event before consent` (0 sent, queued or written; the age gate sends 0 in every state, including No); `[IN-02] SDK autocapture off` (V16); `[IN-04] unknown name or property rejected` (V1 to V13); `[IN-11] canary` (an invented Asha string typed into every free field never appears in any payload, route param, log or fault record; V14); ASCII and no birthday-timed event. FR-DAT-01's own test changes from "analytics off in every profile" to "analytics off until a yes" with E-INSTR-1.

## 8. Conflicts, proposed changes, gate

- TRACKING_PLAN `screen_view.route` (29 routes) becomes `screen.<screen_id>.viewed`; `analytics` confirms.
- NS-01 names `media_added`, absent from catalog v8; it is `capture.media.saved`.
- Install to first letter cannot run on the phone without sending before consent.

> Proposed change E-INSTR-1: FR-DAT-01, D-095 and D-124 item 3 change from "no event sent in any 1.0.x build" to "nothing sent, queued or written before a yes"; `EXPO_PUBLIC_ANALYTICS` on in the production profile; the store label and App Privacy answers change in the same build (NS-38-R4). Founder decision; a D-### supersedes D-095 and D-124 item 3.
> Proposed change E-INSTR-2: extend `onboarding.summary.sent` with `first_sign_in_method`, `mic_primer_result`, `speech_pack_state` (all L2, closed, from stored state, sent only after a yes). TRACKING_PLAN section 2 already marks the summary Open for counsel. No locked PRD statement changes.
> Not proposed (PC-2): anonymous first-run counts without consent. It breaks LEGAL-REQ-003 and the label.

Gate, all founder or counsel: the D-### above; consent sheet wording with Shown, Records, Never and Decline lines (PRIV-R21); the label and App Privacy change; the host; counsel on E-INSTR-2. Withdrawal stops sends in the session, clears queues, calls `optOut()`, retires the id; account deletion calls `analytics-forget`.

## 9. Proposed backlog rows (IN-nn; BL ids from product)

Waves: 0 foundations, no sending; 1 events built, in the production release behind the consent gate; 2 founder and counsel switches.

| Id | Wave | Row | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-01 | 0 | Id registry (slugs and IA ids) plus the test against IA | analytics | S | #1033 on develop | no |
| IN-02 | 0 | No-event-before-consent and no-autocapture tests over first run and capture; update the FR-DAT-01 test | mobile | M | IN-01 | no |
| IN-03 | 0 | Tester-sheet rows for NS-39, 43, 44, 45 if rounds run; first-launch row on the NS-34 sheet | user-research | S | BL-929 | founder runs rounds |
| IN-04 | 1 | Typed `screen`, `ui`, `perf` helpers, dedupe, validator V1 to V16 | analytics | M | IN-01, #1042 | no |
| IN-05 | 1 | `screen.<screen_id>.viewed` from the router hook | mobile | M | IN-04 | no |
| IN-06 | 1 | Wire `capture.*` events and sheet taps; `capture.media.saved` behind the photos flag | mobile | M | IN-04 | no |
| IN-07 | 1 | Home impressions: prompt, slips, plus line | mobile | S | IN-04 | no |
| IN-08 | 1 | `notifications.*` wiring | mobile | S | IN-04 | no |
| IN-09 | 1 | `onboarding.summary.sent`, with E-INSTR-2 parts held until counsel | analytics | S | counsel | counsel |
| IN-10 | 1 | Perf markers (H1) and the three `perf.*.measured` events (confirm owner with `ops`) | mobile | M | NS-34 | `perf` build |
| IN-11 | 1 | Canary suite over every flow here | qa | M | IN-06 | no |
| IN-12 | 1 | Reporting view for server `onboarding.*` counts, only if FQ-01 is ruled in (supabase is founder-only) | data-architect | M | founder ruling | founder applies migration |
| IN-13 | 2 | Dashboards as code for section 7 | analytics | M | IN-05 to IN-08, host | host decision |
| IN-14 | 2 | Consent wording, label, D-### superseding D-095 and D-124, host and subprocessor entries, counsel read | product | S | IN-09, IN-11 | founder, counsel |

## For the CPO: decisions and risks

FLIPPED by the founder on 20 Nov ("build for production now so analytics is needed"): analytics ships in the production release behind the consent gate, replacing "dark, turned on later". Defaults (D1 to D9):
1. Record the flip as a D-### superseding D-095 and D-124 item 3, and E-INSTR-1 on FR-DAT-01 [yes; privacy rules unchanged: opt-in, off until a yes, no content].
2. Keep the consent sheet where it is, a later session after the first letter (NS-39, K-01)? Moving it first run would let the phone see the first-run funnel but adds an ask before the first letter [default: keep; first run rests on ASC, the summary and tester numbers].
3. Approve E-INSTR-2 for counsel's read [yes].
4. Count anything about the age question, even the number of No [nothing, ever; counsel Q46 and Q57 may differ].
5. Allow bucketed `perf.*.measured` for three metrics despite MEASUREMENT-PLAN "never in analytics" [yes; hand markers stay hand].
6. Impressions once per element per screen view; prompts by `prompt_kind` only; SDK touch autocapture banned [yes].
7. Host: founder and counsel decide. PostHog cloud free tier (1M events a month, no card) is a hosted third party that needs a subprocessor entry, data-map, privacy policy and label changes; self-host needs a machine that is not free [no default adopted; the cloud free tier is the candidate].
8. Not measured, by data-steward ruling FD-5: sensitive-data settings and choices, sensitive accept and decline counts, region refusals [unmeasured; listed here so it is a visible choice].
9. Read server aggregates (FQ-01, FR-DAT-28) now that analytics ships? [default: no until the founder rules; phone, Apple and tester numbers only].

Risks: survivorship (the device funnel starts after the first letter); consenter bias (about 40% assumed); small base means "x of n"; IA ids drift until #1033 merges and some screens are DESIGNED, not BUILT; #1042 may change after this edit; the `lang` value and counsel Q6 are unread; free-tier limits can change (UNVERIFIED beyond the page read); a flip needs the label and policy changed in the same build or the release breaks NS-38-R4.

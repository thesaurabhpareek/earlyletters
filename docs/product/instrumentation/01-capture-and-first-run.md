# Instrumentation requirements 1: capture and first run (NS-01, NS-04, NS-13 to NS-20, NS-38 to NS-45)

Status: PROPOSED, 20 Nov 2026 | Author: `product` (PM1) | Partner: `analytics`, file `docs/analytics/instrumentation/00-event-standard.md` and `analytics.md` (neither on develop or any branch when I wrote this; UNVERIFIED, so I follow the founder's baseline standard in `event-standard-brief.md`, rules 1 to 8, and will reconcile when it lands).
Tags: [V] read this session, file named. [P] proposed by me. No locked statement is changed; a change would sit in a "Proposed change" box naming the next erratum (E83, CL-158).
Founder rules applied: events named by the standard; only completely free open-source tools that fit Expo/React Native, Supabase and Vercel; analytics off through 1.0.x, everything dark.

## 0. The frame

1. Analytics is OFF through all of 1.0 (D-095, D-124 item 3, FR-DAT-01, `docs/product/prd/functions/data-and-measurement.md:138`): nothing sent, queued or written for us, no PostHog or Sentry client built, store label says no usage or diagnostics data. This file designs events DARK: compiled, tested, inert.
2. Every event is closed: enums, booleans, bucketed integers. No text on screen, no id of a person, book, letter, picture or media, no child name or date, no prompt text, no Find query, no typed day word [V `docs/engineering/readiness-20nov/performance/OBSERVABILITY-WITHOUT-CONTENT.md` section 2].
3. The first run cannot be seen on the phone. The consent sheet is a later session after the first letter (TRACKING_PLAN section 2, K-01; IA-FINAL section 10). Install to first letter therefore rests on App Store Connect (ASC), content-free server counts, a one-time summary and tester numbers (section 2).
4. Device numbers are "among consenting people" (assumed 40%, TRACKING_PLAN 1.2); never divide a device count by a server total (1.4).
5. Nothing here reaches a screen: no parent-facing count (FR-DAT-03), no in-app research question (FR-DAT-02), no streak, badge or gap count.
6. Small base: read-outs say "x of n", no percentage when n is under 20 (FR-DAT-08). Targets are PROPOSED unless a card already sets one; take a baseline first.

## 1. Naming, by the standard

Format `<area>.<object>.<action>`, snake_case ASCII, past tense, 3 segments. Areas used here: onboarding, capture, me, notifications, system (plus `screen`, `ui`, `perf` basics). Ids come from `docs/design/IA-FINAL-20nov.md` on branch `docs/design-ia-final-20nov` (PR #1033, not on develop) [V]:
- `screen_id` = IA screen id lowercased, hyphen to underscore: E-S03 is `e_s03`. State suffixes (`.default`, `.stop`) are not part of the id; they are not events.
- `element_id` (controls and surfaces) = `<screen_id>_<name>`, name ours, never on-screen words: `a_s01_speak`, `a_s01_slip_waiting_set`. One element has one id on both `.impressed` and `.tapped`, so impression to click is one pair.
- `ui.<element_id>.impressed` fires once per element per app session (dedupe). Autocapture is never used: PostHog's React Native SDK, if touch capture is on, "captures identifiers and text content by default" [V posthog.com/docs/libraries/react-native]. Touch capture, lifecycle capture, replay and geoip stay off; our hook sends the typed event.
- Old catalogue names (`packages/analytics`, 68 events, never shipped) map to new names in section 4; per rule 6 a rename is a new event, so `analytics` deprecates the old ones with a date.

## 2. Screens, controls, impressions

Events: `screen.<screen_id>.viewed`, `ui.<element_id>.tapped`, `ui.<element_id>.impressed`. Properties: none (the id is the content). Gate: consent (phone), after a yes. "Never" means no event at any time.

| Area / NS | Screen ids | Elements (`<screen_id>_` prefix; tapped unless marked I = also impressed) | Notes |
|---|---|---|---|
| NS-39 Launch, Welcome | e_s01, e_s02 | e_s02: `sign_in_apple`, `sign_in_email`, `terms_link`, `privacy_link` | Before consent: never emitted. Server and ASC carry it (section 3) |
| NS-40 Age gate | e_s03 | NONE, not even a count of No (the answer is never stored beyond a boolean, NS-40 4 and 11; "an under-18 answer is never sent", TRACKING_PLAN `auth_failed`) | Never |
| NS-40 Region refusal | e_s04 (refused-region) | none on the phone | Server daily count only (D-136) |
| NS-41 Sign in | e_s04, e_s05, e_s06, e_s14 | `apple`, `email`, `send_code`, `resend`, `change_email`, `use_link`, `start_on_phone` (outage fallback, D-160) | Mostly before consent; server counts are the truth |
| NS-42 Agreements | e_s07, c_s11 | `agree_and_continue`, `not_now`, `sensitive_accept`, `sensitive_keep_on_phone`, `documents_open`; I: `consent_sheet` | Records already exist server side (`policy_acceptances`); the tap is a ui event, never the record |
| NS-43 First book | e_s08 | `born`, `expecting`, `continue`, `add_another`, `twins` | Flags only, never name or date |
| NS-39 Mic primer | e_s29, a_s04 | `primer_continue`, `primer_not_now`; I: `mic_primer` | After consent; earlier state is in the one-time summary |
| NS-44 Gate | a_s13, e_s10, e_s11, e_s12 | `keep_gate_start_plus`, `keep_gate_keep_here`, `plan_open`; I: `keep_gate`, `plus_confirmed` | PM5 owns Plus events |
| NS-45 Account | c_s01, c_s02, c_s03, c_s19, c_s20, e_s16, e_s24 | `sign_out`, `stay_signed_in`, `delete_account_start`, `erase_everything_start`, `update_line_open`, `claim_book`; I: `update_line`, `claim_offer` | |
| Home (NS-13, 14, 19, 35) | a_s01 | `speak`, `type`, `start_from_photo` (dark), `not_much_today`, `another_thought`, `pick_it_up`, `whose_book`; I and tapped: `slip_waiting_set`, `slip_seal_opened`, `slip_day_today`, `slip_save_copy`, `slip_days_ask`, `slip_past_letter`; I only: `prompt`, `plus_line` | One slip at a time (IA 4.1); dismiss is `slip_<kind>_dismiss` |
| Whose book (NS-14) | a_s02 | `pick_child`, `close`; I: `whose_book_sheet` | |
| Listen, Write, Review | a_s04, a_s05, a_s07 | `start_recording`, `stop`, `type_instead`, `let_it_go`, `send_typed`, `keep`, `view_small_fixes`, `view_exactly_said`, `change_day`, `change_from`, `change_language`, `say_again`, `undo_all_edits` | |
| Day, From, Language sheets (NS-15, 16, 17) | a_s08, a_s09, a_s10 | `pick_day`, `pick_month`, `done`, `cancel`, `use_my_name`, `pick_name` (never the name), `type_the_words`, `keep_recording`; I: the three sheets | NS-16 and NS-17 dark in the store build |
| Reminders (NS-13) | d_s04, d_s05, d_s06, d_s07 | `ask_yes`, `ask_not_now`, `switch_on`, `switch_off`, `time_change`, `names_switch`, `preview_open`; I: `reminder_ask` | Delivered and opened are domain events (section 4) |
| Typed days (NS-18) | c_s24, d_s08, d_s09 | `add_a_day`, `remove_day`, `reminder_pointer`; I: `days_page`, `days_ask` | Never the day word. Dark with `EXPO_PUBLIC_DAYS` |
| NS-01 Photo | a_s01, a_s03, a_s07, b_s03, b_s04, b_s11 | `start_from_photo`, `photo_replace`, `photos_lens` | Dark (`EXPO_PUBLIC_PHOTOS`) |
| NS-04 Spike, NS-20 | none | none | No screen. NS-20 not built. Tester question only (NS-04 20) |

Impression to tap rates (consenters, "x of n"): each `slip_*` impressed to tapped; `a_s01_prompt` impressed to `capture.take.started` by `prompt_kind` (prompt text never sent); `d_s04_reminder_ask` to `d_s04_ask_yes`; `e_s10_keep_gate` to `keep_gate_start_plus`.

## 3. Funnels

Sources: P phone event after consent; S server content-free count (no person id, no consent needed); A ASC; T tester numbers by hand (FR-DAT-04 to 08); M run-sheet marker by hand.

| Funnel id | Ordered steps (event names; S, A, T where stated) | Limit |
|---|---|---|
| `f_onboarding_first_letter` | A first-time downloads > S `onboarding.account.created` > S `onboarding.terms.accepted` > S `onboarding.sensitive.accepted` or `onboarding.sensitive.declined` > S `onboarding.book.created` > S `onboarding.first_letter.synced` > P `onboarding.summary.recorded` (carries `time_to_first_letter`) | Steps before an account (launch, age) have no source by design. Letters kept only on the phone are invisible to S (TRACKING_PLAN 1.1) |
| `f_onboarding_sign_in` | `screen.e_s04.viewed` > `ui.e_s04_apple.tapped` or `ui.e_s04_email.tapped` > `onboarding.email.sent` > `onboarding.sign_in.succeeded` or `onboarding.sign_in.failed`; server twin: S `onboarding.sign_in.verified` per method (A-NFR-013, 97% weekly) | Phone half only after consent; in the account-first stack (Drop D) sign-in precedes consent, so S is the truth |
| `f_capture_save` | `ui.a_s01_speak.tapped` or `ui.a_s01_type.tapped` > `capture.take.started` > `capture.transcript.completed` > `capture.review.acted` > `capture.take.saved` (or `capture.take.discarded`) | Consenters only |
| `f_notifications_reminder_to_letter` | `ui.d_s04_reminder_ask.impressed` > `ui.d_s04_ask_yes.tapped` > `notifications.permission.answered` > `notifications.schedule.set` > `notifications.reminder.delivered` > `notifications.reminder.opened` > `capture.take.saved` (`from_notification_2h`) | Local reminders only (E79); delivered lags to next foreground |
| `f_capture_allowance` | `plus.allowance.reached` > `plus.gate.shown` > `plus.letter.held` or `plus.started` (PM5 names, cited not owned) | |
| `f_capture_sheet_use` | `ui.a_s08_day_sheet.impressed` > `ui.a_s08_done.tapped` > `capture.day.changed` (same for From and Language sheets) | NS-16, 17 dark |

Performance (events `perf.<metric>.measured`, one bucket property):

| Event | Budget (source) | 1.0 | Once on |
|---|---|---|---|
| `perf.cold_start.measured` | p50 1.2 s, p90 2.0 s (L-01) | M run sheet on SE 3, airplane mode too | P bucket; never on first install, so first launch stays M |
| `perf.warm_start.measured` | p50 400 ms (L-05) | M | P |
| `perf.save.measured` | commit p95 200 ms (C-02) | M marker `save_commit` | P bucket |
| `perf.speak_tap.measured` | p95 500 ms, 200 taps (C-01) | M video or marker | M only (too fine to bucket) |
| `perf.child_switch.measured` | p95 300 ms (L-08) | M | M only |
| crash-free sessions | 99.8% after release; zero unresolved signatures over 500 sessions before (FR-DAT-16) | Apple Organizer and ASC | same; crash tool is PM5 and `ops` |
| sign-in success | 97% weekly (A-NFR-013) | S | S |

Conflict: MEASUREMENT-PLAN section 4 says markers are "never in analytics", while the founder asks for performance in analytics and `app_cold_start` is already in the catalogue. Proposal: bucketed `perf.*.measured` for start and save only, after consent; markers with finer numbers stay by hand (CPO decision 5).

## 4. Event registry rows for this area

One definition per event (rule 7). Columns: name; trigger; properties (type: allowed values); class; owner; gate; status; requirement. Class is L2 for every row (TRACKING_PLAN section 0). Status is `proposed` for all. Owner is the emitting agent role. Gate `consent` = after a yes, phone, not before; `aggregate` = server count, no person id, no consent, content-free (all sides still dark in 1.0 only for the phone; server counts already exist as logs).
Buckets: `count_bucket` = 0 | 1 | 2_4 | 5_9 | 10_plus. `audio_bucket` = lt_15s | 15_60s | 1_2m | 2_5m | gt_5m. `words_bucket` = lt_25 | 25_99 | 100_299 | 300_plus. `child_ordinal` = first | second | third_plus. `member_role` = parent | contributor. `mode` = spoken | typed | mixed. Every row also has `schema_version` (int).

| Name | Trigger | Properties | Owner | Gate | Req | Replaces catalogue name |
|---|---|---|---|---|---|---|
| `screen.<screen_id>.viewed` | A screen in section 2 shown | none | mobile | consent | NS-39 to 45, 13 to 19; IA | `screen_view` |
| `ui.<element_id>.tapped` / `.impressed` | A control tapped or surface first shown this session | none | mobile | consent | as above | none |
| `perf.<metric>.measured` | Section 3 table | `bucket` (enum per metric) | mobile | consent | NS-34, L-01, L-05, C-02 | `app_cold_start` |
| `capture.take.started` | Speak or type begins | `mode`, `source` (home \| notification \| doorway \| resurface), `prompt_kind` (opening \| gap \| hard \| family \| together \| none), `child_ordinal`, `member_role` | mobile | consent | NS-35, 13 | `capture_started` |
| `capture.take.discarded` | Take thrown away | `mode`, `stage` (listening \| review), `audio_bucket`? | mobile | consent | NS-09 | `capture_discarded` |
| `capture.transcript.completed` | Spoken take transcribed or refused | `engine` (on_device \| server), `audio_bucket`, `latency_bucket` (lt_5s \| 5_15s \| 15_30s \| 30_60s \| gt_60s), `outcome` (ok \| no_speech \| failed \| queued_for_model) | mobile | consent | NFR-7.7 | `transcription_completed` |
| `capture.review.acted` | Action on Review | `action` (show_exactly_said \| edit_text \| say_again \| play_back \| change_child \| change_destination \| undo_all_edits) | mobile | consent | NS-14, 15 | `review_action` |
| `capture.take.saved` | Letter kept | `mode`, `destination` (book \| private), `child_ordinal`, `member_role`, `prompt_kind`, `audio_bucket`?, `words_bucket`, `edit_count_bucket` (0 \| 1_2 \| 3_9 \| 10_plus), `reverted_count_bucket` (same), `engine` (on_device \| server \| none \| pending), `from_notification_2h` (bool) | mobile | consent | NS-13, NS-44 | `letter_saved` (raw counts to buckets) |
| `capture.edit.reverted` | One machine edit undone | `edit_type` (core EditType), `source` (rule \| model) | mobile | consent | constitution | `machine_edit_reverted` |
| `capture.edit.rejected` | Verifier refused edits | `edit_type`, `source`, `reason` (core RejectReason), `count_bucket` | mobile | consent | constitution | `machine_edit_rejected` |
| `capture.media.added` | A picture joins a letter | `source` (photo_first \| review \| letter_page), `kind` (photo) | mobile | consent | NS-01 (`NX-39-R34`) | none; not in catalog v8 |
| `capture.day.changed` | Day or month set on a letter | `granularity` (day \| month) | mobile | consent | NS-15 | none |
| `capture.author.changed` | From set to another speaker | `kind` (self \| other) | mobile | consent | NS-16 | none |
| `capture.child.switched` | Active book changed | `child_ordinal`, `surface` (home \| book \| review) | mobile | consent | NS-14 | `child_switched` |
| `me.language.changed` | Spoken language added, removed, made primary | `lang` (en \| hi \| es \| zh \| fr \| ar \| pt), `action` (added \| removed \| made_primary) | mobile | consent | NS-17 | `language_set` |
| `me.session.ended` | Session ended on this phone | `reason` (user \| apple_revoked \| switch_account \| session_lost) | mobile | consent | NS-45 | `signed_out` |
| `me.setting.changed` | A person-level setting changed | `key` (reminders \| lock_screen_names \| languages \| sensitive_data \| ...) | mobile | consent | NS-13 | `settings_changed` |
| `notifications.permission.answered` | OS permission answered | `granted` (bool), `platform` (ios \| android) | mobile | consent | NS-13 | `os_permission_result` |
| `notifications.schedule.set` | Cadence, time or pause saved | `cadence` (off \| weekly \| few_times \| every_evening), `hour_bucket` (morning \| afternoon \| evening \| late_evening), `paused` (bool) | mobile | consent | NS-13 | `reminder_schedule_set` |
| `notifications.reminder.delivered` | Local reminder fired (logged on next foreground) | `type` (letter_reminder \| family_digest) | mobile | consent | NS-13, NS-32 | `reminder_sent`. Month-age and birthday notes excluded (E82) |
| `notifications.reminder.suppressed` | Reminder skipped | `reason` (wrote_recently \| quiet_window \| weekly_cap \| paused) | mobile | consent | NS-13 | `reminder_suppressed` |
| `notifications.reminder.opened` | App opened from a reminder | `type` (letter_reminder \| family_digest) | mobile | consent | NS-13 | `notification_opened` |
| `system.consent.granted` | Person says yes to analytics | `surface` (consent_sheet \| settings) | mobile | consent (itself) | LEGAL-REQ-003 | part of `analytics_opted_in` |
| `onboarding.summary.recorded` | Right after consent: one-time first-run facts the phone already holds | `days_since_install` (d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus), `letters_bucket`, `signed_in` (bool), `first_letter_mode` (spoken \| typed \| mixed \| none), `time_to_first_letter` (lt_90s \| 90s_5m \| 5_30m \| 30m_24h \| gt_24h \| unknown), `came_from_invite` (bool); PC-1 adds `first_sign_in_method`, `mic_primer_result`, `sensitive_data_choice`, `speech_pack_state` | mobile | consent; counsel read pending | K-01 | rest of `analytics_opted_in` |
| `onboarding.sign_in.succeeded` | Session exists | `method` (apple \| email), `had_local_data` (bool) | mobile | consent | A-NFR-013 | `auth_succeeded` |
| `onboarding.sign_in.failed` | Sign-in failed or cancelled | `method`, `reason` (cancelled \| network \| expired \| wrong_code \| code_paused \| rate_limited \| invalid_email \| not_available \| provider \| session_expired \| consent_unavailable \| unknown) | mobile | consent | NS-41 | `auth_failed` |
| `onboarding.email.sent` | Sign-in email or code sent | `attempt_bucket` (1 \| 2_3 \| 4_plus) | mobile | consent | NS-41 | `auth_email_sent` |
| `onboarding.sign_in.deferred` | Later chosen on the sheet | `trigger` (first_letter \| sign_in \| settings) | mobile | consent | NS-41 | `auth_deferred` |
| `onboarding.account.created` | New account (server) | none | data-architect | aggregate | NS-41 | none |
| `onboarding.sign_in.verified` | Sign-in success (server, Auth logs) | `method` (apple \| email) | data-architect | aggregate | A-NFR-013 | none |
| `onboarding.terms.accepted` | Terms row written (server) | none | data-architect | aggregate | NS-42 21 | none |
| `onboarding.sensitive.accepted` / `.declined` | Sensitive-data choice recorded (server) | none | data-architect | aggregate | NS-42 21 | none |
| `onboarding.book.created` | First book row (server) | none | data-architect | aggregate | NS-43 | none |
| `onboarding.first_letter.synced` | First synced letter (server) | none | data-architect | aggregate | NS-44; TRACKING_PLAN 1.2 | none |
| `onboarding.region.refused` | Sign-up refused (server hook) | country code in the daily count table only, not an event property | data-architect | aggregate | NS-40, D-136 | none |
| `system.error.shown` | User-facing error shown | `code` (save_failed \| mic_denied \| transcription_failed \| offline \| storage_low \| generic) | mobile | consent | NS-39, 44 | `error_shown` |
| `system.pack.download_started` / `.downloaded` / `.download_failed` / `.removed` | Pack or model download state | `pack` (analytics pack id), `lang`?, `network` (wifi \| cellular \| none \| unknown), `failure`? (no_space \| hash_mismatch \| offline \| needs_app_update \| download_failed \| cancelled \| storage_error) | mobile | consent | NS-17 | `pack_download` |

Never an event: the age answer, any country question, any text a person typed or said, any id of a person, book, letter or media, a prompt text, a notification at a birthday-set time.

## 5. The journey, step by step

Each cell names events only. Readers: founder weekly, `product`, `mobile`. Gate for all: section 8.

| Step | Question | Measure | NOT measured, why | Target (PROPOSED unless cited) | Guardrail (zero) | Observability |
|---|---|---|---|---|---|---|
| NS-38 Store page | Does the page bring openers? | A: product page views, first-time downloads | Anything in the app | Baseline | Listing claims the build lacks = 0 (NS-38-R2) | ASC |
| NS-39 First launch | Quick, nothing surprising? | T: "did anything ask for something you did not expect", "did the speech download start without your tap" (NS-39 21); `perf.cold_start.measured` by M | Launch events: nothing runs before consent | p50 1.2 s (L-01) | Speech download without a tap = 0 | Fault-log codes on phone, never sent in 1.0 |
| NS-40 Age and region | Do adults get stuck? Does the region check run? | S `onboarding.region.refused` daily count; support tally | Age answer, any No, IP, country question (D-026, D-137) | Baseline | Under-18 answer sent anywhere = 0 | Hook error classes in server logs |
| NS-41 Sign in | Does it work first time by method? | S `onboarding.sign_in.verified`; P `onboarding.sign_in.failed` reasons; T "did the email arrive within a minute" | Email, relay address, provider id | 97% weekly (A-NFR-013) | Account with no Terms row = 0 | `reason` enum above |
| NS-42 Agreements | Do people finish them? | S `onboarding.terms.accepted`, `onboarding.sensitive.accepted/declined`; support tally | Per-person acceptance | Baseline | Pre-ticked box, bundled consent = 0 (NS-42 12) | `consent_unavailable` |
| NS-43 First book | Does setup feel short? | T "how long did setting up feel", "anything asked you did not want to give" (NS-43 21); S `onboarding.book.created` | Name, signs-as, dates, expecting (consumer health data), languages | Baseline | Fields beyond NS-43 11 = 0 | Server `22023` class |
| NS-44 First letter | How long to first kept letter; did Plus show early? | T under 2 min / 2 to 5 / longer; Plus-before-third question (NS-44 21); P `onboarding.summary.recorded`; A paid starts over downloads | The letter, any count shown to a parent (FR-DAT-03) | Median 90 s or less (B F1 R1) | Plus before third Keep = 0; recording blocked = 0 | `system.error.shown` (`mic_denied`, `save_failed`) |
| NS-45 Account life | Mistaken sign-out or delete? | S deletion requests and cancels per week (NS-45 21); T "after signing out did letters stay" | Why they left | Baseline | Letters gone after sign-out = 0; "deleted by mistake" = Severity 1 (FR-DAT-09) | `me.session.ended` |
| Start (NS-35) | Do people start from Home and with what? | `capture.take.started` | Prompt text, child | Baseline | Start from anywhere but Home or an allow-listed doorway = 0 | CI kill harness (C-06, C-07) |
| Speak or type | Where do people give up? | `capture.take.discarded`, `capture.transcript.completed` | Audio, transcript | Baseline | Recording lost = 0 (FR-DAT-09) | `system.error.shown` |
| Review (fidelity) | Do fixes help or get undone? | `capture.edit.reverted`, `capture.edit.rejected`, `capture.review.acted` | Edit text, span | Under 5% reverted, a type over 10% reviewed (TRACKING_PLAN 1.3); in 1.0 FR-DAT-32 says use Q-FID-1 | A word added that was not said = 0 | RejectReason enum |
| Keep | Are letters kept? | `capture.take.saved`; S weekly keeping families | Words, length | WKF is the north star | Letter in wrong book = 0 (NS-14) | `perf.save.measured` |
| NS-13 Reminders | Do they help, then step back? | `f_notifications_reminder_to_letter`; `notifications.reminder.suppressed` | Minute-level time, any age or month (E82) | 12% within 2 h; paused or off 10% or less (C section 9), not measurable in 1.0 (FR-DAT-32); T questions (NS-13 21) | Too many notifications = Severity 1; over 1 a day or 60 pending (NS-32) = 0 | `schedule_failed`, `budget_full` phone codes |
| NS-14 Whose book | Right book? | `capture.child.switched`; T "letter in the wrong book this month" | Which child | Switch p95 300 ms (L-08) | Wrong-book report = 0 | M |
| NS-15 Another day | Is it used? | `capture.day.changed`; T (NS-15 21) | The date | Baseline | none | none |
| NS-16 Someone else speaks | Used, understood? | `capture.author.changed`; T (NS-16 21) | Any name | Dark until counsel Q45, Q46, Q48, Q54 and the `child-input` flag | Child's voice captured without the gate = 0 | none |
| NS-17 Language | Does the pack work? | `me.language.changed`, `system.pack.*`; reviewer corpus; T "words match what you said" | Words | Pack failure under 2% of starts | `not_vetted_for_language` rising = review | `failure` enum |
| NS-18 Typed days | Do people add a day? | `ui.c_s24_add_a_day.tapped`; T (NS-18 21) | Day word, date, religion, ethnicity, region (never in analytics) | Dark; baseline | Day word in a payload = 0 | none |
| NS-19 Add more | Are waiting drafts picked up? | `ui.a_s01_slip_waiting_set.impressed` to `ui.a_s01_pick_it_up.tapped` | The draft | Baseline | Recorded then lost = 0 | CI DL-01, DL-02 |
| NS-01 Photo | Start a letter from a picture? | `capture.media.added`; T five-parent study (NS-01 21) | Pictures per letter, size, file, place (OBS section 2 item 3; NS-52-R43) | 4 of 5 start unaided; 0 of 5 say it felt like a second start (cited) | Any media id or per-letter count in a payload = 0 | `pick_cancelled`, `decode_failed` phone codes |
| NS-04 Spike | Does a doorway start a letter unlocked? | None; findings file; T (NS-04 20) | Everything | GO or NO-GO | Doorway that records on its own = 0 | none |
| NS-20 Two books | n/a | n/a, not built | n/a | n/a | n/a | n/a |

## 6. Free open-source tools, checked

Founder rule: completely free and fitting Expo, Supabase, Vercel; self-host or a documented free tier. Facts [V] read 20 Nov at the page named.

| Need | Option | Licence | Cost | Data held | Decision |
|---|---|---|---|---|---|
| Events, funnels, dashboards | PostHog | MIT "except the `ee` directory" [V github.com/PostHog/posthog] | Cloud free tier: "first 1M events free, every month", no card [V posthog.com/pricing]. Self-hosting is supported "hobby deploy", about 100k events a month, no support [V github page]; it needs a machine, and a machine is not free (Vercel and Supabase do not run it): UNVERIFIED free host | Closed events only, random per-consent id, no person profile | Adopt; cloud free tier is the default because it needs no server. Founder note: it is a hosted vendor, not self-hosted. `analytics` decides |
| Phone SDK | `posthog-react-native` | UNVERIFIED | free | as above | Adopt with touch capture, lifecycle capture, replay, geoip off; session replay off by default [V]; `defaultOptIn` false until consent [V] |
| Server counts | Supabase Auth logs and Postgres views | existing stack | free tier (limits UNVERIFIED here, Q-06 in NFR-BUDGETS cites 500 MB database, 5 GB egress) | Aggregates | Adopt; no new tool |
| Crashes, BI, traces | Sentry or GlitchTip, Metabase, Grafana | UNVERIFIED | UNVERIFIED | | Not mine: `ops`, `data-architect`. Nothing paid |
| Own build | the closed registry, consent gate, validator, tests | ours | free | | Only this is built |

## 7. Reports and proof

Reports: first letter (`f_onboarding_first_letter`, founder weekly); sign-in health (`f_onboarding_sign_in`, founder weekly); capture health (`f_capture_save`, `mobile` weekly); reminder health (`product` fortnightly); surface read (impressed to tapped, `product` monthly); zero-target board (FR-DAT-09, on arrival). In 1.0 only S, A and T rows are filled.

Tests [P]: `[IN-01] registry closed and matches IA` (unknown screen or element id fails to compile; the registry equals the IA tables); `[IN-02] nothing sent in a 1.0.x profile` (0 requests, no client built, every `eas.json` profile, FR-DAT-01); `[IN-02] no event before consent` (0 sent, queued or written; the age gate sends 0 in every state); `[IN-02] SDK autocapture off`; `[IN-04] validator rejects names not in the registry and properties not on the allowlist`; `[IN-11] canary` (an invented Asha string typed into every free field never appears in any payload, route param, log or fault record, OBS R4 and R5); ASCII and no birthday-timed event.

## 8. Conflicts, proposed changes, gate

- TRACKING_PLAN `screen_view.route` (29 routes) becomes `screen.<screen_id>.viewed`; `analytics` confirms.
- NS-01 names `capture.media.added` (as `media_added`), absent from catalog v8.
- The founder's install-to-first-letter funnel cannot run on the phone without sending before consent.

> Proposed change PC-1 (erratum E83 only at turn-on): extend `onboarding.summary.recorded` with `first_sign_in_method` (apple, email, none), `mic_primer_result` (granted, denied, not_asked), `sensitive_data_choice` (accept, keep_on_phone, not_asked), `speech_pack_state` (none, downloading, ready). L2, closed, taken from stored state, sent only after a yes. TRACKING_PLAN section 2 already marks the summary Open for counsel. No locked PRD statement changes while analytics is dark.
> Proposed change PC-2 (NOT proposed): anonymous first-run counts without consent. It breaks D-095, LEGAL-REQ-003 and the label (NS-38-R4).

Gate: Wave 0 ships in 1.0 and sends nothing. Turn-on needs, in order: counsel on PC-1; consent sheet wording with Shown, Records, Never and Decline lines (PRIV-R21); the label change in the same build (NS-38-R4); the founder's flip of `EXPO_PUBLIC_ANALYTICS`; a D-### superseding D-095 and D-124 item 3. Withdrawal stops sends in the session, clears queues, calls `optOut()`, retires the id.

## 9. Proposed backlog rows (IN-nn; BL ids from product)

| Id | Wave | Row | Owner | Size | Depends on | Founder hands |
|---|---|---|---|---|---|---|
| IN-01 | 0 | Registry of screen and element ids from IA plus the test against IA | analytics | S | #1033 on develop | no |
| IN-02 | 0 | No-send, no-before-consent and no-autocapture tests over first run and capture | mobile | M | none | no |
| IN-03 | 0 | Tester-sheet and question-bank rows for NS-39, 43, 44, 45; first-launch row on the NS-34 sheet | user-research | S | BL-929 | founder runs rounds |
| IN-04 | 1 | Typed `screen`, `ui`, `perf` helpers, once-per-session dedupe, validator | analytics | M | IN-01, 00-event-standard | no |
| IN-05 | 1 | `screen.<screen_id>.viewed` from the router hook | mobile | M | IN-04 | no |
| IN-06 | 1 | Wire `capture.*` events and sheet taps; `capture.media.added` behind the photos flag | mobile | M | IN-04 | no |
| IN-07 | 1 | Home impressions: prompt, slips, plus line | mobile | S | IN-04 | no |
| IN-08 | 1 | `notifications.*` funnel wiring | mobile | S | IN-04 | no |
| IN-09 | 1 | `onboarding.summary.recorded` with PC-1, built inert | analytics | S | counsel | counsel |
| IN-10 | 1 | Perf markers H1 and `perf.*.measured` for start and save (confirm owner with `ops`) | mobile | M | NS-34 | `perf` build |
| IN-11 | 1 | Canary suite over every flow here | qa | M | IN-06 | no |
| IN-12 | 1 | Reporting view for the server `onboarding.*` counts (proposal; supabase is founder-only) | data-architect | M | partner file | founder applies migration |
| IN-13 | 2 | Dashboards as code for section 7 | analytics | M | IN-05 to IN-08 | host decision |
| IN-14 | 2 | Turn-on: consent wording, label, D-### , counsel read | product | S | IN-09, IN-11 | founder, counsel |

## For the CPO: decisions and risks

Decisions (default in brackets):
1. Accept that install to first letter is not visible on the phone and rests on ASC, server counts, the summary and tester numbers [yes; PC-2 would break D-095 and the label].
2. Approve PC-1 for counsel's read [yes, built inert].
3. Count anything about the age question, even the number of No [nothing, ever; counsel Q46 and Q57 may differ].
4. Ban SDK touch autocapture for good [yes].
5. Allow bucketed `perf.cold_start`, `warm_start`, `save` events after consent despite MEASUREMENT-PLAN "never in analytics" [yes; finer numbers stay by hand].
6. Impressions once per element per session; prompts by `prompt_kind` only [yes].
7. PostHog host: cloud free tier (1M events a month, no card) versus self-host on a machine we would have to pay for [cloud free tier; this is a hosted third party, so the label and counsel read still apply].
8. Order: dark build in the first release after 1.0, turn-on only with the consent sheet [yes].

Risks: survivorship (device funnel starts after first letter); consenter bias (about 40% assumed); small tester base, so reads are "x of n"; IA ids drift until #1033 merges and some screens are DESIGNED, not BUILT; the standard and partner file have not landed, so names may change; free-tier limits can change (UNVERIFIED beyond the page read); impressions inflate volume without dedupe.

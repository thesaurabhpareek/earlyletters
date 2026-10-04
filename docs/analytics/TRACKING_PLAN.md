# Tracking plan

Owner: analytics engineer. Status: Draft 2, 3 Oct 2026, for founder, PM and privacy counsel review.
Code: `packages/analytics` (the catalogue in `src/catalog.ts` is the source of truth). Section 3.1 is generated from it by `npm run plan -w @scribe/analytics`; a test fails if the two drift apart.
Inputs: founder decisions of 3 Oct 2026 (`docs/agents/BRIEF-2026-10-03.md`: 3 Apple-only Plus, 5 co-parent only, 6 seven languages, 11 privacy, 12 analytics, 15 packs), PRD.md (K-01, PRD-REQ-016 to 018, sections 6.9, 7.7, 7.8, 7.10), PRD A section 10, B-NFR-001, C-REQ-034 and C section 9, ADR 0008, ADR 0013, ADR 0015, LEGAL-REQ-003, 012, 014, 015, 017, `analyticsConsent.*` in `strings.en.ts`, CLAUDE.md privacy rules.

Labels used below: **Fact** (from a repo document or code), **Assumption** (A, to be replaced by real cohorts), **Decision** (made here, reviewable), **Open** (needs an owner).

---

## 0. What this plan promises

1. **Opt-in only.** No event is sent, queued in memory or written to disk before the person says yes on the consent sheet or in Settings > Privacy (LEGAL-REQ-003, PRD 6.9). Before a yes the PostHog SDK is not even loaded (`createLazyPostHogAdapter`). Declining changes nothing. Withdrawing stops sending within the session, clears our queue and the SDK's, calls `optOut()` and retires the analytics id (PRD-REQ-018).
2. **Content-free.** Enums, booleans and bounded integers only. No letter text, transcripts, audio, photos, dictionary terms, child or family names, signatures, birthdays or due dates, emails, ids from our database, file names or URLs. Children appear only as `child_ordinal` (`first`, `second`, `third_plus`) or `child_count_bucket`. A language appears only as one of seven ISO codes on the two `languages` events (6.2).
3. **Every property is L2** (PRD 7.10 item 9). L3 and L4 values cannot be expressed in the schema.
4. **Random analytics id.** A fresh random UUID per consent period; never the email, the Supabase user id, a device id or the App Store `appAccountToken`. No PostHog person properties. Nothing on any server of ours stores or joins the id (TDD 05 X-02: deletion goes through the stateless `analytics-forget`).
5. **No tracking in Apple's sense** (section 10). No data from other companies, no advertising, no data brokers, no IDFA, no App Tracking Transparency prompt. The privacy label has no "Data Used to Track You" section.
6. **Business totals do not depend on consent.** Families, books, letters, invites and retention come from k-anonymised server aggregates (section 4). Money comes from App Store Connect, because purchases are Apple's alone (founder decision 3). Device analytics explain behaviour inside the product; they never set a headline number on their own.

---

## 1. Metrics

### 1.1 North-star metric

**Weekly keeping families (WKF):** the number of families with at least one letter added in the last 7 days (any author, any destination). A family is the set of books that share a parent (co-parents are one family).

- Why this one: it measures the value the product exists for (letters kept for a child), it rises when a co-parent joins, and it cannot be gamed by opens, notifications or paywall views. It is internal only and never shown to users as a streak or count (C-REQ-015).
- Source: `insights.weekly_keeping_families` (section 4). Device events are not used.
- Blind spot (Fact): letters kept only on the phone (no account, or sensitive-data consent declined) are invisible to the server. Report WKF together with the share of first-letter users who have synced (stage 2 below).
- Companion numbers: letters per active family (mean, p50, p90); share of active families with two or more voices.

### 1.2 Funnel and retention

Source codes: **S** server aggregate (all synced users, k-anonymised), **ASC** App Store Connect (installs, trials, conversions, renewals, refunds; all users), **D** device analytics (consenting users only, assumed 40%, PRD 7.8).

| # | Stage | Metric and definition | Primary source | Device events used | Target (A unless noted) | Serves |
|---|---|---|---|---|---|---|
| 1 | Activation: first letter | Share of new accounts with a first letter within 1, 7 and 30 days; median time from first launch to first saved letter | S `first_letter_conversion`; ASC installs; D `analytics_opted_in.time_to_first_letter` | `analytics_opted_in` | Median first letter 90 s or less (B F1, R1) | PRD-REQ-016 |
| 2 | Keep the book | Share of first-letter users with an account by day 7 | S (accounts with 1 or more letters) over D/ASC | `auth_sheet_shown`, `auth_succeeded`, `auth_deferred`, `local_merge_choice` | 50% or more (A Q2 threshold) | PRD-REQ-001, A-NFR-013 |
| 3 | Activated writer | Letters saved in 2 or more different weeks within 4 weeks of the first letter | S `retention_cohorts` | `letter_saved`, `capture_started` | Set after first cohorts | PRD-REQ-016 |
| 4 | Weekly letters | Letters per active family per week; spoken versus typed; book versus private | S `weekly_keeping_families`, `letters_per_active_family`; D for `prompt_kind`, `from_notification_2h`, edit counts | `letter_saved`, `transcription_completed` | Set after first cohorts | C-REQ-034 |
| 5 | Co-parent | Co-parent invites sent and accepted within 7 days; families with two voices | S `family_invites`, `letters_per_active_family`; D for channel | `invite_created`, `invite_accepted`, `invite_failed` | Set after first cohorts | B-REQ-007 |
| 6 | Languages | Families by spoken-letter language; pack download success and failure by pack | S `language_mix` (once a server language column exists); D | `language_set`, `pack_download` | Pack failure under 2% of starts (Decision) | B-REQ-003, decision 15 |
| 7 | Read together | Share of monthly active parents who start Read together; finish rate; tries used before an offer | D only | `read_together_started`, `read_together_ended`, `read_together_try_used` | Set after first cohorts | C-REQ-034 |
| 8 | Trial to paid | Offer views to purchases (D); trials, trial to paid, annual share, refunds (ASC) | ASC for money; D for offer views | `plus_offer_viewed`, `plus_offer_closed`, `plan_changed` | Trial to paid 40% or more; annual 60% or more; refunds under 3% (C section 9) | C-REQ-034, C-REQ-023 |
| 9 | Retention | Active writers at week 4 and week 26 of their first-letter cohort | S `retention_cohorts` | `app_opened`, `letter_saved`, `book_opened` | Week 4: 35% or more; month 6: 20% or more (C section 9) | PRD-REQ-016 |

### 1.3 Guardrails

| Guardrail | Definition | Source | Threshold (A) |
|---|---|---|---|
| Reminder fatigue | Reminders paused or turned off per month | D `reminder_schedule_set{cadence: off}` or `{paused: true}` | 10% or less (C section 9) |
| Reminder usefulness | Letters saved within 2 hours of opening from a reminder | D `letter_saved.from_notification_2h` / `notification_opened{type: letter_reminder}` | 12% or more (C section 9) |
| Fidelity (constitution) | Machine edits reverted / machine edits applied, by `edit_type` and `source` | D `machine_edit_reverted`, `letter_saved.machine_edit_count` | Under 5% overall; any edit type over 10% is reviewed (Decision) |
| Verifier refusals | Rejected edits by `reason`; `not_vetted_for_language` share | D `machine_edit_rejected` | Watch weekly; a rising `not_vetted_for_language` means a pack needs sign-off |
| Capture friction | Discarded captures / started captures; `no_speech` and `failed` transcriptions | D `capture_discarded`, `transcription_completed.outcome` | Watch weekly |
| Pack health | Failed pack downloads / started, by `pack` and `failure` | D `pack_download` | Under 2% (Decision) |
| Errors | `error_shown` per 100 sessions, by `code`; `sync_failed` by reason | D | Watch weekly |
| Paywall respect | Offers shown outside C-REQ-023 triggers | D `plus_offer_viewed.trigger` | Zero |
| Consent cost | No feature difference by consent | QA, LEGAL-REQ-003 | Zero |

### 1.4 Reading device numbers honestly

- Device rates are **among consenting users**. Consenters are likely more engaged than decliners, so device funnels look better than reality. Always label them; never divide a device count by a server total.
- To size the bias without linking identities: the server knows which signed-in accounts accepted the `analytics` document (`policy_acceptances`). Compute server metrics split by consent status in a reviewed query. No analytics id is involved.
- Server aggregates are k-anonymised in the database (no published cell between 1 and 9, section 4). Never export per-user server rows into PostHog or anywhere else.

---

## 2. What cannot be measured on the device, by design

| Gap | Why | What we use instead |
|---|---|---|
| First run (age gate, child setup, first letter) | The consent sheet is the third ask, in a later session after the first letter (K-01, PRD-REQ-001). First-run events can never be sent, and we do not queue them. | `analytics_opted_in` carries a one-time summary built from product state the app already keeps (install day, letters count, first-letter mode and timing, signed in, role, came from invite). **Open:** counsel to confirm this summary is acceptable under LEGAL-REQ-003. If not, drop those properties and rely on ASC and server counts. |
| Decline rate of the consent sheet | A "declined" event would itself be sent without consent | Server: share of signed-in accounts with an `analytics` acceptance |
| Billing lifecycle (renewals, conversions, cancellations, refunds, billing issues, lapse) | Purchases are Apple's alone (founder decision 3, ADR 0013): no server of ours sees them, and RevenueCat is not used. The device sees only its own StoreKit state. | App Store Connect Sales and Trends and subscription reports (founder or coordinator exports them monthly). On device, `plan_changed` gives a consenting-sample view only. The C-REQ-034 names `trial_notice_sent`, `trial_converted`, `trial_cancelled`, `renewal`, `billing_issue`, `plus_lapsed`, `refund_detected` are **retired**: there is no source for them. |
| Pricing test arms (C section 8) | Needs a join of offer views to conversions per arm, which needs either a server purchase ledger or linking ids. Neither exists. | Premature for v1 (TDD 08). If revived, Apple's own offer codes or a Product Page Optimization test in ASC. `plus_offer_viewed.arm` removed. |
| Safety tiers | Must stay on the device (LEGAL-REQ-015, K-06) | Nothing |
| Anything timed by a child's birthday or due date | The event timestamp would reveal an L4 date (6.4) | Nothing. Excluded: month-age notes, birthday notes, month-chapter and Year One moments |
| A letter's language next to letter behaviour | Would tie an L4 attribute to letter activity (6.2) | `language_mix` server view, families only, k-anonymised |

---

## 3. Event catalogue

### 3.1 Events by area

<!-- catalogue:begin (generated from packages/analytics/src/catalog.ts by `npm run plan -w @scribe/analytics`; do not edit by hand) -->
66 events. Every event also carries the global properties in 3.2. `?` marks an optional property. Every event and property is L2.

#### app

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `app_cold_start` | First frame after a cold start (only once consent exists, so never on first install) | `ttfi_bucket` (enum: lt_1s \| 1_2s \| 2_3s \| gt_3s) | A-NFR-001, PRD-REQ-016 |
| `app_opened` | App comes to the foreground after 30 min or more away, or cold starts | `source` (enum: cold \| warm \| notification \| link)<br>`days_since_last_open` (enum: d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus) | PRD-REQ-016 |
| `app_backgrounded` | App goes to the background; carries the session length bucket | `session_bucket` (enum: lt_1m \| 1_5m \| 5_15m \| gt_15m) | PRD-REQ-016 |
| `screen_view` | A route is shown. Sent by our router hook from the route template, never by SDK autocapture | `route` (enum: tonight \| book \| family \| listen \| write \| review \| letter_detail \| onboarding \| read_together \| sign_in \| sign_in_email \| sign_in_code \| sign_in_verify \| sign_in_consent \| invite \| invite_new \| settings \| settings_account \| settings_appearance \| settings_reminders \| settings_recordings \| settings_child_detail \| settings_child_new \| settings_privacy \| settings_export \| settings_language \| settings_plus \| settings_storage \| settings_delete_account) | ADR-0008, PRD-REQ-016 |

#### consent

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `analytics_opted_in` | Immediately after the user says yes. Carries a one-time summary of first-run facts the app already stores, because first-run events can never be sent (K-01) | `surface` (enum: consent_sheet \| settings)<br>`days_since_install` (enum: d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus)<br>`signed_in` (bool)<br>`member_role` (enum: parent \| contributor)<br>`first_letter_mode` (enum: spoken \| typed \| mixed \| none)<br>`time_to_first_letter` (enum: lt_90s \| 90s_5m \| 5_30m \| 30m_24h \| gt_24h \| unknown)<br>`came_from_invite` (bool) | PRD-REQ-016, K-01 |

#### entry

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `auth_sheet_shown` | Keep the book / sign-in sheet shown | `trigger` (enum: first_letter \| invite \| invite_create \| sign_in \| settings) | PRD-REQ-001, PRD-REQ-016 |
| `auth_method_selected` | A sign-in method tapped (observed from the auth state) | `method` (enum: apple \| google \| email \| passkey) | PRD-REQ-016 |
| `auth_succeeded` | A new session exists on this phone (observed from the auth state). New accounts are counted on the server | `method` (enum: apple \| google \| email \| passkey)<br>`had_local_data` (bool) | A-NFR-013, PRD-REQ-016 |
| `auth_failed` | Sign-in failed or was cancelled (observed). An under-18 answer is never sent | `method` (enum: apple \| google \| email \| passkey)<br>`reason` (enum: cancelled \| network \| expired \| wrong_code \| code_paused \| rate_limited \| invalid_email \| not_available \| provider \| session_expired \| consent_unavailable \| unknown) | A-NFR-013 |
| `auth_email_sent` | Email sign-in link or code sent (observed); attempt counts sends in this sign-in | `attempt` (int 1 to 10) | A-NFR-013 |
| `auth_deferred` | User chose Later on the sign-in sheet | `trigger` (enum: first_letter \| invite \| invite_create \| sign_in \| settings) | PRD-REQ-016 |
| `signed_out` | The session ended on this phone (observed): by the person, Apple revoked it, account switch, or the session was lost | `reason` (enum: user \| apple_revoked \| switch_account \| session_lost) | A-NFR-013, PRD-REQ-016 |
| `invite_opened` | An invite link or code is opened in the app | `via` (enum: link \| code \| paste)<br>`signed_in` (bool) | B-REQ-007 |
| `coparent_soon_opened` | The co-parent coming-soon presentation is shown (the Family tab, or the sheet any other door opens) | `surface` (enum: tab \| sheet) | PRD-REQ-016 |
| `coparent_soon_notify` | Tell me when it is here is tapped on the coming-soon presentation (a note on this phone, nothing is sent to us) | (none) | PRD-REQ-016 |
| `local_merge_choice` | User with local letters picks where they go at sign-in | `choice` (enum: existing \| new) | PRD-REQ-016 |

#### children

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `child_added` | A child book is created | `has_date` (bool)<br>`child_ordinal` (enum: first \| second \| third_plus)<br>`in_first_run` (bool)<br>`added_together` (bool) | PRD-REQ-011, PRD-REQ-015, B-REQ-004 |
| `child_switched` | User switches the current book | `child_ordinal` (enum: first \| second \| third_plus)<br>`surface` (enum: tonight \| book \| review \| listen) | PRD-REQ-012 |
| `child_setting_changed` | A per-child setting is changed (which setting only, never the value) | `key` (enum: display_name \| nickname \| date \| photo \| book_look \| family_can_read \| hidden \| deleted \| signs_as \| include_in_reminders \| pause_celebrations \| auto_add)<br>`child_ordinal` (enum: first \| second \| third_plus) | PRD-REQ-013 |
| `make_it_yours_card` | A post-first-letter "Make it yours" card is acted on | `card` (enum: goals \| words \| invite \| photo)<br>`action` (enum: opened \| completed \| skipped) | B-REQ-004, PRD-REQ-016 |
| `goals_set` | What matters goals saved. Count only: goals are L4 (PRD 7.10), so which goals were picked is never sent | `count` (int 0 to 5) | B-NFR-001, PRD-REQ-010 |
| `dictionary_term_added` | A Names and words term saved (kind only, never the term) | `kind` (enum: child \| nickname \| family \| word \| place \| self)<br>`source` (enum: settings \| review_correction \| onboarding) | PRD-REQ-016 |

#### capture

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `capture_started` | User starts speaking or typing a letter | `mode` (enum: spoken \| typed \| mixed)<br>`source` (enum: tonight \| book \| notification \| make_it_yours \| resurface)<br>`prompt_kind` (enum: opening \| gap \| hard \| family \| together \| none)<br>`child_ordinal` (enum: first \| second \| third_plus)<br>`member_role` (enum: parent \| contributor) | PRD-REQ-016, C-REQ-034 |
| `capture_discarded` | A letter in progress is thrown away before saving | `mode` (enum: spoken \| typed \| mixed)<br>`stage` (enum: listening \| review)<br>`audio_bucket`? (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m) | PRD-REQ-016 |
| `transcription_completed` | A spoken letter finishes transcription, hears no speech, fails, or waits for its language model | `engine` (enum: on_device \| server)<br>`model` (enum: turbo \| small \| hindi_small \| zh_turbo \| server_default \| none)<br>`audio_bucket` (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m)<br>`latency_bucket` (enum: lt_5s \| 5_15s \| 15_30s \| 30_60s \| gt_60s)<br>`outcome` (enum: ok \| no_speech \| failed \| queued_for_model) | PRD-REQ-016, NFR-7.7 |
| `letter_saved` | A letter is saved (to the book or kept private). The core activation and north-star event on device | `mode` (enum: spoken \| typed \| mixed)<br>`destination` (enum: book \| private)<br>`child_ordinal` (enum: first \| second \| third_plus)<br>`member_role` (enum: parent \| contributor)<br>`prompt_kind` (enum: opening \| gap \| hard \| family \| together \| none)<br>`audio_bucket`? (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m)<br>`words_bucket` (enum: lt_25 \| 25_99 \| 100_299 \| 300_plus)<br>`machine_edit_count` (int 0 to 500)<br>`edits_reverted_count` (int 0 to 500)<br>`edits_rejected_count`? (int 0 to 500)<br>`engine` (enum: on_device \| server \| none \| pending)<br>`from_notification_2h` (bool) | C-REQ-034, PRD-REQ-016, ADR-0008 |
| `review_action` | An action on the Review screen | `action` (enum: show_exactly_said \| edit_text \| say_again \| play_back \| change_child \| change_destination \| undo_all_edits) | PRD-REQ-016, PRD-REQ-012 |
| `machine_edit_reverted` | A user undoes one machine edit (type and source only). Fidelity health signal for the constitution | `edit_type` (enum: filler \| false_start \| repeat \| stt_fix \| punctuation \| agreement \| paragraph)<br>`source` (enum: rule \| model) | PRD-REQ-016 |
| `machine_edit_rejected` | The verifier refused machine edits for a letter: one event per edit type, source and reason, with a count. Never the text or the span | `edit_type` (enum: filler \| false_start \| repeat \| stt_fix \| punctuation \| agreement \| paragraph)<br>`source` (enum: rule \| model)<br>`reason` (enum: original_mismatch \| out_of_bounds \| overlaps_protected \| overlaps_other_edit \| type_not_allowed_at_level \| removal_only \| not_a_filler \| not_a_repeat \| false_start_not_repeated \| stt_fix_not_dictionary \| punctuation_changed_letters \| agreement_not_single_word \| agreement_stem_mismatch \| agreement_limit_per_sentence \| paragraph_not_whitespace \| inserted_content_word \| change_ceiling_exceeded \| splits_word \| removal_adds_punctuation \| changes_negation \| changes_tense \| changes_modal \| changes_word \| changes_number \| changes_sentence_type \| changes_quotes \| case_change_not_allowed \| case_change_not_sentence_start \| removes_negation \| repeat_is_emphasis \| false_start_complete_phrase \| stt_fix_protected_word \| stt_fix_not_heard_as \| not_vetted_for_language)<br>`count` (int 1 to 500) | PRD-REQ-016, B-REQ-003 |
| `letter_deleted` | Own letter deleted or restored within the undo window | `action` (enum: deleted \| restored)<br>`destination` (enum: book \| private) | PRD-REQ-016 |

#### languages

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `language_set` | An author adds, removes or makes primary one spoken-letter language (observed; one language per event) | `lang` (enum: en \| hi \| es \| zh \| fr \| ar \| pt)<br>`action` (enum: added \| removed \| made_primary) | B-REQ-003, PRD-REQ-016 |
| `pack_download` | A language pack or speech model download changes state (observed). Named by analytics pack id and language code only | `pack` (enum: rules_en \| rules_hi \| rules_es \| rules_zh \| rules_fr \| rules_ar \| rules_pt \| prompts_en \| prompts_hi \| prompts_es \| prompts_zh \| prompts_fr \| prompts_ar \| prompts_pt \| model_vad \| model_turbo \| model_small \| model_hindi_small \| model_zh_turbo \| other)<br>`lang`? (enum: en \| hi \| es \| zh \| fr \| ar \| pt)<br>`pack_version` (int 1 to 1000)<br>`stage` (enum: started \| completed \| failed \| removed)<br>`failure`? (enum: no_manifest \| not_in_manifest \| needs_app_update \| downloads_paused \| waiting_for_wifi \| offline \| no_space \| hash_mismatch \| download_failed \| cancelled \| storage_error)<br>`network` (enum: wifi \| cellular \| none \| unknown) | B-REQ-003, NFR-7.7 |

#### book

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `book_opened` | Book tab shown for a child | `child_ordinal` (enum: first \| second \| third_plus)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus)<br>`member_role` (enum: parent \| contributor) | PRD-REQ-016 |
| `letter_opened` | A letter is opened to read | `author_relation` (enum: self \| other_parent \| family)<br>`has_audio` (bool) | PRD-REQ-016 |
| `playback_started` | A recording starts playing | `surface` (enum: letter \| review \| read_together)<br>`author_relation` (enum: self \| other_parent \| family)<br>`version` (enum: listening_copy \| original) | PRD-REQ-016 |
| `read_together_started` | Read together session starts | `child_ordinal` (enum: first \| second \| third_plus)<br>`access` (enum: plus \| try)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus) | C-REQ-034, PRD-REQ-016 |
| `read_together_ended` | Read together session ends | `reason` (enum: finished \| stopped \| interrupted)<br>`session_bucket` (enum: lt_1m \| 1_5m \| 5_15m \| gt_15m)<br>`letters_heard` (int 0 to 50) | PRD-REQ-016 |
| `read_together_try_used` | A free Read together try is used (Free tier) | `n` (int 1 to 10) | C-REQ-034 |

#### family

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `invite_created` | A parent creates an invite | `role` (enum: parent \| contributor)<br>`channel` (enum: share_sheet \| copy_link \| code)<br>`shared` (bool)<br>`child_ordinal` (enum: first \| second \| third_plus) | B-REQ-007, B-NFR-001, PRD-REQ-014 |
| `invite_accepted` | An invite is accepted in the app (observed). Server aggregates count every acceptance | `role` (enum: parent \| contributor)<br>`surface` (enum: app) | B-NFR-001 |
| `invite_failed` | Creating or accepting an invite failed (the reason class only) | `stage` (enum: create \| accept)<br>`reason` (enum: expired \| used \| revoked \| already_member \| not_found \| not_parent \| rate_limited \| consent_needed \| book_deleted \| signed_out \| network \| unknown) | B-REQ-007 |
| `family_letter_reviewed` | A parent decides on a family letter | `decision` (enum: added \| kept_aside) | B-REQ-009, B-NFR-001 |
| `member_removed` | A parent removes a member | `role` (enum: parent \| contributor) | B-REQ-010 |
| `member_left` | A member leaves a book | `role` (enum: parent \| contributor)<br>`letters` (enum: keep \| take_out) | B-REQ-010 |

#### reminders

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `reminder_prime_shown` | Reminder priming card shown | `source` (enum: tonight \| settings \| family_first_letter) | C-REQ-034, PRD-REQ-001 |
| `reminder_prime_result` | Priming card answered | `choice` (enum: yes \| not_now) | C-REQ-034 |
| `os_permission_result` | OS notification permission answered | `granted` (bool)<br>`platform` (enum: ios \| android) | C-REQ-034 |
| `reminder_schedule_set` | Reminder cadence, time or pause saved (observed from the stored preferences) | `cadence` (enum: off \| weekly \| few_times \| every_evening)<br>`hour_bucket` (enum: morning \| afternoon \| evening \| late_evening)<br>`paused` (bool) | C-REQ-034 |
| `reminder_sent` | Logged on next foreground for a local evening reminder that fired. Month-age and birthday notes are excluded because their timing reveals the birth date | `type` (enum: letter_reminder \| family_digest)<br>`variant_id`? (int 0 to 99) | C-REQ-034, C-NFR-001 |
| `reminder_suppressed` | A scheduled reminder was skipped | `reason` (enum: wrote_recently \| quiet_window \| weekly_cap \| paused) | C-REQ-034 |
| `notification_opened` | User opens the app from a notification (observed). Month-age and birthday notes are never reported | `type` (enum: letter_reminder \| family_digest \| family_letter \| plan_notice)<br>`variant_id`? (int 0 to 99) | C-REQ-034 |

#### celebrate

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `moment_shown` | A quiet milestone card is shown. Month-chapter and Year One are excluded: they fire on dates set by the birthday | `type` (enum: first_letter \| letters_10 \| letters_50 \| letters_100 \| letters_365 \| first_family_letter \| first_read_together) | C-REQ-034, C-REQ-010 |
| `resurface_shown` | An "On this day" card is shown | `kind` (enum: one_month \| one_year) | C-REQ-034, C-REQ-014 |
| `resurface_opened` | An "On this day" card is opened | `kind` (enum: one_month \| one_year) | C-REQ-034 |

#### settings

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `settings_changed` | A person-level setting is changed (which one, never the value) | `key` (enum: reading_size \| theme \| reminders \| languages \| lock_screen_names \| sensitive_data \| pack_cellular \| listening_copy) | C-REQ-034, C-REQ-016 |
| `export_started` | Export everything started (one ZIP made on the phone) | `format` (enum: archive)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus) | C-REQ-034, PRD-REQ-009 |
| `export_completed` | Export finished and checked | `format` (enum: archive)<br>`size_bucket` (enum: lt_10mb \| 10_100mb \| 100_500mb \| gt_500mb)<br>`duration_bucket` (enum: lt_30s \| 30s_2m \| gt_2m) | C-REQ-034, C-NFR-007 |
| `export_failed` | Export stopped before a file was ready | `format` (enum: archive)<br>`reason` (enum: cancelled \| low_space \| too_large \| check_failed \| unknown) | C-REQ-034, C-NFR-007 |
| `export_shared` | The share sheet for a finished export closed | `result` (enum: shared \| dismissed) | C-REQ-034 |
| `account_deletion` | Account deletion flow step. `confirmed` is the last event ever sent for this id | `stage` (enum: started \| export_offered \| confirmed \| undone) | C-REQ-034, PRD-REQ-018 |

#### plus

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `plus_offer_viewed` | Apple's subscription store view presented | `trigger` (enum: chapter_complete \| second_child \| backup \| read_together \| themes \| settings) | C-REQ-034, C-REQ-023 |
| `plus_offer_closed` | Apple's subscription store view closed | `trigger` (enum: chapter_complete \| second_child \| backup \| read_together \| themes \| settings)<br>`outcome` (enum: purchased \| dismissed \| unavailable) | C-REQ-034, C-NFR-002 |
| `plan_changed` | The plan StoreKit reports on this device changed state (observed; production transactions only) | `from_state` (enum: none \| trial \| active \| grace \| billing_retry \| expired \| refunded \| revoked)<br>`to_state` (enum: none \| trial \| active \| grace \| billing_retry \| expired \| refunded \| revoked)<br>`period` (enum: month \| year \| unknown)<br>`ownership` (enum: purchased \| family_shared \| unknown) | C-REQ-034, C-NFR-002 |
| `restore_result` | Restore purchases finished | `outcome` (enum: restored \| nothing \| cancelled \| failed \| unavailable) | C-REQ-034, C-NFR-003 |

#### errors

| Event | Fires when | Properties (type: allowed values) | Serves |
|---|---|---|---|
| `error_shown` | A user-facing error from strings `errors.*` is shown | `code` (enum: save_failed \| mic_denied \| transcription_failed \| offline \| backup_failed \| invite_expired \| storage_low \| generic) | PRD-REQ-016 |
| `sync_failed` | A sync attempt fails after retries | `reason` (enum: network \| auth \| conflict \| server \| unknown) | PRD-REQ-016 |

Global properties: `schema_version` (int 1 to 1000), `child_count_bucket`? (enum: none \| one \| two \| three_plus), `sample_pct`? (int 1 to 99).
<!-- catalogue:end -->

### 3.2 Global properties (added by the client to every event)

| Property | Type and values | Level | Why |
|---|---|---|---|
| `schema_version` | int 1 to 1000 (currently 4; required; a test pins the catalogue fingerprint, so a changed event needs a new version) | L2 | Lets queries span catalogue changes |
| `child_count_bucket`? | enum: none, one, two, three_plus | L2 | K-01 asks for it as a user property; LEGAL-REQ-017 forbids person properties beyond the id. Decision: send it as an event property, which satisfies both |
| `sample_pct`? | int 1 to 99 | L2 | Present only on sampled events, so counts can be re-weighted |

SDK-added properties: the app keeps only `$app_version`, `$app_build`, `$os_name`, `$os_version` and `$device_type` at the source (`customAppProperties`), and `posthogBeforeSend` repeats an allowlist on every payload (also `$lib`, `$lib_version`, `$session_id`, `$process_person_profile`, `$geoip_disable`, ids). Dropped on purpose: `$device_name` (often "Name's iPhone"), `$device_model`, `$timezone` and `$locale` (coarse location and a language proxy, LEGAL-REQ-012), `$screen_name`, `$screen_width`, `$screen_height`, `$is_identified`, `$network_carrier`, and top-level `$set` and `$set_once`.

### 3.3 Shared value sets

| Set | Values | Notes |
|---|---|---|
| `child_ordinal` / `ordinal` | first, second, third_plus | Order of creation among the viewer's books; never an id |
| `member_role` | parent, contributor | Co-parents are parents |
| `author_relation` | self, other_parent, family | Relative to the viewer |
| `prompt_kind` | opening, gap, hard, family, together, none | `packages/core` PromptKind |
| `edit_type`, `source` | `packages/core` EditType, EditSource | A type test keeps the catalogue equal to core |
| `reason` (verifier) | `packages/core` RejectReason, 34 values including `not_vetted_for_language` | A type test keeps the catalogue equal to core |
| `lang` | en, hi, es, zh, fr, ar, pt | The seven v1.0 spoken-letter languages (decision 6); only on `language_set` and `pack_download` |
| `pack` | rules_\<lang\>, prompts_\<lang\>, model_vad, model_turbo, model_small, model_hindi_small, model_zh_turbo, other | Short id derived from the signed manifest id by `packAnalyticsId`; the manifest id, file name and URL are never sent |
| `model` | turbo, small, hindi_small, zh_turbo, server_default, none | Speech model in use (ADR 0015) |
| `audio_bucket` | lt_15s, 15_60s, 1_2m, 2_5m, gt_5m | Recording length |
| `words_bucket` | lt_25, 25_99, 100_299, 300_plus | A count, never the words |
| `letters_bucket` | 0, 1, 2_4, 5_9, 10_49, 50_99, 100_364, 365_plus | Matches the milestone steps |
| `route` | Route templates only (`letter_detail`, never `/letter/abc123`) | `routeForSegments` maps expo-router file segments; unmapped routes send nothing |

Bucket helpers (`audioBucket`, `lettersBucket`, `daysBucket` and the rest in `src/buckets.ts`) turn raw numbers into these values; screens never send a raw duration or count.

### 3.4 Differences from the sub-PRD event lists

| Sub-PRD said | Catalogue does | Why |
|---|---|---|
| ADR 0008 example `entry_saved` | `letter_saved` (C-REQ-034 name) | One name for one thing |
| A `app_cold_start{platform, first_launch}` | `ttfi_bucket` only | Platform comes from SDK `$os_name`; `first_launch` can never be true after consent |
| A intro story events | Removed (Draft 2) | First run is before consent, and intro replay is not a v1.0 feature |
| A `auth_email_verified`, `auth_succeeded{new_user, linked_existing}` | `auth_succeeded{method, had_local_data}` | Observed from the auth state; new accounts are counted on the server |
| B `goals_set{keys}` | `count` only | Goals are L4 (PRD 7.10) |
| B `languages_set{multilingual}` | `language_set{lang, action}`, one language per event | Founder decision 12 asks for language usage; the code is a closed list of seven (6.2, DEBATES Q-004) |
| B `invite_accepted{surface}` | `surface: app` only | All acceptances are counted by `family_invites` on the server |
| C `reminder_sent{type, variant_id}` | `type: letter_reminder, family_digest`; `variant_id` optional | Birthday and month-age notes leak the birth date (6.4) |
| C `moment_shown{type}` | Seven allowed types | Month-chapter and Year One fire on birthday-derived dates |
| C billing lifecycle events | Retired (section 2) | Apple-only billing: no source |
| C `purchase_started`, `trial_started`, `purchase_succeeded`, `purchase_failed`, `gift_purchased`, `plus_offer_dismissed`, `plus_offer_viewed.arm` | `plus_offer_viewed`, `plus_offer_closed{outcome}`, `plan_changed` | Apple's SubscriptionStoreView does not tell the app which plan was tapped; StoreKit tells it the resulting state. Gifts are P1 |
| Draft 1 `model_download`, `backup_mode_set` | Replaced by `pack_download`; removed | Models are packs (ADR 0015); no backup in v1.0 (D-032) |

---

## 4. Server aggregates (PRD-REQ-017, founder decision 12)

Migration `supabase/migrations/20261004300000_insights_aggregates.sql`, tested by `supabase/tests/insights_aggregates.test.mjs` (45 checks). Views live in schema `insights`, which the Data API does not expose; only `service_role` and the no-login role `insights_reader` can read them, through the published views or `public.insights_aggregates(p_weeks)` (one JSON document, 1 to 104 weeks).

**Counts only, k = 10.** No output column is an id, a timestamp of a person, or text a person wrote. Every published count is 0 or at least 10; a part of a total (for example "spoken letters" of "letters") is published only when the part and the remainder are both 0 or at least 10, so no small group can be recovered by subtraction. Statistics (mean, p50, p90) appear only over 10 or more families. In `language_mix`, languages under 10 families join `other` until `other` reaches 10, and a week below 10 families is not published.

| View | Grain | Columns |
|---|---|---|
| `weekly_keeping_families` | ISO week (UTC) | families, families_with_book_letter, letters, spoken_letters, typed_letters, complete |
| `letters_per_active_family` | week | active_families, letters_per_family_mean, p50, p90, families_two_plus_voices |
| `first_letter_conversion` | sign-up week | new_accounts, first_letter_d1, d7, d30, matured flags |
| `family_invites` | week x role (co_parent, contributor) | sent, accepted, accepted_within_7d |
| `retention_cohorts` | first-letter week x week offset (0 to 12, 26) | cohort_writers, active_writers (completed weeks only) |
| `language_mix` | week x language (seven codes or other) | families. Reports `available: false` until `public.entries.language` exists (owner: language/sync; the column must be L4) |

Definitions: a letter is an `entries` row that is not deleted and not "Not much today", in a live book; its week is the week of `least(captured_at, created_at)`, so a wrong phone clock never dates a letter in the future. A family is the connected set of parents through shared books.

Not on the server, by decision: purchases (ASC), anything per person, anything joined to analytics ids.

---

## 5. Volume and sampling

### 5.1 Estimate per active consenting parent per month (Assumption)

Inputs: 20 letters per family per month and 2 members per family (co-parent only at v1.0), so about 10 letters a month for an active parent; about 20 sessions a month.

| Events | Per month |
|---|---|
| `app_opened`, `app_backgrounded`, `app_cold_start` | 45 |
| `screen_view` | 40 |
| Capture: `capture_started`, `letter_saved`, `transcription_completed`, `capture_discarded`, `review_action`, `machine_edit_reverted`, `machine_edit_rejected` | 45 |
| Book: `book_opened`, `letter_opened`, `playback_started`, Read together | 37 |
| Reminders and moments | 16 |
| Family, languages, settings, Plus, errors, other | 8 |
| **Total** | **about 190** |

### 5.2 Totals

| Scale | Consenting users (40%) | Events per month, no sampling | With launch-scale sampling (5.3) |
|---|---|---|---|
| 1k families (2k MAU) | about 800 | about 150k | not needed |
| 100k families (200k MAU) | about 80k | about 15M | about 12M |

PostHog's free tier is 1M events a month (ADR 0008). The 100k-family cost is a founder decision (PRD section 9, question 8); this plan does not quote a price.

### 5.3 Sampling policy (Decision)

- **Launch at 100% for every event.** At 1k families volume is about 15% of the free tier.
- **Trigger:** when the projected month exceeds 80% of the budget, set rates in remote config (audit-logged): `screen_view` 0.5, `app_backgrounded` 0.5, `letter_opened` 0.5, `playback_started` 0.5.
- **Never sampled:** `analytics_opted_in`, `letter_saved`, capture and transcription events, family, languages, reminders, Plus, settings, children, errors.
- Sampling is deterministic per analytics id and event name, so a person sends all or none of a sampled event. Kept events carry `sample_pct`.
- Transport (PRD 7.7): our in-memory queue capped at 1 MB (oldest dropped first), flushed at most every 60 s in the foreground and when the app goes to the background; the SDK runs with `persistence: 'memory'` and `flushInterval: 0`, so it never writes to disk and has no timer of its own.

---

## 6. Rules for this catalogue

### 6.1 Classification
Every event and property is L2 (PRD 7.10). `docs/legal/DATA_CLASSIFICATION.md` 4.7 points here; `data-map.yaml` (BL-016) must list each property with level L2, purpose "product analytics", retention 12 months or less, disclosure "Usage Data, Diagnostics; not tracking".

### 6.2 Never in analytics
Letter text, transcripts, machine edit spans or offsets, audio, photos, dictionary terms, search queries, child or family names, nicknames, signatures, relation labels typed by users, which goals a parent picked, birthdays, due dates, ages in days or months, emails, phone numbers, tokens, invite codes, database ids, pack manifest ids, file names, URLs, safety tiers, the under-18 answer, free text of any kind.

**Languages (exception, Decision pending counsel, DEBATES Q-004).** PRD 7.10 classifies a person's languages as L4. Founder decision 12 asks for language usage. The catalogue allows exactly one form: `lang`, one of the seven v1.0 codes, on `language_set` and `pack_download` only, one language per event, never on a letter, capture, book, family or Plus event, and never as a list or a "multilingual" flag. Any other code is dropped, not mapped. The server `language_mix` view is the primary source; the device events explain setup and download problems.

### 6.3 Enforcement (code)
`track()` is typed from the catalogue, so a wrong event or value is a compile error. At runtime (`validate.ts`): unknown events dropped; unknown properties stripped; wrong type or range stripped; any string that is free text, PII-like (email, phone, URL, UUID, date, token) or longer than 40 characters drops the whole event. Violation reports never include values or unlisted keys. `posthogBeforeSend` repeats the check on the final SDK payload and removes `$set` and `$set_once`.

### 6.4 Timing leaks
An event's timestamp is data. No event may fire at a time determined by a child's birthday or due date (month-age notes, birthday notes, month-chapter completion, Year One, "baby arrived"). A test bans these names. `notification_opened` is sent only for evening letter reminders, never for month-age or birthday notes.

### 6.5 Adding or changing an event
1. Edit `packages/analytics/src/catalog.ts`, run `npm run plan -w @scribe/analytics`, and commit both (the test checks they match).
2. Cite the requirement it serves; if none exists, the PM adds one first.
3. Enums, booleans or bounded ints only; reuse a shared value set where one fits.
4. Add the properties to `data-map.yaml` as L2.
5. Changing a property's meaning bumps `SCHEMA_VERSION`.
6. Privacy counsel reviews any event touching children, family, languages or consent.

---

## 7. Consent, withdrawal and deletion

| Moment | What happens |
|---|---|
| Before a choice | `track()` returns `dropped_no_consent`; no queue, no disk; the PostHog SDK is not loaded |
| Yes on the sheet or in Settings | New random id; the SDK is constructed with that id bootstrapped (no `$identify` event) and opted in; `analytics_opted_in` sent |
| No | Stored as `denied`; same as before a choice |
| Sheet closed without an answer | Still undecided; offered again at most once more in a later session (`MAX_ANALYTICS_CONSENT_OFFERS = 2`) |
| Withdraw in Settings > Privacy | Our queue cleared; in-flight batch stopped; `optOut()`, `reset()` and the SDK's own queue emptied; id retired (kept locally, max 20, only for deletion) |
| Yes again later | A different id; the two periods cannot be joined |
| Account deletion | The app sends `analyticsIds()` to `analytics-forget` (stateless, TDD 05 X-02), then calls `forgetIds()` (wired in `src/lib/account-deletion`) |

**Timing of the sheet** (`analyticsConsentDue`, tested): only while undecided; only after the first saved letter and never in the same session; only after Keep the book and the reminder prime are answered; at most one ask per session; never during recording, review or export.

Crash reports (Sentry) follow the same switch (LEGAL-REQ-003): the Sentry bootstrap reads `analytics.consent()`.

---

## 8. Open questions and risks

1. **Activation is partly blind (accepted).** Counsel to approve the `analytics_opted_in` summary (section 2).
2. **Languages in analytics** (6.2, DEBATES Q-004): counsel to confirm the seven-code `lang` property is L2.
3. **"Linked" on the privacy label** (section 10): Apple treats data that is personal data under privacy laws as linked. Counsel to decide between "Not linked" (with CCPA de-identification commitments) and "Linked"; either way there is no tracking section.
4. **SDK version pin.** Options were verified against posthog-react-native 4.78.4; a test fails when the installed version changes, so the options are re-checked on every upgrade.
5. **No analytics on the web contribution page** (v1.1). Revisit only with a consent design.
6. **Founder question 8 (PRD section 9):** accept PostHog cost at 100k families or cap the catalogue.

---

## 9. To wire (call sites)

`@/lib/analytics/track` exports `track` and the helpers; every call is a no-op until a yes. Rows marked **wired** are done in files the analytics engineer owns (observers of other modules' public state); the rest need one line in another owner's file.

| Events | Call site | Owner | Status |
|---|---|---|---|
| `app_cold_start`, `app_opened`, `app_backgrounded` | `startAnalytics({ ttfiMs })` in `app/_layout.tsx` after the first frame | coordinator | to wire (one call) |
| `screen_view` | `useScreenViews()` in `app/_layout.tsx` | coordinator | to wire (one hook) |
| `auth_method_selected`, `auth_succeeded`, `auth_failed`, `auth_email_sent`, `signed_out` | `lib/analytics/observers.ts` (observes `subscribeAuth`) | analytics | wired by `startAnalyticsObservers()` |
| `invite_accepted` | observers (`onInviteAccepted`) | analytics | wired |
| `language_set` | observers (store, `getSpokenLanguages()`) | analytics | wired |
| `pack_download` | observers (`packs.onProgress`) | analytics | wired |
| `plan_changed` | observers (`subscribePlan`, production only) | analytics | wired |
| `reminder_schedule_set` | observers (store, `readPrefs()`) | analytics | wired |
| `notification_opened` | observers (expo-notifications response, evening reminders only) | analytics | wired |
| `analytics_opted_in` | `grantAnalytics()` | analytics | wired |
| `account_deletion` | `lib/account-deletion/use-account-deletion.ts` | account deletion | wired |
| `auth_sheet_shown`, `auth_deferred` | `app/(auth)/sign-in/index.tsx`: on show and on Later, with `getSignInTrigger()` | auth | to wire |
| `local_merge_choice` | sign-in re-ownership step | auth, sync | to wire |
| `invite_opened` | `lib/family/pending-invite-watcher.tsx` | auth/family | to wire |
| `coparent_soon_opened`, `coparent_soon_notify` | `components/family/coparent-soon.tsx`: on focus (tab or sheet) and on the Tell me tap | family | wired |
| `invite_created`, `invite_failed` | `app/invite/new.tsx`: `trackInviteCreated({ role: 'parent', channel, shared, childIndex })`; on error `track('invite_failed', { stage, reason: inviteErrorKind(e) })` | family | to wire |
| `member_removed`, `member_left`, `family_letter_reviewed` | family screens | family | to wire |
| `capture_started`, `capture_discarded` | `app/listen.tsx`, `app/write.tsx` | capture (Mobile A) | to wire |
| `transcription_completed` | `lib/transcription-queue/index.ts` on finish: `trackTranscriptionCompleted({ engine: 'on_device', modelId, audioMs, latencyMs, outcome })` (`outcome: 'no_speech'` when nobody spoke) | speech | to wire |
| `letter_saved`, `review_action`, `machine_edit_reverted`, `machine_edit_rejected`, `letter_deleted` | `app/review.tsx`: `trackLetterSaved(...)`, `trackMachineEditsRejected(verifyResult.rejected)` | capture (Mobile A) | to wire |
| `book_opened`, `letter_opened`, `playback_started{version}`, `read_together_*` | book tab, letter screen, `lib/player`, `app/read-together.tsx` | book, player | to wire |
| `child_added`, `child_switched`, `child_setting_changed`, `dictionary_term_added`, `goals_set`, `make_it_yours_card` | children screens | children | to wire |
| `reminder_prime_shown`, `reminder_prime_result`, `os_permission_result`, `reminder_sent`, `reminder_suppressed` | `lib/reminders/priming-sheet.tsx`, `scheduler.ts` | reminders | to wire |
| `export_started`, `export_completed`, `export_failed`, `export_shared` | `app/settings/export.tsx` around `runExport` and `shareExport` | export | to wire |
| `plus_offer_viewed`, `plus_offer_closed`, `restore_result` | around `presentPlusStore()` and `restorePurchases()` (`app/settings/plus.tsx`, gates) | payments | to wire |
| `settings_changed` | appearance, reading size, names in notifications, packs on mobile data, listening copy | settings owners | to wire |
| `moment_shown`, `resurface_*` | celebrate cards | book | to wire |
| `error_shown`, `sync_failed` | `components/ui` toast and errors; `lib/sync/engine.ts` after retries | design, sync | to wire |
| Consent sheet | ask sequencer: show `<AnalyticsConsentSheet>` when `analyticsAskDue(...)`; call `recordAnalyticsOffer()` | coordinator (BL-023) | to wire |

---

## 10. Apple's definition of tracking and the privacy label

Checked 3 Oct 2026 against Apple's "App privacy details" page (https://developer.apple.com/app-store/app-privacy-details/) and the installed PostHog source (4.78.4).

**Apple's definition (Fact, quoted):** "Tracking refers to linking data collected from your app about a particular end-user or device, such as a user ID, device ID, or profile, with Third-Party Data for targeted advertising or advertising measurement purposes, or sharing data collected from your app about a particular end-user or device with a data broker."

| Test | Our setup | Result |
|---|---|---|
| Linked with third-party data | PostHog is our processor; we import no data from other companies; the project setting "Discard client IP" is on and GeoIP is off | No |
| Targeted advertising or ad measurement | No ads, no ad SDKs, no attribution SDKs (SDK denylist, BL-009) | No |
| Shared with a data broker | No | No |
| IDFA or AdSupport | Not used; `NSPrivacyTracking: false`; no ATT prompt | No |
| Device identifiers | PostHog RN 4.78.4 reads no IDFV, IDFA or vendor id (checked in source). Its own random anonymous id (also used as `$device_id` on its config request) lives in memory only (`persistence: 'memory'`), so it is new on every launch, and the SDK exists only after consent | No device-level id |

**Conclusion (Recommendation): no "Data Used to Track You" section**, as `docs/legal/app-store-privacy-labels.md` 1.1 already states. Two points for counsel:
1. Apple adds: "Personal Information and Personal Data, as defined under relevant privacy laws, are considered linked to the user." A persistent random id with behaviour can be personal information under CCPA (a "unique pseudonym"). "Not linked" for Usage Data and Diagnostics holds only if counsel accepts our de-identification (random id per consent period, never stored server-side, no IP, no person properties) plus a public no-reidentification commitment in the Privacy Policy and PostHog's DPA. Otherwise declare them Linked. Linked is not tracking: the tracking section stays empty either way.
2. Identifiers: the random analytics id is an "assigned" id used for analytics. Declaring Identifiers > Device ID or User ID (Analytics, not tracking) is the cautious reading; counsel to choose.

---

## Changelog
| Version | Date | Change |
|---|---|---|
| Draft 2 | 2026-10-03 | Apple-only Plus (decision 3): server billing events and RevenueCat retired, Plus events rebuilt around SubscriptionStoreView and StoreKit state. Added sign-in, invite, export, reminder, language and pack events (decisions 6, 12, 15), transcription `no_speech` and Hindi model, verifier `machine_edit_rejected` with `not_vetted_for_language`. Section 3.1 generated from code. Server aggregates now concrete (section 4). Call sites (section 9). Apple tracking check (section 10). `SCHEMA_VERSION` 2. |
| Draft 1 | 2026-10-02 | First tracking plan: metrics, 68-event catalogue, server aggregates, volume and sampling, rules, consent lifecycle. |

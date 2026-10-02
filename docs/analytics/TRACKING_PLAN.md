# Tracking plan

Owner: analytics engineer. Status: Draft 1, 2 Oct 2026, for founder, PM and privacy counsel review.
Code: `packages/analytics` (the catalogue in `src/catalog.ts` is the source of truth; a test fails if this document and the code drift apart).
Inputs: PRD.md (K-01, PRD-REQ-016 to 018, sections 6.9, 7.7, 7.8, 7.10), PRD A section 10, B-NFR-001, C-REQ-034 and C section 9, ADR 0008, LEGAL-REQ-003, 012, 014, 015, 017, `analyticsConsent.*` in `strings.en.ts`, CLAUDE.md privacy rules.

Labels used below: **Fact** (from a repo document or code), **Assumption** (A, to be replaced by real cohorts), **Decision** (made here, reviewable), **Open** (needs an owner).

---

## 0. What this plan promises

1. **Opt-in only.** No event is sent, queued in memory or written to disk before the user says yes on the consent sheet (LEGAL-REQ-003, PRD 6.9). Declining changes nothing. Withdrawing in Settings > Privacy stops sending within the session, clears the queue, calls `optOut()` and retires the analytics id (PRD-REQ-018).
2. **Content-free.** Enums, booleans and bounded integers only. No letter text, transcripts, audio, photos, dictionary terms, child or family names, signatures, language names, birthdays or due dates, emails, ids from our database, or URLs. Children appear only as `child_ordinal` (`first`, `second`, `third_plus`) or `child_count_bucket`.
3. **Every property is L2** (PRD 7.10 item 9). L3 and L4 values cannot be expressed in the schema. L1 is allowed by the type system but no property needs it today.
4. **Random analytics id.** A fresh random UUID per consent period; never the email, the Supabase user id, a device id or the RevenueCat id. No PostHog person properties.
5. **Business totals do not depend on consent.** Accounts, books, letters, family letters, trials, conversions and churn come from server aggregates and RevenueCat (PRD-REQ-017). Device analytics explain behaviour inside the product; they never set a headline number on their own.

---

## 1. Metrics

### 1.1 North-star metric

**Weekly keeping families (WKF):** the number of families with at least one letter added to a child's book in the last 7 days (any author: parent, co-parent or family). A family is the set of books that share a parent.

- Why this one: it measures the value the product exists for (letters kept for a child), it rises when family members contribute, and it cannot be gamed by opens, notifications or paywall views. It also respects C-REQ-015: it is an internal number and is never shown to users as a streak or count.
- Source: server aggregate (PRD-REQ-017). Device events are not used, so the number covers everyone who has a synced book.
- Blind spot (Fact): letters kept only on the phone (no account, or sensitive-data consent declined) are invisible to the server. Report WKF together with the share of first-letter users who have synced (stage 2 below) so the blind spot is visible.
- Companion numbers: letters added per WKF per week; share of WKF with two or more voices in the week.

### 1.2 Funnel and retention

Source codes: **S** server aggregate (all synced users), **R** RevenueCat (all payers), **D** device analytics (consenting users only, assumed 40%, PRD 7.8), **ASC** App Store Connect.

| # | Stage | Metric and definition | Primary source | Device events used | Target (A unless noted) | Serves |
|---|---|---|---|---|---|---|
| 1 | Activation: first letter | Share of new installs that save a first letter within 24 hours; median time from first launch to first saved letter | ASC installs (denominator); D `analytics_opted_in.time_to_first_letter` and `.first_letter_mode` | `analytics_opted_in` | Median first letter 90 s or less (B F1, R1) | PRD-REQ-016, A G-goals |
| 2 | Keep the book | Share of first-letter users with an account by day 7 | S (accounts with 1 or more entries) | `auth_sheet_shown`, `auth_succeeded`, `auth_deferred`, `local_merge_choice` | 50% or more (A Q2 threshold) | PRD-REQ-001, A-NFR-013 |
| 3 | Activated writer | Letters saved on 2 or more different days within 14 days of the first letter | S; D for mode and prompt mix | `letter_saved`, `capture_started` | Set after first cohorts | PRD-REQ-016 |
| 4 | Weekly letters | Letters saved per active writer per week; share saved by voice versus typing; share added to the book | S (counts by mode and destination); D for `prompt_kind`, `from_notification_2h`, edit counts | `letter_saved`, `transcription_completed` | Set after first cohorts | C-REQ-034 |
| 5 | Family invites | Share of books with 1 or more invites in the first 30 days; invite acceptance rate (app and web); family letters per book per month; share of family letters added | S (invites, memberships, web letters); D for channel and role mix | `invite_created`, `invite_accepted`, `family_letter_reviewed` | Set after first cohorts | B-REQ-007, B-REQ-009 |
| 6 | Read together | Share of monthly active parents who start Read together; finish rate; tries used before an offer | D only (no server signal) | `read_together_started`, `read_together_ended`, `read_together_try_used` | Set after first cohorts | C-REQ-034 |
| 7 | Trial to paid | Offer viewers to trial start (D); trial to paid, annual share, refunds (R) | R for money; D for offer views | `plus_offer_viewed`, `purchase_started`, `trial_started`, `purchase_failed` | Trial starts / first-letter users by day 90: 15% or more; trial to paid 40% or more; annual 60% or more; refunds under 3% (C section 9) | C-REQ-034, C-REQ-023 |
| 8 | Retention | Active writers at week 4 / first-letter users; active writers in month 6; reader retention (opens without writing) | S for writers; D for readers | `app_opened`, `letter_saved`, `book_opened` | Week 4: 35% or more; month 6: 20% or more (C section 9) | PRD-REQ-016 |

### 1.3 Guardrails

| Guardrail | Definition | Source | Threshold (A) |
|---|---|---|---|
| Reminder fatigue | Reminders muted or turned off per month | D `settings_changed{key: reminders}`, `reminder_schedule_set{cadence: off}` | 10% or less (C section 9) |
| Reminder usefulness | Letters saved within 2 hours of a delivered reminder | D `letter_saved.from_notification_2h` / `reminder_sent` | 12% or more (C section 9) |
| Fidelity (constitution) | Machine edits reverted / machine edits applied, by `edit_type` and `source` | D `machine_edit_reverted`, `letter_saved.machine_edit_count` | Under 5% overall; any edit type over 10% is reviewed (Decision) |
| Capture friction | Discarded captures / started captures; transcription failures | D `capture_discarded`, `transcription_completed.outcome` | Watch weekly |
| Errors | `error_shown` per 100 sessions, by `code` | D | Watch weekly |
| Paywall respect | Offers shown outside C-REQ-023 triggers | D `plus_offer_viewed.trigger` | Zero |
| Consent cost | No feature difference by consent | QA, LEGAL-REQ-003 | Zero |

### 1.4 Reading device numbers honestly

- Device rates are **among consenting users**. Consenters are likely more engaged than decliners, so device funnels will look better than reality. Always label them, never divide a device count by a server total.
- To size the bias without linking identities: the server knows which signed-in accounts accepted the `analytics` document (`policy_acceptances`). Compute server metrics (letters per week, week-4 retention) split by consent status. The gap is the bias. No analytics id is involved.
- Server aggregates are counts by day, week and cohort. Suppress cells under 10 accounts in any dashboard (Decision), and never export per-user server rows into PostHog.

---

## 2. What cannot be measured on the device, by design

| Gap | Why | What we use instead |
|---|---|---|
| First run (intro, child setup, first letter) | The consent sheet is the third ask, in a later session after the first letter (K-01, PRD-REQ-001). First-run events can never be sent, and we do not queue them. | `analytics_opted_in` carries a one-time summary built from product state the app already keeps (install day, letters count, first-letter mode and timing, signed in, role, came from invite). **Open:** counsel to confirm this summary is acceptable under LEGAL-REQ-003. If not, drop those properties and rely on ASC and server counts. |
| Decline rate of the consent sheet | A "declined" event would itself be sent without consent | Server: share of signed-in accounts with an `analytics` acceptance |
| Billing lifecycle (renewals, conversions, cancellations, refunds, billing issues, lapse, trial notices) | Happens on the store or server, not in the app; sending it to PostHog would need the server to know the analytics id | RevenueCat and server aggregates (PRD-REQ-017). These C-REQ-034 names are server metrics, not device events: `trial_notice_sent`, `trial_converted`, `trial_cancelled`, `renewal`, `billing_issue`, `plus_lapsed`, `refund_detected` |
| Web contribution page | No consent sheet exists on the web page; contributors are not app users | Server: invites redeemed on web, web letters sent, return links used |
| Safety tiers | Must stay on the device (LEGAL-REQ-015, K-06) | Nothing at launch |
| Anything timed by a child's birthday or due date | The event timestamp would reveal an L4 date (section 6.4) | Nothing. Excluded: month-age notes, birthday notes, month-chapter and Year One moments |

---

## 3. Event catalogue

68 events. Every event also carries the global properties in 3.2. "Level" is the classification of the event and of every one of its properties. `?` marks an optional property.

### 3.1 Events by area

#### app

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `app_cold_start` | First frame after a cold start (only once consent exists, so never on first install) | `ttfi_bucket` (enum: lt_1s \| 1_2s \| 2_3s \| gt_3s) | L2 | A-NFR-001, PRD-REQ-016 |
| `app_opened` | App comes to the foreground after 30 min or more away, or cold starts | `source` (enum: cold \| warm \| notification \| link)<br>`days_since_last_open` (enum: d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus) | L2 | PRD-REQ-016 |
| `app_backgrounded` | App goes to the background; carries the session length bucket | `session_bucket` (enum: lt_1m \| 1_5m \| 5_15m \| gt_15m) | L2 | PRD-REQ-016 |
| `screen_view` | A route is shown. Sent by our router hook, never by SDK autocapture | `route` (enum: tonight \| book \| family \| listen \| write \| review \| letter_detail \| onboarding \| read_together \| invite \| plus_sheet \| settings \| settings_appearance \| settings_reminders \| settings_recordings \| settings_children \| settings_child_detail \| settings_child_new \| settings_privacy \| settings_your_data \| settings_help_legal \| settings_about) | L2 | ADR-0008, PRD-REQ-016 |

#### consent

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `analytics_opted_in` | Immediately after the user says yes. Carries a one-time summary of first-run facts the app already stores, because first-run events can never be sent (K-01) | `surface` (enum: consent_sheet \| settings)<br>`days_since_install` (enum: d0 \| d1 \| d2_7 \| d8_30 \| d31_90 \| d91_plus)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus)<br>`signed_in` (bool)<br>`member_role` (enum: parent \| contributor)<br>`first_letter_mode` (enum: spoken \| typed \| none)<br>`time_to_first_letter` (enum: lt_90s \| 90s_5m \| 5_30m \| 30m_24h \| gt_24h \| unknown)<br>`came_from_invite` (bool) | L2 | PRD-REQ-016, K-01 |

#### entry

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `intro_story_view` | An intro story is shown (reachable after consent only via replay) | `index` (int 1 to 4)<br>`via` (enum: auto \| tap \| swipe)<br>`variant` (enum: a \| b) | L2 | A-REQ-034, C-REQ-034 |
| `intro_paused` | Intro auto-advance paused | `index` (int 1 to 4) | L2 | A-NFR-006 |
| `intro_skipped` | Intro skipped | `index` (int 1 to 4) | L2 | PRD-REQ-016 |
| `intro_action` | Intro exit action chosen | `action` (enum: start \| invited \| sign_in)<br>`stories_seen` (int 0 to 4) | L2 | PRD-REQ-016 |
| `auth_sheet_shown` | Keep the book / sign-in sheet shown | `trigger` (enum: first_letter \| invite \| backup \| third_letter \| sign_in \| settings) | L2 | PRD-REQ-001, PRD-REQ-016 |
| `auth_method_selected` | A sign-in provider tapped | `method` (enum: apple \| google \| email) | L2 | PRD-REQ-016 |
| `auth_succeeded` | Sign-in completed | `method` (enum: apple \| google \| email)<br>`new_user` (bool)<br>`had_local_data` (bool)<br>`linked_existing` (bool) | L2 | A-NFR-013, PRD-REQ-016 |
| `auth_failed` | Sign-in failed or was cancelled | `method` (enum: apple \| google \| email)<br>`reason` (enum: cancelled \| network \| expired \| used \| wrong_code \| rate_limited \| provider \| unknown) | L2 | A-NFR-013 |
| `auth_email_sent` | Email sign-in link or code sent | `attempt` (int 1 to 10) | L2 | A-NFR-013 |
| `auth_email_verified` | Email sign-in verified | `via` (enum: universal_link \| scheme \| code) | L2 | A-NFR-013 |
| `auth_deferred` | User chose Later on the sign-in sheet | `trigger` (enum: first_letter \| invite \| backup \| third_letter \| sign_in \| settings) | L2 | PRD-REQ-016 |
| `invite_opened` | An invite link or code is opened in the app | `via` (enum: link \| code \| paste)<br>`signed_in` (bool) | L2 | B-REQ-007 |
| `local_merge_choice` | User with local letters picks where they go at sign-in | `choice` (enum: existing \| new) | L2 | PRD-REQ-016 |

#### children

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `child_added` | A child book is created | `mode` (enum: birthday \| due_date \| month_only)<br>`ordinal` (enum: first \| second \| third_plus)<br>`in_first_run` (bool)<br>`added_together` (bool) | L2 | PRD-REQ-011, PRD-REQ-015, B-REQ-004 |
| `child_switched` | User switches the current book | `ordinal` (enum: first \| second \| third_plus)<br>`surface` (enum: tonight \| book \| review \| listen) | L2 | PRD-REQ-012 |
| `child_setting_changed` | A per-child setting is changed (which setting only, never the value) | `key` (enum: display_name \| nickname \| date \| photo \| book_look \| family_can_read \| hidden \| deleted \| signs_as \| include_in_reminders \| pause_celebrations \| auto_add)<br>`ordinal` (enum: first \| second \| third_plus) | L2 | PRD-REQ-013 |
| `make_it_yours_card` | A post-first-letter "Make it yours" card is acted on | `card` (enum: goals \| words \| invite \| photo)<br>`action` (enum: opened \| completed \| skipped) | L2 | B-REQ-004, PRD-REQ-016 |
| `goals_set` | What matters goals saved. Count only: goals are L4 (PRD 7.10), so which goals were picked is never sent | `count` (int 0 to 5) | L2 | B-NFR-001, PRD-REQ-010 |
| `dictionary_term_added` | A Names and words term saved (kind only, never the term) | `kind` (enum: child \| nickname \| family \| word \| place \| self)<br>`source` (enum: settings \| review_correction \| onboarding) | L2 | PRD-REQ-016 |

#### capture

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `capture_started` | User starts speaking or typing a letter | `mode` (enum: spoken \| typed)<br>`source` (enum: tonight \| book \| notification \| make_it_yours \| resurface)<br>`prompt_kind` (enum: opening \| gap \| hard \| family \| together \| none)<br>`child_ordinal` (enum: first \| second \| third_plus)<br>`member_role` (enum: parent \| contributor) | L2 | PRD-REQ-016, C-REQ-034 |
| `capture_discarded` | A letter in progress is thrown away before saving | `mode` (enum: spoken \| typed)<br>`stage` (enum: listening \| review)<br>`audio_bucket`? (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m) | L2 | PRD-REQ-016 |
| `transcription_completed` | A spoken letter finishes transcription (or fails / waits for the model) | `engine` (enum: on_device \| server)<br>`model` (enum: turbo \| small \| server_default)<br>`audio_bucket` (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m)<br>`latency_bucket` (enum: lt_5s \| 5_15s \| 15_30s \| 30_60s \| gt_60s)<br>`outcome` (enum: ok \| failed \| queued_for_model) | L2 | PRD-REQ-016, NFR-7.7 |
| `model_download` | Speech model download state changes | `stage` (enum: started \| completed \| failed \| removed)<br>`model` (enum: turbo \| small)<br>`network` (enum: wifi \| cellular) | L2 | NFR-7.7 |
| `letter_saved` | A letter is saved (to the book or kept private). The core activation and north-star event on device | `mode` (enum: spoken \| typed)<br>`destination` (enum: book \| private)<br>`child_ordinal` (enum: first \| second \| third_plus)<br>`member_role` (enum: parent \| contributor)<br>`prompt_kind` (enum: opening \| gap \| hard \| family \| together \| none)<br>`audio_bucket`? (enum: lt_15s \| 15_60s \| 1_2m \| 2_5m \| gt_5m)<br>`words_bucket` (enum: lt_25 \| 25_99 \| 100_299 \| 300_plus)<br>`machine_edit_count` (int 0 to 500)<br>`edits_reverted_count` (int 0 to 500)<br>`engine` (enum: on_device \| server \| none \| pending)<br>`from_notification_2h` (bool) | L2 | C-REQ-034, PRD-REQ-016, ADR-0008 |
| `review_action` | An action on the Review screen | `action` (enum: show_exactly_said \| edit_text \| say_again \| play_back \| change_child \| change_destination \| undo_all_edits) | L2 | PRD-REQ-016, PRD-REQ-012 |
| `machine_edit_reverted` | A user undoes one machine edit (type and source only). Fidelity health signal for the constitution | `edit_type` (enum: filler \| false_start \| repeat \| stt_fix \| punctuation \| agreement \| paragraph)<br>`source` (enum: rule \| model) | L2 | PRD-REQ-016 |
| `letter_deleted` | Own letter deleted or restored within the undo window | `action` (enum: deleted \| restored)<br>`destination` (enum: book \| private) | L2 | PRD-REQ-016 |

#### book

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `book_opened` | Book tab shown for a child | `child_ordinal` (enum: first \| second \| third_plus)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus)<br>`member_role` (enum: parent \| contributor) | L2 | PRD-REQ-016 |
| `letter_opened` | A letter is opened to read | `author_relation` (enum: self \| other_parent \| family)<br>`has_audio` (bool) | L2 | PRD-REQ-016 |
| `playback_started` | A recording starts playing | `surface` (enum: letter \| review \| read_together)<br>`author_relation` (enum: self \| other_parent \| family) | L2 | PRD-REQ-016 |
| `read_together_started` | Read together session starts | `child_ordinal` (enum: first \| second \| third_plus)<br>`access` (enum: plus \| try)<br>`letters_bucket` (enum: 0 \| 1 \| 2_4 \| 5_9 \| 10_49 \| 50_99 \| 100_364 \| 365_plus) | L2 | C-REQ-034, PRD-REQ-016 |
| `read_together_ended` | Read together session ends | `reason` (enum: finished \| stopped \| interrupted)<br>`session_bucket` (enum: lt_1m \| 1_5m \| 5_15m \| gt_15m)<br>`letters_heard` (int 0 to 50) | L2 | PRD-REQ-016 |
| `read_together_try_used` | A free Read together try is used (Free tier) | `n` (int 1 to 10) | L2 | C-REQ-034 |

#### family

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `invite_created` | A parent creates an invite | `role` (enum: co_parent \| contributor)<br>`channel` (enum: share_sheet \| copy_link \| code)<br>`large_print` (bool)<br>`child_ordinal` (enum: first \| second \| third_plus) | L2 | B-REQ-007, B-NFR-001, PRD-REQ-014 |
| `invite_accepted` | An invite is accepted in the app (web page acceptances come from server aggregates) | `role` (enum: co_parent \| contributor)<br>`surface` (enum: app) | L2 | B-NFR-001 |
| `family_letter_reviewed` | A parent decides on a family letter | `decision` (enum: added \| kept_aside) | L2 | B-REQ-009, B-NFR-001 |
| `member_removed` | A parent removes a member | `role` (enum: co_parent \| contributor) | L2 | B-REQ-010 |
| `member_left` | A member leaves a book | `role` (enum: co_parent \| contributor)<br>`letters` (enum: keep \| take_out) | L2 | B-REQ-010 |

#### reminders

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `reminder_prime_shown` | Reminder priming card shown | `source` (enum: tonight \| settings \| family_first_letter) | L2 | C-REQ-034, PRD-REQ-001 |
| `reminder_prime_result` | Priming card answered | `choice` (enum: yes \| not_now) | L2 | C-REQ-034 |
| `os_permission_result` | OS notification permission answered | `granted` (bool)<br>`platform` (enum: ios \| android) | L2 | C-REQ-034 |
| `reminder_schedule_set` | Reminder cadence or time saved | `cadence` (enum: off \| weekly \| two_a_week \| three_a_week)<br>`hour_bucket` (enum: morning \| afternoon \| evening \| late_evening) | L2 | C-REQ-034 |
| `reminder_sent` | Logged on next foreground for a local reminder that fired. Letter reminders only: month-age and birthday notes are excluded because their timing reveals the birth date | `type` (enum: letter_reminder \| family_digest)<br>`variant_id` (int 0 to 99) | L2 | C-REQ-034, C-NFR-001 |
| `reminder_suppressed` | A scheduled reminder was skipped | `reason` (enum: wrote_recently \| quiet_window \| weekly_cap \| paused) | L2 | C-REQ-034 |
| `notification_opened` | User opens the app from a notification | `type` (enum: letter_reminder \| family_digest \| family_letter \| plan_notice)<br>`variant_id` (int 0 to 99) | L2 | C-REQ-034 |

#### celebrate

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `moment_shown` | A quiet milestone card is shown. Month-chapter and Year One are excluded: they fire on dates set by the birthday | `type` (enum: first_letter \| letters_10 \| letters_50 \| letters_100 \| letters_365 \| first_family_letter \| first_read_together) | L2 | C-REQ-034, C-REQ-010 |
| `resurface_shown` | An "On this day" card is shown | `kind` (enum: one_month \| one_year) | L2 | C-REQ-034, C-REQ-014 |
| `resurface_opened` | An "On this day" card is opened | `kind` (enum: one_month \| one_year) | L2 | C-REQ-034 |

#### settings

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `settings_changed` | A person-level setting is changed (which one, never the value) | `key` (enum: reading_size \| theme \| reminders \| languages \| lock_screen_names \| ai_processing \| sensitive_data \| backup_mode \| model_download_network) | L2 | C-REQ-034, C-REQ-016 |
| `backup_mode_set` | Backup mode chosen | `mode` (enum: off \| standard \| vault) | L2 | PRD-REQ-016 |
| `export_started` | Export started | `format` (enum: pdf \| archive \| audio) | L2 | C-REQ-034, PRD-REQ-009 |
| `export_completed` | Export finished | `format` (enum: pdf \| archive \| audio)<br>`size_bucket` (enum: lt_10mb \| 10_100mb \| 100_500mb \| gt_500mb)<br>`duration_bucket` (enum: lt_30s \| 30s_2m \| gt_2m) | L2 | C-REQ-034, C-NFR-007 |
| `account_deletion` | Account deletion flow step. `confirmed` is the last event ever sent for this id | `stage` (enum: started \| export_offered \| confirmed \| undone) | L2 | C-REQ-034, PRD-REQ-018 |

#### plus

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `plus_offer_viewed` | Plus sheet shown | `trigger` (enum: chapter_complete \| second_child \| backup \| read_together \| themes \| settings)<br>`arm` (enum: a \| b \| c) | L2 | C-REQ-034, C-REQ-023 |
| `plus_offer_dismissed` | Plus sheet closed without purchase | `trigger` (enum: chapter_complete \| second_child \| backup \| read_together \| themes \| settings) | L2 | C-REQ-034 |
| `purchase_started` | Store purchase sheet requested | `product` (enum: monthly \| annual \| gift)<br>`trigger` (enum: chapter_complete \| second_child \| backup \| read_together \| themes \| settings) | L2 | C-REQ-034 |
| `trial_started` | Store reports a successful trial start on this device | `product` (enum: monthly \| annual \| gift) | L2 | C-REQ-034 |
| `purchase_succeeded` | Store reports a successful paid purchase (no trial) on this device | `product` (enum: monthly \| annual \| gift) | L2 | C-REQ-034, C-NFR-002 |
| `purchase_failed` | Purchase failed or was cancelled | `error_class` (enum: cancelled \| network \| store \| pending \| not_allowed \| unknown) | L2 | C-REQ-034, C-NFR-002 |
| `restore_result` | Restore purchases finished | `outcome` (enum: restored \| nothing_to_restore \| failed) | L2 | C-REQ-034, C-NFR-003 |
| `gift_purchased` | A gift was bought on this device | (none) | L2 | C-REQ-034 |

#### errors

| Event | Fires when | Properties (type: allowed values) | Level | Serves |
|---|---|---|---|---|
| `error_shown` | A user-facing error from strings `errors.*` is shown | `code` (enum: save_failed \| mic_denied \| transcription_failed \| offline \| backup_failed \| invite_expired \| storage_low \| generic) | L2 | PRD-REQ-016 |
| `sync_failed` | A sync attempt fails after retries | `reason` (enum: network \| auth \| conflict \| server \| unknown) | L2 | PRD-REQ-016 |


### 3.2 Global properties (added by the client to every event)

| Property | Type and values | Level | Why |
|---|---|---|---|
| `schema_version` | int 1 to 1000 (currently 1) | L2 | Lets queries span catalogue changes |
| `child_count_bucket`? | enum: none, one, two, three_plus | L2 | K-01 asks for it as a user property; LEGAL-REQ-017 forbids person properties beyond the id. Decision: send it as an event property, which satisfies both |
| `sample_pct`? | int 1 to 99 | L2 | Present only on sampled events, so counts can be re-weighted |

SDK-added properties are filtered by `posthogBeforeSend` to an allowlist (`$os`, `$os_version`, `$app_version`, `$app_build`, `$lib`, `$lib_version`, `$device_type`, `$session_id`, ids). Dropped on purpose: `$device_name` (often "Name's iPhone"), `$timezone` and `$locale` (coarse location, LEGAL-REQ-012), `$screen_name`, `$network_carrier`, `$set` and `$set_once`.

### 3.3 Shared value sets

| Set | Values | Notes |
|---|---|---|
| `child_ordinal` / `ordinal` | first, second, third_plus | Order of creation among the viewer's books; never an id |
| `member_role` | parent, contributor | Co-parents are parents |
| `author_relation` | self, other_parent, family | Relative to the viewer |
| `prompt_kind` | opening, gap, hard, family, together, none | `packages/core` PromptKind; `together` only when the `child-input` flag is on |
| `edit_type` | filler, false_start, repeat, stt_fix, punctuation, agreement, paragraph | `packages/core` EditType |
| `audio_bucket` | lt_15s, 15_60s, 1_2m, 2_5m, gt_5m | Recording length |
| `words_bucket` | lt_25, 25_99, 100_299, 300_plus | A count, never the words |
| `letters_bucket` | 0, 1, 2_4, 5_9, 10_49, 50_99, 100_364, 365_plus | Matches the milestone steps |
| `route` | Route templates only (for example `letter_detail`, never `/letter/abc123`) | Sent by our router hook, not SDK screen capture |

### 3.4 Differences from the sub-PRD event lists

| Sub-PRD said | Catalogue does | Why |
|---|---|---|
| ADR 0008 example `entry_saved` | `letter_saved` (C-REQ-034 name) with the ADR's properties | One name for one thing |
| A `app_cold_start{platform, first_launch}` | `ttfi_bucket` only | Platform comes from SDK `$os`; `first_launch` can never be true after consent |
| B `goals_set{keys}` | `count` only | Goals are L4 (PRD 7.10); which goals were picked is never sent (data architect flag, 2 Oct) |
| B `languages_set{multilingual}` | Removed | Languages are L4 (PRD 7.10); a multilingual flag is derived from them. Transcription quality by language is not measured on the device |
| B `invite_accepted{surface}` | `surface: app` only | Web acceptances come from the server (section 2) |
| C `reminder_sent{type, variant_id}` | `type: letter_reminder, family_digest`; `variant_id` is an int 0 to 99 | Birthday and month-age notes leak the birth date (6.4); free-text ids are banned |
| C `moment_shown{type}` | Seven allowed types | Month-chapter and Year One fire on birthday-derived dates |
| C billing lifecycle events | Server metrics | Section 2 |
| C (none) | Added `purchase_succeeded`, `plus_offer_viewed.arm` | Paid purchases without trial; the pricing test arm (C section 8) |

---

## 4. Server aggregates (PRD-REQ-017)

Produced by a scheduled job from Postgres and RevenueCat, stored as daily and weekly counts per cohort week, with no per-user rows leaving the database. Owner: data architect (job), analytics engineer (definitions).

| Aggregate | Definition |
|---|---|
| Accounts | New and total, by sign-in method |
| Books | New and total; families with 2 or more books; hidden and deleted |
| Letters | Saved and added to a book, by mode (spoken, typed), by source (app, web), by author role |
| WKF | Section 1.1 |
| Active writers | Accounts with 1 or more letters in the week; by cohort week (week 1, 4, 26) |
| Family | Invites created and accepted by role and surface; family letters received, added, kept aside |
| Consent | Signed-in accounts with an `analytics` acceptance (current version), for the bias split in 1.4 |
| Plus | Trials, conversions, renewals, cancellations, refunds, billing issues, lapses, by product and pricing arm (RevenueCat) |

---

## 5. Volume and sampling

### 5.1 Estimate per active consenting parent per month (Assumption)

Inputs: 20 letters per family per month and 2.2 members per family (PRD 7.8), so about 10 letters a month for an active parent; about 20 sessions a month.

| Events | Per month |
|---|---|
| `app_opened`, `app_backgrounded`, `app_cold_start` | 45 |
| `screen_view` | 40 |
| Capture: `capture_started`, `letter_saved`, `transcription_completed`, `capture_discarded`, `review_action`, `machine_edit_reverted` | 38 |
| Book: `book_opened`, `letter_opened`, `playback_started`, Read together | 37 |
| Reminders and moments | 16 |
| Family, settings, Plus, errors, other | 8 |
| **Total** | **about 185** |

Contributors (grandparents) send far fewer, perhaps 40.

### 5.2 Totals

| Scale | Consenting users (40%) | Events per month, no sampling | With launch-scale sampling (5.3) |
|---|---|---|---|
| 1k families (2.2k MAU) | about 880 | about 160k | not needed |
| 100k families (220k MAU) | about 88k | about 16M | about 13M (PRD 7.8 figure) |

PostHog's free tier is 1M events a month (ADR 0008 [S35]). The 100k-family cost is a founder decision (PRD section 9, question 8); this plan does not quote a price.

### 5.3 Sampling policy (Decision)

- **Launch at 100% for every event.** At 1k families volume is about 16% of the free tier.
- **Trigger:** when the projected month exceeds 80% of the paid budget or free tier, set rates in remote config (C-NFR-009, audit-logged): `screen_view` 0.5, `app_backgrounded` 0.5, `letter_opened` 0.5, `playback_started` 0.5. That removes about 45 events per parent per month (to about 140, inside the PRD 7.7 ceiling of 150).
- **Never sampled:** `analytics_opted_in`, `letter_saved`, capture and transcription events, everything in family, reminders, Plus, settings, children, errors. These drive funnels and guardrails.
- Sampling is deterministic per analytics id and event name, so a person sends all or none of a sampled event and paths stay intact. Kept events carry `sample_pct` for re-weighting.
- Transport (PRD 7.7): in-memory queue capped at 1 MB (oldest dropped first), flushed at most every 60 s in the foreground and when the app goes to the background; no wake-ups of its own. Nothing is persisted by our code; PostHog's own persistence applies only after opt-in.

---

## 6. Rules for this catalogue

### 6.1 Classification
Every event and property is L2 (PRD 7.10). `docs/legal/data-map.yaml` must list each property with level L2, purpose "product analytics", retention 12 months or less (PostHog setting, Unverified), disclosure category "Usage Data, Diagnostics; not linked; not tracking". **Open:** the data map file does not exist yet (data architect, LEGAL-REQ-041).

### 6.2 Never in analytics
Letter text, transcripts, machine edit spans, audio, photos, dictionary terms, search queries, child or family names, nicknames, signatures ("signs as"), relation labels typed by users, languages or language names, or any flag derived from them (L4, PRD 7.10; B-NFR-001), which goals a parent picked (L4), birthdays, due dates, ages in days or months, emails, phone numbers, tokens, invite codes, database ids, RevenueCat ids, URLs, safety tiers, free text of any kind.

### 6.3 Enforcement (code)
`track()` is typed from the catalogue, so a wrong event or value is a compile error. At runtime (`validate.ts`): unknown events dropped; unknown properties stripped; wrong type or range stripped; any string that is free text, PII-like (email, phone, URL, UUID, date, token) or longer than 40 characters drops the whole event. Violation reports never include values or unlisted keys. `posthogBeforeSend` repeats the check on the final SDK payload.

### 6.4 Timing leaks
An event's timestamp is data. No event may fire at a time determined by a child's birthday or due date (month-age notes, birthday notes, month-chapter completion, Year One, "baby arrived"). A test bans these names. Reviewers must check new events for this.

### 6.5 Adding or changing an event
1. Edit `packages/analytics/src/catalog.ts` and this file in the same pull request (the test checks both).
2. Cite the requirement it serves; if none exists, the PM adds one first.
3. Enums, booleans or bounded ints only; reuse a shared value set where one fits.
4. Add the properties to `data-map.yaml` as L2.
5. Changing a property's meaning bumps `SCHEMA_VERSION`.
6. Privacy counsel reviews any event touching children, family or consent.

---

## 7. Consent, withdrawal and deletion

| Moment | What happens |
|---|---|
| Before a choice | `track()` returns `dropped_no_consent`; no queue, no disk, provider kept opted out |
| Yes on the sheet or in Settings | New random id; provider `optIn()` then `identify(id)` with no properties; `analytics_opted_in` sent |
| No | Stored as `denied`; same as before a choice |
| Withdraw in Settings > Privacy | Queue cleared; in-flight batch stopped; `optOut()` and `reset()`; id retired (kept locally, max 20, only for deletion) |
| Yes again later | A different id; the two periods cannot be joined |
| Account deletion | The app sends `analyticsIds()` with the deletion request; the server asks PostHog to delete those persons within 24 hours (LEGAL-REQ deletion table), then the app calls `forgetIds()` |

**Open:** if the account is deleted from another device, ids held on this phone are not in the request. Proposal: on next launch, a phone that finds its account deleted sends its ids to a deletion endpoint, then forgets them. **Open (counsel):** whether withdrawal alone should also delete past events, or only stop new ones (current Privacy Policy wording decides).

Crash reports (Sentry) follow the same consent (LEGAL-REQ-003). Recommendation: the Sentry bootstrap reads `analytics.consent()` so there is one switch.

---

## 8. Open questions and risks

1. **Activation is partly blind (accepted).** Opt-in after the first letter means the first-run funnel is measured only through the `analytics_opted_in` summary and ASC. Counsel to approve the summary (section 2).
2. **`time_to_first_letter` needs a stored first-launch time.** Mobile should keep it as ordinary app state; if they do not, the property is `unknown`.
3. **Pricing test (C section 8) primary metric** is paid conversion per offer viewer at day 120. Offer views are device data (consenting only); conversions are RevenueCat data. They cannot be joined per person without linking ids, which we will not do. Proposal: assign the arm server-side, store it on the RevenueCat subscriber, and compute conversion per arm in RevenueCat; use device offer views only as a consenting-sample rate. PM to confirm.
4. **PostHog option names** (`disableGeoip`, the `before_send` hook name and event shape) were not checked against a specific SDK version. Verify in staging with a network inspector before launch; the project setting "discard client IP data" must be on regardless.
5. **No analytics on the web contribution page** at launch (no consent surface there). Revisit only with a consent design.
6. **Founder question 8 (PRD section 9):** accept PostHog cost at 100k families or cap the catalogue. Sampling in 5.3 reaches the PRD's 13M figure but not the free tier.

---

## Changelog
| Version | Date | Change |
|---|---|---|
| Draft 1 | 2026-10-02 | First tracking plan: metrics, 68-event catalogue (goals as a count only, no languages event), server aggregates, volume and sampling, rules, consent lifecycle. |

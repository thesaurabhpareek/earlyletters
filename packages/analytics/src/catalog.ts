/**
 * The analytics event catalogue: the ONLY events and properties that may
 * leave the device (PRD-REQ-016, LEGAL-REQ-017). Human-readable version with
 * metrics and rationale: docs/analytics/TRACKING_PLAN.md, whose section 3 is
 * generated from this file (`npm run plan -w @scribe/analytics`); a test fails
 * if the two drift apart.
 *
 * Rules for adding an event (read TRACKING_PLAN.md section 6 first):
 * - Enums, booleans and bounded integers only. No free text, ids, names,
 *   dates or anything derived from letter content.
 * - Language appears only as `lang` (one of the seven v1.0 spoken-letter
 *   languages, ISO 639-1) on the `languages` events, never next to a letter,
 *   capture, book or family event (TRACKING_PLAN 6.2; counsel review pending,
 *   DEBATES Q-004).
 * - Children appear only as `child_ordinal` or `child_count_bucket`.
 * - No event may fire at a time set by a child's birthday or due date
 *   (the timestamp itself would leak an L4 date). See TRACKING_PLAN 6.4.
 * - Purchases are Apple's alone (founder decision 3): the app reports only
 *   what it sees on the device. Renewals, refunds and churn come from App
 *   Store Connect, never from events or a server of ours.
 * - Every property is L2 and every event cites the requirement it serves.
 */
import { bool, int, oneOf, opt, type EventSpec, type PropSpec } from './schema';
import { MOMENTS_SLOT, REGISTRY } from './registry';
import { BUILD_KIND, CHILD_COUNT_BUCKET, CHILD_ORDINAL, AUTHOR_RELATION, LETTERS_BUCKET, SESSION_BUCKET, EDIT_TYPE, EDIT_SOURCE, REJECT_REASON, AUTH_METHOD, SIGN_IN_TRIGGER, NETWORK, LANG, PACK_ID, PACK_FAILURE } from './values';

// The shared value sets live in values.ts and are defined there once (CODE-R13). This re-export keeps
// every `from './catalog'` import working; a test pins that no name is redefined here.
export * from './values';
/** NS-53 R251: the only two card slots that may be reported (a slot is a position, never a source). */
export { MOMENTS_SLOT };

// ---------------------------------------------------------------------------
// Global properties, attached by the client to every event
// ---------------------------------------------------------------------------

/**
 * Sent as event properties, never as PostHog person properties
 * (LEGAL-REQ-017: no person properties beyond the random id).
 */
export const GLOBAL_PROPS = {
  schema_version: int(1, 1000),
  /**
   * The kind of build (ER-A15, BL-1250). The client adds it to every event it sends (a test pins that); it is optional
   * here only so the validator and the SDK filter still read a payload the client did not build.
   */
  build_kind: opt(BUILD_KIND),
  /** True only on a tester's phone with the local switch on; always false in a store build (ER-A15, FH-10). Added like `build_kind`. */
  is_internal: opt(bool()),
  child_count_bucket: opt(CHILD_COUNT_BUCKET),
  /** Present only when the event is sampled; percent kept, 1 to 99. */
  sample_pct: opt(int(1, 99)),
} as const;

/**
 * Bump when an event or property changes meaning. A test hashes
 * `catalogShape()` and fails until the new hash is recorded below under a
 * new version (PDATA-10). Never edit an existing entry: append one.
 * 2: Apple-only Plus events, cadence values, packs replace model_download (3 Oct 2026).
 * 3: shared core enums (`mixed` capture mode, roles `parent | contributor`), `child_ordinal`
 *    replaces `ordinal`, `child_added.has_date` replaces `mode`, required properties enforced.
 * 4: membership engine (D-082, D-083): `keep_letter` offer trigger replaces `second_child` and
 *    `read_together`; `read_together_try_used` removed; `read_together_started.access` is `plus | free`
 *    (no limit, so no `try`); five numbers-only Plus events added.
 * 5: two content-free events for the co-parent teaser (`coparent_soon_opened`, `coparent_soon_notify`, D-087).
 * 6: verifier reason `changes_invisible` (WP-F06-02, R-01 D4).
 * 7: `reminder_prime_shown.source` gains `first_letter` (the reminder card after the first letter, SET-02).
 * 8: `coparent_soon_opened` and `coparent_soon_notify` removed: there is no co-parent coming-soon screen any more (founder, 11 Nov 2026).
 * 9: `reminder_prime_shown.source` gains `first_month` (the second reminder card, after the first month chapter, BL-518, BL-1429).
 * 10: `auth_sheet_shown.trigger` and `auth_deferred.trigger` gain `third_letter` (the Keep the book re-offer after the third letter, BL-519, BL-1464).
 * 11: two Moments card events, `moments_card_impressed` and `moments_card_tapped`, one closed property `slot` (`look_back` | `question`), NS-53 section 18 and R251. Both are registry events (one definition, in registry.ts; the catalogue rows read it). The tracker `trackMomentsCard` exists; the app does not call it until the Moments flag.
 * 12: the catalogue now reads every sendable event from registry.ts (one definition), so the three rows that only the registry held (`control_tapped`, `perf_measured`, `surface_impressed`) join the fingerprint; no event or property that was already in the catalogue changed (BL-2148, P5 of BL-1235). Production analytics stay off.
 * 13: wire-names step 2a, slice 3a (BL-2175, CR-213): the 4 merged keys are removed: the held rows `app_cold_start` and `auth_sheet_shown`, and the registry rows `book_opened` and `letter_opened`. Their signal is `screen_view` (the `sign_in`, `book` and `letter_detail` screens) and, later, the `cold_start` perf metric. Nothing was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 14: wire-names step 2a, slice 3b (BL-2175, CR-213, CR-225): 18 held events deleted (`app_backgrounded`, `auth_method_selected`, `auth_email_sent`, `local_merge_choice`, `child_setting_changed`, `make_it_yours_card`, `goals_set`, `dictionary_term_added`, `family_letter_reviewed`, `member_removed`, `member_left`, `reminder_sent`, `moment_shown`, `resurface_shown`, `resurface_opened`, `export_shared`, `account_deletion`, `letter_deleted`). Nothing was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 15: wire-names step 2b, slice 1 (BL-2176, CR-212, CR-213): the `keeping` area is renamed to its wire names: `export_started` to `keeping:export_start`, `export_completed` to `keeping:export_complete`, `export_failed` to `keeping:export_fail`; `LEGACY_EVENT_NAMES` in `wire-names.ts` maps each old key to its new one. No property was added or widened, no tier changed (a snapshot test proves it), and no build has sent any of them (analytics are off in every profile, CR-186).
 * 16: wire-names step 2b, slice 2 (BL-2176, CR-212, CR-213): the `me` area is renamed: `signed_out` to `me:session_end`, `language_set` to `me:language_update`, `settings_changed` to `me:setting_update`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 17: wire-names step 2b, slice 3 (BL-2176, CR-212, CR-213): the `family` area is renamed: `invite_opened` to `family:invite_open`, `invite_created` to `family:invite_create`, `invite_accepted` to `family:invite_accept`, `invite_failed` to `family:invite_fail`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 18: wire-names step 2b, slice 4 (BL-2176, CR-212, CR-213): the `onboarding` area is renamed: `auth_succeeded` to `onboarding:sign_in_complete`, `auth_failed` to `onboarding:sign_in_fail`, `auth_deferred` to `onboarding:sign_in_dismiss`, `child_added` to `onboarding:book_create`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 19: wire-names step 2b, slice 5 (BL-2176, CR-212, CR-213): the `notifications` area is renamed: `reminder_prime_shown` to `notifications:reminder_prime_view`, `reminder_prime_result` to `notifications:reminder_prime_submit`, `os_permission_result` to `notifications:permission_submit`, `reminder_schedule_set` to `notifications:schedule_update`, `reminder_suppressed` to `notifications:reminder_cancel`, `notification_opened` to `notifications:notification_open`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 20: wire-names step 2b, slice 6 (BL-2176, CR-212, CR-213): the `book` area is renamed: `playback_started` to `book:playback_start`, `read_together_started` to `book:read_together_start`, `read_together_ended` to `book:read_together_end`, `moments_card_impressed` to `book:moments_card_view`, `moments_card_tapped` to `book:moments_card_open`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 21: wire-names step 2b, slice 7 (BL-2176, CR-212, CR-213): the first half of the `system` area is renamed: `error_shown` to `system:error_view` and `sync_failed` to `system:sync_fail`. No property was added or widened, no tier changed, and no build has sent either (analytics are off in every profile, CR-186).
 * 22: wire-names step 2b, slice 8 (BL-2176, CR-212, CR-213): the rest of the `system` area is renamed: `app_opened` to `system:app_open`, `analytics_opted_in` to `system:analytics_consent_accept`, `pack_download` to `system:pack_download_update`. No property was added or widened, no tier changed (the basics set stays `screen_view`), and no build has sent any of them (analytics are off in every profile, CR-186).
 * 23: wire-names step 2b, slice 9 (BL-2176, CR-212, CR-213): the `plus` area is renamed: `plus_offer_viewed` to `plus:offer_view`, `plus_offer_closed` to `plus:offer_end`, `plan_changed` to `plus:plan_update`, `free_allowance_reached` to `plus:allowance_reach`, `keep_gate_shown` to `plus:keep_gate_view`, `letter_held` to `plus:letter_hold_create`, `plus_started_from_gate` to `plus:keep_gate_plan_start`, `offer_code_redeemed` to `plus:code_submit`, `restore_result` to `plus:restore_complete`. No property was added or widened, no tier changed, and no build has sent any of them (analytics are off in every profile, CR-186).
 * 24: wire-names step 2b, slice 10 (BL-2176, CR-212, CR-213): the first half of the `capture` area is renamed: `capture_started` to `capture:take_start`, `capture_discarded` to `capture:take_cancel`, `transcription_completed` to `capture:transcript_complete`, `letter_saved` to `capture:letter_save`. No property was added or widened, no tier changed (the basics set stays `screen_view`), and no build has sent any of them (analytics are off in every profile, CR-186).
 * 25: wire-names step 2b, slice 11 (BL-2176, CR-212, CR-213): the rest of the `capture` area is renamed, the last slice: `review_action` to `capture:review_update`, `machine_edit_reverted` to `capture:edit_restore`, `machine_edit_rejected` to `capture:edit_decline`, `child_switched` to `capture:child_update`. All 47 rows that own a name now hold it. No property was added or widened, no tier changed (the basics set stays `screen_view`), and no build has sent any of them (analytics are off in every profile, CR-186).
 * 26: two global properties the client adds to every event (ER-A15, BL-1250): `build_kind` (`store`, `testflight`, `preview`, `dev`) and `is_internal` (bool, true only on a tester's phone with the local switch on, never in a store build), so test and internal traffic can be filtered out. No event or event property changed, no tier changed, and no build has sent any event (analytics are off in every profile, CR-186, CR-194).
 */
export const SCHEMA_VERSION = 26;

/**
 * SHA-256 of `JSON.stringify(catalogShape())` per schema version. Versions 1
 * and 2 predate fingerprinting.
 */
export const SCHEMA_FINGERPRINTS: Readonly<Record<number, string>> = Object.freeze({
  3: '971df5e782a0d91011fe559476313e6c40cc52babd65f779bb71422f61ed6a35',
  4: '4d0cc81648b7d3d0cb334e0cd7c38d611f244009f1a5e578b2cb4ecf520750da',
  5: '807e09376410c4f2f955535a6655dacca9de2fd2fc35e4ac7750bd03debb4860',
  6: '71c854663d0ac45e4014e9b99ea799eef7224f66102b4abe4eadae84698f9853',
  7: 'e9a036799e00d28ef83c1b5468c7348fbbaa6e0b2dc5e10559570ee8fc2ff5e0',
  8: '281051b8507447394cd362e4198ccc667e35a3912cf9d7915e8cac7051b8c27d',
  9: '4022bb86210eee98e8a6c9d4a42a5710bccaeacdd76e58bf92fb1d141f491f44',
  10: '1bc7d06372de546ec176a3fcf3147727d28ac6c9a39bba035902980050f9165b',
  11: 'd5086670df9e315dee3d38561bb79858605f4c247d260b20cc6cd96e44181711',
  12: '936b6de82cf58d00e66e2df7ac327409ac1db2682e05dd4bc841dd5f3cd73fcb',
  13: 'b819daaaebb8c0430030dfbd31e91a5ae1e331b0d969661b3a14cd776569fb9f',
  14: '8fe40547df2caaa2b3cf903ad5410f9125f2a36a2a37f6657cfcf0adab245013',
  15: '8e02055673131c1d4595d2878be8f9b86fa1eb169ad03abb926f6b3adea7e658',
  16: '8200c33bbd03df320a3737a8cd5970daefad669869bb975b52815925a284947a',
  17: '105824cb58b64312c2f6af04515e1ebbf8d530ac62792ecbe657c51a88e254ff',
  18: 'fd0665de32a9821e6431a3ef21a7d8ca8c7e80f45c7575e4a463c60ccc7795cb',
  19: 'da3f70873564fbf401c13264ba0c6ea2f7946ba6e534e10760011602fd58bab0',
  20: '283ff4fd73798260a720e784cc9ecaba2bdc5dbb524c0c06635bfab026418a66',
  21: '87de4b13a9a92b91c8097cf62d64acae823645e384cc92a8062abbdb21a1a9e5',
  22: '6735fdea20fb7d2ad6b1011131be795d882f0a1a01f36a96d64485658e48a3f3',
  23: 'ca191bd7fa6bb49a85ee997894aacda24ef023c684e77614cf4679218a8a34d3',
  24: '84ac0d4c4b22eb6f77bf09d474224535b2ab8bbb203cea90b548e44863ca6049',
  25: 'e2b2e4e17ba534fd0421c2de6f1ffbadab573cc686bc3210ccd50a56be208274',
  26: '2c808e0c4247502bd6482f75aabc7ce45791171d6232c406d916acdfc5ea058d',
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Events that are typed here and NOT sent: no row in registry.ts, so validate.ts drops and counts them. Each
 * moves to registry.ts with a decision it informs, a TRACKING_PLAN row and a privacy look, or is removed
 * (the pinned list is in test/catalog-registry-drift.test.ts). Every event that can be sent is defined once,
 * in registry.ts, and is not repeated here.
 */
export const HELD_EVENTS = {
  // --- Sign-in (A section 10). Fire only after consent, which in practice
  // means sign-in from Settings, a later invite, or a new session. ----------
  'onboarding:sign_in_fail': {
    area: 'entry',
    when: 'Sign-in failed or was cancelled (observed). An under-18 answer is never sent',
    reqs: ['A-NFR-013'],
    level: 'L2',
    tier: 'consented',
    props: {
      method: AUTH_METHOD,
      reason: oneOf(
        'cancelled',
        'network',
        'expired',
        'wrong_code',
        'code_paused',
        'rate_limited',
        'invalid_email',
        'not_available',
        'provider',
        'session_expired',
        'consent_unavailable',
        'unknown',
      ),
    },
  },
  'onboarding:sign_in_dismiss': {
    area: 'entry',
    when: 'User chose Later on the sign-in sheet',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: { trigger: SIGN_IN_TRIGGER },
  },
  'me:session_end': {
    area: 'entry',
    when: 'The session ended on this phone (observed): by the person, Apple revoked it, account switch, or the session was lost',
    reqs: ['A-NFR-013', 'PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: { reason: oneOf('user', 'apple_revoked', 'switch_account', 'session_lost') },
  },
  'family:invite_open': {
    area: 'entry',
    when: 'An invite link or code is opened in the app',
    reqs: ['B-REQ-007'],
    level: 'L2',
    tier: 'consented',
    props: { via: oneOf('link', 'code', 'paste'), signed_in: bool() },
  },
  // --- Children (K-12) -----------------------------------------------------
  'capture:child_update': {
    area: 'children',
    when: 'User switches the current book',
    reqs: ['PRD-REQ-012'],
    level: 'L2',
    tier: 'consented',
    props: { child_ordinal: CHILD_ORDINAL, surface: oneOf('tonight', 'book', 'review', 'listen') },
  },
  // `languages_set{multilingual}` from B-NFR-001 stays absent. Language usage
  // is measured only by the `languages` events below (one language per event).
  // --- Capture and review ---------------------------------------------------
  'capture:review_update': {
    area: 'capture',
    when: 'An action on the Review screen',
    reqs: ['PRD-REQ-016', 'PRD-REQ-012'],
    level: 'L2',
    tier: 'consented',
    props: {
      action: oneOf(
        'show_exactly_said',
        'edit_text',
        'say_again',
        'play_back',
        'change_child',
        'change_destination',
        'undo_all_edits',
      ),
    },
  },
  'capture:edit_restore': {
    area: 'capture',
    when: 'A user undoes one machine edit (type and source only). Fidelity health signal for the constitution',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: { edit_type: EDIT_TYPE, source: EDIT_SOURCE },
  },
  'capture:edit_decline': {
    area: 'capture',
    when: 'The verifier refused machine edits for a letter: one event per edit type, source and reason, with a count. Never the text or the span',
    reqs: ['PRD-REQ-016', 'B-REQ-003'],
    level: 'L2',
    tier: 'consented',
    props: { edit_type: EDIT_TYPE, source: EDIT_SOURCE, reason: REJECT_REASON, count: int(1, 500) },
  },
  // The only events that carry `lang`. Never add `lang` to letter, capture,
  // book or family events: that would tie a language to letter behaviour.
  // --- Languages and on-demand packs (founder decisions 6 and 15) -----------
  'me:language_update': {
    area: 'languages',
    when: 'An author adds, removes or makes primary one spoken-letter language (observed; one language per event)',
    reqs: ['B-REQ-003', 'PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: {
      lang: LANG,
      action: oneOf('added', 'removed', 'made_primary'),
    },
  },
  'system:pack_download_update': {
    area: 'languages',
    when: 'A language pack or speech model download changes state (observed). Named by analytics pack id and language code only',
    reqs: ['B-REQ-003', 'NFR-7.7'],
    level: 'L2',
    tier: 'consented',
    props: {
      pack: PACK_ID,
      lang: opt(LANG),
      pack_version: int(1, 1000),
      stage: oneOf('started', 'completed', 'failed', 'removed'),
      failure: opt(PACK_FAILURE),
      network: NETWORK,
    },
  },
  // --- Book and Read together ------------------------------------------------
  'book:playback_start': {
    area: 'book',
    when: 'A recording starts playing',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: {
      surface: oneOf('letter', 'review', 'read_together'),
      author_relation: AUTHOR_RELATION,
      version: oneOf('listening_copy', 'original'),
    },
  },
  'book:read_together_start': {
    area: 'book',
    when: 'Read together session starts',
    reqs: ['C-REQ-034', 'PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: { child_ordinal: CHILD_ORDINAL, access: oneOf('plus', 'free'), letters_bucket: LETTERS_BUCKET },
  },
  'book:read_together_end': {
    area: 'book',
    when: 'Read together session ends',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: {
      reason: oneOf('finished', 'stopped', 'interrupted'),
      session_bucket: SESSION_BUCKET,
      letters_heard: int(0, 50),
    },
  },
  // --- Family (co-parent only at v1.0, founder decision 5) -------------------
  'family:invite_fail': {
    area: 'family',
    when: 'Creating or accepting an invite failed (the reason class only)',
    reqs: ['B-REQ-007'],
    level: 'L2',
    tier: 'consented',
    props: {
      stage: oneOf('create', 'accept'),
      reason: oneOf(
        'expired',
        'used',
        'revoked',
        'already_member',
        'not_found',
        'not_parent',
        'rate_limited',
        'consent_needed',
        'book_deleted',
        'signed_out',
        'network',
        'unknown',
      ),
    },
  },
  // --- Reminders (C-REQ-034) -----------------------------------------------------
  'notifications:reminder_prime_view': {
    area: 'reminders',
    when: 'Reminder priming card shown',
    reqs: ['C-REQ-034', 'PRD-REQ-001'],
    level: 'L2',
    tier: 'consented',
    props: { source: oneOf('tonight', 'settings', 'family_first_letter', 'first_letter', 'first_month') },
  },
  'notifications:reminder_prime_submit': {
    area: 'reminders',
    when: 'Priming card answered',
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: { choice: oneOf('yes', 'not_now') },
  },
  'notifications:permission_submit': {
    area: 'reminders',
    when: 'OS notification permission answered',
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: { granted: bool(), platform: oneOf('ios', 'android') },
  },
  'notifications:schedule_update': {
    area: 'reminders',
    when: 'Reminder cadence, time or pause saved (observed from the stored preferences)',
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: {
      cadence: oneOf('off', 'weekly', 'few_times', 'every_evening'),
      hour_bucket: oneOf('morning', 'afternoon', 'evening', 'late_evening'),
      paused: bool(),
    },
  },
  'notifications:reminder_cancel': {
    area: 'reminders',
    when: 'A scheduled reminder was skipped',
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: { reason: oneOf('wrote_recently', 'quiet_window', 'weekly_cap', 'paused') },
  },
  'notifications:notification_open': {
    area: 'reminders',
    when: 'User opens the app from a notification (observed). Month-age and birthday notes are never reported',
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: { type: oneOf('letter_reminder', 'family_digest', 'family_letter', 'plan_notice'), variant_id: opt(int(0, 99)) },
  },
  // --- Settings, data, privacy --------------------------------------------------------
  'me:setting_update': {
    area: 'settings',
    when: 'A person-level setting is changed (which one, never the value)',
    reqs: ['C-REQ-034', 'C-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: {
      key: oneOf(
        'reading_size',
        'theme',
        'reminders',
        'languages',
        'lock_screen_names',
        'sensitive_data',
        'pack_cellular',
        'listening_copy',
      ),
    },
  },
  'keeping:export_start': {
    area: 'settings',
    when: 'Export everything started (one ZIP made on the phone)',
    reqs: ['C-REQ-034', 'PRD-REQ-009'],
    level: 'L2',
    tier: 'consented',
    props: { format: oneOf('archive'), letters_bucket: LETTERS_BUCKET },
  },
  'keeping:export_complete': {
    area: 'settings',
    when: 'Export finished and checked',
    reqs: ['C-REQ-034', 'C-NFR-007'],
    level: 'L2',
    tier: 'consented',
    props: {
      format: oneOf('archive'),
      size_bucket: oneOf('lt_10mb', '10_100mb', '100_500mb', 'gt_500mb'),
      duration_bucket: oneOf('lt_30s', '30s_2m', 'gt_2m'),
    },
  },
  'keeping:export_fail': {
    area: 'settings',
    when: 'Export stopped before a file was ready',
    reqs: ['C-REQ-034', 'C-NFR-007'],
    level: 'L2',
    tier: 'consented',
    props: { format: oneOf('archive'), reason: oneOf('cancelled', 'low_space', 'too_large', 'check_failed', 'unknown') },
  },
  // (founder decision 3, ADR 0013). No server of ours sees purchases. ----------
  // Membership engine (D-082, D-083): numbers only. Never the letter, its words, the recording or the child.
  // --- Plus: Apple's SubscriptionStoreView and StoreKit on this device only
  'plus:code_submit': {
    area: 'plus',
    when: "Apple's offer code sheet closed and Plus was on afterwards",
    reqs: ['C-REQ-034'],
    level: 'L2',
    tier: 'consented',
    props: {},
  },
  'plus:restore_complete': {
    area: 'plus',
    when: 'Restore purchases finished',
    reqs: ['C-REQ-034', 'C-NFR-003'],
    level: 'L2',
    tier: 'consented',
    props: { outcome: oneOf('restored', 'nothing', 'cancelled', 'failed', 'unavailable') },
  },
  // One definition per fact (CODE-R13): these two rows are the registry rows, so slot, area, when,
  // level and reqs cannot drift. Edit them in registry.ts only.
  // --- Errors ---------------------------------------------------------------------
  'system:sync_fail': {
    area: 'errors',
    when: 'A sync attempt fails after retries',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    tier: 'consented',
    props: { reason: oneOf('network', 'auth', 'conflict', 'server', 'unknown') },
  },
} as const satisfies Record<string, EventSpec>;

/** Everything typed: the held rows plus the registry (the one definition of each sendable event). */
export const EVENTS = { ...HELD_EVENTS, ...REGISTRY } as const;

export type Catalog = typeof EVENTS;

function shapeOf(p: PropSpec): unknown[] {
  const base: unknown[] = [p.type, p.level, p.optional === true];
  if (p.type === 'enum') base.push([...p.values]);
  if (p.type === 'int') base.push(p.min, p.max);
  return base;
}

function shapeOfProps(props: Readonly<Record<string, PropSpec>>): [string, unknown[]][] {
  return Object.keys(props)
    .sort()
    .map((k) => [k, shapeOf(props[k])]);
}

/**
 * Everything about the catalogue that changes what is sent: event names,
 * levels, property keys, types, values, ranges and optionality, in a stable
 * order. Excludes `when`, `reqs` and `area`, which are documentation.
 */
export function catalogShape(): unknown {
  const events = EVENTS as Record<string, EventSpec>;
  return {
    globals: shapeOfProps(GLOBAL_PROPS),
    events: Object.keys(events)
      .sort()
      .map((name) => [name, events[name].level, shapeOfProps(events[name].props)]),
  };
}
export type EventName = keyof Catalog;

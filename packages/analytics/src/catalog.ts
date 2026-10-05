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
import { CAPTURE_MODES, MEMBER_ROLES, OFFER_TRIGGERS } from '@scribe/core';
import { bool, int, oneOf, opt, type EventSpec, type PropSpec } from './schema';

// ---------------------------------------------------------------------------
// Shared value sets
// ---------------------------------------------------------------------------

export const CHILD_ORDINAL = oneOf('first', 'second', 'third_plus');
export const CHILD_COUNT_BUCKET = oneOf('none', 'one', 'two', 'three_plus');
/**
 * The viewer's role in the current child's book (B section 6). DB values from
 * @scribe/core: the UI's "Co-parent" is `parent` here (CORE-05).
 */
export const MEMBER_ROLE = oneOf(...MEMBER_ROLES);
/** Role an invite grants: the same DB values as MEMBER_ROLE. */
export const INVITE_ROLE = MEMBER_ROLE;
/** Who wrote a letter, relative to the person viewing it. */
export const AUTHOR_RELATION = oneOf('self', 'other_parent', 'family');
/** entries.capture_mode, from @scribe/core (includes `mixed`). */
export const CAPTURE_MODE = oneOf(...CAPTURE_MODES);
/** packages/core PromptKind, plus `none` when no prompt was shown. */
export const PROMPT_KIND = oneOf('opening', 'gap', 'hard', 'family', 'together', 'none');
export const AUDIO_BUCKET = oneOf('lt_15s', '15_60s', '1_2m', '2_5m', 'gt_5m');
export const WORDS_BUCKET = oneOf('lt_25', '25_99', '100_299', '300_plus');
export const LETTERS_BUCKET = oneOf('0', '1', '2_4', '5_9', '10_49', '50_99', '100_364', '365_plus');
export const LATENCY_BUCKET = oneOf('lt_5s', '5_15s', '15_30s', '30_60s', 'gt_60s');
export const DAYS_BUCKET = oneOf('d0', 'd1', 'd2_7', 'd8_30', 'd31_90', 'd91_plus');
export const SESSION_BUCKET = oneOf('lt_1m', '1_5m', '5_15m', 'gt_15m');
/** packages/core EditType (a type test keeps them equal). */
export const EDIT_TYPE = oneOf('filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph');
export const EDIT_SOURCE = oneOf('rule', 'model');
/** packages/core RejectReason (a type test keeps them equal). Why the verifier refused a machine edit. */
export const REJECT_REASON = oneOf(
  'original_mismatch',
  'out_of_bounds',
  'overlaps_protected',
  'overlaps_other_edit',
  'type_not_allowed_at_level',
  'removal_only',
  'not_a_filler',
  'not_a_repeat',
  'false_start_not_repeated',
  'stt_fix_not_dictionary',
  'punctuation_changed_letters',
  'agreement_not_single_word',
  'agreement_stem_mismatch',
  'agreement_limit_per_sentence',
  'paragraph_not_whitespace',
  'inserted_content_word',
  'change_ceiling_exceeded',
  'splits_word',
  'removal_adds_punctuation',
  'changes_negation',
  'changes_tense',
  'changes_modal',
  'changes_word',
  'changes_number',
  'changes_sentence_type',
  'changes_quotes',
  'case_change_not_allowed',
  'case_change_not_sentence_start',
  'removes_negation',
  'repeat_is_emphasis',
  'false_start_complete_phrase',
  'stt_fix_protected_word',
  'stt_fix_not_heard_as',
  'not_vetted_for_language',
);
/** Sign-in methods (apps/mobile src/lib/auth AuthMethod). Passkeys are behind a flag at v1.0. */
export const AUTH_METHOD = oneOf('apple', 'google', 'email', 'passkey');
/** Where the sign-in sheet was opened from (src/lib/auth SignInTrigger). */
export const SIGN_IN_TRIGGER = oneOf('first_letter', 'invite', 'invite_create', 'sign_in', 'settings');
/** packages/core OfferTrigger. */
export const PLUS_TRIGGER = oneOf(...OFFER_TRIGGERS);
export const NETWORK = oneOf('wifi', 'cellular', 'none', 'unknown');
/** Speech model in use, by role (src/lib/models/catalog.ts; ADR 0015). Never a file name or URL. */
export const SPEECH_MODEL = oneOf('turbo', 'small', 'hindi_small', 'zh_turbo', 'server_default', 'none');

/**
 * Spoken-letter languages in v1.0 (founder decision 6, 3 Oct 2026), as ISO
 * 639-1 primary subtags: English, Hindi, Spanish, Mandarin Chinese, French,
 * Arabic, Portuguese. A closed list: a language outside it is never sent.
 */
export const LANG = oneOf('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt');
export type Lang = (typeof LANG.values)[number];
export const V1_LANGUAGES: readonly Lang[] = LANG.values;

/**
 * Downloadable packs (founder decision 15), by a short analytics id derived
 * from the signed manifest's pack id (`packAnalyticsId` in packs.ts). A pack
 * the catalogue does not know is sent as `other`, so failures are still
 * counted, but its id never is.
 */
export const PACK_ID = oneOf(
  'rules_en', 'rules_hi', 'rules_es', 'rules_zh', 'rules_fr', 'rules_ar', 'rules_pt',
  'prompts_en', 'prompts_hi', 'prompts_es', 'prompts_zh', 'prompts_fr', 'prompts_ar', 'prompts_pt',
  'model_vad', 'model_turbo', 'model_small', 'model_hindi_small', 'model_zh_turbo',
  'other',
);
/** src/lib/packs PackFailure. */
export const PACK_FAILURE = oneOf(
  'no_manifest',
  'not_in_manifest',
  'needs_app_update',
  'downloads_paused',
  'waiting_for_wifi',
  'offline',
  'no_space',
  'hash_mismatch',
  'download_failed',
  'cancelled',
  'storage_error',
);

/** Route templates only, never resolved paths (dynamic segments stay literal). Map: routes.ts. */
export const ROUTE = oneOf(
  'tonight',
  'book',
  'family',
  'listen',
  'write',
  'review',
  'letter_detail',
  'onboarding',
  'read_together',
  'sign_in',
  'sign_in_email',
  'sign_in_code',
  'sign_in_verify',
  'sign_in_consent',
  'invite',
  'invite_new',
  'settings',
  'settings_account',
  'settings_appearance',
  'settings_reminders',
  'settings_recordings',
  'settings_child_detail',
  'settings_child_new',
  'settings_privacy',
  'settings_export',
  'settings_language',
  'settings_plus',
  'settings_storage',
  'settings_delete_account',
);

export const ERROR_CODE = oneOf(
  'save_failed',
  'mic_denied',
  'transcription_failed',
  'offline',
  'backup_failed',
  'invite_expired',
  'storage_low',
  'generic',
);

// ---------------------------------------------------------------------------
// Global properties, attached by the client to every event
// ---------------------------------------------------------------------------

/**
 * Sent as event properties, never as PostHog person properties
 * (LEGAL-REQ-017: no person properties beyond the random id).
 */
export const GLOBAL_PROPS = {
  schema_version: int(1, 1000),
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
 */
export const SCHEMA_VERSION = 4;

/**
 * SHA-256 of `JSON.stringify(catalogShape())` per schema version. Versions 1
 * and 2 predate fingerprinting.
 */
export const SCHEMA_FINGERPRINTS: Readonly<Record<number, string>> = Object.freeze({
  3: '971df5e782a0d91011fe559476313e6c40cc52babd65f779bb71422f61ed6a35',
  4: '4d0cc81648b7d3d0cb334e0cd7c38d611f244009f1a5e578b2cb4ecf520750da',
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const EVENTS = {
  // --- App and navigation -------------------------------------------------
  app_cold_start: {
    area: 'app',
    when: 'First frame after a cold start (only once consent exists, so never on first install)',
    reqs: ['A-NFR-001', 'PRD-REQ-016'],
    level: 'L2',
    props: { ttfi_bucket: oneOf('lt_1s', '1_2s', '2_3s', 'gt_3s') },
  },
  app_opened: {
    area: 'app',
    when: 'App comes to the foreground after 30 min or more away, or cold starts',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: {
      source: oneOf('cold', 'warm', 'notification', 'link'),
      days_since_last_open: DAYS_BUCKET,
    },
  },
  app_backgrounded: {
    area: 'app',
    when: 'App goes to the background; carries the session length bucket',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { session_bucket: SESSION_BUCKET },
  },
  screen_view: {
    area: 'app',
    when: 'A route is shown. Sent by our router hook from the route template, never by SDK autocapture',
    reqs: ['ADR-0008', 'PRD-REQ-016'],
    level: 'L2',
    props: { route: ROUTE },
  },

  // --- Consent --------------------------------------------------------------
  analytics_opted_in: {
    area: 'consent',
    when: 'Immediately after the user says yes. Carries a one-time summary of first-run facts the app already stores, because first-run events can never be sent (K-01)',
    reqs: ['PRD-REQ-016', 'K-01'],
    level: 'L2',
    props: {
      surface: oneOf('consent_sheet', 'settings'),
      days_since_install: DAYS_BUCKET,
      letters_bucket: LETTERS_BUCKET,
      signed_in: bool(),
      member_role: MEMBER_ROLE,
      first_letter_mode: oneOf(...CAPTURE_MODES, 'none'),
      time_to_first_letter: oneOf('lt_90s', '90s_5m', '5_30m', '30m_24h', 'gt_24h', 'unknown'),
      came_from_invite: bool(),
    },
  },

  // --- Sign-in (A section 10). Fire only after consent, which in practice
  // means sign-in from Settings, a later invite, or a new session. ----------
  auth_sheet_shown: {
    area: 'entry',
    when: 'Keep the book / sign-in sheet shown',
    reqs: ['PRD-REQ-001', 'PRD-REQ-016'],
    level: 'L2',
    props: { trigger: SIGN_IN_TRIGGER },
  },
  auth_method_selected: {
    area: 'entry',
    when: 'A sign-in method tapped (observed from the auth state)',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { method: AUTH_METHOD },
  },
  auth_succeeded: {
    area: 'entry',
    when: 'A new session exists on this phone (observed from the auth state). New accounts are counted on the server',
    reqs: ['A-NFR-013', 'PRD-REQ-016'],
    level: 'L2',
    props: { method: AUTH_METHOD, had_local_data: bool() },
  },
  auth_failed: {
    area: 'entry',
    when: 'Sign-in failed or was cancelled (observed). An under-18 answer is never sent',
    reqs: ['A-NFR-013'],
    level: 'L2',
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
  auth_email_sent: {
    area: 'entry',
    when: 'Email sign-in link or code sent (observed); attempt counts sends in this sign-in',
    reqs: ['A-NFR-013'],
    level: 'L2',
    props: { attempt: int(1, 10) },
  },
  auth_deferred: {
    area: 'entry',
    when: 'User chose Later on the sign-in sheet',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { trigger: SIGN_IN_TRIGGER },
  },
  signed_out: {
    area: 'entry',
    when: 'The session ended on this phone (observed): by the person, Apple revoked it, account switch, or the session was lost',
    reqs: ['A-NFR-013', 'PRD-REQ-016'],
    level: 'L2',
    props: { reason: oneOf('user', 'apple_revoked', 'switch_account', 'session_lost') },
  },
  invite_opened: {
    area: 'entry',
    when: 'An invite link or code is opened in the app',
    reqs: ['B-REQ-007'],
    level: 'L2',
    props: { via: oneOf('link', 'code', 'paste'), signed_in: bool() },
  },
  local_merge_choice: {
    area: 'entry',
    when: 'User with local letters picks where they go at sign-in',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { choice: oneOf('existing', 'new') },
  },

  // --- Children (K-12) -----------------------------------------------------
  child_added: {
    area: 'children',
    when: 'A child book is created',
    reqs: ['PRD-REQ-011', 'PRD-REQ-015', 'B-REQ-004'],
    level: 'L2',
    props: {
      /**
       * True when a full date (birthday or due date) was entered, false for
       * month only or none. Which kind of date is never sent: it reveals a
       * pregnancy (PPRIV-02).
       */
      has_date: bool(),
      child_ordinal: CHILD_ORDINAL,
      in_first_run: bool(),
      added_together: bool(),
    },
  },
  child_switched: {
    area: 'children',
    when: 'User switches the current book',
    reqs: ['PRD-REQ-012'],
    level: 'L2',
    props: { child_ordinal: CHILD_ORDINAL, surface: oneOf('tonight', 'book', 'review', 'listen') },
  },
  child_setting_changed: {
    area: 'children',
    when: 'A per-child setting is changed (which setting only, never the value)',
    reqs: ['PRD-REQ-013'],
    level: 'L2',
    props: {
      key: oneOf(
        'display_name',
        'nickname',
        'date',
        'photo',
        'book_look',
        'family_can_read',
        'hidden',
        'deleted',
        'signs_as',
        'include_in_reminders',
        'pause_celebrations',
        'auto_add',
      ),
      child_ordinal: CHILD_ORDINAL,
    },
  },
  make_it_yours_card: {
    area: 'children',
    when: 'A post-first-letter "Make it yours" card is acted on',
    reqs: ['B-REQ-004', 'PRD-REQ-016'],
    level: 'L2',
    props: {
      card: oneOf('goals', 'words', 'invite', 'photo'),
      action: oneOf('opened', 'completed', 'skipped'),
    },
  },
  goals_set: {
    area: 'children',
    when: 'What matters goals saved. Count only: goals are L4 (PRD 7.10), so which goals were picked is never sent',
    reqs: ['B-NFR-001', 'PRD-REQ-010'],
    level: 'L2',
    props: { count: int(0, 5) },
  },
  // `languages_set{multilingual}` from B-NFR-001 stays absent. Language usage
  // is measured only by the `languages` events below (one language per event).
  dictionary_term_added: {
    area: 'children',
    when: 'A Names and words term saved (kind only, never the term)',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: {
      kind: oneOf('child', 'nickname', 'family', 'word', 'place', 'self'),
      source: oneOf('settings', 'review_correction', 'onboarding'),
    },
  },

  // --- Capture and review ---------------------------------------------------
  capture_started: {
    area: 'capture',
    when: 'User starts speaking or typing a letter',
    reqs: ['PRD-REQ-016', 'C-REQ-034'],
    level: 'L2',
    props: {
      mode: CAPTURE_MODE,
      source: oneOf('tonight', 'book', 'notification', 'make_it_yours', 'resurface'),
      prompt_kind: PROMPT_KIND,
      child_ordinal: CHILD_ORDINAL,
      member_role: MEMBER_ROLE,
    },
  },
  capture_discarded: {
    area: 'capture',
    when: 'A letter in progress is thrown away before saving',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { mode: CAPTURE_MODE, stage: oneOf('listening', 'review'), audio_bucket: opt(AUDIO_BUCKET) },
  },
  transcription_completed: {
    area: 'capture',
    when: 'A spoken letter finishes transcription, hears no speech, fails, or waits for its language model',
    reqs: ['PRD-REQ-016', 'NFR-7.7'],
    level: 'L2',
    props: {
      engine: oneOf('on_device', 'server'),
      model: SPEECH_MODEL,
      audio_bucket: AUDIO_BUCKET,
      latency_bucket: LATENCY_BUCKET,
      outcome: oneOf('ok', 'no_speech', 'failed', 'queued_for_model'),
    },
  },
  letter_saved: {
    area: 'capture',
    when: 'A letter is saved (to the book or kept private). The core activation and north-star event on device',
    reqs: ['C-REQ-034', 'PRD-REQ-016', 'ADR-0008'],
    level: 'L2',
    props: {
      mode: CAPTURE_MODE,
      destination: oneOf('book', 'private'),
      child_ordinal: CHILD_ORDINAL,
      member_role: MEMBER_ROLE,
      prompt_kind: PROMPT_KIND,
      audio_bucket: opt(AUDIO_BUCKET),
      words_bucket: WORDS_BUCKET,
      machine_edit_count: int(0, 500),
      edits_reverted_count: int(0, 500),
      edits_rejected_count: opt(int(0, 500)),
      engine: oneOf('on_device', 'server', 'none', 'pending'),
      from_notification_2h: bool(),
    },
  },
  review_action: {
    area: 'capture',
    when: 'An action on the Review screen',
    reqs: ['PRD-REQ-016', 'PRD-REQ-012'],
    level: 'L2',
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
  machine_edit_reverted: {
    area: 'capture',
    when: 'A user undoes one machine edit (type and source only). Fidelity health signal for the constitution',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { edit_type: EDIT_TYPE, source: EDIT_SOURCE },
  },
  machine_edit_rejected: {
    area: 'capture',
    when: 'The verifier refused machine edits for a letter: one event per edit type, source and reason, with a count. Never the text or the span',
    reqs: ['PRD-REQ-016', 'B-REQ-003'],
    level: 'L2',
    props: { edit_type: EDIT_TYPE, source: EDIT_SOURCE, reason: REJECT_REASON, count: int(1, 500) },
  },
  letter_deleted: {
    area: 'capture',
    when: 'Own letter deleted or restored within the undo window',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { action: oneOf('deleted', 'restored'), destination: oneOf('book', 'private') },
  },

  // --- Languages and on-demand packs (founder decisions 6 and 15) -----------
  // The only events that carry `lang`. Never add `lang` to letter, capture,
  // book or family events: that would tie a language to letter behaviour.
  language_set: {
    area: 'languages',
    when: 'An author adds, removes or makes primary one spoken-letter language (observed; one language per event)',
    reqs: ['B-REQ-003', 'PRD-REQ-016'],
    level: 'L2',
    props: {
      lang: LANG,
      action: oneOf('added', 'removed', 'made_primary'),
    },
  },
  pack_download: {
    area: 'languages',
    when: 'A language pack or speech model download changes state (observed). Named by analytics pack id and language code only',
    reqs: ['B-REQ-003', 'NFR-7.7'],
    level: 'L2',
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
  book_opened: {
    area: 'book',
    when: 'Book tab shown for a child',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { child_ordinal: CHILD_ORDINAL, letters_bucket: LETTERS_BUCKET, member_role: MEMBER_ROLE },
  },
  letter_opened: {
    area: 'book',
    when: 'A letter is opened to read',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { author_relation: AUTHOR_RELATION, has_audio: bool() },
  },
  playback_started: {
    area: 'book',
    when: 'A recording starts playing',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: {
      surface: oneOf('letter', 'review', 'read_together'),
      author_relation: AUTHOR_RELATION,
      version: oneOf('listening_copy', 'original'),
    },
  },
  read_together_started: {
    area: 'book',
    when: 'Read together session starts',
    reqs: ['C-REQ-034', 'PRD-REQ-016'],
    level: 'L2',
    props: { child_ordinal: CHILD_ORDINAL, access: oneOf('plus', 'free'), letters_bucket: LETTERS_BUCKET },
  },
  read_together_ended: {
    area: 'book',
    when: 'Read together session ends',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: {
      reason: oneOf('finished', 'stopped', 'interrupted'),
      session_bucket: SESSION_BUCKET,
      letters_heard: int(0, 50),
    },
  },

  // --- Family (co-parent only at v1.0, founder decision 5) -------------------
  invite_created: {
    area: 'family',
    when: 'A parent creates an invite',
    reqs: ['B-REQ-007', 'B-NFR-001', 'PRD-REQ-014'],
    level: 'L2',
    props: {
      role: INVITE_ROLE,
      channel: oneOf('share_sheet', 'copy_link', 'code'),
      shared: bool(),
      child_ordinal: CHILD_ORDINAL,
    },
  },
  invite_accepted: {
    area: 'family',
    when: 'An invite is accepted in the app (observed). Server aggregates count every acceptance',
    reqs: ['B-NFR-001'],
    level: 'L2',
    props: { role: INVITE_ROLE, surface: oneOf('app') },
  },
  invite_failed: {
    area: 'family',
    when: 'Creating or accepting an invite failed (the reason class only)',
    reqs: ['B-REQ-007'],
    level: 'L2',
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
  family_letter_reviewed: {
    area: 'family',
    when: 'A parent decides on a family letter',
    reqs: ['B-REQ-009', 'B-NFR-001'],
    level: 'L2',
    props: { decision: oneOf('added', 'kept_aside') },
  },
  member_removed: {
    area: 'family',
    when: 'A parent removes a member',
    reqs: ['B-REQ-010'],
    level: 'L2',
    props: { role: INVITE_ROLE },
  },
  member_left: {
    area: 'family',
    when: 'A member leaves a book',
    reqs: ['B-REQ-010'],
    level: 'L2',
    props: { role: MEMBER_ROLE, letters: oneOf('keep', 'take_out') },
  },

  // --- Reminders (C-REQ-034) -----------------------------------------------------
  reminder_prime_shown: {
    area: 'reminders',
    when: 'Reminder priming card shown',
    reqs: ['C-REQ-034', 'PRD-REQ-001'],
    level: 'L2',
    props: { source: oneOf('tonight', 'settings', 'family_first_letter') },
  },
  reminder_prime_result: {
    area: 'reminders',
    when: 'Priming card answered',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { choice: oneOf('yes', 'not_now') },
  },
  os_permission_result: {
    area: 'reminders',
    when: 'OS notification permission answered',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { granted: bool(), platform: oneOf('ios', 'android') },
  },
  reminder_schedule_set: {
    area: 'reminders',
    when: 'Reminder cadence, time or pause saved (observed from the stored preferences)',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: {
      cadence: oneOf('off', 'weekly', 'few_times', 'every_evening'),
      hour_bucket: oneOf('morning', 'afternoon', 'evening', 'late_evening'),
      paused: bool(),
    },
  },
  reminder_sent: {
    area: 'reminders',
    when: 'Logged on next foreground for a local evening reminder that fired. Month-age and birthday notes are excluded because their timing reveals the birth date',
    reqs: ['C-REQ-034', 'C-NFR-001'],
    level: 'L2',
    props: { type: oneOf('letter_reminder', 'family_digest'), variant_id: opt(int(0, 99)) },
  },
  reminder_suppressed: {
    area: 'reminders',
    when: 'A scheduled reminder was skipped',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { reason: oneOf('wrote_recently', 'quiet_window', 'weekly_cap', 'paused') },
  },
  notification_opened: {
    area: 'reminders',
    when: 'User opens the app from a notification (observed). Month-age and birthday notes are never reported',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { type: oneOf('letter_reminder', 'family_digest', 'family_letter', 'plan_notice'), variant_id: opt(int(0, 99)) },
  },

  // --- Celebrate ---------------------------------------------------------------------
  moment_shown: {
    area: 'celebrate',
    when: 'A quiet milestone card is shown. Month-chapter and Year One are excluded: they fire on dates set by the birthday',
    reqs: ['C-REQ-034', 'C-REQ-010'],
    level: 'L2',
    props: {
      type: oneOf(
        'first_letter',
        'letters_10',
        'letters_50',
        'letters_100',
        'letters_365',
        'first_family_letter',
        'first_read_together',
      ),
    },
  },
  resurface_shown: {
    area: 'celebrate',
    when: 'An "On this day" card is shown',
    reqs: ['C-REQ-034', 'C-REQ-014'],
    level: 'L2',
    props: { kind: oneOf('one_month', 'one_year') },
  },
  resurface_opened: {
    area: 'celebrate',
    when: 'An "On this day" card is opened',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { kind: oneOf('one_month', 'one_year') },
  },

  // --- Settings, data, privacy --------------------------------------------------------
  settings_changed: {
    area: 'settings',
    when: 'A person-level setting is changed (which one, never the value)',
    reqs: ['C-REQ-034', 'C-REQ-016'],
    level: 'L2',
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
  export_started: {
    area: 'settings',
    when: 'Export everything started (one ZIP made on the phone)',
    reqs: ['C-REQ-034', 'PRD-REQ-009'],
    level: 'L2',
    props: { format: oneOf('archive'), letters_bucket: LETTERS_BUCKET },
  },
  export_completed: {
    area: 'settings',
    when: 'Export finished and checked',
    reqs: ['C-REQ-034', 'C-NFR-007'],
    level: 'L2',
    props: {
      format: oneOf('archive'),
      size_bucket: oneOf('lt_10mb', '10_100mb', '100_500mb', 'gt_500mb'),
      duration_bucket: oneOf('lt_30s', '30s_2m', 'gt_2m'),
    },
  },
  export_failed: {
    area: 'settings',
    when: 'Export stopped before a file was ready',
    reqs: ['C-REQ-034', 'C-NFR-007'],
    level: 'L2',
    props: { format: oneOf('archive'), reason: oneOf('cancelled', 'low_space', 'too_large', 'check_failed', 'unknown') },
  },
  export_shared: {
    area: 'settings',
    when: 'The share sheet for a finished export closed',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { result: oneOf('shared', 'dismissed') },
  },
  account_deletion: {
    area: 'settings',
    when: 'Account deletion flow step. `confirmed` is the last event ever sent for this id',
    reqs: ['C-REQ-034', 'PRD-REQ-018'],
    level: 'L2',
    props: { stage: oneOf('started', 'export_offered', 'confirmed', 'undone') },
  },

  // --- Plus: Apple's SubscriptionStoreView and StoreKit on this device only
  // (founder decision 3, ADR 0013). No server of ours sees purchases. ----------
  plus_offer_viewed: {
    area: 'plus',
    when: "Apple's subscription store view presented",
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER },
  },
  plus_offer_closed: {
    area: 'plus',
    when: "Apple's subscription store view closed",
    reqs: ['C-REQ-034', 'C-NFR-002'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER, outcome: oneOf('purchased', 'dismissed', 'unavailable') },
  },
  plan_changed: {
    area: 'plus',
    when: 'The plan StoreKit reports on this device changed state (observed; production transactions only)',
    reqs: ['C-REQ-034', 'C-NFR-002'],
    level: 'L2',
    props: {
      from_state: oneOf('none', 'trial', 'active', 'grace', 'billing_retry', 'expired', 'refunded', 'revoked'),
      to_state: oneOf('none', 'trial', 'active', 'grace', 'billing_retry', 'expired', 'refunded', 'revoked'),
      period: oneOf('month', 'year', 'unknown'),
      ownership: oneOf('purchased', 'family_shared', 'unknown'),
    },
  },
  // Membership engine (D-082, D-083): numbers only. Never the letter, its words, the recording or the child.
  free_allowance_reached: {
    area: 'plus',
    when: 'The last free letter was kept, so the next Keep will ask for Plus (once per phone)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { allowance: int(2, 100) },
  },
  keep_gate_shown: {
    area: 'plus',
    when: 'The Keep sheet asked for Plus (the letter is held on the phone)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000), allowance: int(2, 100), lapsed: int(0, 1) },
  },
  letter_held: {
    area: 'plus',
    when: 'The person chose to keep the letter on the phone for now instead of starting Plus',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000) },
  },
  plus_started_from_gate: {
    area: 'plus',
    when: 'Plus was on after the Keep sheet (bought, restored, an Ask to Buy approval, or an offer code)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000) },
  },
  offer_code_redeemed: {
    area: 'plus',
    when: "Apple's offer code sheet closed and Plus was on afterwards",
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: {},
  },
  restore_result: {
    area: 'plus',
    when: 'Restore purchases finished',
    reqs: ['C-REQ-034', 'C-NFR-003'],
    level: 'L2',
    props: { outcome: oneOf('restored', 'nothing', 'cancelled', 'failed', 'unavailable') },
  },

  // --- Errors ---------------------------------------------------------------------
  error_shown: {
    area: 'errors',
    when: 'A user-facing error from strings `errors.*` is shown',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { code: ERROR_CODE },
  },
  sync_failed: {
    area: 'errors',
    when: 'A sync attempt fails after retries',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { reason: oneOf('network', 'auth', 'conflict', 'server', 'unknown') },
  },
} as const satisfies Record<string, EventSpec>;

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

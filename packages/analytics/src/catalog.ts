/**
 * The analytics event catalogue: the ONLY events and properties that may
 * leave the device (PRD-REQ-016, LEGAL-REQ-017). Human-readable version with
 * metrics and rationale: docs/analytics/TRACKING_PLAN.md. A test fails if the
 * two drift apart.
 *
 * Rules for adding an event (read TRACKING_PLAN.md section 6 first):
 * - Enums, booleans and bounded integers only. No free text, ids, names,
 *   dates or anything derived from letter content.
 * - Language appears only as `lang` (one of the seven v1.0 spoken-letter
 *   languages, ISO 639-1) on the `languages` events below, never next to a
 *   letter, capture or book event (TRACKING_PLAN 6.2, DATA_CLASSIFICATION
 *   4.7.1; counsel review pending).
 * - Children appear only as `child_ordinal` or `child_count_bucket`.
 * - No event may fire at a time set by a child's birthday or due date
 *   (the timestamp itself would leak an L4 date). See TRACKING_PLAN 6.4.
 * - Every property is L2 and every event cites the requirement it serves.
 */
import { bool, int, oneOf, opt, type EventSpec } from './schema';

// ---------------------------------------------------------------------------
// Shared value sets
// ---------------------------------------------------------------------------

export const CHILD_ORDINAL = oneOf('first', 'second', 'third_plus');
export const CHILD_COUNT_BUCKET = oneOf('none', 'one', 'two', 'three_plus');
/** The viewer's role in the current child's book (B section 6). */
export const MEMBER_ROLE = oneOf('parent', 'contributor');
export const INVITE_ROLE = oneOf('co_parent', 'contributor');
/** Who wrote a letter, relative to the person viewing it. */
export const AUTHOR_RELATION = oneOf('self', 'other_parent', 'family');
export const CAPTURE_MODE = oneOf('spoken', 'typed');
/** packages/core PromptKind, plus `none` when no prompt was shown. */
export const PROMPT_KIND = oneOf('opening', 'gap', 'hard', 'family', 'together', 'none');
export const AUDIO_BUCKET = oneOf('lt_15s', '15_60s', '1_2m', '2_5m', 'gt_5m');
export const WORDS_BUCKET = oneOf('lt_25', '25_99', '100_299', '300_plus');
export const LETTERS_BUCKET = oneOf('0', '1', '2_4', '5_9', '10_49', '50_99', '100_364', '365_plus');
export const LATENCY_BUCKET = oneOf('lt_5s', '5_15s', '15_30s', '30_60s', 'gt_60s');
export const DAYS_BUCKET = oneOf('d0', 'd1', 'd2_7', 'd8_30', 'd31_90', 'd91_plus');
export const SESSION_BUCKET = oneOf('lt_1m', '1_5m', '5_15m', 'gt_15m');
/** packages/core EditType. */
export const EDIT_TYPE = oneOf('filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph');
export const AUTH_METHOD = oneOf('apple', 'google', 'email');
/** Apple subscriptions only (founder decision 3, 3 Oct 2026; ADR 0013). Gifts are P1 (C-REQ-030). */
export const PLUS_PRODUCT = oneOf('monthly', 'annual', 'gift');
export const PLUS_TRIGGER = oneOf('chapter_complete', 'second_child', 'backup', 'read_together', 'themes', 'settings');
export const NETWORK = oneOf('wifi', 'cellular');

/**
 * Spoken-letter languages in v1.0 (founder decision 6, 3 Oct 2026), as ISO
 * 639-1 primary subtags: English, Hindi, Spanish, Mandarin Chinese, French,
 * Arabic, Portuguese. A closed list: a language outside it is never sent.
 */
export const LANG = oneOf('en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt');
export type Lang = (typeof LANG.values)[number];
export const V1_LANGUAGES: readonly Lang[] = LANG.values;
/**
 * What a downloadable pack holds (founder decision 15): `text_rules` is the
 * versioned JSON (rules, filler and negation tables, punctuation profile,
 * phonetic tables, prompt text); `speech_model` is a per-language model file.
 * A pack is identified in analytics by (lang, pack_kind, pack_version), never
 * by the manifest's id string or URL.
 */
export const PACK_KIND = oneOf('text_rules', 'speech_model');

/** Route templates only, never resolved paths (dynamic segments stay literal). */
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
  'invite',
  'plus_sheet',
  'settings',
  'settings_appearance',
  'settings_reminders',
  'settings_recordings',
  'settings_children',
  'settings_child_detail',
  'settings_child_new',
  'settings_privacy',
  'settings_your_data',
  'settings_export',
  'settings_languages',
  'settings_help_legal',
  'settings_about',
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

/** Bump when an event or property changes meaning. */
export const SCHEMA_VERSION = 1;

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
    when: 'A route is shown. Sent by our router hook, never by SDK autocapture',
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
      first_letter_mode: oneOf('spoken', 'typed', 'none'),
      time_to_first_letter: oneOf('lt_90s', '90s_5m', '5_30m', '30m_24h', 'gt_24h', 'unknown'),
      came_from_invite: bool(),
    },
  },

  // --- Intro and sign-in (A section 10). Fire only after consent, which in
  // practice means sign-in from Settings, backup or a later invite. --------
  intro_story_view: {
    area: 'entry',
    when: 'An intro story is shown (reachable after consent only via replay)',
    reqs: ['A-REQ-034', 'C-REQ-034'],
    level: 'L2',
    props: { index: int(1, 4), via: oneOf('auto', 'tap', 'swipe'), variant: oneOf('a', 'b') },
  },
  intro_paused: {
    area: 'entry',
    when: 'Intro auto-advance paused',
    reqs: ['A-NFR-006'],
    level: 'L2',
    props: { index: int(1, 4) },
  },
  intro_skipped: {
    area: 'entry',
    when: 'Intro skipped',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { index: int(1, 4) },
  },
  intro_action: {
    area: 'entry',
    when: 'Intro exit action chosen',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { action: oneOf('start', 'invited', 'sign_in'), stories_seen: int(0, 4) },
  },
  auth_sheet_shown: {
    area: 'entry',
    when: 'Keep the book / sign-in sheet shown',
    reqs: ['PRD-REQ-001', 'PRD-REQ-016'],
    level: 'L2',
    props: { trigger: oneOf('first_letter', 'invite', 'backup', 'third_letter', 'sign_in', 'settings') },
  },
  auth_method_selected: {
    area: 'entry',
    when: 'A sign-in provider tapped',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { method: AUTH_METHOD },
  },
  auth_succeeded: {
    area: 'entry',
    when: 'Sign-in completed',
    reqs: ['A-NFR-013', 'PRD-REQ-016'],
    level: 'L2',
    props: { method: AUTH_METHOD, new_user: bool(), had_local_data: bool(), linked_existing: bool() },
  },
  auth_failed: {
    area: 'entry',
    when: 'Sign-in failed or was cancelled',
    reqs: ['A-NFR-013'],
    level: 'L2',
    props: {
      method: AUTH_METHOD,
      reason: oneOf('cancelled', 'network', 'expired', 'used', 'wrong_code', 'rate_limited', 'provider', 'unknown'),
    },
  },
  auth_email_sent: {
    area: 'entry',
    when: 'Email sign-in link or code sent',
    reqs: ['A-NFR-013'],
    level: 'L2',
    props: { attempt: int(1, 10) },
  },
  auth_email_verified: {
    area: 'entry',
    when: 'Email sign-in verified',
    reqs: ['A-NFR-013'],
    level: 'L2',
    props: { via: oneOf('universal_link', 'scheme', 'code') },
  },
  auth_deferred: {
    area: 'entry',
    when: 'User chose Later on the sign-in sheet',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { trigger: oneOf('first_letter', 'invite', 'backup', 'third_letter', 'sign_in', 'settings') },
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
      mode: oneOf('birthday', 'due_date', 'month_only'),
      ordinal: CHILD_ORDINAL,
      in_first_run: bool(),
      added_together: bool(),
    },
  },
  child_switched: {
    area: 'children',
    when: 'User switches the current book',
    reqs: ['PRD-REQ-012'],
    level: 'L2',
    props: { ordinal: CHILD_ORDINAL, surface: oneOf('tonight', 'book', 'review', 'listen') },
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
      ordinal: CHILD_ORDINAL,
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
    when: 'A spoken letter finishes transcription (or fails / waits for the model)',
    reqs: ['PRD-REQ-016', 'NFR-7.7'],
    level: 'L2',
    props: {
      engine: oneOf('on_device', 'server'),
      model: oneOf('turbo', 'small', 'server_default'),
      audio_bucket: AUDIO_BUCKET,
      latency_bucket: LATENCY_BUCKET,
      outcome: oneOf('ok', 'failed', 'queued_for_model'),
    },
  },
  model_download: {
    area: 'capture',
    when: 'Speech model download state changes',
    reqs: ['NFR-7.7'],
    level: 'L2',
    props: {
      stage: oneOf('started', 'completed', 'failed', 'removed'),
      model: oneOf('turbo', 'small'),
      network: NETWORK,
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
    props: { edit_type: EDIT_TYPE, source: oneOf('rule', 'model') },
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
    when: 'An author adds or removes one spoken-letter language (which of the seven only; one language per event)',
    reqs: ['B-REQ-003', 'PRD-REQ-016'],
    level: 'L2',
    props: {
      lang: LANG,
      action: oneOf('added', 'removed'),
      surface: oneOf('settings', 'capture'),
    },
  },
  pack_download: {
    area: 'languages',
    when: 'A language pack download changes state; the pack is named by language, kind and manifest version only',
    reqs: ['B-REQ-003', 'NFR-7.7'],
    level: 'L2',
    props: {
      lang: LANG,
      pack_kind: PACK_KIND,
      pack_version: int(1, 1000),
      stage: oneOf('started', 'completed', 'failed', 'removed'),
      failure: opt(oneOf('network', 'storage_full', 'hash_mismatch', 'signature_invalid', 'cancelled', 'unknown')),
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
    props: { surface: oneOf('letter', 'review', 'read_together'), author_relation: AUTHOR_RELATION },
  },
  read_together_started: {
    area: 'book',
    when: 'Read together session starts',
    reqs: ['C-REQ-034', 'PRD-REQ-016'],
    level: 'L2',
    props: { child_ordinal: CHILD_ORDINAL, access: oneOf('plus', 'try'), letters_bucket: LETTERS_BUCKET },
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
  read_together_try_used: {
    area: 'book',
    when: 'A free Read together try is used (Free tier)',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { n: int(1, 10) },
  },

  // --- Family -----------------------------------------------------------------
  invite_created: {
    area: 'family',
    when: 'A parent creates an invite',
    reqs: ['B-REQ-007', 'B-NFR-001', 'PRD-REQ-014'],
    level: 'L2',
    props: {
      role: INVITE_ROLE,
      channel: oneOf('share_sheet', 'copy_link', 'code'),
      large_print: bool(),
      child_ordinal: CHILD_ORDINAL,
    },
  },
  invite_accepted: {
    area: 'family',
    when: 'An invite is accepted in the app (web page acceptances come from server aggregates)',
    reqs: ['B-NFR-001'],
    level: 'L2',
    props: { role: INVITE_ROLE, surface: oneOf('app') },
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
    props: { role: oneOf('co_parent', 'contributor'), letters: oneOf('keep', 'take_out') },
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
    when: 'Reminder cadence or time saved',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: {
      cadence: oneOf('off', 'weekly', 'two_a_week', 'three_a_week'),
      hour_bucket: oneOf('morning', 'afternoon', 'evening', 'late_evening'),
    },
  },
  reminder_sent: {
    area: 'reminders',
    when: 'Logged on next foreground for a local reminder that fired. Letter reminders only: month-age and birthday notes are excluded because their timing reveals the birth date',
    reqs: ['C-REQ-034', 'C-NFR-001'],
    level: 'L2',
    props: { type: oneOf('letter_reminder', 'family_digest'), variant_id: int(0, 99) },
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
    when: 'User opens the app from a notification',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { type: oneOf('letter_reminder', 'family_digest', 'family_letter', 'plan_notice'), variant_id: int(0, 99) },
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
        'ai_processing',
        'sensitive_data',
        'backup_mode',
        'model_download_network',
      ),
    },
  },
  backup_mode_set: {
    area: 'settings',
    when: 'Backup mode chosen',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { mode: oneOf('off', 'standard', 'vault') },
  },
  export_started: {
    area: 'settings',
    when: 'Export started',
    reqs: ['C-REQ-034', 'PRD-REQ-009'],
    level: 'L2',
    props: { format: oneOf('pdf', 'archive', 'audio') },
  },
  export_completed: {
    area: 'settings',
    when: 'Export finished',
    reqs: ['C-REQ-034', 'C-NFR-007'],
    level: 'L2',
    props: {
      format: oneOf('pdf', 'archive', 'audio'),
      size_bucket: oneOf('lt_10mb', '10_100mb', '100_500mb', 'gt_500mb'),
      duration_bucket: oneOf('lt_30s', '30s_2m', 'gt_2m'),
    },
  },
  account_deletion: {
    area: 'settings',
    when: 'Account deletion flow step. `confirmed` is the last event ever sent for this id',
    reqs: ['C-REQ-034', 'PRD-REQ-018'],
    level: 'L2',
    props: { stage: oneOf('started', 'export_offered', 'confirmed', 'undone') },
  },

  // --- Plus (device side only). Billing is Apple's alone (founder decision 3):
  // no server of ours sees purchases, so renewals, refunds and churn come from
  // App Store Connect reports, never from events (TRACKING_PLAN section 2). ---
  plus_offer_viewed: {
    area: 'plus',
    when: 'Plus sheet shown',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER, arm: oneOf('a', 'b', 'c') },
  },
  plus_offer_dismissed: {
    area: 'plus',
    when: 'Plus sheet closed without purchase',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER },
  },
  purchase_started: {
    area: 'plus',
    when: 'Store purchase sheet requested',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { product: PLUS_PRODUCT, trigger: PLUS_TRIGGER },
  },
  trial_started: {
    area: 'plus',
    when: 'Store reports a successful trial start on this device',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: { product: PLUS_PRODUCT },
  },
  purchase_succeeded: {
    area: 'plus',
    when: 'Store reports a successful paid purchase (no trial) on this device',
    reqs: ['C-REQ-034', 'C-NFR-002'],
    level: 'L2',
    props: { product: PLUS_PRODUCT },
  },
  purchase_failed: {
    area: 'plus',
    when: 'Purchase failed or was cancelled',
    reqs: ['C-REQ-034', 'C-NFR-002'],
    level: 'L2',
    props: { error_class: oneOf('cancelled', 'network', 'store', 'pending', 'not_allowed', 'unknown') },
  },
  restore_result: {
    area: 'plus',
    when: 'Restore purchases finished',
    reqs: ['C-REQ-034', 'C-NFR-003'],
    level: 'L2',
    props: { outcome: oneOf('restored', 'nothing_to_restore', 'failed') },
  },
  gift_purchased: {
    area: 'plus',
    when: 'A gift was bought on this device',
    reqs: ['C-REQ-034'],
    level: 'L2',
    props: {},
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
export type EventName = keyof Catalog;

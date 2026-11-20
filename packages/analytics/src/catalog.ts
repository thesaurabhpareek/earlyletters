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
import { REGISTRY } from './registry';
import {
  AUTHOR_RELATION,
  AUTH_METHOD,
  CHILD_COUNT_BUCKET,
  CHILD_ORDINAL,
  EDIT_SOURCE,
  EDIT_TYPE,
  INVITE_ROLE,
  LANG,
  LETTERS_BUCKET,
  MEMBER_ROLE,
  NETWORK,
  PACK_FAILURE,
  PACK_ID,
  REJECT_REASON,
  SESSION_BUCKET,
  SIGN_IN_TRIGGER,
} from './values';

export * from './values';

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
 * 5: two content-free events for the co-parent teaser (`coparent_soon_opened`, `coparent_soon_notify`, D-087).
 * 6: verifier reason `changes_invisible` (WP-F06-02, R-01 D4).
 * 7: `reminder_prime_shown.source` gains `first_letter` (the reminder card after the first letter, SET-02).
 * 9: the registry (registry.ts): 24 sendable events, each with a stage and the one decision it informs; adds
 *    `control_tapped`, `surface_impressed` and `perf_measured`; `app_cold_start` and 43 other events are held, not sendable (founder, 20 Nov 2026).
 * 8: `coparent_soon_opened` and `coparent_soon_notify` removed: there is no co-parent coming-soon screen any more (founder, 11 Nov 2026).
 */
export const SCHEMA_VERSION = 9;

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
  9: '3481c51e230d8c2776cb60ad883addf21a9fa583a199de0b3ed22620e55056d4',
});

/**
 * HELD events: the catalogue as it stood before the registry (68 events). They are NOT sendable. Each one
 * either moves to registry.ts with the one decision it informs, or is deleted together with its call site.
 */
export const HELD_EVENTS = {
  // --- App and navigation -------------------------------------------------
  app_cold_start: {
    area: 'app',
    when: 'First frame after a cold start (only once consent exists, so never on first install)',
    reqs: ['A-NFR-001', 'PRD-REQ-016'],
    level: 'L2',
    props: { ttfi_bucket: oneOf('lt_1s', '1_2s', '2_3s', 'gt_3s') },
  },
  app_backgrounded: {
    area: 'app',
    when: 'App goes to the background; carries the session length bucket',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { session_bucket: SESSION_BUCKET },
  },

  // --- Consent --------------------------------------------------------------

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
    props: { source: oneOf('tonight', 'settings', 'family_first_letter', 'first_letter') },
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
  // Membership engine (D-082, D-083): numbers only. Never the letter, its words, the recording or the child.
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
  sync_failed: {
    area: 'errors',
    when: 'A sync attempt fails after retries',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { reason: oneOf('network', 'auth', 'conflict', 'server', 'unknown') },
  },
} as const satisfies Record<string, EventSpec>;

/**
 * Every typed event name. Only the rows in registry.ts (REGISTRY) may be sent; a held name still type-checks
 * for the call sites that exist today but is dropped and counted at run time (validate.ts), until it is
 * registered with a decision or its call site is removed.
 */
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

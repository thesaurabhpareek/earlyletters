/**
 * THE registry: the one file that names every event and property that may
 * leave the phone (Karma ruling, 20 Nov 2026). Call sites use `EV` and
 * `PROP`, never string literals, so a rename (the coming PostHog convention,
 * docs/instr-posthog-standard) is an edit to this file alone.
 *
 * Founder rules (20 Nov 2026):
 * - Log only what is precise and important. Every row names the ONE decision
 *   it informs (`decision`). If an event cannot, it is not added.
 * - About 25 events: basics (screen, key taps, a few impressions, five timed
 *   steps) plus the steps behind weekly making families (FR-DAT-21):
 *   activation, capture, keep, return and Plus.
 * - Registry-driven sending is the only path. A name or property that is not
 *   here is dropped and counted (validate.ts).
 * - No row for the birthday-week Save a copy slip, Days notes, or email opens
 *   and clicks (FR-DAT-27); no row may fire at a time a birthday or due date
 *   sets. A test pins the absences.
 * - Enums, booleans and bounded integers only; nothing from religion, region,
 *   background, child name, dates of birth, transcripts, audio, photos or entry
 *   text (schema.ts, ADR 0008, LEGAL-REQ-017).
 */
import { CAPTURE_MODES } from '@scribe/core';
import { bool, int, oneOf, opt, type EventSpec } from './schema';
import {
  AUDIO_BUCKET,
  AUTHOR_RELATION,
  AUTH_METHOD,
  CAPTURE_MODE,
  CHILD_ORDINAL,
  DAYS_BUCKET,
  ERROR_CODE,
  INVITE_ROLE,
  LATENCY_BUCKET,
  LETTERS_BUCKET,
  MEMBER_ROLE,
  PLUS_TRIGGER,
  PROMPT_KIND,
  ROUTE,
  SPEECH_MODEL,
  WORDS_BUCKET,
} from './values';

export type Stage = 'basics' | 'activation' | 'capture' | 'keep' | 'return' | 'plus';

/** A catalogue row plus the funnel stage and the one decision it informs. */
export interface RegistryRow extends EventSpec {
  readonly stage: Stage;
  /** The one decision this event informs, in plain words. Empty means the row may not exist. */
  readonly decision: string;
}

/** Key controls we count taps on. A control id is a slug, never shown text. */
export const CONTROL = oneOf(
  'tonight_speak',
  'tonight_write',
  'review_keep',
  'review_play_back',
  'book_read_together',
  'keep_sheet_start_plus',
  'keep_sheet_hold',
  'invite_share',
);

/** The few surfaces whose impressions we count because we will change them. */
export const SURFACE = oneOf('tonight_prompt', 'keep_sheet', 'reminder_card', 'invite_card');

/** The five timed steps. */
export const PERF_METRIC = oneOf('cold_start', 'speak_to_mic', 'save_commit', 'book_first_render', 'transcription_ready');

/** Shared time bucket for `perf_measured`. */
export const MS_BUCKET = oneOf('lt_100ms', '100_300ms', '300ms_1s', '1_3s', '3_10s', 'gt_10s');

export const REGISTRY = {
  screen_view: {
    stage: 'basics',
    decision: "Which screens families actually reach, so we cut or move the ones nobody opens.",
    area: 'app',
    when: 'A route is shown. Sent by our router hook from the route template, never by SDK autocapture',
    reqs: ['ADR-0008', 'PRD-REQ-016'],
    level: 'L2',
    props: { route: ROUTE },
  },
  app_opened: {
    stage: 'return',
    decision: "How many weeks a family comes back and how they got in (reminder, link or by hand), so we know whether reminders earn their place.",
    area: 'app',
    when: 'App comes to the foreground after 30 min or more away, or cold starts',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: {
      source: oneOf('cold', 'warm', 'notification', 'link'),
      days_since_last_open: DAYS_BUCKET,
    },
  },
  analytics_opted_in: {
    stage: 'activation',
    decision: "How far a family had got when they said yes (first-run facts we could never send before), so we can judge the install to first letter step.",
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
  auth_succeeded: {
    stage: 'activation',
    decision: "How many families who start a book go on to keep it with an account, so we decide whether the Keep sheet asks at the right moment.",
    area: 'entry',
    when: 'A new session exists on this phone (observed from the auth state). New accounts are counted on the server',
    reqs: ['A-NFR-013', 'PRD-REQ-016'],
    level: 'L2',
    props: { method: AUTH_METHOD, had_local_data: bool() },
  },
  child_added: {
    stage: 'activation',
    decision: "Whether a family finishes setting up a book during first run, so we decide what the first-run flow can drop.",
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
  capture_started: {
    stage: 'capture',
    decision: "How many families begin a letter by speaking or typing, so we decide which one Home leads with.",
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
    stage: 'capture',
    decision: "Where letters are thrown away before saving, so we decide whether the capture screens need fixing.",
    area: 'capture',
    when: 'A letter in progress is thrown away before saving',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { mode: CAPTURE_MODE, stage: oneOf('listening', 'review'), audio_bucket: opt(AUDIO_BUCKET) },
  },
  transcription_completed: {
    stage: 'capture',
    decision: "Whether spoken letters finish turning into words, so we decide whether to hold other work to fix speech.",
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
    stage: 'capture',
    decision: "How many families save a letter and how, the count behind weekly making families, so we decide what to build next.",
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
  free_allowance_reached: {
    stage: 'keep',
    decision: "How many families reach the end of the free letters, so we size the Plus audience.",
    area: 'plus',
    when: 'The last free letter was kept, so the next Keep will ask for Plus (once per phone)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { allowance: int(2, 100) },
  },
  keep_gate_shown: {
    stage: 'keep',
    decision: "How many families meet the Keep sheet, so we judge whether the free allowance is set right.",
    area: 'plus',
    when: 'The Keep sheet asked for Plus (the letter is held on the phone)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000), allowance: int(2, 100), lapsed: int(0, 1) },
  },
  letter_held: {
    stage: 'keep',
    decision: "How many families keep a letter on the phone instead of starting Plus, so we judge what the Keep sheet costs in trust.",
    area: 'plus',
    when: 'The person chose to keep the letter on the phone for now instead of starting Plus',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000) },
  },
  plus_started_from_gate: {
    stage: 'plus',
    decision: "How many families start Plus from the Keep sheet, so we decide whether to change the sheet or the offer.",
    area: 'plus',
    when: 'Plus was on after the Keep sheet (bought, restored, an Ask to Buy approval, or an offer code)',
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { letters_kept: int(0, 1000) },
  },
  book_opened: {
    stage: 'return',
    decision: "Whether families come back to read their book, so we decide how much to invest in reading.",
    area: 'book',
    when: 'Book tab shown for a child',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { child_ordinal: CHILD_ORDINAL, letters_bucket: LETTERS_BUCKET, member_role: MEMBER_ROLE },
  },
  letter_opened: {
    stage: 'return',
    decision: "Whether families read letters, theirs or another parent's, so we decide how much to invest in reading together.",
    area: 'book',
    when: 'A letter is opened to read',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { author_relation: AUTHOR_RELATION, has_audio: bool() },
  },
  invite_created: {
    stage: 'return',
    decision: "How many families invite another parent, so we decide whether to invest in the family flow.",
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
    stage: 'return',
    decision: "How many invites end with a second parent in the book, so we decide whether to fix the invite steps.",
    area: 'family',
    when: 'An invite is accepted in the app (observed). Server aggregates count every acceptance',
    reqs: ['B-NFR-001'],
    level: 'L2',
    props: { role: INVITE_ROLE, surface: oneOf('app') },
  },
  plus_offer_viewed: {
    stage: 'plus',
    decision: "How many families see Apple's Plus offer and from where, so we decide where the offer should appear.",
    area: 'plus',
    when: "Apple's subscription store view presented",
    reqs: ['C-REQ-034', 'C-REQ-023'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER },
  },
  plus_offer_closed: {
    stage: 'plus',
    decision: "How the Plus offer ends (bought, dismissed, unavailable), so we decide whether the offer or its price is the problem.",
    area: 'plus',
    when: "Apple's subscription store view closed",
    reqs: ['C-REQ-034', 'C-NFR-002'],
    level: 'L2',
    props: { trigger: PLUS_TRIGGER, outcome: oneOf('purchased', 'dismissed', 'unavailable') },
  },
  plan_changed: {
    stage: 'plus',
    decision: "How families move between plan states on this phone, so we check Plus keeps working after a trial or restore.",
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
  error_shown: {
    stage: 'basics',
    decision: "Which errors families see, so we decide which one to fix first.",
    area: 'errors',
    when: 'A user-facing error from strings `errors.*` is shown',
    reqs: ['PRD-REQ-016'],
    level: 'L2',
    props: { code: ERROR_CODE },
  },

  // --- Basics: new, no earlier catalogue row ---------------------------------
  control_tapped: {
    stage: 'basics',
    decision: 'Which of the few key controls families tap, so we decide what Home and Review lead with.',
    area: 'app',
    when: 'A registered key control is activated. Sent by our own tap helper, never by SDK touch capture',
    reqs: ['ADR-0008', 'FR-DAT-21'],
    level: 'L2',
    props: { control: CONTROL, route: ROUTE },
  },
  surface_impressed: {
    stage: 'basics',
    decision: 'How often a surface we plan to change is seen and then acted on, so we judge whether the change helped.',
    area: 'app',
    when: 'A registered surface is at least half visible for one second, at most once per surface per foreground session',
    reqs: ['ADR-0008', 'FR-DAT-21'],
    level: 'L2',
    props: { surface: SURFACE, route: ROUTE, rank: opt(int(1, 9)) },
  },
  perf_measured: {
    stage: 'basics',
    decision: 'Whether the app feels fast on real phones, so we decide which slow step to fix before adding features.',
    area: 'app',
    when: 'One of five timed steps finishes; the time is bucketed on the phone, never sent as a number',
    reqs: ['ADR-0008', 'A-NFR-001'],
    level: 'L2',
    props: { metric: PERF_METRIC, ms_bucket: MS_BUCKET, ok: bool() },
  },
} as const satisfies Record<string, RegistryRow>;

export type RegistryName = keyof typeof REGISTRY;

/** Event names, as constants. The only way call sites name an event. */
export const EV = {
  screenView: 'screen_view',
  appOpened: 'app_opened',
  analyticsOptedIn: 'analytics_opted_in',
  authSucceeded: 'auth_succeeded',
  childAdded: 'child_added',
  captureStarted: 'capture_started',
  captureDiscarded: 'capture_discarded',
  transcriptionCompleted: 'transcription_completed',
  letterSaved: 'letter_saved',
  freeAllowanceReached: 'free_allowance_reached',
  keepGateShown: 'keep_gate_shown',
  letterHeld: 'letter_held',
  plusStartedFromGate: 'plus_started_from_gate',
  bookOpened: 'book_opened',
  letterOpened: 'letter_opened',
  inviteCreated: 'invite_created',
  inviteAccepted: 'invite_accepted',
  plusOfferViewed: 'plus_offer_viewed',
  plusOfferClosed: 'plus_offer_closed',
  planChanged: 'plan_changed',
  errorShown: 'error_shown',
  controlTapped: 'control_tapped',
  surfaceImpressed: 'surface_impressed',
  perfMeasured: 'perf_measured',
} as const satisfies Record<string, RegistryName>;

/** Property names, as constants. The only way call sites name a property. Includes the three global properties the client adds. */
export const PROP = {
  addedTogether: 'added_together',
  allowance: 'allowance',
  audioBucket: 'audio_bucket',
  authorRelation: 'author_relation',
  cameFromInvite: 'came_from_invite',
  channel: 'channel',
  childCountBucket: 'child_count_bucket',
  childOrdinal: 'child_ordinal',
  code: 'code',
  control: 'control',
  daysSinceInstall: 'days_since_install',
  daysSinceLastOpen: 'days_since_last_open',
  destination: 'destination',
  editsRejectedCount: 'edits_rejected_count',
  editsRevertedCount: 'edits_reverted_count',
  engine: 'engine',
  firstLetterMode: 'first_letter_mode',
  fromNotification2h: 'from_notification_2h',
  fromState: 'from_state',
  hadLocalData: 'had_local_data',
  hasAudio: 'has_audio',
  hasDate: 'has_date',
  inFirstRun: 'in_first_run',
  lapsed: 'lapsed',
  latencyBucket: 'latency_bucket',
  lettersBucket: 'letters_bucket',
  lettersKept: 'letters_kept',
  machineEditCount: 'machine_edit_count',
  memberRole: 'member_role',
  method: 'method',
  metric: 'metric',
  mode: 'mode',
  model: 'model',
  msBucket: 'ms_bucket',
  ok: 'ok',
  outcome: 'outcome',
  ownership: 'ownership',
  period: 'period',
  promptKind: 'prompt_kind',
  rank: 'rank',
  role: 'role',
  route: 'route',
  samplePct: 'sample_pct',
  schemaVersion: 'schema_version',
  shared: 'shared',
  signedIn: 'signed_in',
  source: 'source',
  stage: 'stage',
  surface: 'surface',
  timeToFirstLetter: 'time_to_first_letter',
  toState: 'to_state',
  trigger: 'trigger',
  wordsBucket: 'words_bucket',
} as const;

/**
 * Funnels behind weekly making families (FR-DAT-21). A funnel is a query in
 * PostHog, never code in the app; this list only names the steps, and every
 * step must be a registered event (rule V9). Ids: `f_<area>_<goal>`.
 */
export const FUNNELS = {
  f_onboarding_first_letter: ['child_added', 'capture_started', 'letter_saved'],
  f_capture_letter_saved: ['capture_started', 'transcription_completed', 'letter_saved'],
  f_keep_plus_started: ['free_allowance_reached', 'keep_gate_shown', 'plus_started_from_gate'],
  f_plus_offer_converted: ['plus_offer_viewed', 'plus_offer_closed', 'plan_changed'],
  f_return_book_read: ['app_opened', 'book_opened', 'letter_opened'],
  f_family_invite_joined: ['invite_created', 'invite_accepted'],
} as const satisfies Record<string, readonly RegistryName[]>;

/**
 * Events that must never exist (FR-DAT-27 and the founder's 20 Nov rules). A test fails if a registry name
 * matches one of these patterns: the birthday-week Save a copy slip, Days notes, email opens and clicks, and
 * anything that fires at a time a birthday, due date or seal sets.
 */
export const FORBIDDEN_EVENT_PATTERNS: readonly RegExp[] = [
  /save_a_copy/,
  /export_/,
  /days?_note/,
  /^moment_/,
  /^resurface_/,
  /email_(open|click)/,
  /birthday/,
  /month_age/,
  /reminder_sent/,
];

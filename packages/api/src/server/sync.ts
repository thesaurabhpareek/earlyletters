/**
 * Sync wire contract, version 1: the frozen v1.0 contract (F16 sections 6.2 A
 * to I, F16-REQ-019, F16-REQ-028; R2 AR-02, AR-31, AR-32; R8 R2A-05).
 *
 * The SQL that implements it: `sync_push(p_ops jsonb)` and
 * `sync_pull(p_since jsonb, p_limit int)` in
 * supabase/migrations/20261004100000_sync_engine.sql, redefined in
 * 20261005000000_family_cap_language_idempotency.sql and in S02's v1 gate file
 * (20261015000000, pending). This file is the one definition the app's sync
 * engine (apps/mobile/src/lib/sync, S03), the SQL (S02) and the tests share;
 * `test/contract-drift.test.ts` reads the migrations and fails when the op
 * types or field groups here and in the SQL parser disagree.
 *
 * Status of each part (15 Oct 2026):
 *  - built in SQL (pending apply): every op type except `held.*`, the field
 *    groups, push results, pull books, digest, `gone`, `reset`;
 *  - in S02's pending PR #140 (20261015030000): `occurred_precision`,
 *    `base_direction`, `author_edits`, `locked_spans`, `pack_ref`, prefs
 *    `notify_letters`;
 *  - planned, S02 after the sync ADR (T15; marked `planned` below):
 *    `p_api_version` and `SCVER` (WP-F16-16), words compare and set with
 *    `conflict_groups` and `current` (WP-F16-14), `held_drafts` with
 *    `held.upsert`, `held.discard` and the `held` pull section (WP-F16-17),
 *    prefs `hidden` and `quiet` (WP-F12-09).
 * A planned entry column is optional on the wire: an older server ignores it
 * (`entry.upsert` reads named keys only) and keeps a column whose key is
 * absent (the rule `language` follows in 20261005000000). Planned op types
 * and prefs keys are not like that: the SQL refuses unknown ones with 22023,
 * so clients send only `sendablePushOpTypes()` and `sendablePrefsKeys()`.
 *
 * Server-feature contract: imported only through `@scribe/api/server`, never
 * from the package root, so a build with EXPO_PUBLIC_SERVER_FEATURES=off never
 * evaluates it (test/server-features-off.test.ts).
 *
 * Privacy (F16 section 8, F11-REQ-085, PRD-REQ-004 Rev): `raw_transcript`,
 * `machine_edits`, `author_edits`, `locked_spans`, `pack_ref` and `language`
 * travel only on the author's own rows. Nothing in a result is a message or
 * a detail string (DATA-REQ-043): SQLSTATEs and closed enums only.
 */
import * as v from 'valibot';

// ── Versions and limits ───────────────────────────────────────────────────

/** The wire contract this package describes. Sent as `p_api_version` (planned, WP-F16-16). */
export const SYNC_API_VERSION = 1;
/**
 * The oldest version the server accepts (F16-REQ-019: current and previous).
 * 0 means a build that sends no `p_api_version`; once version 2 exists, the
 * server answers 0 with `SCVER` and the app shows `sync.updateNeeded`.
 */
export const SYNC_API_MIN_SUPPORTED = 0;

export const SYNC_PUSH_MAX_OPS = 50;
/**
 * Measured as the SQL measures it: `octet_length(p_ops::text)`, the UTF-8
 * bytes of jsonb's printed form, which puts a space after every `:` and `,`.
 * Count with `pushBatchBytes`, never with `string.length` (UTF-16 units: a
 * Hindi letter is about three times larger in UTF-8).
 */
export const SYNC_PUSH_MAX_BYTES = 256 * 1024;
export const SYNC_PULL_MAX_BOOKS = 100;
export const SYNC_PULL_MIN_ROWS = 1;
export const SYNC_PULL_MAX_ROWS = 500;
export const SYNC_PULL_DEFAULT_ROWS = 200;
/** Push debounce after a local write and the foreground pull intervals (F16 6.2 C, F16-REQ-017). */
export const SYNC_PUSH_DEBOUNCE_MS = 2_000;
export const SYNC_PULL_INTERVAL_SHARED_MS = 15_000;
export const SYNC_PULL_INTERVAL_SOLO_MS = 30_000;

// ── Enums ─────────────────────────────────────────────────────────────────

export const ENTRY_KINDS = ['note', 'letter', 'not_much'] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];
export const CAPTURE_MODES = ['spoken', 'typed', 'mixed'] as const;
export type CaptureMode = (typeof CAPTURE_MODES)[number];
export const EDIT_LEVELS = ['clean', 'verbatim'] as const;
export type EditLevel = (typeof EDIT_LEVELS)[number];
/** F04-REQ-015: a backdated letter is dated to a day or to a month of age. */
export const OCCURRED_PRECISIONS = ['day', 'month'] as const;
export type OccurredPrecision = (typeof OCCURRED_PRECISIONS)[number];
/** F04 11.3, F06-REQ-044: the letter's base direction, stored at save. Never changes the words. */
export const BASE_DIRECTIONS = ['ltr', 'rtl'] as const;
export type BaseDirection = (typeof BASE_DIRECTIONS)[number];
export const APPROVALS = ['not_needed', 'pending', 'added', 'set_aside', 'withdrawn'] as const;
export type Approval = (typeof APPROVALS)[number];
export const MEMBER_ROLES = ['parent', 'contributor'] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/**
 * Field groups. A group always travels whole: `changed` names groups, never
 * columns (F16-REQ-011, conflict C7). `text` is the words group that the
 * server compares before it writes (F16 6.2 E, WP-F16-14).
 */
export const FIELD_GROUPS = ['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'] as const;
export type FieldGroup = (typeof FIELD_GROUPS)[number];

/** Columns per group. `author_edits`, `locked_spans` and `occurred_precision` are planned columns (S02). */
export const FIELD_GROUP_COLUMNS: Readonly<Record<FieldGroup, readonly string[]>> = {
  text: ['final_text', 'machine_edits', 'edit_level', 'author_edits', 'locked_spans'],
  in_book: ['in_book'],
  sounds_like_me: ['sounds_like_me'],
  occurred_on: ['occurred_on', 'occurred_precision'],
  language: ['language'],
};

/** The words group: compare and set, never last writer wins (F16-REQ-082). */
export const WORDS_GROUP: FieldGroup = 'text';

/**
 * Columns that belong to no single group: the server applies them when any
 * of the listed groups is in `changed` (S02's 20261015030000). The letter's
 * direction follows its words and its language (F04 11.3).
 */
export const SHARED_GROUP_COLUMNS: Readonly<Record<string, readonly FieldGroup[]>> = {
  base_direction: ['text', 'language'],
};

/**
 * Immutable on the server (`entries_guard_immutable`, DATA-REQ-040 Rev): an
 * upsert must send the server's value; a different one rejects the WHOLE op
 * for good with SCIMM, with its text and in_book changes. `pack_ref`: omit
 * the key to keep the server's value (a letter made before pack_ref existed
 * keeps null). `raw_transcript` never changes on `entries`, so a voice-only
 * letter syncs only once its words exist (F06-REQ-030).
 */
export const IMMUTABLE_COLUMNS = ['raw_transcript', 'captured_at', 'child_id', 'engine_version', 'pack_ref'] as const;

/** Set when the letter is first written; an upsert's later value is ignored without an error (as built in sync_push). */
export const INSERT_ONLY_COLUMNS = ['id', 'kind', 'capture_mode', 'prompt_key', 'author_signs_as', 'audio_kept_on_device'] as const;

/** Columns only the author ever receives (F11-REQ-085, PRD-REQ-004 Rev). A pull row for someone else never carries them. */
export const AUTHOR_ONLY_COLUMNS = [
  'raw_transcript', 'machine_edits', 'author_edits', 'locked_spans', 'pack_ref', 'language', 'stt_meta', 'deleted_reason',
] as const;

export const PUSH_OP_TYPES = [
  'entry.upsert',
  'entry.reupload',
  'entry.delete',
  'entry.restore',
  'book.first_run',
  'book.create',
  'book.update',
  'prefs.upsert',
  /** Planned (WP-F16-17): an author-only held or waiting draft, whole row; words by compare and set. */
  'held.upsert',
  /** Planned (WP-F16-17, F08 6.5 D5): delete the held draft, its audio_blobs row and object. */
  'held.discard',
  /**
   * Planned (WP-F16-13, F16-REQ-024, F08 6.5 D4): Erase now for a synced
   * letter. The server purges the row and the backup object at the exact
   * `audio_blobs.object_path`; every device drops it at its next pull.
   */
  'entry.erase',
] as const;
export type PushOpType = (typeof PUSH_OP_TYPES)[number];
/** Op types the SQL parser does not have yet. The drift test allows exactly these to be missing. */
export const PLANNED_PUSH_OP_TYPES: readonly PushOpType[] = ['held.upsert', 'held.discard', 'entry.erase'];

/** Keys `book.update` accepts (as built). */
export const BOOK_UPDATE_KEYS = ['name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read'] as const;
/**
 * Keys `prefs.upsert` accepts. `notify_letters` is in S02's pending
 * 20261015030000 (PR #140); `hidden` and `quiet` are planned (WP-F12-09).
 * "Planned" means not on develop yet; the drift test accepts both states.
 */
export const PREFS_KEYS = ['signs_as', 'include_in_reminders', 'notify_letters', 'hidden', 'quiet'] as const;
export const PLANNED_PREFS_KEYS: readonly (typeof PREFS_KEYS)[number][] = ['notify_letters', 'hidden', 'quiet'];

// ── Push ──────────────────────────────────────────────────────────────────

/**
 * One word-level hand edit against the machine-cleaned text (F06-REQ-026).
 * Opaque to the server: stored and versioned, never interpreted.
 */
export interface AuthorEdit {
  start: number;
  end: number;
  replacement: string;
}

/** A phrase the author locked "as said", as offsets into `raw_transcript` (F06-REQ-031). */
export interface LockedSpan {
  start: number;
  end: number;
}

/** A letter as the author sends it (`entry.upsert`, `entry.reupload`). Optional keys may be omitted by older apps. */
export interface EntryData {
  id: string;
  child_id: string;
  kind: EntryKind;
  occurred_on: string;
  /** Column in S02's 20261015030000 (WP-F04-14). Absent: the server keeps `day`. */
  occurred_precision?: OccurredPrecision;
  captured_at: string;
  capture_mode: CaptureMode;
  edit_level: EditLevel;
  prompt_key: string | null;
  engine_version: number;
  raw_transcript: string;
  machine_edits: unknown[];
  final_text: string;
  /** Column in S02's 20261015030000 (WP-F06-07), words group; null until the author edits by hand. */
  author_edits?: AuthorEdit[] | null;
  /** Column in S02's 20261015030000 (WP-F06-07), words group; null until a phrase is locked. */
  locked_spans?: LockedSpan[] | null;
  /** Column in S02's 20261015030000 (WP-F06-07): `lang@version` of the pack used, or null when no verified pack applied (F06-REQ-011). Insert-only (SCIMM). */
  pack_ref?: string | null;
  in_book: boolean;
  sounds_like_me: boolean | null;
  author_signs_as: string | null;
  audio_kept_on_device: boolean;
  /** Built (20261005000000): one of the seven v1.0 language codes, or null. */
  language?: string | null;
  /** Column in S02's 20261015030000 (WP-F04-14): applied with the `text` or `language` group. */
  base_direction?: BaseDirection;
  /** `entry.reupload` only: the phone's copy is a tombstone. */
  deleted?: boolean;
}

/** Every key of EntryData, for the drift test against the keys `sync_push` reads. Kept equal to the interface by a type check. */
export const ENTRY_DATA_KEYS = [
  'id', 'child_id', 'kind', 'occurred_on', 'occurred_precision', 'captured_at', 'capture_mode', 'edit_level', 'prompt_key',
  'engine_version', 'raw_transcript', 'machine_edits', 'final_text', 'author_edits', 'locked_spans', 'pack_ref', 'in_book',
  'sounds_like_me', 'author_signs_as', 'audio_kept_on_device', 'language', 'base_direction', 'deleted',
] as const satisfies readonly (keyof EntryData)[];
type MissingEntryKeys = Exclude<keyof EntryData, (typeof ENTRY_DATA_KEYS)[number]>;
const _entryKeysComplete: MissingEntryKeys extends never ? true : never = true;
void _entryKeysComplete;

/**
 * A held or waiting draft (F16 6.2 I; planned, WP-F16-17). Author-only; never
 * in `book_entries` or another member's pull. `entry.upsert` for the same id
 * deletes the held row in the same transaction (a kept letter never exists twice).
 */
export const HELD_KINDS = ['held_letter', 'waiting_letter', 'held_words'] as const;
export type HeldKind = (typeof HELD_KINDS)[number];

export interface HeldDraftData {
  id: string;
  child_id: string;
  kind: HeldKind;
  capture_mode: CaptureMode;
  /** Device capture time. */
  created_at: string;
  occurred_on: string;
  occurred_precision: OccurredPrecision;
  language: string | null;
  base_direction: BaseDirection;
  prompt_key: string | null;
  /** Where the author chose to put it when held (`true` = the book), or null. */
  in_book_choice: boolean | null;
  /** Null until words exist; immutable once non-empty (SCIMM). */
  raw_transcript: string | null;
  final_text: string | null;
  machine_edits: unknown[] | null;
  edit_level: EditLevel | null;
  author_edits: AuthorEdit[] | null;
  locked_spans: LockedSpan[] | null;
  typed_text: string | null;
  engine_version: number | null;
  pack_ref: string | null;
  audio_kept_on_device: boolean;
}

interface OpBase<T extends PushOpType, D> {
  /** Device-made UUIDv7; the server applies an op id at most once per person (receipts keyed by person, F16-REQ-003). */
  op: string;
  type: T;
  /** Letter id, draft id, book id (book.*, prefs.upsert) or a batch id (book.first_run). */
  id: string;
  data: D;
}

export interface EntryUpsertOp extends OpBase<'entry.upsert', EntryData> {
  /** The groups this op changes; an insert uses every group. */
  changed: FieldGroup[];
  /**
   * The server version (`v`) this device last saw or wrote for the letter, or
   * null for a new letter. With `text` in `changed` and the row's `v` above
   * `base`, the server does not apply the words and answers `conflict`
   * (planned, WP-F16-14). After an op applies, the client rebases every later
   * queued op for that letter to the returned `v` (F16-REQ-025).
   */
  base: string | null;
}
export interface EntryReuploadOp extends OpBase<'entry.reupload', EntryData> {
  /** The server `updated_at` this phone last saw (restore epoch, F16 6.2 F). */
  known_at: string;
}
export type EntryDeleteOp = OpBase<'entry.delete', Record<string, never>>;
export type EntryRestoreOp = OpBase<'entry.restore', Record<string, never>>;
export interface BookFirstRunOp extends OpBase<'book.first_run', { children: Record<string, unknown>[] }> {}
export interface BookCreateOp extends OpBase<'book.create', Record<string, unknown>> {}
export interface BookUpdateOp extends OpBase<'book.update', Partial<Record<(typeof BOOK_UPDATE_KEYS)[number], unknown>>> {}
export interface PrefsUpsertOp extends OpBase<'prefs.upsert', Partial<Record<(typeof PREFS_KEYS)[number], unknown>>> {}
export interface HeldUpsertOp extends OpBase<'held.upsert', HeldDraftData> {
  changed: FieldGroup[];
  base: string | null;
}
export type HeldDiscardOp = OpBase<'held.discard', Record<string, never>>;
export type EntryEraseOp = OpBase<'entry.erase', Record<string, never>>;

export type PushOp =
  | EntryUpsertOp
  | EntryReuploadOp
  | EntryDeleteOp
  | EntryRestoreOp
  | BookFirstRunOp
  | BookCreateOp
  | BookUpdateOp
  | PrefsUpsertOp
  | HeldUpsertOp
  | HeldDiscardOp
  | EntryEraseOp;

/** RPC arguments. `p_api_version` is planned (WP-F16-16); until S02 adds the overload, omit it. */
export interface SyncPushArgs {
  p_ops: PushOp[];
  p_api_version?: number;
}

const str = v.string();
const nullableStr = v.nullable(v.string());

/** Server state of a letter after an op. */
export const EntryStateSchema = v.object({
  id: str,
  v: str,
  updated_at: str,
  deleted_at: nullableStr,
  in_book: v.boolean(),
  approval: v.fallback(v.picklist(APPROVALS), 'not_needed'),
});
export type EntryState = v.InferOutput<typeof EntryStateSchema>;

/** The server's words when the words group conflicted (the caller's own words, so nothing leaks). Planned, WP-F16-14. */
export const ConflictCurrentSchema = v.object({
  final_text: str,
  machine_edits: v.array(v.unknown()),
  edit_level: v.picklist(EDIT_LEVELS),
  author_edits: v.nullish(v.array(v.unknown())),
  locked_spans: v.nullish(v.array(v.unknown())),
  v: str,
});
export type ConflictCurrent = v.InferOutput<typeof ConflictCurrentSchema>;

export const PushResultOkSchema = v.object({
  op: str,
  ok: v.literal(true),
  dup: v.optional(v.boolean()),
  applied: v.optional(v.boolean()),
  conflict: v.optional(v.boolean()),
  /** Planned (WP-F16-14): the groups not applied, today only `["text"]`. */
  conflict_groups: v.optional(v.array(v.picklist(FIELD_GROUPS))),
  /**
   * Planned (WP-F16-14; S03's ADR 0023): the server's words, sent whenever
   * they changed since `base` (a words conflict, or an op that carried no
   * words). The phone takes them unless its own words for that letter are
   * still queued.
   */
  current: v.optional(v.nullable(ConflictCurrentSchema)),
  /**
   * Planned (WP-F16-14; S03's ADR 0023 section 5): the words version this op
   * wrote when it first applied. A duplicate (`dup`) answers it too, so a
   * lost answer rebases on it, never on `entry.v`.
   */
  applied_v: v.optional(v.nullable(str)),
  missing: v.optional(v.boolean()),
  entry: v.optional(v.nullable(EntryStateSchema)),
  /** Planned (WP-F16-17): server state of a held draft after `held.upsert`. */
  held: v.optional(v.object({ id: str, v: str, updated_at: str })),
  book: v.optional(v.object({ id: str })),
  books: v.optional(v.array(str)),
  prefs: v.optional(v.object({ child_id: str })),
});
export type PushResultOk = v.InferOutput<typeof PushResultOkSchema>;

export const PushResultErrSchema = v.object({
  /** Null when the op itself was malformed (no `op` key): the SQL echoes `left(o->>'op', 36)`. Match by position then. */
  op: v.nullable(str),
  ok: v.literal(false),
  /** SQLSTATE. Never a message: it could quote a letter. */
  code: v.pipe(str, v.regex(/^[0-9A-Z]{5}$/)),
  /** SCDEL for a letter whose id was purged: it was deleted elsewhere and is gone. */
  gone: v.optional(v.boolean()),
});
export type PushResultErr = v.InferOutput<typeof PushResultErrSchema>;
export type PushResult = PushResultOk | PushResultErr;

/** Consents a paused push names (SCCON detail; F11 adds `family-share` behind server config). */
export const CONSENT_KINDS = ['terms', 'age', 'sensitive-data', 'family-share', 'backup'] as const;

export const PushResponseSchema = v.object({
  results: v.array(v.union([PushResultOkSchema, PushResultErrSchema])),
  /** SCCON: consent is missing. Ops after the last result were not applied and stay queued. */
  paused: v.boolean(),
  /** A transient error or SCRAT at the op after the last result: back off and retry from there. */
  stopped: v.boolean(),
  /** Which consents are missing (comma list from the SCCON detail), when paused. */
  consent: v.optional(v.nullable(str)),
  /** The SQLSTATE that stopped the batch. */
  code: v.optional(v.pipe(str, v.regex(/^[0-9A-Z]{5}$/))),
});
export type PushResponse = v.InferOutput<typeof PushResponseSchema>;

// ── Pull ──────────────────────────────────────────────────────────────────

export interface Digest {
  n: number;
  sum: number;
}

export interface BookRequest {
  cursor?: string | null;
  access?: string | null;
  meta?: string | null;
  have?: Digest;
  verify?: boolean;
  ids?: boolean;
}

export interface PullSince {
  epoch?: number;
  books: Record<string, BookRequest>;
  /** Planned (WP-F16-17): cursor and digest for the author's own held drafts (same rules as a book). */
  held?: { cursor?: string | null; have?: Digest; verify?: boolean; ids?: boolean };
}

export interface SyncPullArgs {
  p_since: PullSince | Record<string, never>;
  p_limit?: number;
  p_api_version?: number;
}

const DigestSchema = v.object({ n: v.number(), sum: v.number() });

/** A letter row. Rows by someone else come from `book_entries` and never carry author-only columns. */
export const PulledRowSchema = v.object({
  id: str,
  child_id: str,
  author_id: str,
  author_signs_as: nullableStr,
  kind: v.picklist(ENTRY_KINDS),
  occurred_on: str,
  occurred_precision: v.optional(v.picklist(OCCURRED_PRECISIONS)),
  captured_at: str,
  capture_mode: v.picklist(CAPTURE_MODES),
  edit_level: v.picklist(EDIT_LEVELS),
  prompt_key: nullableStr,
  prompt_library_version: v.nullish(v.number()),
  engine_version: v.number(),
  raw_transcript: v.optional(str),
  machine_edits: v.optional(v.array(v.unknown())),
  /** Null until the author edits by hand (S02 20261015030000: null or an array). */
  author_edits: v.nullish(v.array(v.unknown())),
  locked_spans: v.nullish(v.array(v.unknown())),
  pack_ref: v.nullish(str),
  language: v.nullish(str),
  base_direction: v.optional(v.picklist(BASE_DIRECTIONS)),
  final_text: str,
  in_book: v.boolean(),
  sounds_like_me: v.nullable(v.boolean()),
  approval: v.fallback(v.picklist(APPROVALS), 'not_needed'),
  /** `{child_id}/{author_id}/{entry_id}.<ext>` or null (photos are not in v1.0; the column exists). */
  photo_path: v.nullish(str),
  audio_kept_on_device: v.boolean(),
  created_at: str,
  updated_at: str,
  deleted_at: nullableStr,
  own: v.boolean(),
  v: str,
});
export type PulledRow = v.InferOutput<typeof PulledRowSchema>;

export const BookMemberSchema = v.object({
  profile_id: str,
  role: v.picklist(MEMBER_ROLES),
  is_me: v.boolean(),
  joined_at: str,
  signs_as: nullableStr,
  /**
   * Requested from S02 (not in 20261015020000): until when the caller may
   * undo this member's join, set only for a member who joined through the
   * caller's own invite in the last 72 hours (F11-REQ-008), else absent.
   * Without it the app cannot know whom it may offer "Not your co-parent?".
   */
  undo_until: v.optional(nullableStr),
  /** Built in sync_books only (the pull meta does not carry it): whether this member's letters are added without review. Parents see it. */
  auto_add: v.optional(v.nullable(v.boolean())),
});
export type BookMember = v.InferOutput<typeof BookMemberSchema>;

export const BookMetaSchema = v.object({
  role: v.picklist(MEMBER_ROLES),
  name: str,
  nickname: nullableStr,
  /** Parents only (D-039, G-08); family members get `birthday_md`. */
  date_of_birth: nullableStr,
  birthday_md: nullableStr,
  due_date: nullableStr,
  family_can_read: v.boolean(),
  created_by_me: v.boolean(),
  my_signs_as: nullableStr,
  include_in_reminders: v.boolean(),
  /** Planned per-person prefs (F11, F12). */
  my_notify_letters: v.optional(v.boolean()),
  my_hidden: v.optional(v.boolean()),
  my_quiet: v.optional(v.boolean()),
  members: v.array(BookMemberSchema),
});
export type BookMeta = v.InferOutput<typeof BookMetaSchema>;

export const PulledBookSchema = v.object({
  id: str,
  access: str,
  repull: v.boolean(),
  meta_hash: str,
  meta: v.optional(BookMetaSchema),
  rows: v.array(PulledRowSchema),
  cursor: nullableStr,
  more: v.boolean(),
  visible: v.optional(v.nullable(DigestSchema)),
  ids: v.optional(v.array(str)),
});
export type PulledBook = v.InferOutput<typeof PulledBookSchema>;

export const GONE_REASONS = ['not_member', 'deleted'] as const;
export const GoneBookSchema = v.object({
  id: str,
  reason: v.picklist(GONE_REASONS),
  rows: v.array(PulledRowSchema),
  cursor: nullableStr,
  more: v.boolean(),
});
export type GoneBook = v.InferOutput<typeof GoneBookSchema>;

/** A held draft as its author pulls it (planned, WP-F16-17). */
export const PulledHeldSchema = v.object({
  id: str,
  child_id: str,
  kind: v.picklist(HELD_KINDS),
  capture_mode: v.picklist(CAPTURE_MODES),
  created_at: str,
  occurred_on: str,
  occurred_precision: v.picklist(OCCURRED_PRECISIONS),
  language: nullableStr,
  base_direction: v.picklist(BASE_DIRECTIONS),
  prompt_key: nullableStr,
  in_book_choice: v.nullable(v.boolean()),
  raw_transcript: nullableStr,
  final_text: nullableStr,
  machine_edits: v.nullable(v.array(v.unknown())),
  edit_level: v.nullable(v.picklist(EDIT_LEVELS)),
  author_edits: v.nullable(v.array(v.unknown())),
  locked_spans: v.nullable(v.array(v.unknown())),
  typed_text: nullableStr,
  engine_version: v.nullable(v.number()),
  pack_ref: nullableStr,
  audio_kept_on_device: v.boolean(),
  updated_at: str,
  v: str,
});
export type PulledHeld = v.InferOutput<typeof PulledHeldSchema>;

/**
 * A held draft that left the server: discarded on another phone of the same
 * author, or kept (its `entries` row took the same id). The row itself is
 * purged, so only these fields exist; the phone drops its local draft, or
 * for `kept` waits for the letter in the book section.
 */
export const PulledHeldGoneSchema = v.object({
  id: str,
  gone: v.picklist(['discarded', 'kept']),
  updated_at: str,
  v: str,
});
export type PulledHeldGone = v.InferOutput<typeof PulledHeldGoneSchema>;

export const PullResponseSchema = v.object({
  reset: v.boolean(),
  reason: v.optional(v.picklist(['epoch', 'cursor_ahead'])),
  epoch: v.number(),
  epoch_started_at: str,
  books: v.optional(v.array(PulledBookSchema)),
  gone: v.optional(v.array(GoneBookSchema)),
  /**
   * Planned (WP-F16-17): the author's own held drafts after the held cursor,
   * with the same cursor rules as a book (F16 6.2 I): removal is the digest
   * (`visible`, then `ids` on a difference), so a draft purged by a book
   * purge, the orphan sweep or a restore epoch leaves this phone too.
   * `gone` rows are an optional fast path for discards and keeps. Never
   * present in anyone else's pull.
   */
  held: v.optional(v.object({
    rows: v.array(v.union([PulledHeldGoneSchema, PulledHeldSchema])),
    cursor: nullableStr,
    more: v.boolean(),
    visible: v.optional(v.nullable(DigestSchema)),
    ids: v.optional(v.array(str)),
  })),
  more: v.optional(v.boolean()),
});
export type PullResponse = v.InferOutput<typeof PullResponseSchema>;

// ── Book list (sync_books, F16 6.2 D step 2) ──────────────────────────────

/**
 * Pending invites as `sync_books` returns them to parents: not accepted, not
 * revoked, and expired for at most 14 days. This is the one source for the
 * member list's pending rows (F11-REQ-019); `open` decides whether Send
 * again and Cancel show.
 */
export const BookInviteSchema = v.object({
  id: str,
  role: v.picklist(MEMBER_ROLES),
  signs_as: nullableStr,
  created_at: str,
  expires_at: str,
  status: v.picklist(['open', 'expired']),
});

export const SyncBookSchema = v.object({
  id: str,
  role: v.picklist(MEMBER_ROLES),
  name: str,
  nickname: nullableStr,
  date_of_birth: nullableStr,
  birthday_md: nullableStr,
  due_date: nullableStr,
  family_can_read: v.boolean(),
  created_by_me: v.boolean(),
  joined_at: str,
  auto_add: v.nullish(v.boolean()),
  my_signs_as: nullableStr,
  members: v.nullable(v.array(BookMemberSchema)),
  /** Parents only; null for family members. */
  invites: v.nullable(v.array(BookInviteSchema)),
});

export const SyncBooksResponseSchema = v.object({
  epoch: v.nullable(v.number()),
  first_run_open: v.boolean(),
  books: v.array(SyncBookSchema),
});
export type SyncBooksResponse = v.InferOutput<typeof SyncBooksResponseSchema>;

export function parseSyncBooks(input: unknown): ParseResult<SyncBooksResponse> {
  const r = v.safeParse(SyncBooksResponseSchema, input);
  return r.success ? { ok: true, value: r.output } : { ok: false, reason: 'invalid' };
}

// ── Sizes ─────────────────────────────────────────────────────────────────

const utf8Len = (str: string) => {
  let n = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      n += 4;
      i++;
    } else n += 3;
  }
  return n;
};

/** UTF-8 bytes of a value as Postgres prints it as jsonb (`{"a": 1, "b": [1, 2]}`). */
export function jsonbTextBytes(value: unknown): number {
  if (value === null || value === undefined) return 4;
  if (typeof value === 'boolean') return value ? 4 : 5;
  if (typeof value === 'number') return String(value).length;
  if (typeof value === 'string') return utf8Len(JSON.stringify(value));
  if (Array.isArray(value)) return value.length === 0 ? 2 : 2 + value.reduce((n: number, x) => n + jsonbTextBytes(x), 0) + 2 * (value.length - 1);
  const entries = Object.entries(value as Record<string, unknown>).filter(([, x]) => x !== undefined);
  if (entries.length === 0) return 2;
  return 2 + entries.reduce((n, [k, x]) => n + utf8Len(JSON.stringify(k)) + 2 + jsonbTextBytes(x), 0) + 2 * (entries.length - 1);
}

/** The size `sync_push` checks against SYNC_PUSH_MAX_BYTES. */
export function pushBatchBytes(ops: readonly PushOp[]): number {
  return jsonbTextBytes(ops);
}

// ── Parsers ───────────────────────────────────────────────────────────────

export type ParseResult<T> = { ok: true; value: T } | { ok: false; reason: 'invalid' };

/** Validates a `sync_push` response. Unknown keys are dropped (newer server, older app). Never throws. */
export function parsePushResponse(input: unknown): ParseResult<PushResponse> {
  const r = v.safeParse(PushResponseSchema, input);
  return r.success ? { ok: true, value: r.output } : { ok: false, reason: 'invalid' };
}

/** Validates a `sync_pull` response. Never throws. */
export function parsePullResponse(input: unknown): ParseResult<PullResponse> {
  const r = v.safeParse(PullResponseSchema, input);
  return r.success ? { ok: true, value: r.output } : { ok: false, reason: 'invalid' };
}

/** The groups an op names, rejecting anything that is not a group (22023 on the server). */
export function isFieldGroupList(x: unknown): x is FieldGroup[] {
  return Array.isArray(x) && x.every((g) => (FIELD_GROUPS as readonly string[]).includes(g as string));
}

/**
 * True when a push result is a words conflict the author must resolve (F16
 * 6.2 E step 3). Only `conflict_groups` containing `text` counts. As built
 * today, `conflict: true` without `conflict_groups` is advisory: the op was
 * applied by the later-arrival rule and there is nothing to resolve.
 */
export function isWordsConflict(r: PushResult): r is PushResultOk & { conflict: true; conflict_groups: FieldGroup[] } {
  return r.ok === true && r.conflict === true && Array.isArray(r.conflict_groups) && r.conflict_groups.includes(WORDS_GROUP);
}

/**
 * What a client may send today. Unknown op types and unknown prefs keys are
 * refused by the SQL with 22023, which is permanent (DATA-REQ-043), so a
 * planned op or key must never be sent before this list includes it.
 * Planned entry columns are different: `entry.upsert` reads named keys only,
 * so an older server ignores a column it does not have.
 */
export function sendablePushOpTypes(): PushOpType[] {
  return PUSH_OP_TYPES.filter((t) => !PLANNED_PUSH_OP_TYPES.includes(t));
}
export function sendablePrefsKeys(): (typeof PREFS_KEYS)[number][] {
  return PREFS_KEYS.filter((k) => !PLANNED_PREFS_KEYS.includes(k));
}

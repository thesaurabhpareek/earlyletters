/**
 * Sync wire contract, version 1: the frozen v1.0 contract (F16 sections 6.2 A
 * to I, F16-REQ-019, F16-REQ-028; R2 AR-02, AR-31, AR-32; R8 R2A-05).
 *
 * The SQL that implements it: `sync_push(p_ops jsonb)` and
 * `sync_pull(p_since jsonb, p_limit int)` in
 * supabase/migrations/20261004100000_sync_engine.sql, redefined in
 * 20261005000000_family_cap_language_idempotency.sql, S02's v1 gate files
 * (20261015000000 to 20261015030000, PR #140) and the sync protocol v1 server
 * half (20261016000000_sync_v1_server.sql, PR #208; ADR 0025). This file is
 * the one definition the app's sync engine (apps/mobile/src/lib/sync, S03),
 * the SQL (S02) and the tests share; `test/contract-drift.test.ts` reads the
 * migrations and fails when the op types, keys or field groups here and in
 * the SQL disagree.
 *
 * Status of each part (23 Oct 2026, develop at d98961f):
 *  - built: every op type including `held.upsert`, `held.discard` and
 *    `entry.erase` (20261016000000), the field groups, words compare and set
 *    with `conflict_groups`, `current` and `applied_v`, the `held` pull
 *    section with its `gone` markers, the review mark `words_reviewed_at`,
 *    `occurred_precision`, `base_direction`, `author_edits`, `locked_spans`,
 *    `pack_ref` (20261015030000), prefs `notify_letters`;
 *  - planned (marked `planned` below): `p_api_version` and `SCVER`
 *    (WP-F16-16), prefs `hidden` and `quiet` (WP-F12-09).
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

/** Columns per group (as built in 20261015030000 and 20261016000000). */
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
 * What moves the words version (`text_xid`) that the compare reads, exactly
 * as built (20261016000000; review A 6 on #138). The whole `text` group
 * travels and applies together (FIELD_GROUP_COLUMNS), but the version is
 * narrower than the group for a letter:
 *  - a letter (`entries_set_sync_xid`): only `final_text`, `machine_edits`
 *    and `edit_level`. A change to `author_edits` or `locked_spans` alone is
 *    not newer words: another phone's `text` op whose `base` predates that
 *    change replaces it with no words conflict, at most the advisory
 *    `conflict: true` (left to S02 with the M17 follow-up);
 *  - a held draft (`held_drafts_stamp`): all five group columns and
 *    `typed_text`, and a refused `held.upsert` compares all six;
 *  - a Keep (`keep_check`): the held row's words (`final_text`, or
 *    `typed_text` when it has none) against the keep's `final_text`.
 * `current` never carries the author layer (ConflictCurrentSchema). The
 * drift test reads both lists from the triggers.
 */
export const WORDS_VERSION_COLUMNS = {
  entry: ['final_text', 'machine_edits', 'edit_level'],
  held: ['final_text', 'machine_edits', 'edit_level', 'author_edits', 'locked_spans', 'typed_text'],
} as const;

/**
 * Columns that belong to no single group: the server applies them when any
 * of the listed groups is in `changed` (S02's 20261015030000). The letter's
 * direction follows its words and its language (F04 11.3).
 */
export const SHARED_GROUP_COLUMNS: Readonly<Record<string, readonly FieldGroup[]>> = {
  base_direction: ['text', 'language'],
  /**
   * The review mark (M17, ADR 0025 section 11): applied with the `text`
   * group, and only when the op carries the key, so an op without it keeps
   * the server's value (20261016000000). Not part of the words compare.
   */
  words_reviewed_at: ['text'],
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
  'words_reviewed_at',
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
  /**
   * WP-F16-17 (20261016000000): an author-only held or waiting draft, whole
   * row; words by compare and set. While `app.held_sync` is 'off' the server
   * answers `held_off` and claims nothing, so the phone keeps the op queued.
   */
  'held.upsert',
  /** WP-F16-17, F08 6.5 D5 (20261016000000): delete the held draft, its audio_blobs row and object. */
  'held.discard',
  /**
   * WP-F16-13, F16-REQ-024, F08 6.5 D4 (20261016000000): Erase now for a
   * synced letter. The server purges the row and the backup object at the
   * exact `audio_blobs.object_path`; every device drops it at its next pull.
   */
  'entry.erase',
] as const;
export type PushOpType = (typeof PUSH_OP_TYPES)[number];
/** Op types the SQL parser does not have yet. The drift test allows exactly these to be missing. None since 20261016000000. */
export const PLANNED_PUSH_OP_TYPES: readonly PushOpType[] = [];

/** Keys `book.update` accepts (as built). */
export const BOOK_UPDATE_KEYS = ['name', 'nickname', 'date_of_birth', 'due_date', 'family_can_read'] as const;
/**
 * Keys `prefs.upsert` accepts. `notify_letters` is built (20261015030000,
 * PR #140); `hidden` and `quiet` are planned (WP-F12-09). "Planned" means not
 * on develop yet; the drift test accepts both states.
 */
export const PREFS_KEYS = ['signs_as', 'include_in_reminders', 'notify_letters', 'hidden', 'quiet'] as const;
export const PLANNED_PREFS_KEYS: readonly (typeof PREFS_KEYS)[number][] = ['hidden', 'quiet'];

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
  /**
   * The review mark (M17, ADR 0025 section 11; 20261016000000): when the
   * author kept the letter with its words on screen. Applied with the `text`
   * group, only when the key is present; absent keeps the server's value.
   * Author-only: never in `book_entries`.
   */
  words_reviewed_at?: string | null;
  /** `entry.reupload` only: the phone's copy is a tombstone. */
  deleted?: boolean;
}

/** Every key of EntryData, for the drift test against the keys `sync_push` reads. Kept equal to the interface by a type check. */
export const ENTRY_DATA_KEYS = [
  'id', 'child_id', 'kind', 'occurred_on', 'occurred_precision', 'captured_at', 'capture_mode', 'edit_level', 'prompt_key',
  'engine_version', 'raw_transcript', 'machine_edits', 'final_text', 'author_edits', 'locked_spans', 'pack_ref', 'in_book',
  'sounds_like_me', 'author_signs_as', 'audio_kept_on_device', 'language', 'base_direction', 'words_reviewed_at', 'deleted',
] as const satisfies readonly (keyof EntryData)[];
type MissingEntryKeys = Exclude<keyof EntryData, (typeof ENTRY_DATA_KEYS)[number]>;
const _entryKeysComplete: MissingEntryKeys extends never ? true : never = true;
void _entryKeysComplete;

/**
 * A held or waiting draft (F16 6.2 I; WP-F16-17, 20261016000000). Author-only; never
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

/** Every key of HeldDraftData, for the drift test against the keys `held.upsert` reads. Kept equal to the interface by a type check. */
export const HELD_DRAFT_DATA_KEYS = [
  'id', 'child_id', 'kind', 'capture_mode', 'created_at', 'occurred_on', 'occurred_precision', 'language', 'base_direction',
  'prompt_key', 'in_book_choice', 'raw_transcript', 'final_text', 'machine_edits', 'edit_level', 'author_edits', 'locked_spans',
  'typed_text', 'engine_version', 'pack_ref', 'audio_kept_on_device',
] as const satisfies readonly (keyof HeldDraftData)[];
type MissingHeldKeys = Exclude<keyof HeldDraftData, (typeof HELD_DRAFT_DATA_KEYS)[number]>;
const _heldKeysComplete: MissingHeldKeys extends never ? true : never = true;
void _heldKeysComplete;

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
   * null for a new letter. With `text` in `changed` and the words version
   * (`text_xid`, ADR 0025 section 5) above `base`, the server does not apply
   * the words and answers `conflict_groups: ['text']` with `current`
   * (WP-F16-14). After an op applies, the client rebases every later queued
   * op for that letter (F16-REQ-025): on a first answer to `entry.v`, the
   * row version the answer carries; on a duplicate's answer (`dup`) only to
   * its `applied_v`, never to `entry.v`, which may hold another phone's
   * later write. A duplicate without `applied_v` moves no base.
   */
  base: string | null;
  /**
   * The Keep (ADR 0025 section 9, review K 1): the `v` of the held draft this
   * letter is made from, as this phone last knew it. Sent on a Keep, always
   * with a value, and on no other op. As built (20261016000000 `sync_push`):
   * on a letter that exists with `base` set, `held_base` is ignored (`base`
   * wins); with `base` null, or when no letter has the id yet, the key's
   * presence alone makes the op a Keep, even as null, which counts as 0. So
   * an ordinary edit with no `base` that carried it would have its words
   * compared as a Keep and refused when the server's are newer.
   *
   * A phone that knows no held version (the answer to its upload never came,
   * or it never saw the row's `v`) sends `'0'`, which compares against any
   * words on the server, so the Keep never replaces words it has not seen.
   * Omitting the key is not the same: onto a new letter the server still
   * compares as 0 when it holds a held row with that id, but onto an
   * existing letter with no `base` (another phone kept first) there is no
   * compare at all: the Keep's words replace the letter's, or the op fails
   * SCIMM on the first keep's provenance. (The app omits it today when it
   * knows no version, outbox.ts; WP-F16-01 should send `'0'` instead.)
   *  - Onto a new letter (`keep_check`): when the author's held row has
   *    words newer than it and different from the keep's, the keep is
   *    refused as a words conflict: no letter is made, the held row stays,
   *    `current` carries the held words with `typed_text`. A Keep without
   *    the key is compared as 0 too whenever the author holds a held row
   *    with that id.
   *  - Onto the author's existing letter with no `base` (another phone kept
   *    the draft first): it stands in for `base`, newer words refuse the
   *    text group with `current`, and the stored `raw_transcript`,
   *    `captured_at`, `engine_version` and `pack_ref` stand.
   */
  held_base?: string;
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
export interface HeldDiscardOp extends OpBase<'held.discard', Record<string, never>> {
  /**
   * The held row's `v` this phone last saw (null counts as 0). When the held
   * words changed since, the later edit wins: the server keeps the row and
   * answers `kept` (20261016000000, #197).
   */
  base?: string | null;
}
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

/**
 * The server's words when the words group conflicted (the caller's own words,
 * so nothing leaks; WP-F16-14). For a letter the words fields are always set.
 * For a held draft (a refused `held.upsert` or Keep) they are the held row's,
 * which may still have no words (`null`), with `typed_text` beside them
 * (ADR 0025 section 9; S03's request in ADR 0025 "Requests", item 1).
 * As built (20261016000000) no `current` carries `author_edits` or
 * `locked_spans`, for a letter or a held draft: the keys are exactly these
 * (the drift test reads every builder). `v` is the words version
 * (`text_xid`), see WORDS_VERSION_COLUMNS.
 */
export const ConflictCurrentSchema = v.object({
  final_text: nullableStr,
  machine_edits: v.nullable(v.array(v.unknown())),
  edit_level: v.nullable(v.picklist(EDIT_LEVELS)),
  typed_text: v.optional(nullableStr),
  v: str,
});
export type ConflictCurrent = v.InferOutput<typeof ConflictCurrentSchema>;

export const PushResultOkSchema = v.object({
  op: str,
  ok: v.literal(true),
  dup: v.optional(v.boolean()),
  applied: v.optional(v.boolean()),
  conflict: v.optional(v.boolean()),
  /**
   * WP-F16-14: the groups not applied, today only `["text"]`. This alone
   * marks a words refusal (`isWordsConflict`), whatever `conflict` says. As
   * built (20261016000000): a refused Keep onto a new letter (`keep_check`)
   * and its repeat (`dup_answer`) carry it with `conflict: true`; a refused
   * `entry.upsert` carries `conflict` as its own row compare says (the row's
   * `v` past `base`, nearly always true there), and so does a Keep onto a
   * letter that already exists (another phone kept first: the letter path,
   * `held_base` standing in for `base`); a duplicate of either of those two
   * (`dup_outcome`), a refused `held.upsert` (`held_state`) and its repeat
   * (`held_dup`) carry it without `conflict`.
   */
  conflict_groups: v.optional(v.array(v.picklist(FIELD_GROUPS))),
  /**
   * WP-F16-14 (ADR 0025 section 2): the server's words, sent whenever they
   * changed since `base` (a words conflict, or an op that carried no words).
   * The phone takes them unless its own words for that letter are still
   * queued; a refusal keeps the phone's words as a conflict copy.
   */
  current: v.optional(v.nullable(ConflictCurrentSchema)),
  /**
   * WP-F16-14 (ADR 0025 section 2), as built (20261016000000): sent only on
   * a duplicate's answer (`dup: true`; `dup_outcome`, `held_dup`), never on
   * a first answer. It is the row version (`sync_xid`, the kind of value
   * `entry.v` and `held.v` carry, not the words version) that this op wrote
   * when it first applied, so a lost answer rebases on it and never on
   * `entry.v`. Absent when the first answer was a words conflict (that
   * answer's `conflict_groups` and `current` come again instead) or the op
   * wrote nothing (a re-upload the server did not take). After a first
   * answer, rebase on `entry.v` (a held draft: `held.v`).
   */
  applied_v: v.optional(v.nullable(str)),
  missing: v.optional(v.boolean()),
  entry: v.optional(v.nullable(EntryStateSchema)),
  /**
   * WP-F16-17: server state of a held draft after `held.upsert`; null when
   * no held row holds the id (kept as a letter already, or let go).
   */
  held: v.optional(v.nullable(v.object({ id: str, v: str, updated_at: str }))),
  /**
   * `app.held_sync` is 'off' (ADR 0025 section 9): the held op changed
   * nothing and was not claimed. Keep it queued and send it again later.
   */
  held_off: v.optional(v.boolean()),
  /**
   * `held.discard`: the held words changed since `base` (another phone's later
   * edit wins), or a legal hold keeps the row. The draft stays on the server
   * and the phone must not drop its words. The server sends nothing more: the
   * row comes back only when the phone pulls the held section again from a
   * null cursor (the app does, merge.ts), and only if it parses. A row the
   * parser drops (`held.rejected`, PulledHeldSectionSchema) never comes back.
   */
  kept: v.optional(v.boolean()),
  /** `entry.erase` and Erase now on a held draft: the server erased it for good. */
  erased: v.optional(v.boolean()),
  /** `entry.erase`: not erased yet; a legal hold keeps the letter, tombstoned, until the hold lifts. */
  deferred: v.optional(v.boolean()),
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
  /** SCCON: consent is missing. Ops after the last result were not applied in this push (one may have applied on an earlier send whose answer was lost) and stay queued. */
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
  /**
   * WP-F16-17 (20261016000000): the cursor for the author's own held drafts,
   * one for all books (ADR 0025 section 9). Send `held` to get the section;
   * `sync_pull` reads only `cursor` here. There is no held digest.
   */
  held?: { cursor?: string | null };
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
  /** Own rows only (author-only; 20261016000000): the review mark, or null. */
  words_reviewed_at: v.nullish(str),
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

/** A held draft as its author pulls it (WP-F16-17, 20261016000000). */
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
 * author, kept (its `entries` row took the same id), or erased (Erase now:
 * every phone erases its copy and it is never restorable). The row itself is
 * purged, so only these fields exist; the phone drops its local draft, or
 * for `kept` waits for the letter in the book section. The values are the
 * `held_drafts_gone.gone` check in 20261016000000.
 */
export const HELD_GONE_KINDS = ['discarded', 'kept', 'erased'] as const;
export const PulledHeldGoneSchema = v.object({
  id: str,
  gone: v.picklist(HELD_GONE_KINDS),
  updated_at: str,
  v: str,
});
export type PulledHeldGone = v.InferOutput<typeof PulledHeldGoneSchema>;

/** One row of the held section: a draft, or the marker of one that left. */
export const PulledHeldRowSchema = v.union([PulledHeldGoneSchema, PulledHeldSchema]);
export type PulledHeldRow = PulledHeld | PulledHeldGone;

/**
 * The held section, checked row by row (review A 3 on #138). Since
 * 20261023030000 `held_drafts` has the `entries` checks too: `capture_mode`
 * and `edit_level` take the same lists (`edit_level` may also be null), and
 * `machine_edits`, `author_edits` and `locked_spans` are each null or a JSON
 * array, beside the `kind`, `occurred_precision` and `base_direction` checks
 * of 20261016000000. A write that fails one is refused with 23514: the
 * writing phone keeps the draft and the op in `rejected_writes`, though
 * nothing shows it yet (WP-F16-01 must surface `SyncStatus.rejected` and
 * give held drafts a rejected state), and a `current` built from a held row
 * that passes them parses. Still unchecked on a held row: the
 * `entries` size caps on `author_edits` and `locked_spans`, and `language`
 * and `pack_ref`; this schema accepts any value of those, so none of them
 * makes a row fail here. A row stored before 20261023030000 can still fail:
 * the migration never changes a stored row, and a check such a row fails
 * stays NOT VALID (supabase/APPLY.md, File 22). Such a row is dropped and
 * counted in `rejected`; every other row, and the rest of the pull with its
 * books, still parses.
 *
 * What happens to the dropped row: the server keeps it, the cursor moves
 * past it, and nothing heals it. It is never shown on this phone; a phone
 * with its own copy keeps that copy, and a phone without one (a new phone,
 * or after a restore epoch) never shows that draft. It comes again only if
 * it changes, and then only if it parses. Two things are therefore
 * required, not optional (the constitution: nothing a person wrote may
 * vanish silently):
 *  - WP-F16-01 tells the person when `rejected` is above 0, and logs it as
 *    a count only, never the row, its id or its words (CLAUDE.md privacy);
 *  - the server refuses such a row at write time, so the writing phone
 *    keeps its draft and a held row's `current` cannot fail a whole push
 *    answer: built in 20261023030000 (the five checks above), so only a
 *    row stored before it can still be dropped here.
 */
export const PulledHeldSectionSchema = v.pipe(
  v.object({ rows: v.array(v.unknown()), cursor: nullableStr, more: v.boolean() }),
  v.transform(({ rows, cursor, more }) => {
    const kept: PulledHeldRow[] = [];
    for (const row of rows) {
      const r = v.safeParse(PulledHeldRowSchema, row);
      if (r.success) kept.push(r.output);
    }
    return { rows: kept, cursor, more, rejected: rows.length - kept.length };
  }),
);
export type PulledHeldSection = v.InferOutput<typeof PulledHeldSectionSchema>;

export const PullResponseSchema = v.object({
  reset: v.boolean(),
  reason: v.optional(v.picklist(['epoch', 'cursor_ahead'])),
  epoch: v.number(),
  epoch_started_at: str,
  books: v.optional(v.array(PulledBookSchema)),
  gone: v.optional(v.array(GoneBookSchema)),
  /**
   * WP-F16-17, as built (20261016000000 `sync_pull`, unchanged by
   * 20261023010000): present only when the request carried `held`, and
   * absent even then while the server's held switch is off (`app.held_sync
   * = 'off'`, ADR 0025 section 9). Read "asked for but absent" as: keep the
   * local held drafts and the held cursor as they are. The
   * author's own held drafts after the held cursor, one page across all
   * books, of every book the author is a parent of now. The server answers
   * `rows`, `cursor` and `more` only: there is no digest, so a phone cannot
   * check that it holds exactly the server's set.
   *
   * Removal is the `gone` markers alone (`discarded`, `kept`, `erased`),
   * sent only to a phone that pulled before (a non-null held cursor). Let go,
   * Keep, Erase now, and leaving the book (`leave_child`,
   * `remove_child_member`: the leaver's drafts go with a `discarded` marker
   * unless a legal hold keeps them) each leave one. What leaves no marker:
   *  - a cascade from the book or the account: the markers go with it. For a
   *    book the phone asked about, its entry in the top-level `gone` list
   *    (`deleted` or `not_member`) is the only sign; an account deletion
   *    ends the session instead;
   *  - an undone join (`undo_parent_join`, 20261023010000): the removed
   *    parent's drafts stay on the server, theirs, but are no longer served,
   *    because this section serves only books the author is a parent of;
   *  - the same for a kept author's drafts when a book is purged while their
   *    rows keep it (20261023010000): readable by them through
   *    `held_drafts_author_read`, never in this section;
   *  - a restore epoch: the pull answers `reset` instead.
   * The left-book section (`gone[].rows`) carries the author's letters only,
   * never held drafts. Never present in anyone else's pull. A malformed held
   * row is dropped and counted, never the pull, and the person must be told
   * (`PulledHeldSectionSchema`).
   */
  held: v.optional(PulledHeldSectionSchema),
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

/**
 * Validates a `sync_pull` response. Never throws. A held row the contract
 * refuses is dropped and counted in `held.rejected`; it never makes the
 * whole pull `invalid`. The caller tells the person when `held.rejected` is
 * above 0: the server keeps the row and nothing else shows it.
 */
export function parsePullResponse(input: unknown): ParseResult<PullResponse> {
  const r = v.safeParse(PullResponseSchema, input);
  return r.success ? { ok: true, value: r.output } : { ok: false, reason: 'invalid' };
}

/** The groups an op names, rejecting anything that is not a group (22023 on the server). */
export function isFieldGroupList(x: unknown): x is FieldGroup[] {
  return Array.isArray(x) && x.every((g) => (FIELD_GROUPS as readonly string[]).includes(g as string));
}

/**
 * True when a push result is a words refusal the author must resolve (F16
 * 6.2 E step 3): `conflict_groups` contains `text`, whatever `conflict`
 * says. As built (20261016000000), a refused Keep onto a new letter, first
 * answer and repeat, carries `conflict: true` beside it, and a refused
 * `entry.upsert` or a refused Keep onto a letter that already exists nearly
 * always does on its first answer; the repeat of either of those two
 * (`dup_outcome`), a refused `held.upsert` and its repeat carry
 * `conflict_groups` without `conflict`.
 * None of those words may be taken as applied. `conflict: true` without
 * `conflict_groups` is advisory: the op was applied by the later-arrival
 * rule and there is nothing to resolve.
 */
export function isWordsConflict(r: PushResult): r is PushResultOk & { conflict_groups: FieldGroup[] } {
  return r.ok === true && Array.isArray(r.conflict_groups) && r.conflict_groups.includes(WORDS_GROUP);
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

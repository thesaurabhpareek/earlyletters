/**
 * Sync wire types and the injected server surface (DECISIONS D-023; SQL in
 * supabase/migrations/20261004100000_sync_engine.sql, which documents every
 * field). Pure TypeScript: no React Native, no supabase-js import, so the
 * engine runs in Node tests against a fake or against PGlite.
 *
 * These are the contracts to move into packages/api (decision 17); until the
 * platform agent adds them there, this file is their only definition.
 */

// ── The server surface the engine needs ────────────────────────────────────

/** A PostgREST error as supabase-js returns it (code = SQLSTATE, PGRST*, or '' for no response). */
export interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

export interface RpcResult<T = unknown> {
  data: T | null;
  error: SupabaseErrorLike | null;
  /** HTTP status; 0 when no response arrived (supabase-js network failure). */
  status?: number;
}

/**
 * The only call the sync engine makes. The app's real client
 * (src/lib/supabase/client.ts) satisfies it through `rpcOf(client)` in
 * sync/index.ts; tests pass a fake or a PGlite-backed implementation.
 */
export interface SupabaseLike {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<RpcResult>;
}

// ── Push ───────────────────────────────────────────────────────────────────

export type FieldGroup = 'text' | 'in_book' | 'sounds_like_me' | 'occurred_on';
export const ALL_GROUPS: readonly FieldGroup[] = ['text', 'in_book', 'sounds_like_me', 'occurred_on'];

/** A letter as the server stores it (own letters only travel up). */
export interface EntryData {
  id: string;
  child_id: string;
  kind: string;
  occurred_on: string;
  captured_at: string;
  capture_mode: string;
  edit_level: string;
  prompt_key: string | null;
  engine_version: number;
  raw_transcript: string;
  machine_edits: unknown[];
  final_text: string;
  in_book: boolean;
  sounds_like_me: boolean | null;
  author_signs_as: string | null;
  audio_kept_on_device: boolean;
  /** Re-upload only: the phone's copy is a tombstone. */
  deleted?: boolean;
}

export type PushOpType =
  | 'entry.upsert'
  | 'entry.reupload'
  | 'entry.delete'
  | 'entry.restore'
  | 'book.first_run'
  | 'book.create'
  | 'book.update'
  | 'prefs.upsert';

export interface PushOp {
  /** Device-made UUIDv7; the server applies an op id at most once. */
  op: string;
  type: PushOpType;
  /** Letter id, book id (book.*, prefs.upsert) or a batch id (book.first_run). */
  id: string;
  data: Record<string, unknown>;
  /** entry.upsert: the field groups this op changes (insert uses all). */
  changed?: FieldGroup[];
  /** entry.upsert: the server version the edit was based on (conflict flag only). */
  base?: string | null;
  /** entry.reupload: the server's updated_at this phone last saw for the letter. */
  known_at?: string;
}

/** Server state of a letter after an op. */
export interface EntryState {
  id: string;
  v: string;
  updated_at: string;
  deleted_at: string | null;
  in_book: boolean;
  approval: string;
}

export interface PushResultOk {
  op: string;
  ok: true;
  dup?: boolean;
  applied?: boolean;
  conflict?: boolean;
  missing?: boolean;
  entry?: EntryState | null;
  book?: { id: string };
  books?: string[];
  prefs?: { child_id: string };
}

export interface PushResultErr {
  op: string;
  ok: false;
  /** SQLSTATE. The server never sends a message (it could quote a letter). */
  code: string;
  /** SCDEL for a letter whose id was purged: it was deleted elsewhere and is gone. */
  gone?: boolean;
}

export type PushResult = PushResultOk | PushResultErr;

export interface PushResponse {
  results: PushResult[];
  /** SCCON: consent is missing. Ops after the last result were not applied and stay queued. */
  paused: boolean;
  /** Transient server error at the op after the last result; retry from there. */
  stopped: boolean;
  /** Which consents are missing (terms, age, sensitive-data), when paused. */
  consent?: string | null;
  code?: string;
}

// ── Pull ───────────────────────────────────────────────────────────────────

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

export interface PullRequest {
  epoch?: number;
  books: Record<string, BookRequest>;
}

/** A letter row from the server. Others' rows never carry raw_transcript or machine_edits. */
export interface PulledRow {
  id: string;
  child_id: string;
  author_id: string;
  author_signs_as: string | null;
  kind: string;
  occurred_on: string;
  captured_at: string;
  capture_mode: string;
  edit_level: string;
  prompt_key: string | null;
  engine_version: number;
  raw_transcript?: string;
  machine_edits?: unknown[];
  final_text: string;
  in_book: boolean;
  sounds_like_me: boolean | null;
  approval: string;
  audio_kept_on_device: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  own: boolean;
  v: string;
}

export interface BookMember {
  profile_id: string;
  role: 'parent' | 'contributor';
  is_me: boolean;
  joined_at: string;
  signs_as: string | null;
}

export interface BookMeta {
  role: 'parent' | 'contributor';
  name: string;
  nickname: string | null;
  date_of_birth: string | null;
  birthday_md: string | null;
  due_date: string | null;
  family_can_read: boolean;
  created_by_me: boolean;
  my_signs_as: string | null;
  include_in_reminders: boolean;
  members: BookMember[];
}

export interface PulledBook {
  id: string;
  access: string;
  repull: boolean;
  meta_hash: string;
  meta?: BookMeta;
  rows: PulledRow[];
  cursor: string | null;
  more: boolean;
  visible?: Digest | null;
  ids?: string[];
}

export interface GoneBook {
  id: string;
  reason: 'not_member' | 'deleted';
  rows: PulledRow[];
  cursor: string | null;
  more: boolean;
}

export interface PullResponse {
  reset: boolean;
  reason?: 'epoch' | 'cursor_ahead';
  epoch: number;
  epoch_started_at: string;
  books?: PulledBook[];
  gone?: GoneBook[];
  more?: boolean;
}

// ── Engine state ───────────────────────────────────────────────────────────

/** Per-letter sync state, stored in entries.sync_state. */
export type EntrySyncState = 'local' | 'pending' | 'synced' | 'rejected' | 'held' | 'gone';

/** Per-book state, stored in children.server_state. */
export type BookServerState = 'local' | 'pending' | 'synced' | 'refused' | 'left' | 'deleted';

export type SyncPhase =
  | 'idle'
  | 'syncing'
  /** No response from the server; retried with backoff on the next trigger. */
  | 'offline'
  /** SCCON: letters wait on the phone until consent is recorded; deletions still go. */
  | 'paused_consent'
  /** The session needs a refresh (JWT expired or revoked). */
  | 'auth'
  /** A different account signed in on a phone whose letters belong to another account. */
  | 'account_mismatch';

export interface SyncStatus {
  phase: SyncPhase;
  /** Ops waiting to reach the server (letters, books, settings). */
  pending: number;
  /** Ops the server refused for good and the person has not seen yet. */
  rejected: number;
  lastSyncedAt: string | null;
  /** Missing consents when paused (terms, age, sensitive-data). */
  consent: string | null;
}

export type SyncReason = 'start' | 'foreground' | 'save' | 'refresh' | 'invite' | 'retry' | 'auth';

export interface SyncReport {
  pushed: number;
  rejected: number;
  pulled: number;
  reset: boolean;
  phase: SyncPhase;
}

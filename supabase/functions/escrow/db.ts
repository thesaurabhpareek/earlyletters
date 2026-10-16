/**
 * The escrow_* functions in the main project (20261015230000_backup_server.sql, section 8),
 * called as escrow_svc. Every call is one `select public.escrow_x($1, ...)::text` with bound
 * parameters; bytes travel as Postgres bytea text ('\x' and hex).
 */
import { toHex } from './bytes.ts';
import type { PgConnection } from './pg.ts';

export interface RequestContext {
  device_public_key_hex: string;
  deleting: boolean;
  has_keys: boolean;
  open_request: { request_id: string; state: RequestState; hold_until: string; notified: boolean } | null;
  enrolled: { device_id: string; public_key_hex: string }[];
}

export type RequestState = 'requested' | 'approved' | 'released' | 'cancelled' | 'expired';

export interface OpenResult {
  request_id: string;
  state: RequestState;
  hold_until: string;
  notified: boolean;
  created: boolean;
  token_replaced: boolean;
}

export interface WrapRow {
  child_id: string;
  key_version: number;
  escrow_key_version: number;
  escrow_wrap_hex: string;
}

export type LoadResult =
  | { state: 'ready'; request_id: string; device_public_key_hex: string; keys: WrapRow[] }
  | { state: RequestState; hold_until?: string; notified?: boolean };

export interface UnwrapRow {
  child_id: string;
  key_version: number;
  escrow_key_version: number;
  outcome: 'opened' | 'failed';
}

export interface RotationRow {
  profile_id: string;
  child_id: string;
  key_version: number;
  escrow_wrap_hex: string;
}

/** Keyset cursor: the last row of the previous batch. */
export type RotationCursor = Pick<RotationRow, 'profile_id' | 'child_id' | 'key_version'> | null;

export interface RotationNotice {
  notice_id: string;
  email: string;
}

export interface EscrowDb {
  context(profile: string, device: string): Promise<RequestContext>;
  /** session: the access token's session_id; the database refuses (28000 session_ended) once it is gone. */
  openRequest(profile: string, device: string, session: string, requestId: string, stopTokenHash: Uint8Array,
    approvals: { device_id: string; code_hash_hex: string; sealed_code_hex: string }[]): Promise<OpenResult>;
  loadWraps(profile: string, device: string, request: string, session: string): Promise<LoadResult>;
  /** opening: the first new log row's id, the email's idempotency key for this opening. */
  recordUnwraps(profile: string, device: string, request: string, rows: UnwrapRow[], requestId: string): Promise<{ rows: number; opening: number }>;
  setState(profile: string, request: string, event: 'notified' | 'released'): Promise<{ state: RequestState }>;
  rotationBatch(from: number, to: number, after: RotationCursor, limit: number): Promise<RotationRow[]>;
  rewrapKey(profile: string, child: string, keyVersion: number, from: number, to: number, wrap: Uint8Array, requestId: string):
    Promise<{ updated: boolean }>;
  /** A wrap that did not open: one `rotation` / `failed` log row (once per key and version). */
  rotationFailed(profile: string, child: string, keyVersion: number, from: number, to: number, requestId: string): Promise<{ recorded: boolean }>;
  rotationNoticesDue(to: number, limit: number): Promise<RotationNotice[]>;
  rotationNoticeSent(notice: string, ok: boolean): Promise<{ updated: boolean; pending: number }>;
  close(): Promise<void>;
}

const bytea = (u: Uint8Array) => `\\x${toHex(u)}`;

export function escrowDb(c: PgConnection): EscrowDb {
  const call = async <T>(fn: string, args: (string | null)[], casts: string[]): Promise<T> => {
    const placeholders = args.map((_, i) => `$${i + 1}::${casts[i]}`).join(', ');
    const text = await c.scalar(`select public.${fn}(${placeholders})::text`, args);
    return (text === null ? null : JSON.parse(text)) as T;
  };
  return {
    context: (p, d) => call('escrow_request_context', [p, d], ['uuid', 'uuid']),
    openRequest: (p, d, sess, rid, hash, approvals) =>
      call('escrow_open_request', [p, d, sess, rid, bytea(hash), JSON.stringify(approvals)], ['uuid', 'uuid', 'uuid', 'text', 'bytea', 'jsonb']),
    loadWraps: (p, d, r, sess) => call('escrow_load_wraps', [p, d, r, sess], ['uuid', 'uuid', 'uuid', 'uuid']),
    recordUnwraps: (p, d, r, rows, rid) =>
      call('escrow_record_unwraps', [p, d, r, JSON.stringify(rows), rid], ['uuid', 'uuid', 'uuid', 'jsonb', 'text']),
    setState: (p, r, ev) => call('escrow_set_request_state', [p, r, ev], ['uuid', 'uuid', 'text']),
    rotationBatch: (from, to, after, limit) =>
      call('escrow_rotation_batch', [String(from), String(to), after?.profile_id ?? null, after?.child_id ?? null,
        after ? String(after.key_version) : null, String(limit)], ['int', 'int', 'uuid', 'uuid', 'int', 'int']),
    rewrapKey: (p, child, kv, from, to, wrap, rid) =>
      call('escrow_rewrap_key', [p, child, String(kv), String(from), String(to), bytea(wrap), rid], ['uuid', 'uuid', 'int', 'int', 'int', 'bytea', 'text']),
    rotationFailed: (p, child, kv, from, to, rid) =>
      call('escrow_rotation_failed', [p, child, String(kv), String(from), String(to), rid], ['uuid', 'uuid', 'int', 'int', 'int', 'text']),
    rotationNoticesDue: (to, limit) => call('escrow_rotation_notices_due', [String(to), String(limit)], ['int', 'int']),
    rotationNoticeSent: (n, ok) => call('escrow_rotation_notice_sent', [n, ok ? 'true' : 'false'], ['uuid', 'boolean']),
    close: () => c.close(),
  };
}

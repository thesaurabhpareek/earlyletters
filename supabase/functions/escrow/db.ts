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

export interface EscrowDb {
  context(profile: string, device: string): Promise<RequestContext>;
  openRequest(profile: string, device: string, requestId: string, stopTokenHash: Uint8Array,
    approvals: { device_id: string; code_hash_hex: string; sealed_code_hex: string }[]): Promise<OpenResult>;
  loadWraps(profile: string, device: string, request: string): Promise<LoadResult>;
  recordUnwraps(profile: string, device: string, request: string, rows: UnwrapRow[], requestId: string): Promise<number>;
  setState(profile: string, request: string, event: 'notified' | 'released'): Promise<{ state: RequestState }>;
  rotationBatch(from: number, limit: number): Promise<RotationRow[]>;
  rewrapKey(profile: string, child: string, keyVersion: number, from: number, to: number, wrap: Uint8Array, requestId: string):
    Promise<{ updated: boolean; first_for_account: boolean; email: string | null }>;
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
    openRequest: (p, d, rid, hash, approvals) =>
      call('escrow_open_request', [p, d, rid, bytea(hash), JSON.stringify(approvals)], ['uuid', 'uuid', 'text', 'bytea', 'jsonb']),
    loadWraps: (p, d, r) => call('escrow_load_wraps', [p, d, r], ['uuid', 'uuid', 'uuid']),
    recordUnwraps: (p, d, r, rows, rid) =>
      call('escrow_record_unwraps', [p, d, r, JSON.stringify(rows), rid], ['uuid', 'uuid', 'uuid', 'jsonb', 'text']),
    setState: (p, r, ev) => call('escrow_set_request_state', [p, r, ev], ['uuid', 'uuid', 'text']),
    rotationBatch: (from, limit) => call('escrow_rotation_batch', [String(from), String(limit)], ['int', 'int']),
    rewrapKey: (p, child, kv, from, to, wrap, rid) =>
      call('escrow_rewrap_key', [p, child, String(kv), String(from), String(to), bytea(wrap), rid], ['uuid', 'uuid', 'int', 'int', 'int', 'bytea', 'text']),
    close: () => c.close(),
  };
}

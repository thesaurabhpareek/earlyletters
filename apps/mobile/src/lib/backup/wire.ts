/**
 * The wire between the backup ports and the S05 server (PR #151:
 * `supabase/migrations/<ts>_backup_server.sql` and `supabase/functions/escrow/`).
 * Pure TypeScript, no React Native or supabase-js, so the Node suite checks
 * every argument name and answer shape against the server's own (test/backup-wire.test.ts).
 * runtime.ts sends what this file builds and reads back what it parses; nothing
 * else in lib/backup knows a column, an RPC argument or a route.
 */
import { b64, bytesToBase64, bytesToHex, hexToBytes, isUuid } from './bytes';
import {
  BackupServerError,
  SEAL_SUITE,
  objectPathFor,
  type BeginInput,
  type BlobRow,
  type ChildKeyRow,
  type EscrowClient,
  type ReleaseOutcome,
  type ReleasedKey,
  type RestoreRequest,
  type StoreKeyInput,
} from './contract';
import { FORMAT_VERSION } from './format';

// ── Main project: RPC arguments and table rows ───────────────────────────

/** Postgres bytea text for PostgREST: `\x` and lowercase hex. */
export const bytea = (b: Uint8Array): string => `\\x${bytesToHex(b)}`;

/** bytea text from PostgREST (`\x` and hex) to bytes; throws on anything else. */
export function fromBytea(s: string): Uint8Array {
  if (typeof s !== 'string' || !s.startsWith('\\x')) throw new BackupServerError('bad_response', false);
  return hexToBytes(s.slice(2));
}

/** `backup_register_device(p_device_id uuid, p_public_key bytea)`. */
export function registerDeviceArgs(x: { deviceId: string; publicKey: string }): Record<string, unknown> {
  const pk = b64(x.publicKey);
  if (pk.length !== 32 || !isUuid(x.deviceId)) throw new BackupServerError('bad_request', false);
  return { p_device_id: x.deviceId, p_public_key: bytea(pk) };
}

/**
 * `backup_store_key(p_child, p_key_version, p_escrow_key_version, p_wrap jsonb, p_key_check bytea)`.
 * The wrap is S07's SealedBox; the server stores it as format 1 (0x01 || enc || ct).
 */
export function storeKeyArgs(k: StoreKeyInput): Record<string, unknown> {
  const enc = b64(k.enc);
  const ct = b64(k.ct);
  const check = b64(k.keyCheck);
  if (enc.length !== 32 || ct.length !== 48 || check.length !== 16) throw new BackupServerError('bad_request', false);
  return {
    p_child: k.childId,
    p_key_version: k.keyVersion,
    p_escrow_key_version: k.escrowKeyVersion,
    p_wrap: { suite: SEAL_SUITE, enc: k.enc, ct: k.ct },
    p_key_check: bytea(check),
  };
}

/** Columns the owner may read on `child_keys` (escrow_wrap is not granted). */
export const CHILD_KEY_COLUMNS = 'child_id, key_version, escrow_key_version, key_check';

export interface ChildKeyWire {
  child_id: string;
  key_version: number;
  escrow_key_version: number;
  key_check: string | null;
}

/** A row without a key check (made before the column existed) stays null: the phone then trusts a local key. */
export function childKeyRow(r: ChildKeyWire): ChildKeyRow {
  let keyCheck: string | null = null;
  if (r.key_check !== null && r.key_check !== undefined) {
    const check = fromBytea(r.key_check);
    if (check.length !== 16) throw new BackupServerError('bad_response', false);
    keyCheck = bytesToBase64(check);
  }
  return { childId: r.child_id, keyVersion: r.key_version, escrowKeyVersion: r.escrow_key_version, keyCheck };
}

/** `backup_begin(p_entry, p_child, p_bytes, p_key_version, p_wrapped_file_key bytea, p_format_version)`. */
export function beginArgs(b: BeginInput): Record<string, unknown> {
  return {
    p_entry: b.entryId,
    p_child: b.childId,
    p_bytes: b.bytes,
    p_key_version: b.keyVersion,
    p_wrapped_file_key: bytea(b64(b.wrappedFileKey)),
    p_format_version: FORMAT_VERSION,
  };
}

/** `backup_confirm(p_entry, p_cipher_sha256 bytea)`; the hash is lowercase hex here. */
export function confirmArgs(entryId: string, cipherSha256: string): Record<string, unknown> {
  const h = hexToBytes(cipherSha256);
  if (h.length !== 32) throw new BackupServerError('bad_request', false);
  return { p_entry: entryId, p_cipher_sha256: bytea(h) };
}

export const BLOB_COLUMNS = 'entry_id, child_id, author_id, object_path, key_version, cipher_sha256, bytes';

export interface BlobWire {
  entry_id: string;
  child_id: string;
  author_id: string;
  object_path: string;
  key_version: number;
  cipher_sha256: string;
  bytes: number | string;
}

/** Mine only: the author is me and the path is the one the server builds from it. Anything else is dropped. */
export function blobRow(r: BlobWire, profileId: string): BlobRow | null {
  if (r.author_id !== profileId || r.object_path !== objectPathFor(r.child_id, profileId, r.entry_id)) return null;
  return {
    entryId: r.entry_id,
    childId: r.child_id,
    objectPath: r.object_path,
    keyVersion: r.key_version,
    cipherSha256: bytesToHex(fromBytea(r.cipher_sha256)),
    bytes: Number(r.bytes),
  };
}

// ── Escrow project: the `escrow` function ────────────────────────────────

/** Routes under the escrow project's URL (`supabase/functions/escrow/contract.ts`). */
export const ESCROW_ROUTES = {
  create: '/functions/v1/escrow/v1/restore-requests',
  release: (requestId: string) => `/functions/v1/escrow/v1/restore-requests/${requestId}/release`,
} as const;

interface SealedBoxWire {
  suite: string;
  enc: string;
  ct: string;
}

type RequestViewWire = { request_id: string; state: 'requested' | 'approved' | 'released'; hold_until: string };
type ReleaseResultWire =
  | { state: 'released'; request_id: string; keys: { child_id: string; key_version: number; sealed: SealedBoxWire }[] }
  | { state: 'requested' | 'approved'; request_id: string; hold_until: string };

interface Envelope<T> {
  ok?: boolean;
  data?: T;
  error?: { code?: string; retryable?: boolean; detail?: string };
}

/** A released key: the suite must be ours and the sizes those of a sealed 32-byte key. */
export function releasedKey(k: { child_id: string; key_version: number; sealed: SealedBoxWire }): ReleasedKey {
  const s = k.sealed;
  if (!s || s.suite !== SEAL_SUITE || b64(s.enc).length !== 32 || b64(s.ct).length !== 48) throw new BackupServerError('bad_response', false);
  return { childId: k.child_id, keyVersion: k.key_version, enc: s.enc, ct: s.ct };
}

export interface FetchLike {
  (url: string, init: { method: 'POST'; headers: Record<string, string>; body: string }): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

export interface EscrowClientDeps {
  /** The `scribe-escrow` project's URL; anything but https makes escrow unavailable. */
  baseUrl: string;
  /** The user's access token from the MAIN project. */
  accessToken: () => Promise<string | null>;
  fetch: FetchLike;
  /** Idempotency key header name and a fresh id per call. */
  idempotency: { header: string; newId: () => string };
}

export function createEscrowClient(d: EscrowClientDeps): EscrowClient {
  const base = d.baseUrl.trim().replace(/\/+$/, '');
  async function post<T>(route: string, deviceId: string): Promise<{ status: number; data: T | null; error: Envelope<T>['error'] | null }> {
    if (!/^https:\/\//.test(base)) throw new BackupServerError('unavailable', false);
    const token = await d.accessToken();
    if (!token) throw new BackupServerError('unauthorized', false);
    let res;
    try {
      res = await d.fetch(`${base}${route}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', [d.idempotency.header]: d.idempotency.newId() },
        body: JSON.stringify({ device_id: deviceId }),
      });
    } catch {
      throw new BackupServerError('network', true);
    }
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (res.ok && json?.ok && json.data) return { status: res.status, data: json.data, error: null };
    return { status: res.status, data: null, error: json?.error ?? null };
  }
  const fail = (status: number, e: Envelope<unknown>['error'] | null): BackupServerError =>
    new BackupServerError(e?.code ?? `HTTP${status}`, e?.retryable ?? status >= 500, null, e?.detail ?? null);

  return {
    async request(deviceId): Promise<RestoreRequest> {
      const r = await post<RequestViewWire>(ESCROW_ROUTES.create, deviceId);
      if (!r.data) throw fail(r.status, r.error);
      if (!isUuid(r.data.request_id)) throw new BackupServerError('bad_response', false);
      return { requestId: r.data.request_id, state: r.data.state, holdUntil: r.data.hold_until };
    },
    async release(requestId, deviceId): Promise<ReleaseOutcome> {
      if (!isUuid(requestId)) throw new BackupServerError('bad_request', false);
      const r = await post<ReleaseResultWire>(ESCROW_ROUTES.release(requestId.toLowerCase()), deviceId);
      if (!r.data) {
        // A closed request: 410 gone with detail cancelled or expired. Never asked again on its own.
        if (r.status === 410 && r.error?.code === 'gone' && (r.error.detail === 'cancelled' || r.error.detail === 'expired')) return { state: r.error.detail };
        throw fail(r.status, r.error);
      }
      // The release is sealed to the id in the path; an answer for any other request is refused.
      if (r.data.request_id?.toLowerCase() !== requestId.toLowerCase()) throw new BackupServerError('bad_response', false);
      if (r.data.state === 'released') return { state: 'released', keys: r.data.keys.map(releasedKey), requestId: r.data.request_id };
      return { state: r.data.state, holdUntil: r.data.hold_until, requestId: r.data.request_id };
    },
  };
}

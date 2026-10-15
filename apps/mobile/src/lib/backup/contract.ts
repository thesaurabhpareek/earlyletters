/**
 * The server surface the backup client is written against (F08 6.5 "Server
 * objects", ADR 0023). Two drafts existed on 15 Oct and they differ; neither
 * has merged to `develop`:
 *
 * - S07's `packages/api/src/server/recovery-key.ts` (contract v1, PR #138):
 *   `backup_register_device(p_device_id, ...)`, `backup_store_key(..., p_wrap:
 *   SealedBox)`, five `restore-requests` routes, `ReleaseResult`.
 * - The S05 server's draft (`supabase/migrations/<ts>_backup_server.sql` and
 *   `supabase/functions/escrow/`, uncommitted in its worktree, read on 15 Oct):
 *   `backup_register_device(p_device, p_public_key bytea)`, `backup_store_key(
 *   p_child, p_key_version, p_escrow_wrap bytea, p_escrow_key_version)`,
 *   `backup_begin`, `backup_confirm`, table reads for keys and blobs, one
 *   create-or-poll escrow route, and the byte labels below.
 *
 * The bytes have to match the code that opens them, so the labels, the wrap
 * format and the RPC arguments follow the S05 server draft; the wire mapping
 * lives only in runtime.ts, so following S07 instead is a change there and
 * nowhere else. The PR asks S07 and the S05 server to reconcile, and asks for
 * what neither has (the key check).
 */
import { concat, utf8ToBytes } from './bytes';

export const BACKUP_BUCKET = 'entry-audio';
/** The private bucket's object size limit (F08 6.5): a 30-minute take is about 14.4 MB. */
export const MAX_OBJECT_BYTES = 20 * 1024 * 1024;

/** The exact path the purge worker already expects (`purge-worker/lib/buckets.ts`). */
export function objectPathFor(childId: string, authorId: string, entryId: string): string {
  return `${childId}/${authorId}/${entryId}.m4a.enc`;
}

/** RPC names (the S05 server draft; S07 #138 has the first two). Keys and blobs are read from their tables under RLS. */
export const BACKUP_RPC = {
  registerDevice: 'backup_register_device',
  storeKey: 'backup_store_key',
  begin: 'backup_begin',
  confirm: 'backup_confirm',
} as const;

/** The consent act's policy document key (F08-REQ-039), recorded through `record_policy_act`. */
export const BACKUP_POLICY_DOCUMENT = 'backup';

/**
 * Error codes the client acts on: the SQLSTATE in `code` and, where the S05
 * server draft sets one, the `details` value PostgREST passes through.
 */
export const BACKUP_ERRORS = {
  /** No active `backup` consent act: the whole queue pauses (F08-REQ-039). */
  consent: 'SCCON',
  rate: 'SCRAT',
  /** Account at the 5 GB quota: `backup_begin` refuses; the row says so (F08-U28). */
  quota: 'SCQTA',
  /** Backup or escrow switched off on the server (`app.backup_enabled`): wait, never drop. */
  switchedOff: 'SCBKO',
  /** `P0002` details `entry`: no `entries` or `held_drafts` row of mine with this id yet: wait for the outbox. */
  notFound: 'P0002',
  /** `SCIMM` details `key_exists`: that book key version exists for (child, me): another of my devices stored it first. */
  immutable: 'SCIMM',
  notParent: 'SCPAR',
  /** `SCDEL` details `purged`: the letter was erased on the server. */
  deleted: 'SCDEL',
} as const;

export function isKeyExists(e: unknown): boolean {
  return e instanceof BackupServerError && ((e.code === BACKUP_ERRORS.immutable && e.detail === 'key_exists') || e.code === 'SCDUP');
}

export interface ChildKeyRow {
  childId: string;
  keyVersion: number;
  escrowKeyVersion: number;
  /**
   * base64 of `bookKeyCheck` (16 bytes): which key this row escrowed. Neither
   * draft has it yet ([R] to both: a `p_key_check` argument on
   * `backup_store_key` and a readable `key_check` column on `child_keys`).
   * Null: the phone trusts a local key of that version (no conflict check).
   */
  keyCheck: string | null;
}

export interface StoreKeyInput extends ChildKeyRow {
  keyCheck: string;
  /** HPKE encapsulated key, base64 (32 bytes). */
  enc: string;
  /** HPKE ciphertext of the book key, base64 (48 bytes). */
  ct: string;
}

export interface BeginInput {
  entryId: string;
  childId: string;
  /** Ciphertext length; the quota counts it. */
  bytes: number;
  keyVersion: number;
  /** base64 of the 60-byte wrapped file key (the header's key block without the version). */
  wrappedFileKey: string;
}

export interface BeginResult {
  objectPath: string;
  /** `confirmed` when this id is already backed up: the client marks it done and uploads nothing. */
  state: 'pending' | 'confirmed';
  /** [R] Signed upload token for `createSignedUploadUrl` (sent as `x-signature` on the resumable endpoint). Null: use the JWT. */
  uploadToken: string | null;
}

export interface BlobRow {
  entryId: string;
  childId: string;
  objectPath: string;
  keyVersion: number;
  cipherSha256: string;
  bytes: number;
}

/** Where a resumable upload goes (Supabase Storage TUS endpoint, `/storage/v1/upload/resumable`). */
export interface UploadTarget {
  endpoint: string;
  headers: Record<string, string>;
}

export class BackupServerError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
    readonly retryAfterSeconds: number | null = null,
    /** A closed value from the envelope's ERROR_DETAILS (for escrow: `ESCROW_ERROR_DETAILS`). */
    readonly detail: string | null = null,
  ) {
    super(`backup_server_${code || 'network'}`);
  }
}

/** Everything the client calls on the main project. One adapter in the app (runtime.ts), one fake in tests. */
export interface BackupServer {
  registerDevice(input: { deviceId: string; publicKey: string }): Promise<void>;
  listKeys(): Promise<ChildKeyRow[]>;
  storeKey(input: StoreKeyInput): Promise<void>;
  begin(input: BeginInput): Promise<BeginResult>;
  confirm(entryId: string, cipherSha256: string): Promise<void>;
  listBlobs(): Promise<BlobRow[]>;
  recordConsent(action: 'accept' | 'withdraw'): Promise<void>;
  uploadTarget(objectPath: string, uploadToken: string | null): Promise<UploadTarget>;
  /** A short-lived signed download URL for one of my objects. */
  downloadUrl(objectPath: string): Promise<string>;
}

// ── Escrow (the separate `scribe-escrow` project, F08 6.5 C and G2) ─────────

/** HPKE base mode, DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, AES-256-GCM (S07 `SEAL_SUITE`). */
export const SEAL_SUITE = 'hpke-x25519-sha256-aes256gcm' as const;

/** The S05 server draft's one route: create a request, or poll it (safe to repeat). S07 #138 proposes five. */
export const ESCROW_ROUTE = '/functions/v1/escrow/v1/restore';

/** Escrow refusals the client acts on (error `code` or `detail`). */
export const ESCROW_DETAILS = {
  stopped: ['cancelled', 'expired', 'deletion_pending', 'device_revoked'],
  signInAgain: ['step_up_required', 'reauth_required'],
} as const;

export type RestoreState = 'requested' | 'approved' | 'released' | 'cancelled' | 'expired';

export interface RestoreRequest {
  requestId: string;
  state: RestoreState;
  /** ISO time the keys can be released without an approval (24 h, or 72 h with another enrolled device). */
  holdUntil: string;
}

export interface ReleasedKey {
  childId: string;
  keyVersion: number;
  /** The book key sealed to this device's public key (HPKE base mode), base64. */
  enc: string;
  ct: string;
}

/** What a poll answers: the keys; still held; or closed (a Stop, Not me, or the release window passed). */
export type ReleaseOutcome =
  | { state: 'released'; requestId: string; keys: ReleasedKey[] }
  | { state: 'requested' | 'approved'; requestId: string; holdUntil: string }
  | { state: 'cancelled' | 'expired' };

/**
 * v1.0 has no key rotation: a phone encrypts only under book key version 1.
 * A row with a higher version (which only a direct table write could make,
 * since `backup_store_key` refuses a second version) is never used to
 * encrypt; restore may still open an object that names it. Rotation lifts
 * this in its own ADR.
 */
export const ENCRYPT_KEY_VERSION = 1;

/** The `escrow` function as the client sees it. Both calls may be the same create-or-poll route. */
export interface EscrowClient {
  request(deviceId: string): Promise<RestoreRequest>;
  release(requestId: string, deviceId: string): Promise<ReleaseOutcome>;
}

/** An escrow public key the app trusts. [R] `packages/api/src/escrow-keys.ts` (S07), filled by the WP-F08-B8 ceremony. */
export interface EscrowPublicKey {
  version: number;
  /** X25519 public key, base64 of 32 raw bytes. */
  publicKey: string;
}

// ── Labels, associated data and the wrap format (ADR 0023 section 2) ────────
// The same bytes as the S05 server draft's `supabase/functions/escrow/hpke.ts`
// (INFO, aad, packV1): the codename, never the product name; lowercase ids
// joined with '|', so a wrap opens only as the row it was written for.

const ids = (...parts: (string | number)[]) => utf8ToBytes(parts.join('|').toLowerCase());

/** HPKE info when a phone seals a book key to the escrow key (`child_keys.escrow_wrap`). */
export function escrowInfo(): Uint8Array {
  return utf8ToBytes('scribe/escrow/book-key/v1');
}

/** HPKE associated data of that seal: whose key, which book, which version, which escrow key. */
export function escrowAad(profileId: string, childId: string, keyVersion: number, escrowKeyVersion: number): Uint8Array {
  return ids(profileId, childId, keyVersion, escrowKeyVersion);
}

/** HPKE info when the escrow function seals a book key to the requesting device. */
export function releaseInfo(): Uint8Array {
  return utf8ToBytes('scribe/escrow/release/v1');
}

/** HPKE associated data of a release: whose key, to which device, for which request, which book and version. */
export function releaseAad(profileId: string, deviceId: string, requestId: string, childId: string, keyVersion: number): Uint8Array {
  return ids(profileId, deviceId, requestId, childId, keyVersion);
}

/** Escrow wrap format 1: 0x01 || HPKE enc (32) || ciphertext of the 32-byte book key with its tag (48) = 81 bytes. */
export const ESCROW_WRAP_FORMAT = 1;

export function packEscrowWrap(enc: Uint8Array, ct: Uint8Array): Uint8Array {
  return concat(new Uint8Array([ESCROW_WRAP_FORMAT]), enc, ct);
}

/** A 32-byte book key seals to 48 bytes, so a format 1 wrap is exactly 81. */
export const ESCROW_WRAP_LEN = 1 + 32 + 48;

export function unpackEscrowWrap(b: Uint8Array): { enc: Uint8Array; ct: Uint8Array } {
  if (b.length !== ESCROW_WRAP_LEN || b[0] !== ESCROW_WRAP_FORMAT) throw new BackupServerError('bad_request', false);
  return { enc: b.slice(1, 33), ct: b.slice(33) };
}

/** Label for the key check (HMAC-SHA256 under the book key; ours, [R] to both drafts). */
export function keyCheckLabel(profileId: string, childId: string, keyVersion: number): Uint8Array {
  return concat(utf8ToBytes('scribe/backup/key-check/v1|'), ids(profileId, childId, keyVersion));
}

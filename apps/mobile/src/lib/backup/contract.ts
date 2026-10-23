/**
 * The server surface the backup client is written against (F08 6.5 "Server
 * objects", ADR 0024): the S05 server, PR #151
 * (`supabase/migrations/<ts>_backup_server.sql` and `supabase/functions/escrow/`),
 * which follows S07's names in `packages/api/src/server/recovery-key.ts` (#138).
 *
 * The ports here are the client's own shapes. Every argument name, column and
 * route lives in wire.ts, which test/backup-wire.test.ts checks against the
 * server's; the byte labels below are the server's `escrow/hpke.ts` (INFO, aad,
 * packV1), pinned in test/backup-keys.test.ts.
 */
import { concat, utf8ToBytes } from './bytes';

export const BACKUP_BUCKET = 'entry-audio';
/** The private bucket's object size limit (F08 6.5): a 30-minute take is about 14.4 MB. */
export const MAX_OBJECT_BYTES = 20 * 1024 * 1024;

/** The exact path the purge worker already expects (`purge-worker/lib/buckets.ts`). */
export function objectPathFor(childId: string, authorId: string, entryId: string): string {
  return `${childId}/${authorId}/${entryId}.m4a.enc`;
}

/** RPC names (#151). Keys and blobs are read from their tables under RLS (wire.ts). */
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
 * server (#151) sets one, the `details` value PostgREST passes through.
 */
export const BACKUP_ERRORS = {
  /** No active `backup` consent act: the whole queue pauses (F08-REQ-039). */
  consent: 'SCCON',
  rate: 'SCRAT',
  /** Account at the 5 GB quota: `backup_begin` refuses; the row says so (F08-U28). */
  quota: 'SCQTA',
  /** Backup or escrow switched off on the server (`app.backup_enabled`): wait, never drop. */
  switchedOff: 'SCBKO',
  /** `P0002` details `entry`: no `entries` row of mine with this id yet (held drafts are refused for now, #151): wait for the outbox. */
  notFound: 'P0002',
  /** `SCIMM` details `key_exists`: that book key version exists for (child, me): another of my devices stored it first. */
  immutable: 'SCIMM',
  notParent: 'SCPAR',
  /** `SCDEL` details `purged`: the letter was erased on the server. */
  deleted: 'SCDEL',
  /**
   * `SCSTP` details `step_up_required`: this call needs a sign-in in the last 10 minutes, in a
   * live session. Ask the person to sign in again, then retry; a silent token refresh cannot
   * satisfy it (S07 #138 `envelope.ts`: `reauth_required`, `tell_user`).
   */
  stepUp: 'SCSTP',
  /**
   * `28000`: not signed in, or details `session_ended`: the session was ended (the Stop link
   * signs out every session). Sign in again (S07 #138 `envelope.ts`: `unauthorized`, `reauth`).
   */
  signedOut: '28000',
} as const;

/**
 * The person has to sign in again before this can go on: from the main project, `SCSTP`
 * (step-up) or `28000` (signed out, or `session_ended`); from the escrow function, 401
 * `reauth_required` or `unauthorized`, or either detail. Nothing is retried silently.
 */
export function needsSignIn(e: unknown): boolean {
  if (!(e instanceof BackupServerError)) return false;
  const again = ESCROW_DETAILS.signInAgain as readonly string[];
  return e.code === BACKUP_ERRORS.stepUp || e.code === BACKUP_ERRORS.signedOut || again.includes(e.code) || (e.detail !== null && again.includes(e.detail));
}

export function isKeyExists(e: unknown): boolean {
  return e instanceof BackupServerError && ((e.code === BACKUP_ERRORS.immutable && e.detail === 'key_exists') || e.code === 'SCDUP');
}

export interface ChildKeyRow {
  childId: string;
  keyVersion: number;
  escrowKeyVersion: number;
  /**
   * base64 of `bookKeyCheck` (16 bytes): which key this row escrowed
   * (`child_keys.key_check`, sent as `p_key_check`). Null only on a row stored
   * without one: the phone then trusts a local key of that version unless it
   * marked it untrusted (keys.ts).
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

/** Escrow refusals the client acts on (error `code` or `detail`). */
export const ESCROW_DETAILS = {
  /**
   * The request is over and is never asked again on its own (only Try again asks once more).
   * `device_unknown`: this device is not registered, or was revoked (Not me, or removed in
   * Settings); a revoked phone must never quietly enrol a new key and ask again.
   */
  stopped: ['cancelled', 'expired', 'deletion_pending', 'device_unknown'],
  /**
   * The request needs a fresh sign-in: the 10-minute step-up (401 `reauth_required`, detail
   * `step_up_required`), or 401 `unauthorized` when the token was refused or its session has
   * ended (sqlstate `28000`, detail `session_ended`: a Stop signs out every session). Nothing
   * was asked either way. `needsSignIn` checks these with the main project's `SCSTP` and `28000`.
   */
  signInAgain: ['step_up_required', 'session_ended', 'reauth_required', 'unauthorized'],
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

/**
 * What a poll answers: the keys; still held; or closed (a Stop, Not me, or the release window passed).
 * `requestId` is the request the server answered for, when it says; a release is sealed to that id.
 */
export type ReleaseOutcome =
  | { state: 'released'; keys: ReleasedKey[]; requestId?: string }
  | { state: 'requested' | 'approved'; holdUntil: string; requestId?: string }
  | { state: 'cancelled' | 'expired'; requestId?: string };

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

// ── Labels, associated data and the wrap format (ADR 0024 section 2) ────────
// The same bytes as the S05 server's `supabase/functions/escrow/hpke.ts` (#151)
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
export const ESCROW_WRAP_LEN = 1 + 32 + 32 + 16;

export function packEscrowWrap(enc: Uint8Array, ct: Uint8Array): Uint8Array {
  return concat(new Uint8Array([ESCROW_WRAP_FORMAT]), enc, ct);
}

export function unpackEscrowWrap(b: Uint8Array): { enc: Uint8Array; ct: Uint8Array } {
  // Format 1 seals exactly a 32-byte book key: enc (32) and ciphertext with tag (48).
  if (b.length !== ESCROW_WRAP_LEN || b[0] !== ESCROW_WRAP_FORMAT) throw new BackupServerError('bad_request', false);
  return { enc: b.slice(1, 33), ct: b.slice(33) };
}

/** Label for the key check (HMAC-SHA256 under the book key; ours, [R] to both drafts). */
export function keyCheckLabel(profileId: string, childId: string, keyVersion: number): Uint8Array {
  return concat(utf8ToBytes('scribe/backup/key-check/v1|'), ids(profileId, childId, keyVersion));
}

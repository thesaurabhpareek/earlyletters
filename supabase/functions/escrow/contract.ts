/**
 * The recovery-key wire contract as this function serves it. S07 owns the contract in
 * packages/api/src/server/recovery-key.ts (v1, PR #138); these are the same shapes, kept here
 * because the escrow function may import nothing from outside its folder (a test checks). Where
 * this function differs from S07's draft, the PR body lists the change requested of S07.
 *
 *   POST {escrow}/functions/v1/escrow/v1/restore-requests              { "device_id": "<uuid>" }
 *     -> RequestView. Opens a request (step-up: a sign-in in the last 10 minutes) or returns the
 *        open one. Safe to repeat.
 *   POST {escrow}/functions/v1/escrow/v1/restore-requests/<id>/release { "device_id": "<uuid>" }
 *     -> ReleaseResult. Poll until "released"; 410 gone with detail cancelled | expired when closed.
 *   Authorization: Bearer <the user's access token from the MAIN project>; x-request-id optional.
 *
 * Not here (main-project RPCs, migration <ts>_backup_server.sql): pending requests with the sealed
 * approval code (backup_pending_requests), approve with the opened code (backup_approve_request),
 * Not me and Stop in Settings (backup_cancel_request), the stop link (backup_svc_stop, S01's
 * account-stop endpoint).
 */

/** HPKE base mode, DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, AES-256-GCM (S07 SEAL_SUITE). */
export const SEAL_SUITE = 'hpke-x25519-sha256-aes256gcm' as const;

export interface SealedBox {
  suite: typeof SEAL_SUITE;
  /** The encapsulated ephemeral X25519 public key, standard base64 (32 bytes). */
  enc: string;
  /** AES-256-GCM ciphertext with its tag, standard base64 (48 bytes for a 32-byte key). */
  ct: string;
}

export interface CreateRestoreRequestBody {
  device_id: string;
}
export type ReleaseRequestBody = CreateRestoreRequestBody;

export interface RequestView {
  request_id: string;
  state: 'requested' | 'approved' | 'released';
  hold_until: string;
  is_this_device: true;
}

/** Each book key sealed to the requesting device: info "scribe/escrow/release/v1",
 *  aad "<profile>|<device>|<request_id>|<child_id>|<key_version>" (lowercase ids). */
export type ReleaseResult =
  | { state: 'released'; request_id: string; keys: { child_id: string; key_version: number; sealed: SealedBox }[] }
  | { state: 'requested' | 'approved'; request_id: string; hold_until: string };

/** ADR 0017 codes, v2 list in S07's envelope.ts (paused and reauth_required are v2). */
export type EscrowErrorCode =
  | 'bad_request' | 'unauthorized' | 'not_found' | 'deleted' | 'gone' | 'rate_limited' | 'paused' | 'reauth_required'
  | 'unavailable' | 'internal' | 'payload_too_large';

/** Closed details, the subset of S07's ERROR_DETAILS this function uses. */
export const ESCROW_ERROR_DETAILS = [
  'step_up_required', 'device_unknown', 'cancelled', 'expired', 'deletion_pending', 'limit_restores', 'limit_keys', 'escrow',
] as const;
export type EscrowErrorDetail = (typeof ESCROW_ERROR_DETAILS)[number];

export type Envelope<T> =
  | { ok: true; data: T; requestId: string }
  | { ok: false; error: { code: EscrowErrorCode; retryable: boolean; sqlstate?: string; detail?: EscrowErrorDetail }; requestId: string };

/** Byte formats the phone must produce or open (hpke.ts INFO and aad). */
export const FORMATS = {
  escrowWrap: 'SealedBox to the escrow public key; info scribe/escrow/book-key/v1; aad <profile>|<child>|<key_version>|<escrow_key_version>; stored as 0x01 || enc || ct (81 bytes)',
  approvalCode: 'SealedBox of a 32-byte code; info scribe/escrow/approval/v1; aad <profile>|<device>; send the opened code to backup_approve_request',
  release: 'SealedBox of the 32-byte book key; info scribe/escrow/release/v1; aad <profile>|<device>|<request_id>|<child_id>|<key_version>',
  ids: 'lowercase UUID text, joined with |',
} as const;

/**
 * Recovery-key (escrow) contract, version 1: device keys, stored wraps,
 * restore requests, release, approvals, the Stop link and the unwrap notice
 * (F08 6.5 A to G; M16; R2 AR-05 to AR-11; R8 R2A-01, -07 to -09, -24;
 * F11-REQ-029). Shapes only: the `escrow` function lives in its own project
 * `scribe-escrow` (F08 6.5 G2) and is S05's (WP-F08-B4); the RPCs are S05's
 * migration. Numbers here are the one copy the app, the function and the
 * tests read; F08 6.5 C is their source.
 *
 * What never crosses the wire: a plaintext book key, a file key, an escrow
 * private key, audio. The function returns each book key sealed to the
 * requesting device's registered public key, so only that device can open it.
 *
 * Server-feature contract: imported only through `@scribe/api/server`.
 * Edge Functions import this file directly (Deno), so it stays a leaf module.
 */
import * as v from 'valibot';

export const RECOVERY_CONTRACT_VERSION = 1;

/**
 * Sealing suite for every wrap: HPKE base mode, DHKEM(X25519, HKDF-SHA256),
 * HKDF-SHA256, AES-256-GCM (RFC 9180; CryptoKit `HPKE.Ciphersuite
 * .Curve25519_SHA256_AES_GCM_256`, iOS 17 [A: WP-F08-B1]).
 */
export const SEAL_SUITE = 'hpke-x25519-sha256-aes256gcm' as const;

/** Standard base64 of exactly 32 bytes (44 characters with padding). */
export const B64_32_RE = /^[A-Za-z0-9+/]{43}=$/;
/** Standard base64, at most 4 KB decoded. */
export const B64_RE = /^(?:[A-Za-z0-9+/]{4}){1,1366}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const SealedBoxSchema = v.strictObject({
  suite: v.literal(SEAL_SUITE),
  /** The encapsulated ephemeral X25519 public key. */
  enc: v.pipe(v.string(), v.regex(B64_32_RE)),
  /** AES-256-GCM ciphertext with its 16-byte tag. A 32-byte key seals to 48 bytes. */
  ct: v.pipe(v.string(), v.regex(B64_RE)),
});
export type SealedBox = v.InferOutput<typeof SealedBoxSchema>;

// ── Keys on the phone (F08 6.5 key model) ────────────────────────────────

/**
 * The author's book keys live in one synchronizable Keychain item per
 * (profile, child), holding every version, account `<profile_id>:<child_id>`
 * (F08 6.5 key model). The service name is S05's to fix with the founder:
 * F08 writes `earlyletters.backup`, while CLAUDE.md keeps the public name
 * only in packages/brand; a Keychain service can never be renamed once keys
 * are stored, so it is not frozen here.
 */
export function bookKeyKeychainAccount(profileId: string, childId: string): string {
  return `${profileId}:${childId}`;
}

// ── RPCs in the main project (S05 migration) ─────────────────────────────

/** `backup_register_device(p_device_id, p_public_key)`: the install's X25519 public key. Idempotent on the device id with the same key. */
export interface RegisterDeviceArgs {
  p_device_id: string;
  p_public_key: string;
}

/** `backup_store_key(p_child, p_key_version, p_escrow_key_version, p_wrap)`: the book key sealed on the phone to the escrow public key. SCCON without the backup consent. */
export interface StoreKeyArgs {
  p_child: string;
  p_key_version: number;
  p_escrow_key_version: number;
  p_wrap: SealedBox;
}

// ── The escrow function (project scribe-escrow) ──────────────────────────

/** Routes below the escrow project's URL. Never in the main project (release check, F08-REQ-034). */
export const ESCROW_ROUTES = {
  createRequest: { method: 'POST', path: '/functions/v1/escrow/v1/restore-requests' },
  /** POST, not GET: the device id goes in the body so no install id lands in an access log. */
  listRequests: { method: 'POST', path: '/functions/v1/escrow/v1/restore-requests/pending' },
  decide: { method: 'POST', path: '/functions/v1/escrow/v1/restore-requests/:id/decision' },
  release: { method: 'POST', path: '/functions/v1/escrow/v1/restore-requests/:id/release' },
  cancel: { method: 'POST', path: '/functions/v1/escrow/v1/restore-requests/:id/cancel' },
} as const;

/** The step-up rule: the JWT's most recent sign-in is at most this old for a new request (F08 6.5 C1). Checked only on create. */
export const STEP_UP_MAX_AGE_SECONDS = 600;
/** Hold when another enrolled device exists (unrevoked, seen in the last 90 days), unless it approves. */
export const HOLD_HOURS_WITH_ENROLLED_DEVICE = 72;
/** Hold when no other enrolled device exists (the only phone was lost). */
export const HOLD_HOURS_WITHOUT_ENROLLED_DEVICE = 24;
export const ENROLLED_DEVICE_SEEN_DAYS = 90;
/** A request not released within this many days of `hold_until` expires. */
export const RELEASE_WINDOW_DAYS = 7;
/** The only units (R8 R2A-24): new-device restores per account per rolling 30 days, and keys opened per account per day. */
export const RESTORES_PER_30_DAYS = 3;
export const KEYS_OPENED_PER_DAY = 20;
/** The Stop link token: 32 random bytes, stored hashed, single use. */
export const STOP_TOKEN_TTL_DAYS = 7;

export const RESTORE_STATES = ['requested', 'approved', 'released', 'cancelled', 'expired'] as const;
export type RestoreState = (typeof RESTORE_STATES)[number];
export const CANCEL_SOURCES = ['stop_link', 'enrolled_device', 'owner', 'deletion'] as const;
export type CancelSource = (typeof CANCEL_SOURCES)[number];
export const DECISIONS = ['approve', 'not_me'] as const;
export type Decision = (typeof DECISIONS)[number];

/** Why a request is refused, as the SQLSTATE detail or the envelope `detail` (closed set). */
export const ESCROW_ERROR_DETAILS = [
  'step_up_required',
  'device_unknown',
  'device_revoked',
  'on_hold',
  'cancelled',
  'expired',
  'deletion_pending',
  'limit_restores',
  'limit_keys',
] as const;
export type EscrowErrorDetail = (typeof ESCROW_ERROR_DETAILS)[number];

const deviceId = v.pipe(v.string(), v.regex(UUID_RE));

export const CreateRestoreRequestSchema = v.strictObject({ device_id: deviceId });
/** Which device is asking, so the answer can set `is_this_device` and show the approval sheet only on the others (F08 6.5 C3). */
export const ListRequestsSchema = v.strictObject({ device_id: deviceId });
export const DecideRequestSchema = v.strictObject({ device_id: deviceId, decision: v.picklist(DECISIONS) });
export const ReleaseRequestSchema = v.strictObject({ device_id: deviceId });
export const CancelRequestSchema = v.strictObject({ device_id: deviceId });

/** One restore request as the owner's devices see it. No child names, no device names. */
export const RestoreRequestViewSchema = v.object({
  request_id: v.pipe(v.string(), v.regex(UUID_RE)),
  state: v.picklist(RESTORE_STATES),
  requested_at: v.string(),
  /** When the recordings start to arrive without an approval (`backup.restoreWaiting`). */
  hold_until: v.string(),
  /** True on the phone that asked. The approval sheet shows only on the others. */
  is_this_device: v.boolean(),
});
export type RestoreRequestView = v.InferOutput<typeof RestoreRequestViewSchema>;

/** One opened book key, sealed to the requesting device. */
export const SealedBookKeySchema = v.object({
  child_id: v.pipe(v.string(), v.regex(UUID_RE)),
  key_version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  sealed: SealedBoxSchema,
});
export type SealedBookKey = v.InferOutput<typeof SealedBookKeySchema>;

/** `data` of a release: either still held (with the view), or released with the keys. */
export const ReleaseResultSchema = v.variant('state', [
  v.object({ state: v.literal('released'), request_id: v.string(), keys: v.array(SealedBookKeySchema) }),
  v.object({ state: v.picklist(['requested', 'approved']), request_id: v.string(), hold_until: v.string() }),
]);
export type ReleaseResult = v.InferOutput<typeof ReleaseResultSchema>;

/** The hold for a new request (F08 6.5 C2). Pure, so the function and its tests agree. */
export function holdUntil(requestedAt: Date, hasOtherEnrolledDevice: boolean): Date {
  const hours = hasOtherEnrolledDevice ? HOLD_HOURS_WITH_ENROLLED_DEVICE : HOLD_HOURS_WITHOUT_ENROLLED_DEVICE;
  return new Date(requestedAt.getTime() + hours * 3_600_000);
}

/** Whether a JWT's last sign-in (`auth_time` or the session's `iat` per WP-F08-B4) passes the step-up rule at `now`. */
export function passesStepUp(lastSignInEpochSeconds: number | null | undefined, now: Date): boolean {
  if (typeof lastSignInEpochSeconds !== 'number' || !Number.isFinite(lastSignInEpochSeconds)) return false;
  const age = now.getTime() / 1000 - lastSignInEpochSeconds;
  return age >= -60 && age <= STEP_UP_MAX_AGE_SECONDS;
}

// ── Stop link (main project, `account-stop`; F08 6.5 C4, F02-REQ-017) ───

/** 32 random bytes, base64url without padding. Only the button's POST changes anything; loading the page never does. */
export const STOP_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
export const AccountStopRequestSchema = v.strictObject({ token: v.pipe(v.string(), v.regex(STOP_TOKEN_RE)) });
export const AccountStopResultSchema = v.object({ cancelled_requests: v.pipe(v.number(), v.integer(), v.minValue(0)), signed_out: v.boolean() });

// ── The log and the notice (F08 6.5 C6, C7; M16) ─────────────────────────

export const UNWRAP_REASONS = ['restore', 'rotation', 'legal'] as const;
export type UnwrapReason = (typeof UNWRAP_REASONS)[number];
export const UNWRAP_OUTCOMES = ['released', 'refused'] as const;

/** One append-only `escrow_unwraps` row per book key opened. No content, no key bytes. Owner-readable. */
export interface EscrowUnwrapRow {
  id: string;
  profile_id: string;
  device_id: string;
  child_id: string;
  key_version: number;
  reason: UnwrapReason;
  outcome: (typeof UNWRAP_OUTCOMES)[number];
  request_id: string;
  created_at: string;
}

/**
 * The email the owner gets on every use (and when a new device asks). It is
 * the record of use we cannot edit afterwards. Content-free: no child name,
 * no device model, no ids; a count of books, times, and for a request the
 * Stop link. The template text lives in `packages/emails` (S16); this is its
 * input.
 */
export const UNWRAP_NOTICE_KINDS = ['restore_requested', 'restore_released', 'rotation', 'legal'] as const;
export type UnwrapNoticeKind = (typeof UNWRAP_NOTICE_KINDS)[number];

export const UnwrapNoticeSchema = v.strictObject({
  kind: v.picklist(UNWRAP_NOTICE_KINDS),
  occurred_at: v.string(),
  /** How many book keys were opened (0 for `restore_requested`). */
  books: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(KEYS_OPENED_PER_DAY)),
  /** `restore_requested` only: when recordings would start to arrive. */
  hold_until: v.optional(v.string()),
  /** `restore_requested` only: `https://earlyletters.com/stop#<token>` (the page posts it; F21). */
  stop_url: v.optional(v.pipe(v.string(), v.regex(/^https:\/\/[a-z0-9.-]+\/stop#[A-Za-z0-9_-]{43}$/))),
});
export type UnwrapNotice = v.InferOutput<typeof UnwrapNoticeSchema>;

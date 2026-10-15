/**
 * Family contracts, version 1: invite create, peek, redeem (link and code),
 * revoke, leave, remove, undo, member list (F11 sections 6, 7 and 11;
 * WP-F11-04; G-17; F11-REQ-002, -004, -007, -008, -011, -019, -026).
 *
 * SQL: supabase/migrations/20261005000000_family_cap_language_idempotency.sql
 * (`create_child_invite`, `accept_child_invite`, `leave_child`,
 * `remove_child_member`), 20261003000000 (`revoke_invite`). From S02's v1 gate
 * files (PR #140, pending): `peek_invite` (G-13), the device-made overload of
 * `create_child_invite`, `undo_parent_join` (D3) and
 * `accept_child_invite_by_code` (service role only, called by `invite-redeem`).
 * Still to come (requested from S02): `peek_invite_by_code` and SCINV details
 * for expired, used, revoked and already_member.
 *
 * Server-feature contract: imported only through `@scribe/api/server`.
 * Edge Functions import this file directly (Deno), so it stays a leaf module:
 * no relative imports, no package import except `valibot`.
 */
import * as v from 'valibot';

/** Bumped only by a breaking change, together with the route major. */
export const FAMILY_CONTRACT_VERSION = 1;

/** v1.0 creates parent invites only (B1, F11-REQ-003): the server refuses `contributor` while `contributors_enabled` is false. */
export const INVITE_ROLES = ['parent'] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

/** Parent invites expire 7 days after creation (K-18). */
export const INVITE_TTL_DAYS = 7;
/** The inviter can undo a join through their own invite for 72 hours (F11 D3, F11-REQ-008). */
export const UNDO_JOIN_WINDOW_HOURS = 72;
/** At most two parents per book (D-069). The server's value wins; SCCAP carries it as the detail. */
export const DEFAULT_MAX_PARENTS = 2;

/**
 * Invite code: 8 characters of Crockford base32 (about 40 bits), uppercase,
 * no separators. Normalising what a person typed (case, dashes, O for 0,
 * I and L for 1) is `packages/core/src/invite.ts` (S04, WP-F11-03); the wire
 * carries only the normalised form.
 */
export const INVITE_CODE_LENGTH = 8;
export const INVITE_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{8}$/;

/**
 * Invite token in the link fragment (B-NFR-002). Device-made from v1.0: 32
 * random bytes, base64url without padding (43 characters). The server-made
 * tokens of 20261005000000 (64 lowercase hex) stay accepted until no
 * supported build makes them.
 */
export const INVITE_TOKEN_RE = /^(?:[A-Za-z0-9_-]{43}|[0-9a-f]{64})$/;
/**
 * What the server stores and compares: SHA-256 of the token's text as UTF-8
 * (the 43 base64url characters, not the 32 raw bytes), exactly as
 * `accept_child_invite` and `peek_invite` hash `p_token`
 * (`sha256(convert_to(p_token, 'UTF8'))`). 64 lowercase hex.
 * `inviteTokenHashReference` is the one implementation to match.
 */
export const TOKEN_HASH_RE = /^[0-9a-f]{64}$/;

/** Reference for `p_token_hash` (WebCrypto: Node, Deno; the app uses expo-crypto on the same UTF-8 text). */
export async function inviteTokenHashReference(token: string): Promise<string> {
  if (!INVITE_TOKEN_RE.test(token)) throw new Error('invalid_token');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Why an invite cannot be used. The server raises SCINV with one of these as
 * the SQLSTATE detail (request to S02: today the reason is only in the
 * message, which the app must never read). Closed set; anything else reads as
 * `not_found`, which is also what a non-member probing an invite sees.
 */
export const INVITE_UNUSABLE_DETAILS = [
  'expired',
  'used',
  'revoked',
  'already_member',
  'not_found',
  /** The role is off (`contributors_enabled` false, F11-REQ-003). */
  'role_disabled',
  /** A device-made code collides with a live invite: make a new code and retry (F11-REQ-002). */
  'code_taken',
  /** A device-made token hash collides with a live invite: make a new token and retry. */
  'token_taken',
  /** The retry of a lost create found its invite closed: make a new one. */
  'closed',
] as const;
export type InviteUnusableDetail = (typeof INVITE_UNUSABLE_DETAILS)[number];

/** What the app does with an invite failure. S04 maps each kind to copy (`invite-errors.logic.ts`). */
export type InviteErrorKind =
  | InviteUnusableDetail
  /** SCCAP (F11-REQ-026: classifySqlstate says `parents_full`, the invite kind is `book_full`). Never retried. */
  | 'book_full'
  /** SCCON with detail `family-share` (D-050, F11-REQ-018): show the family-share sheet, not the general consent screen. */
  | 'family_share_consent'
  | 'not_parent'
  | 'rate_limited'
  | 'consent_needed'
  | 'book_deleted'
  | 'signed_out'
  | 'paused'
  | 'unknown';

/** Maps a SQLSTATE and its detail to an invite error kind. Pure; never reads a message. */
export function inviteErrorKindFor(sqlstate: string | null | undefined, detail?: string | null): InviteErrorKind {
  switch (sqlstate) {
    case 'SCINV':
      return (INVITE_UNUSABLE_DETAILS as readonly string[]).includes(detail ?? '') ? (detail as InviteUnusableDetail) : 'not_found';
    case 'SCCAP':
      return 'book_full';
    case 'SCPAR':
      return 'not_parent';
    case 'SCRAT':
      return 'rate_limited';
    case 'SCCON':
      return detail === 'family-share' ? 'family_share_consent' : 'consent_needed';
    case 'SCDEL':
      return 'book_deleted';
    case '28000':
    case 'SCANO':
      return 'signed_out';
    case 'P0002':
      return 'not_found';
    default:
      return 'unknown';
  }
}

// ── Create (RPC create_child_invite) ─────────────────────────────────────

/** As built: the server makes the token and returns it once. Idempotent by the `idempotency-key` header. */
export interface CreateInviteArgsV0 {
  p_child: string;
  p_role: InviteRole;
  p_signs_as?: string | null;
}
/** As built: the raw token (64 hex). */
export type CreateInviteResultV0 = string;

/**
 * Overload in S02's 20261015020000 (WP-F11-01, F11 D5): the device makes the
 * invite id (UUIDv7), the 32-byte token and the code; the server stores
 * `sha256(token)` and the code's HMAC, returns no secret, and treats a repeat
 * with the same id and hashes by the same person as success (SCCID for
 * another person or other arguments). Hashes travel as PostgREST bytea text,
 * `\\x` followed by 64 lowercase hex (`byteaHex`).
 *
 * Open (in the PR): the code HMAC needs the pepper, which lives only in
 * Edge Function secrets (F11 section 8), so the phone cannot make
 * `p_code_hash` itself. Until that is settled the app sends `p_code_hash`
 * null (link-only invites) and codes wait for a code-registration route.
 */
export interface CreateInviteArgs {
  p_invite_id: string;
  p_child: string;
  p_role: InviteRole;
  p_token_hash: string;
  p_code_hash: string | null;
  p_signs_as?: string | null;
}
/** The invite id (the one the device sent). */
export type CreateInviteResult = string;

/** PostgREST text form of a bytea argument: `\x` then lowercase hex. */
export function byteaHex(hex: string): string {
  if (!TOKEN_HASH_RE.test(hex)) throw new Error('expected 64 lowercase hex');
  return `\\x${hex}`;
}

// ── Peek (RPC peek_invite, planned G-13) ─────────────────────────────────

/**
 * Before consent, the invitee may learn only the inviter's sign-off name
 * (BL-322, security review H2): "Join {child}'s book as a parent? Invited by
 * {signsAs}". No child name, no book id, no expiry date. A used, expired,
 * revoked or unknown token answers SCINV; a full book SCCAP. Built in S02's
 * 20261015010000 (G-13); `joined` is true when the caller already accepted.
 */
export interface PeekInviteArgs {
  p_token: string;
}
export const PeekInviteResultSchema = v.object({
  inviter: v.nullable(v.pipe(v.string(), v.maxLength(80))),
  role: v.picklist(['parent', 'contributor']),
  joined: v.optional(v.literal(true)),
});
export type PeekInviteResult = v.InferOutput<typeof PeekInviteResultSchema>;

// ── Accept by link (RPC accept_child_invite, built) ──────────────────────

export interface AcceptInviteArgs {
  p_token: string;
}
/** As built: the child id. The same person accepting again gets it again (idempotent). */
export type AcceptInviteResult = string;

// ── Redeem by code (Edge Function invite-redeem, WP-F11-02) ──────────────

/** `POST /functions/v1/invite-redeem/v1`. `peek` first, then `accept` after the person taps Join. */
export const REDEEM_MODES = ['peek', 'accept'] as const;
export type RedeemMode = (typeof REDEEM_MODES)[number];
/** Equal to `ENDPOINTS.inviteRedeem.path` (a test pins them). */
export const INVITE_REDEEM_PATH = '/functions/v1/invite-redeem/v1';

export const RedeemRequestSchema = v.strictObject({
  code: v.pipe(v.string(), v.regex(INVITE_CODE_RE)),
  mode: v.picklist(REDEEM_MODES),
  /**
   * A random id the app keeps for this install (UUID, Keychain, this device
   * only; any case, read as lowercase). Hashed with a rotating key before any
   * count; never stored raw. It scopes the 10 failures per device per hour
   * (B-NFR-004). A client can invent device ids, so the person and the IP
   * are counted too (below).
   */
  device: v.pipe(v.string(), v.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), v.toLowerCase()),
});
export type RedeemRequest = v.InferOutput<typeof RedeemRequestSchema>;

export const RedeemPeekDataSchema = v.object({
  mode: v.literal('peek'),
  inviter: v.nullable(v.string()),
  role: v.picklist(INVITE_ROLES),
  joined: v.optional(v.literal(true)),
});
export const RedeemAcceptDataSchema = v.object({ mode: v.literal('accept'), child_id: v.pipe(v.string(), v.regex(UUID_RE)), role: v.picklist(INVITE_ROLES) });
export const RedeemDataSchema = v.variant('mode', [RedeemPeekDataSchema, RedeemAcceptDataSchema]);
export type RedeemData = v.InferOutput<typeof RedeemDataSchema>;

/**
 * Failure limits per rolling hour (B-NFR-004, F11-REQ-007, TDD 04 3.11):
 * per person and per device 10; per client IP 30 (carrier NAT puts many
 * families behind one address, so the IP limit is a backstop, not the main
 * guard); across the service 1,000, after which every code answers
 * `codes_paused` and links keep working.
 */
export const REDEEM_FAILURES_PER_USER_HOUR = 10;
export const REDEEM_FAILURES_PER_DEVICE_HOUR = 10;
export const REDEEM_FAILURES_PER_IP_HOUR = 30;
export const REDEEM_FAILURES_GLOBAL_HOUR = 1_000;

/**
 * The one SQL call `invite-redeem` makes (requested from S02; service role
 * only). It must gate, look up and count in ONE transaction, with the
 * counter rows locked in a fixed order (global, then each subject), so
 * parallel guesses cannot all pass the gate before a failure is recorded,
 * and so a failure is committed before the answer leaves (no "uncounted but
 * revealed" path). It never raises for an outcome: errors come back as data,
 * because an exception would roll the failure count back.
 *
 *   invite_redeem_by_code(p_user uuid, p_mode text, p_code_hash bytea,
 *     p_user_subjects text[], p_device_subjects text[], p_ip_subjects text[]) returns jsonb
 *
 * Each subjects array holds the subject's hash under the current key and,
 * in the first hour after a key rotation, under the previous key too: count
 * failures over all of them, record new failures under the first.
 * `p_ip_subjects` is empty when the platform gave no trusted client address.
 * `peek` reads `joined` for `p_user`; `accept` runs `accept_child_invite_by_code`.
 */
export interface RedeemByCodeArgs {
  p_user: string;
  p_mode: RedeemMode;
  p_code_hash: string;
  p_user_subjects: string[];
  p_device_subjects: string[];
  p_ip_subjects: string[];
}

export const REDEEM_LIMIT_SCOPES = ['user', 'device', 'ip', 'global'] as const;

export const RedeemRpcResultSchema = v.variant('outcome', [
  v.object({ outcome: v.literal('peek'), inviter: v.nullable(v.string()), role: v.picklist(INVITE_ROLES), joined: v.optional(v.literal(true)) }),
  v.object({ outcome: v.literal('accepted'), child_id: v.pipe(v.string(), v.regex(UUID_RE)), role: v.picklist(INVITE_ROLES) }),
  /** Counted as a failure. `detail` is `already_member` or anything else, which the function reports as `not_found`. */
  v.object({ outcome: v.literal('unusable'), detail: v.optional(v.nullable(v.string())) }),
  /** Not looked up, not counted. */
  v.object({ outcome: v.literal('limited'), scope: v.picklist(REDEEM_LIMIT_SCOPES) }),
  /** Not counted as a guess (the code was right): SCCAP, SCCON with its detail, SCDEL, SCRAT. */
  v.object({ outcome: v.literal('refused'), sqlstate: v.pipe(v.string(), v.regex(/^[0-9A-Z]{5}$/)), detail: v.optional(v.nullable(v.string())) }),
]);
export type RedeemRpcResult = v.InferOutput<typeof RedeemRpcResultSchema>;

export function parseRedeemRequest(input: unknown): { ok: true; value: RedeemRequest } | { ok: false } {
  const r = v.safeParse(RedeemRequestSchema, input);
  return r.success ? { ok: true, value: r.output } : { ok: false };
}

// ── Revoke, leave, remove, undo ──────────────────────────────────────────

/** `revoke_invite(p_invite)`: true, also when it was already closed. P0002 for a non-parent. */
export interface RevokeInviteArgs {
  p_invite: string;
}

/** `leave_child(p_child, p_keep_in_book)` (built). With false, own letters in that book leave it in the same transaction. SCLPG for the last parent. */
export interface LeaveChildArgs {
  p_child: string;
  p_keep_in_book: boolean;
}
export const LEAVE_RESULTS = ['left', 'not_member'] as const;
export type LeaveResult = (typeof LEAVE_RESULTS)[number];

/** `remove_child_member(p_child, p_member, p_set_aside)` (built): family members only; a parent is never removed by the other parent (42501). */
export interface RemoveMemberArgs {
  p_child: string;
  p_member: string;
  p_set_aside: boolean;
}
export const REMOVE_RESULTS = ['removed', 'not_member'] as const;
export type RemoveResult = (typeof REMOVE_RESULTS)[number];

/** `undo_parent_join(p_child, p_member)` (S02 20261015020000): only the inviter, within 72 hours; else SCPAR. The joiner's letters leave the book. */
export interface UndoJoinArgs {
  p_child: string;
  p_member: string;
}
export const UNDO_RESULTS = ['undone', 'not_member'] as const;
export type UndoResult = (typeof UNDO_RESULTS)[number];

// ── Member list (F11-REQ-019) ────────────────────────────────────────────

/**
 * Members come from the pull (`BookMeta.members`, sync.ts). Pending invites
 * come from `child_invites`, which parents of the book may read
 * (`child_invites_select`); select exactly these columns, never `*` and
 * never `token_hash` or `code_hash`.
 */
export const PENDING_INVITE_COLUMNS = ['id', 'child_id', 'role', 'signs_as', 'created_at', 'expires_at', 'accepted_at', 'revoked_at'] as const;

export const PendingInviteSchema = v.object({
  id: v.string(),
  child_id: v.string(),
  role: v.picklist(['parent', 'contributor']),
  signs_as: v.nullable(v.string()),
  created_at: v.string(),
  expires_at: v.string(),
  accepted_at: v.nullable(v.string()),
  revoked_at: v.nullable(v.string()),
});
export type PendingInvite = v.InferOutput<typeof PendingInviteSchema>;

/** Open means not accepted, not revoked and not expired at `now`. */
export function isOpenInvite(inv: Pick<PendingInvite, 'accepted_at' | 'revoked_at' | 'expires_at'>, now: Date): boolean {
  return inv.accepted_at === null && inv.revoked_at === null && Date.parse(inv.expires_at) > now.getTime();
}

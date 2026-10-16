/**
 * Invite and membership errors to the words the screens show (supabase/APPLY.md error tables;
 * create_child_invite, peek_invite, accept_child_invite, revoke_invite, leave_child). Pure,
 * tested in test/invite-link.test.ts.
 *
 * Order of reading, never the server's text first:
 *  1. The SQLSTATE detail, when the server sends one (S02's v1 gate files: SCINV `role_disabled`,
 *     `code_taken`, `token_taken`; the S07 family contract lists `expired`, `used`, `revoked`,
 *     `already_member`, `not_found` as details too, requested from S02).
 *  2. SCCAP (the two-parent cap, D-069) is read here before the shared contract, because
 *     `classifySqlstate` in packages/api has no rule for it yet (F11-REQ-026; requested from S07 as
 *     `SCCAP: parents_full`). Either way it becomes `book_full` and is never retried.
 *  3. Everything else goes through `classifySqlstate` (ADR 0017), so the app and the server agree.
 *  4. For SCINV without a detail (develop's 20261005000000, and S02's v1 gate files too for not
 *     found, used, revoked, expired and already a member; details requested from S02), the
 *     message is matched against the fixed phrases of those files. It is never shown or logged,
 *     and an unmatched one reads as not_found, which is final.
 */
import { classifySqlstate } from '@scribe/api';
import { errorCode, errorMessage, isNetworkError } from '../supabase/errors.logic';

export type InviteErrorKind =
  | 'expired'
  | 'used'
  | 'revoked'
  | 'already_member'
  | 'not_found'
  | 'not_parent'
  /** SCCAP: the book already has two parents (D-069, F11-REQ-026). Final; never retried. */
  | 'book_full'
  /** SCLPG: the only parent of a book cannot leave it (DATA-REQ-016). */
  | 'last_parent'
  /** 42501: a path only the server's own functions may take (a direct delete, removing a parent). */
  | 'not_allowed'
  /** SCCID, or SCINV code_taken, token_taken or closed: make a fresh invite and try once more. */
  | 'retry_new_invite'
  | 'rate_limited'
  | 'consent_needed'
  | 'book_deleted'
  | 'signed_out'
  | 'network'
  | 'unknown';

/** Errors after which the same invite can never work: the join flow drops the stored token. */
export const FINAL_INVITE_ERRORS: readonly InviteErrorKind[] = ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_deleted', 'book_full'];

/** PostgREST answers PGRST202 when no function matches the arguments (a server older than the app); Postgres itself 42883. */
export function isMissingFunction(e: unknown): boolean {
  const code = errorCode(e);
  return code === 'PGRST202' || code === '42883';
}

/** The SQLSTATE detail PostgREST passes through as `details`; null when absent. */
export function errorDetail(e: unknown): string | null {
  const d = e && typeof e === 'object' ? (e as { details?: unknown }).details : null;
  return typeof d === 'string' && d.length > 0 ? d : null;
}

const DETAIL_KINDS: Readonly<Record<string, InviteErrorKind>> = {
  expired: 'expired',
  used: 'used',
  revoked: 'revoked',
  already_member: 'already_member',
  not_found: 'not_found',
  /** The app only ever sends `parent`; a refused role is a client bug, not something to explain. */
  role_disabled: 'unknown',
  code_taken: 'retry_new_invite',
  token_taken: 'retry_new_invite',
  closed: 'retry_new_invite',
};

/** develop's 20261005000000 raises SCINV with these fixed messages and no detail. */
function unusableFromMessage(message: string): InviteErrorKind {
  const msg = message.toLowerCase();
  if (msg.includes('expired')) return 'expired';
  if (msg.includes('already used')) return 'used';
  if (msg.includes('revoked')) return 'revoked';
  if (msg.includes('already a member')) return 'already_member';
  if (msg.includes('closed')) return 'retry_new_invite';
  if (msg.includes('role') || msg.includes('not available')) return 'unknown';
  return 'not_found';
}

export function inviteErrorKind(e: unknown): InviteErrorKind {
  if (isNetworkError(e)) return 'network';
  const code = errorCode(e);
  // PostgREST's own JWT codes are not SQLSTATEs.
  if (code === 'PGRST301' || code === 'PGRST303') return 'signed_out';
  if (!code || !/^[0-9A-Z]{5}$/.test(code)) return 'unknown';
  if (code === 'SCCAP') return 'book_full';
  if (code === 'SCCID') return 'retry_new_invite';
  const rule: string = classifySqlstate(code).code;
  switch (rule) {
    case 'invite_unusable': {
      const detail = errorDetail(e);
      return (detail && DETAIL_KINDS[detail]) || unusableFromMessage(errorMessage(e));
    }
    case 'parents_full':
      return 'book_full';
    case 'not_parent':
      return 'not_parent';
    case 'last_parent':
      return 'last_parent';
    case 'forbidden':
      return 'not_allowed';
    case 'rate_limited':
      return 'rate_limited';
    case 'consent_required':
      return 'consent_needed';
    case 'deleted':
      return 'book_deleted';
    case 'not_found':
      return 'not_found';
    case 'unauthorized':
    case 'anonymous_refused':
      return 'signed_out';
    default:
      return 'unknown';
  }
}

/** Reasons the analytics catalogue (`invite_failed.reason`) knows; newer kinds report as 'unknown' until S18 adds them. */
const TRACKED = ['expired', 'used', 'revoked', 'already_member', 'not_found', 'not_parent', 'rate_limited', 'consent_needed', 'book_deleted', 'signed_out', 'network', 'unknown'] as const;
export type TrackedInviteReason = (typeof TRACKED)[number];

export function trackedInviteReason(kind: InviteErrorKind): TrackedInviteReason {
  return (TRACKED as readonly string[]).includes(kind) ? (kind as TrackedInviteReason) : 'unknown';
}

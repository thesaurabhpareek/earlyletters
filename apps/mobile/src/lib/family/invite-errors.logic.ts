/**
 * Invite and membership RPC errors to the words the screens show
 * (supabase/APPLY.md error tables; migrations 20261003000000,
 * 20261005000000 and 20261015000000: create_child_invite, peek_invite,
 * accept_child_invite, revoke_invite, leave_child, remove_child_member).
 * Pure, tested in test/invite-link.test.ts and src/lib/family/join.test.ts.
 *
 * The SQLSTATE goes through the shared contract first (packages/api
 * `classifySqlstate`, ADR 0017), so the app and the server agree on what each
 * code means. On top of it, SCINV is split by the server's message (expired,
 * used, cancelled, already a member, not found) so the person gets the
 * matching calm line (PRD A section 9). The server text itself is never shown.
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
  /** SCCAP: the book already has two parents (D-069, F11-REQ-026). Said calmly, never retried. */
  | 'book_full'
  /** SCLPG: the only parent of a book cannot leave it; Delete the book is the way (DATA-REQ-016). */
  | 'last_parent'
  /** 42501: a parent tried to remove the other parent; the app never offers it (F11-REQ-012). */
  | 'not_allowed'
  | 'rate_limited'
  | 'consent_needed'
  | 'book_deleted'
  | 'signed_out'
  | 'network'
  | 'unknown';

function unusableReason(message: string): InviteErrorKind {
  const msg = message.toLowerCase();
  if (msg.includes('expired')) return 'expired';
  if (msg.includes('already used')) return 'used';
  if (msg.includes('revoked')) return 'revoked';
  if (msg.includes('already a member')) return 'already_member';
  if (msg.includes('role')) return 'unknown'; // a client bug: the app always sends 'parent'
  return 'not_found';
}

/**
 * SQLSTATEs the shared contract does not name yet. SCCAP falls into the
 * generic `SC*` rule of `classifySqlstate` until packages/api adds its
 * `parents_full` rule (WP-F11-04, S07); this map keeps the app right before
 * and after that lands.
 */
const LOCAL_SQLSTATES: Readonly<Record<string, InviteErrorKind>> = {
  SCCAP: 'book_full',
};

/** Errors after which the same invite will never work: the stored token is dropped. */
export const FINAL_INVITE_ERRORS: readonly InviteErrorKind[] = ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_deleted', 'book_full'];

/** Reasons the analytics catalogue (`invite_failed.reason`) lists today; newer kinds report as 'unknown' until it lists them. */
const TRACKED = ['expired', 'used', 'revoked', 'already_member', 'not_found', 'not_parent', 'rate_limited', 'consent_needed', 'book_deleted', 'signed_out', 'network', 'unknown'] as const;
export type TrackedInviteReason = (typeof TRACKED)[number];
export function trackedInviteReason(kind: InviteErrorKind): TrackedInviteReason {
  return (TRACKED as readonly string[]).includes(kind) ? (kind as TrackedInviteReason) : 'unknown';
}

export function inviteErrorKind(e: unknown): InviteErrorKind {
  if (isNetworkError(e)) return 'network';
  const code = errorCode(e);
  // PostgREST's own JWT codes are not SQLSTATEs.
  if (code === 'PGRST301' || code === 'PGRST303') return 'signed_out';
  if (!code || !/^[0-9A-Z]{5}$/.test(code)) return 'unknown';
  const local = LOCAL_SQLSTATES[code];
  if (local) return local;
  const rule = classifySqlstate(code).code as string;
  if (rule === 'parents_full') return 'book_full';
  switch (rule) {
    case 'invite_unusable':
      return unusableReason(errorMessage(e));
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

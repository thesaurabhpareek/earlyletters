/**
 * Invite and membership RPC errors to the words the screens show
 * (supabase/APPLY.md error tables; migrations 20261003000000 and
 * 20261005000000: create_child_invite, peek_invite, accept_child_invite,
 * revoke_invite, leave_child, remove_child_member). Pure, tested in
 * test/invite-link.test.ts.
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
  /** SCCAP: the book already has two parents (D-069). Told calmly, never retried. */
  | 'parents_full'
  /** SCLPG: the only parent of a book cannot leave it (they can delete the book instead). */
  | 'last_parent'
  /** 42501: a parent tried to remove the other parent; the app never offers it. */
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

/** Errors after which the same request will never work: drop the stored invite token. */
export const FINAL_INVITE_ERRORS: readonly InviteErrorKind[] = ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_deleted', 'parents_full'];

/** PostgREST answers this when an RPC does not exist yet (a server older than the app). */
export function isMissingFunction(e: unknown): boolean {
  const code = errorCode(e);
  return code === 'PGRST202' || code === '42883';
}

export function inviteErrorKind(e: unknown): InviteErrorKind {
  if (isNetworkError(e)) return 'network';
  const code = errorCode(e);
  // PostgREST's own JWT codes are not SQLSTATEs.
  if (code === 'PGRST301' || code === 'PGRST303') return 'signed_out';
  if (!code || !/^[0-9A-Z]{5}$/.test(code)) return 'unknown';
  switch (classifySqlstate(code).code) {
    case 'invite_unusable':
      return unusableReason(errorMessage(e));
    case 'not_parent':
      return 'not_parent';
    case 'parents_full':
      return 'parents_full';
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

/** Reasons the analytics catalog (packages/analytics `invite_failed.reason`) knows today; newer kinds report as 'unknown' until it lists them. */
const TRACKED: readonly InviteErrorKind[] = [
  'expired', 'used', 'revoked', 'already_member', 'not_found', 'not_parent', 'rate_limited', 'consent_needed', 'book_deleted',
  'signed_out', 'network', 'unknown',
];
export type TrackedInviteReason = Exclude<InviteErrorKind, 'parents_full' | 'last_parent' | 'not_allowed'>;
export function trackedInviteReason(kind: InviteErrorKind): TrackedInviteReason {
  return (TRACKED.includes(kind) ? kind : 'unknown') as TrackedInviteReason;
}

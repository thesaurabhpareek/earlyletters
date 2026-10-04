/**
 * Invite RPC errors to the words the screens show (supabase/APPLY.md error
 * table; migrations 20261003000000 create_child_invite, accept_child_invite,
 * revoke_invite). Pure, tested in test/invite-link.test.ts.
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

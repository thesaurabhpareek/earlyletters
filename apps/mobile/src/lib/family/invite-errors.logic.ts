/**
 * Invite RPC errors to the words the screens show (supabase/APPLY.md error
 * table; migrations 20261003000000 create_child_invite, accept_child_invite,
 * revoke_invite). Pure, tested in test/invite-link.test.ts.
 *
 * SCINV covers every reason an invite cannot be used. The server's message
 * says which (expired, used, revoked, already a member, not found); the app
 * shows the matching calm line (PRD A section 9) and never displays the
 * server text itself.
 */
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

export function inviteErrorKind(e: unknown): InviteErrorKind {
  if (isNetworkError(e)) return 'network';
  const code = errorCode(e);
  const msg = errorMessage(e).toLowerCase();
  switch (code) {
    case 'SCINV':
      if (msg.includes('expired')) return 'expired';
      if (msg.includes('already used')) return 'used';
      if (msg.includes('revoked')) return 'revoked';
      if (msg.includes('already a member')) return 'already_member';
      if (msg.includes('role')) return 'unknown'; // a client bug: the app always sends 'parent'
      return 'not_found';
    case 'SCPAR':
      return 'not_parent';
    case 'SCRAT':
      return 'rate_limited';
    case 'SCCON':
      return 'consent_needed';
    case 'SCDEL':
      return 'book_deleted';
    case 'P0002':
      return 'not_found';
    case '28000':
    case 'SCANO':
    case 'PGRST301':
    case 'PGRST303':
      return 'signed_out';
  }
  return 'unknown';
}

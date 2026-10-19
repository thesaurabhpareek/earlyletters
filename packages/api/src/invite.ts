/**
 * Invite codes (A-REQ-029, TDD 04 3.4.1). Mirrors normalise_invite_code() in
 * supabase/migrations/20261003000000_security_and_family.sql.
 *
 * A code is 8 symbols of Crockford base32 (digits and A to Z without I, L, O
 * and U), about 40 bits, made on the device from a CSPRNG and shown as
 * XXXX-XXXX. The client sends create_child_invite p_code_hash =
 * sha256(utf8(normaliseInviteCode(code))). The database stores only an HMAC
 * of that digest under a server pepper. A typed code is redeemed through the
 * invite-redeem Edge Function (accept_child_invite_by_code is service-role
 * only), never through PostgREST.
 */
export const INVITE_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ' as const;
export const INVITE_CODE_LENGTH = 8 as const;

/**
 * Normal form of a typed or spoken code: upper case, spaces and hyphens
 * removed, O read as 0 and I or L read as 1. Returns null when the result is
 * not exactly 8 alphabet symbols.
 */
export function normaliseInviteCode(code: string | null | undefined): string | null {
  const v = (code ?? '')
    .replace(/[\s-]/g, '')
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return /^[0-9A-HJKMNP-TV-Z]{8}$/.test(v) ? v : null;
}

/** Display form XXXX-XXXX of a normalised code. */
export function formatInviteCode(normalised: string): string {
  return `${normalised.slice(0, 4)}-${normalised.slice(4)}`;
}

/**
 * Builds a code from 8 random bytes (pass crypto.getRandomValues(new Uint8Array(8))).
 * 256 is a multiple of 32, so taking the low 5 bits keeps every symbol equally likely.
 */
export function inviteCodeFromBytes(bytes: ArrayLike<number>): string {
  if (bytes.length !== INVITE_CODE_LENGTH) throw new RangeError('inviteCodeFromBytes needs 8 bytes');
  let out = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) out += INVITE_CODE_ALPHABET[bytes[i] & 31];
  return out;
}

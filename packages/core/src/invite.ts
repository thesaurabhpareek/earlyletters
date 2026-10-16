/**
 * Co-parent invite rules (F11 section 6.2 A, D5; WP-F11-03). Pure, no React
 * Native, no clock and no randomness of its own: the caller passes the random
 * bytes and the time, so every rule is tested in Node (test/invite.test.ts).
 *
 * - The code is 8 characters of Crockford base32 (F11-REQ-002), 40 bits from
 *   5 random bytes, shown as `XXXX-XXXX`. People read codes aloud and retype
 *   them, so input is forgiving: case, spaces and any dash are ignored, the
 *   letter O reads as zero and the letters I and L read as one (Crockford's
 *   own decoding rules). U is not in the alphabet, so it is refused.
 * - The token is 32 random bytes in base64url (43 characters, F11-REQ-002);
 *   the server keeps only its SHA-256.
 * - An invite is open for 7 days (K-18, B-REQ-007).
 *
 * Nothing here logs or stores a code or token: they are bearer secrets
 * (B-NFR-002, LEGAL-REQ-014).
 */

/** Crockford base32: digits and capitals without I, L, O and U. */
export const INVITE_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const INVITE_CODE_LENGTH = 8;
/** Random bytes behind one code: 8 characters of 5 bits each. */
export const INVITE_CODE_BYTES = 5;
/** Random bytes behind one token (F11-REQ-002). */
export const INVITE_TOKEN_BYTES = 32;
/** A co-parent invite works for 7 days from creation (K-18). */
export const INVITE_TTL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Every character a phone keyboard, autocorrect or a pasted message may put
 * between the two halves: ASCII hyphen, the Unicode hyphens and dashes
 * (U+2010 to U+2015), minus (U+2212), soft hyphen, small and full-width
 * hyphen-minus, middle dot, plus spaces of any kind.
 */
const SEPARATORS = /[\s\u00A0\u00AD\u00B7\u2010-\u2015\u2212\uFE58\uFE63\uFF0D_.\-]/g;

/** Crockford's decoding aliases: O to zero, I and L to one. */
const ALIASES: Readonly<Record<string, string>> = { O: '0', I: '1', L: '1' };

/** A code as stored and sent: 8 characters from the alphabet, no dash. */
export function isInviteCode(s: string): boolean {
  if (s.length !== INVITE_CODE_LENGTH) return false;
  for (const ch of s) if (!INVITE_CODE_ALPHABET.includes(ch)) return false;
  return true;
}

/**
 * What the person typed or pasted, as the canonical code, or null when it
 * cannot be one. `abcd-efgh`, `ABCD EFGH`, `ABCD\u2013EFGH` and `ABCDEFGH` are
 * the same code; `O` and `0`, `I`, `L` and `1` are the same character.
 */
export function normaliseInviteCode(input: string): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.normalize('NFKC').replace(SEPARATORS, '').toUpperCase();
  if (raw.length !== INVITE_CODE_LENGTH) return null;
  let out = '';
  for (const ch of raw) out += ALIASES[ch] ?? ch;
  return isInviteCode(out) ? out : null;
}

/** `XXXX-XXXX` for display (F11 6.2 A step 3). Throws on anything that is not a code. */
export function formatInviteCode(code: string): string {
  const c = normaliseInviteCode(code);
  if (!c) throw new Error('invite_code_invalid');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}

/**
 * What VoiceOver reads: each character on its own, in two groups (F11-U29),
 * for example `A B C D, 1 2 3 4`.
 */
export function spokenInviteCode(code: string): string {
  const c = normaliseInviteCode(code);
  if (!c) throw new Error('invite_code_invalid');
  return `${c.slice(0, 4).split('').join(' ')}, ${c.slice(4).split('').join(' ')}`;
}

/** A new code from 5 random bytes (40 bits, 5 bits per character, most significant first). */
export function makeInviteCode(random: Uint8Array): string {
  if (!(random instanceof Uint8Array) || random.length < INVITE_CODE_BYTES) throw new Error('invite_code_needs_5_random_bytes');
  // 40 bits fit a double exactly (2^53), so plain arithmetic is enough; no bitwise ops past 32 bits.
  let bits = 0;
  for (let i = 0; i < INVITE_CODE_BYTES; i++) bits = bits * 256 + random[i]!;
  let out = '';
  for (let i = INVITE_CODE_LENGTH - 1; i >= 0; i--) out += INVITE_CODE_ALPHABET[Math.floor(bits / 2 ** (i * 5)) % 32];
  return out;
}

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** A new token from 32 random bytes: base64url without padding (43 characters). */
export function makeInviteToken(random: Uint8Array): string {
  if (!(random instanceof Uint8Array) || random.length < INVITE_TOKEN_BYTES) throw new Error('invite_token_needs_32_random_bytes');
  const b = random.subarray(0, INVITE_TOKEN_BYTES);
  let out = '';
  for (let i = 0; i < b.length; i += 3) {
    const n = (b[i]! << 16) | ((b[i + 1] ?? 0) << 8) | (b[i + 2] ?? 0);
    const chars = i + 2 < b.length ? 4 : i + 1 < b.length ? 3 : 2;
    for (let j = 0; j < chars; j++) out += B64URL[(n >> (18 - 6 * j)) & 63];
  }
  return out;
}

/** When an invite made at `createdAt` stops working (ISO in, ISO out). */
export function inviteExpiresAt(createdAt: string): string {
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) throw new Error('invite_created_at_invalid');
  return new Date(t + INVITE_TTL_DAYS * DAY_MS).toISOString();
}

export interface InviteRowTimes {
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
}

export type InviteRowState = 'open' | 'used' | 'revoked' | 'expired';

/** The server's order (accept_child_invite, peek_invite): used, then revoked, then expired. */
export function inviteRowState(row: InviteRowTimes, now: number): InviteRowState {
  if (row.acceptedAt) return 'used';
  if (row.revokedAt) return 'revoked';
  const exp = Date.parse(row.expiresAt);
  if (Number.isNaN(exp) || exp < now) return 'expired';
  return 'open';
}

/**
 * Whole days an open invite still has, for "open until {date}" and its
 * VoiceOver line: 7 right after creation, 1 on the last day, 0 once expired.
 */
export function inviteDaysLeft(expiresAt: string, now: number): number {
  const exp = Date.parse(expiresAt);
  if (Number.isNaN(exp) || exp <= now) return 0;
  return Math.ceil((exp - now) / DAY_MS);
}

/**
 * Co-parent invites: the pure rules (PRD V2 F11 sections 6.2 D2, D3 and D5, 7 and 11; WP-F11-03).
 *
 * - The invite code: 8 characters of Crockford base32 (about 40 bits, TDD 04 3.4.1), made from
 *   random bytes the caller passes in, shown as `XXXX-XXXX`, spelled in two groups for VoiceOver
 *   (F11-U29), and read back from whatever a person typed (case, spaces, dashes, O for 0, I and L
 *   for 1).
 * - The invite token: 32 random bytes, base64url without padding (43 characters). The token rides
 *   in the link; only its SHA-256 reaches the server (D5, B-NFR-002).
 * - Expiry (7 days for a parent invite, K-18), "open until" for the member list (F11-REQ-019),
 *   and the 72-hour window in which the inviter can undo a join (D3, F11-REQ-008).
 *
 * Pure: no clock, no randomness, no crypto, no platform API. Callers pass bytes and times in, so
 * the same rules run on the phone, in Node tests and in a Deno function. The server is the
 * authority for every limit here; these values only decide what the app offers and says.
 */

/** Crockford base32: the ten digits and 22 letters, without I, L, O and U. */
export const INVITE_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const INVITE_CODE_LENGTH = 8;
/** Bytes of randomness one code needs: 8 characters x 5 bits = 40 bits = 5 bytes. */
export const INVITE_CODE_BYTES = 5;
/** Bytes of randomness in one invite token (TDD 04 3.4.1). */
export const INVITE_TOKEN_BYTES = 32;
/** A parent invite expires this many days after it is made (K-18). The server's expiry wins. */
export const INVITE_TTL_DAYS = 7;
/** For this long after a join, the parent whose invite was used can undo it (D3; F11 Q2). */
export const UNDO_JOIN_WINDOW_HOURS = 72;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ── Code ────────────────────────────────────────────────────────────────

/** An 8-character code from the first 5 bytes (big-endian, 5 bits per character). Throws on fewer bytes. */
export function inviteCodeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < INVITE_CODE_BYTES) throw new Error('invite_code_needs_5_bytes');
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < INVITE_CODE_BYTES; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += INVITE_CODE_ALPHABET[(value >> bits) & 31];
    }
    value &= (1 << bits) - 1;
  }
  return out;
}

/** True for an 8-character code in canonical form (uppercase Crockford, no separators). */
export function isInviteCode(s: string): boolean {
  return s.length === INVITE_CODE_LENGTH && [...s].every((ch) => INVITE_CODE_ALPHABET.includes(ch));
}

/** Characters a person may type for another (Crockford's decoding rules). */
const LOOKALIKE: Readonly<Record<string, string>> = { O: '0', I: '1', L: '1' };

/**
 * What a person typed, as a canonical code, or null. Case is ignored; spaces and any dash
 * (hyphen, en dash, em dash, minus) are dropped; O reads as 0, and I and L read as 1. U is never
 * valid (Crockford leaves it out), and nothing is guessed: a wrong length is null.
 */
export function normaliseInviteCode(input: string): string | null {
  const squeezed = input.normalize('NFKC').toUpperCase().replace(/[\s\p{Pd}−]+/gu, '');
  let out = '';
  for (const ch of squeezed) {
    const c = LOOKALIKE[ch] ?? ch;
    if (!INVITE_CODE_ALPHABET.includes(c)) return null;
    out += c;
  }
  return out.length === INVITE_CODE_LENGTH ? out : null;
}

/** `ABCD-EFGH`, the way the code is shown (F11 6.2 A step 3). Throws on a code that is not canonical. */
export function formatInviteCode(code: string): string {
  if (!isInviteCode(code)) throw new Error('invite_code_invalid');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Spelled for VoiceOver: one character at a time, in two groups (F11-U29). */
export function spokenInviteCode(code: string): string {
  if (!isInviteCode(code)) throw new Error('invite_code_invalid');
  return `${[...code.slice(0, 4)].join(' ')}, ${[...code.slice(4)].join(' ')}`;
}

// ── Token ───────────────────────────────────────────────────────────────

const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Bytes as base64url without padding (RFC 4648 section 5). */
export function base64Url(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63] + B64URL[n & 63];
  }
  const rest = bytes.length - i;
  if (rest === 1) {
    const n = bytes[i] << 16;
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63];
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64URL[(n >> 18) & 63] + B64URL[(n >> 12) & 63] + B64URL[(n >> 6) & 63];
  }
  return out;
}

/** The token a device makes for its invite: exactly 32 random bytes, 43 base64url characters. */
export function inviteTokenFromBytes(bytes: Uint8Array): string {
  if (bytes.length !== INVITE_TOKEN_BYTES) throw new Error('invite_token_needs_32_bytes');
  return base64Url(bytes);
}

/** A device-made token (43 base64url characters). Server-made tokens (64 hex) are read by the app's link parser. */
export function isDeviceInviteToken(s: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(s);
}

// ── Time ────────────────────────────────────────────────────────────────

function ms(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) throw new Error('invalid_time');
  return t;
}

/** When an invite made at `createdAt` stops working (ISO). */
export function inviteExpiresAt(createdAt: string, ttlDays: number = INVITE_TTL_DAYS): string {
  return new Date(ms(createdAt) + ttlDays * DAY_MS).toISOString();
}

export interface InviteTimes {
  acceptedAt: string | null;
  revokedAt: string | null;
  expiresAt: string;
}

/** Open: not used, not cancelled, and not past its expiry at `now`. */
export function isInviteOpen(inv: InviteTimes, now: string): boolean {
  return inv.acceptedAt === null && inv.revokedAt === null && ms(inv.expiresAt) > ms(now);
}

/**
 * The day an invite is open until, for "Invited, open until {date}" (F11-REQ-019). A short date
 * in the person's locale and time zone, for example "Thu, 22 Oct". Both are passed in so the
 * answer never depends on the machine.
 */
export function inviteOpenUntil(expiresAt: string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone }).format(new Date(ms(expiresAt)));
}

/** When the inviter's undo of a join stops being offered (ISO). */
export function undoJoinClosesAt(joinedAt: string): string {
  return new Date(ms(joinedAt) + UNDO_JOIN_WINDOW_HOURS * HOUR_MS).toISOString();
}

/** True inside the 72 hours after `joinedAt` (the server's window, D3). */
export function undoJoinOpen(joinedAt: string, now: string): boolean {
  const t = ms(now);
  return t >= ms(joinedAt) && t < ms(undoJoinClosesAt(joinedAt));
}

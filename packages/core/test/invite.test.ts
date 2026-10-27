/// <reference types="node" />
/**
 * Invite codes, tokens and times (PRD V2 F11 sections 6.2 and 7; WP-F11-03). Pure; randomness
 * and clocks are passed in. Titles start with the requirement they prove.
 */
import { describe, expect, it } from 'vitest';
import {
  base64Url,
  formatInviteCode,
  INVITE_CODE_ALPHABET,
  INVITE_CODE_BYTES,
  INVITE_TTL_DAYS,
  inviteCodeFromBytes,
  inviteExpiresAt,
  inviteOpenUntil,
  inviteTokenFromBytes,
  isDeviceInviteToken,
  isInviteCode,
  isInviteOpen,
  normaliseInviteCode,
  spokenInviteCode,
  UNDO_JOIN_WINDOW_HOURS,
  undoJoinClosesAt,
  undoJoinOpen,
} from '../src/invite';

/** A small seeded generator (mulberry32), so the property checks are repeatable. */
function seeded(seed: number): (n: number) => Uint8Array {
  let a = seed >>> 0;
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      out[i] = ((t ^ (t >>> 14)) >>> 0) & 0xff;
    }
    return out;
  };
}

/** An independent reference: the 40-bit number written in base 32, most significant digit first. */
function referenceCode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes.slice(0, 5)) n = (n << 8n) | BigInt(b);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out = INVITE_CODE_ALPHABET[Number(n & 31n)] + out;
    n >>= 5n;
  }
  return out;
}

describe('invite code (F11 D5, TDD 04 3.4.1)', () => {
  it('[F11-REQ-002] the alphabet is Crockford base32: 32 symbols, no I, L, O or U', () => {
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(32);
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[ILOU]/);
  });

  it('[F11-REQ-002] makes 8 characters from 5 random bytes, matching an independent base-32 reference', () => {
    expect(inviteCodeFromBytes(new Uint8Array(5))).toBe('00000000');
    expect(inviteCodeFromBytes(new Uint8Array([255, 255, 255, 255, 255]))).toBe('ZZZZZZZZ');
    const rand = seeded(20261015);
    for (let i = 0; i < 2000; i++) {
      const bytes = rand(INVITE_CODE_BYTES);
      const code = inviteCodeFromBytes(bytes);
      expect(code).toBe(referenceCode(bytes));
      expect(isInviteCode(code)).toBe(true);
    }
    expect(() => inviteCodeFromBytes(new Uint8Array(4))).toThrow('invite_code_needs_5_bytes');
  });

  it('[F11-REQ-002] uses only the first 5 bytes, so extra randomness never changes the format', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(inviteCodeFromBytes(bytes)).toBe(inviteCodeFromBytes(bytes.slice(0, 5)));
  });

  it('[A-REQ-029] reads a typed code whatever the case, spaces or dash', () => {
    expect(normaliseInviteCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normaliseInviteCode('  ABCD EFGH ')).toBe('ABCDEFGH');
    expect(normaliseInviteCode('abcd\u2013efgh')).toBe('ABCDEFGH'); // en dash
    expect(normaliseInviteCode('abcd\u2014efgh')).toBe('ABCDEFGH'); // em dash
    expect(normaliseInviteCode('abcd\u2212efgh')).toBe('ABCDEFGH'); // minus sign
    expect(normaliseInviteCode('ab-cd-ef-gh')).toBe('ABCDEFGH');
    expect(normaliseInviteCode('ＡＢＣＤＥＦＧＨ')).toBe('ABCDEFGH'); // full-width letters
  });

  it('[A-REQ-029] reads O as zero and I or L as one, and never accepts U', () => {
    expect(normaliseInviteCode('O0o0-I1il')).toBe('00001111');
    expect(normaliseInviteCode('LLLL-llll')).toBe('11111111');
    expect(normaliseInviteCode('ABCD-EFGU')).toBeNull();
    expect(normaliseInviteCode('ABCD-EF!H')).toBeNull();
  });

  it('[A-REQ-029] guesses nothing: a wrong length is no code', () => {
    expect(normaliseInviteCode('')).toBeNull();
    expect(normaliseInviteCode('ABCD-EFG')).toBeNull();
    expect(normaliseInviteCode('ABCD-EFGHJ')).toBeNull();
    expect(normaliseInviteCode('https://example.com/i/ABCDEFGH')).toBeNull();
  });

  it('shows the code as two groups and reads it back unchanged', () => {
    const rand = seeded(7);
    for (let i = 0; i < 200; i++) {
      const code = inviteCodeFromBytes(rand(5));
      const shown = formatInviteCode(code);
      expect(shown).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(normaliseInviteCode(shown)).toBe(code);
      expect(normaliseInviteCode(shown.toLowerCase())).toBe(code);
    }
    expect(() => formatInviteCode('abcdefgh')).toThrow('invite_code_invalid');
  });

  it('[F11-U29] VoiceOver spells the code one character at a time, in two groups', () => {
    expect(spokenInviteCode('ABCD1234')).toBe('A B C D, 1 2 3 4');
    expect(() => spokenInviteCode('ABC')).toThrow('invite_code_invalid');
  });
});

describe('invite token (F11 D5, B-NFR-002)', () => {
  it('[F11-REQ-002] is 32 random bytes as 43 base64url characters, with no padding', () => {
    const rand = seeded(42);
    for (let i = 0; i < 500; i++) {
      const bytes = rand(32);
      const token = inviteTokenFromBytes(bytes);
      expect(token).toHaveLength(43);
      expect(isDeviceInviteToken(token)).toBe(true);
      expect(token).toBe(Buffer.from(bytes).toString('base64url'));
    }
    expect(() => inviteTokenFromBytes(new Uint8Array(31))).toThrow('invite_token_needs_32_bytes');
    expect(() => inviteTokenFromBytes(new Uint8Array(33))).toThrow('invite_token_needs_32_bytes');
  });

  it('base64url matches the platform encoder for every length remainder', () => {
    const rand = seeded(3);
    for (const n of [0, 1, 2, 3, 4, 5, 31, 32, 33]) {
      const bytes = rand(n);
      expect(base64Url(bytes)).toBe(Buffer.from(bytes).toString('base64url'));
    }
  });

  it('tells a device-made token from anything else', () => {
    expect(isDeviceInviteToken('q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ')).toBe(true);
    expect(isDeviceInviteToken('3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6')).toBe(false);
    expect(isDeviceInviteToken('q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9i=')).toBe(false);
  });
});

describe('invite times (K-18, F11-REQ-019, D3)', () => {
  const MADE = '2026-10-15T09:00:00.000Z';

  it('[B-REQ-007] a parent invite expires 7 days after it is made', () => {
    expect(INVITE_TTL_DAYS).toBe(7);
    expect(inviteExpiresAt(MADE)).toBe('2026-10-22T09:00:00.000Z');
    expect(() => inviteExpiresAt('not a time')).toThrow('invalid_time');
  });

  it('[F11-REQ-019] an invite is open until used, cancelled or expired', () => {
    const open = { acceptedAt: null, revokedAt: null, expiresAt: '2026-10-22T09:00:00.000Z' };
    expect(isInviteOpen(open, '2026-10-22T08:59:59.000Z')).toBe(true);
    expect(isInviteOpen(open, '2026-10-22T09:00:00.000Z')).toBe(false);
    expect(isInviteOpen({ ...open, acceptedAt: '2026-10-16T09:00:00.000Z' }, MADE)).toBe(false);
    expect(isInviteOpen({ ...open, revokedAt: '2026-10-16T09:00:00.000Z' }, MADE)).toBe(false);
  });

  it('[F11-REQ-019] "open until" is a short date in the person\'s locale and time zone', () => {
    expect(inviteOpenUntil('2026-10-22T09:00:00.000Z', 'en-GB', 'UTC')).toBe('Thu 22 Oct');
    expect(inviteOpenUntil('2026-10-22T09:00:00.000Z', 'en-US', 'UTC')).toBe('Thu, Oct 22');
    // The same moment is already Friday in Auckland.
    expect(inviteOpenUntil('2026-10-22T23:00:00.000Z', 'en-GB', 'Pacific/Auckland')).toBe('Fri 23 Oct');
  });

  it('[F11-REQ-008] the inviter can undo a join for 72 hours, and not after', () => {
    expect(UNDO_JOIN_WINDOW_HOURS).toBe(72);
    const joined = '2026-10-15T20:00:00.000Z';
    expect(undoJoinClosesAt(joined)).toBe('2026-10-18T20:00:00.000Z');
    expect(undoJoinOpen(joined, '2026-10-15T20:00:00.000Z')).toBe(true);
    expect(undoJoinOpen(joined, '2026-10-18T19:00:00.000Z')).toBe(true); // T+71h
    expect(undoJoinOpen(joined, '2026-10-18T20:00:00.000Z')).toBe(false); // T+72h
    expect(undoJoinOpen(joined, '2026-10-18T21:00:00.000Z')).toBe(false); // T+73h
    expect(undoJoinOpen(joined, '2026-10-15T19:00:00.000Z')).toBe(false); // a clock before the join
  });
});

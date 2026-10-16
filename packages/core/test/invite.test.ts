import { describe, expect, it } from 'vitest';
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  INVITE_TTL_DAYS,
  formatInviteCode,
  inviteDaysLeft,
  inviteExpiresAt,
  inviteRowState,
  isInviteCode,
  makeInviteCode,
  makeInviteToken,
  normaliseInviteCode,
  spokenInviteCode,
} from '../src/invite';

const DAY = 24 * 60 * 60 * 1000;
const bytes = (...n: number[]) => new Uint8Array(n);

describe('invite code alphabet (F11-REQ-002, Crockford base32)', () => {
  it('[F11-REQ-002] has 32 characters and no I, L, O or U', () => {
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(32);
    for (const ch of 'ILOU') expect(INVITE_CODE_ALPHABET).not.toContain(ch);
  });

  it('[F11-REQ-002] makes 8 characters from 5 random bytes, most significant bits first', () => {
    expect(makeInviteCode(bytes(0, 0, 0, 0, 0))).toBe('00000000');
    expect(makeInviteCode(bytes(255, 255, 255, 255, 255))).toBe('ZZZZZZZZ');
    // 0x0842108421 is 00001 repeated eight times.
    expect(makeInviteCode(bytes(0x08, 0x42, 0x10, 0x84, 0x21))).toBe('11111111');
    expect(makeInviteCode(bytes(0, 0, 0, 0, 31))).toBe('0000000Z');
    for (let i = 0; i < 200; i++) {
      const r = new Uint8Array(5).map(() => Math.floor(Math.random() * 256));
      const code = makeInviteCode(r);
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      expect(isInviteCode(code)).toBe(true);
    }
  });

  it('refuses too few random bytes', () => {
    expect(() => makeInviteCode(bytes(1, 2, 3, 4))).toThrow('invite_code_needs_5_random_bytes');
  });
});

describe('invite code normalisation: case, dashes, O and 0 (WP-F11-03)', () => {
  it('[F11-REQ-002] ignores case', () => {
    expect(normaliseInviteCode('abcd-efgh')).toBe('ABCDEFGH');
    expect(normaliseInviteCode('AbCdEfGh')).toBe('ABCDEFGH');
  });

  it('[F11-REQ-002] ignores the dash in any form, and spaces', () => {
    for (const s of ['ABCD-EFGH', 'ABCD EFGH', ' ABCD  EFGH ', 'ABCD\u2010EFGH', 'ABCD\u2011EFGH', 'ABCD\u2012EFGH', 'ABCD\u2013EFGH', 'ABCD\u2014EFGH', 'ABCD\u2212EFGH', 'ABCD\uFF0DEFGH', 'AB-CD-EF-GH', 'ABCD\u00A0EFGH', 'ABCD\nEFGH']) {
      expect(normaliseInviteCode(s), JSON.stringify(s)).toBe('ABCDEFGH');
    }
  });

  it('[F11-REQ-002] reads the letter O as zero, and I and L as one', () => {
    expect(normaliseInviteCode('O0O0-o0o0')).toBe('00000000');
    expect(normaliseInviteCode('IL1i-l1Il')).toBe('11111111');
    expect(normaliseInviteCode('7KQO-M2PL')).toBe('7KQ0M2P1');
  });

  it('accepts full-width characters people paste from some keyboards', () => {
    expect(normaliseInviteCode('\uFF21\uFF22\uFF23\uFF24-EFGH')).toBe('ABCDEFGH');
  });

  it('refuses anything that cannot be a code', () => {
    for (const s of ['', 'ABCDEFG', 'ABCDEFGHJ', 'ABCD-EFGU', 'ABCD-EF#H', 'ABCD-EFG\u00E9', 'https://example.com/i#t=x']) {
      expect(normaliseInviteCode(s), s).toBeNull();
    }
    expect(normaliseInviteCode(undefined as unknown as string)).toBeNull();
  });

  it('a code it makes always reads back as itself, in any typed form', () => {
    for (let i = 0; i < 200; i++) {
      const code = makeInviteCode(new Uint8Array(5).map(() => Math.floor(Math.random() * 256)));
      expect(normaliseInviteCode(code)).toBe(code);
      expect(normaliseInviteCode(formatInviteCode(code).toLowerCase())).toBe(code);
      expect(normaliseInviteCode(code.replace(/0/g, 'O').replace(/1/g, 'l'))).toBe(code);
    }
  });

  it('formats as XXXX-XXXX and spells it in two groups for VoiceOver (F11-U29)', () => {
    expect(formatInviteCode('abcdefgh')).toBe('ABCD-EFGH');
    expect(spokenInviteCode('7KQ0-M2P1')).toBe('7 K Q 0, M 2 P 1');
    expect(() => formatInviteCode('nope')).toThrow('invite_code_invalid');
  });
});

describe('invite tokens (F11-REQ-002)', () => {
  it('[F11-REQ-002] are 43 base64url characters from 32 random bytes', () => {
    const t = makeInviteToken(new Uint8Array(32).fill(255));
    expect(t).toBe('_'.repeat(42) + '8');
    expect(makeInviteToken(new Uint8Array(32))).toBe('A'.repeat(43));
    const r = makeInviteToken(new Uint8Array(32).map((_, i) => i * 7));
    expect(r).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(r, 'base64url')).toEqual(Buffer.from(new Uint8Array(32).map((_, i) => i * 7)));
  });

  it('refuses fewer than 32 random bytes', () => {
    expect(() => makeInviteToken(new Uint8Array(31))).toThrow('invite_token_needs_32_random_bytes');
  });
});

describe('invite expiry (K-18, B-REQ-007)', () => {
  const created = '2026-10-15T09:00:00.000Z';
  const exp = inviteExpiresAt(created);
  const t0 = Date.parse(created);

  it('[B-REQ-007] an invite is open for 7 days', () => {
    expect(INVITE_TTL_DAYS).toBe(7);
    expect(exp).toBe('2026-10-22T09:00:00.000Z');
    expect(() => inviteExpiresAt('not a date')).toThrow('invite_created_at_invalid');
  });

  it('states follow the server order: used, revoked, expired, open', () => {
    expect(inviteRowState({ expiresAt: exp }, t0)).toBe('open');
    expect(inviteRowState({ expiresAt: exp }, t0 + 7 * DAY + 1)).toBe('expired');
    expect(inviteRowState({ expiresAt: exp, revokedAt: created }, t0)).toBe('revoked');
    expect(inviteRowState({ expiresAt: exp, revokedAt: created, acceptedAt: created }, t0 + 9 * DAY)).toBe('used');
    expect(inviteRowState({ expiresAt: 'garbage' }, t0)).toBe('expired');
  });

  it('counts whole days left: 7 at creation, 1 on the last day, 0 after', () => {
    expect(inviteDaysLeft(exp, t0)).toBe(7);
    expect(inviteDaysLeft(exp, t0 + 6 * DAY + 1)).toBe(1);
    expect(inviteDaysLeft(exp, t0 + 7 * DAY)).toBe(0);
    expect(inviteDaysLeft('garbage', t0)).toBe(0);
  });
});

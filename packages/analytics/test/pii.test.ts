import { describe, expect, it } from 'vitest';
import { isPiiLike as isPiiLikeInValidate } from '../src/validate';
import { isPiiLike, PII_PATTERNS } from '../src/pii';

/** Fictional family only (the Asha rule). Every string here is invented. */
const PII_SHAPED: Record<string, string> = {
  email: 'asha.family@example.com',
  phone: '+1 (555) 010-0199',
  url: 'https://example.com/asha',
  uuid: '3f2b8c1e-9a4d-4e6b-8c7a-1d2e3f4a5b6c',
  iso_date: '2026-03-14',
  other_date: '14/03/2026',
  jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6',
  long_token: 'abcdefghijklmnopqrstuvwxyz0123456789',
};

/** Shapes an enum, bucket or route value legitimately takes. */
const CLEAN = ['first', 'lt_15s', '2_4', '100_364', 'd2_7', 'settings_child_detail', 'on_device', 'other'];

describe('isPiiLike (pii.ts)', () => {
  it('has one pattern per shape in the table, so a removed pattern is noticed', () => {
    expect(PII_PATTERNS).toHaveLength(Object.keys(PII_SHAPED).length);
  });

  for (const [shape, sample] of Object.entries(PII_SHAPED)) {
    it(`flags a ${shape}`, () => {
      expect(isPiiLike(sample)).toBe(true);
    });
  }

  it('matches each sample with the pattern at the same position, so no pattern is dead', () => {
    const samples = Object.values(PII_SHAPED);
    samples.forEach((sample, i) => expect(PII_PATTERNS[i].test(sample), Object.keys(PII_SHAPED)[i]).toBe(true));
  });

  it('flags a shape hidden inside a longer string', () => {
    expect(isPiiLike('sent to asha.family@example.com today')).toBe(true);
    expect(isPiiLike('born 2026-03-14')).toBe(true);
  });

  for (const value of CLEAN) {
    it(`lets the enum-shaped value ${value} through`, () => {
      expect(isPiiLike(value)).toBe(false);
    });
  }

  it('is stateless: no pattern is global or sticky, so a repeated call gives the same answer', () => {
    for (const re of PII_PATTERNS) {
      expect(re.global, String(re)).toBe(false);
      expect(re.sticky, String(re)).toBe(false);
    }
    for (let i = 0; i < 4; i++) expect(isPiiLike(PII_SHAPED.email)).toBe(true);
  });

  it('agrees with the copy still inside validate.ts, until the send-path PR removes it', () => {
    for (const s of [...Object.values(PII_SHAPED), ...CLEAN, 'Asha', 'a b', '']) {
      expect(isPiiLike(s), s).toBe(isPiiLikeInValidate(s));
    }
  });
});

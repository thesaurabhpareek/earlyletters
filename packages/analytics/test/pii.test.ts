import { describe, expect, it } from 'vitest';
import { EVENTS, GLOBAL_PROPS, REGISTRY } from '../src';
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
  non_http_scheme: 'content://media/asha',
  bare_host: 'asha-family.example.com',
  media_file_name: 'asha-first-words.m4a',
  device_path: '/Users/asha.parent/Documents',
  written_date: 'march_4_2025',
  handle: '@asha_mum',
  possessive_name: "Asha's",
  device_name: 'ashas_iPhone',
  vendor_key: 'phc_AbCdEf0123456789',
};

/** More ways each added shape turns up. Every string is invented (Asha). */
const MORE_PII: string[] = [
  'mailto:asha.family@example.com', 'tel:+15550100199', 'file:///private/var/mobile/asha.txt', 'intent://scan#Intent', 'javascript:alert(1)', 'ph://asset/ABC',
  'example.com', 'www.asha-family.org', 'my.site.io/path', 'asha.dev',
  'recording.WAV', 'asha_voice.mp3', 'IMG_0042.HEIC', 'photo.jpeg', 'take-3.caf', 'clip.mov',
  '/var/mobile/Containers/Data/Application/ABC/Documents/take.js', 'C:\\Users\\asha\\x', '~/Library/asha', '/data/user/0/app/files', '/storage/emulated/0/DCIM', 'in /Users/x',
  'March 4', 'march 4, 2025', 'Mar_4', '4th of March', '4 march', 'Asha_birthday_march_4', 'saved on May 2025', 'dec_2024', 'sept 9',
  '@asha', 'ping @asha_mum', "Ashi's", "Asha\u2019s", 'ashas iPhone', 'Ashas-iPad', "Asha's iPhone",
  'phx_AbCdEf0123456789', 'sk_live_AbCdEf0123456789', 'sb_secret_AbCdEf012345', 'AKIAABCDEFGHIJKLMNOP', 'ghp_abcdefghijklmnopqrstuvwxyz0123', 'appl_AbCdEfGhIjKlMn', 'Bearer abcdefgh12345678',
];

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

  for (const value of MORE_PII) {
    it(`flags the variant ${JSON.stringify(value)}`, () => {
      expect(isPiiLike(value)).toBe(true);
    });
  }

  it('validate.ts re-exports this one function: there is no second copy (the P4 removal)', () => {
    expect(isPiiLikeInValidate).toBe(isPiiLike);
  });

  it('lets lower snake enums, versions and SDK words through, so the new shapes stay narrow', () => {
    for (const ok of ['may_start', 'mar', 'decide', 'dec_x', 'maybe_later', 'sept', 'march', 'index.ts', 'app.bundle', 'Mobile', 'iOS', '26.0', '4.87.1', 'phone', 'iphone', 'file_kind', 'data_saver', 'content_view', 'on_device', 'ipad_pro_wait']) {
      expect(isPiiLike(ok), ok).toBe(false);
    }
  });

  it('does not flag any enum value in the registry or the held catalogue, and no int range is read as a string', () => {
    const values: string[] = [];
    for (const table of [REGISTRY, EVENTS] as Record<string, { props: Record<string, { type: string; values?: readonly string[] }> }>[]) {
      for (const row of Object.values(table)) for (const spec of Object.values(row.props)) if (spec.type === 'enum') values.push(...(spec.values ?? []));
    }
    for (const spec of Object.values(GLOBAL_PROPS) as { type: string; values?: readonly string[] }[]) if (spec.type === 'enum') values.push(...(spec.values ?? []));
    expect(values.length).toBeGreaterThan(100);
    for (const v of values) expect(isPiiLike(v), v).toBe(false);
  });
});

/**
 * packages/brand checks (MONO-08, MONO-09).
 *
 * Runs today with `npx vitest run packages/brand` from the repo root; a
 * package `test` script arrives with the dependency workstream.
 *
 * design-tokens is imported by relative path so this package keeps zero
 * dependencies (no package.json change needed).
 */
import { describe, expect, it } from 'vitest';
import { tokens } from '../../design-tokens/src/tokens';
import { brand, bundleId } from '../index';

/**
 * Every brand colour and the design token it must equal. Adding a brand
 * colour without mapping it here fails the "every colour is mapped" test.
 */
const PARITY: Record<keyof typeof brand.colors, string> = {
  ink: tokens.light.text,
  inkMuted: tokens.light.textMuted,
  paper: tokens.light.bg,
  paperRaised: tokens.light.surfaceRaised,
  accent: tokens.light.accent,
  accentSoft: tokens.light.accentSoft,
  line: tokens.light.line,
  inkDark: tokens.dark.text,
  inkMutedDark: tokens.dark.textMuted,
  paperDark: tokens.dark.bg,
  paperRaisedDark: tokens.dark.surfaceRaised,
  accentDark: tokens.dark.accent,
  lineDark: tokens.dark.line,
};

describe('brand colours match design tokens', () => {
  it('every brand colour is mapped to a token', () => {
    expect(Object.keys(PARITY).sort()).toEqual(Object.keys(brand.colors).sort());
  });

  for (const [name, token] of Object.entries(PARITY)) {
    it(`${name} equals its design token`, () => {
      expect(brand.colors[name as keyof typeof brand.colors].toUpperCase()).toBe(token.toUpperCase());
    });
  }
});

describe('brand identity', () => {
  it('codename and scheme are lowercase identifiers', () => {
    expect(brand.codename).toBe('scribe');
    expect(brand.scheme).toMatch(/^[a-z][a-z0-9+.-]*$/);
  });

  it('App Store name and subtitle fit the 30 character limit', () => {
    expect(brand.storeName.length).toBeLessThanOrEqual(30);
    expect(brand.subtitle.length).toBeLessThanOrEqual(30);
  });

  it('store name starts with the brand name', () => {
    expect(brand.storeName.startsWith(brand.name)).toBe(true);
  });

  it('bundle ID is the reversed publisher domain plus the codename', () => {
    const id = bundleId();
    expect(id).toBe(`${brand.publisher.domain.split('.').reverse().join('.')}.${brand.codename}`);
    expect(id).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/);
  });

  it('deprecated company alias points at publisher', () => {
    expect(brand.company).toBe(brand.publisher);
  });

  it('print title spells out the first three years', () => {
    expect(brand.printTitle(1)).toBe(`${brand.name}: Year One`);
    expect(brand.printTitle(3)).toBe(`${brand.name}: Year Three`);
    expect(brand.printTitle(4)).toBe(`${brand.name}: Year 4`);
  });

  it('public strings follow the content rules (no dashes, curly quotes, ellipsis or emoji)', () => {
    const banned = /[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]|\p{Extended_Pictographic}/u;
    for (const s of [brand.name, brand.category, brand.storeName, brand.subtitle, brand.tagline, brand.printTitle(1)]) {
      expect(s, s).not.toMatch(banned);
    }
  });
});

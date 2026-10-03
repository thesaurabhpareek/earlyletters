/**
 * One source of truth for colour (docs/brand/CONSISTENCY_AUDIT.md CA-015, CA-016).
 * packages/brand/index.ts holds the brand palette; this package repeats it so it stays
 * dependency-free. These tests fail the moment the two disagree, a brand colour has no
 * token, or the email package hand-copies a hex value instead of importing it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '../../brand/index';
import { tokens } from '../src/tokens';

type BrandColor = keyof typeof brand.colors;

/** Every key of brand.colors and the token that must hold the same value. */
const BRAND_TO_TOKEN: Record<BrandColor, readonly ['light' | 'dark', string]> = {
  ink: ['light', 'text'],
  inkMuted: ['light', 'textMuted'],
  paper: ['light', 'bg'],
  paperRaised: ['light', 'surfaceRaised'],
  accent: ['light', 'accent'],
  accentDeep: ['light', 'accentDeep'],
  accentSoft: ['light', 'accentSoft'],
  line: ['light', 'line'],
  inkDark: ['dark', 'text'],
  inkMutedDark: ['dark', 'textMuted'],
  paperDark: ['dark', 'bg'],
  paperRaisedDark: ['dark', 'surfaceRaised'],
  accentDark: ['dark', 'accent'],
  lineDark: ['dark', 'line'],
};

describe('brand and tokens agree', () => {
  it('every colour in brand.colors has a token mapping', () => {
    expect(Object.keys(BRAND_TO_TOKEN).sort()).toEqual(Object.keys(brand.colors).sort());
  });

  for (const [name, [mode, token]] of Object.entries(BRAND_TO_TOKEN)) {
    it(`brand.colors.${name} equals tokens.${mode}.${token}`, () => {
      const value = (tokens[mode] as Record<string, string>)[token];
      expect(value, `tokens.${mode}.${token} is missing`).toBeDefined();
      expect(value.toUpperCase()).toBe(brand.colors[name as BrandColor].toUpperCase());
    });
  }

  it('brand.icon equals tokens.icon, key for key', () => {
    expect(tokens.icon).toEqual(brand.icon);
  });

  it('the icon tile base is accentDeep and the marks are paper and accentDark', () => {
    expect(tokens.icon.tileBottom).toBe(tokens.light.accentDeep);
    expect(tokens.icon.mark).toBe(tokens.light.bg);
    expect(tokens.icon.darkMark).toBe(tokens.dark.accent);
  });

  it('destructive is its own token, equal to recording today (D-029)', () => {
    expect(tokens.light.destructive).toBe(tokens.light.recording);
    expect(tokens.dark.destructive).toBe(tokens.dark.recording);
  });
});

describe('email tokens import colours, never copy them (CA-016)', () => {
  const src = readFileSync(join(__dirname, '..', '..', 'emails', 'src', 'tokens.ts'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('imports @scribe/brand and @scribe/design-tokens', () => {
    expect(code).toMatch(/from '@scribe\/brand'/);
    expect(code).toMatch(/from '@scribe\/design-tokens'/);
  });

  it('has no hex colour literal outside comments', () => {
    expect(code.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).toEqual([]);
  });
});

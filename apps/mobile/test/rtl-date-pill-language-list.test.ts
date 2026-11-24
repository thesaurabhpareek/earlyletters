/**
 * BL-1979 (refines BL-411, D-056): the date pill and the language list read right under RTL.
 * Pure logic plus source pins; there is no renderer here, so the pins are named as such. Nothing was run on a device.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@scribe/core';
import { shortDate, longDate } from '../src/lib/dates';
import { nameBlockStyle, nameTextStyle } from '../src/components/language/language-text.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

describe('[BL-1979] the date pill takes a short date and wraps', () => {
  it('is never longer than the long date, and shorter for the long months, in en-GB and en-US', () => {
    for (let m = 1; m <= 12; m++) {
      const iso = `2026-${String(m).padStart(2, '0')}-28`;
      for (const loc of ['en-GB', 'en-US']) expect(shortDate(iso, loc).length, `${iso} ${loc}`).toBeLessThanOrEqual(longDate(iso, loc).length);
    }
    expect(shortDate('2026-09-29', 'en-GB').length).toBeLessThan(longDate('2026-09-29', 'en-GB').length);
    expect(shortDate('2026-09-29', 'en-GB')).toMatch(/^29 Sep\w* 2026$/); // ICU writes Sep or Sept
  });

  it('a long date does not truncate in es, fr or pt: the same whole short form, nothing cut', () => {
    for (const loc of ['es-ES', 'es-MX', 'fr-FR', 'fr-CA', 'pt-BR', 'pt-PT', 'ar', 'hi-IN', 'zh-CN']) {
      const out = shortDate('2026-09-29', loc);
      expect(out, loc).toBe(shortDate('2026-09-29', 'en-GB'));
      expect(out, loc).not.toMatch(/\u2026|\.\.\./);
    }
    // No month's short form is longer than a day, four letters and a year (Sept, 28 Sept 2026).
    for (let m = 1; m <= 12; m++) expect(shortDate(`2026-${String(m).padStart(2, '0')}-28`, 'es-ES').length).toBeLessThanOrEqual('28 Sept 2026'.length);
  });

  it('[source pin] the pill shows the short date and sets no line limit on its label', () => {
    const field = src('src/components/child/date-field.tsx');
    expect(field).toMatch(/label=\{value \? shortDate\(value\) : chooseLabel\}/);
    // VoiceOver still hears the whole date.
    expect(field).toMatch(/accessibilityLabel=\{`\$\{label\}\. \$\{value \? longDate\(value\) : chooseLabel\}`\}/);
    expect(src('src/components/ui/button.tsx')).not.toMatch(/numberOfLines|ellipsizeMode/);
  });
});

describe('[BL-1979] the language list starts rows at the start edge under RTL', () => {
  it('aligns the name block with a mirrored edge, never a physical side', () => {
    expect(nameBlockStyle()).toEqual({ alignItems: 'flex-start' });
    expect(Object.keys(nameBlockStyle())).not.toContain('textAlign');
  });

  it('keeps each name in its own direction and sets no textAlign, for every language', () => {
    for (const l of LANGUAGES) {
      const s = nameTextStyle(l.script.direction);
      expect(s, l.code).toEqual({ writingDirection: l.script.direction });
      expect(Object.keys(s), l.code).not.toContain('textAlign');
    }
    expect(LANGUAGES.some((l) => l.script.direction === 'rtl')).toBe(true);
  });

  it('[source pin] the picker rows and the settings rows both use the start-aligned block', () => {
    for (const f of ['src/components/language/language-picker.tsx', 'src/components/language/language-row.tsx']) {
      const code = src(f);
      expect(code, f).toMatch(/style=\{nameBlockStyle\(\)\}/);
      expect(code, f).toMatch(/style=\{nameTextStyle\(info\.script\.direction\)\}/);
      expect(code, f).not.toMatch(/textAlign/);
    }
  });
});

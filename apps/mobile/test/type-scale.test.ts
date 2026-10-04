/// <reference types="node" />
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens, type TypeToken } from '@scribe/design-tokens';

// fonts.ts imports expo-font; read the pure parts through type-scale only and
// check the font manifest from source text.
import { maxScaleFor, typeClass } from '../src/lib/type-scale';

const root = join(__dirname, '..');
const css = readFileSync(join(root, 'src/global.css'), 'utf8');
const names = Object.keys(tokens.type) as TypeToken[];
const cssName = (t: string) => t.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/([a-z])(\d)/, '$1$2');

describe('type scale in global.css', () => {
  for (const t of names) {
    it(`${t} matches tokens.type`, () => {
      const n = cssName(t);
      const s = tokens.type[t];
      expect(css).toContain(`--text-${n}: ${s.fontSize}px;`);
      expect(css).toContain(`--text-${n}--line-height: ${s.lineHeight}px;`);
    });
  }
  it('every style has a class mapping that uses its own size class', () => {
    for (const t of names) expect(typeClass[t]).toContain(`text-${cssName(t)}`);
  });
});

describe('Dynamic Type caps', () => {
  it('read tokens.type[].maxScale, null as unbounded', () => {
    for (const t of names) {
      const cap = tokens.type[t].maxScale;
      expect(maxScaleFor(t)).toBe(cap === null ? undefined : cap);
    }
    expect(maxScaleFor('display')).toBe(1.6);
    expect(maxScaleFor('body')).toBeUndefined();
  });
});

describe('bundled fonts', () => {
  const src = readFileSync(join(root, 'src/lib/fonts.ts'), 'utf8');
  it('lists every family the type scale uses', () => {
    const used = new Set(Object.values(tokens.type).map((s) => s.fontFamily));
    for (const f of used) {
      expect(Object.values(tokens.fontFamily)).toContain(f);
    }
    for (const key of ['serif', 'serifItalic', 'sans', 'sansMedium', 'sansSemiBold']) {
      expect(src).toContain(`tokens.fontFamily.${key}`);
    }
  });
  it('every font file in assets/fonts has an OFL licence beside it', () => {
    const dir = join(root, 'assets/fonts');
    const files = existsSync(dir) ? readdirSync(dir) : [];
    const fonts = files.filter((f) => /\.(ttf|otf)$/i.test(f));
    if (fonts.length > 0) expect(files.some((f) => /^OFL/i.test(f) || /licen[cs]e/i.test(f))).toBe(true);
  });
});

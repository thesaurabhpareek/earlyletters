/**
 * BookCover (EXPERIENCE_PASS 5.4, P1 acceptance): a 60-character name renders in three lines with a fade
 * and never an ellipsis glyph. The cover draws with react-native-svg, which Node cannot load, so this tests
 * the logic that sets the name, the sizes, and the mark, against the bundled font files and the registry.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { asset } from '@scribe/brand/registry';
import { CHILD_NAME_MAX, SIGNS_AS_MAX } from '@scribe/core';
import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  ADVANCE,
  COVER_SIZES,
  FAN,
  FLYLEAF_NAME_LINES,
  NAME_LINES,
  SMALL_SYMBOL_PATH,
  SMALL_SYMBOL_VIEWBOX,
  coverMark,
  coverMetrics,
  coverName,
  coverSignature,
  displayName,
  graphemes,
  measure,
  setText,
  type CoverSize,
} from '../src/components/book/book-cover.logic';

const ROOT = join(__dirname, '..', '..', '..');
const SIZES = Object.keys(COVER_SIZES) as CoverSize[];
/** Fictional fixtures only (CLAUDE.md): Asha, with a long fictional name at the 60-character limit. */
const LONG = 'Asha Meenakshi Ananya Saraswathi Lakshmi Priyanka Ramanathan';
const ELLIPSIS = /\u2026|\.\.\./;
const noSpaces = (s: string) => s.replace(/\s+/g, '');

describe('the 60-character name: three lines, a fade, never an ellipsis', () => {
  it('the fixture is exactly the longest name the app allows', () => {
    expect(LONG.length).toBe(CHILD_NAME_MAX);
    expect(CHILD_NAME_MAX).toBe(60);
  });

  for (const size of SIZES) {
    it(`${size} (${COVER_SIZES[size].width} x ${COVER_SIZES[size].height} pt): three lines ending in a fade`, () => {
      const set = coverName(LONG, size);
      const m = coverMetrics(size);
      expect(set.lines).toHaveLength(3);
      expect(set.truncated).toBe(true);
      expect(set.fontSize).toBeLessThanOrEqual(m.name.size);
      expect(set.fontSize).toBeGreaterThanOrEqual(m.name.min);
      for (const line of set.lines) {
        expect(line).not.toMatch(ELLIPSIS);
        expect(measure(line, set.fontSize), line).toBeLessThanOrEqual(m.textWidth);
        expect(line.length).toBeGreaterThan(0);
      }
      // Nothing is added or changed: the lines are the start of the name, in order, letter for letter.
      expect(noSpaces(LONG).startsWith(noSpaces(set.lines.join(' ')))).toBe(true);
      // The accessible name is always complete.
      expect(set.full).toBe(LONG);
    });
  }

  it('the last line runs to the edge, so the fade sits on letters and not on empty paper', () => {
    const m = coverMetrics('sm');
    const set = coverName(LONG, 'sm');
    expect(measure(set.lines[2], set.fontSize)).toBeGreaterThan(m.textWidth * 0.75);
  });

  it('the lines it draws whole are whole words: "Meenakshi" never breaks into "Meenak" and "shi"', () => {
    for (const size of SIZES) {
      const set = coverName(LONG, size);
      const words = new Set(LONG.split(' '));
      for (const line of set.lines.slice(0, -1)) for (const w of line.split(' ')) expect(words.has(w), `${size}: ${w}`).toBe(true);
      expect(set.broken, size).toBe(false);
    }
  });

  it('one word longer than the cover breaks between letters, never mid-letter, and still ends in a fade', () => {
    const word = `Asha${'a'.repeat(56)}`;
    expect(word.length).toBe(60);
    const set = coverName(word, 'sm');
    expect(set.lines).toHaveLength(3);
    expect(set.truncated).toBe(true);
    expect(word.startsWith(set.lines.join(''))).toBe(true);
    for (const l of set.lines) expect(l).not.toMatch(ELLIPSIS);
  });
});

describe('setting a name', () => {
  it('a short name is one line with no fade, at the full cover size', () => {
    for (const size of SIZES) expect(coverName('Asha', size)).toMatchObject({ lines: ['Asha'], truncated: false, full: 'Asha', fontSize: coverMetrics(size).name.size });
  });

  it('a long word sets the name smaller, like a book title, instead of breaking: whole words, at least the floor', () => {
    const set = coverName('Asha Meenakshi', 'sm');
    expect(set.lines).toEqual(['Asha', 'Meenakshi']);
    expect(set.truncated).toBe(false);
    expect(set.fontSize).toBeLessThan(coverMetrics('sm').name.size);
    expect(set.fontSize).toBeGreaterThanOrEqual(tokens.minFontSize);
  });

  it('two names wrap at the space, and a name that fits is never faded', () => {
    const set = coverName('Asha Nila', 'sm');
    expect(set.truncated).toBe(false);
    expect(set.lines.join(' ')).toBe('Asha Nila');
  });

  it('an empty or blank name gives a blank cover', () => {
    expect(coverName('', 'sm')).toMatchObject({ lines: [], truncated: false, full: '' });
    expect(coverName('   ', 'lg').lines).toEqual([]);
  });

  it('is trimmed only for display: outer spaces go, inner runs show as one space, every letter stays', () => {
    expect(displayName('  Asha   Rose ')).toBe('Asha Rose');
    expect(coverName('  Āshā  ', 'md').lines).toEqual(['Āshā']);
  });

  it('accented and Devanagari letters stay whole: a break never splits a letter from its mark', () => {
    expect(graphemes('Āshā')).toHaveLength(4);
    expect(graphemes('आशा')).toEqual(['आ', 'शा']);
    const set = coverName('आशाआशाआशाआशाआशाआशाआशाआशाआशाआशाआशाआशाआशाआशाआशा', 'sm');
    for (const l of set.lines) expect(l.normalize('NFC').startsWith('ा')).toBe(false); // no line starts with a matra
  });

  it('letters the faces do not carry are measured wide, so they break early, never late', () => {
    expect(measure('आ', 17)).toBeGreaterThan(measure('a', 17));
  });

  it('the flyleaf keeps the name small, in two lines at most', () => {
    for (const size of SIZES) {
      const set = coverName(LONG, size, 'open');
      expect(set.lines.length).toBeLessThanOrEqual(FLYLEAF_NAME_LINES);
      expect(set.truncated).toBe(true);
      expect(coverMetrics(size).flyleafName.size).toBeLessThan(coverMetrics(size).name.size);
    }
  });

  it('"From Mama" is one whole line on the foot of every cover, never under the 13 pt type floor', () => {
    expect(en.common.signature).toBe('From {signsAs}');
    for (const size of SIZES) {
      const set = coverSignature('From Mama', size);
      expect(set, size).toMatchObject({ lines: ['From Mama'], truncated: false, full: 'From Mama' });
      expect(set.fontSize, size).toBeGreaterThanOrEqual(tokens.minFontSize);
      expect(set.fontSize, size).toBeLessThanOrEqual(coverMetrics(size).signature.size);
    }
    // The foot line grows with the cover.
    expect(coverSignature('From Mama', 'lg').fontSize).toBeGreaterThan(coverSignature('From Mama', 'sm').fontSize);
  });

  it('the longest signature the app allows fades on the foot line instead of wrapping or shrinking further', () => {
    const longest = `From ${'Grandmother Lakshmi Ammamma'.padEnd(SIGNS_AS_MAX, 'a')}`;
    expect(longest.length).toBe(5 + SIGNS_AS_MAX);
    for (const size of SIZES) {
      const set = coverSignature(longest, size);
      expect(set.lines, size).toHaveLength(1);
      expect(set.truncated, size).toBe(true);
      expect(set.fontSize, size).toBe(tokens.minFontSize);
      expect(set.lines[0]).not.toMatch(ELLIPSIS);
      expect(longest.startsWith(set.lines[0])).toBe(true);
    }
  });

  it('never more lines than asked, at any width', () => {
    for (const maxWidth of [20, 40, 70, 140]) {
      const set = setText(LONG, { size: 17, maxWidth, maxLines: NAME_LINES });
      expect(set.lines.length).toBeLessThanOrEqual(NAME_LINES);
    }
  });
});

describe('cover sizes and layout', () => {
  it('the four covers the spec draws, each a paper card close to 3:4', () => {
    expect(COVER_SIZES).toEqual({ sm: { width: 88, height: 116 }, thumb: { width: 96, height: 128 }, md: { width: 132, height: 176 }, lg: { width: 160, height: 214 } });
    for (const s of SIZES) {
      const r = COVER_SIZES[s].width / COVER_SIZES[s].height;
      expect(r, s).toBeGreaterThan(0.74);
      expect(r, s).toBeLessThan(0.77);
    }
  });

  it('the name is Literata Medium 17 pt on the smallest cover and grows with the cover', () => {
    expect(coverMetrics('sm').name.size).toBe(17);
    expect(coverMetrics('sm').signature).toMatchObject({ size: 14, min: tokens.minFontSize });
    for (let i = 1; i < SIZES.length; i++) expect(coverMetrics(SIZES[i]).name.size).toBeGreaterThanOrEqual(coverMetrics(SIZES[i - 1]).name.size);
    for (const s of SIZES) expect(coverMetrics(s).name.size).toBeGreaterThanOrEqual(tokens.minFontSize);
    for (const s of SIZES) expect(coverMetrics(s).radius).toBe(tokens.radius.md);
  });

  it('the mark, three name lines and the foot line fit inside every cover', () => {
    for (const s of SIZES) {
      const m = coverMetrics(s);
      const used = m.pad + m.symbolHeight + m.gap + m.name.lines * m.name.lineHeight + m.signature.lineHeight + m.pad;
      expect(used, s).toBeLessThanOrEqual(m.height);
    }
  });

  it('twins: the second cover fans 10 pt behind, turned 3 degrees', () => {
    expect(FAN).toEqual({ dx: 10, rotateDeg: 3 });
  });
});

describe('the book mark comes from the registry', () => {
  it('ink on paper and reversed on dark, the small cut, both primary', () => {
    expect(coverMark('light').id).toBe('logo.symbol.small.ink');
    expect(coverMark('dark').id).toBe('logo.symbol.small.reversed');
    for (const s of ['light', 'dark'] as const) expect(coverMark(s).status).toBe('primary');
  });

  it('is drawn at a size the small cut allows (12 to 23 pt)', () => {
    for (const s of SIZES) {
      const h = coverMetrics(s).symbolHeight;
      expect(h).toBeGreaterThanOrEqual(asset('logo.symbol.small.ink').minSize!.px);
      expect(h).toBeLessThanOrEqual(23);
    }
  });

  it('the path and box are exactly the registry files (no redrawn mark)', () => {
    const attr = (s: string, a: string) => new RegExp(`\\s${a}="([^"]+)"`).exec(s)?.[1];
    for (const id of ['logo.symbol.small.ink', 'logo.symbol.small.reversed'] as const) {
      const a = asset(id);
      const file = readFileSync(join(ROOT, a.path!), 'utf8');
      expect(attr(file, 'd'), id).toBe(SMALL_SYMBOL_PATH);
      expect(attr(file, 'viewBox'), id).toBe(SMALL_SYMBOL_VIEWBOX);
      expect(attr(file, 'fill'), id).toBe(a.fill);
    }
  });
});

describe('first run names and signs the cover (R3: S05 and S06)', () => {
  const SRC = join(__dirname, '..', 'src');
  /** Comments are not code. */
  const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('the name field can set what is typed in the letter face at 22 pt, the book\'s title; its label stays Mukta', () => {
    expect(tokens.type.nameField).toMatchObject({ fontFamily: tokens.fontFamily.serif, fontSize: 22, maxScale: null });
    const field = code('components/ui/text-field.tsx');
    expect(field).toMatch(/face\?: 'sans' \| 'serif'/);
    expect(field).toMatch(/face = 'sans'/);
    expect(field).toMatch(/const fieldToken = face === 'serif' \? 'nameField' : 'body'/);
    expect(field).toMatch(/typeStyle\(fieldToken, \{ fontsReady: ready \}\)/);
    expect(field).toMatch(/<Text variant="labelSmall" tone="muted">\s*\{label\}/);
  });

  it('a new signature cross-fades on the front\'s foot line on snappy; the flyleaf and Reduce Motion do not move', () => {
    const cover = code('components/book/book-cover.tsx');
    expect(cover).toMatch(/<FootLine set=\{signature \?\? NO_LINES\} size=\{size\} surface=\{c\.surfaceRaised\} crossFade=\{mounted && !still && 'snappy'\} \/>/);
    expect(cover).toMatch(/\{signature \? <FootLine set=\{signature\} size=\{size\} surface=\{c\.surfaceRaised\} crossFade=\{false\} \/> : null\}/);
    // Keyed by the words, so the old line fades out as the new one fades in, and a removed one fades out.
    expect(cover).toMatch(/<NameLines key=\{set\.full\} set=\{set\} italic surface=\{surface\} crossFade=\{crossFade\} \/>/);
    expect(cover).toMatch(/const s = springConfig\(kind\);/);
    expect(cover).toMatch(/FadeIn\.springify\(\)\.stiffness\(s\.stiffness\)\.damping\(s\.damping\)\.mass\(s\.mass\)/);
    expect(cover).toMatch(/FadeOut\.springify\(\)\.stiffness\(s\.stiffness\)\.damping\(s\.damping\)\.mass\(s\.mass\)/);
    // The name keeps its fadeMs cross-fade.
    expect(cover).toMatch(/<NameLines key=\{name\} set=\{coverName\(name, size, 'closed'\)\} surface=\{c\.surfaceRaised\} crossFade=\{mounted && !still && 'fade'\} \/>/);
    expect(cover).toMatch(/const still = reduced \|\| !animate;/);
  });
});

/** Advance widths straight from a TrueType file: the cmap (format 4) and hmtx tables. */
function fontWidths(path: string, from = 32, to = 126): number[] {
  const b = readFileSync(path);
  const tables: Record<string, number> = {};
  for (let i = 0; i < b.readUInt16BE(4); i++) tables[b.toString('ascii', 12 + i * 16, 16 + i * 16)] = b.readUInt32BE(20 + i * 16);
  const upem = b.readUInt16BE(tables.head + 18);
  const metrics = b.readUInt16BE(tables.hhea + 34);
  let sub = -1;
  for (let i = 0; i < b.readUInt16BE(tables.cmap + 2); i++) {
    const r = tables.cmap + 4 + i * 8;
    const off = tables.cmap + b.readUInt32BE(r + 4);
    if (b.readUInt16BE(off) === 4 && (b.readUInt16BE(r) === 0 || (b.readUInt16BE(r) === 3 && b.readUInt16BE(r + 2) === 1))) sub = off;
  }
  const seg = b.readUInt16BE(sub + 6);
  const [ends, starts] = [sub + 14, sub + 16 + seg];
  const [deltas, ranges] = [starts + seg, starts + seg * 2];
  const glyph = (cp: number) => {
    for (let s = 0; s < seg / 2; s++) {
      if (cp > b.readUInt16BE(ends + s * 2)) continue;
      const start = b.readUInt16BE(starts + s * 2);
      if (cp < start) return 0;
      const delta = b.readInt16BE(deltas + s * 2);
      const ro = b.readUInt16BE(ranges + s * 2);
      if (ro === 0) return (cp + delta) & 0xffff;
      const g = b.readUInt16BE(ranges + s * 2 + ro + (cp - start) * 2);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  return Array.from({ length: to - from + 1 }, (_, i) => Math.round((b.readUInt16BE(tables.hmtx + Math.min(glyph(from + i), metrics - 1) * 4) / upem) * 1000));
}

describe('the widths are the bundled faces own', () => {
  it('Literata Medium (the name) and Literata Italic (the signature), printable ASCII', () => {
    const dir = join(ROOT, 'packages', 'design-tokens', 'fonts');
    expect(ADVANCE.serifMedium).toEqual(fontWidths(join(dir, `${tokens.fontFamily.serifMedium}.ttf`)));
    expect(ADVANCE.serifItalic).toEqual(fontWidths(join(dir, `${tokens.fontFamily.serifItalic}.ttf`)));
  });
});

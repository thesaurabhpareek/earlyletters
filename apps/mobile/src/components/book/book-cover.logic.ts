/**
 * Pure parts of BookCover (EXPERIENCE_PASS 5.4): the journey's one object, a paper book with the
 * child's name on it. Sizes, the type on it, and how a name of any length is set: at most three
 * lines, ending in a fade when it does not fit, never an ellipsis glyph, never a changed word.
 * Tested in test/book-cover.test.ts; book-cover.tsx draws it.
 *
 * Line breaking is measured, not guessed: the widths below are the advance widths of the bundled
 * faces (packages/design-tokens/fonts/Literata-Medium.ttf and Literata-Italic.ttf), and the test
 * reads the font files and fails if they drift.
 */
import { asset, type BrandAsset } from '@scribe/brand/registry';
import { tokens, type ColorScheme } from '@scribe/design-tokens';

/** The four covers the spec draws, in points. */
export const COVER_SIZES = {
  /** First run, beside the heading (S05, S06). */
  sm: { width: 88, height: 116 },
  /** Add a child (S47) and the Export thumbnail (S43). */
  thumb: { width: 96, height: 128 },
  /** "The book is open." (S08). */
  md: { width: 132, height: 176 },
  /** The empty Book (S24). */
  lg: { width: 160, height: 214 },
} as const;

export type CoverSize = keyof typeof COVER_SIZES;
export type CoverState = 'closed' | 'open';

/**
 * The name on the closed cover is Literata Medium 17 pt on the smallest cover, and everything scales with the width.
 * A name sets itself like a book title: at the largest size, down to a floor, at which no word has to break (at the
 * spec's 17 pt, "Meenakshi" is 91 pt wide on a cover that leaves 74), then it wraps at spaces, then it fades.
 * The foot line asks for up to 14 pt there (the spec's 15 pt sets "From Mama" 84 pt wide) and fits itself down to
 * the 13 pt type floor before it fades.
 */
const BASE = { width: 88, name: 17, signature: 14 } as const;
/** The registry's small-cut symbol is drawn from 12 to 23 pt (BRAND_SYSTEM 3). */
const SYMBOL_MIN = 12;
const SYMBOL_MAX = 23;
export const NAME_LINES = 3;
export const FLYLEAF_NAME_LINES = 2;
/** Text is set inside this share of the measured width, for kerning and the platform's own rounding. */
const SAFETY = 0.97;
/** Twins: the second cover fans out behind the first (S05). */
export const FAN = { dx: 10, rotateDeg: 3 } as const;
/** Line height for a size on the cover. */
export const coverLineHeight = (size: number, italic = false) => Math.round(size * (italic ? 1.25 : 1.18));

export function coverMetrics(size: CoverSize) {
  const { width, height } = COVER_SIZES[size];
  const k = width / BASE.width;
  const pad = Math.round(7 * k);
  const floor = tokens.minFontSize;
  const nameSize = Math.round(BASE.name * k);
  // Any cover may set a long word down to the type floor before it breaks it.
  const nameMin = floor;
  const flyleafSize = Math.max(floor, Math.round(nameSize * 0.62));
  const signatureSize = Math.round(BASE.signature * k);
  const m = {
    width,
    height,
    pad,
    radius: tokens.radius.md,
    symbolHeight: Math.min(SYMBOL_MAX, Math.max(SYMBOL_MIN, Math.round(12 * k))),
    gap: Math.round(6 * k),
    /** The name: from `size` down to `min`, at most `lines` lines; `lineHeight` is the most it can need. */
    name: { size: nameSize, min: nameMin, lineHeight: coverLineHeight(nameSize), lines: NAME_LINES },
    flyleafName: { size: flyleafSize, min: floor, lineHeight: coverLineHeight(flyleafSize), lines: FLYLEAF_NAME_LINES },
    /** The foot line: the largest size from `size` down to `min` at which the signature fits one line. */
    signature: { size: signatureSize, min: Math.min(signatureSize, floor), lineHeight: coverLineHeight(signatureSize, true), inset: pad / 2 },
    /** Width the name may use. */
    textWidth: width - pad * 2,
  };
  return m;
}

/* ------------------------------------------------------------------ */
/* Measuring                                                           */
/* ------------------------------------------------------------------ */

export type CoverFace = 'serifMedium' | 'serifItalic';

/** Advance widths per 1000 em for U+0020 to U+007E, read from the bundled faces. */
export const ADVANCE: Record<CoverFace, readonly number[]> = {
  serifMedium: [
    201, 328, 401, 662, 577, 856, 817, 242, 343, 343, 451, 582, 327, 349, 330, 435, 595, 411, 523, 549, 570, 521, 557, 518, 564, 545, 330, 327, 582, 582, 582, 543, 876, 726, 667, 700,
    769, 636, 613, 754, 837, 409, 564, 761, 630, 994, 818, 763, 619, 766, 723, 601, 723, 791, 731, 1072, 718, 708, 658, 339, 435, 339, 581, 470, 500, 549, 622, 512, 629, 531, 394, 574,
    664, 340, 317, 621, 340, 971, 666, 597, 632, 615, 493, 464, 408, 644, 589, 859, 577, 577, 498, 375, 388, 375, 583,
  ],
  serifItalic: [
    190, 337, 403, 679, 499, 827, 730, 251, 328, 329, 475, 582, 331, 353, 320, 442, 573, 381, 516, 526, 555, 522, 538, 518, 533, 531, 321, 336, 582, 582, 582, 511, 861, 691, 616, 619,
    735, 592, 561, 642, 760, 359, 367, 688, 584, 932, 745, 715, 590, 704, 678, 499, 621, 749, 689, 1000, 687, 669, 613, 320, 412, 323, 582, 498, 498, 571, 566, 485, 573, 477, 382, 551,
    587, 298, 296, 548, 282, 876, 596, 539, 577, 541, 464, 441, 401, 593, 533, 786, 531, 537, 477, 364, 403, 364, 583,
  ],
};
/** Anything outside Latin (Devanagari falls back to Tiro, other scripts to the system) is measured wide, so it breaks early, never late. */
const WIDE = 680;

const COMBINING = /\p{M}/u;

/** User-perceived characters, so a break never splits a letter from its accent or a Devanagari matra. */
export function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'grapheme' }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment);
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    if (out.length && (COMBINING.test(ch) || ch === '‍')) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out;
}

function advanceOf(g: string, face: CoverFace): number {
  const base = g.normalize('NFD').replace(/\p{M}/gu, '');
  const cp = base.codePointAt(0) ?? 0;
  if (base.length === 1 && cp >= 32 && cp <= 126) return ADVANCE[face][cp - 32];
  return WIDE;
}

/** Width in points of `text` set in `face` at `size`. */
export function measure(text: string, size: number, face: CoverFace = 'serifMedium'): number {
  let units = 0;
  for (const g of graphemes(text)) units += advanceOf(g, face);
  return (units * size) / 1000;
}

/* ------------------------------------------------------------------ */
/* Setting a name                                                      */
/* ------------------------------------------------------------------ */

export type SetText = {
  /** What is drawn, line by line. Joined, it is the start of the name with nothing added or changed. */
  lines: string[];
  /** The name did not fit: the last line runs to the edge and fades. */
  truncated: boolean;
  /** The whole name, trimmed only for display: the accessible name, always complete. */
  full: string;
  /** A line that is drawn whole (not the fading last one) had to break inside a word. */
  broken: boolean;
};

/** A set name with the size it was set at. */
export type FittedText = SetText & { fontSize: number };

/** Trimmed, with runs of spaces shown as one ("trimmed only for display"). Never changes a letter. */
export function displayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Breaks a name into at most `maxLines` lines that fit `maxWidth`, at spaces where it can and between
 * letters when one word is wider than the cover. When it does not fit, the last line is filled to the
 * edge (it fades there), so a long name ends in a fade and never in an ellipsis glyph.
 */
export function setText(name: string, o: { size: number; maxWidth: number; maxLines: number; face?: CoverFace }): SetText {
  const full = displayName(name);
  const face = o.face ?? 'serifMedium';
  const max = o.maxWidth * SAFETY;
  const fits = (t: string) => measure(t, o.size, face) <= max;
  if (!full) return { lines: [], truncated: false, full, broken: false };

  const lines: string[] = [];
  /** Indexes of lines that end inside a word. */
  const midWord = new Set<number>();
  let cur = '';
  for (const word of full.split(' ')) {
    const candidate = cur ? `${cur} ${word}` : word;
    if (fits(candidate)) {
      cur = candidate;
      continue;
    }
    if (cur) lines.push(cur);
    cur = '';
    if (fits(word)) {
      cur = word;
      continue;
    }
    for (const g of graphemes(word)) {
      if (cur && !fits(cur + g)) {
        midWord.add(lines.length);
        lines.push(cur);
        cur = '';
      }
      cur += g;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= o.maxLines) return { lines, truncated: false, full, broken: midWord.size > 0 };

  // Too long: keep the first lines, then run the last one to the edge so the fade sits on real letters.
  const kept = lines.slice(0, o.maxLines - 1);
  const rest = lines.slice(o.maxLines - 1).join(' ');
  let last = '';
  for (const g of graphemes(rest)) {
    if (last && !fits(last + g)) break;
    last += g;
  }
  return { lines: [...kept, last.trimEnd()], truncated: true, full, broken: [...midWord].some((i) => i < kept.length) };
}

/** The largest size from `size` down to `min` whose setting `accept`s; the `min` setting otherwise. */
function fit(text: string, o: { size: number; min: number; maxWidth: number; maxLines: number; face: CoverFace }, accept: (s: SetText) => boolean): FittedText {
  for (let s = o.size; s > o.min; s--) {
    const set = setText(text, { ...o, size: s });
    if (accept(set)) return { ...set, fontSize: s };
  }
  return { ...setText(text, { ...o, size: o.min }), fontSize: o.min };
}

/**
 * The name on a cover of this size and state (three lines closed, two on the flyleaf), set like a book title: the
 * largest size, down to the cover's floor, at which no drawn word breaks; then it wraps at spaces and, if it is still
 * too long, fades. Only a single word longer than the cover at its floor ever breaks between letters.
 */
export function coverName(name: string, size: CoverSize, state: CoverState = 'closed'): FittedText {
  const m = coverMetrics(size);
  const t = state === 'open' ? m.flyleafName : m.name;
  return fit(name, { size: t.size, min: t.min, maxWidth: m.textWidth, maxLines: t.lines, face: 'serifMedium' }, (s) => !s.broken);
}

/**
 * "From Mama" on the foot line: one line, at the largest size that fits (never under the 13 pt floor), fading if it
 * is still too long. `signature` is the filled "From {signsAs}" string.
 */
export function coverSignature(signature: string, size: CoverSize): FittedText {
  const m = coverMetrics(size);
  return fit(signature, { size: m.signature.size, min: m.signature.min, maxWidth: m.width - m.signature.inset * 2, maxLines: 1, face: 'serifItalic' }, (s) => !s.truncated);
}

/* ------------------------------------------------------------------ */
/* The book mark at the head                                           */
/* ------------------------------------------------------------------ */

/** Copied from logo/primary/symbol-small.svg (same geometry in symbol-small-reversed.svg); the test checks it against the file. */
export const SMALL_SYMBOL_VIEWBOX = '-44.65 -44.65 1205.46 1089.29';
export const SMALL_SYMBOL_PATH =
  'M5.65 632.88C30.17 506.72 161.82 250.57 420.08 69.73C450.95 48.12 482.91 28.08 515.83 9.71C528.54 2.62 538.12 -2.4 549.18 1.19C555.66 3.3 567.49 9.94 609.58 92.55C651.68 175.17 650.1 188.65 647.99 195.13C644.29 206.51 633.81 212.24 622.44 218.93C597.6 233.56 573.69 249.72 550.86 267.34C481.9 320.54 467.2 352.69 468.42 384.03C472.23 481.52 628.69 532.76 615.89 713.49C607.81 827.66 536.79 928.31 431.93 974.19C327.07 1020.08 204.96 1003.95 115.61 932.41C26.26 860.87 -16.19 745.24 5.65 632.88ZM721.53 787.66C720.09 705.42 768.42 527.55 906.03 379.98C922.49 362.34 939.83 345.54 957.99 329.66C965 323.53 970.33 319.11 977.73 319.89C982.07 320.35 990.36 322.93 1027.7 369.05C1065.05 415.17 1065.85 423.81 1065.4 428.15C1064.59 435.77 1058.79 440.75 1052.57 446.45C1038.96 458.91 1026.14 472.21 1014.2 486.28C978.11 528.76 973.18 550.84 978.12 570.3C993.47 630.82 1098.24 642.08 1114.28 756.92C1124.41 829.47 1093.34 901.93 1033.81 944.6C974.27 987.28 895.67 993.43 830.22 960.54C764.77 927.64 722.81 860.9 721.53 787.66Z';
const [, , VB_W, VB_H] = SMALL_SYMBOL_VIEWBOX.split(' ').map(Number);
export const SMALL_SYMBOL_ASPECT = VB_W / VB_H;

/**
 * The small-cut symbol for the surface, by registry id (BRAND_SYSTEM 2: resolve, never pick a file). It is a book
 * mark here, the use BRAND_SYSTEM allows on book surfaces (book.cover.emboss, book.spine), drawn in the asset's own
 * one colour: ink on paper, reversed on dark.
 */
export function coverMark(scheme: ColorScheme): BrandAsset {
  return asset(scheme === 'dark' ? 'logo.symbol.small.reversed' : 'logo.symbol.small.ink');
}

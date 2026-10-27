/**
 * The line drawings as data (CREATIVE 3, DESIGN_LANGUAGE 9, EXPERIENCE_PASS 5.4): original single-weight
 * lines with round caps, no faces, no mascot, no sparkle. Pure, so tests read it directly; line-art.tsx
 * draws it.
 *
 * Every drawing is a stroke table: each stroke is a path, its length, and the share of the draw it
 * takes (`from` to `to`, 0 to 1 of tokens.motion.drawMs), in the order a hand would draw it. Lengths are
 * SVGGeometryElement.getTotalLength() in Chromium, rounded up, measured offline.
 *
 *   envelope       closed letter: errors, the 404 until P6 moves it to the window
 *   envelopeOpen   a letter with its page out: first run, first letter
 *   moon           night: Review waiting, Read together's end and empty state (the website's crescent)
 *   page           one written line and a signature: empty Book, empty month, not found
 *   together       one open book, two pens, each writing on its own page: co-parent sharing
 *   lamp           a bedside lamp on a small table (website, in-house; reserved)
 *   window         a night window with a curtain and the crescent (website, in-house; the 404)
 *   readingLamp    a reading lamp with a pull chain (website, in-house; reserved for an empty Read together)
 *
 * The website drawings (apps/web/src/components/drawings on main) are company-owned and made in-house:
 * no attribution duty.
 */

export type Stroke = { readonly d: string; readonly length: number; readonly from: number; readonly to: number };
export type LineArtSpec = {
  /** min-x, min-y, width, height, in the drawing's own units. */
  readonly viewBox: readonly [number, number, number, number];
  /** One accentSoft circle behind the object. */
  readonly wash: { readonly cx: number; readonly cy: number; readonly r: number };
  readonly strokes: readonly Stroke[];
};

/** A single path drawn over the whole draw. */
const one = (d: string, length: number): readonly Stroke[] => [{ d, length, from: 0, to: 1 }];
/** The app's own drawings share one 4:3 box. */
const BOX = [0, 0, 160, 120] as const;
/** The website drawings keep their own boxes, with a little room so round caps at the edge never clip. */
const roomy = (w: number, h: number) => [-4, -4, w + 8, h + 8] as const;

export const LINE_ART = {
  envelope: {
    viewBox: BOX,
    wash: { cx: 80, cy: 64, r: 46 },
    strokes: one('M36 28 H124 Q130 28 130 34 V94 Q130 100 124 100 H36 Q30 100 30 94 V34 Q30 28 36 28 Z M34 32 L80 66 L126 32 M34 96 L67 70 M126 96 L93 70', 534),
  },
  envelopeOpen: {
    viewBox: BOX,
    wash: { cx: 80, cy: 62, r: 48 },
    strokes: one(
      'M42 59.7 V18 Q42 12 48 12 H112 Q118 12 118 18 V59.7 M56 30 Q63 26 70 30 T84 30 T98 30 M56 42 Q61 39 66 42 T76 42 M30 52 V98 Q30 104 36 104 H124 Q130 104 130 98 V52 M30 52 L80 84 L130 52',
      551,
    ),
  },
  /** The website's crescent (one continuous line), centred in a 4:3 box the size of the old moon. */
  moon: {
    viewBox: [-10, 0, 80, 60],
    wash: { cx: 30, cy: 30, r: 23 },
    strokes: one('M 28.9 10 A 20 20 0 1 1 14.7 42.9 A 17.9 17.9 0 0 0 29.2 9.8', 139),
  },
  page: {
    viewBox: BOX,
    wash: { cx: 80, cy: 60, r: 46 },
    strokes: one('M52 14 H108 Q114 14 114 20 V100 Q114 106 108 106 H52 Q46 106 46 100 V20 Q46 14 52 14 Z M58 38 Q65 34 72 38 T86 38 T100 38 M84 86 Q89 82 94 86 T104 86', 378),
  },
  together: {
    viewBox: BOX,
    wash: { cx: 80, cy: 70, r: 46 },
    strokes: one(
      'M80 52 C70 46 54 44 34 48 V96 C54 92 70 94 80 100 C90 94 106 92 126 96 V48 C106 44 90 46 80 52 V100 M42 62 Q45.0 59.8 48 62 T54 62 T60 62 M42 72 Q45.5 69.8 49 72 T56 72 M42 85 Q45.0 82.8 48 85 T54 85 M60.0 86.0 L64.1 79.7 L70.5 50.6 Q68.7 46.9 65.5 49.4 L59.0 78.6 Z M59.0 78.6 L64.1 79.7 M96 62 Q99.0 59.8 102 62 T108 62 T114 62 M96 72 Q98.75 69.8 101.5 72 T107.0 72 M96 85 Q99.0 82.8 102 85 T108 85 M114.0 86.0 L118.1 79.7 L124.5 50.6 Q122.7 46.9 119.5 49.4 L113.0 78.6 Z M113.0 78.6 L118.1 79.7',
      597,
    ),
  },
  /** Website Lamp.tsx: drum shade, stem, jar base, table, legs, pull cord and bead. viewBox 160 x 240. */
  lamp: {
    viewBox: roomy(160, 240),
    wash: { cx: 80, cy: 82, r: 52 },
    strokes: [
      { d: 'M 56.2 46.4 C 49.4 66 43 86 35.6 106.6 C 50 115.4 110 115.4 124.6 106.4 C 117.4 86 110.8 66 104 46.2 C 97.6 50.8 62.6 50.8 56.4 46.6 C 62.4 41.6 97.6 41.4 104.4 46', length: 316, from: 0, to: 0.42 },
      { d: 'M 80 114.6 C 80.3 120 79.8 126 80.1 131.4', length: 17, from: 0.38, to: 0.48 },
      { d: 'M 72.4 131.6 C 72.2 138.2 58.6 142.4 57.4 160 C 56.2 180.4 66.4 194.2 80.2 194.2 C 94 194.2 104.2 180 103 160 C 101.8 142.4 88 138.2 88 131.4 C 82.6 130.8 77.6 131 72.8 131.4', length: 174, from: 0.45, to: 0.78 },
      { d: 'M 154.6 195 C 104 194.4 52 196.2 4.4 195.4 C 3.2 197.6 3.6 200.4 5.8 202.2 C 54 202.6 104 201.4 153.8 202.4', length: 306, from: 0.55, to: 0.88 },
      { d: 'M 16.2 202.6 C 16.6 216 15.8 228 16.6 240', length: 38, from: 0.78, to: 0.94 },
      { d: 'M 143.6 202.4 C 143.2 216 144 228 143.4 240', length: 38, from: 0.8, to: 0.96 },
      { d: 'M 111.6 112.4 C 112 120 111.4 128 111.8 135.6', length: 24, from: 0.86, to: 0.97 },
      { d: 'M 111.8 136 C 114.6 136 115 140.6 111.9 140.8 C 108.8 141 108.8 136.2 111.6 136.1', length: 15, from: 0.93, to: 1 },
    ],
  },
  /** Website Window.tsx: frame, sill, mullion and rail, curtain rod, curtain and tie-back, then the moon. viewBox 240 x 300. */
  window: {
    viewBox: roomy(240, 300),
    wash: { cx: 120, cy: 142, r: 76 },
    strokes: [
      { d: 'M 44 252 C 42.5 180.7 43.2 109.3 43.2 38 C 43.1 33.5 45 31.2 49 31.1 C 96.5 31.5 144 30.9 191.5 30.4 C 195.6 30.4 197.6 32.6 197.6 37 C 196.6 108.5 196.8 180.1 197.1 251.6', length: 592, from: 0, to: 0.4 },
      { d: 'M 28.5 253.8 C 89.2 252.7 149.8 252.7 210.5 252.4 C 213.4 252.4 214.4 254.2 214 256.2 C 213.6 258.2 212.2 259 209.6 259 C 150.7 258.7 91.9 259.3 33 259.9', length: 371, from: 0.3, to: 0.55 },
      { d: 'M 120.6 31.8 C 119.7 105.3 119.8 178.9 120.1 252.4', length: 221, from: 0.4, to: 0.6 },
      { d: 'M 43.6 143 C 94.9 142.2 146.1 141.7 197.4 141.8', length: 154, from: 0.48, to: 0.68 },
      { d: 'M 18 17.6 C 86.2 17.6 154.3 17.2 222.5 16.4', length: 205, from: 0.55, to: 0.72 },
      { d: 'M 76 18.6 C 70 64 50 118 41.5 168.5 C 40.6 174 43 178.2 47.6 182 C 53.4 214 59 252 61 296', length: 285, from: 0.62, to: 0.9 },
      { d: 'M 22.6 18.4 C 25.5 72 22 132 29.2 171 C 27.6 210 23.4 256 22 296', length: 279, from: 0.66, to: 0.92 },
      { d: 'M 27.4 170.4 C 32.6 176.6 41 177.8 48.4 172.6', length: 24, from: 0.85, to: 0.95 },
      { d: 'M 163.9 67 A 17 17 0 1 1 152 95 A 15.2 15.2 0 0 0 164.2 66.8', length: 118, from: 0.88, to: 1 },
    ],
  },
  /** Website ReadingLamp.tsx: shade, stem, base, then the little chain. viewBox 120 x 190. */
  readingLamp: {
    viewBox: roomy(120, 190),
    wash: { cx: 60, cy: 62, r: 40 },
    strokes: [
      { d: 'M38.6 30.9 C47.2 26.5 73.8 26.1 82.3 30.3 C74.1 35.1 47.4 35.4 38.6 30.9 C31.2 47.3 22.7 66.1 16.3 82.7 C31.4 91.9 89.6 92.2 104.1 82.1 C97.8 65.7 89.5 47.4 82.3 30.3', length: 292, from: 0, to: 0.48 },
      { d: 'M60.3 90.4 C60.9 112.2 59.4 141.6 60.4 170.2', length: 80, from: 0.42, to: 0.66 },
      { d: 'M35.6 178.6 C37.4 168.4 82.7 167.9 84.8 178.1 C70.1 180.2 49.6 180.4 35.6 178.6', length: 104, from: 0.6, to: 0.88 },
      { d: 'M75.8 88.6 C76.1 94.2 75.7 99.3 76.2 104.1 M76.3 104.4 C73.4 104.6 73.5 109.6 76.4 109.5 C79.3 109.4 79.1 104.3 76.3 104.4', length: 31, from: 0.84, to: 1 },
    ],
  },
} as const satisfies Record<string, LineArtSpec>;

export type LineArtName = keyof typeof LINE_ART;
export const LINE_ART_NAMES = Object.keys(LINE_ART) as LineArtName[];

/** Height for a drawing at a given width (its own box's aspect). */
export function artHeight(name: LineArtName, width: number): number {
  const [, , w, h] = LINE_ART[name].viewBox;
  return (width * h) / w;
}

/** Pen width in the drawing's own units, so the line is the same 1.75 pt on screen at any drawing size. */
export function penWidth(name: LineArtName, width: number, pt = 1.75): number {
  return pt * (LINE_ART[name].viewBox[2] / width);
}

/** How far one stroke has drawn when the whole drawing is at `t` (0 to 1): 0 before its window, 1 after. */
export function strokeProgress(stroke: Pick<Stroke, 'from' | 'to'>, t: number): number {
  'worklet';
  if (t <= stroke.from) return 0;
  if (t >= stroke.to) return 1;
  return (t - stroke.from) / (stroke.to - stroke.from);
}

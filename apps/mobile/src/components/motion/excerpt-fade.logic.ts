/**
 * Pure parts of ExcerptFade (EXPERIENCE_PASS S26, 5.6; book-page.md 2 and 3, BL-659, BL-660): a person's words shown
 * in a few lines end in a fade, never an ellipsis glyph, and the stored words are never cut (the whole text stays in
 * the element, so VoiceOver reads all of it).
 *
 * How the last line ends is one seam, EXCERPT_ENDING (BL-659):
 * - 'word' (the pick for 1 Dec, BL-659 option b): the fade covers only the last whole word on the last visible line,
 *   measured from the platform's own line breaks (Text onTextLayout), so the excerpt never seems to stop inside a
 *   word. The lines shown are the letter's first lines as the platform wraps them, a prefix of the letter, so they
 *   wrap exactly like the page's opening and the card-to-page column contract holds.
 * - 'line' (build 1): the last 40 percent of the final line, wherever that lands. Also the fallback while the
 *   lines are not known yet (the first frame, or a platform without onTextLayout, such as the web build).
 * Tested in test/transitions.test.ts and test/book-page.test.ts.
 */
import { tokens, type TypeToken } from '@scribe/design-tokens';

/** How an excerpt's last visible line ends (BL-659): over its last whole word, or over the last 40 percent. */
export type ExcerptEnding = 'word' | 'line';

/**
 * BL-659's pick, in one place. 'word' is option (b), the recommended one (book-page.md 2: "ending on a whole word,
 * the fade covering only that last word"). Set 'line' to go back to build 1's fade everywhere.
 */
export const EXCERPT_ENDING: ExcerptEnding = 'word';

/** The 'line' ending (and the fallback before the lines are known): the last 40 percent of the final visible line. */
export const FADE_FRACTION = 0.4;

/**
 * Line height on screen for a ramp token: Dynamic Type scales it, up to the token's cap and down too (iOS xSmall,
 * Small and Medium reach React Native as fontScale 0.823, 0.882 and 0.941, and the words render that much smaller);
 * Reading Size multiplies it. A floor at 1 here would clip a smaller text partway through its next line.
 */
export function lineHeightFor(variant: TypeToken, fontScale = 1, scale = 1): number {
  const t = tokens.type[variant];
  const dyn = t.maxScale === null ? fontScale : Math.min(fontScale, t.maxScale);
  return t.lineHeight * dyn * scale;
}

/** The text runs past its lines (with half a point of slack for the platform's rounding). */
export function overflows(contentHeight: number, lines: number, lineHeight: number): boolean {
  return contentHeight > lines * lineHeight + 0.5;
}

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/u;
const STRONG_LTR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿऀ-ॿ]/u;

/** Right to left when the first strongly directional letter is Hebrew or Arabic, so the fade sits where the line ends. */
export function isRtl(text: string): boolean {
  for (const ch of text) {
    if (RTL.test(ch)) return true;
    if (STRONG_LTR.test(ch)) return false;
  }
  return false;
}

/** Where the fade sits on the last line: the end of the line, a share of its width. */
export function fadeBox(lines: number, lineHeight: number, rtl: boolean) {
  return { top: (lines - 1) * lineHeight, height: lineHeight, widthPct: FADE_FRACTION * 100, side: rtl ? ('left' as const) : ('right' as const) };
}

/** One laid-out line of text as Text onTextLayout reports it (points, in the text's own box). */
export interface TextLine {
  text: string;
  x: number;
  width: number;
}

/** Where the fade sits across the last visible line, in points from the text box's left edge. */
export interface FadeSpan {
  left: number;
  width: number;
}

/**
 * The tail of a line that the word ending fades: its last whole word and any space the line carries after it (iOS
 * reports a line's trailing space in its text; fading a space too is harmless, missing a letter is not). Null for a
 * line with no word on it.
 */
export function lastWordTail(lineText: string): string | null {
  const m = /\S+\s*$/u.exec(lineText);
  return m ? m[0] : null;
}

/**
 * The words shown on the first `lines` lines, joined as laid out: always a prefix of the text (the platform breaks
 * lines without changing a character), which is why the page's opening wraps the same way.
 */
export function visiblePrefix(lines: readonly Pick<TextLine, 'text'>[], count: number): string {
  return lines
    .slice(0, count)
    .map((l) => l.text)
    .join('');
}

/**
 * True when the visible lines stop at the end of a word: the next character of the text is a space, or there is none.
 * False only when a single word is longer than a whole line and the platform had to break inside it.
 */
export function endsOnWholeWord(text: string, prefix: string): boolean {
  if (!text.startsWith(prefix)) return false;
  if (prefix.length >= text.length) return true;
  return /\s$/u.test(prefix) || /^\s/u.test(text.slice(prefix.length));
}

/**
 * The fade over the last whole word of the last visible line, given the tail's measured width: it ends where the
 * line ends (the right edge, or the left for right-to-left text) and never spans more than the line itself.
 */
export function wordFadeSpan(line: Pick<TextLine, 'x' | 'width'>, tailWidth: number, rtl: boolean): FadeSpan {
  const width = Math.max(0, Math.min(tailWidth, line.width));
  return rtl ? { left: line.x, width } : { left: line.x + line.width - width, width };
}

/**
 * The span the fade takes on the last visible line: over its last whole word when the ending is 'word' and the
 * lines and the tail are measured, otherwise the last 40 percent of the box (the 'line' ending, and the fallback).
 */
export function fadeSpanFor(o: {
  ending: ExcerptEnding;
  lines: readonly TextLine[] | null;
  visible: number;
  tailWidth: number | null;
  boxWidth: number;
  rtl: boolean;
}): FadeSpan {
  const line = o.lines && o.lines.length > o.visible - 1 ? o.lines[o.visible - 1] : undefined;
  if (o.ending === 'word' && line && o.tailWidth !== null && o.tailWidth > 0) return wordFadeSpan(line, o.tailWidth, o.rtl);
  const width = o.boxWidth * FADE_FRACTION;
  return { left: o.rtl ? 0 : o.boxWidth - width, width };
}

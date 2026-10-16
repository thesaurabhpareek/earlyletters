/**
 * Pure parts of ExcerptFade (EXPERIENCE_PASS S26, 5.6): a person's words shown in a few lines end in a
 * fade over the last 40 percent of the final line, never an ellipsis glyph, and the stored words are
 * never cut (the whole text stays in the element, so VoiceOver reads all of it). Tested in
 * test/motion-primitives.test.ts.
 */
import { tokens, type TypeToken } from '@scribe/design-tokens';

/** The fade covers the last 40 percent of the final visible line. */
export const FADE_FRACTION = 0.4;

/** Line height on screen for a ramp token: Dynamic Type scales it up to the token's cap; Reading Size multiplies it. */
export function lineHeightFor(variant: TypeToken, fontScale = 1, scale = 1): number {
  const t = tokens.type[variant];
  const dyn = t.maxScale === null ? fontScale : Math.min(fontScale, t.maxScale);
  return t.lineHeight * Math.max(1, dyn) * scale;
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

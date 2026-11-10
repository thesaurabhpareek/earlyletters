/**
 * Figure trim for a ramp style (Text `trim="figures"`, COMPONENTS 2.3): the margins that pull a line box in to the
 * ink of its lining figures, top of the tallest figure to the baseline, and its left edge to the first figure's ink.
 * CSS calls the vertical half text-box-trim (cap to alphabetic). Used by the Book's month numeral, so "THIS MONTH",
 * "18" and "1 letter · From Mama" stand on one left edge and the spacing scale sets the gaps between them, not the
 * face's tall ascender.
 *
 * It holds where the line is at least as tall as the face: iOS (React Native's baseline offset) and the web (CSS
 * half-leading) then both centre the face's ascent and descent in the line. tokens test/fonts.test.ts holds the
 * numeral to that. Pure, tested in test/text-trim.test.ts.
 */
import { tokens, type TypeToken } from '@scribe/design-tokens';

export interface FigureTrim {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Rendered size: Dynamic Type up to the style's cap (and down for the small settings), as React Native draws it. */
export function renderedScale(variant: TypeToken, fontScale = 1): number {
  const cap = tokens.type[variant].maxScale;
  return cap === null ? fontScale : Math.min(fontScale, cap);
}

/** Null for a style whose face has no measured metrics, or whose line is shorter than the face (no stable baseline). */
export function figureTrim(variant: TypeToken, fontScale = 1): FigureTrim | null {
  const t = tokens.type[variant];
  const m = tokens.fontMetrics[t.fontFamily];
  if (!m) return null;
  const k = renderedScale(variant, fontScale);
  const size = t.fontSize * k;
  const line = t.lineHeight * k;
  const face = (m.ascent + m.descent) * size;
  if (line < face) return null;
  const baseline = (line - face) / 2 + m.ascent * size;
  return {
    marginTop: round(-(baseline - m.figureHeight * size)),
    marginBottom: round(-(line - baseline)),
    marginLeft: round(-m.figureBearing * size),
  };
}

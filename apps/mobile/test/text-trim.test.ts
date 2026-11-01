/**
 * The Book's month opener type (TestFlight build 1, Book tab, dark: "18 is merging. Font alignment can be cleaner").
 * The figure trim pulls the numeral's line box in to its ink at every Dynamic Type size, so the spacing scale sets
 * the gaps around it and its left edge meets the kicker's. The screens draw with React Native, which Node cannot
 * load, so the opener's use of it is checked in its source; the look is in the device pass.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { figureTrim, renderedScale } from '../src/components/ui/text-trim.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/** Dynamic Type from xSmall to AX5, as React Native reports it on iOS. */
const SCALES = [0.823, 0.882, 0.941, 1, 1.118, 1.235, 1.353, 1.786, 2.143, 2.643, 3.143, 3.571];

describe('figureTrim (the numeral)', () => {
  const t = tokens.type.numeral;
  const m = tokens.fontMetrics[t.fontFamily]!;

  it('leaves exactly the figures: box height is the figure height at the rendered size', () => {
    for (const s of SCALES) {
      const trim = figureTrim('numeral', s)!;
      const k = renderedScale('numeral', s);
      const box = t.lineHeight * k + trim.marginTop + trim.marginBottom;
      expect(box, String(s)).toBeCloseTo(m.figureHeight * t.fontSize * k, 1);
    }
  });

  it('follows the cap: at AX5 the numeral is trimmed as at 1.4x, never as at 3.6x', () => {
    expect(renderedScale('numeral', 3.571)).toBe(t.maxScale);
    expect(figureTrim('numeral', 3.571)).toEqual(figureTrim('numeral', t.maxScale!));
  });

  it('centres the face in the line, as iOS and CSS do: the leading above the ascent equals the leading below the descent', () => {
    // The box-height test above holds for any baseline; this one fails if the baseline is not centred (for example
    // figures on the line's floor, as iOS draws a line shorter than the face).
    for (const s of SCALES) {
      const trim = figureTrim('numeral', s)!;
      const size = t.fontSize * renderedScale('numeral', s);
      const above = -trim.marginTop - (m.ascent - m.figureHeight) * size;
      const below = -trim.marginBottom - m.descent * size;
      expect(above, String(s)).toBeGreaterThan(0);
      expect(Math.abs(above - below), String(s)).toBeLessThan(0.02);
    }
  });

  it('at the default size: 29.6 pt off the top, 20.19 off the bottom, and the side bearing off the left', () => {
    const trim = figureTrim('numeral', 1)!;
    // 96 pt line, 95.04 pt face: 0.48 pt of leading each side, baseline at 0.48 + 75.33 = 75.81 pt.
    expect(trim.marginTop).toBeCloseTo(-29.6, 2);
    expect(trim.marginBottom).toBeCloseTo(-20.19, 2);
    expect(trim.marginLeft).toBeCloseTo(-m.figureBearing * t.fontSize, 2);
    // A small optical correction, never a layout shift: under 3 pt even at the cap.
    expect(Math.abs(figureTrim('numeral', 3.571)!.marginLeft)).toBeLessThan(3);
  });

  it('no trim for a style whose face has no measured metrics', () => {
    expect(figureTrim('body', 1)).toBeNull();
    expect(figureTrim('letterBody', 1)).toBeNull();
  });
});

describe('MonthOpener uses the trim and the card column', () => {
  const src = read('components/book/month-opener.tsx');
  it('the numeral is trimmed to its figures', () => {
    expect(src).toMatch(/<Text variant="numeral" trim="figures">/);
  });
  it('no hand-typed sizes: the lit card and the hairline take theirs from tokens and the letter card column', () => {
    expect(src).not.toMatch(/padding: \d/);
    expect(src).not.toMatch(/marginBottom: \d/);
    expect(src).toMatch(/LIT_PAD_X = CARD_TEXT_INSET - GUTTER - LIT_EDGE/);
  });
  it('the lit card words start where a letter card\'s words start', () => {
    const CARD_TEXT_INSET = 36;
    expect(read('components/book/letter-card.tsx')).toMatch(new RegExp(`CARD_TEXT_INSET = ${CARD_TEXT_INSET};`));
    // The card's words: the gutter plus a card's padding (space 5 + space 4).
    expect(CARD_TEXT_INSET).toBe(tokens.space[5] + tokens.space[4]);
  });
});

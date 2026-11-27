import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { CoverBand } from '@/components/book/cover-band';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

// Native SVG stood in: the band's light and the two glyphs it draws.
vi.mock('react-native-svg', () => ({ default: () => null, Defs: () => null, RadialGradient: () => null, Rect: () => null, Stop: () => null }));
vi.mock('phosphor-react-native/src/icons/BookOpenText', () => ({ BookOpenTextIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/DotsThree', () => ({ DotsThreeIcon: () => null }));
// The letter card pulls in the player; the band needs only its text inset (36 pt, letter-card.tsx).
vi.mock('@/components/book/letter-card', () => ({ CARD_TEXT_INSET: 36 }));
vi.mock('@/components/book/book-page.logic', () => ({ LIT_BAND_STRENGTH: 0.35, LIT_EDGE_ALPHA: 0.4 }));

/**
 * [BL-938] [NS-22] The Book header in one fixed order, rendered (static markup through react-native-web; BL-278 harness).
 * Proves the order of the controls in the tree (which is VoiceOver's order), their 44 pt targets and the empty-book
 * header. It does NOT prove focus, the AX5 wrap on screen or the fold; those stay on the device plan (NS-22-R1, R5).
 * Fictional family Asha only.
 */
const AX5 = 3.12;
const noop = () => {};
const full = {
  title: "Asha's book",
  age: '18 months',
  switcher: <span data-testid="book.switcher">For Asha</span>,
  readTogether: { label: 'Read together', hint: 'Reads Asha her letters.', onPress: noop },
  lens: <span data-testid="book.lens">Months Photos</span>,
  months: { label: 'Go to a month', hint: 'Shows the months that have letters.', onPress: noop },
  more: { label: 'More for this book', hint: 'Quiet or hide this book.', onPress: noop },
};
const ORDER = ['book.title', 'book.age', 'book.switcher', 'book.readTogether', 'book.lens', 'book.months', 'book.more'];
const at = (html: string, id: string) => html.indexOf(`data-testid="${id}"`);

beforeEach(() => {
  harness.fontScale = 1;
});

describe('[BL-938] the Book header, rendered', () => {
  for (const [name, scale] of [['the default size', 1], ['AX5', AX5]] as const) {
    it(`[NS-22-R2] header controls at AX5: the fixed order holds at ${name}, and no gear`, () => {
      harness.fontScale = scale;
      const html = renderMarkup(<CoverBand {...full} />);
      const where = ORDER.map((id) => at(html, id));
      for (const [i, id] of ORDER.entries()) expect(where[i], id).toBeGreaterThan(-1);
      expect(where).toEqual([...where].sort((a, b) => a - b));
      expect(html).not.toContain('book.settings');
      expect(html).not.toContain('Settings');
    });
  }

  it('[NS-22-R2] every header control is 44 pt or more at AX5', () => {
    harness.fontScale = AX5;
    const html = renderMarkup(<CoverBand {...full} />);
    const tag = (id: string) => html.slice(html.lastIndexOf('<', at(html, id)), html.indexOf('>', at(html, id)));
    // Button small and IconButton both write their 44 pt target as an inline style.
    expect(tag('book.months')).toMatch(/min-height:\s*44px/);
    expect(tag('book.more')).toMatch(/height:\s*44px/);
    expect(tag('book.more')).toMatch(/width:\s*44px/);
    expect(tag('book.readTogether')).toMatch(/min-height:\s*(4[89]|[5-9]\d)px/);
  });

  it('[NS-22-R3] the end control is named More for this book, with or without a hint', () => {
    // react-native-web drops accessibilityHint, so the hint wiring is pinned in book-header-calm.test.ts.
    const tag = (html: string) => html.slice(html.lastIndexOf('<', at(html, 'book.more')), html.indexOf('>', at(html, 'book.more')));
    expect(tag(renderMarkup(<CoverBand {...full} />))).toContain('aria-label="More for this book"');
    const one = tag(renderMarkup(<CoverBand {...full} more={{ label: 'More for this book', onPress: noop }} />));
    expect(one).toContain('aria-label="More for this book"');
  });

  it('[NS-22-R4] empty book header: no Read together, lens or Go to a month drawn; the title, age and More stay', () => {
    for (const scale of [1, AX5]) {
      harness.fontScale = scale;
      const html = renderMarkup(<CoverBand title="Asha's book" age="18 months" readTogether={null} lens={null} months={null} more={full.more} />);
      for (const id of ['book.readTogether', 'book.lens', 'book.months']) expect(html).not.toContain(`data-testid="${id}"`);
      for (const id of ['book.title', 'book.age', 'book.more']) expect(html).toContain(`data-testid="${id}"`);
    }
  });
});

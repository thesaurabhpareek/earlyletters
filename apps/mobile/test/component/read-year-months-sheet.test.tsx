import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import type { Entry } from '@/lib/store';
import { MonthsSheet } from '@/components/book/months-sheet';
import { yearRows } from '@/components/book/read-year.logic';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

// The sheet is a native bottom sheet; its own code is not under test here, only the rows MonthsSheet puts in it.
vi.mock('@/components/ui/sheet', () => ({ Sheet: ({ children, title }: any) => React.createElement('section', { 'aria-label': title }, children) }));
vi.mock('@gorhom/bottom-sheet', () => ({ BottomSheetScrollView: ({ children }: any) => React.createElement('div', null, children) }));

/**
 * [BL-1653] [NS-24] Read the year back, rendered (static markup through react-native-web; BL-278 harness). Proves the
 * rows exist, their order, and the name a screen reader gets for each. It does NOT prove VoiceOver focus order or
 * speech; those stay on the device plan (docs/qa/DEVICE_TEST_PLAN.md). Fictional family Asha only.
 */
const L = (id: string, occurredOn: string): Entry => ({ id, kind: 'letter', occurredOn, inBook: true, transcriptStatus: 'ready' }) as unknown as Entry;
const asha = { name: 'Asha', birthday: '2021-03-10' };
const today = '2026-11-22';
// One letter in each of Before You and years 1 to 4, so every keyed label is drawn.
const entries = [L('a', '2021-01-05'), L('b', '2021-06-01'), L('c', '2022-06-01'), L('d', '2023-06-01'), L('e', '2024-06-01')];

beforeEach(() => {
  harness.fontScale = 1;
});

const draw = (years = yearRows(entries, asha, today)) =>
  renderMarkup(<MonthsSheet open rows={[]} onClose={() => {}} onChoose={() => {}} years={years} onChooseYear={() => {}} />);
const at = (html: string, needle: string) => {
  const i = html.indexOf(needle);
  expect(i, needle).toBeGreaterThanOrEqual(0);
  return i;
};

describe('[BL-1653] [NS-24-R4] the year rows in Go to a month, rendered', () => {
  it('draws the section heading, then one row per year that has letters, with its test id', () => {
    const html = draw();
    expect(html).toContain('Read a year together');
    for (const k of ['before', 'y1', 'y2', 'y3', 'y4']) expect(html).toContain(`data-testid="book.year.${k}"`);
    expect(html).not.toContain('book.year.y5');
    expect(at(html, 'Read a year together')).toBeLessThan(at(html, 'book.year.y4'));
  });

  it('lists newest first, Before You last (the order is the build as it stands; the design is silent, BL-1653)', () => {
    const html = draw();
    const order = ['y4', 'y3', 'y2', 'y1', 'before'].map((k) => at(html, `data-testid="book.year.${k}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('gives each row the name a screen reader reads: the year, a comma, then its dates; Before You has no dates', () => {
    const html = draw();
    expect(html).toContain('aria-label="Asha&#x27;s second year, March 10 to March 9"');
    expect(html).toContain('aria-label="Asha&#x27;s third year, March 10 to March 9"');
    expect(html).toContain('aria-label="Asha&#x27;s fourth year, March 10 to March 9"');
    expect(html).toContain('aria-label="Asha&#x27;s first year, March 10 to March 9"');
    expect(html).toMatch(/aria-label="Before You[^"]*"/);
    expect(html).not.toMatch(/aria-label="Before You, /);
  });

  it('draws no year section at all when there are no year rows', () => {
    const html = draw([]);
    expect(html).not.toContain('Read a year together');
    expect(html).not.toContain('book.year.');
  });
});

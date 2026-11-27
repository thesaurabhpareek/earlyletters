import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import type { MonthRow } from '@/components/book/book-page.logic';
import { MonthsSheet, READ_FROM_HERE_ACTION } from '@/components/book/months-sheet';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

// The sheet is a native bottom sheet; its own code is not under test here, only the rows MonthsSheet puts in it.
vi.mock('@/components/ui/sheet', () => ({ Sheet: ({ children, title }: any) => React.createElement('section', { 'aria-label': title }, children) }));
vi.mock('@gorhom/bottom-sheet', () => ({ BottomSheetScrollView: ({ children }: any) => React.createElement('div', null, children) }));
// The real ListRow and Button draw; their props are kept so a test can fire the VoiceOver action and the taps.
const rowProps: any[] = [];
const buttonProps: any[] = [];
vi.mock('@/components/ui/list-row', async () => {
  const real = await vi.importActual<typeof import('@/components/ui/list-row')>('@/components/ui/list-row');
  return { ...real, ListRow: (p: any) => (rowProps.push(p), React.createElement(real.ListRow, p)) };
});
vi.mock('@/components/ui/button', async () => {
  const real = await vi.importActual<typeof import('@/components/ui/button')>('@/components/ui/button');
  return { ...real, Button: (p: any) => (buttonProps.push(p), React.createElement(real.Button, p)) };
});

/**
 * [BL-1792] Read from here in Go to a month, rendered (static markup through react-native-web; BL-278 harness). Proves
 * which rows get the control, that it is hidden from assistive tech with a 44 pt floor, and what the row's VoiceOver
 * action and the two taps do. It does NOT prove VoiceOver's actions rotor, Voice Control or the real layout (classes are
 * not drawn here); those stay on the device plan. Fictional family Asha only.
 */
const row = (key: string, label: string): MonthRow => ({ key, sectionIndex: 0, label, line: '2 letters, from Mama', a11yLabel: `${label}. 2 letters, from Mama` });
const rows = [row('m3', 'Month 3'), row('m2', 'Month 2')];
// Month 2 has only a private or waiting letter: no start.
const starts = new Map([['m3', 'asha-letter-1']]);

beforeEach(() => {
  harness.fontScale = 1;
  rowProps.length = 0;
  buttonProps.length = 0;
});

const draw = (on: { onChoose?: (r: MonthRow) => void; onReadFrom?: (id: string) => void; flagOff?: boolean } = {}) =>
  renderMarkup(<MonthsSheet open rows={rows} onClose={() => {}} onChoose={on.onChoose ?? (() => {})} starts={on.flagOff ? undefined : starts} onReadFrom={on.onReadFrom ?? (() => {})} />);

describe('[RYT-08] read from a month', () => {
  it('draws the control on a month with a playable letter, and none on a month without one', () => {
    const html = draw();
    expect(html).toContain('data-testid="book.month.m3.readFromHere"');
    expect(html).not.toContain('book.month.m2.readFromHere');
    expect(html).toContain('data-testid="book.month.m2"');
  });

  it("the control opens at the month's start letter; the row body still goes to the month", () => {
    const readFrom = vi.fn();
    const choose = vi.fn();
    draw({ onReadFrom: readFrom, onChoose: choose });
    buttonProps.find((p) => p.testID === 'book.month.m3.readFromHere').onPress();
    expect(readFrom).toHaveBeenCalledWith('asha-letter-1');
    rowProps.find((p) => p.testID === 'book.month.m3').onPress();
    expect(choose).toHaveBeenCalledWith(rows[0]);
    expect(readFrom).toHaveBeenCalledTimes(1);
  });

  it('draws no control at all without starts (the flag off)', () => {
    const html = draw({ flagOff: true });
    expect(html).not.toContain('readFromHere');
    expect(rowProps.every((p) => p.accessibilityActions === undefined)).toBe(true);
  });
});

describe('[RYT-10] action only for VoiceOver, 44 pt control for touch', () => {
  for (const fontScale of [1, 3.12]) {
    it(`at font scale ${fontScale}: the row is one element with the "Read from here" action; the control is hidden and at least 44 pt`, () => {
      harness.fontScale = fontScale;
      const readFrom = vi.fn();
      const html = draw({ onReadFrom: readFrom });
      // The row: one button, its label the month and its line, never the control's words.
      expect(html).toContain('aria-label="Month 3, 2 letters, from Mama"');
      const m3 = rowProps.find((p) => p.testID === 'book.month.m3');
      expect(m3.accessibilityActions).toEqual([{ name: READ_FROM_HERE_ACTION, label: 'Read from here' }]);
      m3.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
      expect(readFrom).not.toHaveBeenCalled();
      m3.onAccessibilityAction({ nativeEvent: { actionName: READ_FROM_HERE_ACTION } });
      expect(readFrom).toHaveBeenCalledWith('asha-letter-1');
      // A month without a start has no action.
      expect(rowProps.find((p) => p.testID === 'book.month.m2').accessibilityActions).toBeUndefined();
      // The visible control sits inside an aria-hidden wrapper and keeps its 44 pt floor.
      expect(html).toMatch(/<div aria-hidden="true"[^>]*><button[^>]*style="min-height:44px"[^>]*data-testid="book\.month\.m3\.readFromHere"/);
      expect(buttonProps.find((p) => p.testID === 'book.month.m3.readFromHere').fullWidth).toBe(fontScale > 1);
    });
  }
});

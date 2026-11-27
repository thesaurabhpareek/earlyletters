/// <reference types="node" />
/**
 * BL-1545: iPad beside-icon tab labels are sized from the tabs shown, not from every route.
 *
 * On a screen 768 points wide or more, the tab bar decides whether labels sit beside the icon by adding up each route's
 * item width: 125 unless the route's tabBarItemStyle gives a number (`shouldUseHorizontalLabels` in expo-router's bundled
 * bottom-tabs, build/react-navigation/bottom-tabs/views/BottomTabBar.js). The Moments route exists whatever the flag says
 * and is hidden when it is off, so its style must give that number (width 0) or it is counted as a fourth tab.
 *
 * The test runs the library's own function text, read from node_modules, with only its last comparison changed to return
 * the sum. The pin test checks only the parts it lists (the start and end markers, the comparison, the 768 check, the
 * numeric-width condition and the 125 default); any other library change that moves the sum (for example the library
 * ignoring a zero width) is caught by the flag-off and flag-on sum tests instead. A change that leaves the sum the same
 * (for example the library skipping hidden routes itself, which width 0 already makes add nothing) is not caught.
 * Mutant (run by hand, see the PR): drop `width: 0` from momentsTabVisibility; the flag-off case fails.
 *
 * Not proved here: the pixels on a device, and the result today. The sum is read only at 768 points wide or more, and
 * there 4 x 125 = 500 fits as well as 375, so the label position was the same with or without the hidden route; below 768
 * the library uses width > height and never reads the sum. This fixes the count, not a visible bug.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { momentsTabVisibility, visibleTabIds } from '../src/lib/nav/moments-tab';

const req = createRequire(import.meta.url);
const libFile = req.resolve('expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js');
const lib = readFileSync(libFile, 'utf8');
const layout = readFileSync(join(__dirname, '..', 'src', 'app', '(tabs)', '_layout.tsx'), 'utf8');

const START = 'const shouldUseHorizontalLabels = ';
const END = '\nconst isCompact';
const COMPARE = 'return maxTabWidth <= dimensions.width;';

type Style = Record<string, unknown> | undefined;
type Probe = (a: {
  state: { index: number; routes: { key: string }[] };
  descriptors: Record<string, { options: { tabBarItemStyle?: Style; tabBarLabelPosition?: string } }>;
  dimensions: { width: number; height: number };
}) => unknown;

/** The library's function, compiled from its own text; `sum` swaps the last comparison for the sum it compares. */
function libraryFunction(sum: boolean): Probe {
  const from = lib.indexOf(START);
  const to = lib.indexOf(END, from);
  let body = lib.slice(from + START.length, to).trim().replace(/;$/, '');
  if (sum) body = body.replace(COMPARE, 'return maxTabWidth;');
  const flatten = (s: unknown) => (Array.isArray(s) ? Object.assign({}, ...s) : s);
  return new Function('react_native_1', 'DEFAULT_MAX_TAB_ITEM_WIDTH', `return (${body});`)({ StyleSheet: { flatten } }, 125) as Probe;
}

/** The bar's routes in the layout's order, each with the item style the layout gives it. */
function bar(momentsOn: boolean) {
  const names = [...layout.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map((m) => m[1]);
  const routes = names.map((key) => ({ key }));
  const descriptors = Object.fromEntries(
    names.map((key) => [key, { options: key === 'moments' ? { ...momentsTabVisibility(momentsOn) } : {} }]),
  );
  return { state: { index: 0, routes }, descriptors };
}

describe('BL-1545 iPad tab-label sizing counts the tabs shown', () => {
  it('the library function is the one this test assumes', () => {
    expect(lib.split(START)).toHaveLength(2);
    expect(lib.slice(lib.indexOf(START)).indexOf(END)).toBeGreaterThan(0);
    const fn = lib.slice(lib.indexOf(START), lib.indexOf(END, lib.indexOf(START)));
    expect(fn.split(COMPARE)).toHaveLength(2);
    expect(fn).toMatch(/dimensions\.width >= 768/);
    expect(fn).toMatch(/typeof flattenedStyle\.width === 'number'/);
    expect(fn).toMatch(/return acc \+ DEFAULT_MAX_TAB_ITEM_WIDTH;/);
    expect(lib).toMatch(/const DEFAULT_MAX_TAB_ITEM_WIDTH = 125;/);
  });

  it('the layout gives no other route an item style or a label position, so the sum depends on Moments alone', () => {
    expect([...layout.matchAll(/<Tabs\.Screen\s+name="([^"]+)"/g)].map((m) => m[1])).toEqual(['index', 'moments', 'book', 'you']);
    expect(layout).not.toMatch(/tabBarItemStyle|tabBarLabelPosition/);
  });

  for (const on of [false, true]) {
    it(`flag ${on ? 'on' : 'off'}: the width the library adds up is ${visibleTabIds(on).length} tabs of 125`, () => {
      const sum = libraryFunction(true)({ ...bar(on), dimensions: { width: 1024, height: 768 } });
      expect(sum).toBe(visibleTabIds(on).length * 125);
    });
  }

  it('the unchanged library function still puts labels beside the icon on an iPad, flag off and on', () => {
    for (const on of [false, true]) {
      for (const width of [768, 820, 1024, 1366]) {
        expect(libraryFunction(false)({ ...bar(on), dimensions: { width, height: 1024 } }), `${on} ${width}`).toBe(true);
      }
    }
  });
});

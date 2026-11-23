/**
 * [BL-1515] The render branches of PinnedActionLayout: no action, pinned, and not pinned (scrolling).
 * The component is called as a plain function with its hooks and React Native mocked, then the element tree is read.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { FONT_SCALE } from '@/lib/a11y.logic';

const state = { scale: 1, bottomInset: 34 };
vi.mock('react-native', () => ({ ScrollView: 'ScrollView', View: 'View' }));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: state.bottomInset }) }));
vi.mock('@/lib/a11y', () => ({ useFontScale: () => state.scale }));

import { PinnedActionLayout, type PinnedActionLayoutProps } from './pinned-action';
import { PINNED_ACTION } from './pinned-action.logic';

type El = ReactElement<{ testID?: string; style?: Record<string, number>; children?: ReactNode }>;
function render(props: Partial<PinnedActionLayoutProps>, scale: number): El {
  state.scale = scale;
  return PinnedActionLayout({ children: 'content', ...props }) as El;
}
function walk(node: ReactNode, out: El[] = []): El[] {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === 'object') {
    out.push(node as El);
    walk((node as El).props.children, out);
  }
  return out;
}
const byId = (root: El, id: string) => walk(root).filter((e) => e.props.testID === id);
const ACTION = 'the action';

describe('[BL-1515] PinnedActionLayout render branches', () => {
  it('no action: nothing is pinned and nothing trails the content, at any size', () => {
    for (const scale of [FONT_SCALE.large, FONT_SCALE.ax3]) {
      const tree = render({ action: null }, scale);
      expect(byId(tree, 'pinnedAction.pinned')).toHaveLength(0);
      expect(byId(tree, 'pinnedAction.scrolling')).toHaveLength(0);
    }
  });
  it('pinned size: the action sits outside the scroll, once', () => {
    const tree = render({ action: ACTION }, FONT_SCALE.large);
    expect(byId(tree, 'pinnedAction.pinned')).toHaveLength(1);
    expect(byId(tree, 'pinnedAction.scrolling')).toHaveLength(0);
  });
  it('accessibility size: the action scrolls with the content, last, once', () => {
    const tree = render({ action: ACTION }, FONT_SCALE.ax1);
    expect(byId(tree, 'pinnedAction.pinned')).toHaveLength(0);
    const [scrolling] = byId(tree, 'pinnedAction.scrolling');
    expect(scrolling.props.children).toBe(ACTION);
    const scroll = walk(tree).find((e) => (e.type as unknown) === 'ScrollView')!;
    const kids = scroll.props.children as ReactNode[];
    expect(kids[kids.length - 1]).toBe(scrolling);
  });
  it('the footer padding is tokens: gutter 20, top 8, and the bottom is 12 without the home-indicator inset (Book empty)', () => {
    const [footer] = byId(render({ action: ACTION, insetBottom: false }, FONT_SCALE.large), 'pinnedAction.pinned');
    expect(footer.props.style).toEqual({ paddingHorizontal: tokens.space[5], paddingTop: tokens.space[2], paddingBottom: 12 });
    expect(PINNED_ACTION.bottom).toBe(12);
  });
  it('the bottom clears the home indicator when the screen owns the bottom edge', () => {
    const [footer] = byId(render({ action: ACTION }, FONT_SCALE.large), 'pinnedAction.pinned');
    expect(footer.props.style!.paddingBottom).toBe(34);
  });
  it('Book empty sits above the tab bar: it keeps the 12 pt footer, never a 24 pt page padding (BL-1516, E3)', () => {
    const src = readFileSync(join(__dirname, '..', '..', 'app', '(tabs)', 'book.tsx'), 'utf8');
    const block = src.match(/<PinnedActionLayout[\s\S]*?action=/)![0];
    expect(block).toMatch(/insetBottom=\{false\}/);
    expect(block).not.toMatch(/\bpb-\d|paddingBottom/);
  });
});

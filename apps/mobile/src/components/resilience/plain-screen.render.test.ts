/**
 * [BL-492 point 1] The crash body is drawn with a line-break setting, so "phone." is not left alone on its second line
 * at 402 and 375 pt (CDesO-47): iOS push-out, Android balanced, and no no-break space in the words. Only the crash
 * screen asks for it; every other PlainScreen body wraps as before.
 * The screens are called as plain functions with their hooks and native modules stood in, then the element tree is read.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { en } from '@scribe/content';

vi.mock('react', async (actual) => ({ ...(await actual<typeof import('react')>()), useRef: (v: unknown) => ({ current: v }), useEffect: () => undefined }));
vi.mock('react-native', () => ({
  AccessibilityInfo: { sendAccessibilityEvent: () => undefined, announceForAccessibility: () => undefined },
  Platform: { OS: 'ios' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  Text: 'Text',
  View: 'View',
  useColorScheme: () => 'light',
  useWindowDimensions: () => ({ width: 402, height: 874, fontScale: 1, scale: 3 }),
}));
vi.mock('react-native-safe-area-context', () => ({ initialWindowMetrics: null }));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path' }));
vi.mock('expo-splash-screen', () => ({ hideAsync: () => Promise.resolve() }));
vi.mock('expo-system-ui', () => ({ setBackgroundColorAsync: () => Promise.resolve() }));
vi.mock('expo-router', () => ({ router: { replace: () => undefined } }));
vi.mock('@/components/ui/fonts', () => ({ loadFonts: () => Promise.resolve() }));
vi.mock('@/lib/store', () => ({ getSettingIfOpen: () => null }));
vi.mock('@/lib/resilience/recover-to-tonight', () => ({ goToTonightAfterRetry: () => undefined }));

import { RootErrorBoundary } from './error-boundary';
import { PlainScreen } from './plain-screen';

type Props = { children?: ReactNode; lineBreakStrategyIOS?: string; textBreakStrategy?: string; [k: string]: unknown };
type El = ReactElement<Props>;
function walk(node: ReactNode, out: El[] = []): El[] {
  if (Array.isArray(node)) node.forEach((n) => walk(n, out));
  else if (node && typeof node === 'object') {
    out.push(node as El);
    walk((node as El).props.children, out);
  }
  return out;
}
/** The Text elements whose words are exactly `words`. */
const textsOf = (root: El, words: string) => walk(root).filter((e) => e.type === 'Text' && e.props.children === words);
/** The crash screen as the router draws it: RootErrorBoundary returns PlainScreen with its props, which is then drawn. */
function crashTree(): El {
  const screen = RootErrorBoundary({ retry: async () => undefined, error: new Error('x') }) as ReactElement<Parameters<typeof PlainScreen>[0]>;
  expect(screen.type).toBe(PlainScreen);
  return PlainScreen(screen.props) as El;
}

describe('[BL-492 point 1] the crash body does not leave its last word alone (CDesO-47)', () => {
  it('the crash body Text carries lineBreakStrategyIOS push-out and textBreakStrategy balanced', () => {
    const body = textsOf(crashTree(), en.errors.crash.body);
    expect(body).toHaveLength(1);
    expect(body[0].props.lineBreakStrategyIOS).toBe('push-out');
    expect(body[0].props.textBreakStrategy).toBe('balanced');
  });

  it('the title and the buttons keep their wrapping: only the body takes the setting', () => {
    const tree = crashTree();
    const others = walk(tree).filter((e) => e.type === 'Text' && e.props.children !== en.errors.crash.body);
    expect(others.length).toBeGreaterThanOrEqual(3); // title and two button labels
    for (const t of others) {
      expect(t.props.lineBreakStrategyIOS).toBeUndefined();
      expect(t.props.textBreakStrategy).toBeUndefined();
    }
  });

  it('a PlainScreen that does not ask for it (launch recovery) draws its body as before', () => {
    const tree = PlainScreen({ title: en.errors.launch.title, body: en.errors.launch.body, actions: [{ label: 'a', onPress: () => undefined }] }) as El;
    const body = textsOf(tree, en.errors.launch.body);
    expect(body).toHaveLength(1);
    expect(body[0].props.lineBreakStrategyIOS).toBeUndefined();
    expect(body[0].props.textBreakStrategy).toBeUndefined();
    const launch = readFileSync(join(__dirname, 'launch-recovery.tsx'), 'utf8');
    expect(launch).not.toMatch(/balanceBody/);
  });

  it('the words stay as written: no no-break space in the crash body', () => {
    expect(en.errors.crash.body).toBe('Your letters and recordings are still on this phone.');
    expect(en.errors.crash.body).not.toMatch(/ | |⁠/);
  });
});

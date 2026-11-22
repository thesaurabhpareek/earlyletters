/**
 * [NX-39-R36] The app switcher snapshot is covered whether or not App lock is on (BL-1423, BL-1407; MEDIA_THREAT_MODEL section 4, P6).
 *
 * This renders the real AppLockLayer and PrivacyCover (react-dom/server, native primitives stubbed as plain tags),
 * with the real controller and machine driving it from the real AppState listener. It proves the app draws the cover
 * when it goes inactive with App lock on or off (BL-1407), and takes it down when the app is active. It cannot prove the pixels iOS captures for the
 * switcher: that stays the device row D-1 in docs/qa/DEVICE_TEST_PLAN.md.
 */
import { createElement as h, type ReactNode } from 'react';
import { createRequire } from 'node:module';
// react-dom ships no types here and no dependency is added for them: a typed require keeps tsc clean.
const { renderToStaticMarkup } = createRequire(import.meta.url)('react-dom/server') as { renderToStaticMarkup: (e: unknown) => string };
import { beforeAll, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  appState: null as null | ((s: string) => void),
}));

// Native edges, as plain tags that keep testID, so the markup shows what is drawn.
type P = { children?: ReactNode; testID?: string; style?: unknown; accessibilityLabel?: string };
/** Flattens a style array, so the markup carries the background and opacity the real view would be given. */
const flat = (st: unknown): Record<string, unknown> => (Array.isArray(st) ? Object.assign({}, ...st.map(flat)) : ((st as Record<string, unknown>) ?? {}));
const tag = (name: string) => (p: P) =>
  h('div', { 'data-kind': name, 'data-testid': p.testID, 'data-style': JSON.stringify(flat(p.style)), 'data-label': p.accessibilityLabel }, p.children);

vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => env.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void env.settings.set(k, v),
}));
vi.mock('../src/lib/capture/recorder', () => ({ onActiveTakeChange: () => {} }));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  StyleSheet: { create: <T,>(s: T) => s, absoluteFill: {} },
  View: tag('view'),
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, l: (s: string) => void) => {
      env.appState = l;
      return { remove: () => {} };
    },
  },
}));
vi.mock('react-native-reanimated', () => ({
  default: { View: tag('animated') },
  cancelAnimation: () => {},
  ReduceMotion: { Never: 'never' },
  useAnimatedStyle: (f: () => object) => f(),
  useSharedValue: (v: number) => ({ value: v }),
  withTiming: (v: number) => v,
}));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
vi.mock('react-native-screens', () => ({ FullWindowOverlay: tag('overlay') }));
vi.mock('react-native-svg', () => ({ default: tag('svg'), Path: tag('path') }));
vi.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: async () => 3,
  supportedAuthenticationTypesAsync: async () => [2],
  hasHardwareAsync: async () => true,
  authenticateAsync: async () => ({ success: true }),
}));
vi.mock('@/components/ui/button', () => ({ Button: tag('button') }));
vi.mock('@/components/ui/toast', () => ({ useToast: () => ({ show: () => {} }) }));
vi.mock('@/lib/a11y', () => ({
  useFocusOnMount: () => {},
  useTheme: () => ({ c: { bg: '#fff', text: '#000' }, scheme: 'light', highContrast: false, reduceTransparency: false }),
}));

const COVER = 'data-testid="appLock.cover"';
const NAME_OF_A_CHILD = 'Asha';
const labelOf = (html: string, testid: string) => new RegExp(`<div[^>]*data-testid="${testid}"[^>]*>`).exec(html)?.[0].match(/data-label="([^"]*)"/)?.[1];
const styleOf = (html: string, testid: string) => {
  const tagHtml = new RegExp(`<div[^>]*data-testid="${testid}"[^>]*>`).exec(html)?.[0] ?? '';
  const raw = /data-style="([^"]*)"/.exec(tagHtml)?.[1] ?? '{}';
  return JSON.parse(raw.replace(/&quot;/g, '"')) as { backgroundColor?: string; opacity?: number };
};
const textOf = (html: string) => html.replace(/<[^>]*>/g, '');

const { appLockCopy } = await import('../src/lib/app-lock/copy');
const { writeAppLock } = await import('../src/lib/app-lock/prefs');
const controller = await import('../src/lib/app-lock/controller');
const { AppLockLayer } = await import('../src/components/app-lock/app-lock-layer');
const draw = () => renderToStaticMarkup(h(AppLockLayer));

describe('[NX-39-R36] the app switcher snapshot is covered, App lock on or off', () => {
  beforeAll(async () => {
    writeAppLock({ enabled: true });
    controller.startAppLock();
    expect(env.appState).not.toBeNull();
    // Open the book first, so the cover below is the switcher cover and not the lock screen.
    await controller.unlock();
  });

  it('[NX-39-R36] in front and unlocked, nothing is drawn over the letters (control)', () => {
    expect(controller.getAppLockState().locked).toBe(false);
    expect(draw()).not.toContain(COVER);
  });

  it('[NX-39-R36] the moment the app goes inactive, PrivacyCover is drawn over everything, opaque, with the mark and no text', () => {
    env.appState!('inactive');
    expect(controller.getAppLockState().locked).toBe(false);
    const html = draw();
    expect(html).toContain('data-kind="overlay"'); // the full-window layer above presented screens
    expect(html).toContain(COVER);
    expect(html).toContain('data-testid="appLock.cover.mark"');
    expect(html).not.toContain('data-testid="appLock.unlock"'); // a cover, not yet a lock screen
    // Opaque: the cover is the page colour with no transparency, and the layer holding it starts fully opaque.
    expect(styleOf(html, 'appLock.cover').backgroundColor).toBe('#fff');
    expect(styleOf(html, 'appLock.cover').opacity ?? 1).toBe(1);
    expect(html).toMatch(/<div data-kind="animated"[^>]*data-style="[^"]*&quot;opacity&quot;:1/);
    // No text on it, no child name anywhere; VoiceOver reads only the app name.
    expect(textOf(html)).toBe('');
    expect(html).not.toContain(NAME_OF_A_CHILD);
    expect(labelOf(html, 'appLock.cover.mark')).toBe(appLockCopy.coverLabel);
  });

  it('[NX-39-R36] the cover stays through the background and comes down in front within the grace', () => {
    env.appState!('background');
    expect(draw()).toContain(COVER);
    env.appState!('active');
    expect(draw()).not.toContain(COVER);
  });

  it('[NX-39-R36] with App lock off, going inactive still draws the cover, and coming back to the front takes it down (BL-1407)', async () => {
    await controller.turnOff();
    expect(controller.getAppLockState().enabled).toBe(false);
    env.appState!('active');
    expect(draw()).not.toContain(COVER);
    env.appState!('inactive');
    expect(controller.getAppLockState().locked).toBe(false); // a cover, never a lock
    expect(draw()).toContain(COVER);
    expect(draw()).not.toContain('data-testid="appLock.unlock"');
    env.appState!('active');
    expect(draw()).not.toContain(COVER);
  });
});

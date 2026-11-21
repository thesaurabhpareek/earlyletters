/**
 * [NX-39-R36] The app switcher snapshot is covered while App lock is on (BL-1423; MEDIA_THREAT_MODEL section 4, P6).
 *
 * This renders the real AppLockLayer and PrivacyCover (react-dom/server, native primitives stubbed as plain tags),
 * with the real controller and machine driving it from the real AppState listener. It proves the app draws the cover
 * when it goes inactive with App lock on, and not when the lock is off. It cannot prove the pixels iOS captures for the
 * switcher: that stays the device row D-1 in docs/qa/DEVICE_TEST_PLAN.md.
 */
import { createElement as h, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  appState: null as null | ((s: string) => void),
}));

// Native edges, as plain tags that keep testID, so the markup shows what is drawn.
type P = { children?: ReactNode; testID?: string };
const tag = (name: string) => (p: P) => h('div', { 'data-kind': name, 'data-testid': p.testID }, p.children);

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
  useAnimatedStyle: () => ({}),
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

const { writeAppLock } = await import('../src/lib/app-lock/prefs');
const controller = await import('../src/lib/app-lock/controller');
const { AppLockLayer } = await import('../src/components/app-lock/app-lock-layer');
const draw = () => renderToStaticMarkup(h(AppLockLayer));

describe('[NX-39-R36] the app switcher snapshot is covered while App lock is on', () => {
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
    expect(html).not.toContain(NAME_OF_A_CHILD);
  });

  it('[NX-39-R36] the cover stays through the background and comes down in front within the grace', () => {
    env.appState!('background');
    expect(draw()).toContain(COVER);
    env.appState!('active');
    expect(draw()).not.toContain(COVER);
  });

  it('[NX-39-R36] with App lock off, going inactive draws no cover (the off case is BL-1407, not claimed here)', async () => {
    await controller.turnOff();
    env.appState!('inactive');
    expect(draw()).not.toContain(COVER);
  });
});

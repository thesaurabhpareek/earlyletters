/**
 * [BL-1720] The sign-in sheet's shared frame, title and provider buttons, read once. The components are called as plain
 * functions with their hooks and native modules mocked, then the element tree is read. Every sign-in, consent and
 * invite step uses these, so one test covers them all.
 */
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({ ActivityIndicator: 'ActivityIndicator', KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'ios' }, ScrollView: 'ScrollView', View: 'View' }));
vi.mock('react-native-reanimated', () => ({ default: { View: 'Animated.View' }, FadeIn: { duration: () => ({ reduceMotion: () => ({}) }) }, ReduceMotion: { Never: 'never' } }));
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path' }));
vi.mock('expo-apple-authentication', () => ({ AppleAuthenticationButton: 'AppleAuthenticationButton', AppleAuthenticationButtonType: {}, AppleAuthenticationButtonStyle: {} }));
vi.mock('expo-router', () => ({ router: {}, useNavigation: () => ({ getParent: () => null }) }));
vi.mock('phosphor-react-native/src/icons/AppleLogo', () => ({ AppleLogoIcon: 'AppleLogoIcon' }));
vi.mock('phosphor-react-native/src/icons/EnvelopeSimple', () => ({ EnvelopeSimpleIcon: 'EnvelopeSimpleIcon' }));
vi.mock('phosphor-react-native/src/icons/Fingerprint', () => ({ FingerprintIcon: 'FingerprintIcon' }));
vi.mock('phosphor-react-native/src/icons/LockSimple', () => ({ LockSimpleIcon: 'LockSimpleIcon' }));
vi.mock('phosphor-react-native/src/icons/WarningCircle', () => ({ WarningCircleIcon: 'WarningCircleIcon' }));
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/safe-area-view', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/components/ui/screen-header', () => ({ BackButton: 'BackButton', ModalHeader: 'ModalHeader' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('@/lib/a11y', () => ({ announce: () => {}, useFocusOnMount: () => {}, useIsAccessibilitySize: () => false, useScheme: () => 'light', useTheme: () => ({ c: { text: '#000', textMuted: '#666', accent: '#00f', caution: '#a00' } }) }));
vi.mock('@/lib/haptics', () => ({ haptic: () => {} }));
vi.mock('./session-provider', () => ({ useAuth: () => ({}) }));
vi.mock('./revocation-wait-line', () => ({ RevocationWaitLine: 'RevocationWaitLine' }));
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), useRef: () => ({ current: null }), useCallback: (f: unknown) => f }));

import { ProviderButton, SheetFrame, SheetTitle, escapeHandler } from './ui';

type El = ReactElement<Record<string, unknown> & { children?: ReactNode }>;

describe('[BL-1720] sign-in sheet frame, title and provider buttons', () => {
  it('the frame is modal for VoiceOver and closes on the escape gesture', () => {
    const frame = SheetFrame({ children: 'x', closeLabel: 'Close' }) as El;
    expect(frame.props.accessibilityViewIsModal).toBe(true);
    expect(typeof frame.props.onAccessibilityEscape).toBe('function');
  });

  it('escape closes where Close is offered and enabled, and does nothing when it is disabled or there is no Close', () => {
    const close = vi.fn();
    escapeHandler({ closeLabel: 'Not now', close })?.();
    expect(close).toHaveBeenCalledTimes(1);
    expect(escapeHandler({ closeLabel: 'Not now', closeDisabled: true, close })).toBeUndefined();
    expect(escapeHandler({ close })).toBeUndefined();
    const busy = SheetFrame({ children: 'x', closeLabel: 'Not now', closeDisabled: true }) as El;
    expect(busy.props.onAccessibilityEscape).toBeUndefined();
    const noClose = SheetFrame({ children: 'x' }) as El;
    expect(noClose.props.onAccessibilityEscape).toBeUndefined();
    expect(noClose.props.accessibilityViewIsModal).toBe(true);
  });

  it('the title is a heading', () => {
    const title = SheetTitle({ children: 'Keep the book safe' }) as El;
    expect(title.props.asHeading).toBe(true);
  });

  it('each provider button has the label VoiceOver reads, and the busy line while it works', () => {
    const idle = ProviderButton({ kind: 'google', label: 'Continue with Google', busyLabel: 'Signing in', onPress: () => {} }) as El;
    expect(idle.props.accessibilityLabel).toBe('Continue with Google');
    const busy = ProviderButton({ kind: 'google', label: 'Continue with Google', busy: true, busyLabel: 'Signing in', onPress: () => {} }) as El;
    expect(busy.props.accessibilityLabel).toBe('Signing in');
    const email = ProviderButton({ kind: 'email', label: 'Continue with email', onPress: () => {} }) as El;
    expect(email.props.accessibilityLabel).toBe('Continue with email');
  });
});

/**
 * The native seams stood in for component tests (vitest.component.config.ts). Each stand-in keeps the component's own
 * code real and replaces only what needs a phone: animation, theming, fonts, speech. A component test never reaches
 * a network, a file or a native module.
 */
import * as React from 'react';
import { vi } from 'vitest';
import { harness } from './harness';

vi.mock('react-native-reanimated', async () => {
  const RN = await import('react-native-web');
  // Animated.View is a plain View here; layout animation props (entering, exiting, layout) are dropped.
  const strip = (C: React.ElementType) => (p: Record<string, unknown>) => {
    const { entering: _e, exiting: _x, layout: _l, ...rest } = p;
    return React.createElement(C, rest);
  };
  const chain: any = new Proxy(() => chain, { get: () => chain });
  return { default: { View: strip(RN.View), Text: strip(RN.Text) }, FadeIn: chain, FadeOut: chain, ReduceMotion: { Never: 'never', System: 'system', Always: 'always' } };
});

vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light' }) }));
vi.mock('@/components/ui/fonts', () => ({ faceForClassName: () => undefined, useFontsReady: () => true }));
vi.mock('@rn-primitives/slot', () => ({
  Slot: ({ children, ...rest }: any) => (React.isValidElement(children) ? React.cloneElement(children as any, rest) : children),
}));

// The a11y hooks read the phone's text size and screen reader. Tests set `harness` before rendering.
vi.mock('@/lib/a11y', async () => {
  const { tokens } = await import('@scribe/design-tokens');
  const logic = await import('@/lib/a11y.logic');
  return {
    announce: (m: string) => void harness.announced.push(m),
    useTheme: () => ({ c: tokens.light, scheme: 'light', highContrast: false, reduceTransparency: false }),
    useScheme: () => 'light',
    useFontScale: () => harness.fontScale,
    useIsLargeText: () => logic.isLargeText(harness.fontScale),
    useIsAccessibilitySize: () => logic.isAccessibilitySize(harness.fontScale),
  };
});

// Icons are native SVG: stood in by an empty glyph that keeps the size it was asked for.
vi.mock('phosphor-react-native/src/icons/WarningCircle', () => ({ WarningCircleIcon: () => null }));

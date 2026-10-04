/**
 * Pure values for Lamp (no React Native import, so they are unit tested).
 * Colour, peak opacity and timing all come from tokens.atmosphere and tokens.motion.lamp;
 * nothing is typed here except the gradient shape.
 */
import { tokens, type ColorScheme } from '@scribe/design-tokens';

export type LampAnchor = 'top' | 'center';

/** Where the light sits, as fractions of the screen. `r` is the gradient radius against the box. */
export const ANCHORS: Record<LampAnchor, { cx: number; cy: number; r: number }> = {
  top: { cx: 0.5, cy: 0, r: 0.95 },
  center: { cx: 0.5, cy: 0.4, r: 0.8 },
};

/** Strong core, long soft tail (the website's closest-side radial lamp). One gradient, drawn once. */
export const STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 0.38, opacity: 0.45 },
  { offset: 0.66, opacity: 0.12 },
  { offset: 1, opacity: 0 },
] as const;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Opacity of the whole pool once it has arrived and before it breathes. 0 means draw nothing. */
export function lampOpacity(scheme: ColorScheme, intensity = 1, highContrast = false): number {
  if (highContrast) return 0; // Increase Contrast asks for plain paper
  return tokens.atmosphere.peak[scheme] * clamp01(intensity);
}

/**
 * The breathing loop as a CSS-style keyframe rule for Reanimated's CSS animations. They run
 * natively on the UI thread (and as a real CSS animation on web), with no JS per frame.
 * Opacity only.
 */
export function breathKeyframes() {
  return { from: { opacity: 1 }, to: { opacity: tokens.motion.lamp.breathOpacityMin } };
}

/** Whether the loop may run: never while hidden, backgrounded or under Reduce Motion. */
export function shouldBreathe(s: { reduced: boolean; appActive: boolean; focused: boolean; visible: boolean }): boolean {
  return s.visible && s.appActive && s.focused && !s.reduced;
}

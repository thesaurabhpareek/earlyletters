/**
 * A very small tap on devices that can give one (Android browsers through the Vibration API). iPhone Safari has no
 * web haptics, so there it is silent and nothing breaks; the visual transitions carry the feel. Skipped when the
 * visitor prefers reduced motion. Never throws, never stores anything.
 */
export type Tap = 'light' | 'success';

const PATTERNS: Record<Tap, number | number[]> = { light: 8, success: [10, 40, 16] };

export function tap(kind: Tap = 'light'): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* some browsers throw when vibration is blocked; a missing tap is fine */
  }
}

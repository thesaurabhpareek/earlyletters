/**
 * Accessibility helpers (TDD 09 section 8.1). Components and screens use these instead of
 * reading AccessibilityInfo directly, so iOS, Android and web behave the same way.
 *
 *   announce()               speak a short status (iOS VoiceOver); Android uses live regions
 *   useFocusOnMount()        move screen-reader focus to a heading or sheet title once
 *   isAccessibilitySize()    Dynamic Type at AX1 or above (UIContentSizeCategory.isAccessibilityCategory)
 *   useIsAccessibilitySize() the same, live; drives row stacking in components
 *   useIsLargeText()         xxxLarge and above: side-by-side pairs start to stack
 *   useContrastPreference()  Increase Contrast and Reduce Transparency
 *   useTheme()               colours for JS-styled parts (icons, borders), Increase Contrast applied
 */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { tokens, type ColorScheme, type Colors } from '@scribe/design-tokens';
import { getAudioMode } from '@/lib/audio-mode';

import { isAccessibilitySize, isLargeText } from './a11y.logic';

export { FONT_SCALE, isAccessibilitySize, isLargeText } from './a11y.logic';

export function useFontScale(): number {
  return useWindowDimensions().fontScale || 1;
}

export function useIsAccessibilitySize(): boolean {
  return isAccessibilitySize(useFontScale());
}

export function useIsLargeText(): boolean {
  return isLargeText(useFontScale());
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

let queued: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Speak a short status ("Letter deleted. Undo available.").
 * - iOS and web: AccessibilityInfo.announceForAccessibilityWithOptions, queued behind
 *   whatever VoiceOver is saying when `queue` is set.
 * - Android: no-op. Recent TalkBack discourages announcements; the caller renders the
 *   message in an element with accessibilityLiveRegion="polite" (our Toast and
 *   TextField already do), which TalkBack reads.
 * - Never over a letter (TDD 09 rule S2): while a recording is playing, messages wait
 *   and are spoken when playback stops.
 */
export function announce(message: string, opts: { queue?: boolean } = {}): void {
  if (!message || Platform.OS === 'android') return;
  if (getAudioMode() === 'playback') {
    queued.push(message);
    if (!timer) timer = setTimeout(flushQueued, 1000);
    return;
  }
  speak(message, opts.queue ?? true);
}

/** react-native-web has announceForAccessibility only; never throw from a status message. */
function speak(message: string, queue: boolean) {
  try {
    if (typeof AccessibilityInfo.announceForAccessibilityWithOptions === 'function') {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue });
    } else if (typeof AccessibilityInfo.announceForAccessibility === 'function') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  } catch {}
}

function flushQueued() {
  timer = null;
  if (getAudioMode() === 'playback') {
    timer = setTimeout(flushQueued, 1000);
    return;
  }
  const all = queued;
  queued = [];
  for (const m of all) speak(m, true);
}

/**
 * Move VoiceOver / TalkBack focus to `ref` after the first layout (a new onboarding step's
 * heading, a sheet's title). Runs once per `key` change, only while `when` is true.
 */
export function useFocusOnMount(ref: RefObject<unknown>, when: boolean = true, key?: unknown): void {
  useEffect(() => {
    if (!when) return;
    const id = setTimeout(() => {
      const node = ref.current as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0] | null;
      if (node) {
        try {
          AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
        } catch {}
      }
    }, 350); // after native sheet / screen transitions settle, or VoiceOver keeps its old focus
    return () => clearTimeout(id);
  }, [when, key, ref]);
}

/** Screen reader running (VoiceOver / TalkBack). Toasts stay put; timers stop. */
export function useScreenReader(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((v) => alive && setOn(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

/* ------------------------------------------------------------------ */
/* Contrast and transparency                                           */
/* ------------------------------------------------------------------ */

let contrast = { highContrast: false, reduceTransparency: false };
const contrastListeners = new Set<(v: typeof contrast) => void>();
let contrastSubscribed = false;

function setContrast(patch: Partial<typeof contrast>) {
  const next = { ...contrast, ...patch };
  if (next.highContrast === contrast.highContrast && next.reduceTransparency === contrast.reduceTransparency) return;
  contrast = next;
  contrastListeners.forEach((l) => l(contrast));
}

function subscribeContrast() {
  if (contrastSubscribed) return;
  contrastSubscribed = true;
  if (Platform.OS === 'ios') {
    // "Increase Contrast" on iOS is UIAccessibilityDarkerSystemColorsEnabled.
    AccessibilityInfo.isDarkerSystemColorsEnabled().then((v) => setContrast({ highContrast: v })).catch(() => {});
    AccessibilityInfo.addEventListener('darkerSystemColorsChanged', (v) => setContrast({ highContrast: v }));
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => setContrast({ reduceTransparency: v })).catch(() => {});
    AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => setContrast({ reduceTransparency: v }));
  } else if (Platform.OS === 'android') {
    AccessibilityInfo.isHighTextContrastEnabled().then((v) => setContrast({ highContrast: v })).catch(() => {});
    AccessibilityInfo.addEventListener('highTextContrastChanged', (v) => setContrast({ highContrast: v }));
  } else if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const more = window.matchMedia('(prefers-contrast: more)');
    const less = window.matchMedia('(prefers-reduced-transparency: reduce)');
    setContrast({ highContrast: more.matches, reduceTransparency: less.matches });
    more.addEventListener?.('change', (e) => setContrast({ highContrast: e.matches }));
    less.addEventListener?.('change', (e) => setContrast({ reduceTransparency: e.matches }));
  }
}

export function useContrastPreference(): { highContrast: boolean; reduceTransparency: boolean } {
  subscribeContrast();
  const [v, setV] = useState(contrast);
  useEffect(() => {
    contrastListeners.add(setV);
    setV(contrast);
    return () => {
      contrastListeners.delete(setV);
    };
  }, []);
  return v;
}

/** Palette for a scheme, with the Increase Contrast overrides applied when asked. */
export function paletteFor(scheme: ColorScheme, highContrast: boolean): Colors {
  return highContrast ? { ...tokens[scheme], ...tokens.highContrast[scheme] } : tokens[scheme];
}

/**
 * Colours for JS-styled parts (icon colours, borders drawn in style). Follows the app's
 * Appearance setting: Uniwind.setTheme() calls Appearance.setColorScheme(), so React
 * Native's useColorScheme() and the CSS theme agree (uniwind 1.12.1 config.common.js).
 */
export function useTheme(): { c: Colors; scheme: ColorScheme; highContrast: boolean; reduceTransparency: boolean } {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { highContrast, reduceTransparency } = useContrastPreference();
  return { c: paletteFor(scheme, highContrast), scheme, highContrast, reduceTransparency };
}

/** Stable ref helper for focus targets. */
export function useA11yRef<T = unknown>() {
  return useRef<T>(null);
}

// web: @font-face from tokens.web.css | android: same
/**
 * Brand faces (Mukta UI sans, Literata reading serif, Tiro Devanagari Hindi), bundled
 * from packages/design-tokens/fonts (SIL OFL 1.1, subset per founder decision 15).
 *
 * loadFonts() registers them once. On a release build the expo-font config plugin
 * embeds the files, so this resolves at once; in the web preview it injects @font-face.
 * Until a face is ready, Text falls back to the system font (React Native only logs
 * an info line for an unknown family, never an error).
 */
import * as Font from 'expo-font';
import { useEffect, useState } from 'react';
import { tokens } from '@scribe/design-tokens';
import { fontAssets, type FontName } from '@scribe/design-tokens/fonts';

const NAMES = Object.keys(fontAssets) as FontName[];

const check = () => {
  try {
    return NAMES.every((n) => Font.isLoaded(n));
  } catch {
    return false;
  }
};

let ready = check();
let pending: Promise<void> | null = null;
const listeners = new Set<(v: boolean) => void>();

export function fontsReady(): boolean {
  return ready;
}

export function loadFonts(): Promise<void> {
  if (ready) return Promise.resolve();
  pending ??= Font.loadAsync(fontAssets)
    .then(() => {
      ready = true;
      listeners.forEach((l) => l(true));
    })
    .catch(() => {
      // Keep the system font; never block the app on a font.
      pending = null;
    });
  return pending;
}

/** Re-renders once the faces are registered. */
export function useFontsReady(): boolean {
  const [v, setV] = useState(ready);
  useEffect(() => {
    if (ready) {
      setV(true);
      return;
    }
    listeners.add(setV);
    void loadFonts();
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

const F = tokens.fontFamily;

/**
 * Face for legacy className text (screens written before the type ramp): reads the
 * family, weight and italic utilities and returns the one bundled face that matches,
 * so custom fonts are never asked to synthesise a weight or slant.
 */
export function faceForClassName(className: string | undefined): string {
  const cls = className ?? '';
  const serif = /(^|\s)font-serif(\s|$)/.test(cls);
  const italic = /(^|\s)italic(\s|$)/.test(cls);
  const semibold = /(^|\s)font-(semibold|bold|extrabold|black)(\s|$)/.test(cls);
  const medium = /(^|\s)font-medium(\s|$)/.test(cls);
  if (serif) return italic ? F.serifItalic : semibold || medium ? F.serifMedium : F.serif;
  return semibold ? F.sansSemiBold : medium ? F.sansMedium : F.sans;
}

/** Devanagari letters and signs (U+0900 to U+097F, U+A8E0 to U+A8FF). */
export const DEVANAGARI = /[ऀ-ॿ꣠-ꣿ]/;

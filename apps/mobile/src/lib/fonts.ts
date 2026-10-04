import { useFonts, type FontSource } from 'expo-font';
import { tokens } from '@scribe/design-tokens';

/**
 * Product fonts (DESIGN_LANGUAGE.md 3): Literata (letters, titles) and Mukta (UI).
 * Keys are the exact names in tokens.fontFamily.
 *
 * NOT YET SUPPLIED: assets/fonts/README.md lists the TTF files the founder must add.
 * Metro needs static require() calls, so once a file exists, add its line here, e.g.
 *   [tokens.fontFamily.serif]: require('../../assets/fonts/Literata-Regular.ttf'),
 * then switch --font-serif / --font-sans in src/global.css to the same family names.
 * Until then the map is empty, the splash does not wait, and Georgia/system render.
 */
export const bundledFonts: Record<string, FontSource> = {};

/** Every family the type scale uses; the test checks this against tokens.type. */
export const requiredFamilies: readonly string[] = [
  tokens.fontFamily.serif,
  tokens.fontFamily.serifItalic,
  tokens.fontFamily.sans,
  tokens.fontFamily.sansMedium,
  tokens.fontFamily.sansSemiBold,
];

/**
 * True when fonts are ready or failed. A load error must never block the app:
 * the system fallback renders and the splash is released either way.
 */
export function useProductFonts(): boolean {
  const [loaded, error] = useFonts(bundledFonts);
  return loaded || error != null;
}

/**
 * Bundled font files (SIL OFL 1.1), keyed by the fontFamily names in tokens.fontFamily.
 * Metro resolves each require() as an asset. Kept out of src/tokens.ts so Node, tests
 * and the web build can import tokens without loading binary files.
 *
 * Native: embed these at build time with the expo-font config plugin (no runtime load
 * on launch). The app also calls loadAsync with this map, which is a no-op for embedded
 * fonts and is what the web preview uses.
 */
declare const require: (path: string) => number;

export const fontAssets = {
  'Mukta-Regular': require('./Mukta-Regular.ttf'),
  'Mukta-Medium': require('./Mukta-Medium.ttf'),
  'Mukta-SemiBold': require('./Mukta-SemiBold.ttf'),
  'Literata-Regular': require('./Literata-Regular.ttf'),
  'Literata-Medium': require('./Literata-Medium.ttf'),
  'Literata-Italic': require('./Literata-Italic.ttf'),
  'TiroDevanagariHindi-Regular': require('./TiroDevanagariHindi-Regular.ttf'),
} as const;

export type FontName = keyof typeof fontAssets;

/** Paths for the expo-font config plugin (relative to the repo root). */
export const fontFiles: readonly string[] = Object.keys(fontAssets).map((n) => `packages/design-tokens/fonts/${n}.ttf`);

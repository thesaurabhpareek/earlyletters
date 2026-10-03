/**
 * Owner: ACT3. Scene 08 typefaces, self-hosted and subset to the characters of site.ts s08.lines only.
 * All SIL OFL 1.1 (licences next to the files in ./fonts). Latin lines use Literata (global --font-serif).
 *
 *   Devanagari: Tiro Devanagari Hindi Regular (Tiro Typeworks), 12.2 KB woff2
 *   Simplified Chinese: Noto Serif SC, wght 400 instance (Google), 2.6 KB woff2
 *   Arabic: Amiri Regular (Khaled Hosny), 15.4 KB woff2
 *
 * Rebuild after a copy change (characters outside the subset fall back to system fonts):
 *   pyftsubset <font>.ttf --text="<line>" --layout-features='*' --flavor=woff2 --no-hinting --desubroutinize
 * Noto Serif SC is variable: instance it at wght 400 first (fontTools.varLib.instancer).
 */
import localFont from 'next/font/local';

export const devanagariSerif = localFont({
  src: './fonts/tiro-devanagari-hindi-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Noto Serif Devanagari', 'Kohinoor Devanagari', 'serif'],
});

export const chineseSerif = localFont({
  src: './fonts/noto-serif-sc-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Songti SC', 'Noto Serif CJK SC', 'serif'],
});

export const arabicSerif = localFont({
  src: './fonts/amiri-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['Geeza Pro', 'Noto Naskh Arabic', 'serif'],
});

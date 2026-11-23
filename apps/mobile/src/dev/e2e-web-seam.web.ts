/**
 * WEB ONLY, e2e builds only (council ruling E6, BL-410). Lets the web e2e preview show Dynamic Type and a
 * language for screenshots: `?e2eFontScale=3.571` (AX5) and `?e2eLang=ar`. Closed values; anything else is
 * ignored. Read once per load, never stored. Presentation only: the hooks report the scale, the page gets
 * `lang` and `dir`, and the letter locale getter answers; no data, settings, consent or network.
 * Web captures made with it are layout evidence from emulation, not device evidence.
 */
import { directionOf, readSeam } from './e2e-web-seam.logic';

const seam = typeof window === 'undefined' ? { fontScale: null, lang: null } : readSeam(window.location.search);

if (seam.lang && typeof document !== 'undefined') {
  document.documentElement.lang = seam.lang;
  document.documentElement.dir = directionOf(seam.lang);
}

export function fontScaleOverride(): number | null {
  return seam.fontScale;
}

/** The fixture letter locale (a language code), or null. */
export function languageOverride(): string | null {
  return seam.lang;
}

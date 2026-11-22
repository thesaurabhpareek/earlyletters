/**
 * Pure half of the web e2e presentation seam (council ruling E6, BL-410). Two closed lists and no I/O.
 * Only `e2e-web-seam.web.ts` reads the address; it is loaded only through `e2e-web-seam-load.ts`, whose
 * gate is the same as the other e2e seams. Presentation only: no data, settings, consent, analytics,
 * entitlement or network, never persisted, and it unlocks no language, pack or feature (D-115, D-121, BL-411).
 */
import { languageInfo } from '@scribe/core';
import { FONT_SCALE } from '../lib/a11y.logic';
import { isSpeechLanguage, type SpeechLanguage } from '../lib/models/catalog';

/** The query keys. Greppable on purpose: both are in `SEAM_IDENTIFIERS` (.github/scripts/seam-guard.mjs, B-8). */
export const E2E_FONT_SCALE_KEY = 'e2eFontScale';
export const E2E_LANG_KEY = 'e2eLang';

/** Default, AX1, AX3 and AX5, as the number a person writes in the address. */
const SCALES: readonly number[] = [FONT_SCALE.large, FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5];

/** A scale from the closed set, or null (ignored) for anything else, including "1.0", "3.5710" or "NaN". */
export function parseFontScale(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  return SCALES.find((n) => String(n) === raw) ?? null;
}

/** One of the seven spoken-language codes, exactly as written (lower case), or null. */
export function parseLang(raw: string | null | undefined): SpeechLanguage | null {
  return isSpeechLanguage(raw) ? raw : null;
}

export function directionOf(code: SpeechLanguage): 'ltr' | 'rtl' {
  return languageInfo(code).script.direction;
}

export function readSeam(search: string): { fontScale: number | null; lang: SpeechLanguage | null } {
  const q = new URLSearchParams(search);
  return { fontScale: parseFontScale(q.get(E2E_FONT_SCALE_KEY)), lang: parseLang(q.get(E2E_LANG_KEY)) };
}

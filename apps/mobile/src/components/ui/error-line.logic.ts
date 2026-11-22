/**
 * The error line's rules, pure so they are tested (error-line.logic.test.ts); error-line.tsx draws them.
 * Extracted from lib/auth/ui.tsx ErrorLine with the same behaviour (conformance F-17, DESIGN-SYSTEM-DELTA 2.3 `Notice`).
 *
 * VoiceOver reads it once: iOS speaks it through announce() when it appears (accessibilityLiveRegion is an Android
 * property and iOS ignores it); Android speaks it through the polite live region (announce() is a no-op there). The
 * row is one element carrying the words as its label, and the glyph is not read. Never assertive: nothing was lost.
 */
export const ERROR_LINE_GLYPH_PT = 20;

export type ErrorLineA11y = { accessible: true; accessibilityLabel: string; accessibilityLiveRegion: 'polite' };

/** The words to draw, or null when there is nothing to say (an empty or missing message draws nothing). */
export function errorLineWords(message: string | null | undefined): string | null {
  return typeof message === 'string' && message.length > 0 ? message : null;
}

/** One element, the words as its label, a polite live region. */
export function errorLineA11y(message: string): ErrorLineA11y {
  return { accessible: true, accessibilityLabel: message, accessibilityLiveRegion: 'polite' };
}

/** What announce() speaks when the message changes: the new words, once; nothing when it clears. */
export function errorLineAnnouncement(message: string | null | undefined): string | null {
  return errorLineWords(message);
}

/**
 * Rules for the Delete this book and Erase everything screens (BL-387; F17 6.2 D, 6.2 F). Pure, no React Native.
 */

/** The typed confirm: the word, any case, spaces around it ignored (the same rule as account deletion). */
export function typedWordMatches(typed: string, word: string): boolean {
  return typed.trim().toLowerCase() === word.toLowerCase();
}

/** One button of a native confirm (React Native's Alert button shape). */
export type ConfirmButton = { text: string; style: 'cancel' | 'destructive'; onPress?: () => void };

/**
 * Erase everything, step 2 (design 2.12; content.md 4.11): the system confirm. The way back is first and is the
 * cancel button; "Erase" is second, destructive, and never the default. Cancel has no action: it only closes the
 * dialog, so nothing is erased and the page stays as it was.
 */
export function eraseConfirmDialog(
  c: { confirmTitle: string; confirmBody: string; confirmButton: string; back: string },
  onErase: () => void,
): { title: string; body: string; buttons: [ConfirmButton, ConfirmButton] } {
  return {
    title: c.confirmTitle,
    body: c.confirmBody,
    buttons: [
      { text: c.back, style: 'cancel' },
      { text: c.confirmButton, style: 'destructive', onPress: onErase },
    ],
  };
}

/** The notes under the body on the Erase everything page, each a key of `copy.settings.erase`. */
export type EraseNoteKey = 'backups' | 'onThisPhone' | 'speechStays' | 'plusStays' | 'freeLetters';

/**
 * Erase everything, step 1: which notes the page shows under the body, in the order they are read and drawn
 * (council on #520, founder decision of 8 Nov; one list, so the visual order and the VoiceOver order cannot differ).
 * What stays comes first and together: backups and saved exports, this phone only, the speech model. Then, in the
 * store build only: the Plus line, and only while Plus will renew (the account-deletion screen's signal,
 * `showSubscriptionNotice`), and last the free-letters line. In an alpha build (no letter limit, Plus products cannot
 * load, `PLUS_ALPHA`) neither is ever shown.
 */
export function eraseNoteKeys(o: { alpha: boolean; plusRenews: boolean }): EraseNoteKey[] {
  const keys: EraseNoteKey[] = ['backups', 'onThisPhone', 'speechStays'];
  if (!o.alpha && o.plusRenews) keys.push('plusStays');
  if (!o.alpha) keys.push('freeLetters');
  return keys;
}

export type ErasePhase = 'review' | 'erasing';
export type EraseOutcome = 'erased' | 'incomplete' | 'signed_in';

/**
 * Erase everything after "Erase" (design 2.12): the Erasing screen first, with no way out, then the erase. On
 * 'erased' the phase stays 'erasing' (the age question replaces every screen from the root layout, so this page is
 * never drawn again) and the done line is announced. Otherwise the page comes back with one failure line.
 */
export async function runEraseEverything(deps: {
  erase: () => Promise<EraseOutcome>;
  setPhase: (p: ErasePhase) => void;
  setFailed: (f: null | 'failed' | 'signed_in') => void;
  announceDone: () => void;
}): Promise<EraseOutcome> {
  deps.setFailed(null);
  deps.setPhase('erasing');
  let r: EraseOutcome;
  try {
    r = await deps.erase();
  } catch {
    r = 'incomplete';
  }
  if (r === 'erased') {
    deps.announceDone();
    return r;
  }
  deps.setPhase('review');
  deps.setFailed(r === 'signed_in' ? 'signed_in' : 'failed');
  return r;
}

/** Sizes and the snapshot rule for the new controls (NS-01-R3, R13). */

/** The thumbnail above the capture buttons is never taller than this on Ready (design spec 3.2). R3 sets no minimum. */
export const THUMB_MAX_HEIGHT_PT = 160;

/** From AX3 up the Ready thumbnail is at most this tall (NS-01-R39, PROPOSED) so Speak, Type and Change stay on screen. */
export const THUMB_AX_MAX_HEIGHT_PT = 88;

/**
 * Screens that show a picture draw nothing while App lock is on and the app is not in front, or before it is unlocked
 * (NS-01-R13, NX-39-R36), so the switcher snapshot and a cold open show no picture.
 */
export function pictureHidden(input: { lockOn: boolean; unlocked: boolean; phase: 'active' | 'inactive' | 'background' }): boolean {
  if (!input.lockOn) return false;
  return !input.unlocked || input.phase !== 'active';
}

/**
 * Karma's ruling (11 Nov 2026, reversible default): a screen that shows a picture is blank in the app switcher
 * snapshot whether or not App lock is on. NX-39-R36 asked for it only with App lock on; flip this constant to follow
 * R36 as written. The App lock cover itself (PrivacyCover) still covers a locked app as before.
 */
export const PHOTO_BLANK_WITHOUT_APP_LOCK = true;

/** True when a picture must not be drawn right now: the app is not in front (inactive covers the snapshot moment). */
/** The hook's phase mapping, pure so it can be pinned: only a phone in front ('active') shows a picture; 'inactive' (the switcher
 * snapshot is taken), 'background', 'unknown' and any other state cover it (NS-01-R13a). */
export function coveredForAppState(phase: string): boolean {
  return pictureCovered(phase === 'active' || phase === 'inactive' ? phase : 'background');
}

export function pictureCovered(phase: 'active' | 'inactive' | 'background', lockOn = false, unlocked = true): boolean {
  return pictureHidden({ lockOn: lockOn || PHOTO_BLANK_WITHOUT_APP_LOCK, unlocked, phase });
}

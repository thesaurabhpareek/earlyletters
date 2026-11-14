/** Constants for the new controls (NS-01-R3, R13, R20). Sizes are the design-tokens' own. */
import { tokens } from '@scribe/design-tokens';

export const MIN_TARGET_PT = tokens.target.min;
/** The thumbnail above the capture buttons is never smaller than this on its longest side (NS-01-R3). */
export const THUMB_MIN_PT = 64;
/** And never taller than this on Ready (design spec 3.2). */
export const THUMB_MAX_HEIGHT_PT = 160;
/** Reading order on Ready (NS-01-R20). */
export const READY_ORDER = ['thumbnail', 'prompt', 'speak', 'type'] as const;

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
export function pictureCovered(phase: 'active' | 'inactive' | 'background', lockOn = false, unlocked = true): boolean {
  return pictureHidden({ lockOn: lockOn || PHOTO_BLANK_WITHOUT_APP_LOCK, unlocked, phase });
}

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

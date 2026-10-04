/**
 * Android mapping (MOTION 6): system haptic constants through performAndroidHapticsAsync,
 * which needs no VIBRATE permission and follows the user's system haptic setting.
 */
import * as Haptics from 'expo-haptics';
import { shouldPlay, type HapticIntent } from './haptics.shared';

export type { HapticIntent } from './haptics.shared';

const MAP: Record<HapticIntent, Haptics.AndroidHaptics> = {
  tap: Haptics.AndroidHaptics.Segment_Tick,
  press: Haptics.AndroidHaptics.Context_Click,
  soft: Haptics.AndroidHaptics.Long_Press,
  success: Haptics.AndroidHaptics.Confirm,
  warning: Haptics.AndroidHaptics.Reject,
};

export function haptic(intent: HapticIntent): void {
  if (!shouldPlay(intent)) return;
  Haptics.performAndroidHapticsAsync(MAP[intent]).catch(() => {});
}

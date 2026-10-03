/**
 * haptic(intent): the only way the app plays haptics (lint bans expo-haptics elsewhere).
 * iOS: expo-haptics UIKit generators. Web: expo-haptics is a no-op there.
 * Android: haptics.android.ts. Vocabulary and throttle: haptics.shared.ts.
 */
import * as Haptics from 'expo-haptics';
import { shouldPlay, type HapticIntent } from './haptics.shared';

export type { HapticIntent } from './haptics.shared';

export function haptic(intent: HapticIntent): void {
  if (!shouldPlay(intent)) return;
  const run = (): Promise<void> => {
    switch (intent) {
      case 'tap':
        return Haptics.selectionAsync();
      case 'press':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'soft':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };
  run().catch(() => {});
}

/**
 * The five haptic intents (COMPONENTS.md 0.2, MOTION.md 6). Screens call
 * haptic(intent), never expo-haptics directly. Never more than one per 100 ms.
 * iOS now; Android later maps to performAndroidHapticsAsync in haptics.android.ts.
 */
import * as Haptics from 'expo-haptics';

export type HapticIntent = 'tap' | 'press' | 'soft' | 'success' | 'warning';

let last = 0;

export function haptic(intent: HapticIntent): void {
  const now = Date.now();
  if (now - last < 100) return;
  last = now;
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

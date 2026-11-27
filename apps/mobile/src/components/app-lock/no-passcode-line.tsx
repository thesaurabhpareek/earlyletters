// web: same | android: same
/**
 * Why the App lock switch is off and cannot be turned on: the iPhone has no passcode (Settings > App lock).
 *
 * VoiceOver hears it once, when it appears (PER4-018): iOS ignores accessibilityLiveRegion, so announce() says it; on
 * Android announce() does nothing and the polite live region says it. Queued, because it arrives with the page and must
 * not cut off the page's title. It lives in its own file because the App lock page keeps no announce() of its own: its
 * toasts speak for themselves, and test/app-lock-wiring.test.ts holds the page to that so no toast is said twice.
 */
import { useEffect } from 'react';
import { Text } from '@/components/ui/text';
import { announce } from '@/lib/a11y';

export function NoPasscodeLine({ text }: { text: string }) {
  useEffect(() => {
    announce(text, { queue: true });
  }, [text]);
  return (
    <Text variant="footnote" accessibilityLiveRegion="polite" className="px-4" testID="appLock.noPasscode">
      {text}
    </Text>
  );
}

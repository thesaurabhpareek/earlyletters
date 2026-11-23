import { useEffect, useRef } from 'react';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { announce } from '@/lib/a11y';
import { speakOnceAfterSettle } from './review-view.logic';

/**
 * Why the take stopped early (S14), shown and, once the screen has settled, spoken once (BL-1793). The live region
 * stays for Android; iOS VoiceOver ignores it, so `announce()` says the line.
 */
export function EarlyStopLine({ note }: { note: string }) {
  const said = useRef(new Set<string>());
  useEffect(
    () =>
      speakOnceAfterSettle(note, {
        said: said.current,
        settleMs: tokens.motion.route.dissolveMs,
        speak: (line) => announce(line),
        later: (fn, ms) => setTimeout(fn, ms),
        cancel: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      }),
    [note],
  );
  return (
    <Text variant="footnote" tone="muted" accessibilityLiveRegion="polite" testID="review.stopLine">
      {note}
    </Text>
  );
}

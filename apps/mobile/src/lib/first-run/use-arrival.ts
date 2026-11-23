/**
 * What a screen does when it arrives or changes into another state, for a person using VoiceOver (NX-36 section 2.3): the
 * heading takes focus, and the state is said once in plain words through `announce()`. A StateScreen's live region is
 * Android-only (lib/a11y.ts: iOS needs `announce()`), so on iOS nothing else would speak. Said when the screen arrives and
 * again only when `key` changes (offline becoming an outage), never on an ordinary render. Records and sends nothing.
 */
import { useEffect, type RefObject } from 'react';
import { announce, useFocusOnMount } from '@/lib/a11y';

export function useArrival(focusTarget: RefObject<unknown>, message: string, key: unknown): void {
  useFocusOnMount(focusTarget, true, key);
  // `message` follows `key`: a changed sentence alone is not a new arrival.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    announce(message);
  }, [key]);
}

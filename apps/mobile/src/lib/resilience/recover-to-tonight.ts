/**
 * "Go to Tonight" from the error screen. The root layout is the thing that is showing the error, so
 * the navigator is not mounted yet: remount first (`retry`), then go to Tonight as soon as the router is
 * ready (`go` is router.replace, passed in so this stays pure and tested in Node). Polls briefly and gives up quietly; the person is still on a working screen either way.
 */
import { TONIGHT_HREF } from './not-found.logic';

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
}

export function goToTonightAfterRetry(
  retry: () => void,
  go: (href: string) => void,
  timers: Timers = { setTimeout: (fn, ms) => setTimeout(fn, ms) },
  attempts = 20,
  gapMs = 50,
): void {
  try {
    retry();
  } catch {
    return;
  }
  const tick = (left: number) => {
    try {
      go(TONIGHT_HREF);
    } catch {
      if (left > 1) timers.setTimeout(() => tick(left - 1), gapMs);
    }
  };
  timers.setTimeout(() => tick(attempts), gapMs);
}

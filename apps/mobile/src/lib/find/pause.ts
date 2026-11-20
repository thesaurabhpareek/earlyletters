/**
 * The remote pause for Find (`killSwitches.bookSearch`, packages/api kill-switches.ts). It can hide the Find action and
 * never turn it on (flag.ts). Find imports no network module (R22; review A on #894): the caller passes the reader of
 * the signed config already on the phone (the Book passes lib/remote's `getRemoteConfig`). A config that cannot be read
 * counts as not paused: the build switch is the only thing that turns Find on, and hiding is all a pause does.
 */
import { findPaused } from './flag';

export type RemoteConfigReader = () => { killSwitches?: Readonly<Record<string, unknown>> | null } | null;

export function findPausedNow(read: RemoteConfigReader): boolean {
  try {
    return findPaused(read() as { killSwitches?: { bookSearch?: boolean } } | null);
  } catch {
    return false;
  }
}

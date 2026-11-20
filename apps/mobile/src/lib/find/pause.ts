/**
 * The remote pause for Find (`killSwitches.bookSearch`, packages/api kill-switches.ts). It can hide the Find action and
 * never turn it on (flag.ts). Read from the signed remote config on every call, as photos/pause.ts does; the remote
 * module is loaded on first use. A config that cannot be read counts as not paused: the build switch is the only thing
 * that turns Find on, and hiding is the only thing a pause does.
 */
import { findPaused } from './flag';

export interface RemoteReader {
  getRemoteConfig(): { killSwitches?: Readonly<Record<string, unknown>> | null } | null;
}

export function findPausedNow(load: () => RemoteReader = () => require('../remote') as RemoteReader): boolean {
  try {
    return findPaused(load().getRemoteConfig() as { killSwitches?: { bookSearch?: boolean } } | null);
  } catch {
    return false;
  }
}

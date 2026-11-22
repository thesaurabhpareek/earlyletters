/**
 * The remote pause for photos (`killSwitches.photos`, packages/api kill-switches.ts). It can hide the new surfaces and
 * never turn them on (flag.ts). Read from the signed remote config on every call, the way the family and sync switches
 * are (lib/family/invites-switch.ts); the remote module is loaded on first use. A config that cannot be read counts as
 * not paused: the build switch is still the only thing that turns photos on, and hiding is the only thing a pause does.
 * Export and Erase everything never call this (NS-01-R19).
 */
import { photosPaused } from './flag';

export interface RemoteReader {
  getRemoteConfig(): { killSwitches?: Readonly<Record<string, unknown>> | null } | null;
}

export function photosPausedNow(load: () => RemoteReader = () => require('../remote') as RemoteReader): boolean {
  try {
    return photosPaused(load().getRemoteConfig() as { killSwitches?: { photos?: boolean } } | null);
  } catch {
    return false;
  }
}

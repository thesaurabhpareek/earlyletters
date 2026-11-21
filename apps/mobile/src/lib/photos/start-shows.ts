import { photoSurfaces, photosBuildEnabled } from './flag';
import { photosPausedNow } from './pause';
import { getPhotoPicker } from './registry';

/** Home draws the photo start only when the switch is on, not paused, and a picker is registered: absent, never dead (NS-01-R59). */
export function photoStartShows(paused = photosPausedNow()): boolean {
  return photoSurfaces({ build: photosBuildEnabled(), paused }).start && getPhotoPicker() !== null;
}

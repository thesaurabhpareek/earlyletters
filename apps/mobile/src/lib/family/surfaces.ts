/** The build's answer to "are the co-parent surfaces shown" (entry.logic.ts visibleCoParentDoors). Reads the capability list and the alpha flag. */
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { capabilities, serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteScreensBlocked, visibleCoParentDoors } from './entry.logic';

/** The join-door rule (B12-5): servers on and an alpha build. */
export function familySurfacesOn(): boolean {
  return visibleCoParentDoors(capabilities.coParent, PLUS_ALPHA).joinButton;
}

/** True only in a servers-on store build. A servers-off build keeps its "coming soon" invite screens exactly as before. */
export function inviteScreensHidden(): boolean {
  return inviteScreensBlocked({ serverFeatures: serverFeaturesEnabled(), surfacesShown: familySurfacesOn() });
}

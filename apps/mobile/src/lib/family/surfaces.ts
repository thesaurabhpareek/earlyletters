/** The build's answer to "are the co-parent surfaces shown" (surfaces.logic.ts). Reads the capability list and the alpha flag. */
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { capabilities, serverFeaturesEnabled } from '@/lib/capabilities';
import { familySurfacesShown, inviteScreensBlocked } from './surfaces.logic';

export function familySurfacesOn(): boolean {
  return familySurfacesShown({ alpha: PLUS_ALPHA, coParent: capabilities.coParent });
}

/** True only in a servers-on store build. A servers-off build keeps its "coming soon" invite screens exactly as before. */
export function inviteScreensHidden(): boolean {
  return inviteScreensBlocked({ serverFeatures: serverFeaturesEnabled(), surfacesShown: familySurfacesOn() });
}

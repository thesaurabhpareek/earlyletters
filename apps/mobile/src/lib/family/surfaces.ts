/**
 * The build's answer to "are the invite and join screens hidden" (entry.logic.ts inviteScreensHiddenFrom: the server switch
 * and the join-door rule `visibleCoParentDoors(...).joinButton`). Reads the capability list and the alpha flag. This is the
 * one reader of that switch: the invite layout, the link route and the saved-token prompt all ask it and nothing else.
 */
import { PLUS_ALPHA } from '@/lib/billing/alpha';
import { capabilities, serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteScreensHiddenFrom } from './entry.logic';

/** True only in a servers-on store build. A servers-off build keeps its "coming soon" invite screens exactly as before. */
export function inviteScreensHidden(): boolean {
  return inviteScreensHiddenFrom({ serverFeatures: serverFeaturesEnabled(), coParent: capabilities.coParent, alpha: PLUS_ALPHA });
}

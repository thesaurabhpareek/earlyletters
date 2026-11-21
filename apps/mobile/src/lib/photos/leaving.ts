/**
 * The pending picture does not outlive the person who chose it (BL-1444 gap 1 and 3, NS-01-R4). Called when a session
 * ends or another account replaces it (Sign out, a forced sign-out, an account switch) and before Erase everything.
 * Adopts that have not started are dropped, one that is running finishes, then the pending picture and the picker's
 * original go. Never throws; safe with no photo and with the photos switch off (nothing is registered then).
 */
import { adoptsIdle, dropQueuedAdopts } from './adopt';
import { getPending } from './registry';

export async function discardPendingPhotoOnLeaving(): Promise<void> {
  dropQueuedAdopts();
  try {
    await adoptsIdle();
    await getPending()?.discard();
  } catch {
    // Nothing here may stop a sign-out or an erase.
  }
}

/**
 * The phone's copy of the consent record in the device settings (BL-528; rule in consent-copy.logic.ts). Deleted by
 * auth/sign-out-leftovers.ts (every sign-out), account-deletion/use-account-deletion.ts (the request) and Erase
 * everything, which removes every setting (db/repos/wipe.ts).
 */
import { deleteSetting, getSetting, setSetting } from '@/lib/store';
import { CONSENT_COPY_KEY, type ConsentCopyStore } from './consent-copy.logic';

export const deviceConsentCopy: ConsentCopyStore = {
  read: () => getSetting(CONSENT_COPY_KEY),
  write: (value) => setSetting(CONSENT_COPY_KEY, value),
};

/** Removes the copy. Never throws: a store that cannot be read has nothing to clear, and the caller's other steps must run. */
export function clearConsentCopy(): void {
  try {
    if (getSetting(CONSENT_COPY_KEY) !== null) deleteSetting(CONSENT_COPY_KEY);
  } catch {
    // Nothing to clear.
  }
}

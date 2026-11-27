/**
 * What a finished sign-out leaves nothing of: the Apple user id, a pending email request (H1, ADR 0023), the
 * first-run draft, whose answers belonged to the person who left (BL-1816), and the phone's copy of the person's
 * consent record (BL-528, CPrivO-21; export/consent-copy.logic.ts). The one place every sign-out path calls,
 * and only once the session is gone: a refused or waiting sign-out never reaches it, so no draft is lost to it.
 * The draft of a book already made is gone already (onboarding clears it when the book is made).
 * The From names used on this phone go too (NS-16-R15): the next account never sees the last person's list.
 * So does a name from Apple that a build before #1125 left in the Keychain (`scribe.auth.pendingName`): nothing
 * writes it now (O-8, E100), and a sign-out or an account deletion must not leave it for the next person.
 */
import { forgetFromNames } from '@/lib/capture/sign-as-other';
import { clearConsentCopy } from '@/lib/export/consent-copy';
import { clearFirstRunDraft } from '@/lib/first-run/draft';
import { clearPendingAppleName, forgetAppleUser } from './apple';
import { clearPendingEmailRequest } from './pending';

export async function forgetSignOutLeftovers(): Promise<void> {
  clearFirstRunDraft(); // first: synchronous, so nothing below can skip it
  clearConsentCopy(); // synchronous too, and never throws
  forgetFromNames(); // synchronous too, and never throws
  await forgetAppleUser();
  await clearPendingAppleName(); // never throws: a failed delete is caught in apple.ts
  await clearPendingEmailRequest();
}

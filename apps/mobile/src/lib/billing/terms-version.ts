/**
 * The Subscription Terms version shown in the app (F14-REQ-011, D-081; WP-F14-06). The first status
 * report after a purchase names it in the consent facts (WP-F14-15a).
 *
 * It changes when any of these change:
 *  - `docs/legal/subscription-terms.md` (version and text): the pinned version and SHA-256 below must
 *    be updated with it, and terms-version.test.ts fails in CI until they are;
 *  - the words shown next to Apple's plan buttons (`billingCopy.store`) or in the acknowledgment
 *    (`billingCopy.ack`): a fingerprint of them is part of the version, computed from the bundle.
 * No React Native here.
 */
import { billingCopy } from '@scribe/content';

/** `version` in the front matter of docs/legal/subscription-terms.md. */
export const SUBSCRIPTION_TERMS_DOC_VERSION = '1.4.0';
/** SHA-256 of docs/legal/subscription-terms.md at that version. Update together with the document. */
export const SUBSCRIPTION_TERMS_DOC_SHA256 = 'd36f5818b0003308aad20f8704cc2f4423368485eb044859ba608f5b7fdc98f0';

/** FNV-1a, 32 bits, as 8 hex digits. A change detector, not a security hash. */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** The version for a given set of shown words: `<doc version>+<doc sha prefix>.<copy fingerprint>`. */
export function termsVersionOf(shown: { store: unknown; ack: unknown }): string {
  return `${SUBSCRIPTION_TERMS_DOC_VERSION}+${SUBSCRIPTION_TERMS_DOC_SHA256.slice(0, 8)}.${fingerprint(JSON.stringify([shown.store, shown.ack]))}`;
}

/** The version of the terms this build shows. */
export function termsShownVersion(): string {
  return termsVersionOf({ store: billingCopy.store, ack: billingCopy.ack });
}

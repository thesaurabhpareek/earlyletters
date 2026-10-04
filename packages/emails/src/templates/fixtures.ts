/**
 * Preview values for every placeholder the email copy uses.
 *
 * Fictional family only (CLAUDE.md privacy rules): the account is
 * asha@example.com, the code is 482913, the parent signs as Mumma and the
 * grandmother as Nani. Emails carry no child name (CATALOG E-1), so there is no
 * `child` value. URLs point at the product domain with obviously fake tokens,
 * except Apple's own subscriptions page. Never put a real family detail here.
 */
import { brand } from '@scribe/brand';
import type { EmailValues } from './fill';

const SITE = `https://${brand.publisher.domain}`;

export const previewValues: EmailValues = {
  // people and addresses
  email: 'asha@example.com',
  oldEmail: 'asha@example.com',
  newEmail: 'asha.family@example.com',
  parentName: 'Mumma',
  signsAs: 'Nani',
  coParentName: 'Papa', // coparent-left: the co-parent closing their account
  inviter: 'Mumma', // coparent-invite: what the inviting parent signs as

  // one-time links and codes (auth)
  code: '482913',
  signInUrl: `${SITE}/auth/callback#token_hash=preview-not-a-real-token&type=email`,
  verifyUrl: `${SITE}/auth/callback#token_hash=preview-not-a-real-token&type=email`,
  confirmUrl: `${SITE}/auth/callback#token_hash=preview-not-a-real-token&type=email_change`,
  expiresIn: '15 minutes',
  device: 'an iPhone',
  when: 'Saturday, October 3, 2026 at 9:14 pm',

  // links
  appUrl: `${SITE}/open`,
  inviteUrl: `${SITE}/i/preview-not-a-real-invite`, // coparent-invite (universal link, 7 days)
  exportUrl: `${SITE}/open/export/preview-not-a-real-link`,
  confirmDeleteUrl: `${SITE}/delete-account/confirm#token=preview-not-a-real-token`, // deletion-confirm (web route to build)
  documentUrl: `${SITE}/privacy`,
  changesUrl: `${SITE}/privacy/changes`,
  subscriptionTermsUrl: `${SITE}/subscription-terms`, // apps/web/src/lib/legal.ts
  manageUrl: 'https://apps.apple.com/account/subscriptions',

  // billing (fictional dates; prices are the D-001 list prices)
  planName: 'Plus Annual',
  price: '$29.99',
  billingPeriod: 'a year',
  periodUnit: 'year',
  agreedDate: 'Saturday, October 3, 2026',
  trialEndDate: 'Thursday, December 3, 2026',
  renewalDate: 'Thursday, December 3, 2026',
  cancelByDate: 'Wednesday, December 2, 2026',
  accessEndDate: 'Thursday, December 3, 2026',
  effectiveDate: 'Thursday, December 3, 2026',
  oldPrice: '$29.99',
  newPrice: '$34.99',

  // account and privacy requests
  requestId: 'REQ-482913',
  requestDate: 'Saturday, October 3, 2026',
  deletionDate: 'Monday, November 2, 2026',
  completedDate: 'Monday, November 2, 2026',
  backupClearDate: 'Monday, November 9, 2026',
  documentName: 'Privacy Policy',
  changeSummary: 'Preview only: the approved plain-language summary of the change goes here.',
};

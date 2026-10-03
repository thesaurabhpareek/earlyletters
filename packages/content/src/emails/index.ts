/**
 * Every email word, one file per group (docs/emails/CATALOG.md). Each email is an `EmailCopy` (types.ts);
 * packages/emails renders them. The chrome (header alt, footer, sign-off) and the legal footer lines are
 * shared by every email.
 */
import { accountEmails } from './account.en';
import { authEmails } from './auth.en';
import { billingEmails } from './billing.en';
import { familyEmails } from './family.en';
import { lifecycleEmails } from './lifecycle.en';
import type { EmailCopy } from './types';

export type { EmailCopy } from './types';
export { authEmails, lifecycleEmails, familyEmails, billingEmails, accountEmails };
export { emailChrome } from './chrome.en';
export type { EmailChrome } from './chrome.en';
export { emailLegal } from './legal.en';
export type { EmailLegal } from './legal.en';

/** Every email, keyed by id (ids are unique across groups; the email copy test checks it). */
export const emailsById: Readonly<Record<string, EmailCopy>> = {
  ...authEmails,
  ...lifecycleEmails,
  ...familyEmails,
  ...billingEmails,
  ...accountEmails,
};

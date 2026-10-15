/**
 * Every email template, in one registry, for the render script, the preview
 * server, tests and the Supabase export.
 *
 * Each entry: the copy (from @scribe/content), the React component (takes
 * `{ values }`; missing values stay literal `{placeholders}`), and preview
 * props with the fictional Asha family.
 */
import type { ComponentType } from 'react';
import type { EmailCopy } from '@scribe/content/src/emails/types';
import type { EmailValues } from './fill';
import { previewValues } from './fixtures';

import * as accountCreateAttempt from './auth/account-create-attempt';
import * as verifyEmail from './auth/verify-email';
import * as signInLink from './auth/sign-in-link';
import * as welcome from './auth/welcome';
import * as signInTrouble from './auth/sign-in-trouble';
import * as appleAccountLinked from './auth/apple-account-linked';
import * as googleAccountLinked from './auth/google-account-linked';
import * as passkeyAdded from './auth/passkey-added';
import * as newDeviceSignIn from './auth/new-device-sign-in';
import * as emailChangedOldAddress from './auth/email-changed-old-address';
import * as emailChangedNewAddress from './auth/email-changed-new-address';
import * as reauthenticateCode from './auth/reauthenticate-code';
import * as welcomeCoparent from './lifecycle/welcome-coparent';
import * as welcomeFamily from './lifecycle/welcome-family';
import * as coparentInvite from './family/coparent-invite';
import * as familyBookClosing from './family/family-book-closing';
import * as familyBookRestored from './family/family-book-restored';
import * as accountDeleted from './account/account-deleted';
import * as accountDeletionCancelled from './account/account-deletion-cancelled';
import * as accountDeletionScheduled from './account/account-deletion-scheduled';
import * as coparentLeft from './account/coparent-left';
import * as deletionConfirm from './account/deletion-confirm';
import * as bookDeletionCancelled from './account/book-deletion-cancelled';
import * as bookDeletionScheduled from './account/book-deletion-scheduled';
import * as deletionRequestReceived from './account/deletion-request-received';
import * as exportReady from './account/export-ready';
import * as policyUpdate from './account/policy-update';
import * as privacyRequestReceived from './account/privacy-request-received';
import * as anniversaryReminder from './billing/anniversary-reminder';
import * as annualRenewalLong from './billing/annual-renewal-long';
import * as annualRenewalShort from './billing/annual-renewal-short';
import * as plusCancelled from './billing/plus-cancelled';
import * as plusEnded from './billing/plus-ended';
import * as plusQuiet from './billing/plus-quiet';
import * as plusStarted from './billing/plus-started';
import * as priceIncrease from './billing/price-increase';
import * as trialEndingFinal from './billing/trial-ending-final';
import * as trialEndingLong from './billing/trial-ending-long';
import * as trialEndingWeek from './billing/trial-ending-week';
import * as trialStarted from './billing/trial-started';

export type TemplateModule = {
  copy: EmailCopy;
  default: ComponentType<{ values?: EmailValues }>;
};

export type TemplateEntry = {
  id: string;
  group: string;
  copy: EmailCopy;
  subject: string;
  Component: ComponentType<{ values?: EmailValues }>;
  previewProps: { values: EmailValues };
};

const groups: Record<string, TemplateModule[]> = {
  auth: [
    accountCreateAttempt,
    verifyEmail,
    signInLink,
    welcome,
    signInTrouble,
    appleAccountLinked,
    googleAccountLinked,
    passkeyAdded,
    newDeviceSignIn,
    emailChangedOldAddress,
    emailChangedNewAddress,
    reauthenticateCode,
  ],
  lifecycle: [
    welcomeCoparent,
    welcomeFamily,
  ],
  family: [
    coparentInvite,
    familyBookClosing,
    familyBookRestored,
  ],
  account: [
    accountDeleted,
    accountDeletionCancelled,
    accountDeletionScheduled,
    coparentLeft,
    bookDeletionCancelled,
    bookDeletionScheduled,
    deletionRequestReceived,
    deletionConfirm,
    exportReady,
    policyUpdate,
    privacyRequestReceived,
  ],
  billing: [
    anniversaryReminder,
    annualRenewalLong,
    annualRenewalShort,
    plusCancelled,
    plusEnded,
    plusQuiet,
    plusStarted,
    priceIncrease,
    trialEndingFinal,
    trialEndingLong,
    trialEndingWeek,
    trialStarted,
  ],
};

export const templates: TemplateEntry[] = Object.entries(groups).flatMap(([group, mods]) =>
  mods.map((m) => ({
    id: m.copy.id,
    group,
    copy: m.copy,
    subject: m.copy.subject,
    Component: m.default,
    previewProps: { values: previewValues },
  })),
);

export const templatesById: Record<string, TemplateEntry> = Object.fromEntries(templates.map((t) => [t.id, t]));

export { CopyEmail } from './CopyEmail';
export { fill, placeholders } from './fill';
export { previewValues } from './fixtures';
export { supabaseMappings } from './supabase';

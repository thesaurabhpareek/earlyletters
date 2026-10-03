/**
 * Account, data and privacy-rights emails (lane C2). Catalog: docs/emails/CATALOG.md section 8.
 * Sources: docs/legal/DELETION_AND_EXPORT_SPEC.md (DATA-REQ-022, -025, -026, -036, -053, -054),
 * docs/legal/privacy-policy.md section 14, docs/legal/POLICY_VERSIONING.md section 5, D-042.
 *
 * Plain and calm. Deletion is the person's choice: we confirm it, say what happens and when,
 * and how to change their mind. No pleading, no loss language, no child names (CATALOG E-1).
 *
 * Placeholders:
 *   {requestId}        deletion or privacy request number
 *   {requestDate}      date the request was made
 *   {deletionDate}     date the 30-day grace ends and deletion runs
 *   {completedDate}    date deletion finished
 *   {backupClearDate}  date backups no longer hold the data (completed + 7 days)
 *   {appUrl}           universal link that opens the app
 *   {confirmDeleteUrl} one-time web link that opens /delete-account/confirm (deletion-confirm; works in any browser)
 *   {coParentName}     display name of the co-parent who is deleting their account (coparent-left; E-2)
 *   {exportUrl}        signed download link for a server export (v1.1)
 *   {expiresIn}        how long a link works, in words, e.g. "7 days"
 *   {documentName}     "Privacy Policy", "Terms of Service", ...
 *   {documentUrl}      the new version, published
 *   {changesUrl}       the changes page for that version
 *   {changeSummary}    the plain-language summary approved with the version (POLICY_VERSIONING s.5)
 *   {effectiveDate}    effective_at of the new version
 */
import { brand } from '@scribe/brand';
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const OPEN_APP = { label: `Open ${brand.name}`, urlVar: "{appUrl}" };
const PLUS_NOT_CANCELLED =
  "If you have Plus, deleting your account does not cancel it. Billing continues through Apple until you cancel: on your iPhone, open Settings, tap your name, then Subscriptions.";
// Customer review CUS-12, legal review LGL-14: no purchase records are held (D-061 keeps plan status only,
// deleted with the account), and only the consent record is kept to show what was agreed.
const RECORDS_KEPT =
  "A few records stay, with no letters or recordings in them: a record of what you agreed to (3 years, without your name), activity records (24 months, without your name) and support emails (2 years after your last one).";

export const accountEmails = {
  // L2 review: DATA-REQ-025 receipt 1. States the completion date (Apple 5.1.1(v)) and the Plus notice (DATA-REQ-022).
  'account-deletion-scheduled': {
    id: 'account-deletion-scheduled',
    subject: "Your account is set to be deleted",
    preheader: "On {deletionDate}. Until then you can save a copy, or change your mind.",
    heading: "We have your request",
    body: [
      `You asked to delete your ${brand.name} account on {requestDate}. Request number: {requestId}.`,
      "Your account, letters and recordings will be deleted from our servers on {deletionDate}. Our backups clear 7 days after that, and our service providers delete their copies within 45 days of your request.",
      "Until then, you can sign in to export a copy of everything, free, or to cancel the request. Both are in Settings, Your data.",
      "If you share a book with a co-parent, your letters and recordings have left it, so they can no longer read them. The book stays with them, and we have let them know. If you would like them to keep a copy, export yours before {deletionDate} and share it.",
      PLUS_NOT_CANCELLED,
      RECORDS_KEPT,
    ],
    facts: [
      { label: "Request number", value: "{requestId}" },
      { label: "Deletion date", value: "{deletionDate}" },
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    safety: "Did not ask for this? Reply to this email and we will stop it. Nothing is deleted before {deletionDate}.",
    category: 'account',
    kind: 'transactional',
  },

  // DATA-REQ-026, receipt 2.
  'account-deletion-cancelled': {
    id: 'account-deletion-cancelled',
    subject: "Your account is staying",
    preheader: "The deletion request is cancelled, and everything is back where it was.",
    heading: "Nothing will be deleted",
    body: [
      `You cancelled request {requestId} to delete your ${brand.name} account. Nothing will be deleted.`,
      "Your letters and books are back, for you and for your co-parent if you share a book.",
      "Welcome back to your book.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    safety: "Did not cancel this yourself? Reply to this email and we will help.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: DATA-REQ-025 receipt 3, sent before the auth user is removed. Repeats how to cancel
  // with Apple (DATA-REQ-022). The last email to this address.
  'account-deleted': {
    id: 'account-deleted',
    subject: "Your account has been deleted",
    preheader: "Request {requestId} is complete. This is the last email we will send you.",
    heading: "Your account and letters have been deleted",
    body: [
      "We finished request {requestId} on {completedDate}. Your account, letters and recordings have been deleted from our servers.",
      "Our backups clear by {backupClearDate}, and our service providers delete their copies within 45 days of your request.",
      "Anything you exported stays with you.",
      "If you have Plus, it is not cancelled by this. Billing continues through Apple until you cancel: on your iPhone, open Settings, tap your name, then Subscriptions.",
      RECORDS_KEPT,
      "Thank you for keeping your letters with us. This is the last email we will send to this address.",
    ],
    category: 'account',
    kind: 'transactional',
  },

  // Sole parent deletes a book (B-REQ-016). "One of your books": no child name in email (E-1).
  'book-deletion-scheduled': {
    id: 'book-deletion-scheduled',
    subject: "A book is set to be deleted",
    preheader: "On {deletionDate}. Until then you can export it, or change your mind.",
    heading: "We have your request",
    body: [
      "On {requestDate} you asked to delete one of your books. It will be deleted on {deletionDate}, with every letter and recording in it.",
      "To see which book, or to cancel, open the app and go to Settings, Your data. You can export everything in it first, free.",
    ],
    facts: [
      { label: "Requested on", value: "{requestDate}" },
      { label: "Deletion date", value: "{deletionDate}" },
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    safety: "Did not ask for this? Reply to this email. Nothing is deleted before {deletionDate}.",
    category: 'account',
    kind: 'transactional',
  },

  'book-deletion-cancelled': {
    id: 'book-deletion-cancelled',
    subject: "The book is staying",
    preheader: "The book stays, with every letter and recording right where it was.",
    heading: "Nothing will be deleted",
    body: [
      "You cancelled the request to delete one of your books. Every letter and recording in it is back.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    safety: "Did not cancel this yourself? Reply to this email and we will help.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: D-042 email route. Sent by support from the shared inbox before identity is confirmed.
  // The confirmation is deletion-confirm, a separate email whose link opens a web page (CUS-14), never a
  // plain sign-in email: people who write in often cannot use the app.
  'deletion-request-received': {
    id: 'deletion-request-received',
    subject: "We have your deletion request",
    preheader: "One more step to confirm it is you. Nothing is deleted until then.",
    heading: "Thank you, we have your request",
    body: [
      `We received a request to delete the ${brand.name} account for this email address. Request number: {requestId}.`,
      "To make sure it is really you, we will send a separate email to this address with a link that confirms it. It works in any web browser, so you do not need the app. Nothing is deleted until you confirm.",
      "Once you confirm, your account is set to be deleted 30 days later. Until then you can change your mind.",
      "If you can open the app, you can also do this yourself: Settings, Your data, Delete account.",
    ],
    safety: "Did not ask for this? You can ignore this email. Nothing happens without your confirmation.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: CUS-14. Second step of the D-042 email route, sent after deletion-request-received.
  // The link opens /delete-account/confirm on earlyletters.com (web route still to build), which shows the
  // date and one button. Pressing it files the request with source 'support' (DATA-REQ-021); the normal
  // account-deletion-scheduled receipt follows. Works with no app and on any device.
  'deletion-confirm': {
    id: 'deletion-confirm',
    subject: "Confirm your deletion request",
    preheader: "One button on a web page. It works in any browser, with or without the app.",
    heading: "Confirm you want to delete your account",
    body: [
      `You asked us to delete the ${brand.name} account for {email}. Request number: {requestId}.`,
      "Tap the button to open a page in your web browser. It shows the date your account will be deleted and has one button, Delete my account. You do not need the app or an iPhone.",
      "Once you confirm, your account is set to be deleted 30 days later. Until then you can cancel by replying to any of our emails, or in the app if you can open it.",
      "The link works once, for {expiresIn}. Nothing is deleted unless you press the button on the page.",
    ],
    cta: { label: "Confirm deletion", urlVar: "{confirmDeleteUrl}" },
    fallback: FALLBACK,
    safety: "Did not ask for this? You can ignore this email. Your account stays exactly as it is.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: CNT-08, CUS-04, founder instruction of 3 Oct 2026. To the remaining parent of each book
  // shared with a co-parent who asked to delete their account, within 1 hour of
  // request_account_deletion(). Facts from DELETION_AND_EXPORT_SPEC 2.6.1 step 6 and 2.6.2: the leaver's
  // letters are tombstoned at request and leave the book at once; they come back if the leaver cancels
  // within 30 days; the book and the remaining parent's letters are untouched (DATA-REQ-020). The spec
  // does not cover telling the remaining parent or giving them a copy: see REVIEW_NOTES 3.18.
  // No child name (E-1). {coParentName} is already shown to this person in the app (E-2).
  'coparent-left': {
    id: 'coparent-left',
    subject: "A change in a book you share",
    preheader: "{coParentName} is closing their account. Your own letters are not affected.",
    heading: "Some letters are no longer in the book",
    body: [
      `{coParentName} asked to close their ${brand.name} account on {requestDate}. The letters and recordings they wrote are no longer in the book you share.`,
      "The book stays with you, as it was. Every letter you wrote is still there, and you can keep writing.",
      "If {coParentName} changes their mind before {deletionDate}, their letters come back to the book. After that date they are deleted.",
      "Each letter belongs to the person who wrote it, so we cannot give you a copy. If you would like one, you can ask {coParentName} to export theirs and share it with you before {deletionDate}.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: Privacy Policy section 14 (45 days, one extension of 45). Sent by support.
  'privacy-request-received': {
    id: 'privacy-request-received',
    subject: "We have your privacy request",
    preheader: "A person is on it. We reply within 45 days, and usually much sooner.",
    heading: "Thank you, we have your request",
    body: [
      "We received your request about your information. Request number: {requestId}.",
      "We answer within 45 days. If we need longer, we will tell you before then, and finish within 45 more.",
      "To make sure it is really you, we may first send a sign-in email to this address.",
      "Some things are quickest in the app. Settings, Your data, Export everything gives you every letter and recording, any time, free.",
    ],
    safety: "Did not ask for this? Reply to this email and let us know.",
    category: 'account',
    kind: 'transactional',
  },

  // v1.1 (DATA-REQ-054, BL-309). Server-built export; link valid 7 days. Notice text from DATA-REQ-056.
  'export-ready': {
    id: 'export-ready',
    subject: "Your copy is ready to download",
    preheader: "Every letter and recording, in open formats that work without the app.",
    heading: "Your letters, ready to keep",
    body: [
      "The copy you asked for is ready. It holds your letters, your recordings and a PDF of the book.",
      "Everything opens without the app, in any web browser, with a guide to every file.",
      "The download link works for {expiresIn}. After that, you can ask for a new one any time.",
      "This file holds your letters and recordings, unlocked. Keep it somewhere private.",
    ],
    cta: { label: "Download your copy", urlVar: "{exportUrl}" },
    fallback: FALLBACK,
    safety: "Did not ask for this? Reply to this email and we will look into it.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: POLICY_VERSIONING section 5, major changes only, on published_at, 30 days or more
  // before effective_at. Sent to every account holder, Apple relay included, even with marketing off.
  'policy-update': {
    id: 'policy-update',
    subject: "An update to our {documentName}",
    preheader: "What is changing, in plain words, and the date it takes effect.",
    heading: "Our {documentName} changes on {effectiveDate}",
    body: [
      "We are updating our {documentName}. Here is what changes, in plain words:",
      "{changeSummary}",
      "The new version takes effect on {effectiveDate}. You can read it in full at {documentUrl}, and see every change at {changesUrl}.",
      "If the change needs your agreement, the app will ask you once, on or after {effectiveDate}.",
      "You can export everything or delete your account at any time, in Settings, Your data.",
    ],
    cta: { label: "Read the new version", urlVar: "{documentUrl}" },
    fallback: FALLBACK,
    category: 'legal',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

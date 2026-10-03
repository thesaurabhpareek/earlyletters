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
 *   {exportUrl}        signed download link for a server export (v1.1)
 *   {expiresIn}        how long a link works, in words, e.g. "7 days"
 *   {documentName}     "Privacy Policy", "Terms of Service", ...
 *   {documentUrl}      the new version, published
 *   {changesUrl}       the changes page for that version
 *   {changeSummary}    the plain-language summary approved with the version (POLICY_VERSIONING s.5)
 *   {effectiveDate}    effective_at of the new version
 */
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const OPEN_APP = { label: "Open Early Letters", urlVar: "{appUrl}" };
const PLUS_NOT_CANCELLED =
  "If you have Plus, deleting your account does not cancel it. Billing continues through Apple until you cancel: on your iPhone, open Settings, tap your name, then Subscriptions.";
const RECORDS_KEPT =
  "A few records stay because the law asks us to keep them: a record of what you agreed to, without your name, for 3 years, and purchase records for 7 years.";

export const accountEmails = {
  // L2 review: DATA-REQ-025 receipt 1. States the completion date (Apple 5.1.1(v)) and the Plus notice (DATA-REQ-022).
  'account-deletion-scheduled': {
    id: 'account-deletion-scheduled',
    subject: "Your account is set to be deleted",
    preheader: "On {deletionDate}. Until then you can save a copy, or change your mind.",
    heading: "We have your request",
    body: [
      "You asked to delete your Early Letters account on {requestDate}. Request number: {requestId}.",
      "Your account, letters and recordings will be deleted from our servers on {deletionDate}. Our backups clear 7 days after that, and our service providers delete their copies within 45 days of your request.",
      "Until then, you can sign in to export a copy of everything, free, or to cancel the request. Both are in Settings, Your data.",
      "Letters you wrote in a book you share with a co-parent leave that book. The book stays with them.",
      "If you are the only parent of a book that family members write to, they can save a copy of their own letters before it is deleted.",
      PLUS_NOT_CANCELLED,
      RECORDS_KEPT,
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
      "You cancelled request {requestId} to delete your Early Letters account. Nothing will be deleted.",
      "Your letters and books are back, for you and for the family you share them with.",
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
      "Anything you exported stays with you. Letters already on family members' phones stay with them.",
      "If you have Plus, it is not cancelled by this. Billing continues through Apple until you cancel: on your iPhone, open Settings, tap your name, then Subscriptions.",
      "We keep only what the law asks: a record of what you agreed to, without your name, for 3 years, and purchase records for 7 years.",
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
      "If family members wrote in this book, we have let them know, so they can save a copy of their own letters.",
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
    preheader: "Every letter is back, and the family who write to it can see it again.",
    heading: "Nothing will be deleted",
    body: [
      "You cancelled the request to delete one of your books. Every letter and recording in it is back.",
      "If family members write to this book, they can see it again, and we have let them know.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    safety: "Did not cancel this yourself? Reply to this email and we will help.",
    category: 'account',
    kind: 'transactional',
  },

  // L2 review: D-042 email route. Sent by support from the shared inbox before identity is confirmed
  // (Privacy Policy section 14: confirm by a sign-in link to the account address).
  'deletion-request-received': {
    id: 'deletion-request-received',
    subject: "We have your deletion request",
    preheader: "One more step to confirm it is you. Nothing is deleted until then.",
    heading: "Thank you, we have your request",
    body: [
      "We received a request to delete the Early Letters account for this email address. Request number: {requestId}.",
      "To make sure it is really you, we will send a separate sign-in email to this address. Open it to confirm. Nothing is deleted until you do.",
      "Once you confirm, your account is set to be deleted 30 days later. Until then you can export a copy of everything, or change your mind.",
      "If you can open the app, you can also do this yourself: Settings, Your data, Delete account.",
    ],
    safety: "Did not ask for this? You can ignore this email. Nothing happens without your confirmation.",
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
      "Questions? Reply to this email. A person reads every message.",
    ],
    cta: { label: "Read the new version", urlVar: "{documentUrl}" },
    fallback: FALLBACK,
    category: 'legal',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

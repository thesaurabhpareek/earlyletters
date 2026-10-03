/**
 * Family emails (lane C2). Catalog: docs/emails/CATALOG.md section 6.
 *
 * Deliberately short. Invites are shared by the parent from their own phone, never emailed by us
 * (CATALOG E-3). Removal, leaving, declined invites and letters kept aside send nothing (E-5).
 * Family letters and "added to the book" are push and in-app only.
 *
 * Readers are often grandparents: fewer words, one instruction per sentence, no app jargon.
 * No child names in email (E-1); {parentName} is the parent's display name, already shown to
 * this person inside the app (E-2).
 *
 * Placeholders: {parentName}, {deletionDate}, {appUrl}.
 */
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const OPEN_APP = { label: "Open Early Letters", urlVar: "{appUrl}" };

export const familyEmails = {
  // L2 review: B-REQ-016, DATA-REQ-053. To each contributor within 1 hour of a sole parent deleting
  // the book. v1.0 points to in-app export; the server export link (family-export-ready) is v1.1.
  'family-book-closing': {
    id: 'family-book-closing',
    subject: "Save a copy of your letters",
    preheader: "{parentName} is deleting a book you write to. Your letters are yours to keep.",
    heading: "Your letters are yours to keep",
    body: [
      "{parentName} has decided to delete the book of letters you write to. It will be deleted on {deletionDate}.",
      "Every letter you wrote belongs to you. You can save a copy, with your recordings, before then.",
      "Open Early Letters on your phone. Tap Settings. Then tap Your data, and Export everything.",
      "If {parentName} changes their mind before {deletionDate}, the book stays, and we will let you know.",
      "Thank you for every word you gave this book.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    category: 'family',
    kind: 'transactional',
  },

  // Only to people who received family-book-closing for the same request.
  'family-book-restored': {
    id: 'family-book-restored',
    subject: "Good news about the book",
    preheader: "{parentName} is keeping the book after all. Your letters are right where they were.",
    heading: "The book is staying",
    body: [
      "{parentName} has decided to keep the book you write to. Nothing will be deleted.",
      "Your letters are back in it, and you can keep writing whenever you like.",
    ],
    cta: OPEN_APP,
    fallback: FALLBACK,
    category: 'family',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

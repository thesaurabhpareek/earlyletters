/**
 * Family emails (lane C2). Catalog: docs/emails/CATALOG.md section 6.
 *
 * Deliberately short. Family invites are shared by the parent from their own phone (CATALOG E-3). The one
 * exception is `coparent-invite`: when a parent types their co-parent's email address in the app, we send
 * the invite link for them (ported from develop's CoParentInvite, D-055). Removal, leaving, declined
 * invites and letters kept aside send nothing (E-5).
 * Family letters and "added to the book" are push and in-app only.
 *
 * Readers are often grandparents: fewer words, one instruction per sentence, no app jargon.
 * No child names in email (E-1); {parentName} is the parent's display name, already shown to
 * this person inside the app (E-2).
 *
 * Placeholders: {parentName}, {deletionDate}, {appUrl}; coparent-invite: {inviter} (what the inviter signs
 * as, e.g. Mama, never the child's name) and {inviteUrl} (the one-time invite link, 7 days, D-020).
 *
 * v1.1: family-book-closing and family-book-restored reach family members beyond the co-parent, who
 * join in v1.1 (Brief decision 5). In v1.0 no book has such members, so neither is sent.
 */
import { brand } from '@scribe/brand';
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const OPEN_APP = { label: `Open ${brand.name}`, urlVar: "{appUrl}" };

export const familyEmails = {
  // Ported from develop's CoParentInvite (D-055: co-parent only at v1.0). Sent when a parent enters their
  // co-parent's address in the app. No child's name: the invitee sees it inside the app after joining.
  // Co-parent invites expire in 7 days (D-020, K-18).
  'coparent-invite': {
    id: 'coparent-invite',
    subject: "{inviter} invited you to write together",
    preheader: "One book of letters to your child, with both your voices in it.",
    heading: "{inviter} would like you to write together",
    body: [
      `{inviter} is keeping a memory book of letters to your child on ${brand.name}, and invited you to join as a co-parent.`,
      "You each speak or type your own letters, signed in your own name, in the same book. Only the two of you can read it.",
      "The link opens the app on your iPhone, or helps you get it. It works once, for 7 days.",
    ],
    cta: { label: "Join the book", urlVar: "{inviteUrl}" },
    fallback: FALLBACK,
    safety: "Not expecting this? You can ignore this email. Nothing happens unless you join.",
    whyText: `You are getting this email because {inviter} entered your address in ${brand.name}.`,
    category: 'family',
    kind: 'transactional',
  },

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
      `Open ${brand.name} on your phone. Tap Settings. Then tap Your data, and Export everything.`,
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

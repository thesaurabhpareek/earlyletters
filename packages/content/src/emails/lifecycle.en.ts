/**
 * Onboarding and lifecycle emails (lane C2). Catalog: docs/emails/CATALOG.md section 5.
 *
 * There is almost nothing here on purpose: no drips, no tips series, no re-engagement, no
 * "we miss you". The app teaches in place and its reminders are local and user-controlled.
 * C1's `welcome` (auth.en.ts) greets a parent who starts a book. People who join a book by
 * invite get one of these instead (CATALOG E-4), sent once per account, ever.
 *
 * No child names in email (E-1). Placeholders: {signsAs} (what the child calls them, e.g. Nani),
 * {parentName} (the inviting parent's display name), {appUrl}.
 */
import { brand } from '@scribe/brand';
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";

export const lifecycleEmails = {
  // v1.1: family members beyond the co-parent join in v1.1 (Brief decision 5); not sent in v1.0.
  // First sign-in that came from a Family (contributor) invite. Written for grandparents first.
  // Kind is our reading (completes account creation, no promotion); L2 confirms.
  'welcome-family': {
    id: 'welcome-family',
    subject: "Welcome, {signsAs}",
    preheader: "{parentName} would love your letters in the book. Here is how to start.",
    heading: "Your stories belong in this book",
    body: [
      "{parentName} is keeping a book of letters for a child you love, and would like yours in it.",
      `To write, open ${brand.name} and tap the red circle.`,
      "Then just talk, in the language you speak. A minute is plenty.",
      "Your words are kept exactly as you said them. Your voice is kept too.",
      "{parentName} reads your letters first, then adds them to the book. Until then, only the parents can see them.",
    ],
    cta: { label: "Write a letter", urlVar: "{appUrl}" },
    fallback: FALLBACK,
    category: 'lifecycle',
    kind: 'transactional',
  },

  // First sign-in that came from a Co-parent invite. Two parents are equals (PRD B F8).
  'welcome-coparent': {
    id: 'welcome-coparent',
    subject: "Welcome to the book",
    preheader: "You and {parentName} now keep it together, as equals.",
    heading: "A book with two voices now",
    body: [
      "{parentName} invited you to keep the book together. You can write letters of your own and read every letter in the book.",
      "Your letters are yours, and {parentName}'s are theirs. Neither of you can change the other's words.",
      "We never rewrite your words. Every sentence is one you actually said.",
      "When you have a minute, open the app and talk. A sentence is plenty.",
    ],
    cta: { label: "Open the book", urlVar: "{appUrl}" },
    fallback: FALLBACK,
    category: 'lifecycle',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

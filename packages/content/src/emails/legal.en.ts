/**
 * Legal lines for email footers and the unsubscribe flow (lane L2).
 * Reasoning, sources and the classification of every email: docs/emails/COMPLIANCE.md.
 *
 * Contract (docs/emails/BRIEF.md): `postalLine`, `unsubscribe`, `whyYouGotThis`.
 * Everything after those three keys is an optional addition; nothing depends on it yet.
 *
 * Placeholders, filled by the sender:
 *   {postalAddress}   the publisher's PO box or private mailbox (PMB). Never a home address (D-004).
 *                     Required in commercial email only (15 U.S.C. 7704(a)(5)(A)(iii)).
 *   {unsubscribeUrl}  signed, per-recipient, per-list HTTPS link. Same URL as the
 *                     List-Unsubscribe header (RFC 8058). Works for at least 30 days after sending.
 *
 * Rules: plain text, straight quotes, no dashes, no emoji, no fear or guilt.
 * Transactional email never carries an unsubscribe line: those emails cannot be
 * turned off, and offering a link that does nothing would mislead.
 */

import { brand } from '@scribe/brand';

export const emailLegal = {
  /** Commercial footer only. Filled with a PO box or PMB, never the family home. */
  postalLine: "{postalAddress}",

  /** Commercial footer only. One line, one step, no login, no reason asked. */
  unsubscribe: "Rather not get these? Unsubscribe in one step: {unsubscribeUrl}",

  /** One line near the top of the footer, saying why this email arrived. */
  whyYouGotThis: {
    transactional:
      `You are getting this because it is about your ${brand.name} account. We only send what you need to know.`,
    commercial:
      `You are getting this because you asked for news from ${brand.name}. Your account and your books are not affected if you unsubscribe.`,
  },

  /* Optional additions (not in the brief contract). */

  /** For templates that render the unsubscribe as a link rather than a raw URL. */
  unsubscribeLink: {
    lead: "Rather not get these?",
    label: "Unsubscribe",
    urlVar: "{unsubscribeUrl}",
  },

  /** The page the unsubscribe link opens: one button, no sign-in, no questions. */
  unsubscribePage: {
    heading: "Stop these emails?",
    body: `You will stop getting news from ${brand.name}. Account emails, like sign-in links and plan reminders, still come, because you need them.`,
    button: "Unsubscribe",
    done: "Done. You will not get these emails again. Changed your mind? You can sign up again any time.",
    error: "That did not go through. Please try again, or reply to any of our emails and we will do it for you.",
  },
} as const;

export type EmailLegal = typeof emailLegal;

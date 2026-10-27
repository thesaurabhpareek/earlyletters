/**
 * Recording backup and recovery key emails (PRD V2 F08 6.5 C3 and C7; stream S05).
 * Sent by the escrow function from the separate escrow project, never by the app. The
 * function fills the placeholders; packages/emails renders these to the HTML the function
 * sends (supabase/functions/escrow/email/templates.ts, from scripts/export-escrow.ts).
 *
 * The recovery key emails are the owner's record of every use of the key, so they say plainly
 * what happened, when, and what to do if it was not them. Claims stay inside what the system
 * proves (F08 6.5 C, F17-REQ-027): we email every time our recovery service uses the key; we
 * never say "only you", "only your family", "end-to-end" or that every access is logged.
 * Counsel approves these lines before an outside family turns backup on (M16).
 *
 * Placeholders (filled by the escrow function):
 *   {when}       date and time of the event, in words, UTC ("Thursday, October 29, 2026 at 9:14 pm UTC")
 *   {device}     plain device name, "an iPhone"; never a model, name or location
 *   {holdUntil}  when the recordings start coming back if nobody approves sooner, same format as {when}
 *   {stopUrl}    the single-use stop link (earlyletters.com/stop with the token after #)
 *   {expiresIn}  how long the stop link works, in words ("7 days", as the database sets it)
 *   {requestId}  a short reference for support, never a person or book id
 */
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const NEVER_ASK = "We will never ask for a sign-in code or a password, by email, phone, text or chat.";
const EVERY_USE = "We send you an email like this every time our recovery service uses your recovery key.";

export const backupEmails = {
  // At request time (F08 6.5 C3): a new phone asked for the recordings. The owner can stop it.
  'backup-restore-requested': {
    id: 'backup-restore-requested',
    subject: "A new iPhone asked for your recordings",
    preheader: "If this was you, there is nothing to do. They start coming back by {holdUntil}.",
    heading: "Was this you?",
    body: [
      "On {when}, someone signed in to your account on {device} and asked for your recording backup.",
      "If it was you, there is nothing to do. Your recordings will start coming back to that iPhone by {holdUntil}. If you still have your old iPhone, open the app there and tap Yes, it's mine to start sooner.",
      "If it was not you, tap the button below. We will cancel the request and sign out every device. Your recordings stay where they are. The link works once, for {expiresIn}.",
    ],
    facts: [
      { label: "Comes back by", value: "{holdUntil}" },
      { label: "Reference", value: "{requestId}" },
    ],
    cta: { label: "Stop this and sign out", urlVar: "{stopUrl}" },
    fallback: FALLBACK,
    safety: NEVER_ASK,
    category: 'account',
    kind: 'transactional',
  },

  // At release (F08 6.5 C7): the recovery key was used for this account's restore.
  'backup-key-used': {
    id: 'backup-key-used',
    subject: "We used your recovery key",
    preheader: "Sent to the new iPhone you signed in on, encrypted and sealed to it.",
    heading: "Your recordings are on their way",
    body: [
      "On {when}, our recovery service used your recovery key to send your recording backup to {device}, the new iPhone you signed in on.",
      "Your recordings travel encrypted, sealed to that iPhone.",
      EVERY_USE,
      "If you did not sign in on a new iPhone, reply to this email and we will help you.",
    ],
    facts: [{ label: "Reference", value: "{requestId}" }],
    safety: NEVER_ASK,
    category: 'account',
    kind: 'transactional',
  },

  // Once per account per key rotation (F08 6.5 C7, G4).
  'backup-key-rotated': {
    id: 'backup-key-rotated',
    subject: "We updated your recovery key",
    preheader: "A routine change to the key that protects your recording backup. Nothing to do.",
    heading: "We updated your recovery key",
    body: [
      "On {when}, we moved your recording backup to a new recovery key. This is routine, and there is nothing for you to do.",
      "To make the change, our recovery service opened your old key and sealed it under the new one. Your recordings stayed encrypted and never left our service.",
      EVERY_USE,
    ],
    safety: NEVER_ASK,
    category: 'account',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

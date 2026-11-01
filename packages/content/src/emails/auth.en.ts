/**
 * Sign-in and account security emails (lane C1, docs/emails/BRIEF.md).
 *
 * Readers are often tired, on a phone, maybe at 2am. One action per email,
 * short sentences, and the button says exactly what happens.
 * Wit only where it lowers stress (account-create-attempt, sign-in-trouble);
 * security notices stay plain.
 *
 * Placeholders (filled by the sender; D2 maps them to Supabase Go variables):
 *   {email}       the address this email was sent to
 *   {oldEmail}    previous sign-in address           (Supabase .OldEmail / .Email)
 *   {newEmail}    new sign-in address                 (Supabase .NewEmail / .Email)
 *   {signInUrl}   one-time sign-in link               (Supabase .ConfirmationURL)
 *   {verifyUrl}   one-time email confirmation link    (Supabase .ConfirmationURL)
 *   {confirmUrl}  one-time email change confirmation  (Supabase .ConfirmationURL)
 *   {appUrl}      universal link that opens the app
 *   {code}        6-digit one-time code               (Supabase .Token)
 *   {expiresIn}   human duration, e.g. "1 hour"; L3 sets the values
 *   {device}      plain device name, e.g. "an iPhone"; never a location
 *   {when}        date and time of the event, in words, in the account holder's time zone with
 *                 its short name, e.g. "Saturday, October 3, 2026 at 9:14 pm ET" (CUS-19)
 *
 * Rules: no password is ever asked for (there is none). Every code-bearing
 * email says we never ask for codes by phone, text or chat. Copy never says
 * whether an account exists to anyone but the inbox owner (enumeration-safe).
 */
import { brand } from '@scribe/brand';
import { en } from '../strings.en';
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const CODE_LABEL = "Or enter this code in the app";
const NEVER_ASK = "We will never ask for this code by phone, text or chat.";

export const authEmails = {
  // Not applicable while sign-in is one passwordless call (signInWithOtp with shouldCreateUser: true): there is
  // no sign-up branch, so no "create attempt" event exists and no sender is planned (SIGN-05, CATALOG section 4).
  // Kept so a future sign-up flow has reviewed words. Supabase's magic_link email already covers a known address.
  'account-create-attempt': {
    id: 'account-create-attempt',
    subject: "You already have a book with us",
    preheader: "Someone tried to start a new account with this email. Sign in instead.",
    heading: "Your book is already here",
    body: [
      "Someone, most likely you, just tried to start a new account with {email}. There is already one, so we did not make a second.",
      "Easy to do on very little sleep. Your letters are right where you left them.",
      "Tap below to sign in instead. The link works once, for {expiresIn}.",
      "If you first joined with Apple or Google, tap Sign in with Apple or Sign in with Google in the app instead.",
    ],
    cta: { label: "Sign in to my book", urlVar: "{signInUrl}" },
    code: { label: CODE_LABEL, codeVar: "{code}" },
    fallback: FALLBACK,
    safety: `Not you? You can ignore this email. Nothing about your account has changed. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },

  'verify-email': {
    id: 'verify-email',
    subject: "Confirm your email to start your book",
    preheader: "One tap and you are in. The link and the code both work for {expiresIn}.",
    heading: "One tap to confirm it is you",
    body: [
      "Tap the button to confirm {email} and open your book.",
      "Reading this on another device? Enter the code in the app instead.",
      "The link and the code work once, for {expiresIn}.",
    ],
    cta: { label: "Confirm my email", urlVar: "{verifyUrl}" },
    code: { label: CODE_LABEL, codeVar: "{code}" },
    fallback: FALLBACK,
    safety: `Did not ask for this? You can ignore this email. Nothing happens unless someone uses the link or the code. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },

  'sign-in-link': {
    id: 'sign-in-link',
    subject: "Your sign-in link and code",
    preheader: "Tap the link on the phone you asked from, or type the code. Both work for {expiresIn}.",
    heading: "Tap to open your book",
    body: [
      // SIGN-07: the link works only on the phone that asked for this email (ADR 0023), whatever the app's state.
      "Tap the button on the phone you asked from.",
      "On another device? Type the code in the app instead.",
      "The link and the code work once, for {expiresIn}.",
    ],
    cta: { label: "Sign in to my book", urlVar: "{signInUrl}" },
    code: { label: CODE_LABEL, codeVar: "{code}" },
    fallback: FALLBACK,
    safety: `Did not ask for this? You can ignore it. No one can sign in without this link or code. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },

  // After the first successful sign-in. Kept free of offers so it stays
  // transactional (L2 confirms). Also reaches family members, so no {child}.
  welcome: {
    id: 'welcome',
    subject: "Welcome. The first page is yours.",
    preheader: "A minute of talking is plenty. How to begin, and what we promise.",
    heading: `Welcome to ${brand.name}`,
    body: [
      "You are in. Open the app, tap the red circle and talk.",
      "A minute is plenty. A quiet day is fine too.",
      "Every letter is kept as you said it. We only fix small slips, like an um, a repeat or a misheard word, and mark each one, so you can put it back. We never rewrite your words.",
      // The privacy promise, word for word (D-061, VOICE.md "How we talk about privacy": the welcome email says it once).
      en.trust.promise,
      "Only you, and your co-parent if you invite them, can read them in the app. Our staff look only in the rare cases our Privacy Policy describes.",
      "Ideas are welcome too. Just reply.",
    ],
    cta: { label: `Open ${brand.name}`, urlVar: "{appUrl}" },
    fallback: FALLBACK,
    safety: "Did not sign up? Reply to this email and we will fix it.",
    category: 'auth',
    kind: 'transactional',
  },

  // Deferred (SIGN-05): no sender exists and the app's "Trouble signing in?" shows help text only; the expired
  // path is "Send a new email", which sends sign-in-link again. Same text whatever the address, so it never tells a
  // stranger whether an account exists.
  'sign-in-trouble': {
    id: 'sign-in-trouble',
    subject: "A new sign-in link for you",
    preheader: "A fresh link and code, and the quick fixes for the usual snags.",
    heading: "Back to your book",
    body: [
      "Tap the button on the phone you asked from. The link and the code work once, for {expiresIn}.",
      "On another device? Type the code below in the app instead.",
      "Joined with Apple or Google? Use that button in the app. If you chose Hide My Email, your book is under Apple's private address, and Sign in with Apple takes you straight there.",
      "See an empty book? You may have signed in a different way from the first time. Sign out, then use the way you first joined: Apple, Google, or the same email.",
      "Looking for a password? There is not one, and we will never ask you for one.",
    ],
    cta: { label: "Sign in to my book", urlVar: "{signInUrl}" },
    code: { label: CODE_LABEL, codeVar: "{code}" },
    fallback: FALLBACK,
    safety: `Did not ask for this? You can ignore it. Nothing changes without this link or code. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },

  // Security notices below: plain, calm, no jokes. One action: reply.

  // Supabase security notification "Sign-in method linked".
  'apple-account-linked': {
    id: 'apple-account-linked',
    subject: "Sign in with Apple is now on your account",
    preheader: "You can now sign in with your Apple Account. Not you? Reply with Not me.",
    heading: "Sign in with Apple was added",
    body: [
      `You can now sign in to ${brand.name} with your Apple Account, as well as with {email}.`,
      "If this was you, there is nothing else to do.",
    ],
    safety: "Was this not you? Reply to this email right away, with Not me in the subject, and we will help you secure your account. We will never ask for a code or a password.",
    category: 'auth',
    kind: 'transactional',
  },

  // v1.0: Sign in with Apple, Google and email link (founder decision 4, docs/agents/BRIEF-2026-10-03.md; supersedes D-044 timing).
  // Supabase security notification "Sign-in method linked".
  'google-account-linked': {
    id: 'google-account-linked',
    subject: "Sign in with Google is now on your account",
    preheader: "You can now sign in with your Google Account. Not you? Reply with Not me.",
    heading: "Sign in with Google was added",
    body: [
      `You can now sign in to ${brand.name} with your Google Account, as well as with {email}.`,
      "If this was you, there is nothing else to do.",
    ],
    safety: "Was this not you? Reply to this email right away, with Not me in the subject, and we will help you secure your account. We will never ask for a code or a password.",
    category: 'auth',
    kind: 'transactional',
  },

  // A passkey added after sign-in (founder decision 4; content review CNT-08). Same shape as apple-account-linked.
  // No Supabase template; custom sender on the passkey-registered event.
  'passkey-added': {
    id: 'passkey-added',
    subject: "A passkey was added to your account",
    preheader: "You can now sign in with a passkey on {device}. Not you? Reply with Not me.",
    heading: "A passkey was added",
    body: [
      `You can now sign in to ${brand.name} with a passkey on {device}, as well as with {email}.`,
      "If this was you, there is nothing else to do.",
    ],
    safety: "Was this not you? Reply to this email right away, with Not me in the subject, and we will help you secure your account. We will never ask for a code or a password.",
    category: 'auth',
    kind: 'transactional',
  },

  // No Supabase template exists for this one; it needs a custom sender.
  'new-device-sign-in': {
    id: 'new-device-sign-in',
    subject: "A new sign-in to your account",
    preheader: "If this was you, there is nothing to do. If not, reply with Not me.",
    heading: "Did you just sign in on {device}?",
    body: [
      `Your ${brand.name} account was signed in on {device}, {when}.`,
      "If that was you, there is nothing to do.",
      "If it was not, reply to this email with Not me in the subject. We will sign that device out and help you secure your account.",
    ],
    safety: "We will never ask for a sign-in code or a password, by email, phone, text or chat.",
    category: 'auth',
    kind: 'transactional',
  },

  // Supabase security notification "Email address changed", sent to the old address.
  'email-changed-old-address': {
    id: 'email-changed-old-address',
    subject: "Your sign-in email was changed",
    preheader: "Your account now uses a new address. If this was you, there is nothing to do.",
    heading: "Your sign-in email has changed",
    body: [
      `The email for your ${brand.name} account changed from {oldEmail} to {newEmail}.`,
      "Your letters, recordings and books are all still there. Sign-in links now go to the new address.",
      "If this was you, there is nothing else to do.",
    ],
    safety: "Was this not you? Reply to this email right away, from this address, with Not me in the subject, and we will help you put it right. We will never ask for a code or a password.",
    category: 'auth',
    kind: 'transactional',
  },

  // Supabase "Change email address", sent to the new address to confirm it.
  'email-changed-new-address': {
    id: 'email-changed-new-address',
    subject: "Confirm your new email address",
    preheader: "One tap and your sign-in links come here from now on. Works for {expiresIn}.",
    heading: "Is this your new address?",
    body: [
      `You asked to sign in to ${brand.name} with {newEmail} instead of {oldEmail}.`,
      "Tap below to confirm. Your letters and books come with you. Nothing else changes.",
      "The link and the code work once, for {expiresIn}.",
    ],
    cta: { label: "Confirm new email", urlVar: "{confirmUrl}" },
    code: { label: CODE_LABEL, codeVar: "{code}" },
    fallback: FALLBACK,
    safety: `Did not ask for this? You can ignore this email. The address only changes if someone uses the link or the code. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },

  // Supabase "Reauthentication": a code to confirm account deletion in the app
  // (D-042, App Review 5.1.1(v)). If reauthentication is ever used for any other
  // action, this copy must become general.
  'reauthenticate-code': {
    id: 'reauthenticate-code',
    subject: "Your code to confirm account deletion",
    preheader: "Enter it in the app to finish. It works for {expiresIn}. Keep it to yourself.",
    heading: "Your confirmation code",
    body: [
      `You asked to delete your ${brand.name} account. To make sure it is really you, enter this code in the app.`,
      "Want a copy first? You can export every letter and recording, free, from Settings before you confirm.",
      "The code works once, for {expiresIn}.",
    ],
    code: { label: "Your code", codeVar: "{code}" },
    safety: `Did not ask for this? Do not enter or share the code, and your account stays exactly as it is. ${NEVER_ASK}`,
    category: 'auth',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

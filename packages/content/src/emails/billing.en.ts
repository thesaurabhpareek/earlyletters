/**
 * Plus billing and subscription emails (lane C2). Catalog: docs/emails/CATALOG.md section 7.
 * Schedule and windows: docs/DECISIONS.md D-022. Facts: docs/legal/subscription-terms.md 1.3.0.
 *
 * Trigger (D-080, founder, 3 Oct 2026): the app reports subscription STATUS ONLY to our server (plan,
 * trial end date, renewal date, cancelled flag), when a purchase or trial completes in the app and on each
 * launch. Never payment or card data, never receipts; no App Store Server Notifications. Only the device
 * whose transaction is the person's own purchase reports; a Family Sharing member's app does not, so
 * these emails go only to the payer (legal review LGL-12). A cancellation made in iOS Settings is seen
 * only when the app next opens, so every reminder carries ALREADY_CANCELLED.
 *
 * Every notice states: the plan, the price and billing period, the renewal or trial-end date,
 * the cancel-by date where it matters, that it renews automatically until cancelled, the cancel
 * steps in words plus {manageUrl}, and that letters and recordings stay free to read, play and
 * export. No offers, no countdowns, no "are you sure". Dates, never "in 3 days".
 * No child names in email (CATALOG decision E-1).
 *
 * Placeholders (filled by the sender, payments engineer):
 *   {planName}             "Plus Monthly" or "Plus Annual"
 *   {price}                localized store price, e.g. "$3.99"
 *   {billingPeriod}        "a month" or "a year"
 *   {periodUnit}           "month" or "year"
 *   {agreedDate}           date of purchase or trial start (consent record, D-049)
 *   {trialEndDate}         date the free trial ends and the first charge happens (E)
 *   {renewalDate}          date of the next renewal (E)
 *   {cancelByDate}         the last calendar day, in the recipient's time zone, that ends before C = E - 24h
 *                          (Hawaii time if the time zone is unknown; COMPLIANCE.md 5.3)
 *   {accessEndDate}        last day Plus works after renewal is turned off or Plus ends
 *   {effectiveDate}        date a price change takes effect
 *   {oldPrice} {newPrice}  current and new localized prices
 *   {manageUrl}            https://earlyletters.com/cancel, our page explaining how to cancel with Apple
 *                          (COMPLIANCE.md 11; web route still to build)
 *
 * Dates in subjects are rendered without the weekday ("December 3"), so filled subjects stay within
 * 45 characters (content review CNT-15). Bodies keep the full date.
 *   {subscriptionTermsUrl} published Subscription terms
 *
 * Names (BRAND.md glossary): the product is "Plus", never "Early Letters Plus" or "Book Plus"; plans are
 * "Plus Monthly" and "Plus Annual" (must equal the App Store display names). What we send is a "reminder",
 * never a "note" ("note" only means a short letter someone makes). The brand name comes from packages/brand.
 *
 * Every entry here is legal-sensitive. Counsel confirms wording once (BL-104).
 */
import { brand } from '@scribe/brand';
import type { EmailCopy } from './types';

const FALLBACK = "Button not working? Copy and paste this link:";
const CANCEL_STEPS =
  `To cancel, on your iPhone open Settings, tap your name, then Subscriptions, then ${brand.name}. Or in the app: Settings, Plan, Manage subscription.`;
const STAYS_FREE =
  "Whatever you decide, every letter and recording you made stays yours to read, play and export, free.";
const REFUNDS_AND_TERMS =
  "Refunds are handled by Apple at reportaproblem.apple.com. The full Subscription terms are at {subscriptionTermsUrl}.";
const PLUS_INCLUDES =
  "Plus includes Read together and books for more children.";
/** Cancellation policy for the acknowledgments (COMPLIANCE 5.2 A9, legal review LGL-12). */
const NO_PARTIAL_REFUNDS =
  "Unless the law or Apple's policy says otherwise, there are no partial refunds for unused time.";
/** The app reports a cancellation made in iOS Settings only when it next opens (D-080). */
const ALREADY_CANCELLED = "If you have already cancelled, there is nothing to do.";
/** After Plus, recordings are kept only on the phone (customer review CUS-08). */
const EXPORT_NOW_AND_THEN = "Recordings are kept on this phone, and in your iPhone's own backup if you use one. Export a copy now and then.";
/** v1.0 family is the co-parent only (D-055; content review CNT-04). */
const FREE_ALWAYS =
  "Writing, reading, playing your recordings, export and writing together with your co-parent are free, always.";
const MANAGE_CTA = { label: "Manage subscription", urlVar: "{manageUrl}" };

export const billingEmails = {
  // L2 review: D-022 Acknowledgment (trial). Must be a copy the person can keep: offer terms,
  // cancellation policy and how to cancel (Cal. B&P 17602(a)(3)), plus trial end and price after.
  'trial-started': {
    id: 'trial-started',
    subject: "Your free trial of Plus has started",
    preheader: "Free until {trialEndDate}. A copy of what you agreed to, to keep.",
    heading: "Plus is on, free until {trialEndDate}",
    body: [
      "Thank you for trying Plus. This email is your copy of what you agreed to on {agreedDate}. Please keep it.",
      "Your plan: {planName}. The free trial runs until {trialEndDate}.",
      PLUS_INCLUDES,
      "After the trial, Plus renews automatically at {price} {billingPeriod} until you cancel. Apple charges your Apple Account {price} on {trialEndDate}, then again every {periodUnit} on that date, until you cancel.",
      "To avoid being charged, cancel by {cancelByDate}, at least 24 hours before the trial ends. Plus keeps working until the trial ends.",
      CANCEL_STEPS,
      "Deleting the app or your account does not cancel Plus.",
      "We will remind you before the trial ends, by email and in the app.",
      STAYS_FREE,
      NO_PARTIAL_REFUNDS,
      REFUNDS_AND_TERMS,
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    safety: "Did not start a trial? Reply to this email and a person will help.",
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Acknowledgment (purchase with no trial).
  'plus-started': {
    id: 'plus-started',
    subject: "Your Plus plan has started",
    preheader: "A copy of your plan, the price and how to cancel, for your records.",
    heading: "Plus is on. Thank you.",
    body: [
      "Thank you for choosing Plus. This email is your copy of what you agreed to on {agreedDate}. Please keep it.",
      "Your plan: {planName}, {price} {billingPeriod}, charged by Apple to your Apple Account.",
      PLUS_INCLUDES,
      "Plus renews automatically at {price} {billingPeriod} until you cancel. Your next renewal is on {renewalDate}.",
      "To avoid the next charge, cancel by {cancelByDate}, at least 24 hours before it renews. Plus keeps working until then.",
      CANCEL_STEPS,
      "Deleting the app or your account does not cancel Plus.",
      STAYS_FREE,
      NO_PARTIAL_REFUNDS,
      REFUNDS_AND_TERMS,
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    safety: "Did not buy this? Reply to this email and a person will help.",
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Trial week. Trials of 31 days or less that will renew. E-7d, window [E-8d, E-5d].
  'trial-ending-week': {
    id: 'trial-ending-week',
    subject: "Your free trial ends on {trialEndDate}",
    preheader: "Nothing to do if you want to keep Plus, and an easy way out if not.",
    heading: "A reminder before your trial ends",
    body: [
      "Your free trial of {planName} ends on {trialEndDate}.",
      "If you keep it, Plus renews automatically: Apple charges {price} on {trialEndDate}, then again every {periodUnit} on that date, until you cancel.",
      "If you would rather not continue, cancel by {cancelByDate}. Plus keeps working until the trial ends.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
      "We will send one more reminder a few days before the trial ends.",
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Trial ends", value: "{trialEndDate}" },
      { label: "Price after", value: "{price} {billingPeriod}" },
      { label: "Cancel by", value: "{cancelByDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Trial long. Trials over 31 days that will renew. E-18d, window [E-21d, E-16d]
  // (Terms promise "16 to 21 days before it ends").
  'trial-ending-long': {
    id: 'trial-ending-long',
    subject: "Your Plus trial ends on {trialEndDate}",
    preheader: "An early reminder, so the date and the price are never a surprise.",
    heading: "An early reminder about your trial",
    body: [
      "Your free trial of {planName} ends on {trialEndDate}.",
      "If you keep it, Plus renews automatically: Apple charges {price} on {trialEndDate}, then again every {periodUnit} on that date, until you cancel.",
      "If you would rather not continue, cancel by {cancelByDate}. Plus keeps working until the trial ends.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
      "We will send another reminder closer to the date.",
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Trial ends", value: "{trialEndDate}" },
      { label: "Price after", value: "{price} {billingPeriod}" },
      { label: "Cancel by", value: "{cancelByDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Trial final. Every trial that will renew. E-4d 12h, window [E-5d, E-4d].
  // The only billing notice that also sends one push.
  'trial-ending-final': {
    id: 'trial-ending-final',
    subject: "Before your trial ends on {trialEndDate}",
    preheader: "Unless you cancel by {cancelByDate}, Plus renews at {price} on {trialEndDate}.",
    heading: "Your trial ends on {trialEndDate}",
    body: [
      "Your free trial of {planName} ends on {trialEndDate}. This is our last reminder before then.",
      "If you keep it, Plus renews automatically: Apple charges {price} on {trialEndDate}, then again every {periodUnit} on that date, until you cancel.",
      "If you would rather not continue, cancel by {cancelByDate}. Plus keeps working until the trial ends.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Trial ends", value: "{trialEndDate}" },
      { label: "Price after", value: "{price} {billingPeriod}" },
      { label: "Cancel by", value: "{cancelByDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Annual renewal, long. Annual, will renew, not in trial. E-30d 12h, window [E-31d, E-30d].
  'annual-renewal-long': {
    id: 'annual-renewal-long',
    subject: "Plus renews on {renewalDate}",
    preheader: "The price, the date, and how to change it if you want to.",
    heading: "{planName} renews on {renewalDate}",
    body: [
      "Your plan, {planName}, renews automatically on {renewalDate}.",
      "Apple will charge {price} for another year, unless you cancel by {cancelByDate}.",
      PLUS_INCLUDES,
      "If you want to keep it, there is nothing to do.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
      "We will send one more reminder about a week before it renews.",
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Renews on", value: "{renewalDate}" },
      { label: "Price", value: "{price} {billingPeriod}" },
      { label: "Cancel by", value: "{cancelByDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Annual renewal, short. Annual, will renew. E-7d, window [E-8d, E-6d].
  'annual-renewal-short': {
    id: 'annual-renewal-short',
    subject: "Plus renews on {renewalDate}",
    preheader: "Apple charges {price} for another year unless you cancel by {cancelByDate}.",
    heading: "A quick reminder about your plan",
    body: [
      "Your plan, {planName}, renews automatically on {renewalDate}, at {price} for another year.",
      "If you want to keep it, there is nothing to do.",
      "If you would rather not continue, cancel by {cancelByDate}. Plus keeps working until {renewalDate}.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Renews on", value: "{renewalDate}" },
      { label: "Price", value: "{price} {billingPeriod}" },
      { label: "Cancel by", value: "{cancelByDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Anniversary reminder, monthly plans, each subscription year. Also meant to meet
  // the AB 2863 annual reminder (product, charges, how to cancel, in the same medium); counsel confirms.
  'anniversary-reminder': {
    id: 'anniversary-reminder',
    subject: "Your yearly reminder about Plus",
    preheader: "What your plan includes, what it costs, and how to change it.",
    heading: "Once a year, a short reminder about your plan",
    body: [
      "We send this once a year, so nothing about Plus is ever a surprise. There is nothing you need to do.",
      "Your plan: {planName}. It costs {price} {billingPeriod}, charged by Apple, and renews automatically until you cancel. Your next charge is on {renewalDate}.",
      PLUS_INCLUDES,
      "You can cancel any time. Plus keeps working until the end of the {periodUnit} you paid for.",
      CANCEL_STEPS,
      ALREADY_CANCELLED,
      STAYS_FREE,
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: D-022 Price increase. effective-25d, window [-30d, -7d]. Only with the store's
  // opt-in price consent. Kind is our reading (notice of a change in account terms); L2 confirms.
  'price-increase': {
    id: 'price-increase',
    subject: "A change to the price of Plus",
    preheader: "Nothing changes unless you agree. Here is what is new, and when.",
    heading: "The price of Plus changes on {effectiveDate}",
    body: [
      "From {effectiveDate}, your plan, {planName}, will cost {newPrice} {billingPeriod}. Today you pay {oldPrice}.",
      "We never raise your price unless you agree. Apple will ask you to agree to the new price.",
      "If you agree, your plan renews at {newPrice} from {effectiveDate}. If you do not, it will not renew, and Plus ends when your current {periodUnit} ends.",
      "You can also cancel any time, before or after the change.",
      CANCEL_STEPS,
      STAYS_FREE,
    ],
    facts: [
      { label: "Plan", value: "{planName}" },
      { label: "Price today", value: "{oldPrice} {billingPeriod}" },
      { label: "New price", value: "{newPrice} {billingPeriod}" },
      { label: "Changes on", value: "{effectiveDate}" },
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: auto-renew turned off (trial or paid). No offer, no "are you sure" (AB 2863 save-offer rule).
  'plus-cancelled': {
    id: 'plus-cancelled',
    subject: "Plus will not renew",
    preheader: "Plus stays on until {accessEndDate}, and everything you made stays yours.",
    heading: "Done. Your plan will not renew.",
    body: [
      "You turned off renewal for Plus, so there will be no further charges.",
      "Plus keeps working until {accessEndDate}.",
      "After that, your books, letters and recordings all stay.",
      EXPORT_NOW_AND_THEN,
      FREE_ALWAYS,
      "If you change your mind, you can turn renewal back on in Settings, Plan, any time.",
    ],
    safety: "Did not turn this off? On your iPhone, open Settings, tap your name, then Subscriptions, or reply to this email.",
    category: 'billing',
    kind: 'transactional',
  },

  // L2 review: Plus ended (expiry, refund or revocation). Facts from Subscription terms "If Plus ends".
  // No resubscribe button: this email informs, it does not sell.
  'plus-ended': {
    id: 'plus-ended',
    subject: "Plus has ended. Your book is all here.",
    preheader: "Every letter and recording stays yours, to read, play and export.",
    heading: "Everything you made is still here",
    body: [
      "Your Plus plan ended on {accessEndDate}, and there will be no further charges.",
      FREE_ALWAYS,
      "Every book you already have stays open for writing, reading and export.",
      EXPORT_NOW_AND_THEN,
      "Thank you for being part of Plus.",
    ],
    category: 'billing',
    kind: 'transactional',
  },

  // v1.1 (C-REQ-031). Plus with no saves in 60 days; at most once every 6 months. Never says how long
  // it has been, never counts. Helps a payer stop paying. Kind is our reading; L2 confirms.
  'plus-quiet': {
    id: 'plus-quiet',
    subject: "A quiet word about your plan",
    preheader: "If Plus is not right for this season, here is how to stop it.",
    heading: "Your plan, at your pace",
    body: [
      "You have Plus at {price} {billingPeriod}. Some seasons are full of letters and some are not, and both are normal.",
      "If Plus is not useful right now, you can cancel and keep everything you made. Your book stays open, free.",
      "If you want to keep it, there is nothing to do.",
      CANCEL_STEPS,
    ],
    cta: MANAGE_CTA,
    fallback: FALLBACK,
    category: 'billing',
    kind: 'transactional',
  },
} satisfies Record<string, EmailCopy>;

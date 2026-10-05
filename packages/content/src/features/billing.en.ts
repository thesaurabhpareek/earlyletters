// Moved from apps/mobile/src/lib/billing/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Plus words. VOICE.md rules apply. Store-required
 * disclosure may state prices, dates and renewal plainly (in-app-disclosures
 * section 3); Apple's store view itself shows each price, period and any free
 * trial, so no price or trial length is typed here.
 *
 * Membership (D-082, D-083, 4 Oct 2026): the first two letters a person keeps
 * are free, across every book; after that, keeping another letter needs Plus.
 * Reading, playing and export are never gated, and starting a book and Read
 * together are free. What Plus adds lists only what v1.0 ships: keeping more
 * letters, and encrypted backup of the owner's recordings (D-073). Extra themes
 * are not in v1.0, so they are not promised here (App Review 3.1.2, Subscription
 * Terms must match).
 *
 * Never in app copy (D-083): a price, "free trial", "free months", or "we will
 * email you". Apple's own sheets show price and trial to people who are eligible.
 * No gap counting either: the Plan screen never says how many are left.
 *
 * Placeholders: {date} and {cancelBy} are calendar dates; {child} is the book's name.
 */
export const billingCopy = {
  /** Marketing content above Apple's plan buttons (SubscriptionStoreView). */
  store: {
    title: 'Plus',
    subtitle: 'A few extras for the books you keep.',
    features: [
      'Keep adding letters to every book, as many as you like.',
      // D-073: owner-only encrypted backup ships in v1.0, as part of Plus (Subscription Terms).
      'Encrypted backup of every recording, for you alone.',
    ],
    promise: 'Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus.',
    renewal:
      'Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends.',
    cancel: 'Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.',
    family: 'Plus can be shared with your family through Apple Family Sharing.',
  },

  /**
   * The Keep gate (D-082, D-083): shown when a third letter is kept without Plus.
   * The letter stays on the phone untouched. Never says a price, "free trial" or "we will email you".
   * {child} is the book's name; the sheet leaves the name out when the book has none.
   */
  keepGate: {
    title: "Keep adding to {child}'s book",
    body: 'Your first two letters are kept, and always will be. To add more, join Plus.',
    heldNote: 'This letter is safe on your phone. Come back to it once Plus is on.',
    seePlus: 'See Plus',
    holdButton: 'Keep it here for now',
    redeemLink: 'Redeem a code',
    lapsedBody: 'Plus has ended. Every letter stays yours to read, play and export. To add new ones, Plus can start again.',
    offline: 'Plus needs the internet to start. Your letter stays safe on your phone until then.',
    secondFreeNote: 'That was your second free letter.',
    plusIsOn: 'Plus is on. Your letter is waiting for you to keep it.',
  },

  /** The gate a person meets before Apple's store view. */
  gate: {
    opening: 'Opening the App Store',
    needsNewerIos: 'Plus can be added on iOS 17 or later.',
    unavailable: 'Plus is not available on this device yet.',
    isOn: 'Plus is on.',
  },

  /** Settings, Plan (the path the Subscription Terms and plus.legal.cancel name). */
  plan: {
    title: 'Plan',
    statusTitle: 'Plus',
    off: 'Your first two letters are free. Plus lets you keep adding.',
    on: 'Plus is on.',
    trial: 'Plus is on, free until {date}.',
    trialCancelBy: 'Cancel by {cancelBy} and you pay nothing.',
    renews: 'Plus renews on {date}.',
    ends: 'Plus stays on until {date}. It will not renew.',
    grace: 'There is a problem with the payment for Plus. Your letters are fine, and Plus stays on while Apple tries again.',
    retry: 'Apple could not take the payment for Plus, so Plus is paused. Every letter you have kept is safe.',
    shared: 'Shared with you through Apple Family Sharing.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    seePlans: 'See what Plus adds',
    redeem: 'Redeem a code',
    redeemHelp: 'Opens Apple\'s sheet for an offer code.',
    redeemUnavailable: 'Redeeming a code needs a newer version of the app on iPhone.',
    manage: 'Manage subscription',
    manageHelp: 'Change or cancel in Apple\'s subscriptions screen.',
    restore: 'Restore purchases',
    restoreHelp: 'Finds Plus bought with this Apple Account.',
    restoring: 'Checking with the App Store',
    restored: 'Plus is on.',
    restoreNothing: 'No Plus was found for this Apple Account.',
    restoreFailed: 'The App Store could not be reached. Please try again in a moment.',
    refund: 'Request a refund',
    refundHelp: 'Apple decides refunds. Your letters, recordings and books never change.',
    refundSent: 'Apple has your request and will email you.',
    payment: 'Apple handles payment for Plus. We never see your card details.',
    needsNewerIos: 'Plus can be added on iOS 17 or later.',
    unavailable: 'Plus is not available on this device yet.',
  },
} as const;

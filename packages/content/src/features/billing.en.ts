// Moved from apps/mobile/src/lib/billing/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Plus words. VOICE.md rules apply. Store-required
 * disclosure may state prices, dates and renewal plainly (in-app-disclosures
 * section 3); Apple's store view itself shows each price, period and any free
 * trial, so no price or trial length is typed here.
 *
 * What Plus adds lists only what v1.0 ships: Read together after the free
 * sessions, and books for more children. Backup is not listed: D-085 amends D-073,
 * so v1.0 relies on the person's own iPhone backup plus Export and claims none of
 * our own until sign-in and a server ship. Extra themes are not in
 * v1.0, so they are not promised here (App Review 3.1.2, Subscription Terms
 * must match; see the payments report).
 *
 * Placeholders: {date} and {cancelBy} are calendar dates; {count} is a number.
 */
export const billingCopy = {
  /** Marketing content above Apple's plan buttons (SubscriptionStoreView). */
  store: {
    title: 'Plus',
    subtitle: 'A few extras for the books you keep.',
    features: [
      'Read together whenever you like, after the first 3 times in each book.',
      'Books for more children. Your first book is always free.',
    ],
    promise: 'Writing, reading, playing your recordings, export and writing with your co-parent are free, always.',
    renewal:
      'Plans renew automatically until you cancel. To avoid the next charge, cancel at least 24 hours before a free trial or period ends.',
    cancel: 'Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.',
    family: 'Plus can be shared with your family through Apple Family Sharing.',
  },

  /** The gate a person meets before Apple's store view. */
  gate: {
    seePlans: 'See what Plus adds',
    opening: 'Opening the App Store',
    needsNewerIos: 'Plus can be added on iOS 17 or later.',
    unavailable: 'Plus is not available on this device yet.',
    birthday: 'Today is for the book. Plus can wait for another day.',
    contributor: 'Read together is part of Plus for this book.',
    isOn: 'Plus is on.',
  },

  /** Settings, Plan (the path the Subscription Terms and plus.legal.cancel name). */
  plan: {
    title: 'Plan',
    statusTitle: 'Plus',
    off: 'Plus is off. Every book and letter stays yours.',
    on: 'Plus is on.',
    trial: 'Plus is on, free until {date}.',
    trialCancelBy: 'Cancel by {cancelBy} and you pay nothing.',
    renews: 'Plus renews on {date}.',
    ends: 'Plus stays on until {date}. It will not renew.',
    grace: 'There is a problem with the payment for Plus. Your letters are fine, and Plus stays on while Apple tries again.',
    retry: 'Apple could not take the payment for Plus, so its extras are paused. Your letters are fine.',
    shared: 'Shared with you through Apple Family Sharing.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    seePlans: 'See what Plus adds',
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

// Moved from apps/mobile/src/lib/billing/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Plus words. VOICE.md rules apply. Store-required
 * disclosure may state prices, dates and renewal plainly (in-app-disclosures
 * section 3); Apple's store view itself shows each price, period and any free
 * trial, so no price or trial length is typed here.
 *
 * What Plus adds lists only what v1.0 ships: Read together after the free
 * sessions, and books for more children. Backup (D-059) and extra themes are
 * not in v1.0, so they are not promised here (App Review 3.1.2, Subscription
 * Terms must match; see the payments report).
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
    saveCopy: 'Save a copy of the terms',
    saveCopyHelp: 'Your plan, dates and how to cancel, to keep in Mail, Notes or Files.',
    /** Shown when Plus will renew on this iPhone's purchase but notifications are off (Q-003 gap 2). */
    notificationsOff: 'Reminders before Plus renews come as notifications, and they are off for {app}. The dates are always here in Settings, Plan.',
    turnOnNotifications: 'Allow notifications',
  },

  /**
   * Plan reminders on this iPhone (Q-003 memo section 5; Subscription Terms
   * "Receipts and reminders"). Lock-screen text names no child and no price.
   * The note in the app carries the date, the price after, the cancel-by date
   * and Manage subscription.
   */
  reminders: {
    title: 'Plus',
    trialOneMonth: 'Your free month ends on {date}. Plus then renews unless you cancel. You can change this in Settings, Plan.',
    trialMonths: 'Your free months end on {date}. Plus then renews unless you cancel. You can change this in Settings, Plan.',
    renews: 'If Plus is still set to renew, it renews on {date}. You can change this in Settings, Plan.',
    yearly: 'A yearly note: Plus renews until you cancel. You can change this in Settings, Plan.',
  },

  /** The same reminder inside the app: on the next open inside its window, and in Settings, Plan until the date passes. */
  note: {
    title: 'A note about Plus',
    trialOneMonth: 'Your free month ends on {date}.',
    trialMonths: 'Your free months end on {date}.',
    renews: 'Plus renews on {date}.',
    yearly: 'Plus is on, and it renews until you cancel.',
    priceAfter: 'Then it is {price}, until you cancel.',
    cancelByTrial: 'Cancel by {cancelBy} and you pay nothing.',
    cancelByRenewal: 'To avoid the next charge, cancel by {cancelBy}.',
    dismiss: 'Got it',
  },

  /** {price} filled with Apple's display price, for "Then it is {price}". */
  price: {
    month: '{price} a month',
    year: '{price} a year',
  },

  /**
   * Right after a purchase (in-app-disclosures 1.4.0 section 3; Subscription
   * Terms "Receipts and reminders"; California 17602(a)(3) retained
   * acknowledgment). "Save a copy" shares `summary` as plain text.
   */
  confirmation: {
    title: 'Plus is on',
    planMonthly: 'Plus Monthly',
    planAnnual: 'Plus Annual',
    trial: 'Free until {date}. Then {price}, until you cancel.',
    paid: '{price}, until you cancel. Next renewal on {date}.',
    priceUnknown: 'the price shown on Apple\'s subscription screen',
    cancelByTrial: 'Cancel by {cancelBy} and you pay nothing.',
    cancelByRenewal: 'To avoid the next charge, cancel by {cancelBy}.',
    renewal: 'Plus renews automatically at the end of each period, at the price shown when you subscribed, until you cancel. Cancel at least 24 hours before a free trial or period ends.',
    howToCancel: 'To cancel: on your iPhone, open Settings, tap your name, Subscriptions, {app}, Cancel Subscription. Or in {app}: Settings, Plan, Manage subscription.',
    apple: 'Apple charges your Apple Account and handles every payment, renewal, cancellation and refund. Deleting the app or your account does not cancel your plan.',
    family: 'People in your Apple family group get Plus too, through Apple Family Sharing.',
    reminders: 'This iPhone reminds you before a free trial ends, before an annual plan renews and once a year, if notifications are allowed. Settings, Plan always shows the dates.',
    saveCopy: 'Save a copy',
    saveCopyHelp: 'Keep these terms in Mail, Notes or Files.',
    remindTrialOneMonth: 'Remind me before the free month ends',
    remindTrialMonths: 'Remind me before the free months end',
    remindRenewal: 'Remind me before Plus renews',
    remindOn: 'Reminders are on for this iPhone.',
    remindOff: 'Notifications are off, so the dates stay in Settings, Plan.',
    done: 'Done',
    /** The saved copy (plain text). */
    summary: {
      heading: '{app} Plus: what you agreed to',
      plan: 'Plan: {name}, {price}.',
      trialEnd: 'Free trial ends: {date}.',
      renewsOn: 'Renews on: {date}.',
      cancelBy: 'Cancel by: {cancelBy}.',
      terms: 'Subscription Terms (Terms of Service, Section 14):',
      saved: 'Saved on {date}.',
    },
  },
} as const;

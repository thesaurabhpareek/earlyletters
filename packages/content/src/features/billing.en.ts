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
 * letters. Backup is not listed: D-085 amends D-073, so v1.0 relies on the person's
 * own iPhone backup plus Export and claims none of our own until sign-in and a
 * server ship. Extra themes are not in v1.0, so they are not promised here (App
 * Review 3.1.2, Subscription Terms must match).
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
    // Plus adds one thing in v1.0 (keeping more letters), so no "extras" (S41). The same words as settingsHome.planHelp.
    subtitle: 'Your first two letters are free. Plus lets you keep adding letters.',
    features: [
      'Keep adding letters to every book, as many as you like.',
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
    body: 'Your first two letters are kept for good. Plus lets you keep adding letters.',
    // heldNote, heldNoteSynced and offline promise the letter "waits on Tonight": P3 shows a card on Tonight for every
    // draft (spec S09, S22). Written to the register row "Keep step and held letter" (#163, 3.1.0); counsel reads them
    // (C10). heldNoteSynced is the signed-in line; P6's Keep sheet shows it once sign-in is on.
    heldNote: 'This one waits on this phone, on Tonight, exactly as it is, for as long as you like.',
    heldNoteSynced: 'This one waits on Tonight, exactly as it is, for as long as you like. It syncs privately with your account.',
    // The chip on the held letter's own card at the top of the sheet.
    heldChip: 'Waiting',
    seePlus: 'See Plus',
    holdButton: 'Keep it here for now',
    redeemLink: 'Redeem a code',
    lapsedBody: 'Plus has ended. Every letter you kept is still yours to read, play and export.',
    offline: 'Plus needs a connection to start. This one waits on this phone, on Tonight, exactly as it is.',
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

  /**
   * Settings, Plan (the path the Subscription Terms and plus.legal.cancel name).
   * Registered disclosure text: docs/legal/in-app-disclosures.md section 3 quotes the `billingCopy.plan.*` row
   * (Terms 14.6). Existing words change only through counsel with a version bump of that file, so the experience
   * pass's new wording for payment, grace, retry and restoreFailed waits for counsel (spec S41). New keys
   * (annual, restoreNone) are additions nothing shows yet; P6 switches the screen after counsel sees them.
   */
  plan: {
    title: 'Plan',
    statusTitle: 'Plus',
    off: 'Your first two letters are free. Plus lets you keep adding.', // retired by EXPERIENCE_PASS_2026-10; delete in P7 (no status card when Plus is off)
    on: 'Plus is on.',
    trial: 'Plus is on, free until {date}.',
    trialCancelBy: 'Cancel by {cancelBy} and you pay nothing.',
    renews: 'Plus renews on {date}.',
    ends: 'Plus stays on until {date}. It will not renew.',
    grace: 'There is a problem with the payment for Plus. Your letters are fine, and Plus stays on while Apple tries again.',
    retry: 'Apple could not take the payment for Plus, so Plus is paused. Every letter you have kept is safe.',
    shared: 'Shared with you through Apple Family Sharing.',
    // Plan names equal the App Store Connect display names (D-077; BRAND.md glossary). `monthly` is held until P6:
    // today's Plan screen shows it as the period beside `yearly`, so "Plus Monthly" would sit next to "Yearly".
    monthly: 'Monthly',
    annual: 'Plus Annual',
    yearly: 'Yearly', // retired by EXPERIENCE_PASS_2026-10; delete in P7 (replaced by `annual`)
    seePlans: 'See what Plus adds',
    redeem: 'Redeem a code',
    redeemHelp: 'Opens Apple\'s sheet for an offer code.',
    redeemUnavailable: 'Redeeming a code needs a newer version of the app on iPhone.',
    manage: 'Manage subscription',
    manageHelp: 'Change or cancel in Apple\'s subscriptions screen.',
    restore: 'Restore purchases',
    restoreHelp: 'Finds Plus bought with this Apple Account.',
    // The Restore row's subtitle while it checks, and its result inline under the row (S41).
    restoring: 'Checking with the App Store',
    restored: 'Plus is on.',
    // `restoreNone` is the S41 wording for this result; P6 moves the screen to it once counsel has seen it, and only
    // then is restoreNothing retired.
    restoreNothing: 'No Plus was found for this Apple Account.',
    restoreNone: 'This Apple Account has no Plus to restore.',
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
    notificationsOff: 'Notifications are off for {app}, so this iPhone cannot send its reminders before Plus renews. The dates are always here in Settings, Plan.',
    turnOnNotifications: 'Allow notifications',
  },

  /**
   * Plan reminders on this iPhone (G-15; Q-003 memo section 5; decision of 15 Oct 2026,
   * delegated by the founder). A courtesy, never a promise of delivery: Settings, Plan and
   * Apple's receipts hold every date. Lock-screen text names no child and no price.
   * D-083 holds here too: no price, "free trial", "free months" or "we will email you".
   */
  reminders: {
    title: 'Plus',
    trialOneMonth: 'Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan.',
    trialMonths: 'Plus is free until {date}, then it renews unless you cancel. You can change this in Settings, Plan.',
    renews: 'If Plus is still set to renew, it renews on {date}. You can change this in Settings, Plan.',
    yearly: 'A yearly note: Plus renews until you cancel. You can change this in Settings, Plan.',
  },

  /** The same reminder inside the app: on the next open inside its window, and in Settings, Plan until the date passes. */
  note: {
    title: 'A note about Plus',
    trialOneMonth: 'Plus is free until {date}.',
    trialMonths: 'Plus is free until {date}.',
    renews: 'Plus renews on {date}.',
    yearly: 'Plus is on, and it renews until you cancel.',
    cancelByTrial: 'Cancel by {cancelBy} and you pay nothing.',
    cancelByRenewal: 'To avoid the next charge, cancel by {cancelBy}.',
    dismiss: 'Got it',
  },

  /**
   * Right after a purchase (in-app-disclosures section 3; Q-003 memo point 3; California
   * 17602(a)(3) retained acknowledgment). "Save a copy" shares `summary` as plain text.
   * The amount is not typed or shown here (D-083): Apple's subscription screen showed it
   * before the purchase and Apple's receipt holds it.
   */
  confirmation: {
    title: 'Plus is on',
    planMonthly: 'Plus Monthly',
    planAnnual: 'Plus Annual',
    trial: 'Free until {date}. Then Plus renews until you cancel.',
    paid: 'Plus renews on {date}, until you cancel.',
    cancelByTrial: 'Cancel by {cancelBy} and you pay nothing.',
    cancelByRenewal: 'To avoid the next charge, cancel by {cancelBy}.',
    renewal: "Plus renews automatically at the end of each period until you cancel. Cancel at least 24 hours before a free or paid period ends. Apple showed the amount before you subscribed, and Apple's receipt has it.",
    howToCancel: 'To cancel: on your iPhone, open Settings, tap your name, Subscriptions, {app}, Cancel Subscription. Or in {app}: Settings, Plan, Manage subscription.',
    apple: 'Apple charges your Apple Account and handles every payment, renewal, cancellation and refund. Deleting the app does not cancel your plan.',
    family: 'People in your Apple family group get Plus too, through Apple Family Sharing.',
    reminders: "As a courtesy, this iPhone also tries to remind you before a free period ends, before an annual plan renews and once a year, if notifications are allowed. A reminder can come late or not at all, so the dates in Settings, Plan and Apple's receipts are the ones to go by.",
    saveCopy: 'Save a copy',
    saveCopyHelp: 'Keep these terms in Mail, Notes or Files.',
    remindTrialOneMonth: 'Remind me before the free period ends',
    remindTrialMonths: 'Remind me before the free period ends',
    remindRenewal: 'Remind me before Plus renews',
    remindOn: 'Reminders are on for this iPhone.',
    remindOff: 'Notifications are off, so the dates stay in Settings, Plan.',
    done: 'Done',
    /** The saved copy (plain text). */
    summary: {
      heading: '{app} Plus: what you agreed to',
      plan: 'Plan: {name}.',
      trialEnd: 'Free until: {date}.',
      renewsOn: 'Renews on: {date}.',
      cancelBy: 'Cancel by: {cancelBy}.',
      terms: 'Subscription Terms:',
      saved: 'Saved on {date}.',
    },
  },
} as const;

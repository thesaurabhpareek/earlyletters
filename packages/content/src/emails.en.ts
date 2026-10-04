// Transactional email copy. Rendered by packages/emails (React Email); every word lives here so the
// content rules test checks it like any other product copy.
//
// Placeholders: {app} (public name, from packages/brand), {inviter} (what the inviter signs as),
// {date} (a long date in the reader's locale), {reference} (a request id, never content),
// {days} (a whole number), {email} (the support address, from packages/brand).
//
// Rules for every email (D-061, VOICE.md):
// - Transactional only. No marketing, no images, no tracking pixels, no tracked links.
// - Never a child's name, a letter, a transcript or anything from the book (D-025 spirit: email
//   providers are processors, so the less we send, the better).
// - One clear action at most. Calm about security: say what to do, never what might go wrong.
// - Every email has a plain-text twin built from the same copy.

export const emails = {
  common: {
    // Wordmark at the top. Text, not an image, so nothing loads from a server.
    wordmark: "{app}",
    tagline: "Exactly as you said it.",
    linkHelp: "If the button does not work, copy this link into your browser:",
    footerAccount: "You are getting this email because of your {app} account.",
    footerContact: "Questions? Write to us at {email}.",
    privacyLink: "Privacy Policy",
    termsLink: "Terms of Service",
  },

  // Supabase Auth magic link (sign-in by email). No account details beyond the address it went to.
  magicLink: {
    subject: "Your sign-in link for {app}",
    preview: "Tap to sign in. The link works once.",
    heading: "Sign in to {app}",
    body: ["Tap the button to sign in. The link works once, for a short time."],
    button: "Sign in",
    ignore: "If you did not ask to sign in, you can ignore this email. Nothing changes unless the link is used.",
  },

  // Sent when a parent invites their co-parent by email (D-055: co-parent only at v1.0).
  // No child's name: the invitee sees it inside the app after joining.
  coParentInvite: {
    subject: "{inviter} invited you to write letters together",
    preview: "One book, both your voices.",
    heading: "{inviter} would like you to write together",
    body: [
      "{inviter} is keeping a memory book of letters to your child on {app}, and invited you to join as a co-parent.",
      "You each speak or type your own letters, signed in your own name, in the same book. Only the two of you can read it.",
    ],
    button: "Join the book",
    // Co-parent invites expire in 7 days (D-020, K-18).
    linkNote: "The link opens the app on your iPhone, or helps you get it. It works for 7 days.",
    ignore: "Not expecting this? You can ignore this email. Nothing happens unless you join.",
    footerInvite: "You are getting this email because {inviter} entered your address in {app}.",
  },

  welcome: {
    subject: "Welcome to {app}",
    preview: "The book is open whenever you are.",
    heading: "Welcome. The book is open.",
    body: [
      "A minute is plenty. Tell your child one thing about today, by voice or by typing, and it becomes a letter, kept exactly as you said it.",
      "Some days will be quiet. Tap Not much today, and that is enough.",
      "Your book is always yours. Export it, free, any time from Settings.",
    ],
    // The same promise as in the app and the store listing (trust.promise).
    promise: "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.",
  },

  // Account deletion receipts (DELETION_AND_EXPORT_SPEC 2.6, DATA-REQ-025). 30-day grace period.
  deletionRequested: {
    subject: "Your account will be deleted on {date}",
    preview: "You can change your mind until then.",
    heading: "We have your request",
    body: [
      "Your {app} account and everything in it will be deleted on {date}.",
      "Changed your mind? Sign in to the app before {date} and cancel the deletion in Settings. Everything comes back as it was.",
      "Until then, you can still export your book from Settings.",
    ],
    // DATA-REQ-022: a subscription is billed by Apple until cancelled there.
    subscription: "Deleting your account does not cancel Plus. If you subscribe, you can cancel in your Apple Account subscriptions.",
    kept: "Afterwards we keep only a record, without your name or email, that you agreed to our terms. It is deleted after 3 years.",
    reference: "Request reference: {reference}",
  },

  deletionCancelled: {
    subject: "Your account is staying",
    preview: "Nothing was deleted.",
    heading: "Your account is staying",
    body: [
      "You cancelled the deletion of your {app} account. Your letters and books are back, just as they were.",
      "If this was not you, please write to us at {email}.",
    ],
    reference: "Request reference: {reference}",
  },

  deletionCompleted: {
    subject: "Your account has been deleted",
    preview: "Your account is gone from our servers.",
    heading: "Your account has been deleted",
    body: [
      "On {date} we deleted your {app} account and everything we held for it, including your letters and your books.",
      "Our safety backups clear on their own within 7 days.",
    ],
    subscription: "If you subscribed to Plus, Apple bills it until you cancel in your Apple Account subscriptions.",
    reference: "Request reference: {reference}",
  },

  // A copy of the person's data, prepared on our side (access requests; DATA-REQ-054).
  exportReady: {
    subject: "Your copy is ready",
    preview: "Download it within {days} days.",
    heading: "Your copy is ready",
    body: [
      "The copy of your {app} data that you asked for is ready to download.",
      "The link works for {days} days. After that, you can ask for a new one.",
    ],
    button: "Download your copy",
    ignore: "If you did not ask for this, please write to us at {email}.",
  },
} as const;

export type Emails = typeof emails;

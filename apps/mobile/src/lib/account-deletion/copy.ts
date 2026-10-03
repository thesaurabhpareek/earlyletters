// Account deletion screens (PRD C-REQ-019, DELETION_AND_EXPORT_SPEC 2.6.1, LEGAL-REQ-029).
// Feature-local copy (agent brief): the content agent moves it into packages/content later.
// Content rules apply: no em or en dashes, curly quotes, ellipsis or emoji; calm, no fear or
// loss language; never gender the child. Placeholders: {child}, {coParent}, {count}, {date}.

export const accountDeletionCopy = {
  title: 'Delete account',

  // Step 1 of 2: what happens, export first, subscription.
  what: {
    heading: 'What happens',
    intro: 'Deleting your account removes your letters, recordings, photos and books from our servers. You have 30 days to change your mind.',
    staysNone: "{child}'s book stays with {coParent}, with their letters.",
    staysOne: "{child}'s book stays with {coParent}, with their letters. Your letter leaves it.",
    staysMany: "{child}'s book stays with {coParent}, with their letters. Your {count} letters leave it.",
    deletedNone: "{child}'s book will be deleted.",
    deletedOne: "{child}'s book will be deleted, with your letter in it.",
    deletedMany: "{child}'s book will be deleted, with your {count} letters in it.",
    deletedFamily: 'Family members who write in it can save a copy of their own letters first. We will email them.',
    contributor: 'Your letters to {child} will be removed.',
    coParentFallback: 'your co-parent',
    noBooks: 'You have no books on your account yet.',
    copies: 'Letters you exported, and recordings family already played on their phones, stay with them.',
  },
  exportFirst: {
    heading: 'Keep a copy first',
    body: 'Export everything to your phone, free: your letters as text, your recordings and your photos.',
    button: 'Export everything',
  },
  subscription: {
    heading: 'Your Plus subscription',
    body: 'Deleting your account does not cancel Plus. Billing continues through Apple until you cancel.',
    button: 'Manage subscription',
  },
  continueButton: 'Continue',

  // Step 2 of 2: confirm.
  confirm: {
    heading: 'Delete your account?',
    body: 'Your account will be deleted on {date}. Until then, sign in and cancel, and everything comes back as it was.',
    typeLabel: 'Type delete to confirm',
    typeWord: 'delete',
    button: 'Delete account',
    back: 'Keep my account',
  },

  // After the request.
  scheduled: {
    heading: 'Deletion scheduled',
    body: 'Your account will be deleted on {date}. You can cancel any time before then, here or by signing in again.',
    exportNote: 'You can still export everything until then.',
    emailNote: 'We sent a receipt to your email address.',
    cancelButton: 'Cancel deletion',
    doneButton: 'Sign out of this phone',
    cancelled: 'Deletion cancelled. Your letters and books are back, just as they were.',
  },
  executing: 'Your account is being deleted now. This can take up to a day.',

  signedOut: {
    body: 'Sign in to delete your account. Letters that are only on this phone stay here until you delete the app.',
    button: 'Sign in',
  },
  notConfigured: 'This version has no account. Everything stays on this phone, and deleting the app removes it.',

  errors: {
    offline: 'You are offline. Deleting an account needs a connection. Nothing has changed.',
    failed: 'That did not work, and nothing has changed. Please try again.',
  },
} as const;

// Moved from apps/mobile/src/lib/account-deletion/copy.ts on 3 Oct 2026; that file now re-exports this one.
// Account deletion screens (PRD C-REQ-019, DELETION_AND_EXPORT_SPEC 2.6.1, LEGAL-REQ-029).
// Words as EXPERIENCE_PASS_2026-10 S64 writes them (package P8c), pinned in test/server-surfaces-account-deletion.test.ts
// and held to the content rules by rules.test.ts (the `accountDeletionCopy` row of test/support/copy-surfaces.ts).
// Content rules apply: no em or en dashes, curly quotes, ellipsis or emoji; calm, no fear or
// loss language; never gender the child. Placeholders: {child}, {coParent}, {count}, {date}.

export const accountDeletionCopy = {
  title: 'Delete account',

  // Step 1 of 2: what happens, export first, subscription.
  what: {
    heading: 'What happens',
    // Held for counsel (spec chapter 7 and section 7, C8: the deletion lines P8 corrects go to counsel before they
    // ship). The page shows `intro`, today's words, until counsel clears `introProposed` (S64's words: no photos,
    // which v1.0 never makes, and the recording backup named). The switch is one line, `HELD.intro` in
    // apps/mobile/src/components/settings/delete-account.logic.ts; then `introProposed` takes this key's place.
    intro: 'Deleting your account removes your letters, recordings, photos and books from our servers. You have 30 days to change your mind.',
    introProposed: 'Deleting your account removes your letters, recordings, books and recording backup from our servers. You have 30 days to change your mind.',
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
    // v1.0 has no family listening, so no recording ever sits on a family member's phone.
    copies: 'A copy you exported stays wherever you saved it.',
    // What the phone does with the person's own letters (critics' pass 30 Oct 2026, S4), and no more than the code does.
    // Letters the account already holds are marked deleted by the next pull and wait in Recently deleted; a letter that
    // never reached the server is not touched (a book the pull closes is hidden, not emptied: closeBook, merge.ts). So the
    // sentence says both and promises no date and no erase: in a sync build the phone's own sweep leaves a letter the
    // server holds alone, and a later pull that says the server no longer holds it is the only thing that erases it
    // there. For counsel's relay list.
    onThisPhone: 'On this phone, your letters stay. The ones already saved to your account move to Recently deleted.',
  },
  exportFirst: {
    heading: 'Keep a copy first',
    body: 'Export everything, free: the book as a PDF, your letters as text and your recordings.',
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
    // KEEP (S64) but shown nowhere: after the request, the phone's next sync moves the person's own letters to Recently
    // deleted, which Export leaves out (DATA-REQ-053, S03 with S14). The scheduled page shows it again once Export
    // includes letters tombstoned by the request.
    exportNote: 'You can still export everything until then.',
    // The purge worker sends the request email on its next run (every 15 minutes), so it is on its way, not sent.
    emailNote: 'A confirmation is on its way to your email.',
    cancelButton: 'Cancel deletion',
    doneButton: 'Sign out of this phone',
    // The native confirm before "Sign out of this phone" (critics' pass S3): the request stays open.
    signOutBody: 'Your deletion stays scheduled for {date}. Sign in again any time before then to cancel it.',
    cancelled: 'Deletion cancelled. Your letters and books are back, just as they were.',
  },
  executing: 'Your account is being deleted now. This can take up to a day.',

  // Signed out. `body` is true in both situations: a person who never asked, and one who signed out after asking
  // (critics' pass S3). `scheduledBody` is for a phone that knows a request is open.
  signedOut: {
    body: 'Sign in to delete your account, or to cancel a deletion you started. Letters that are only on this phone stay here until you delete the app.',
    scheduledBody: 'Your account will be deleted on {date}. Sign in to cancel the deletion.',
    button: 'Sign in',
  },

  // The screen a phone with no book shows while a deletion request is open, in place of the first-run welcome (D-117,
  // critics' pass M1). A sole parent's book goes with the request, so without it the phone looks new. The title and the
  // date line are the scheduled page's own words (`scheduled.heading`, `scheduled.body`); the cancel path is
  // `scheduled.cancelButton`.
  open: {
    executingTitle: 'Deletion in progress',
    restoringTitle: 'Deletion cancelled',
    restoringBody: 'Your letters and books are on their way back to this phone.',
    // Spoken while Cancel deletion is on its way to the server, and after a Try again that found nothing yet.
    cancelling: 'Cancelling the deletion.',
    notYet: 'Still on their way. Try again in a moment.',
    // The name of the moment of paper a phone shows while the server is asked (read by a screen reader, never drawn).
    checking: 'One moment.',
  },
  // The kill path only (no server client in this build): the one place these words may say "stays on this phone".
  notConfigured: 'Accounts are not available right now. Everything stays on this phone, and deleting the app removes it.',

  // Each failure says first, or says plainly, that nothing has changed.
  errors: {
    offline: 'Nothing has changed. Deleting an account needs a connection.',
    failed: 'That did not go through. Nothing has changed.',
  },
} as const;

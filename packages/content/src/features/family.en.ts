// Moved from apps/mobile/src/lib/family/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Words for the Family tab and co-parent invites (PRD B F5, BRIEF decision 5:
 * co-parent only at launch, so Family roles stay hidden). Feature-local until
 * the content agent moves them into packages/content; the content rules test
 * scans this file. Placeholders: {child}, {signsAs}.
 */
export const familyCopy = {
  members: {
    you: 'You',
    coParent: 'Co-parent',
    invited: 'Invited',
    invitedName: 'Your co-parent',
  },

  card: {
    title: 'Write this book together',
    body: "Invite {child}'s other parent. They write from their own phone and read the whole book. You are equals in it.",
    button: 'Invite a co-parent',
    signedOutNote: "You'll sign in first, so they can join from their own phone.",
    finishSetup: 'Finish setting up your account to invite someone.',
    privacy: "Only the people you invite can read {child}'s book.",
  },

  pending: {
    shareAgain: 'Share again',
    cancel: 'Cancel invite',
    cancelTitle: 'Cancel this invite?',
    cancelBody: 'The link will stop working.',
    keep: 'Keep it',
    cancelled: 'Invite cancelled.',
  },

  create: {
    title: "Invite {child}'s co-parent",
    body: 'They can write to {child} and read the whole book, from their own phone.',
    signsAsLabel: 'What does {child} call them?',
    signsAsPlaceholder: 'Mama, Papa, Amma, Baba',
    signsAsHelp: 'Optional. It signs their letters.',
    oneBook: "This invite is for {child}'s book only.",
    linkNote: 'The link works once, for 7 days. You can cancel it any time.',
    share: 'Share invite link',
    working: 'Getting the link ready',
    shareTitle: "Join {child}'s book",
    shareMessage: "I started a book of letters for {child}. Join me, so we can both write to {child}:",
    shareMessageNamed: "{signsAs}, I started a book of letters for {child}. Join me, so we can both write to {child}:",
    done: 'Invite ready. It shows on the Family tab until they join.',
  },

  accept: {
    title: 'Join the family book',
    pasteLabel: 'Invite link',
    pasteHelp: 'Open the message with the invite, copy the link and paste it here.',
    pastePlaceholder: 'Paste the link here',
    continue: 'Continue',
    notRecognised: "That doesn't look like an invite link. Check the message and try again.",
    signInBody: 'Sign in so you can write together, each from your own phone.',
    signIn: 'Sign in',
    consentBody: 'One step left before you join.',
    consentButton: 'Continue',
    joining: 'Joining the book',
    joinedTitle: "You're in {child}'s book",
    joinedBody: 'Your letters and your co-parent\'s will be together in one book.',
    joinedWaiting: "{child}'s book is on its way to this phone.",
    open: 'Open the book',
    close: 'Close',
    tryAgain: 'Try again',
  },

  /**
   * Co-parent sharing is coming in a later update (founder, 3 Oct 2026): v1.0 keeps every
   * letter on this phone. One presentation for the Family tab and every invite entry point
   * (apps/mobile/src/components/family/coparent-soon.tsx). Never a date; never "beta".
   * {child} is the open book's name, or `childFallback` before there is a book.
   */
  soon: {
    status: 'Coming soon',
    title: 'Write to {child}, together',
    lead: "Soon {child}'s other parent can write in this same book, from their own phone.",
    points: [
      {
        title: 'One book, two voices',
        body: 'Your letters and theirs sit side by side, each signed with the name {child} calls you.',
      },
      {
        title: 'Each from your own phone',
        body: 'Write whenever it suits you, and read every shared letter wherever you are.',
      },
      {
        title: 'Private to your family',
        body: "Only the people you invite can read {child}'s book. A letter you keep private stays yours.",
      },
    ],
    building: "We're building it now. Until then, every letter you write stays on this phone.",
    notify: {
      button: "Tell me when it's here",
      hint: 'Saves a note on this phone. Nothing is sent.',
      done: "Thank you. We'll let you know here when it's ready.",
    },
    quiet: {
      title: 'Just you, for now.',
      body: "{child}'s book and every letter in it stay on this phone.",
    },
    childFallback: 'your child',
    close: 'Close',
    settingsRow: 'Write this book together',
    settingsRowHelp: 'Sharing a book with a co-parent is coming in a later update.',
  },

  errors: {
    expired: 'This invite has expired. Ask for a new one.',
    used: "This invite has already been used. Ask for a new one if that wasn't you.",
    revoked: 'This invite was cancelled. Ask for a new one.',
    already_member: "You're already part of this book.",
    not_found: "We couldn't find that invite. Check the link and try again.",
    not_parent: "Only a parent of {child}'s book can invite. If you just signed in, give it a moment and try again.",
    rate_limited: "That's a lot of invites for one day. You can send more tomorrow.",
    consent_needed: 'Finish setting up your account first.',
    book_deleted: "This book isn't available.",
    signed_out: 'Sign in again to continue.',
    network: "You're offline. Try again when you're back online.",
    unknown: 'Something went wrong. Please try again.',
  },
} as const;

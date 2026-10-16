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
    family: 'Family',
  },

  /**
   * Leaving a shared book (F11 6.2 D; leave_child). Two equal choices, nothing
   * chosen, Continue waits for one (F11-REQ-028). {coParent} is the other
   * parent's sign-off name, or `members.invitedName`.
   */
  leave: {
    button: "Leave {child}'s book",
    title: "Leave {child}'s book?",
    keepTitle: 'Leave my letters in the book',
    keepBody: 'Anyone {coParent} invites later can read letters you leave in the book.',
    takeOutTitle: 'Take my letters out of the book',
    takeOutBody: 'Your letters stay yours. You can read, export and delete them on this phone.',
    cantTakeBack: "Letters already on {coParent}'s phone or in an export can't be taken back.",
    confirm: 'Leave the book',
    stay: 'Stay',
    working: 'Leaving the book',
    left: "You left {child}'s book. Your letters are still on this phone.",
  },

  /** Removing a family member (remove_child_member). Parents are never removed this way (F11 D3, F11-REQ-012). */
  remove: {
    button: 'Remove from the book',
    title: 'Remove {name} from the book?',
    body: "They won't see {child}'s book anymore. The letters they wrote stay in it.",
    confirm: 'Remove',
    keep: 'Keep them',
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
    linkNote: 'The link works once, for 7 days. You can cancel it any time. They see your name and choose whether to join.',
    /** Instead of Share when the book already has two parents (F11-U10, F11-REQ-004). */
    fullNote: "{child}'s book has two parents.",
    share: 'Share invite link',
    working: 'Getting the link ready',
    shareTitle: "Join {child}'s book",
    shareMessage: "I started a book of letters for {child}. Join me, so we can both write to {child}:",
    shareMessageNamed: "{signsAs}, I started a book of letters for {child}. Join me, so we can both write to {child}:",
    done: 'Invite ready. It shows on the Family tab until they join.',
  },

  accept: {
    title: 'Join the family book',
    /** Asked before joining, from peek_invite: never the child's name (BL-322, F11 6.2 B step 6). */
    checking: 'Checking the invite',
    askTitle: 'Join this book as a parent?',
    invitedBy: 'Invited by {inviter}.',
    invitedByUnknown: "The invite doesn't say who sent it.",
    askBody: 'You will write to the same child and read every letter in the book, from your own phone. Join only if you know who sent you this invite.',
    join: 'Join as a parent',
    notNow: 'Not now',
    declinedTitle: 'You did not join',
    declinedBody: 'Nothing changed. If you want to join later, open the invite link again.',
    openHint: 'The book you have open stays open until you choose.',
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
      // True only with the v1.1 card on Tonight (the first time a build with co-parent sharing opens on a phone that asked).
      done: "Noted on this phone. When the update arrives, you will see it here.",
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
    book_full: 'This book already has two parents. Ask the person who invited you.',
    last_parent: "You're the only parent of {child}'s book, so you can't leave it. You can delete the book in Settings instead.",
    not_allowed: "That can't be done from here. Write to us if you need help with this book.",
  },
} as const;

// Moved from apps/mobile/src/lib/family/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Words for the Family tab and co-parent sharing (PRD V2 F11; PRD B F5). Co-parent only at
 * launch (B1), so Family roles stay hidden. With server features on (D-100, drafted as D-089)
 * these drive invite, join and leave; with them off, `soon` is the one presentation (the kill
 * path). The content rules test scans this file. Placeholders: {child}, {signsAs}, {inviter},
 * {coParent}, {date}.
 *
 * F11 names some keys in a `coParent.*` namespace; they live here: coParent.invite.fullNote is
 * create.full, coParent.join.needsSync is accept.needsSync, coParent.leave.* is leave.*,
 * coParent.cantTakeBack is leave.cantTakeBack, coParent.left.note is left.note, and
 * errors.inviteFull is errors.book_full.
 */
export const familyCopy = {
  members: {
    you: 'You',
    coParent: 'Co-parent',
    invited: 'Invited',
    invitedName: 'Your co-parent',
    /** F11-REQ-019: a pending invite in the member list. */
    openUntil: 'Invited, open until {date}',
    /** F11-REQ-019: an invite the server marks expired (it lists one for 14 days; Share again makes a new link). */
    expired: 'Invite expired',
  },

  card: {
    title: 'Write this book together',
    body: "Invite {child}'s other parent. They write from their own phone, and you both read the whole book.",
    button: 'Invite a co-parent',
    finishSetup: 'Finish setting up your account to invite someone.',
    /** Review A1: says who the book is shared with, never who can read it (the founder's words, story.private.v2). */
    privacy: 'Shared only with the other parent, if you invite them.',
  },

  /**
   * A child's book settings with server features on (S46, P6 builds the row in settings/children/[id].tsx): in
   * place of `soon.settingsRow`. One parent: it opens the invite sheet. Two parents: its value is the co-parent's
   * signature and it opens the Family tab.
   */
  bookRow: {
    label: 'Write this book together',
  },

  pending: {
    shareAgain: 'Share again',
    cancel: 'Cancel invite',
    cancelTitle: 'Cancel this invite?',
    cancelBody: 'The link will stop working.',
    keep: 'Keep it',
    /** Announced to VoiceOver when Cancel invite has worked (the row goes away). */
    cancelled: 'Invite cancelled.',
    /** Share again sent the new link, but the earlier invite could not be cancelled (F11-REQ-019). */
    oldStillOpen: 'The new link is shared, but the earlier link still works. You can cancel it in the list.',
    /** Share again: the share sheet did not open, so nothing was sent and neither invite was cancelled. */
    notSent: "The share sheet didn't open, so nothing was sent. Both invites stay open, and you can cancel either in the list.",
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
    done: 'The invite waits on the Family tab until they join.',
    /** F11-REQ-004: shown instead of Share when the book already has two parents (D-069). */
    full: "{child}'s book has two parents.",
  },

  accept: {
    /** The paste view: a book has at most two parents in v1.0, so not "the family book". */
    title: 'Join a book',
    /** Before sign-in nothing about the invite is known or shown (BL-322; peek_invite needs an account). */
    invitedTitle: 'You were invited to a book',
    /** The busy line while peek_invite runs (signed in, before the ask). */
    peeking: 'Opening the invite',
    /** After sign-in, before joining: only the inviter's sign-off, never the child's name (BL-322, review H2). */
    askTitle: 'Join this book as a parent?',
    invitedBy: 'Invited by {inviter}',
    invitedByUnknown: 'You were invited to write a book together.',
    askBody: 'You will both read every letter in the book. Join only if you know who sent you this link.',
    join: 'Join the book',
    notNow: 'Not now',
    /** F11-U11: joining needs sync; the invite stays usable until it expires. */
    needsSync: 'To join, turn on sync and sharing in Settings, Privacy.',
    /** F11-REQ-024: the joined parent's signature for this book, prefilled with the inviter's suggestion. */
    signsAsLabel: 'What does {child} call you?',
    signsAsHelp: 'It signs your letters in this book.',
    signsAsPlaceholder: 'Mama, Papa, Amma, Baba',
    /** Under the field while it is empty: why "Open the book" is waiting (F11-REQ-024). */
    signsAsNeeded: 'Add what {child} calls you to open the book.',
    pasteLabel: 'Invite link',
    pasteHelp: 'Open the message with the invite, copy the link and paste it here.',
    pastePlaceholder: 'Paste the link here',
    continue: 'Continue',
    notRecognised: "That doesn't look like an invite link. Check the message and try again.",
    /** The sign-in sheet's `invite` body, word for word (S52). */
    signInBody: 'You each write from your own phone, in the same book.',
    signIn: 'Sign in',
    joining: 'Joining the book',
    joinedTitle: "You're in {child}'s book",
    /** The flyleaf, in words: {inviter} is the inviter's sign-off from the peek. */
    joinedBody: "Your letters and {inviter}'s sit side by side, each signed.",
    /** The same line when the inviter set no sign-off. */
    joinedBodyUnknown: 'Your letters and theirs sit side by side, each signed.',
    joinedWaiting: "{child}'s book is on its way to this phone.",
    /**
     * First run's welcome, when the joined sheet was closed before the book arrived and the book has not come after a
     * while or sync cannot reach the server (critics' pass S2): said with Try again, and "Begin the book" back.
     */
    joinedNotYet: "{child}'s book has not reached this phone yet.",
    open: 'Open the book',
    close: 'Close',
    tryAgain: 'Try again',
    /** After an invite that can no longer work: back to the paste field. */
    pasteAnother: 'Paste another link',
    /** The membership limit, as the invitee meets it while looking or joining. */
    tryLater: 'Please wait a little while, then try again.',
  },

  /** Leaving a shared book (F11 6.2 D; F11-REQ-011, F11-REQ-027, F11-REQ-028; R4 PT-14, PT-15). Nothing is preselected. */
  leave: {
    row: "Leave {child}'s book",
    title: "Leave {child}'s book?",
    keep: 'Leave my letters in the book',
    keepHelp: 'Anyone {coParent} invites later can read letters you leave in the book.',
    takeOut: 'Take my letters out of the book',
    takeOutHelp: 'Your letters leave the book and stay yours.',
    cantTakeBack: "Letters already on {coParent}'s phone or in an export can't be taken back.",
    confirm: 'Leave the book',
    cancel: 'Stay',
    leaving: 'Leaving the book',
    done: "You left {child}'s book. Your own letters stay yours.",
    coParentFallback: 'your co-parent',
    /** /invite/leave in a build with sharing on, while D-113 holds Leave back. */
    later: 'Leaving a shared book is coming in a later update.',
  },

  /** F11-REQ-023: the one neutral note the remaining parent sees. */
  left: {
    note: "{signsAs} has left {child}'s book.",
    /** The same note for a co-parent who never set a sign-off. */
    noteUnsigned: "Your co-parent has left {child}'s book.",
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
    not_found: 'That link does not open an invite. Check it and try again.',
    not_parent: "Only a parent of {child}'s book can invite. If you just signed in, give it a moment and try again.",
    rate_limited: "That's a lot of invites for one day. You can send more tomorrow.",
    consent_needed: 'Finish setting up your account first.',
    book_deleted: "This book isn't available.",
    signed_out: 'Sign in again to continue.',
    network: 'This phone is offline. Try again once it is back online.',
    unknown: 'That did not work this time. Try again.',
    /** SCCAP (F11-U10, F11-REQ-026): the invitee's line. The inviter's sheet shows create.full instead. */
    book_full: 'This book already has two parents. Ask the person who invited you.',
    /** SCLPG: the only parent of a book cannot leave it (DATA-REQ-016). */
    last_parent: "You're the only parent of {child}'s book now, so it stays with you.",
    /** 42501: a parent tried something only the server's own paths may do. Never offered by the app. */
    not_allowed: "That isn't possible from here.",
    /** An invite code or token collided twice in a row (code_taken, token_taken, closed); the app already retried once. */
    retry_new_invite: 'That did not work this time. Try again.',
    /** SCCID twice in a row: the same action and words as retry_new_invite. */
    id_taken: 'That did not work this time. Try again.',
    /**
     * SCCON family-share (D-050, F11-REQ-018): only when the server's app.family_share_consent_required
     * is on, which follows a release with the family-share sheet; this build has no sheet.
     */
    family_share_consent: 'Sharing a book now asks for one more agreement. Update the app to see it, then try again.',
    /**
     * killSwitches.invites (SCKIL): creating an invite, Share again, peek and join are paused and
     * nothing was sent; Cancel invite still works. Open invites and a link already on this phone stay
     * as they are. Shown to the inviter and to the invitee, so it never names the child.
     */
    paused: 'Invites are paused for now. Please try again a little later.',
  },
} as const;

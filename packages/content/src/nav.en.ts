/**
 * The four-tab bar and the words around it (BL-899; founder direction of 10 Nov 2026: Home on the left, Book,
 * Library once its gates close, Me on the right; Family is never a tab). Sources: NX-41, NX-42, NX-43 (PR #790) and
 * NAV-TAB-ROLES-10nov (PR #789). Nothing here is live until `mobile` imports it; the old `en.tabs` keys stay until
 * the PRs that edit them (#699, #720) merge, then a follow-up deletes them.
 *
 * Rules that shaped the words:
 *  - One word per tab, from the BRAND.md glossary. "Moments" is banned (the glossary keeps "moment" out of copy), so
 *    is "Memories" for a thing a parent makes. "Library" names the place, not the thing a parent makes.
 *  - `a11yLabel` is what VoiceOver reads before the system adds "tab, 2 of 4". `hint` is read after a pause and
 *    never repeats the label. iOS shows the Large Content Viewer from the label, so label and a11yLabel match.
 *  - COUNSEL-READ marks every line that describes something a person is agreeing to or something not yet built. No
 *    line here says where anything is stored or who can read it.
 */
export const nav = {
  tabs: {
    home: {
      label: 'Home',
      a11yLabel: 'Home',
      hint: 'Speak or type a letter, and see what is waiting to be kept.',
    },
    book: {
      label: 'Book',
      a11yLabel: 'Book',
      hint: 'Read and hear the letters you have kept.',
    },
    /**
     * The Memory Library tab. Appears in the bar only in a build where its gates have closed (NX-39 P1); until then
     * this label is not shown. COUNSEL-READ: the hint names photos, so it waits for the Library words of
     * MEMORY-LIBRARY-WORDS-10nov and the media consent wording.
     */
    library: {
      label: 'Library',
      a11yLabel: 'Library',
      hint: 'Photos and days that help you remember what to say.',
    },
    me: {
      label: 'Me',
      a11yLabel: 'Me',
      hint: 'Settings and account.',
    },
  },

  /** The Me section that holds sharing, and the one quiet row inside it while sharing is not here. */
  people: {
    sectionTitle: 'People and sharing',
  },

  /**
   * "Coming soon", made quiet (NAV-TAB-ROLES section 7; NX-41 R9 to R11): one muted row in Me under People and
   * sharing, never a tab, a drawing or a badge. The row opens a short sheet with Close.
   *
   * COUNSEL-READ (door lines, COORDINATION section 10, PRIV-R21):
   *   Shown: this row, then this sheet with two lines and Close.
   *   Records: nothing about the parent. The existing opt-in, content-free count `coparent_soon_opened` may fire.
   *   Never: a date, a "tell me" button, a number, a badge, or a line about where letters are kept.
   *   Decline: Close, one tap.
   *
   * True in every build, including the store build with servers on: it says what the book is today and that
   * sharing is for a later update. It does not use `familyCopy.soon.quiet.body`, whose "stay on this phone" is
   * wrong once an account syncs.
   */
  comingSoon: {
    row: {
      label: 'Write this book together',
      value: 'Coming soon',
      /** One spoken phrase for the row: label, then value. The row opens a sheet, so the hint says so. */
      a11yLabel: 'Write this book together, coming soon',
      a11yHint: 'Opens a short note.',
    },
    sheet: {
      title: 'For now, this book is yours.',
      /** COUNSEL-READ: a statement about the future, with no date. {child} is the book's name for the child. */
      body: "In a later update, {child}'s other parent can add letters too, from their own phone.",
      childFallback: 'your child',
      close: 'Close',
    },
  },

  /**
   * Home's one memory (NX-43; NAV-TAB-ROLES R2): a single flat slip, the only kept letter on Home. The kicker is
   * true whichever letter is picked, so it never says "a month ago" for a letter that is a year old. Same words as
   * `tonight.fromTheBook.kicker` in PR #721; one of the two keys should go when both land.
   */
  homeSlip: {
    kicker: 'From the book',
    action: 'Read it',
    a11yHint: 'Opens the letter in the book.',
  },

  /**
   * The Book on the first day (NAV-TAB-ROLES R3, "Book starts nothing"): the closed cover, one calm line and one
   * quiet button that goes to Home, where Speak and Type live. The button names where it goes. No count, no gap.
   */
  bookEmpty: {
    title: 'The first page is waiting.',
    body: 'Each letter you keep will be here, month by month.',
    button: 'Go to Home',
    coverA11y: 'A closed book. The first page is waiting.',
  },
} as const;

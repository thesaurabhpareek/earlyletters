// BL-444 slice 2 (D-113, F11 6.2 D step 4): "Letters to {child}", the page of a book this phone has left.
// PROPOSED, every key: the heading words are the ones D-113 and F11 name; the lead and the empty line are content's
// default and wait for the product and content agents' read (PR body, open questions).
// Registered in features/index.ts as `leftBook`, so rules.test.ts reads it with the rest; test/left-book-copy.test.ts
// adds this page's rules.
// What these lines do not say: nothing about export or delete (BL-1960 built the rule; no screen offers either yet), nothing about the other parent's phone,
// and nothing about freshness. A left book is no longer pulled, so a letter changed elsewhere does not change here.
// Placeholder: {child} (a blank name reads "your child" through the app's fill()).
export const leftBookCopy = {
  // The Settings row under Children, one per book this phone has left, and the page's own title.
  title: 'Letters to {child}',
  // VoiceOver hint on that row.
  rowHint: "Opens the letters you wrote in {child}'s book.",
  // One line above the letters. BL-1960 step 1: the older line said "kept on this phone", a storage promise that the
  // delete rule (a left book's letters can be deleted and erased here) and DATA-REQ-016 were never read against. This
  // one only names what is on the page, so it promises nothing about keeping.
  lead: "The letters you wrote in {child}'s book.",
  // The page's title when the book is not there to read (it was joined again, or there is nothing left to show).
  emptyTitle: 'Letters',
  // The empty page: no book to show for this link.
  empty: 'There are no letters to show here.',
} as const;

// BL-1961 (BL-444 slice 3b; F11-REQ-011, DATA-REQ-016): the confirmation before a letter of a left book is deleted.
// PROPOSED, every key, and they need a privacy and content read: PRIV-R21 asks a Shown, Records, Never and Decline line
// for anything a person agrees to, and none is written for this delete yet. Data steward ruling: an `in_book` letter
// says it also leaves the book the other parent reads and the sheet adds `familyCopy.leave.cantTakeBack`; a private
// letter never names the other parent's book. No line says kept, stays, only you, on this phone or safe.
// What these do not say: nothing about the 30-day shelf (a left book's letter cannot be restored, BL-1959) and nothing about export.
// Registered as `leftBookDelete`. Placeholder: {coParent} (the app fills "your co-parent" when no sign-off is known).
export const leftBookDeleteCopy = {
  /** A letter that is in the book the other parent reads (`inBook`). The sheet adds `familyCopy.leave.cantTakeBack` under it. */
  bodyInBook: "This deletes the letter. It leaves the book {coParent} reads too. It can't be restored.",
  /** A private letter: it was never in the other parent's book, so the line does not name it. */
  bodyPrivate: "This deletes the letter. It can't be restored.",
} as const;

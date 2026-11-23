// BL-444 slice 2 (D-113, F11 6.2 D step 4): "Letters to {child}", the page of a book this phone has left.
// PROPOSED, every key: the heading words are the ones D-113 and F11 name; the lead and the empty line are content's
// default and wait for the product and content agents' read (PR body, open questions).
// Registered in features/index.ts as `leftBook`, so rules.test.ts reads it with the rest; test/left-book-copy.test.ts
// adds this page's rules.
// What these lines do not say: nothing about export or delete (later slices), nothing about the other parent's phone,
// and nothing about freshness. A left book is no longer pulled, so a letter changed elsewhere does not change here.
// Placeholder: {child} (a blank name reads "your child" through the app's fill()).
export const leftBookCopy = {
  // The Settings row under Children, one per book this phone has left, and the page's own title.
  title: 'Letters to {child}',
  // VoiceOver hint on that row.
  rowHint: "Opens the letters you wrote in {child}'s book.",
  // One line above the letters.
  lead: "You left {child}'s book. The letters you wrote in it are kept on this phone.",
  // The page's title when the book is not there to read (it was joined again, or there is nothing left to show).
  emptyTitle: 'Letters',
  // The empty page: no book to show for this link.
  empty: 'There are no letters to show here.',
} as const;

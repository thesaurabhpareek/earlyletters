// Find (NS-02, behind EXPO_PUBLIC_BOOK_SEARCH). Slots as docs/design/specs/02-FIND-11nov.md section 9 names them.
// PROPOSED, every key: the founder approves Find's words (BL-952 slice 6). From #798 (head 7f36031a) except notReady,
// which drops "still" (card 02-find section 16 bans it; NS-02-R39).
// Not registered in features/index.ts yet: that file belongs to the photo stack until #838 to #840 merge, and the one
// registration line follows then. test/find-copy.test.ts runs the general character rules on this file until it does.
// Rules: VOICE.md and BRAND.md. Find shows the parent's own words as kept and writes nothing, so no line describes,
// summarises or suggests. No number of results is ever said (R11); no line asks for a letter to be written (R13).
// The no-match view reuses book.empty.searchTitle (content rewords it without "yet": R39, open). Withdrawn for good:
// `hint` (a drawn line under three characters, R3) and `noMatchHelp` (a second no-match line, R13).
// Placeholders: {child} (a blank name reads "your child" through the app's fill()), {date}, {label} (the sentence).
export const findCopy = {
  // The Book header action: the visible and the VoiceOver name (R1).
  button: 'Find',
  // VoiceOver hint on that action.
  buttonHint: "Looks for a word in this book's letters.",
  // The field's placeholder; it names the book.
  placeholder: "Find in {child}'s book",
  // The field's VoiceOver label (R1).
  fieldLabel: 'Find a letter',
  // VoiceOver and Switch Control only, drawn nowhere (R23, FD-R13); names no number and does not claim three.
  // Review B on #798 offers "Type a word, or part of one, to start looking." because "letters" here can read as kept letters.
  fieldHint: 'A few letters are enough to start looking.',
  // Beside the failed view, only while the index is being made (R38).
  notReady: 'Find is getting ready on this phone.',
  // The failed view (R37), announced once.
  error: 'Find could not look just now.',
  retry: 'Try again',
  // One result, read aloud: no count, no score (R41).
  rowA11y: '{date}. {label}. Opens the letter.',
  // Announced when results appear. No number (R11).
  foundA11y: 'Letters found',
  clear: 'Clear',
  cancel: 'Cancel',
} as const;

// Find (NS-02, behind EXPO_PUBLIC_BOOK_SEARCH). Slots as docs/design/specs/02-FIND-11nov.md section 9 names them.
// Rules: VOICE.md and BRAND.md. Find looks through the parent's own words and shows them as they were kept; it
// writes nothing, so no line here describes, summarises or suggests. No number of results is ever said (NS-02-R11),
// and no line asks for a letter to be written (NS-02-R13). "No letters with that word yet." already exists as
// book.empty.searchTitle and is reused, not copied; the no-match view shows it and nothing else (NS-02-R13, FD-R10).
// Withdrawn by spec 02 section 9 and never to return: `hint` (a drawn line under three characters, NS-02-R3) and
// `noMatchHelp` (a second line under the no-match title, NS-02-R13). Tests pin both absences.
// Placeholders: {child} (the book's name; a blank name reads "your child" through the app's fill()), {date}, {label}
// (the matching sentence, as kept).
export const findCopy = {
  // The Book header action: the visible and the VoiceOver name.
  button: 'Find',
  // VoiceOver hint on that action.
  buttonHint: "Looks for a word in this book's letters.",
  // The field's placeholder; it names the book.
  placeholder: "Find in {child}'s book",
  // The field's VoiceOver label.
  fieldLabel: 'Find a letter',
  // TODO(founder): PROPOSED, needs word approval. The field's accessibility hint, read by VoiceOver and Switch Control
  // only and drawn nowhere (NS-02-R23, FD-R13): under three characters the screen still shows nothing (NS-02-R3). It
  // says a few letters start the search, names no number, and does not claim three (a CJK query matches from one).
  fieldHint: 'A few letters are enough to start looking.',
  // While the words are being gathered on this phone. True only while it is true.
  notReady: 'Find is still getting ready on this phone.',
  error: 'Find could not look just now.',
  retry: 'Try again',
  // One result, read aloud: no count, no score.
  rowA11y: '{date}. {label}. Opens the letter.',
  // Announced when results appear. No number.
  foundA11y: 'Letters found',
  clear: 'Clear',
  cancel: 'Cancel',
} as const;

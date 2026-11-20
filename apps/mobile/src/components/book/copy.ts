/**
 * Book strings not yet in packages/content (feature-local copy; the content
 * agent moves them into strings.en.ts under `book`). Content rules apply: the
 * rules test scans this file.
 */
export const bookCopy = {
  // book.nobodySpoke: a spoken letter whose recording had no talking in it (transcription outcome no_speech).
  // Shown as an app note (components/book/app-note.tsx: small, muted, unsigned), never in the letter's type.
  // Soft on purpose: the recording may hold laughing or babble, so it does not say that nobody spoke.
  nobodySpoke: 'No words in this one. The recording is kept just as it is.',

  // The Book page redesign (proposals/book-page.md 4, string slots). Working copy: `content` owns the words and moves
  // them to `book.*` in packages/content under the slot names given here.
  // book.chapterAge: a month's heading in the Book, in words ("18 months"). Month 0 and Before You keep their names
  // (book.chapterNewborn, book.beforeYouChapter). Read together and the date sheet still say "Month 7"; whether they
  // move to these words too is content's call (book-page.md 4, note on book.chapterAge).
  chapterAge: '{n} months',
  chapterAgeOne: '1 month',
  // book.months.button: opens the jump sheet. book.months.title: the sheet's title.
  monthsButton: 'Months',
  monthsTitle: 'Go to a month',
  // book.card.voice: the quiet marker on a card with a recording; never a play button. {duration} is "1:06".
  cardVoice: 'Voice {duration}',
  // book.card.voiceA11y: what VoiceOver says for it. {duration} is "1 minute 6 seconds".
  cardVoiceA11y: 'Voice recording, {duration}',
  // VoiceOver hint on the Months button and on each row of its sheet.
  monthsHint: 'Shows the months that have letters.',
  monthRowHint: 'Goes to this month in the book.',
} as const;

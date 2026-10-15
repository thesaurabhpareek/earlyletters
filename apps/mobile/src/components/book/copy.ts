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
} as const;

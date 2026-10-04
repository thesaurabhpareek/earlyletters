/**
 * Book strings not yet in packages/content (feature-local copy; the content
 * agent moves them into strings.en.ts under `book`). Content rules apply: the
 * rules test scans this file.
 */
export const bookCopy = {
  // book.nobodySpoke: a spoken letter whose recording had no talking in it (transcription outcome no_speech).
  // Shown instead of an empty excerpt on the card and the page. Calm, never an error.
  nobodySpoke: 'A quiet recording. Nobody spoke, and it is kept just as it is.',
} as const;

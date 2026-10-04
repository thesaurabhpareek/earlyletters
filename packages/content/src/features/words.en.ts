// Moved from apps/mobile/src/lib/transcription-queue/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Strings for words on their way: Review progress and the language-pack
 * wait (feature-local copy; the content agent moves them to
 * packages/content). Content rules apply: packages/content/test/rules.test.ts
 * scans this file. Placeholders: {name} a language name, {n} and {count}
 * numbers.
 */
export const wordsCopy = {
  preparing: 'Writing down what you said.',
  listening: 'Writing down what you said. Part {n} of {count}.',
  listeningA11y: 'Writing down what you said, part {n} of {count}',
  pack: {
    title: 'Your {name} words are on their way',
    body: 'Your voice is kept now. The words will follow as soon as this phone is ready for {name}.',
    progress: 'Getting ready, {n}%',
    waitingForWifi: 'Getting ready when you are on Wi-Fi.',
    noSpace: 'This phone needs a little more free space first.',
    // Shown before any download starts, so the size and the Wi-Fi rule are known first (BL-375).
    sizeLine: 'The download is about {size} MB and starts when you are on Wi-Fi.',
    keepButton: 'Keep my voice',
    typeButton: 'Type it instead',
    keptToast: 'Your voice is kept. The words will follow.',
  },
  noSpeech: {
    title: 'No talking in this one',
    body: 'The recording is kept just as it is. You can add words by typing them.',
    // Nobody spoke: one action each, the recording itself is never touched (D-086).
    tryAgainButton: 'Try again',
    recordAgainButton: 'Record again',
    typeButton: 'Type it instead',
    keepButton: 'Keep the recording',
  },
  // A saved letter still waiting for its words, on the letter page (D-086). The reason lines reuse `pack.*`.
  // Words that arrive later arrive exactly as said and are never fixed unread: the card asks for a read first.
  waiting: {
    writeButton: 'Write the words',
    retryButton: 'Try again',
    readyButton: 'Get words ready',
    recordAgainButton: 'Record again',
    readItBackButton: 'Read it back',
    readyBody: 'Words are ready. Read it back.',
    // Words arrived while the letter was closed: shown exactly as said, no fix proposed yet.
    arrivedNote: 'These words are exactly as you said them. Nothing has been fixed.',
    // The sheet where a person writes the words for a letter whose recording has none.
    writeTitle: 'Write the words',
    writeLabel: 'Words for this recording',
    saveButton: 'Save words',
    cancelButton: 'Not now',
  },
  unavailable: {
    title: 'Your voice is kept',
    body: 'Words cannot be written down on this phone yet. Keep the recording now and the words can come later. You can also type it.',
  },
};

/** Spoken-letter languages of v1.0 (D-056), as shown in the English interface. The single source for these names. */
export const languageNames = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  zh: 'Mandarin Chinese',
  fr: 'French',
  ar: 'Arabic',
  pt: 'Portuguese',
} as const;

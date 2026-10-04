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
    keepButton: 'Keep my voice',
    typeButton: 'Type it instead',
    keptToast: 'Your voice is kept. The words will follow.',
    // Shown when the person has not yet said yes to the one-time download (D-087). {size} is this phone's plan.
    askTitle: 'Get your {name} words ready',
    askBody: 'Your voice is kept. To write down the words, this phone needs a one-time download of {size}.',
    askButton: 'Download on Wi-Fi',
    // The Wi-Fi wait card: one time, this download only.
    mobileDataButton: 'Use mobile data {size}',
    // Review, after leaving the app ended the take.
    stoppedInBackground: 'The recording stopped when you left the app. Everything up to then is kept.',
  },
  noSpeech: {
    title: 'No talking in this one',
    body: 'The recording is kept just as it is. You can add words by typing them.',
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

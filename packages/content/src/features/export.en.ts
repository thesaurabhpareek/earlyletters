// Moved from apps/mobile/src/lib/export/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Export words. `{app}` is the public name, filled from packages/brand by the export builder.
 *
 * Screen strings that already exist are reused from content:
 * `settings.export.title`, `.body`, `.button`, `.preparing`, `.ready`.
 */
export const exportCopy = {
  screen: {
    includesTitle: 'What is inside',
    includesLetters: 'Every letter and note, as text',
    includesRecordings: 'Every recording on this phone, exactly as it was made',
    includesBook: 'A printable book for each child, by month',
    // D-074: what the machine changes is a "small fix", never a tidy-up.
    includesData: 'A data file with your words as heard, every small fix, and the final text',
    offlineNote: 'Works without a connection. Nothing is sent anywhere.',
    packing: 'Packing your letters',
    checking: 'Checking every file',
    progressA11y: 'Export progress',
    cancelButton: 'Stop',
    cancelled: 'Stopped. Nothing was kept.',
    shareButton: 'Save or share',
    /** DATA-REQ-056: one line, shown with the share action. */
    privacyNotice: 'This file holds your letters and recordings, unlocked. Keep it somewhere private.',
    afterShare: 'The copy on this phone has been cleared away. Export again any time.', // D-074 glossary
    againButton: 'Export again',
    failedTitle: 'The export did not finish',
    failedBody: 'Your letters and recordings are all still here. Please try again.',
    tooBigBody: 'This export is larger than one file can hold. Write to us and we will help you get every letter out.',
    lowSpaceBody: 'This phone needs a little more free space to make the export. Free some space and try again.',
    integrityNote: 'A recording changed after it was saved. It is included as it is now, and the data file marks it.',
  },

  /** Header lines at the top of each letters/*.txt file. */
  letterFile: {
    to: 'To',
    from: 'From',
    date: 'Date',
    how: 'How',
    recording: 'Recording',
    inBook: 'In the book',
    yes: 'Yes',
    no: 'No, kept private',
    waitingForWords: 'This recording is kept. Its words have not been written down yet.',
    recordingElsewhere: 'Not on this phone',
    exactlyHeard: 'Exactly what you said',
  },

  /** index.html, the offline reader. */
  reader: {
    title: 'Letters to {child}',
    privateLabel: 'Private',
    noRecording: 'Typed',
    recordingNotHere: 'Recording not on this phone',
    intro: 'Open any letter below. Recordings play right here, with no connection.',
  },

  /** The printable book (book/<child>.pdf). Cover and about page come from content `book`. */
  pdf: {
    coverSubtitleAll: 'Letters to {child}',
    yearHeading: 'Year {n}',
  },

  /** README.txt, line by line. */
  readme: [
    'Your {app} export',
    '',
    'Made on {date}. Everything below was on this phone when you made it.',
    '',
    'WHAT IS IN HERE',
    '',
    'book/       A printable book for each child, by month of age (PDF).',
    '            Letters you kept private are not in the printable book.',
    '            They are in letters/ and data/ with everything else.',
    'letters/    Every letter and note as a plain text file, one folder per child and month.',
    'audio/      Every recording on this phone, exactly as it was made (M4A, AAC).',
    '            Open them in any music or video player.',
    'data/       entries.json: every letter, with your words exactly as heard, every small',
    '            fix, and the final text. children.json and account.json: the books', // D-074
    '            and the plan on this phone.',
    'schema/     A description of the data files, for anyone building a reader.',
    'index.html  Open in any web browser to read every letter and hear every recording.',
    '            It works with no connection and no app.',
    '',
    'RECORDINGS',
    '',
    'Each recording is the original file, byte for byte. Nothing was changed.',
    'A letter whose recording is on another phone, or was never made, says so in data/entries.json.',
    '',
    'CHECKING THE FILES',
    '',
    'manifest.json lists every file with its size and SHA-256 fingerprint.',
    'manifest.sha256 holds the fingerprint of manifest.json itself.',
    'To check a file on a Mac:      shasum -a 256 audio/FILE.m4a',
    'To check a file on Windows:    certutil -hashfile audio\\FILE.m4a SHA256',
    'The result should match the line for that file in manifest.json.',
    '',
    'KEEPING IT SAFE',
    '',
    'This export is not locked with a password. Keep it somewhere private,',
    'and keep a second copy somewhere else.',
    '',
    'Format {format}, version {version}. Questions: {email}',
  ],
} as const;

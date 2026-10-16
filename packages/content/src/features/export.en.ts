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
    // v1.0 makes no notes (S43).
    includesLetters: 'Every letter, as text',
    includesRecordings: 'Every recording on this phone, exactly as it was made',
    includesBook: 'A printable book for each child, by month',
    // D-074: what the machine changes is a "small fix", never a tidy-up.
    includesData: 'A data file with your words as heard, every small fix, and the final text',
    // Option B (D-100): letters sync, so the line is about the export only, never a claim that nothing leaves
    // the phone. The export is built on this phone (lib/export reads no network). Counsel claims review.
    offlineNote: 'The export is made on this phone. It goes only where you send it.',
    // Above the disabled button while the book has no letter.
    emptyNote: 'You can export once the book has a letter.',
    packing: 'Packing your letters',
    checking: 'Checking every file',
    progressA11y: 'Export progress',
    cancelButton: 'Stop',
    // "Nothing was kept" could read as letters not kept.
    cancelled: 'Export stopped.',
    shareButton: 'Save or share',
    /** DATA-REQ-056: one line, shown with the share action. */
    privacyNotice: 'This file holds your letters and recordings, unlocked. Keep it somewhere private.',
    afterShare: 'The copy on this phone has been cleared away. Export again any time.', // D-074 glossary
    againButton: 'Export again',
    failedTitle: 'The export did not finish',
    failedBody: 'Your letters and recordings are all still here. Please try again.',
    // Too big: the title, then `settingsHome.helpValue` "Write to us" as the primary (S43).
    tooBigTitle: 'This book is too big for one file',
    tooBigBody: 'This export is larger than one file can hold. Write to us and we will help you get every letter out.', // retired by EXPERIENCE_PASS_2026-10; delete in P7 (the button says it)
    lowSpaceBody: 'This phone needs more free space first.',
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
    '            fix, and the final text. children.json: the books on this phone.', // D-074
    '            account.json: your plan, whether you were signed in, the books you belong to,',
    '            and the choices you made on this phone (see below).',
    'schema/     A description of the data files, for anyone building a reader.',
    'index.html  Open in any web browser to read every letter and hear every recording.',
    '            It works with no connection and no app.',
    '',
    'RECORDINGS',
    '',
    'Each recording is the original file, byte for byte. Nothing was changed.',
    'A letter whose recording is on another phone, or was never made, says so in data/entries.json.',
    '',
    'YOUR CHOICES ON THIS PHONE',
    '',
    'account.json says whether you answered yes to "Are you 18 or older?" on this phone,',
    'and your choice about sharing usage and crash reports ("not_answered" if you have',
    'not answered). These are the answers kept on this phone.',
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

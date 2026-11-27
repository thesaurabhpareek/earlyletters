// Moved from apps/mobile/src/lib/export/copy.ts on 3 Oct 2026; that file now re-exports this one.
/**
 * Export words. `{app}` is the public name, filled from packages/brand by the export builder.
 *
 * Screen strings that already exist are reused from content:
 * `settings.export.title`, `.button`, `.preparing`, `.ready`.
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
    // the phone. The export is built on this phone; signed in, it also reads the person's own consent record
    // and profile from the server for account.json (BL-323, BL-529), and sends nothing. Counsel claims review.
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
    failedTitle: "The export didn't finish",
    failedBody: 'Your letters and recordings are all still here. Try again.',
    // Too big: the title, then `settingsHome.helpValue` "Write to us" as the primary (S43).
    tooBigTitle: 'This book is too big for one file',
    lowSpaceBody: 'This phone needs more free space. Free some up, then try again.',
    integrityNote: 'A recording changed after it was saved. It is included as it is now, and the data file marks it.',
    /** Shown when the last guard held a picture back (NS-01-R6): not the stored copy, or it carries metadata. The letter is still there. */
    photoHeldBackOne: 'One picture did not pass the privacy check, so it was left out. Its letter is still in the export.',
    photoHeldBackMany: 'Some pictures did not pass the privacy check, so they were left out. Their letters are still in the export.',
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

  /**
   * Header lines of each waiting/*.txt file (PL-2, F14-REQ-039): a letter that is not in the book yet.
   * The person's own words follow: typed, or exactly as heard. Nothing is tidied, since nothing was kept.
   */
  waitingFile: {
    status: 'Waiting',
    reasons: {
      held_at_keep: 'Not kept yet. It waits on this phone until you keep it.',
      waiting_for_words: 'Its words have not been written down yet.',
      not_read_back: 'Not read back yet.',
      typed_draft: 'Still being written.',
      unrecoverable: 'This recording has no sound in it.',
    },
    typed: 'What you wrote',
    changed: 'Your words, as you changed them',
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
    'audio/      Every recording on this phone, exactly as it was made (AAC audio, as .m4a or .aac).',
    '            Open them in any music or video player.',
    'waiting/    Letters that are waiting to be kept or read back, when you have any:',
    '            your own words as a plain text file and the original recording.',
    'data/       entries.json: every letter, with your words exactly as heard, every small',
    '            fix, and the final text. children.json: the books on this phone.', // D-074
    '            account.json: your plan, whether you were signed in, the books you belong to,',
    '            the names we always spell your way, your consent choices and, when you are',
    '            signed in, your profile (see below).',
    '            waiting.json, when you have any: the letters that are waiting.',
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
    'and your choice about sharing usage ("not_answered" if you have not answered).',
    'These are the answers kept on this phone.',
    '',
    'YOUR CONSENT HISTORY',
    '',
    'When you are signed in, our server keeps a record of each time you agreed to, declined',
    'or acknowledged our terms, and each privacy choice you made or withdrew. account.json',
    'holds that record under "consent_history". It is read from our server while the',
    'export is made; if our server cannot be reached, it is the last full record this phone',
    'read, and "read_at" says when. If neither was there, "status" says why',
    '("not_signed_in", "unavailable" or "different_account"), and nothing from this phone',
    'is left out because of it.',
    '',
    'YOUR PROFILE',
    '',
    'When you are signed in, account.json also holds your profile as our server keeps it,',
    'under "profile", when it could be read while the export was made: the name on your',
    'account, your usual "From" name (a book can have its own, in "memberships"), and when',
    'you made your account. Its "status" works the same way as the consent history\'s.',
    '',
    'CHECKING THE FILES',
    '',
    'manifest.json lists every file with its size and SHA-256 fingerprint.',
    'manifest.sha256 holds the fingerprint of manifest.json itself.',
    'To check a file on a Mac:      shasum -a 256 audio/FILE',
    'To check a file on Windows:    certutil -hashfile audio\\FILE SHA256',
    'FILE is the full name of the recording, ending in .m4a or .aac.',
    'The result should match the line for that file in manifest.json.',
    '',
    'KEEPING IT SAFE',
    '',
    'This export is not locked with a password. Keep it somewhere private,',
    'and keep a second copy somewhere else.',
    '',
    'Format {format}, version {version}. Questions: {email}',
  ],
  /**
   * Added before KEEPING IT SAFE only when the export holds a picture (schema 1.7.0, BL-933; DELETION_AND_EXPORT_SPEC 4.2).
   * PROPOSED words: `content` owns the final wording (spec 4.2, the README line).
   */
  readmePhotos: [
    '',
    'PICTURES',
    '',
    'photos/     The pictures you added to letters, one folder per letter (JPEG).',
    '            Each is the copy kept in the app, with no location or other details in it.',
    '            data/entries.json says which letter each picture belongs to.',
  ],
} as const;

// PROPOSED (#1207, written 21 Nov 2026, read by nobody yet). The words the area A, B and D design files drafted for
// five screens, now as code so the design canvas can read them from here. Nothing in the app reads these keys yet and
// no built word changes. Source rows: docs/design/e2e/A-capture/WORDS.md 7.3 and 7.4, B-book-and-reading/WORDS.md 9,
// D-family-sharing-reminders/WORDS.md D-S19 and D-S20.
// PATH-09 (photo picker off, error and slow words) is not here: those rows stay CONTENT-NEEDED in
// docs/design/SCREEN-PATHS-20nov.md until a draft with a named source exists.
// Placeholders: {signsAs}, {child}, {coParent}. Never: invite, speaker, translate, detect, mixed, broken, or a promise of
// when a language arrives.
export const screenStates = {
  // A-S09 From sheet (NS-16, requirement NS-16-R1 to R18). Behind EXPO_PUBLIC_SIGN_AS_OTHER, off in production.
  from: {
    rowHintA11y: 'Changes the name this letter is signed with.',
    sheetTitle: 'Who is this letter from?',
    fieldLabel: 'From',
    fieldHint: 'Up to 30 characters. Some scripts count more characters than you see.',
    ask: 'Ask before you record someone else.',
    recentTitle: 'Names used on this phone',
    useMineButton: 'Use my name',
    doneButton: 'Done', // same words as the built common.doneButton (strings.en.ts); read that key when this is wired
    tooLong: 'That name is longer than 30 characters. A shorter one will fit.',
  },

  // A-S10 Another language (NS-17, requirement NS-17-R5 and R9).
  otherLanguage: {
    markLink: 'This was in another language',
    markHintA11y: 'Sets these words aside for good. The recording stays with this letter.',
    setAsideToast: 'Words set aside.',
    waiting: 'The words for this recording are waiting. You can type them yourself.',
    typeButton: 'Type the words',
    keepRecordingButton: 'Keep the recording', // same words as the built review.voiceOnlyButton (strings.en.ts)
    // Ready if the founder prefers a confirm to the Undo toast (W8).
    confirmTitle: 'Set these words aside?',
    confirmBody:
      'They will not be shown again or added to the book. Your recording stays with this letter, and you can type the words yourself.',
    confirmButton: 'Set the words aside',
    cancelButton: 'Leave as it is',
  },

  // B-S10 Who can read it (NS-21 row 5, requirement NS-21-R9). Never names the other parent.
  whoCanRead: {
    title: 'Who can read it',
    inBook: 'In the book',
    inBookHelp: "Everyone who reads {child}'s book can read it.",
    onlyYou: 'Only you',
    onlyYouHelp: 'Kept out of the book, for you alone.',
    saveFailed: 'That change did not save. The letter is as it was.',
  },

  // D-S19 Undo join confirm and D-S20 the other parent's phone (requirement R4, R13). Nothing preselected but the safe one.
  undoJoin: {
    title: 'Undo the join?',
    body: "{coParent}'s phone stops receiving this book. Their letters leave the book and stay theirs.",
    cantTakeBack: "Letters already on {coParent}'s phone or in an export can't be taken back.", // same words as the built family.leave.cantTakeBack (features/family.en.ts)
    keep: 'Keep them in the book',
    keepHintA11y: 'Nothing changes.',
    confirm: 'Undo join',
    working: 'Undoing the join',
    done: "{coParent} is no longer in {child}'s book.",
    closed: 'This can no longer be undone in the app.',
    failed: 'The undo did not finish. Nothing has changed. Try again.',
    undoneNote: 'This book is no longer shared with you. Your own letters stay yours, to read, export or delete.',
  },
} as const;

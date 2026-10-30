// All in-app copy (English).
// Placeholders: {name}, {child}, {signsAs}, {count}, {month}, {weekday}, {year}, {inviter},
// {a} and {b} (two names joined), {minutes} and {seconds}, {letters} and {notes} (counted phrases).
// {app} is the public name. It is filled from packages/brand when the app loads this copy
// (apps/mobile/src/lib/copy.ts), so the name is never typed in in-app copy (CLAUDE.md).
// v1.0 family scope is co-parent only (Brief decision 5). Keys marked "v1.1" are for other family members
// (grandparents, contributors, approvals); the app hides those paths in v1.0 and no public copy uses them.
// Keys ending in "button", "cta" or "action" are button labels (22 characters or fewer).
// Keys ending in "link" are text links and may run longer. Keys ending in "A11y" are
// VoiceOver labels or hints, never shown on screen.
//
// v1.0 scope (docs/DECISIONS.md, founder decisions of 3 Oct 2026): letters are spoken in one of 7
// languages (D-056), one per letter, with no Hindi-English mixing in one sentence until v1.1 (D-059);
// family at launch is the co-parent only (D-055); recordings stay on the phone that made them and in
// that person's own iPhone backup, with Export as the second copy (D-085 amends D-073: our own encrypted backup
// needs sign-in and a server, so it returns with them; no copy may claim it before then); family members hear each other's recordings only
// from v1.1 (D-059); Read together plays recordings on this phone with no word highlight (D-059).
// Copy must not promise any of those early.
// Privacy is said calmly and the same way everywhere: see `trust` and VOICE.md (D-061).
//
// Experience pass (docs/design/EXPERIENCE_PASS_2026-10.md, package P0): keys marked
// "retired by EXPERIENCE_PASS_2026-10; delete in P7" are no longer shown once their screen package lands.
// They stay until P7 so screen code that still reads them keeps compiling. Never reuse their words.
// Keys marked "held until Pn" keep their old words on purpose: today's screen would show the new words wrongly.
// The new words are in section 4 of the spec, and that package switches them together with its screen.

import { brand } from '@scribe/brand';

export const en = {
  app: {
    name: "{app}",
    category: brand.category,
    tagline: brand.tagline,
    // One descriptor everywhere (BRAND.md glossary).
    oneLine: "{app}, the baby memory book you fill by talking.",
  },

  common: {
    continueButton: "Continue",
    backButton: "Back",
    doneButton: "Done",
    saveButton: "Save",
    cancelButton: "Cancel",
    skipButton: "Skip for now",
    notNowButton: "Not now",
    tryAgainButton: "Try again",
    undoButton: "Undo",
    closeButton: "Close",
    editButton: "Edit",
    playButton: "Play",
    pauseButton: "Pause",
    signature: "From {signsAs}",
    // Two or more names: "Asha and Dev", "Asha, Dev and Nina" (the app joins the first ones with commas).
    andJoin: "{a} and {b}",
  },

  // Tab titles (experience pass S57): they move here from apps/mobile/src/app/(tabs)/_layout.tsx.
  tabs: {
    tonight: "Tonight",
    book: "Book",
    family: "Family",
  },

  onboarding: {
    welcome: {
      title: "{app}",
      subtitle: "The baby memory book you fill by talking.",
      body: "A few words at a time, in your own voice. Kept for {child} to read and hear for years.",
      freeLine: "Your first two letters are free.",
      startButton: "Begin the book",
      signInButton: "I already have a book",
      joinButton: "I was invited",
    },

    promise: {
      title: "Exactly as you said it.",
      // S04, directly under the title: the sanctioned promise word for word, then the two other claims. The title
      // ("Exactly as you said it.") carries "every sentence is one you said", so it is not said twice.
      body2: "We never rewrite your words, shorten them or write for you.",
      // The promise specimen (S04). The sample's raw words are cleaned at runtime by the real engine in packages/core,
      // verifyEdits included, and render whatever it returns. They are fictional and name no child.
      sampleLabel: "For example",
      sampleRaw: "Today, um, you you held the spoon all by yourself.",
      sampleHint: "Word for word marks every small fix. Tap one to put it back.",
      // First run only: backup cannot be on yet, so "on this phone" is true here (lawyer-2 H4).
      recordingBody: "The recording is kept on this phone, so one day {child} can hear you say it.",
      privateNote: "Private by default. You choose what goes in the book.",
      cta: "That sounds right",
    },

    child: {
      title: "Who is this book for?",
      nameLabel: "Name",
      // The second and later name rows (twins or more).
      nameLabelMore: "Another child's name",
      // Short enough for the serif 22 pt name field on a 375 pt phone: 272 of 302 pt, where "First name, or the name you use at home" (421 pt) was clipped.
      namePlaceholder: "First name, or a nickname",
      birthdayLabel: "Birthday",
      expectingLabel: "Not here yet",
      expectingHelp: "Letters written before the birth go in Before You.",
      dueDateLabel: "Due date",
      // Twins: removes an extra name row.
      removeA11y: "Remove {child}",
      addAnotherButton: "Add another child",
      // Twins or more, same birthday or due date, during first run (PRD.md K-12).
      addAnotherHelp: "Twins or more? Each child gets their own book.",
      // Why Continue is waiting (shown in words, never only a greyed button).
      needNameMany: "Fill in or remove this name to continue.",
      needBirthday: "Choose {child}'s birthday to continue.",
      needDueDate: "Choose the due date to continue.",
      chooseDate: "Choose a date",
      bornToday: "Born today",
      // A long name: said gently, once the field is close to its limit.
      nameLimit: "A name can have up to {n} characters.",
      cta: "Continue",
    },

    signsAs: {
      title: "What does {child} call you?",
      // Twins or more: {child} is the joined names, so the verb is plural.
      titleMany: "What do {child} call you?",
      placeholder: "Papa, Mama, Amma, Baba, Dad",
      examplesLabel: "A few ideas",
      // US storefront only (D-087), so "Mommy".
      examples: ["Mama", "Papa", "Amma", "Appa", "Mommy", "Daddy", "Ma", "Baba"],
      notYetHelp: "Not talking yet? Pick the name you hope to hear.",
      preview: "From {signsAs}",
      needSignsAs: "Add what {child} calls you to continue.",
      // Twins or more: {child} is the joined names, so the verb is plural (as titleMany).
      needSignsAsMany: "Add what {child} call you to continue.",
      cta: "Sign my letters",
    },

    dictionary: {
      title: "Your words, spelled your way",
      body: "Add names and home words you use often. We will spell them the way you do.",
      examples: "Like Nani, chhotu, or the name of a stuffed rabbit.",
      addPlaceholder: "Add a word or name",
      addButton: "Add word",
      emptyHint: "You can always add more from Settings.",
      cta: "Continue",
    },

    nameCheck: {
      title: "Say {child}'s name three times",
      body: "So we hear it the way you say it.",
      countLabel: "{count} of 3",
      listeningLabel: "Listening",
      heardLabel: "We heard:",
      correctPrompt: "Is that how you spell it?",
      yesButton: "Yes, that's it",
      fixButton: "Let me spell it",
      spellPlaceholder: "Type it your way",
      doneTitle: "Got it.",
      doneBody: "{child} will be spelled your way in every letter.",
      cta: "Continue",
    },

    // Shown as a card on Tonight after the first letter is saved, never during first run (PRD.md K-02).
    reminder: {
      title: "A gentle nudge, now and then?",
      body: "A couple of evenings a week, at a time you pick. Never late at night.",
      yesEveningsButton: "Yes, evenings",
      pickTimeButton: "Pick a time",
      timeLabel: "Remind me at",
      noneOption: "No reminders",
      noneHelp: "You can write whenever you like.",
      permissionTitle: "A few evenings a week",
      permissionBody: "Just a nudge. You can change the time or turn it off any time.",
      cta: "Set reminder",
    },

    // v1.0: the co-parent only (Brief decision 5).
    invite: {
      title: "Writing this with someone?",
      body: "Invite {child}'s other parent to add letters of their own, each one signed.",
      privacyNote: "Your private letters stay yours until you add them to the book.",
      addButton: "Invite co-parent",
      laterButton: "Maybe later",
    },

    finish: {
      title: "The book is open.",
      body: "Say one thing about {child} today. That is a letter.",
      cta: "Write the first one",
    },
  },

  tonight: {
    greeting: {
      earlyMorning: "Early start, {name}.",
      morning: "Good morning, {name}.",
      midday: "Hello, {name}.",
      afternoon: "Good afternoon, {name}.",
      evening: "Good evening, {name}.",
      night: "The house is quiet, {name}.",
      lateNight: "Still up, {name}. Take your time.",
    },
    // Accessibility hint of the prompt only, never visible (S09).
    promptLabel: "A thought to start with",
    newPromptButton: "Another thought",
    writeFreelyButton: "Just talk",
    speakButton: "Speak",
    typeButton: "Type",
    notMuchButton: "Not much today",
    noteOrLetter: {
      label: "What is this?",
      note: "A note",
      noteHelp: "Something small, right now.",
      letter: "A letter",
      letterHelp: "Something you want {child} to keep.",
    },
    states: {
      ready: "Ready when you are.",
      readyHint: "Tap and talk. Pauses are fine.",
      listening: "Listening.",
      listeningHint: "Say it however it comes.",
      stillHere: "Still here. Take your time.",
      paused: "Paused.",
      resumeButton: "Keep talking",
      stopButton: "Finish",
      saving: "Keeping your words safe.",
      saved: "Saved, in your words.",
      savedLetter: "Signed and kept.",
      transcribing: "Writing down what you said.",
    },
    typing: {
      placeholder: "Write it the way you would say it.",
      saveButton: "Save",
    },
    // A take that was recorded but not yet read back (TDD 01 3.4).
    draftWaiting: {
      // The first row of a draft card on Tonight: a spoken draft whose words are ready but not shown (S09, P3).
      title: "A recording is ready to read back.",
    },
    // One card per unfinished letter on Tonight, newest first, never a total (S09). A card shows the person's own
    // first words when it has them; these are the state lines and actions. Spoken and waiting for its words reuses
    // `book.waitingForWords`; read back reuses `tonight.afterSave.reviewButton`.
    draft: {
      held: "Waiting to be kept.",
      // Not "Kept": that is the Keep step's word, and this card is not kept yet.
      swept: "Recorded before the app closed.",
      typedA11y: "A letter you started, {date}.",
      pickUpButton: "Pick it up",
      openButton: "Open",
      keepButton: "Keep it",
    },
    // When no draft is waiting and a letter is 28 to 35 days old: the newest one, never a count or a gap,
    // never a private letter (S09, DESIGN_LANGUAGE 12).
    resurfaced: {
      kicker: "A month ago",
      a11y: "A letter from {date}. Opens the letter.",
    },
    afterSave: {
      title: "Kept.",
      body: "One more page for {child}.",
      reviewButton: "Read it back",
      doneButton: "Done for tonight",
      anotherButton: "Add another",
    },
  },

  // Listening screen (DESIGN_LANGUAGE 12).
  listen: {
    toChild: "To {child}",
    audience: "Only you, until you add it to the book.",
    elapsedA11y: "{minutes} min {seconds} s recorded",
    // Shown when Listen opens without a tap on Speak (a link, a restored screen): nothing records until the person taps.
    ready: {
      // Listening at rest: the red circle is the start control (BRAND.md glossary phrase).
      hint: "Tap the red circle and talk.",
      startA11y: "Start recording",
    },
    discardButton: "Let it go",
    discardTitle: "Let this recording go?",
    discardBody: "It will be removed from this phone.",
    discardConfirm: "Remove it",
    keepButton: "Keep it",
  },

  // Write screen (COMPONENTS 2.8).
  write: {
    label: "Your letter",
    autosaved: "Saved on this phone",
    // Autosave failed; shown in the same place, retried on the next pause.
    notSaved: "Not saved yet",
  },

  // D-084: "Not much today" stores a mark with no text. The app never writes a sentence for the person.
  notMuch: {
    button: "Not much today",
    confirmBody: "Marks today without writing anything.",
    // True at any hour; the same words as `book.quietDay.a11y`.
    savedToast: "A quiet day, kept.",
    undo: "Undo",
  },

  review: {
    title: "Read it back",
    // The edit feature is called "Word for word" (D-074) and only where the feature is named (D-086: the promise,
    // Settings, store, website). Here, plain words: a "small fix" is named by what happened, and "Exactly as said"
    // is said only when it is true. Never "edit", "correct", "clean" or "tidy" in text a person reads.
    // The letter sheet's header row, left (S17). The right side is `common.signature`.
    headerTo: "To {child} · Month {month}",
    headerToNewborn: "To {child} · The first weeks",
    headerToBefore: "To {child} · Before You",
    // Writing down a long take (S14): after 8 s, then a quiet way out after 15 s with no progress.
    waitingLong: "Long recordings take a little more time.",
    laterButton: "Read it back later",
    // The take's file is missing, or the take ended before any sound (S16). Never claims a recording is kept.
    missingFile: {
      title: "The recording did not save",
    },
    emptyTake: {
      title: "Nothing was recorded",
      body: "The recording ended before any sound came in.",
    },
    // Review opened with nothing to read back (a stale link, S23). `errors.generic` stays for real failures.
    noDraft: {
      title: "Nothing to read back here",
      button: "Go to the book",
    },
    // A save that failed: a caution line above the primary, which reads "Try again" for that attempt (S17).
    // The words are safe first, then what happened (VOICE).
    saveFailed: "Your words are still here. That did not work this time.",
    // The one view control, "With small fixes | Exactly as said": the view and the choice for this letter, until it is saved.
    view: {
      fixes: "With small fixes",
      exact: "Exactly as said",
      a11y: "How this letter reads",
    },
    changesLabel: "{count} small fixes",
    changesLabelOne: "1 small fix",
    // Zero fixes, three honest wordings.
    noChanges: "Nothing to fix. This is exactly what you said.",
    noChangesAfterUndo: "Every fix put back. This is exactly what you said.",
    // A language with no fix rules yet: never a "nothing needed fixing" claim there.
    noChangesNoRules: "Exactly as you said it.",
    originalLabel: "Exactly what you said",
    cardYouSaid: "You said",
    cardNowReads: "Now it reads",
    cardTakenOut: "Taken out",
    // A fix that changed a word: "Usher to Asha".
    rowChange: "{a} to {b}",
    undoEditButton: "Put it back",
    putBackToast: "Put back.",
    editTextButton: "Change words",
    editA11yHint: "Small fix. Double tap to see what you said.",
    removedA11y: "Words taken out here",
    removedWordsA11y: "Taken out: {name}",
    toChildA11y: "To {child}. Change",
    // A recording kept before the words are ready on this phone (ADR 0001, TDD 03 FM-9).
    voiceOnlyButton: "Keep the recording",
    waiting: {
      title: "Your voice is kept",
      body: "Your words follow once the download is done.",
    },
    // Development builds only: the sample transcriber's words are never saved.
    dev: {
      sampleBanner: "Sample words for testing, not your recording.",
      sampleNotSaved: "Sample words are never saved. Keep the recording only, or type it.",
    },
    // Each fix is named by what happened, never by category (D-086).
    edits: {
      filler: {
        label: "Took out a sound",
        explain: "An um or an uh, taken out.",
      },
      falseStart: {
        label: "Took out a restart",
        explain: "A sentence begun twice. The second try is kept.",
      },
      repeat: {
        label: "Took out a repeat",
        explain: "A word said twice in a row. One is kept.",
      },
      misheardName: {
        label: "Spelled your way",
        explain: "A misheard name, spelled your way.",
      },
      punctuation: {
        label: "Punctuation",
        explain: "Commas and periods, where you paused.",
      },
      grammarSlip: {
        label: "One word fixed",
        explain: "A slip of the tongue, like \"a apple\". Only that word changed.",
      },
      paragraph: {
        label: "New paragraph",
        explain: "A long pause. A new paragraph starts here.",
      },
      // A punctuation edit that only wrote a character in the author's chosen script (ADR 0014
      // section 4; packages/core describeEdit returns 'script'). Same word, same letters.
      script: {
        label: "Your script",
        explain: "The same word, in the script you chose.",
      },
    },
    lock: {
      button: "Keep this as said",
      explain: "Locked phrases stay exactly as you said them, slips and all.",
      lockedLabel: "Kept as said",
      unlockButton: "Allow small fixes",
    },
    destination: {
      title: "Where should this go?",
      addButton: "Add to {child}'s book",
      // Used when the filled `addButton` label would pass 22 characters (a long or two-word name).
      addButtonShort: "Add to the book",
      privateButton: "Keep private",
      addedToast: "Added to {child}'s book.",
      // The saved moment's chip: where the letter now sits in the book (S21, MOTION 5e).
      filedChip: "Kept in Month {month}",
      filedChipNewborn: "Kept in the first weeks",
      filedChipBefore: "Kept in Before You",
      privateToast: "Kept just for you.",
      voiceOnlyToast: "Recording kept on this phone.",
    },
    addWordToDictionary: "Add \"{name}\" to your words",
    playButton: "Hear it",
    // One-time card, the first time a spoken letter is transcribed on this install (in-app-disclosures.md section 2).
    firstNote: {
      title: "Please have a read",
      body: "We take out small slips, like an um or a repeat, and mark each one. Tap a mark to see it and put it back. We can mishear a name, so please read it before you save.",
      dismissButton: "Got it",
    },
  },

  quickNote: {
    title: "Quick note",
    subtitle: "Something small, right now.",
    placeholder: "What just happened?",
    speakButton: "Speak",
    typeButton: "Type",
    photoButton: "Add a photo",
    saveButton: "Save note",
    savedToast: "Noted. It is in Month {month}.",
    widgetLabel: "Quick note for {child}",
    lockScreenLabel: "Note for {child}",
  },

  book: {
    title: "{child}'s book",
    subtitle: "{app}: Year One",
    yearTitle: "{app}: Year {year}",
    beforeYouChapter: "Before You",
    chapterTitle: "Month {month}",
    // Month openers (S26): the kicker above the numeral (caps by style), then the date range of that month of age.
    // {a} and {b} are the first and last day, for example "September 13 to October 12".
    monthKicker: "Month",
    monthRange: "{a} to {b}",
    // v1.0 makes no notes (S26).
    chapterSubtitleOne: "1 letter",
    chapterLetters: "{count} letters",
    chapterNotes: "{count} notes", // retired by EXPERIENCE_PASS_2026-10; delete in P7
    chapterNoteOne: "1 note", // retired by EXPERIENCE_PASS_2026-10; delete in P7
    chapterMixed: "{letters} and {notes}", // retired by EXPERIENCE_PASS_2026-10; delete in P7
    // A spoken letter kept before its words were ready (TDD 01 OQ-11).
    waitingForWords: "A recording, waiting for its words.",
    // The waiting card's live reason when the words are there to read back.
    waitingReady: "Ready to read back",
    chapterNewborn: "The first weeks",
    thisMonthLabel: "This month",
    signature: "From {signsAs}",
    together: "From {signsAs} and {child}",
    // A month opener's signature line when both parents wrote that month (S26).
    fromTwo: "From {a} and {b}",
    provenance: {
      spokenFixed: "Spoken, with small fixes",
      spokenExact: "Spoken, exactly as said",
      // Another parent's letter: this phone never holds their raw words (book_entries leaves them out), so it cannot
      // know whether any fix was made and says only that the letter was spoken (P5 critics' pass, S8).
      spokenOther: "Spoken",
      typed: "Typed",
    },
    hearLink: "Hear it in {signsAs}'s voice",
    hearShort: "Hear {signsAs}",
    recordingOnPhone: "Recording kept on this phone",
    // The letter page when encrypted backup holds the recording too (S27; option B, D-100, D-102). P8 shows it.
    recordingBackedUp: "Recording kept on this phone and backed up",
    // v1.0: recordings stay on the phone that made them (D-059), so a co-parent's voice is on their own phone.
    recordingElsewhere: "Recording kept on {signsAs}'s phone",
    privateLabel: "Private",
    // D-084: a quiet-day mark is the app's own small line, never a letter: no text, no signature.
    quietDay: {
      label: "A quiet day",
      a11y: "{date}. A quiet day, kept.",
      remove: "Remove this mark",
      removedToast: "Mark removed.",
    },
    familyLabel: "From family", // v1.1
    filters: {
      all: "All",
      letters: "Letters",
      notes: "Notes",
      family: "Family",
      private: "Private",
    },
    empty: {
      bookTitle: "The first page is waiting.",
      bookBody: "Tell {child} one thing about today.",
      bookCta: "Write a letter",
      // v1.1: family members beyond the co-parent.
      familyTitle: "Family letters will gather here.",
      familyBody: "Invite a grandparent, aunt or uncle to add their words.",
      familyCta: "Invite family",
      privateTitle: "Nothing private yet.",
      privateBody: "Letters you keep for yourself will rest here.",
      searchTitle: "No letters with that word yet.",
    },
    entryMenu: {
      moveToBook: "Add to book",
      makePrivate: "Make private",
      editButton: "Edit words",
      showOriginal: "Show exactly what I said",
      shareButton: "Share",
      deleteButton: "Delete",
    },
    // No printed-book prompt: v1 is digital only; printed books are a future launch (PRD.md K-32).
  },

  readTogether: {
    title: "Read together",
    // v1.0: plays the recordings on this phone (D-059); no word highlight yet (D-059).
    subtitle: "Open the book with {child}. Letters spoken on this phone play in the voice that said them.",
    chooseMonth: "Pick a month",
    chooseAuthor: "Letters from",
    everyone: "Everyone",
    startButton: "Start reading",
    playButton: "Play",
    pauseButton: "Pause",
    nextButton: "Next letter",
    previousButton: "Back one",
    replayButton: "Hear it again",
    autoplayLabel: "Keep playing",
    // The dateline (S30): the month first, then who signed it, in the same shape for all three chapters. VoiceOver
    // hears it without the separator ("Month 4, from Mama").
    nowReading: "Month {month} · From {signsAs}",
    nowReadingNewborn: "The first weeks · From {signsAs}",
    nowReadingBefore: "Before You · From {signsAs}",
    // VoiceOver only; the screen shows a hairline progress line, never "1 / 5".
    positionA11y: "Letter {n} of {count}",
    noRecording: "This one was typed. Read it aloud together.",
    recordingElsewhere: "{signsAs}'s voice is on their phone. Read this one aloud together.",
    empty: "Letters you add to the book will be here to read together.",
    // The app adds no sentiment of its own; the letters carry the love (VOICE, the app's own words).
    endOfMonth: "That was Month {month}.",
    endOfBook: "That is every letter so far. More are still being written.",
    againButton: "Read it again",
    nextMonthButton: "On to Month {month}",
    finishButton: "Close the book",
    makeLetterTogether: {
      title: "Write one together",
      body: "Ask {child} a question and record the answer, together.",
      cta: "Write together",
    },
  },

  // v1.1 except `title`: invites for family beyond the co-parent, contributor welcome, approvals and the
  // contributor's own view. The app hides these paths in v1.0 (Brief decision 5).
  family: {
    title: "Family",
    invite: {
      title: "Invite someone to write",
      body: "They can send letters to {child}. You choose which ones go in the book.",
      nameLabel: "Their name",
      signsAsLabel: "What does {child} call them?",
      signsAsPlaceholder: "Nani, Dadi, Grandpa, Aunty",
      relationLabel: "Who are they to {child}?",
      sendButton: "Send invite",
      copyLinkButton: "Copy invite link",
      sentToast: "Invite sent to {signsAs}.",
      pendingLabel: "Invited",
      resendButton: "Send again",
      removeButton: "Remove",
    },
    shareMessage: {
      imessage: "Hi {signsAs}, it's {inviter}. I'm keeping a memory book of letters for {child}, and I'd love yours in it. Just talk, and your words and voice are kept for {child}. This link opens the free app on your iPhone, or helps you get it:",
      whatsapp: "{signsAs}, it's {inviter}. We are making a book of letters for {child}. Will you add yours? You just talk, in your own words. Get the free app and join here:",
      short: "{inviter} would love your letters in {child}'s book.",
    },
    contributorWelcome: {
      title: "Welcome, {signsAs}.",
      body: "{inviter} is keeping a book of letters for {child}. Yours can be part of it.",
      howTitle: "How it works",
      howStep1: "Tap the red circle and talk, in the language you speak.",
      howStep2: "Your words are kept exactly as you said them.",
      howStep3: "{inviter} adds your letter to {child}'s book.",
      voiceNote: "Your recording is kept on your phone too, so one day {child} can hear you tell it.",
      privacyNote: "Only {child}'s parents see your letters until they go in the book.",
      cta: "Write my first letter",
      firstPrompt: "Tell {child} about the first time you met.",
    },
    approval: {
      listTitle: "Letters from family",
      newBadge: "New",
      cardTitle: "A letter from {signsAs}",
      cardBody: "{signsAs} wrote to {child}. Would you like it in the book?",
      addButton: "Add to the book",
      keepAsideButton: "Keep it aside",
      keepAsideHelp: "It stays safe, just outside the book. {signsAs} will not be told.",
      thankButton: "Send a thank you",
      thankMessage: "Your letter is in {child}'s book. Thank you, {signsAs}.",
      addedToast: "{signsAs}'s letter is in the book.",
      settingLabel: "Add family letters automatically",
      settingHelp: "Skip the check and add every letter from {signsAs} straight to the book.",
    },
    contributorBook: {
      title: "Your letters to {child}",
      inBookLabel: "In the book",
      waitingLabel: "With {inviter}",
      emptyTitle: "Your first letter is waiting to be written.",
    },
  },

  notifications: {
    evening: [
      { title: "A minute for {child}?", body: "Tell {child} one thing about today. A sentence is plenty." },
      { title: "Tonight's letter", body: "What made you smile today? Say it out loud and we will keep it." },
      { title: "Dear {child},", body: "Your words, kept for {child}. Today, and long after." },
      { title: "The house is quiet", body: "A good moment for a few words to {child}." },
      { title: "One small thing", body: "What did {child} do today that you want to remember?" },
      { title: "Your voice, kept", body: "Talk for a minute. {child} will hear it one day, just as you said it." },
      { title: "Before you sleep", body: "Something {child} did, said or tried. Or just tap Not much today." },
      { title: "A page for {weekday}", body: "Whatever today held, it belongs in {child}'s book." },
    ],
    gentleReturn: {
      title: "{child}'s book is right here",
      body: "Whenever you like, there is a page for today. Just talk.",
    },
    // v1.1: familyLetter and familyAdded.
    familyLetter: {
      title: "A letter from {signsAs}",
      body: "{signsAs} wrote something for {child}. Have a read.",
    },
    familyAdded: {
      title: "Your letter is in the book",
      body: "{inviter} added your letter to {child}'s book. Thank you.",
    },
    monthOpen: {
      title: "Month {month} begins",
      body: "A new month in {child}'s book is open.",
    },
    birthday: {
      title: "Happy birthday, {child}",
      body: "A year of letters. Want to read them together today?",
    },
  },

  moments: {
    firstLetter: {
      title: "The first letter.",
      body: "Every book starts with one. This one is in your words.",
    },
    letters10: {
      title: "10 letters.",
      body: "Ten pieces of {child}'s story, told by you.",
    },
    letters50: {
      title: "50 letters.",
      body: "Fifty small moments, kept in your own voice.",
    },
    letters100: {
      title: "100 letters.",
      body: "A hundred times you stopped to tell {child} something. That is love, written down.",
    },
    letters365: {
      title: "365 letters.",
      body: "A year's worth of your words for {child}. All the work, all the love, kept.",
    },
    firstMonthComplete: {
      title: "Month {month} is in the book now.",
      body: "{count} letters and notes, ready for {child} to read one day.",
      cta: "Read this month",
    },
    // v1.1.
    firstGrandparentLetter: {
      title: "{signsAs} wrote to {child}.",
      body: "Another voice joins the book.",
    },
    firstReadTogether: {
      title: "You read it together.",
      body: "The first of many times {child} will hear these letters.",
    },
    monthSummary: "{count} letters this month",
    monthSummaryFamily: "{count} letters from family this month", // v1.1
    dismissButton: "Lovely",
  },

  settings: {
    title: "Settings",
    sections: {
      book: "The book",
      voice: "Recordings",
      words: "Your words",
      family: "Family",
      reminders: "Reminders",
      data: "Your data",
      // Labels the emails point to (customer review CUS-03): "Settings, Plan, Manage subscription" and friends.
      plan: "Plan",
      account: "Account",
    },
    // Settings > Plan. Every billing email and the Subscription terms name these exact labels.
    plan: {
      manageLabel: "Manage subscription",
      refundLabel: "Request a refund",
      // Plus reaches a co-parent only through Apple Family Sharing (Terms 14.12, D-080).
      includedByFamilySharing: "Included through Family Sharing",
      familySharingHelp: "Plus is shared through Apple Family Sharing. {child}'s other parent gets it too if you are in the same Apple family. Otherwise each of you has your own plan, and everything free stays free for both of you.",
    },
    // Settings > Account. The sign-in emails name these exact labels.
    account: {
      emailLabel: "Sign-in email",
      methodsLabel: "Sign-in methods",
      signOutButton: "Sign out",
      signOutOthersButton: "Sign out other devices",
    },
    signsAsLabel: "Sign my letters as",
    childLabel: "Child",
    birthdayLabel: "Birthday",
    dictionaryLabel: "Names and words",
    dictionaryHelp: "Spelled your way, every time.",
    // D-074: the edit feature is "Word for word"; its changes are small fixes, marked and undoable.
    tidyLabel: "Word for word",
    tidyOn: "Small fixes, marked",
    tidyOff: "Exactly as said",
    tidyHelp: "Small fixes are marked in each letter and can be put back. Exactly as said keeps every um and false start. Either way, we never rewrite your words.",
    // D-085 (amends D-073): v1.0 has no backup of our own; onPhone* is the honest line. Our encrypted backup,
    // with its strings, returns with sign-in and a server (v1.1).
    recordings: {
      title: "Recordings",
      keepLabel: "Keep recordings",
      onPhoneTitle: "Kept on this phone",
      onPhoneBody: "Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own.",
      // Option B (D-100, D-102; experience pass S42): the Recordings card with our encrypted backup off, and on.
      // Nothing shows these until P8 builds the backup screens.
      onPhoneBodyBackupOff: "Recordings are kept on this phone and in your iPhone's own backup, if you use one. Our encrypted backup can keep them too, so they come back on a new phone.",
      backedUpTitle: "Kept on this phone and backed up",
      // Disclosure text with "we" (D-102, counsel item C7): it names the recovery key we hold. Counsel must approve it
      // before any screen shows it; `P0_WE_ALLOWED` in test/support/copy-surfaces.ts (enforced by rules.test.ts) allows its "we" for that reason only.
      backedUpBody: "Recordings are kept on this phone and in our encrypted backup. We hold a recovery key under strict, logged access, so they can come back on a new phone. We never listen to them, sell them or use them to train models.",
      exportFooter: "Export any time to keep a copy of your own.",
      storageUsed: "{count} MB used on this phone",
      // Audio the launch sweep found with no letter while no book existed (TDD 01 3.2.4). Never deleted.
      orphansTitle: "Recordings without a letter",
      orphansOne: "1 recording on this phone is not part of a letter yet. It stays on this phone.",
      orphansMany: "{count} recordings on this phone are not part of a letter yet. They stay on this phone.",
      // D-085: a take a kill cut off that would not open is kept, never dropped. Counts as a plain sentence.
      unplayableTitle: "Takes that may not play",
      unplayableOne: "This take may not play. Export keeps the file.",
      unplayableMany: "{count} takes may not play. Export keeps the files.",
    },
    export: {
      title: "Export",
      button: "Export everything",
      preparing: "Gathering every letter. This can take a minute.",
      ready: "Your export is ready.",
      whereItGoes: "You choose where to keep it, for example in the Files app.",
      // D-085: no claim of a backup. The date is when a copy was last prepared, not proof it was saved.
      lastExport: "Last export: {date}",
      neverExported: "Not exported yet",
      exportNudge: "Save a copy of your book in Files or iCloud Drive. It is yours to keep.",
    },
    delete: {
      entryTitle: "Delete this letter?",
      entryBody: "It waits in Recently deleted for 30 days.",
      entryConfirm: "Delete letter",
      entryToast: "Letter deleted.",
      recentlyDeleted: "Recently deleted",
      restoreButton: "Restore",
      // D-085: Recently deleted shelf (30 days, Restore, Erase now).
      keepButton: "Keep it",
      shelfHelp: "Letters you delete wait here for 30 days.",
      shelfEmpty: "No deleted letters.",
      deletedOn: "Deleted {date}",
      // A future date, so it never reads as already done (S38).
      erasesOn: "Kept here until {date}",
      eraseNow: "Erase now",
      eraseNowTitle: "Erase this letter now?",
      // Option B (D-100): a synced letter is not only on this phone, so the erase lines name no place.
      // Counsel claims review (listed in the P0 pull request).
      eraseNowBody: "The letter and its recording are erased for good.",
      // After Restore (S38), with "Open"; {child} is the restored letter's book.
      restoredToast: "Back in {child}'s book.",
      // Restore when no book can be named (the letter's book is gone and none is open): the same line without a name,
      // so the toast never reads "Back in 's book." (P5 critics' pass, L9).
      restoredToastNoName: "Back in the book.",
      // The toast action after Restore (S38).
      openButton: "Open",
      // After Erase now. It carries no action, so it may time out.
      erasedToast: "Letter erased.",
      // Erase now when the recording's file could not be removed: the letter was not erased, the row stays for another try
      // (D-085, file first). What did not happen, then what is true; it makes no claim about the recording's file.
      eraseFailedToast: "The letter was not erased. It is still in Recently deleted.",
      bookTitle: "Delete the whole book?",
      bookBody: "Every letter and recording in {child}'s book will be removed from this phone and from our servers. Family members can save a copy of their own letters first.",
      bookBodyCoParent: "{child}'s book stays with your co-parent. Your own letters and recordings in it will be removed.",
      bookUndo: "You have 30 days to change your mind. After that, it cannot be restored.",
      bookExportFirst: "You can export everything first, free.",
      bookConfirm: "Delete the book",
      bookTypeToConfirmLabel: "Type {child}'s name to confirm",
      accountTitle: "Delete your account",
      accountConfirm: "Delete account",
      // Shown while a deletion request is in its 30-day grace period. The date is shown beside it.
      accountScheduledTitle: "Your account is set to be deleted",
      accountScheduledBody: "Until then you can export everything, or cancel and keep your account just as it is.",
      accountScheduledDateLabel: "Deletion date",
      cancelDeletionButton: "Cancel deletion",
    },
    reminders: {
      cadenceLabel: "Reminders",
      timeLabel: "Reminder time",
      offLabel: "Off",
      weeklyLabel: "Weekly",
      fewTimesLabel: "A few times a week",
      everyEveningLabel: "Every evening",
      help: "A gentle nudge a few evenings a week, at the time you choose. Never late at night.",
    },
    privacyLine: "Private by default. You decide what goes in the book.",
    help: {
      mistakesTitle: "How transcription works",
      mistakes: "Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong.",
      // Shutdown and portability pledge (PRD-REQ-009, PRD.md K-05). Same number and promise as Terms 17
      // and Privacy Policy 18; counsel to confirm. Change all of them together or none.
      pledgeTitle: "If we ever close",
      pledge: "If we ever plan to close, we will tell you at least 90 days ahead and keep export working the whole time.",
    },
    about: {
      title: "About",
      // In-app only (Brief decision 10). The store listing and website never say "beta".
      beta: {
        label: "Early version",
        // D-030: no beta line in the store listing; this small in-app note stays until the founder ends it.
      body: "{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then.",
        exportCta: "Export a copy",
      },
    },
    neverRewrite: "We never rewrite your words. We only fix what the microphone got wrong, and mark every fix.",
    // Settings > Privacy (PRD.md K-01, K-17). Each consent is visible and changeable here.
    privacy: {
      title: "Privacy",
      analyticsLabel: "Share usage and crash reports",
      analyticsHelp: "Which screens you open and when something breaks. Never your letters, recordings, photos or anyone's names.",
      analyticsOffNote: "Turning this off stops sharing right away. Nothing else changes.",
      sensitiveLabel: "Sync and family sharing",
      // Names the health category, as Washington and Connecticut consent requires (lawyer-2 H4, CHD policy HN-4).
      sensitiveHelp: "Letters can hold health details about you or {child}. Turn this off to stop syncing, and we will offer to delete what already synced.",
      sensitiveOn: "On",
      sensitiveOff: "Off, kept on this phone",
      sensitiveSignedOut: "Not signed in",
      lockScreenLabel: "Names in notifications",
      promiseTitle: "Our promise",
      // Shown above the switches. The promise itself is `trust.promise`.
      controlsHelp: "These switches are yours. Export your book, stop sharing or delete everything, any time.",
      documentsTitle: "Our promises in full",
      privacyPolicyLink: "Privacy Policy",
      healthPrivacyLink: "Consumer Health Data Privacy Policy",
      subprocessorsLink: "Who helps us run the app",
      termsLink: "Terms of Service",
    },
  },

  // Sensitive-data consent, one plain screen after a new account is created and before the first sync
  // (PRD.md K-15, PRD-REQ-002; text from consumer-health-data-notice.md HN-4, counsel to approve).
  sensitiveConsent: {
    title: "Before your book syncs",
    body: "Letters can hold private things, like health details about you or {child}. To sync your book and share it with the family you choose, we store what you write on our servers.",
    use: "We use it only to keep and show your book. We never sell it, use it for ads or use it to train machine learning models.",
    changeLater: "You can change this any time in Settings, Privacy.",
    // v1.0 has no backup (D-059); counsel to re-approve this line with the HN-4 text.
    declineHelp: "If you keep it on this phone, syncing and sharing stay off.",
    agreeButton: "Agree and sync",
    declineButton: "Keep on this phone",
  },

  // Product analytics consent. Third ask after the first letter, on a later session (PRD.md K-01, PRD-REQ-001).
  analyticsConsent: {
    title: "Help us make it better?",
    body: "Share how you use the app, like which screens you open and when something crashes. Never your letters, recordings, photos or anyone's names.",
    detail: "Nothing is shared unless you say yes. Saying no changes nothing else.",
    changeLater: "You can change this any time in Settings, Privacy.",
    yesButton: "Share usage",
    noButton: "Don't share",
  },

  // One book per child (PRD.md K-12, PRD-REQ-011 to PRD-REQ-015).
  children: {
    switcher: {
      label: "For {child}",
      hint: "Switch to another child's book",
      title: "Whose book?",
      addButton: "Add a child",
      hiddenLink: "Hidden books",
      toLabel: "To {child}",
      changeLink: "Write to another child",
    },
    add: {
      title: "Add a child",
      // D-082, D-083: starting a book is free; the free letters are one pool across every book.
      twinsHelp: "Twins or more? Each child gets their own book.",
      cta: "Add {child}'s book",
      // Before a name is typed, or when the filled `cta` would pass 22 characters.
      ctaShort: "Add this book",
    },
    settings: {
      sectionTitle: "Children",
      title: "{child}'s book",
      detailsLabel: "Name and birthday",
      signsAsLabel: "Sign my letters to {child} as",
      remindersLabel: "Include {child} in my reminders",
      // "Note" only ever means a short letter someone makes; never anything we send (BRAND.md glossary).
      remindersHelp: "Month and birthday messages for {child} follow this switch.",
      celebrationsLabel: "Pause celebrations for {child}",
      celebrationsHelp: "Only for you. Month and birthday messages and milestones for {child} rest until you turn them back on.",
      familyLabel: "Who writes to {child}",
      familyCanReadLabel: "Family can read {child}'s book", // v1.1
      themeLabel: "How the book looks",
      hideLabel: "Hide this book",
      // Names no one else: hiding is kept on this phone today (store.hideChild does not sync it).
      hideBody: "Hiding {child}'s book quiets every reminder and message about {child}. Nothing is deleted.",
      // With a co-parent in the book (S46): hiding stays on this person's phone. {coParent} is their name.
      hideShared: "Hiding is only for you. {coParent} still sees {child}'s book as before.",
      showButton: "Show this book again",
      hiddenTitle: "Hidden books",
      hiddenEmpty: "No hidden books.",
    },
    sharing: {
      pickerTitle: "Which books?",
      oneBookNote: "This invite is for {child}'s book only.",
      separateNote: "Each child's book has its own family list. Inviting someone to one book does not open the others.",
    },
  },

  // Web contribution page (apps/web), ships in v1.1 (PRD.md K-35). Same text as review.firstNote.body (in-app-disclosures.md section 2).
  web: {
    firstNote: {
      title: "Please have a read",
      body: "We fix small slips, like \"um\" and repeats. We can also mishear a word or a name. Please read it before you save.",
    },
    ageConfirm: "I am 18 or older",
  },

  // Plus sheet store-required disclosure (in-app-disclosures.md section 3). {price} is the localized store price.
  plus: {
    legal: {
      renewAnnual: "Free for 2 months, then {price} a year. Renews automatically until you cancel, at least 24 hours before it renews.",
      renewMonthly: "Free for 1 month, then {price} a month. Renews automatically until you cancel, at least 24 hours before it renews.",
      renewNoTrialAnnual: "{price} a year, charged now. Renews automatically until you cancel, at least 24 hours before it renews.",
      renewNoTrialMonthly: "{price} a month, charged now. Renews automatically until you cancel, at least 24 hours before it renews.",
      cancel: "Cancel any time in Settings, Plan, Manage subscription, or in your Apple Account subscriptions.",
      termsLink: "Terms of Service",
      privacyLink: "Privacy Policy",
      subscriptionTermsLink: "Subscription terms",
      restoreLink: "Restore",
      agree: "By continuing, you agree to the Subscription terms and Terms of Service.",
    },
  },

  errors: {
    saveFailed: {
      title: "Not saved to the book yet",
      body: "Your words are safe on this phone. We will try again on our own.",
      button: "Try again now",
    },
    // Three causes, three screens (S13): permission off, the microphone held by a call or another app, a full phone.
    // Off: "Type instead" first, "Open Settings" quiet. Busy and full: `common.tryAgainButton` and `micDenied.typeButton`.
    // Switched by P4 with Listen telling the three apart (listen.logic.ts `startBlocker`, `startFailure`): only a
    // microphone that is really off reaches these words.
    micDenied: {
      title: "The microphone is off",
      body: "Turn it on in Settings, or type this one.",
      settingsButton: "Open Settings",
      typeButton: "Type instead",
    },
    micBusy: {
      title: "The microphone is in use",
      body: "A call or another app has it right now.",
    },
    phoneFull: {
      title: "This phone is full",
      body: "Free some space to record, or type this one.",
    },
    transcriptionFailed: {
      title: "No words yet for this one",
      body: "The recording is kept.",
      button: "Try again",
    },
    offline: {
      title: "You're offline",
      body: "Keep talking. Everything is saved on this phone.",
    },
    inviteExpired: {
      title: "This invite has expired",
      body: "Ask {inviter} to send a new one.",
    },
    generic: {
      title: "Something went wrong",
      body: "Your words are safe. Please try again.",
    },
    // A screen could not draw (root error boundary). Calm, no codes, no stack.
    // Error and state titles carry no full stop.
    crash: {
      title: "This page did not open",
      body: "Your letters and recordings are safe on this phone.",
      tryAgainButton: "Try again",
      tonightButton: "Go to Tonight",
    },
    // A link or route the app does not have (replaces the router's developer page).
    notFoundPage: {
      title: "Nothing at this link",
      body: "Your book is right where you left it.",
      button: "Back to Tonight",
    },
    // The book could not be opened at launch (database open or update step failed). Never deletes anything.
    // Every line here is a statement the code can back (docs/reviews/2026-10-claims-inventory.md, section 3f): the body says
    // what Export does (recovery-export.logic.ts copies the files byte for byte); it does not say the letters are safe.
    launch: {
      title: "The book could not open",
      body: "Export saves a copy of the recordings and book files it can read, exactly as they are.",
      hint: "Try again, or restart the phone.",
      tryAgainButton: "Try again",
      // The Try again button's words while it opens the book again, and the line after an open that did not work.
      tryingAgainButton: "Trying again",
      stillClosed: "It did not open this time either.",
      exportButton: "Export what's readable",
      exportingTitle: "Gathering your files",
      exportNothing: "Export has nothing to put in a file right now.",
      exportFailed: "That export did not work. Your files are still on this phone.",
      readme:
        "These are the files found on this phone when the book could not be opened.\nThe recordings folder holds your voice recordings; they play in any audio app.\nThe database folder holds the book itself, exactly as it was. Nothing here was changed or removed.\nKeep this export somewhere safe, and write to us if you would like help getting it back into the book.",
    },
  },

  // Appended by Mobile B (Book, letter view, children, Family, Settings). PM to review.
  reader: {
    readingSizeTitle: "Reading size",
    readingSizeButton: "Aa",
    readingSizeA11y: "Reading size",
    sizes: {
      standard: "Standard",
      large: "Large",
      largePrint: "Large print",
    },
    // Appearance with no letter yet: the glyph specimen at each size.
    previewEmpty: "Aa",
    notFoundTitle: "This letter is not in the book",
    // Shown only when a deleted copy of this letter is on the shelf (S37).
    notFoundDeleted: "It is in Recently deleted.",
    openShelfButton: "Open Recently deleted",
    notFoundCta: "Back to the book",
    openHint: "Opens the letter.",
  },

  // Keys the children section above does not cover yet.
  childrenExtra: {
    dueDateLabel: "Due date",
    nameRequired: "Add a name to continue.",
    notSet: "Not set",
    // Editing a child's details (Settings > the child's book). Letters are never changed by these.
    edit: {
      nameLabel: "Name",
      rowHint: "Opens to change it.",
      save: "Save",
      nameEmpty: "Add a name to save.",
      nameLimit: "A name can have up to {n} characters.",
      nameTooLong: "Up to {n} characters.",
      signsAsEmpty: "Add what {child} calls you to save.",
      signsAsLimit: "Up to {n} characters.",
      signsAsTooLong: "Up to {n} characters.",
      signsAsNewOnly: "Letters already written keep their signature.",
      // Shared by the first-run child step and Settings (S05, S46).
      birthdayFuture: "Choose today or an earlier day.",
      birthdayMissing: "Choose a date to save.",
      dueDateRange: "Choose a due date from today up to ten months ahead.",
      dateInvalid: "That date does not look right. Try again.",
      // The due-date card once the due date has passed (S46). It never presumes a birth and never celebrates:
      // no count of days, never a notification, never on Tonight. "Hide" hides it until the Due date row is opened.
      born: {
        title: "{child}'s birthday",
        offerBody: "Add it when you are ready.",
        pickerLabel: "{child}'s birthday",
        confirm: "Set the birthday",
        hideButton: "Hide",
        keepNote: "Letters written before this day stay in Before You.",
      },
    },
    familyCanReadHelp: "Family see the letters you add to {child}'s book. This starts once family can join.",
    plusNotYet: "Plus is not available on this device yet.",
  },

  familyTab: {
    membersTitle: "Who writes to {child}",
    youLabel: "You",
    rolesTitle: "Two ways to join", // v1.1 (one way in v1.0: co-parent)
    coParentLabel: "Co-parent",
    coParentBody: "Writes to {child} and reads the whole book, as an equal.",
    // v1.1: familyLabel and familyBody.
    familyLabel: "Family",
    familyBody: "Writes to {child}. You choose which letters go in the book.",
  },

  settingsMore: {
    accountTitle: "Account",
    signedOutLabel: "Not signed in",
    appearanceTitle: "Appearance",
    themeLabel: "Theme",
    themes: {
      system: "Match this phone",
      light: "Light",
      dark: "Dark",
    },
    // No "beta" in app copy: the only release-stage note is About's "early version" (D-060, K-13).
    remindersNotYet: "Your choice is saved. Reminders start in a coming update.",
    legalTitle: "Legal",
    versionLabel: "Version",
  },

  // Settings home (PRD C, C-REQ-016). Rows, in order: Account, Language, Plus, Reminders, Export your
  // book, Privacy, Storage, Recordings, Appearance, Delete account, Terms, Privacy Policy, Help, version.
  settingsHome: {
    sections: {
      account: "Account",
      writing: "Writing",
      plus: "Plus",
      data: "Your data",
      privacy: "Privacy and space",
      help: "Help and legal",
      about: "About",
    },
    accountLabel: "Account",
    accountHelp: "Sign in, and the ways you sign in.",
    // Transcription language (D-056). The app itself is in English at v1.0.
    languageLabel: "Spoken language",
    languageHelp: "The language you speak your letters in.",
    // "Settings, Plan" is the path the Plus legal text and Subscription Terms name.
    planLabel: "Plan",
    planHelp: "Your first two letters are free. Plus lets you keep adding letters.", // D-082
    remindersLabel: "Reminders",
    exportLabel: "Export your book",
    exportHelp: "Every letter and recording, free, any time.",
    privacyLabel: "Privacy",
    // Language packs and speech files, downloaded only when needed (D-065).
    storageLabel: "Storage",
    storageHelp: "Language packs and space on this phone.",
    recordingsLabel: "Recordings",
    appearanceLabel: "Appearance",
    deleteAccountLabel: "Delete account",
    termsLabel: "Terms of Service",
    privacyPolicyLabel: "Privacy Policy",
    helpLabel: "Help",
    helpValue: "Write to us",
    helpSubject: "Help with the app",
    // US spelling on screen; the key keeps its old name so nothing breaks.
    licencesLabel: "Licenses",
    versionLabel: "Version",
    // "1.0.0 (42)": app version and build number.
    versionValue: "{version} ({build})",
    strugglingA11yHint: "Shows free, confidential support lines.",
  },

  // Static resources row (D-034): v1.0 has no on-device safety classifier. Resources verified 3 Oct 2026
  // on mchb.hrsa.gov, 988lifeline.org and postpartum.net. Clinician and counsel to review the wording.
  // Scope (D-087): the app ships in the US storefront only (LEGAL-REQ-058), so the list says it is for the
  // United States and nothing picks lines by region. FOUNDER TASK (FT-36): before submit, check primary
  // sources (988lifeline.org, postpartum.net) including the 988 language options. Only after that check
  // may the 988 line below say "Press 2 for Spanish, or say your language to reach an interpreter."
  // Do NOT add that sentence on the strength of search snippets.
  struggling: {
    title: "If you are struggling",
    body: "The early months can be very hard. You do not have to carry it alone. These lines are free and confidential. They are for people in the United States.",
    resources: [
      {
        name: "National Maternal Mental Health Hotline",
        how: "Call or text 1-833-852-6262, any time, in English or Spanish.",
        tel: "18338526262",
      },
      {
        name: "988 Lifeline",
        how: "Call or text 988, any time.",
        tel: "988",
      },
      {
        name: "Postpartum Support International",
        how: "Call 1-800-944-4773 and a trained volunteer calls you back.",
        tel: "18009444773",
      },
    ],
    emergency: "If you or your baby are in danger right now, call 911.",
  },

  // Calm privacy reassurance (D-061). One promise, said the same way wherever a parent might
  // wonder, and backed by real controls in Settings, Privacy. Never fearful, never long, never more
  // than one line in a place. The store listing and website use `trust.promise` word for word.
  trust: {
    promise: "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.",
    // For tight spaces: a row subtitle, a footer.
    short: "Private by default. Never sold, never used for ads.",
    // The voice promise. Said where a recording is made or kept, never as a scare.
    voice: "We never imitate your voice. Your original recording is always kept exactly as you made it.",
    // Sign-in screen, under the buttons (Apple, Google, email link).
    signIn: {
      why: "An account keeps your book safe when you change phones.",
      privacy: "Only you and the people you invite can read your letters. We never sell them or use them for ads.",
      email: "We use your email only to sign you in and to write to you about your account.",
    },
    // Once, the first time someone records (a quiet line on Listening or under the first Review).
    firstRecording: {
      title: "Your voice stays here",
      body: "Your words are written down on this phone, and the recording stays with your letter. We never imitate your voice or use it to train machine learning models.",
      dismissButton: "Good to know",
    },
    // Settings, Privacy, at the top.
    settings: {
      title: "Our promise",
      body: "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.",
      voice: "We never imitate your voice. Your original recording is always kept exactly as you made it.",
    },
  },

  // Sign-in help the emails point to (customer review CUS-03, CUS-06, CUS-07). The code screen itself is
  // features.auth.code. Copy only; the mobile lane wires them.
  auth: {
    troubleButton: "Trouble signing in?",
    noEmailHelp: `Nothing yet? Wait a minute, then check Spam, Junk or Promotions for an email from ${brand.email.fromAddress}. Still nothing? Use Sign in with Apple or Google, or write to us.`,
    emptyBookHelp: "See an empty book? You may have signed in a different way from the first time. Sign out, then use the way you first joined: Apple, Google, or the same email.",
  },

  // In-app card for the remaining parent when a co-parent deletes their account (CNT-08, CUS-04).
  // The coparent-left email says the same; the card stays until dismissed.
  coParentLeft: {
    title: "Some letters are no longer in the book",
    body: "The person who wrote them is closing their account. Letters you wrote are not affected.",
    dismissButton: "Okay",
  },

  // 18+ only (founder decision, Oct 2 2026). Asked before any child details; only "yes" is stored, never an age.
  // The stop screen becomes one line in P2 (S02, LEGAL-REQ-002): the app "is currently for adults 18 and over".
  ageGate: {
    title: "Are you 18 or older?",
    yesButton: "Yes",
    noButton: "No",
    // The stop screen's one line (S02, LEGAL-REQ-002), a title, so no full stop.
    stopTitle: "{app} is currently for adults 18 and over",
    mistakeButton: "I answered by mistake",
  },
} as const;

// Retired 3 Oct 2026 (bring back from git history if the feature returns):
// - book.recordingBackedUp, settings.recordings.backedUpTitle and backedUpBody, errors.backupFailed:
//   no recording upload or backup in v1.0 (D-059). The first three returned on 16 Oct 2026 with new words
//   (experience pass, option B: D-100, D-102); errors.backupFailed has not.
// - settings.backup.* (Encrypted backup: on, off, turn on, last backed up) and settingsMore.backupNotYet:
//   removed 4 Oct 2026 (D-085 amends D-073): our own backup needs sign-in and a server, so no claim until then.
// - settings.privacy.aiLabel: cloud transcription is v1.1 (ROADMAP).
// - settingsMore.signedOutHelp, deleteAccountNotYet, exportNotYet: sign-in, account deletion and
//   export ship in v1.0; Settings home links to their screens.
// - settingsHome.helpLabel "Write to us" moved to settingsHome.helpValue; the row is "Help".
// - storeListing beta paragraph and promotionalTextBeta: D-030, D-060.
// - pendingCopy in apps/mobile/src/lib/copy.ts: every string now lives here; it is a thin re-export.
// Unread today (no screen reads them), left for the dead-copy sweep: settingsMore.remindersNotYet (reminders)
// and childrenExtra.plusNotYet (Plus gate).

export type Strings = typeof en;

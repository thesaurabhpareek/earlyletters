// All in-app copy (English).
// Placeholders: {name}, {child}, {signsAs}, {count}, {month}, {weekday}, {year}, {inviter},
// {a} and {b} (two names joined), {minutes} and {seconds}, {letters} and {notes} (counted phrases).
// {app} is the public name. It is filled from packages/brand when the app loads this copy
// (apps/mobile/src/lib/copy.ts), so the name is never typed in in-app copy (CLAUDE.md).
// Keys ending in "button", "cta" or "action" are button labels (22 characters or fewer).
// Keys ending in "link" are text links and may run longer. Keys ending in "A11y" are
// VoiceOver labels or hints, never shown on screen.
//
// v1.0 scope (docs/DECISIONS.md, founder decisions of 3 Oct 2026): letters are spoken in one of 7
// languages (D-056), one per letter, with no Hindi-English mixing in one sentence until v1.1 (D-059);
// family at launch is the co-parent only (D-055); recordings are never uploaded, so they stay on the
// phone that made them and in that person's own iPhone backup (D-059, D-033); Read together plays
// recordings on this phone with no word highlight (D-059). Copy must not promise any of those early.
// Privacy is said calmly and the same way everywhere: see `trust` and VOICE.md (D-061).

export const en = {
  app: {
    name: "{app}",
    category: "memory book",
    tagline: "Exactly as you said it.",
    oneLine: "{app}, the memory book you fill by talking.",
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
    // Two or more names: "Asha and Dev", "Asha, Dev and Mira" (the app joins the first ones with commas).
    andJoin: "{a} and {b}",
  },

  onboarding: {
    welcome: {
      title: "{app}",
      subtitle: "The memory book you fill by talking.",
      body: "A few words a day, in your own voice. Kept for {child} to read and hear for years.",
      startButton: "Begin the book",
      signInButton: "I already have a book",
      joinButton: "I was invited",
    },

    promise: {
      title: "Exactly as you said it.",
      body: "We tidy what the microphone got wrong. A stray \"um\", a misheard name, a missing comma.",
      body2: "We never rewrite, shorten or write for you. Every sentence is one you said.",
      recordingTitle: "Your voice stays too",
      // First run only: backup cannot be on yet, so "on this phone" is true here (lawyer-2 H4).
      recordingBody: "The recording is kept on this phone, so one day {child} can hear you say it.",
      // Heading above settings.help.mistakes in first run.
      mishearTitle: "We can mishear",
      privateNote: "Private by default. You choose what goes in the book.",
      cta: "That sounds right",
    },

    child: {
      title: "Who is this book for?",
      nameLabel: "Their name",
      namePlaceholder: "First name, or the name you use at home",
      nameHelp: "You can add a nickname later.",
      birthdayLabel: "Birthday",
      birthdayHelp: "We sort letters by {child}'s month of age.",
      expectingLabel: "Not here yet",
      expectingHelp: "Letters written before birth go into a chapter called Before You.",
      dueDateLabel: "Due date",
      // Twins: removes an extra name row.
      removeA11y: "Remove {child}",
      addAnotherButton: "Add another child",
      // Twins or more, same birthday or due date, during first run (PRD.md K-12).
      addAnotherHelp: "Twins or more? Add them now. Each child gets their own book.",
      cta: "Continue",
    },

    signsAs: {
      title: "What does {child} call you?",
      // Twins or more: {child} is the joined names, so the verb is plural.
      titleMany: "What do {child} call you?",
      body: "This is how your letters will be signed.",
      placeholder: "Papa, Mama, Amma, Baba, Dad",
      examplesLabel: "A few ideas",
      examples: ["Mama", "Papa", "Amma", "Appa", "Mummy", "Daddy", "Ma", "Baba"],
      notYetHelp: "Not talking yet? Pick the name you hope to hear.",
      preview: "From {signsAs}",
      cta: "Sign my letters",
    },

    dictionary: {
      title: "Your words, spelled your way",
      body: "Add names and home words you use often. We will spell them the way you do.",
      examples: "Like Nani, chhotu, or the name of a stuffed rabbit.",
      // v1.0: one of 7 languages per letter (D-056); mixing languages in a sentence is v1.1 (D-059).
      languagesBody: "Your words stay in the language you speak. We never translate them.",
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

    invite: {
      title: "Who else loves {child}?",
      body: "Grandparents, aunts, uncles. Their letters can go in the book too, when you say yes.",
      privacyNote: "They only see what you choose to share with them.",
      addButton: "Invite family",
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
    subtitle: "What do you want {child} to know about today?",
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
      letterPlaceholder: "Dear {child},",
      saveButton: "Save",
    },
    // A take that was recorded but not yet read back (TDD 01 3.4).
    draftWaiting: {
      title: "A letter is waiting to be read back.",
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
  },

  notMuch: {
    button: "Not much today",
    confirmTitle: "That counts.",
    confirmBody: "Some days are just days. We will keep a small line for today.",
    template: "{weekday}. Not much today. Just {child}, and us, and an ordinary day.",
    templateAlt: [
      "{weekday}. A quiet one. {child} was here, and so were we.",
      "{weekday}. Nothing big to tell. Just a day with {child} in it.",
      "{weekday}. Tired tonight. Loved {child} all day anyway.",
    ],
    addWordButton: "Add a few words",
    saveButton: "Keep this line",
    savedToast: "Kept. Rest well.",
  },

  review: {
    title: "Read it back",
    subtitle: "Here is what you said, lightly tidied.",
    trustLine: "We only fixed what got in the way of your words. Nothing added.",
    changesLabel: "{count} small fixes",
    changesLabelOne: "1 small fix",
    noChanges: "Word for word. Nothing needed fixing.",
    showOriginalLink: "Show exactly what I said",
    showTidiedButton: "Show tidied version",
    originalLabel: "Exactly what you said",
    tidiedLabel: "Lightly tidied",
    undoEditButton: "Put it back",
    undoAllButton: "Keep it word for word",
    putBackToast: "Put back.",
    editTextButton: "Change words",
    editA11yHint: "Edited. Double tap to see what you said.",
    removedA11y: "Words taken out here",
    toChildA11y: "To {child}. Change",
    // A recording kept before the words are ready on this phone (ADR 0001, TDD 03 FM-9).
    voiceOnlyButton: "Keep the recording",
    waiting: {
      title: "Your voice is kept",
      body: "Words are not ready on this phone yet. Keep the recording now and the words can come later. You can also type it.",
    },
    // Development builds only: the sample transcriber's words are never saved.
    dev: {
      sampleBanner: "Sample words for testing, not your recording.",
      sampleNotSaved: "Sample words are never saved. Keep the recording only, or type it.",
    },
    edits: {
      filler: {
        label: "Filler",
        explain: "We took out an \"um\" or \"uh\" so it reads smoothly.",
      },
      falseStart: {
        label: "False start",
        explain: "You started a sentence, then began again. We kept the second try.",
      },
      repeat: {
        label: "Repeat",
        explain: "A word came out twice in a row. We kept one.",
      },
      misheardName: {
        label: "Name",
        explain: "The microphone misheard a name. We used the spelling from your words list.",
      },
      punctuation: {
        label: "Punctuation",
        explain: "We added commas and full stops where you paused.",
      },
      grammarSlip: {
        label: "Small slip",
        explain: "A tiny slip of the tongue, like \"a apple\". We fixed only that.",
      },
      paragraph: {
        label: "Paragraph",
        explain: "You took a long pause, so we started a new paragraph.",
      },
      // A punctuation edit that only wrote a character in the author's chosen script (ADR 0014
      // section 4; packages/core describeEdit returns 'script'). Same word, same letters.
      script: {
        label: "Characters",
        explain: "We wrote a character the way your chosen script writes it. It is the same word.",
      },
    },
    lock: {
      button: "Keep this as said",
      explain: "Locked phrases stay exactly as you said them, slips and all.",
      lockedLabel: "Kept as said",
      unlockButton: "Allow small fixes",
    },
    voiceCheck: {
      question: "Does this sound like you?",
      yesButton: "Sounds like me",
      noButton: "Not quite",
      noFollowUp: "Tap any word to change it, or show exactly what you said.",
      thanks: "Thank you for telling us.",
    },
    destination: {
      title: "Where should this go?",
      addButton: "Add to {child}'s book",
      privateButton: "Keep private",
      privateHelp: "Private letters stay with you. You can add them to the book later.",
      addedToast: "Added to {child}'s book.",
      privateToast: "Kept just for you.",
      voiceOnlyToast: "Recording kept on this phone.",
    },
    addWordToDictionary: "Add \"{name}\" to your words",
    playButton: "Hear it",
    // One-time card, the first time a spoken letter is transcribed on this install (in-app-disclosures.md section 2).
    firstNote: {
      title: "Please have a read",
      body: "We fix small slips, like \"um\" and repeats. We can also mishear a word or a name. Please read it before you save.",
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
    chapterSubtitle: "{count} letters and notes",
    chapterSubtitleOne: "1 letter",
    chapterLetters: "{count} letters",
    chapterNotes: "{count} notes",
    chapterNoteOne: "1 note",
    chapterMixed: "{letters} and {notes}",
    // A spoken letter kept before its words were ready (TDD 01 OQ-11).
    waitingForWords: "A recording, waiting for its words.",
    chapterNewborn: "The first weeks",
    thisMonthLabel: "This month",
    signature: "From {signsAs}",
    together: "From {signsAs} and {child}",
    provenance: {
      spokenTidied: "Spoken, lightly tidied",
      spokenExact: "Spoken, word for word",
      typed: "Typed",
    },
    hearLink: "Hear it in {signsAs}'s voice",
    hearShort: "Hear {signsAs}",
    recordingOnPhone: "Recording kept on this phone",
    // v1.0: recordings stay on the phone that made them (D-059), so a co-parent's voice is on their own phone.
    recordingElsewhere: "Recording kept on {signsAs}'s phone",
    privateLabel: "Private",
    familyLabel: "From family",
    filters: {
      all: "All",
      letters: "Letters",
      notes: "Notes",
      family: "Family",
      private: "Private",
    },
    empty: {
      bookTitle: "The first page is waiting.",
      bookBody: "Say one true thing about {child} today. That is how every book begins.",
      bookCta: "Write a letter",
      chapterTitle: "Month {month} is open.",
      chapterBody: "Whatever you add this month lands here.",
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
    autoplayLabel: "Play the next one on its own",
    nowReading: "{signsAs}, Month {month}",
    noRecording: "This one was typed. Read it aloud together.",
    recordingElsewhere: "{signsAs}'s voice is on their phone. Read this one aloud together.",
    empty: "Letters you add to the book will be here to read together.",
    plusGate: {
      title: "Read together is part of Plus",
      body: "You have read together {count} times for free. Plus keeps it open whenever you like.",
      keepNote: "Every letter stays open to read and hear, with or without Plus.",
    },
    endOfMonth: "That was Month {month}. You are so loved.",
    endOfMonthAlt: "That was Month {month}. Every word was for you.",
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

  family: {
    title: "Family",
    subtitle: "The people who love {child}, adding their words.",
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
      howStep1: "Tap the microphone and talk.",
      howStep2: "We write down your words exactly as you said them.",
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
      body: "A new chapter in {child}'s book is open.",
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
      title: "Month {month} is a chapter now.",
      body: "{count} letters and notes, ready for {child} to read one day.",
      cta: "Read the chapter",
    },
    firstGrandparentLetter: {
      title: "{signsAs} wrote to {child}.",
      body: "The book has more than one voice now.",
    },
    firstReadTogether: {
      title: "You read it together.",
      body: "The first of many times {child} will hear these letters.",
    },
    monthSummary: "{count} letters this month",
    monthSummaryFamily: "{count} letters from family this month",
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
    },
    signsAsLabel: "Sign my letters as",
    childLabel: "Child",
    birthdayLabel: "Birthday",
    dictionaryLabel: "Names and words",
    dictionaryHelp: "Spelled your way, every time.",
    tidyLabel: "Tidying",
    tidyOn: "Lightly tidied",
    tidyOff: "Word for word",
    tidyHelp: "Word for word keeps every um and false start. Either way, we never rewrite.",
    // v1.0 has no recording upload (D-059). Recordings live in a backed-up app folder, so the
    // person's own iPhone backup includes them (D-033, lawyer-2 L1). Never say "only on this phone".
    recordings: {
      title: "Recordings",
      keepLabel: "Keep recordings",
      keepHelp: "Your voice is saved with each letter, on this phone.",
      onPhoneTitle: "Kept on this phone",
      onPhoneBody: "Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own.",
      storageUsed: "{count} MB used on this phone",
      // Audio the launch sweep found with no letter while no book existed (TDD 01 3.2.4). Never deleted.
      orphansTitle: "Recordings without a letter",
      orphansOne: "1 recording on this phone is not part of a letter yet. It stays on this phone.",
      orphansMany: "{count} recordings on this phone are not part of a letter yet. They stay on this phone.",
    },
    backup: {
      title: "Encrypted backup",
      offLabel: "Backup is off",
      onLabel: "Backup is on",
      // v1.0 uploads no recordings (D-059). This says where they are today, not what is coming.
      body: "We do not copy your recordings to our servers. They are kept on this phone and in your iPhone's own backup, if you use one.",
      // D-033: the person's own iPhone backup includes recordings.
      honestNote: "Your letters sync when you are signed in, so your co-parent and your next phone can read them. Export any time to keep a copy of your own.",
      turnOnButton: "Turn on backup",
      turnOffButton: "Turn off backup",
      lastBackup: "Last backed up {weekday}",
      backingUp: "Backing up",
    },
    export: {
      title: "Export",
      body: "Download every letter and recording, any time, free. Plain text and audio files.",
      button: "Export everything",
      preparing: "Gathering every letter. This can take a minute.",
      ready: "Your export is ready.",
    },
    delete: {
      entryTitle: "Delete this letter?",
      entryBody: "You can undo this for 30 days from Recently deleted.",
      entryConfirm: "Delete letter",
      entryToast: "Letter deleted.",
      recentlyDeleted: "Recently deleted",
      restoreButton: "Restore",
      bookTitle: "Delete the whole book?",
      bookBody: "Every letter and recording in {child}'s book will be removed from this phone and from our servers. Family members can save a copy of their own letters first.",
      bookBodyCoParent: "{child}'s book stays with your co-parent. Your own letters and recordings in it will be removed.",
      bookUndo: "You have 30 days to change your mind. After that, it cannot be restored.",
      bookExportFirst: "You can export everything first, free.",
      bookConfirm: "Delete the book",
      bookTypeToConfirmLabel: "Type {child}'s name to confirm",
      accountTitle: "Delete your account",
      accountConfirm: "Delete account",
    },
    reminders: {
      cadenceLabel: "Reminders",
      timeLabel: "Reminder time",
      offLabel: "Off",
      weeklyLabel: "Weekly",
      fewTimesLabel: "A few times a week",
      everyEveningLabel: "Every evening",
      pauseLabel: "Pause all reminders",
      help: "A gentle nudge a few evenings a week, at the time you choose. Never late at night.",
    },
    privacyLine: "Private by default. You decide what goes in the book.",
    help: {
      mistakesTitle: "How transcription works",
      mistakes: "Your words are kept as you said them. We can mishear, so read each letter and fix anything we got wrong.",
    },
    about: {
      title: "About",
      beta: {
        label: "Early version",
        // D-030: no beta line in the store listing; this small in-app note stays until the founder ends it.
      body: "{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then.",
        exportCta: "Export a copy",
      },
    },
    neverRewrite: "We never rewrite your words. We only tidy what the microphone got wrong.",
    // Settings > Privacy (PRD.md K-01, K-17). Each consent is visible and changeable here.
    privacy: {
      title: "Privacy",
      analyticsLabel: "Share usage and crash reports",
      analyticsHelp: "Which screens you open and when something breaks. Never your letters, recordings, photos or anyone's names.",
      analyticsOffNote: "Turning this off stops sharing straight away. Nothing else changes.",
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
      body: "Each child gets their own book, with their own months, family and settings.",
      // PRD-REQ-015 (founder, 2 Oct 2026): one free book you start; books you joined as a co-parent do not count;
      // children added together in first run are all free, so this sheet's twins line makes no price promise.
      plusNote: "The first book you start is free, always. Books you start for more children are part of Plus.",
      joinedNote: "A book you joined as a co-parent does not count as your free book.",
      keepNote: "Every book you already have stays open for writing, reading and export, with or without Plus.",
      twinsHelp: "Twins or more? Each child gets their own book.",
      cta: "Add {child}'s book",
    },
    settings: {
      sectionTitle: "Children",
      title: "{child}'s book",
      detailsLabel: "Name and birthday",
      signsAsLabel: "Sign my letters to {child} as",
      remindersLabel: "Include {child} in my reminders",
      remindersHelp: "Your reminder time is shared across your children. Notes about {child}'s months and birthday follow this switch.",
      celebrationsLabel: "Pause celebrations for {child}",
      celebrationsHelp: "Only for you. Month notes, birthdays and milestones for {child} rest until you turn them back on.",
      familyLabel: "Who writes to {child}",
      familyCanReadLabel: "Family can read {child}'s book",
      themeLabel: "How the book looks",
      hideLabel: "Hide this book",
      hideBody: "Hiding {child}'s book quiets every reminder and note about {child}, for everyone in the family. Nothing is deleted.",
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
    promise: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always. Plus adds Read together whenever you like, after the first 3 times in each book, and books for more children.",
  },

  errors: {
    saveFailed: {
      title: "Not saved to the book yet",
      body: "Your words are safe on this phone. We will try again on our own.",
      button: "Try again now",
    },
    micDenied: {
      title: "We can't hear you yet",
      body: "Allow the microphone in Settings to speak your letters. Or type instead.",
      settingsButton: "Open Settings",
      typeButton: "Type instead",
    },
    transcriptionFailed: {
      title: "We could not write this one down",
      body: "The recording is safe on this phone. You can try again or type it.",
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
    storageLow: {
      title: "This phone is almost full",
      body: "New recordings may not fit. Freeing some space on this phone will help.",
    },
    generic: {
      title: "Something went wrong",
      body: "Your words are safe. Please try again.",
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
    preview: "Dear {child}, today you laughed at the rain.",
    // No timed return to the book (TDD 09 A11Y-F03).
    deletedBody: "You can still undo this, or close to go back to the book.",
    notFoundTitle: "This letter is not here anymore.",
    notFoundCta: "Back to the book",
    openHint: "Opens the letter.",
  },

  // Keys the children section above does not cover yet.
  childrenExtra: {
    dueDateLabel: "Due date",
    nameRequired: "Add a name to continue.",
    notSet: "Not set",
    familyCanReadHelp: "Family see the letters you add to {child}'s book. This starts once family can join.",
    plusGateTitle: "Another book is part of Plus",
    plusCta: "See what Plus adds",
    plusNotYet: "Plus is not available on this device yet.",
  },

  familyTab: {
    membersTitle: "Who writes to {child}",
    youLabel: "You",
    emptyTitle: "Just you, for now.",
    emptyBody: "Letters are lovelier with more voices.",
    inviteNeedsSignIn: "Inviting family needs an account, so they can write from their own phone. Sign in arrives in a coming update.",
    rolesTitle: "Two ways to join",
    coParentLabel: "Co-parent",
    coParentBody: "Writes, reads the whole book, and chooses which family letters go in.",
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
    // Recording backup is not in v1.0 (D-059).
    backupNotYet: "Backup arrives in a later update.",
    remindersNotYet: "Your choice is saved. Reminders start in a coming beta update.",
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
    planHelp: "Plus: Read together whenever you like, and books for more children.",
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
    licencesLabel: "Licences",
    versionLabel: "Version",
    // "1.0.0 (42)": app version and build number.
    versionValue: "{version} ({build})",
    strugglingA11yHint: "Shows free, confidential support lines.",
  },

  // Static resources row (D-034): v1.0 has no on-device safety classifier. Resources verified 3 Oct 2026
  // on mchb.hrsa.gov, 988lifeline.org and postpartum.net. Clinician and counsel to review the wording.
  struggling: {
    title: "If you are struggling",
    body: "The early months can be very hard. You do not have to carry it alone. These lines are free and confidential.",
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

  // 18+ only (founder decision, Oct 2 2026). Asked before any child details; only "yes" is stored, never an age.
  ageGate: {
    title: "Are you 18 or older?",
    body: "We ask everyone the same question.",
    yesButton: "Yes",
    noButton: "No",
    stopTitle: "Thank you for telling us.",
    stopBody: "{app} is currently for adults 18 and over.",
    stopNote: "Nothing you entered has been kept.",
    mistakeButton: "I answered by mistake",
  },
} as const;

// Retired 3 Oct 2026 (bring back from git history if the feature returns):
// - book.recordingBackedUp, settings.recordings.backedUpTitle and backedUpBody, errors.backupFailed:
//   no recording upload or backup in v1.0 (D-059).
// - settings.privacy.aiLabel: cloud transcription is v1.1 (ROADMAP).
// - settingsMore.signedOutHelp, deleteAccountNotYet, exportNotYet: sign-in, account deletion and
//   export ship in v1.0; Settings home links to their screens.
// - settingsHome.helpLabel "Write to us" moved to settingsHome.helpValue; the row is "Help".
// - storeListing beta paragraph and promotionalTextBeta: D-030, D-060.
// - pendingCopy in apps/mobile/src/lib/copy.ts: every string now lives here; it is a thin re-export.
// Still in use and due to retire when their screens change: settingsMore.remindersNotYet (reminders),
// settingsMore.backupNotYet and settings.backup.* (recordings screen), childrenExtra.plusNotYet
// (Plus gate), familyTab.inviteNeedsSignIn (Family tab).

export type Strings = typeof en;

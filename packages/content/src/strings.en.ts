// All in-app copy (English).
// The brand name is never typed here: it comes from packages/brand (CLAUDE.md), so strings that name the
// product are template literals over `brand`. The rendered text is unchanged.
// v1.0 family scope is co-parent only (Brief decision 5). Keys marked "v1.1" are for other family members
// (grandparents, contributors, approvals); the app hides those paths in v1.0 and no public copy uses them.
// Placeholders: {name}, {child}, {signsAs}, {count}, {month}, {weekday}, {year}, {inviter}.
// Keys ending in "button", "cta" or "action" are button labels (22 characters or fewer).
// Keys ending in "link" are text links and may run longer.

import { brand } from '@scribe/brand';

export const en = {
  app: {
    name: brand.name,
    category: brand.category,
    tagline: brand.tagline,
    oneLine: `${brand.name}, the baby memory book you fill by talking.`,
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
  },

  onboarding: {
    welcome: {
      title: brand.name,
      subtitle: "The baby memory book you fill by talking.",
      body: "A few words a day, in your own voice. Kept for {child} to read and hear for years.",
      startButton: "Begin the book",
      signInButton: "I already have a book",
      joinButton: "I was invited",
    },

    promise: {
      title: "Exactly as you said it.",
      body: "Word for word: we fix only what the microphone got wrong. A stray \"um\", a misheard name, a missing comma. Every small fix is marked, and you can undo it.",
      body2: "We never rewrite, shorten or write for you. Every sentence is one you said.",
      recordingTitle: "Your voice stays too",
      // First run only: backup cannot be on yet, so "on this phone" is true here (lawyer-2 H4).
      recordingBody: "The recording is kept on this phone, so one day {child} can hear you say it.",
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
      expectingHelp: "Letters written before birth go into a part of the book called Before You.",
      addAnotherButton: "Add another child",
      // Twins or more, same birthday or due date, during first run (PRD.md K-12).
      addAnotherHelp: "Twins or more? Add them now. Each child gets their own book.",
      cta: "Continue",
    },

    signsAs: {
      title: "What does {child} call you?",
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
      // Seven spoken languages in v1.0 (Brief decision 6). Hindi-English mixing in one sentence is v1.1: do not promise it.
      languagesBody: "Speak English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Every word stays in the language you said it.",
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
    afterSave: {
      title: "Kept.",
      body: "One more page for {child}.",
      reviewButton: "Read it back",
      doneButton: "Done for tonight",
      anotherButton: "Add another",
    },
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
    // The edit feature is called "Word for word" (founder decision, Oct 3 2026). Small fixes are shown as marks
    // the person can undo. Never "tidy", "tidied" or "tidying" in copy.
    subtitle: "Here is what you said, word for word. Small fixes are marked.",
    trustLine: "We only fixed what got in the way of your words. Nothing added.",
    changesLabel: "{count} small fixes",
    noChanges: "Word for word. Nothing needed fixing.",
    showOriginalLink: "Show exactly what I said",
    showTidiedButton: "Show small fixes",
    originalLabel: "Exactly what you said",
    tidiedLabel: "Word for word, small fixes marked",
    undoEditButton: "Put it back",
    undoAllButton: "Undo every fix",
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
    subtitle: brand.printTitle(1),
    yearTitle: `${brand.name}: Year {year}`,
    beforeYouChapter: "Before You",
    chapterTitle: "Month {month}",
    chapterSubtitle: "{count} letters and notes",
    chapterSubtitleOne: "1 letter",
    chapterNewborn: "The first weeks",
    thisMonthLabel: "This month",
    signature: "From {signsAs}",
    together: "From {signsAs} and {child}",
    provenance: {
      spokenTidied: "Spoken, word for word",
      spokenExact: "Spoken, exactly as said",
      typed: "Typed",
    },
    hearLink: "Hear it in {signsAs}'s voice",
    hearShort: "Hear {signsAs}",
    recordingOnPhone: "Recording kept on this phone",
    recordingBackedUp: "Recording kept and backed up",
    recordingElsewhere: "Recording kept on {signsAs}'s phone",
    privateLabel: "Private",
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
      bookBody: "Say one true thing about {child} today. That is how every book begins.",
      bookCta: "Write a letter",
      chapterTitle: "Month {month} is open.",
      chapterBody: "Whatever you add this month lands here.",
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
    // v1.0: recordings are not shared between family members (founder decision, Oct 3 2026), so a letter plays
    // in its author's voice only on the author's phone. No word-by-word highlighting claims (v1.1).
    subtitle: "Open the book with {child} and hear your letters in your own voice.",
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

  // v1.1 except `title`: invites for family beyond the co-parent, contributor welcome, approvals and the
  // contributor's own view. The app hides these paths in v1.0 (Brief decision 5).
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
      whatsapp: "{signsAs}, it's {inviter}. We are making a book of letters for {child}. Will you add yours? You just talk. Your voice is kept too. It is on iPhone for now. Get the free app and join here:",
      short: "{inviter} would love your letters in {child}'s book.",
    },
    contributorWelcome: {
      title: "Welcome, {signsAs}.",
      body: "{inviter} is keeping a book of letters for {child}. Yours can be part of it.",
      howTitle: "How it works",
      howStep1: "Tap the red circle and talk, in the language you speak.",
      howStep2: "Your words are kept exactly as you said them.",
      howStep3: "{inviter} adds your letter to {child}'s book.",
      voiceNote: "Your voice is kept too, so {child} can hear you tell it.",
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
      body: "The book has more than one voice now.",
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
      // Plus reaches a co-parent only through Apple Family Sharing (Terms 14.12, D-061).
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
    tidyLabel: "Word for word",
    tidyOn: "Small fixes, marked",
    tidyOff: "Exactly as said",
    tidyHelp: "Small fixes are marked in each letter, and you can undo any of them. Exactly as said keeps every um and false start. Either way, we never rewrite.",
    // Show onPhone* only while backup is off; show backedUp* while it is on (lawyer-2 H4, register s.3 row 16).
    recordings: {
      title: "Recordings",
      keepLabel: "Keep recordings",
      keepHelp: "Your voice is saved with each letter, on this phone.",
      onPhoneTitle: "Kept on this phone",
      onPhoneBody: "Without backup, recordings live only on this phone. Export or turn on backup to keep a copy.",
      backedUpTitle: "Kept on this phone and backed up",
      backedUpBody: "Each recording stays on this phone, with an encrypted copy in your backup.",
      storageUsed: "{count} MB used on this phone",
    },
    backup: {
      title: "Encrypted backup",
      offLabel: "Backup is off",
      onLabel: "Backup is on",
      body: "Copies your recordings to our servers, encrypted on this phone first, so a new phone can bring them back. We keep a recovery key so we can help you restore them.",
      // Backup is for the owner only in v1.0: no one else can play a backed-up recording (founder decision, Oct 3 2026).
      honestNote: "Without backup, your recordings stay only on this phone. Your letters sync when you are signed in, so your co-parent and your next phone can read them.",
      turnOnButton: "Turn on backup",
      turnOffButton: "Turn off backup",
      lastBackup: "Last backed up {weekday}",
      backingUp: "Backing up",
    },
    export: {
      title: "Export",
      body: "Download every letter and recording, any time, free. A PDF of the book, plus plain text and audio files.",
      button: "Export everything",
      preparing: "Gathering every letter. This can take a minute.",
      ready: "Your export is ready.",
      whereItGoes: "You choose where to keep it, for example in the Files app.",
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
      // In-app only (Brief decision 10). The store listing and website never say "beta".
      beta: {
        label: "Early version",
        body: `This is an early version of ${brand.name}, and it can make mistakes. Export a copy of your letters now and then.`,
        exportCta: "Export a copy",
      },
    },
    neverRewrite: "We never rewrite your words. We only fix what the microphone got wrong, and mark every fix.",
    // Settings > Privacy (PRD.md K-01, K-17). Each consent is visible and changeable here.
    privacy: {
      title: "Privacy",
      analyticsLabel: "Share usage and crash reports",
      analyticsHelp: "Which screens you open and when something breaks. Never your letters, recordings, photos or anyone's names.",
      sensitiveLabel: "Sync and family sharing",
      // Names the health category, as Washington and Connecticut consent requires (lawyer-2 H4, CHD policy HN-4).
      sensitiveHelp: "Letters can hold health details about you or {child}. Turn this off to stop syncing, and we will offer to delete what already synced.",
      aiLabel: "Cloud transcription", // v1.1 only: hidden in v1.0 (no audio leaves the phone; PRD 3.0)
      lockScreenLabel: "Names in notifications",
    },
  },

  // Sensitive-data consent, one plain screen after a new account is created and before the first sync
  // (PRD.md K-15, PRD-REQ-002; text from consumer-health-data-notice.md HN-4, counsel to approve).
  sensitiveConsent: {
    title: "Before your book syncs",
    body: "Letters can hold private things, like health details about you or {child}. To sync your book and share it with the family you choose, we store what you write on our servers.",
    use: "We use it only to keep and show your book. We never sell it, use it for ads or use it to train machine learning models.",
    changeLater: "You can change this any time in Settings, Privacy.",
    declineHelp: "If you keep it on this phone, syncing, backup and family sharing stay off.",
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
      // "Note" only ever means a short letter someone makes; never anything we send (BRAND.md glossary).
      remindersHelp: "Your reminder time is shared across your children. Messages about {child}'s months and birthday follow this switch.",
      celebrationsLabel: "Pause celebrations for {child}",
      celebrationsHelp: "Only for you. Month and birthday messages and milestones for {child} rest until you turn them back on.",
      familyLabel: "Who writes to {child}",
      familyCanReadLabel: "Family can read {child}'s book", // v1.1
      themeLabel: "How the book looks",
      hideLabel: "Hide this book",
      hideBody: "Hiding {child}'s book quiets every reminder and message about {child}, for everyone in the family. Nothing is deleted.",
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
    promise: "Writing, reading, playing your recordings, export and writing with {child}'s other parent are free, always. Plus adds a few extras.",
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
    backupFailed: {
      title: "Backup paused",
      body: "Your recordings are safe on this phone. Backup will continue when you are back online.",
    },
    inviteExpired: {
      title: "This invite has expired",
      body: "Ask {inviter} to send a new one.",
    },
    storageLow: {
      title: "This phone is almost full",
      body: "New recordings may not fit. Turning on backup or freeing space will help.",
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
    deletedBody: "Going back to the book in a moment.",
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
    plusNotYet: "Plus is not open yet. It arrives in a coming update.",
  },

  familyTab: {
    membersTitle: "Who writes to {child}",
    youLabel: "You",
    emptyTitle: "Just you, for now.",
    emptyBody: "Letters are lovelier with more voices.",
    inviteNeedsSignIn: "Inviting {child}'s other parent needs an account, so they can write from their own phone. Sign in arrives in a coming update.",
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
    // signedOutHelp and deleteAccountNotYet are removed in the release that ships sign-in (lawyer-2 H4).
    signedOutHelp: "Your letters and recordings are kept on this phone for now. Sign in arrives in a coming update.",
    appearanceTitle: "Appearance",
    themeLabel: "Theme",
    themes: {
      system: "Match this phone",
      light: "Light",
      dark: "Dark",
    },
    exportNotYet: "Export arrives in a coming update.",
    deleteAccountNotYet: "Accounts arrive with sign in. Until then, deleting the app removes its letters and recordings from this phone.",
    backupNotYet: "Backup arrives with Plus, in a coming update.",
    remindersNotYet: "Your choice is saved. Reminders start in a coming update.",
    legalTitle: "Legal",
    versionLabel: "Version",
  },

  // Sign-in screens the emails point to (customer review CUS-03, CUS-06, CUS-07). Copy only; the mobile lane wires them.
  auth: {
    checkEmailTitle: "Check your email",
    checkEmailBody: "We sent a sign-in link and a 6-digit code. Tap the link on this phone, or type the code here.",
    enterCodeLabel: "6-digit code",
    troubleButton: "Trouble signing in?",
    noEmailHelp: "Nothing yet? Wait a minute, then check Spam, Junk or Promotions for an email from hello@earlyletters.com. Still nothing? Use Sign in with Apple or Google, or write to us.",
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
  ageGate: {
    title: "Are you 18 or older?",
    body: "We ask everyone the same question.",
    yesButton: "Yes",
    noButton: "No",
    stopTitle: "Thank you for telling us.",
    stopBody: `${brand.name} is currently for adults 18 and over.`,
    stopNote: "Nothing you entered has been kept.",
    mistakeButton: "I answered by mistake",
  },
} as const;

export type Strings = typeof en;

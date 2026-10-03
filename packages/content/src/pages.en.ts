// Hosted page copy for the Early Letters website: /about, /why, /contact,
// /delete-account (D-042) and /404. Rendered by apps/web (lane D3).
//
// Sources for every factual claim: docs/legal/privacy-policy.md (1.3.0 draft,
// sections 1, 4, 6, 7, 9, 10, 11, 14, 18, 20), docs/legal/DELETION_AND_EXPORT_SPEC.md
// (2.6, DATA-REQ-021, -036, -064 to -066), docs/ARCHITECTURE.md (step 8),
// docs/DECISIONS.md (D-004, D-042, D-044) and PRD.md 3.0 (release tiers).
// v1.0 scope only: no Vault mode, no cloud transcription option, no web
// contribution page, no printed books.
//
// {child} is the only placeholder used here. The web renders it as "your child"
// on public pages (no real child is in context).
//
// The why page is a manifesto, not a founder story: the repo holds no founder
// story material, so it states no biographical facts.

export type PageSection = {
  heading: string;
  paragraphs: string[];
};

export type PageCopy = {
  /** Route path on earlyletters.com. */
  path: string;
  /** Page <title> and H1. */
  title: string;
  /** <meta name="description">, 155 characters or fewer. */
  metaDescription: string;
  /** Rendered in order. Paragraphs are plain text; the web autolinks email addresses. */
  sections: PageSection[];
};

export type PageId = "about" | "why" | "contact" | "deleteAccount" | "notFound";

export const pages = {
  about: {
    path: "/about",
    title: "About Early Letters",
    metaDescription:
      "Early Letters is the baby memory book you fill by talking. Your words kept exactly as you said them, private by default, made by an independent maker.",
    sections: [
      {
        heading: "What it is",
        paragraphs: [
          "Early Letters is the baby memory book you fill by talking. Parents and close family speak or type notes and letters to a child. A note is quick. A letter is longer. Both belong.",
          "Each letter is filed under {child}'s age that month, signed with the name of the person who wrote it, like From Nani or From Papa, and kept with its original recording. One day {child} can read it, and hear it.",
          "Early Letters is for families in the United States. Accounts are for adults 18 and over.",
        ],
      },
      {
        heading: "We never rewrite your words",
        paragraphs: [
          "This is the rule everything else is built on. Software may remove and repair. It may never add meaning.",
          "In practice, transcription only fixes the slips a microphone makes: a misheard word, a missing full stop, and, if you choose Lightly tidied, a stray um. Choose Word for word and every um and false start stays. Nothing is added, nothing is summarized, and no sentence is reworded.",
          "Every fix is recorded and can be undone. The original transcript is kept unchanged with each letter, and Show exactly what I said brings it back whenever you like.",
          "Your words stay in the language you said them. Hindi and English in the same sentence is how many families talk, and that is how it stays.",
        ],
      },
      {
        heading: "How privacy works",
        paragraphs: [
          "Letters are private by default. Only the family you invite can read what you add to the book, and parents approve family letters before they go in. Each child has their own book and their own family list.",
          "Transcription happens on your phone. No audio leaves your phone to turn speech into text.",
          "Recordings stay on your phone unless you back them up. A backed-up recording is encrypted on your phone with AES-256-GCM before it is uploaded. We hold a locked copy of the key so we can help you restore your recordings on a new phone, which means we could technically open them. We only would in the narrow cases below.",
          "When you sign in, your letter text syncs to our servers in the United States so your family and your next phone can read it. It is encrypted in transit and at rest, but it is not end-to-end encrypted. Our staff look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. Each access is logged and reviewed.",
          "There are no ads. We never sell your data or share it with advertisers, and we never use your letters, recordings or photos to train models of any kind. Analytics stay off until you say yes, and they never include letter text, recordings, photos, names or birthdays.",
          "You can export your whole book, free, at any time, and delete your own letters, recordings or account whenever you like. The Privacy Policy has the full detail.",
        ],
      },
      {
        heading: "What it costs",
        paragraphs: [
          "Writing, reading, playing your recordings, export and family letters are free, always. Plus is optional, from {price}, and adds a few extras. Nothing you have already made is ever locked away.",
        ],
      },
      {
        heading: "Who makes it",
        paragraphs: [
          "Early Letters is made and run by an independent maker in California, not a large company. Because it is published by an individual, the maker's legal name appears where the law asks for it: on the App Store listing and in the Terms and Privacy Policy.",
          "If Early Letters ever closes, you will hear at least 90 days ahead, and export will keep working the whole time.",
          "Questions, ideas or a kind word are all welcome at hello@earlyletters.com. A person reads every message.",
        ],
      },
    ],
  },

  why: {
    path: "/why",
    title: "Why Early Letters",
    metaDescription:
      "Most of what a family says to a small child is said once. Early Letters keeps those words exactly as they were said, in the voice that said them.",
    sections: [
      {
        heading: "Said once",
        paragraphs: [
          "Most of what a family says to a small child is said once. A joke at breakfast. A song made up in the car, with the words changed every time. A grandmother telling the story of the night {child} was born, in her own languages, with her own pauses. It is said, it is heard, and the day moves on.",
          "Photos keep what a day looked like, and they are wonderful at it. But a photo cannot tell {child} what you were thinking at the window that morning, or how you laughed before you finished the sentence. That part lives in words, and in a voice.",
        ],
      },
      {
        heading: "A book you fill by talking",
        paragraphs: [
          "Baby books ask a lot of tired people. Blanks to fill, firsts to date, a pen to find, a quiet hour that the early years rarely give. Many stop after a few pages, and that is nobody's failing. The format simply asks for time that is spent elsewhere, usually on the child.",
          "Some parents find their own way. They write to an email address set up just for their child, or talk into a voice memo in the car, and plan to hand it all over one day. Early Letters is made for that instinct. Talk to {child} for a minute, and your words become a letter in a book, filed under {child}'s age that month and signed with your name.",
        ],
      },
      {
        heading: "Exactly as you said it",
        paragraphs: [
          "At the centre of everything is one promise: we never rewrite your words. Not to make them tidier, not to make them sound more like a greeting card. Transcription only fixes the slips a microphone makes, a misheard word or a missing full stop, and every fix is kept and can be undone. The sentence that ends up in the book is one you actually said.",
          "Why be so strict? Because the way you say a thing is part of what you mean. The sentence you started twice. The Hindi word in the middle of an English thought, because that word was the right one. The way Nani always says the name. Smooth those out and you get something easier to read and less true.",
          "A letter to {child} is not a performance. It is you, on an ordinary day, and that is the version worth keeping. Not the best version. Yours.",
        ],
      },
      {
        heading: "A voice to come back to",
        paragraphs: [
          "Words on a page are one thing. The sound of a voice is another. Each letter keeps its original recording, so one day {child} can read the words and hear them too: the pause before the punchline, the sleepy mumble at the end of a long night, Dadi telling the story of the first steps again and again.",
          "Read together plays a letter in the voice of the person who wrote it, while the words appear on the page. It is made for bedtime, for a lap and a small hand on the screen, and for years of asking to hear the same one twice.",
        ],
      },
      {
        heading: "Small days count",
        paragraphs: [
          "There is no right amount to say. A minute is plenty. On a quiet day, Not much today is a complete answer. Nothing counts days, nothing keeps score, and nothing nudges you with a number.",
          "The book does not ask to be finished. It stays open for the next thing you want to tell {child}, whether that is tomorrow or next month.",
        ],
      },
      {
        heading: "Everyone who loves {child}",
        paragraphs: [
          "A child is surrounded by voices. Parents, grandparents, an aunt who calls every Sunday, a friend who was there the first week. Each of them can add letters of their own, signed the way the family says it. From Nani. From Papa. From Amma.",
          "Every author chooses what to share, and parents decide what goes into the book. One child, every voice that loves them, in one place.",
        ],
      },
      {
        heading: "Kept with care",
        paragraphs: [
          "Words this close to a family deserve care. Letters are private by default. There are no ads, and your data is never sold. You can export the whole book, free, whenever you like, in plain formats that open anywhere. The letters are yours.",
        ],
      },
      {
        heading: "Said once. Heard for years.",
        paragraphs: [
          "That is the whole idea. Talk to {child} today, in your own words and your own voice. Written early, read for years, and one day {child} will know exactly how it sounded when you said it.",
        ],
      },
    ],
  },

  contact: {
    path: "/contact",
    title: "Contact",
    metaDescription:
      "Write to Early Letters at hello@earlyletters.com for help, ideas, privacy and deletion requests, or press. A person reads every message.",
    sections: [
      {
        heading: "Write to us",
        paragraphs: [
          "The best way to reach us is email: hello@earlyletters.com. A person reads every message, and replies come from the same address.",
          "We reply within 10 business days, and privacy requests are also answered within the legal deadlines described in the Privacy Policy.",
        ],
      },
      {
        heading: "What to write about",
        paragraphs: [
          "Help with the app: signing in, inviting family, export, backup or anything that is not working the way you expect. Tell us what kind of phone you use and what you tapped, and we will take it from there.",
          "You never need to send us a letter or a recording to get help.",
          "Ideas and kind words are welcome too. They are read, every one.",
        ],
      },
      {
        heading: "Trouble signing in",
        paragraphs: [
          "If a sign-in link opened on a different device, use the 6-digit code from the same email instead. If you signed in with Apple and chose Hide My Email, your account uses the private address Apple made for you, so tell us that when you write and we will help you find your way back in.",
        ],
      },
      {
        heading: "Privacy and deletion requests",
        paragraphs: [
          "To delete your account, the quickest way is in the app: Settings, then Your data, then Delete account. The delete account page explains every step and what happens to your letters.",
          "To ask for a copy of your information, a correction or deletion, or which service providers hold your information, email hello@earlyletters.com from the address on your account. Before we act, we confirm it is you by sending a sign-in link to that address. You can also use an authorized agent; we will ask for proof that you gave them permission.",
          "If we say no to a request, we explain why. You can appeal by replying with Appeal in the subject line.",
        ],
      },
      {
        heading: "Press",
        paragraphs: [
          "Writing about Early Letters? Email hello@earlyletters.com with Press in the subject line and we will reply as soon as we can.",
        ],
      },
    ],
  },

  deleteAccount: {
    path: "/delete-account",
    title: "Delete your Early Letters account",
    metaDescription:
      "How to delete your Early Letters: Memory Book account, in the app or by email, what is deleted, what stays, and when.",
    sections: [
      {
        heading: "Delete your account in the app",
        paragraphs: [
          "This page is for Early Letters: Memory Book. The quickest way to delete your account is in the app, and it works without contacting anyone.",
          "Open Early Letters, tap Settings, then Your data, then Delete account.",
          "The app shows what will happen to each book before you confirm, and offers Export everything first, free. If you have Plus, it reminds you how to cancel with Apple. To make sure it is you, it may ask for Face ID, your passcode or a code sent to your email, and then asks you to type to confirm.",
          "Once you confirm, the app shows the date your account will be deleted, 30 days later, and we send a receipt by email.",
        ],
      },
      {
        heading: "Or ask by email",
        paragraphs: [
          "If you cannot use the app, email hello@earlyletters.com from the address on your account, with Delete my account in the subject line.",
          "Before we act, we confirm it is you by sending a sign-in link to that address. If you signed in with Apple and chose Hide My Email, say so in your message and we will help you confirm it is you.",
          "We reply within 10 business days. Once we have confirmed it is you, your request follows the same steps and timeline as a deletion from the app.",
        ],
      },
      {
        heading: "What is deleted",
        paragraphs: [
          "Your letters, recordings and photos are removed from every book, including a book you share with a co-parent. That book stays with your co-parent.",
          "A book where you are the only parent is deleted with everything in it, including family letters. Each family member is offered a copy of their own letters first.",
          "Letters you wrote to someone else's book are removed from it.",
          "Your profile, your family memberships and your account itself are deleted. We revoke your Sign in with Apple token and delete the random ID that links your account to your App Store purchases. If you turned analytics on, we ask our analytics provider to delete the events sent under your analytics ID.",
        ],
      },
      {
        heading: "When it happens",
        paragraphs: [
          "For 30 days after your request, your account is scheduled for deletion and you can change your mind. Sign in during that time and tap Cancel, and your letters and books come back. You can also still export.",
          "After the 30 days, everything listed above is erased from our live database and storage within 31 days of your request, from our database backups within 38 days, and by our service providers within 45 days.",
          "We email you when the request is made, if you cancel it, and when deletion is complete.",
        ],
      },
      {
        heading: "What stays",
        paragraphs: [
          "Copies that family already saved or played on their own phones stay with them, and so do any exports you made and your phone's own backups, such as iCloud Backup. Those are in your hands, not ours.",
          "Some records are kept without any letter, recording or photo in them. Records of what you agreed to are kept for 3 years and no longer show your name or email. Activity records, such as a letter was deleted, are kept for 24 months and no longer show who you are. Purchase records are kept as tax and accounting law requires, transaction details only. Support emails are deleted 2 years after your last message.",
          "Apple keeps its own purchase records as the store.",
        ],
      },
      {
        heading: "If you have Plus",
        paragraphs: [
          "Deleting your account does not cancel Plus. Billing continues through Apple until you cancel it in your Apple Account subscription settings. You can cancel before or after deleting your account.",
        ],
      },
      {
        heading: "Only want to remove some letters?",
        paragraphs: [
          "You do not have to delete your account to remove a letter. Delete it from the letter itself, and it waits in Recently deleted for 30 days in case you change your mind. A parent can also delete a whole book from that child's page in Settings.",
          "If you never made an account, your letters and recordings are only on your phone. Deleting the app removes them from it.",
        ],
      },
    ],
  },

  notFound: {
    path: "/404",
    title: "Page not found",
    metaDescription: "This page is not in the book. Head back to Early Letters, the baby memory book you fill by talking.",
    sections: [
      {
        heading: "We looked under every month. This page is not in the book.",
        paragraphs: [
          "The link may be old, or a letter in the address slipped. It happens to the best of us, usually while holding someone.",
          "Head back to the home page, or write to hello@earlyletters.com and tell us where you were going. We will point the way.",
        ],
      },
    ],
  },
} satisfies Record<PageId, PageCopy>;

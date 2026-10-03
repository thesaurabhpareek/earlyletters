// Hosted page copy for the website: /about, /why, /contact,
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
//
// The brand name comes from packages/brand, never typed here (CLAUDE.md).
// v1.0 family scope is co-parent only (Brief decision 5); recordings back up for
// their owner only and are not shared (founder decision, Oct 3 2026); seven spoken
// languages, no Hindi-English mixing claim (Brief 6); no word highlighting (Brief 9).
import { brand } from '@scribe/brand';

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
    title: `About ${brand.name}`,
    metaDescription:
      `${brand.name} is the baby memory book you fill by talking. Your words kept exactly as you said them, private by default, made by an independent maker.`,
    sections: [
      {
        heading: "What it is",
        paragraphs: [
          `${brand.name} is the baby memory book you fill by talking. Parents speak or type notes and letters to a child. A note is quick. A letter is longer. Both belong.`,
          "Each letter is filed under {child}'s age that month, signed with the name of the person who wrote it, like From Mama or From Papa, and kept with its original recording. One day {child} can read it, and hear it.",
          `${brand.name} is for families in the United States. Accounts are for adults 18 and over.`,
        ],
      },
      {
        heading: "We never rewrite your words",
        paragraphs: [
          "This is the rule everything else is built on. Software may remove and repair. It may never add meaning.",
          "In practice, transcription fixes only small slips: a misheard word, a missing full stop, a stray um, or a one-word grammar slip like we was to we were. We call this Word for word. Every small fix is marked on the page, so you can see it and undo it. Choose Exactly as said in Settings and every um and false start stays. Nothing is added, nothing is summarized, and no sentence is reworded.",
          "Every fix is recorded and can be undone. Exactly what you said is kept unchanged with each letter, and Show exactly what I said brings it back whenever you like.",
          "Speak English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them.",
        ],
      },
      {
        heading: "How privacy works",
        paragraphs: [
          "Letters are private by default. Only you, and {child}'s other parent if you invite them, can read what you add to the book. Each child has their own book.",
          "Transcription happens on your phone. No audio leaves your phone to turn speech into text.",
          "Recordings stay on your phone unless you back them up. A backup is for you alone. A backed-up recording is encrypted on your phone with AES-256-GCM before it is uploaded. We hold a locked copy of the key so we can help you restore your recordings on a new phone, which means we could technically open them. We only would in the narrow cases below.",
          "When you sign in, your letter text syncs to our servers in the United States so your co-parent and your next phone can read it. It is encrypted in transit and at rest, but it is not end-to-end encrypted. Our staff look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. Each access is logged and reviewed.",
          "There are no ads. We never sell your data or share it with advertisers, and we never use your letters, recordings or photos to train models of any kind. Analytics stay off until you say yes, and they never include letter text, recordings, photos, names or birthdays.",
          "You can export your whole book, free, at any time, and delete your own letters, recordings or account whenever you like. The Privacy Policy has the full detail.",
        ],
      },
      {
        heading: "What it costs",
        paragraphs: [
          "Writing, reading, playing your recordings and export are free, always. Plus is optional: $3.99 a month with the first month free, or $29.99 a year with the first 2 months free. It adds a few extras. Nothing you have already made is ever locked away.",
        ],
      },
      {
        heading: "Who makes it",
        paragraphs: [
          `${brand.name} is made and run by an independent maker in California, not a large company. Because it is published by an individual, the maker's legal name appears where the law asks for it: on the App Store listing and in the Terms and Privacy Policy.`,
          `If ${brand.name} ever closes, you will hear at least 90 days ahead, and export will keep working the whole time.`,
          "Questions, ideas or a kind word are all welcome at hello@earlyletters.com. A person reads every message.",
        ],
      },
    ],
  },

  why: {
    path: "/why",
    title: `Why ${brand.name}`,
    metaDescription:
      `Most of what a family says to a small child is said once. ${brand.name} keeps those words exactly as they were said, in the voice that said them.`,
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
          `Some parents find their own way. They write to an email address set up just for their child, or talk into a voice memo in the car, and plan to hand it all over one day. ${brand.name} is made for that instinct. Talk to {child} for a minute, and your words are kept as a letter in a book, filed under {child}'s age that month and signed with your name.`,
        ],
      },
      {
        heading: "Exactly as you said it",
        paragraphs: [
          "At the centre of everything is one promise: we never rewrite your words. Not to make them neater, not to make them sound more like a greeting card. Transcription only fixes the slips a microphone makes, a misheard word or a missing full stop, and every fix is kept and can be undone. The sentence that ends up in the book is one you actually said.",
          "Why be so strict? Because the way you say a thing is part of what you mean. The sentence you started twice. The way your own language says it, because those were the right words. The way you always say the name. Smooth those out and you get something easier to read and less true.",
          "A letter to {child} is not a performance. It is you, on an ordinary day, and that is the version worth keeping. Not the best version. Yours.",
        ],
      },
      {
        heading: "A voice to come back to",
        paragraphs: [
          "Words on a page are one thing. The sound of a voice is another. Each letter keeps its original recording, so one day {child} can read the words and hear them too: the pause before the punchline, the sleepy mumble at the end of a long night, the story of the first steps told again and again.",
          "Read together plays a letter in your own voice, with the letter on the page. It is made for bedtime, for a lap and a small hand on the screen, and for years of asking to hear the same one twice.",
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
        heading: "Two parents, one book",
        paragraphs: [
          "A child is surrounded by voices. Both parents can write to {child}, each letter signed the way the family says it. From Mama. From Papa. From Amma.",
          "Each of you keeps private letters until you add them to the book, and the book belongs to you both. One child, two voices that love them, in one place.",
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
      `Write to ${brand.name} at hello@earlyletters.com for help, ideas, privacy and deletion requests, or press. A person reads every message.`,
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
          "Help with the app: signing in, inviting a co-parent, export, backup or anything that is not working the way you expect. Tell us what kind of phone you use and what you tapped, and we will take it from there.",
          "Someone else in your account? Put Not me in the subject. We answer those first, within 1 business day.",
          "You never need to send us a letter or a recording to get help.",
          "Ideas and kind words are welcome too. They are read, every one.",
        ],
      },
      {
        heading: "Trouble signing in",
        paragraphs: [
          "If a sign-in link opened on a different device, use the 6-digit code from the same email instead. If you joined with Google, tap Sign in with Google in the app. If you signed in with Apple and chose Hide My Email, your account uses the private address Apple made for you, so tell us that when you write and we will help you find your way back in.",
          "No email arrived? Wait a minute, then check Spam, Junk or Promotions for an email from hello@earlyletters.com. Still nothing? Use Sign in with Apple or Sign in with Google, or write to us.",
          "See an empty book? You may have signed in a different way from the first time. Sign out, then use the way you first joined: Apple, Google, or the same email. If your letters are still missing, write to us and we will help you find the right account.",
        ],
      },
      {
        heading: "Common questions",
        paragraphs: [
          `Does my co-parent need an iPhone? Yes, for now. ${brand.name} is on iPhone first. Android is coming, and their place in the book will be waiting.`,
          "If one of us has Plus, does the other need it too? Not if you share an Apple family. Plus is shared through Apple Family Sharing, so a co-parent in the same Apple family gets it too. If you are in different Apple families, each of you has your own plan. Writing, reading, playing your recordings and export stay free for both of you either way.",
          "New phone, where are my recordings? Your letters come with you when you sign in. Recordings come with you if backup is on (part of Plus), or if you moved to the new phone with an iPhone backup or Quick Start. If you still have the old phone, open the app there and export your recordings, or turn on backup.",
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
          `Writing about ${brand.name}? Email hello@earlyletters.com with Press in the subject line and we will reply as soon as we can.`,
        ],
      },
    ],
  },

  deleteAccount: {
    path: "/delete-account",
    title: `Delete your ${brand.name} account`,
    metaDescription:
      `How to delete your ${brand.storeName} account, in the app or by email, what is deleted, what stays, and when.`,
    sections: [
      {
        heading: "Delete your account in the app",
        paragraphs: [
          `This page is for ${brand.storeName}. The quickest way to delete your account is in the app, and it works without contacting anyone.`,
          `Open ${brand.name}, tap Settings, then Your data, then Delete account.`,
          "The app shows what will happen to each book before you confirm, and offers Export everything first, free. If you have Plus, it reminds you how to cancel with Apple. To make sure it is you, it may ask for Face ID, your passcode or a code sent to your email, and then asks you to type to confirm.",
          "Once you confirm, the app shows the date your account will be deleted, 30 days later, and we send a receipt by email.",
        ],
      },
      {
        heading: "Or ask by email",
        paragraphs: [
          "If you cannot use the app, email hello@earlyletters.com from the address on your account, with Delete my account in the subject line.",
          "Before we act, we confirm it is you. We send an email to that address with a link that confirms the request. The link opens a page in any web browser, so you do not need the app or an iPhone. The page shows the date your account will be deleted and how to cancel, and has one button, Delete my account.",
          "If you signed in with Apple and chose Hide My Email, say so in your message and we will help you confirm it is you.",
          "We reply within 10 business days. Once you confirm, your request follows the same steps and timeline as a deletion from the app.",
        ],
      },
      {
        heading: "What is deleted",
        paragraphs: [
          "Your letters, recordings and photos are removed from every book, including a book you share with a co-parent. That book stays with your co-parent, and we let them know that your letters are no longer in it. If you would like them to keep a copy, export yours first and share it.",
          "A book where you are the only parent is deleted with everything in it.",
          "Your profile, your family memberships and your account itself are deleted. We revoke your Sign in with Apple token, remove your Sign in with Google link, and delete the status of your Plus plan that the app reported to us. If you turned analytics on, we ask our analytics provider to delete the events sent under your analytics ID.",
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
          "Any exports you made, and your phone's own backups, such as iCloud Backup, stay with you. Those are in your hands, not ours.",
          "A few records stay, with no letters or recordings in them: a record of what you agreed to (3 years, without your name), activity records such as a letter was deleted (24 months, without your name) and support emails (2 years after your last one).",
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
    metaDescription: `This page is not in the book. Head back to ${brand.name}, the baby memory book you fill by talking.`,
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

// Website copy for Early Letters. {price} and {child} are placeholders.
// v1 is digital only: no printed-book promises (PRD.md K-32).
// v1.0 claims only (docs/DECISIONS.md, 3 Oct 2026): recordings are not uploaded and there is no
// backup feature; Read together plays recordings on this phone with no word highlight; no
// Hindi-English mixing in one sentence yet (all D-059); 7 spoken languages (D-056); family at
// launch is the co-parent only (D-055), so grandparents and the gift are "coming", never "now".
// The privacy promise is `en.trust.promise` word for word (D-061). Legal pages: packages/brand
// `web.*` (D-063).
import { en } from './strings.en';

export const site = {
  hero: {
    headline: "Letters to your child, in your voice",
    subhead:
      "Early Letters is the baby memory book you fill by talking. Every word kept exactly as you said it, ready to read together for years.",
  },
  primaryCta: "Join the waitlist",
  benefits: [
    {
      title: "Exactly as you said it",
      body: "Your words are written down on your phone, and only microphone slips are fixed. We never rewrite your words. Every sentence is one you actually said.",
    },
    {
      title: "Your voice, kept",
      body: "The original recording stays with each letter. One day {child} can hear how you sounded, laughing at the same joke for the tenth time.",
    },
    {
      title: "A minute is plenty",
      body: "Say a few words at bedtime or in the car. On a quiet day, tap \"Not much today\". No counters, no badges, no scores. Just letters, whenever you have them.",
    },
    {
      title: "Write it together",
      body: "Invite your co-parent to the same book. Each letter is signed, From Papa, From Amma, and the book holds both your voices.",
    },
  ],
  howItWorks: {
    title: "How it works",
    steps: [
      {
        title: "Talk or type",
        body: "Tell {child} about today. A note or a long letter, both belong.",
      },
      {
        title: "Read it back",
        body: "See your words on the page. Fix a word if the microphone slipped. Nothing else changes.",
      },
      {
        title: "It joins the book",
        body: "Your letter is filed under {child}'s age that month, signed with your name.",
      },
    ],
  },
  readTogether: {
    title: "Read together",
    body: "Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page. Curl up together and listen to the story of the first steps, again and again.",
  },
  family: {
    title: "Room for everyone who loves {child}",
    // Grandparents and close family are a later update (D-055). Say "soon", never "now".
    body: "Today, you and your co-parent write in the same book. Letters from grandparents, aunts and uncles are coming in a later update, each one signed, with parents choosing what goes in.",
  },
  privacy: {
    title: "Our promise, in plain words",
    lead: en.trust.promise,
    points: [
      "Your letters are private by default. Only the people you invite can read what you add to the book.",
      "We never rewrite your words. Transcription happens on your phone.",
      "Your recordings stay on your phone, and in your iPhone's own backup if you use one. We do not upload them.",
      "No ads. We never sell your data or share it with advertisers.",
      "You can export your book, free, at any time.",
      "You can delete your own letters and recordings whenever you like.",
      "Each child has their own book and their own family list. Inviting someone to one book does not open the others.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "You and the people you invite. Letters are private by default, and you decide what goes into the book. When you sign in, your letters sync to our servers so your co-parent and your next phone can read them. Our staff look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. That access is restricted and logged.",
    },
    {
      q: "Do you rewrite my words?",
      a: "No. Transcription happens on your phone and only fixes microphone and grammar slips, like a misheard word or a missing full stop. It never changes what you meant or how you said it. Every sentence in your book is one you actually said.",
    },
    {
      q: "What if I skip a few days, or a few weeks?",
      a: "That is completely fine. There is nothing to keep up with and nothing counting. On a quiet day you can tap \"Not much today\", or simply come back when you have something to say. Your book is still there.",
    },
    {
      q: "Can grandparents add letters?",
      a: "Not yet. At first, a book is shared by you and your co-parent. Letters from grandparents and close family are coming in a later update.",
    },
    {
      q: "Which languages can I use?",
      a: "English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them, in its own script, never translated.",
    },
    {
      q: "Can I get my memory book out?",
      a: "Yes. Export it any time, for free: your letters, your recordings and a PDF of the book.",
    },
    {
      q: "How much does it cost?",
      a: "Writing, reading, playing your recordings, export and writing with your co-parent are free, always. Plus is optional, from {price}, and adds books for more children, Read together after your first 3 sessions, and a few extras. Your first child's book is free, and so are twins or more you add together when you set up.",
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone, attached to its letter, and is part of your iPhone's own backup if you use one. We do not upload recordings. Export them any time, and delete your recordings and letters whenever you like.",
    },
  ],
  // Not on the v1.0 page: grandparents cannot write yet (D-055). Kept for when they can.
  gift: {
    title: "A gift from the grandparents",
    body: "Give Early Letters to a new family and add the first letter yourself. Tell {child} about the day you heard the news, or the lullaby you once sang to {child}'s parent, long ago. It is a gift that keeps growing, one letter at a time.",
    cta: "Give Early Letters",
  },
  waitlist: {
    label: "Your email",
    button: "Join the waitlist",
    success: "Thank you. We will write when Early Letters is ready for you.",
    error: "That did not go through. Please check your email address and try again.",
  },
} as const;

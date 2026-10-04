// Website copy. {child} is a placeholder; the web renders it as "your child".
// v1 is digital only: no printed-book promises (PRD.md K-32).
// The brand name comes from packages/brand, never typed here (CLAUDE.md, D-076).
// v1.0 claims only (docs/DECISIONS.md, 3 Oct 2026): Read together plays recordings on this phone with no
// word highlight; no Hindi-English mixing in one sentence yet (D-059); 7 spoken languages (D-056); family
// at launch is the co-parent only (D-055), so grandparents and the gift are "coming", never "now".
// Recordings: no backup of our own in v1.0 (D-085 amends D-073); the person's own iPhone backup plus Export;
// family members hearing each other's recordings is v1.1 (D-059).
// The privacy promise is `en.trust.promise` word for word (D-061). Legal pages: packages/brand
// `web.*` (D-063).
import { brand } from '@scribe/brand';
import { en } from './strings.en';

/** Plus prices as shown on the website (D-075, Brief decision 3). The App Store shows the localized price. */
const price = {
  line: "$3.99 a month or $29.99 a year",
  monthly: "$3.99 a month, with the first month free",
  annual: "$29.99 a year, with the first 2 months free",
} as const;

export const site = {
  /** Open Graph and social card text: first contact, so it carries the descriptor (BRAND.md naming; brand review BRD-12). */
  og: {
    title: brand.name,
    description: `${brand.name}, the baby memory book you fill by talking. ${brand.tagline}`,
  },
  hero: {
    headline: "Letters to your child, in your voice",
    subhead:
      `${brand.name} is the baby memory book you fill by talking. Every word kept exactly as you said it, ready to read together for years.`,
  },
  primaryCta: "Join the waitlist",
  price,
  benefits: [
    {
      title: "Exactly as you said it",
      // D-074: the edit feature is Word for word.
      body: "Word for word: transcription happens on your phone and fixes only small slips, like a stray um or a misheard name. Every small fix is marked, and you can undo it. We never rewrite your words.",
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
        body: "See your words on the page, with any small fix marked. Fix a word if the microphone slipped. Nothing else changes.",
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
      // D-085 (amends D-073): no backup of our own in v1.0.
      "Your recordings stay on your phone, and in your iPhone's own backup if you use one.",
      "No ads. We never sell your data or share it with advertisers.",
      "You can export your book, free, at any time.",
      "You can delete your own letters and recordings whenever you like.",
      "Each child has their own book. Inviting someone to one book does not open the others.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "You, and {child}'s other parent if you invite them. Letters are private by default, and you decide what goes into the book. When you sign in, your letters sync to our servers so your co-parent and your next phone can read them. They are encrypted on the way and on our servers. We hold the keys, so our staff could open them, and they look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. That access is restricted and logged.",
    },
    {
      q: "Do you rewrite my words?",
      a: "No. Transcription happens on your phone. Word for word fixes only small slips: a stray um, a misheard name, a missing full stop, or a one-word grammar slip like we was to we were. Every small fix is marked, and you can undo it, or choose Exactly as said to keep every word as it came. It never changes what you meant or how you said it. Every sentence in your book is one you actually said.",
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
      q: "Does my co-parent need an iPhone?",
      a: `Yes, for now. ${brand.name} is on iPhone first. Android is coming, and their place in the book will be waiting.`,
    },
    {
      q: "If one of us has Plus, does the other need it too?",
      a: "Not if you share an Apple family. Plus is shared through Apple Family Sharing, so a co-parent in the same Apple family gets it too. If you are in different Apple families, each of you has your own plan. Writing, reading, playing your recordings and export stay free for both of you either way.",
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
      // D-075: the website shows the price. D-085: no backup is claimed in v1.0.
      a: `Writing, reading, playing your recordings, export and writing with your co-parent are free, always. Plus is optional: ${price.monthly}, or ${price.annual}. It adds books for more children, Read together after your first 3 sessions, and a few extras. Your first child's book is free, and so are twins or more you add together when you set up.`,
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone by default, attached to its letter, and is part of your iPhone's own backup if you use one. Export them any time to keep a copy of your own, and delete your recordings and letters whenever you like.",
    },
    {
      q: "What happens to my recordings if I change phones?",
      a: "Your letters come with you when you sign in. Recordings come with you if you move to the new phone with an iPhone backup or Quick Start. Without either, export them first.",
    },
  ],
  waitlist: {
    label: "Your email",
    button: "Join the waitlist",
    success: `Thank you. We will write when ${brand.name} is ready for you.`,
    error: "That did not go through. Please check your email address and try again.",
  },
} as const;

/**
 * v1.1 only. Not exported, never rendered on the site or in the store (Brief decision 5: family beyond the
 * co-parent, and gifts, come later). Kept so the copy is ready when those features ship.
 */
const v1_1 = {
  familyBenefit: {
    title: "The whole family, signed",
    body: "Invite grandparents and close family to add letters of their own. Each one is signed, From Papa, From Nani, and you approve what goes in the book.",
  },
  family: {
    title: "Room for everyone who loves {child}",
    body: "Grandparents, aunts, uncles and close friends can add their own letters, from anywhere. Each letter is signed. Each author chooses what to share, and parents approve what goes into the book. It is a simple way for family far away to be part of the everyday.",
  },
  faqGrandparents: {
    q: "Can grandparents add letters?",
    a: "Yes. Invite them and they can talk or type letters of their own in the free app on their phone, signed with their name, like From Nani. Parents approve family letters before they go into the book.",
  },
  gift: {
    title: "A gift from the grandparents",
    body: `Give ${brand.name} to a new family and add the first letter yourself. Tell {child} about the day you heard the news, or the lullaby you once sang to {child}'s parent, long ago. It is a gift that keeps growing, one letter at a time.`,
    cta: `Give ${brand.name}`,
  },
} as const;
void v1_1;

// Website copy. {child} is a placeholder; the web renders it as "your child".
// v1 is digital only: no printed-book promises (PRD.md K-32).
// The brand name comes from packages/brand, never typed here (CLAUDE.md, D-076).
// This is reference copy: the live site reads apps/web/src/content/site.ts, not this file.
// It states only what is true of the FIRST store build (D-121): on this phone, English only, no sign-in,
// no invite, no sync, no backup of our own. Co-parent, family, sync and other-language wording is held until
// the release that ships it (D-126; docs/exec-rulings-claims-trust-2026-11-01.md, Q3 to Q6). Words about
// edits follow the D-133 line (PR #439, open): it stays in your words, every change is marked, the recording is kept unchanged.
// Read together plays recordings on this phone with no word highlight (D-059).
// The privacy promise is `en.trust.promise` word for word (D-061). Legal pages: packages/brand
// `web.*` (D-063).
import { brand } from '@scribe/brand';
import { plusPriceLine } from './pricing';
import { en } from './strings.en';

/** Plus prices as shown on the website (D-075, Brief decision 3). The App Store shows the localized price. */
const price = plusPriceLine;

export const site = {
  /** Open Graph and social card text: first contact, so it carries the descriptor (BRAND.md naming; brand review BRD-12). */
  og: {
    title: brand.name,
    description: `${brand.name}, the baby memory book you fill by talking. ${brand.tagline}`,
  },
  hero: {
    headline: "Letters to your child, in your voice",
    subhead:
      `${brand.name} is the baby memory book you fill by talking. It stays in your words, and your letters stay on your iPhone.`,
  },
  primaryCta: "Join the waitlist",
  price,
  benefits: [
    {
      title: "It stays in your words",
      // D-074: the edit feature is Word for word.
      body: "Word for word: transcription happens on your phone. It takes out the ums and accidental repeats, spells your names your way, and marks each fix. You can undo any fix. We never rewrite your words.",
    },
    {
      title: "Your voice, kept",
      body: "The original recording stays with each letter, on your phone. One day {child} can hear how you sounded, laughing at the same joke for the tenth time.",
    },
    {
      title: "A minute is plenty",
      body: "Say a few words at bedtime or in the car. On a quiet day, tap \"Not much today\". Nothing counts or scores you. Write when you have something to say.",
    },
    {
      title: "Yours to take with you",
      body: "Export your letters, your recordings and a PDF of the book any time. Every letter you have made stays yours to export, with or without Plus.",
    },
  ],
  howItWorks: {
    title: "How it works",
    steps: [
      {
        title: "Talk or type",
        body: "Tell {child} about today. A sentence or a long letter, both belong.",
      },
      {
        title: "Read it back",
        body: "See your words on the page, with any small fix marked. Fix a word if one is wrong. Nothing else changes.",
      },
      {
        title: "It joins the book",
        body: "Your letter is filed under {child}'s age that month, signed with your name.",
      },
    ],
  },
  readTogether: {
    title: "Read together",
    body: "Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page. Hear the night of the first steps again, as many times as {child} asks.",
  },
  privacy: {
    title: "Our promise, in plain words",
    lead: en.trust.promise,
    points: [
      "Your letters and recordings stay on your iPhone. They are not sent to us.",
      "We never rewrite your words. Transcription happens on your phone.",
      // D-085 (amends D-073): no backup of our own in v1.0.
      "Your recordings stay on your phone, and in your iPhone's own backup if you use one.",
      "No ads. We never sell your data or share it with advertisers.",
      "You can export your book, free, at any time.",
      "You can delete your own letters and recordings whenever you like.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "Only you, on your phone. Letters and recordings stay on your iPhone and are not sent to us. If you use your iPhone's own backup, it holds them too.",
    },
    {
      q: "Do you rewrite my words?",
      a: "No. Transcription happens on your phone. Word for word takes out the ums and accidental repeats, spells your names your way, and marks each fix. It never adds a word. You can undo any fix, or choose Exactly as said to keep every word as it came. Every sentence in your book is one you actually said.",
    },
    {
      q: "What if I skip a few days, or a few weeks?",
      a: "That is fine. Nothing is counting. Tap \"Not much today\" on a quiet day, or come back when you have something to say. Your book is still there.",
    },
    {
      q: "Which languages can I use?",
      a: "English first. More languages follow one at a time, each after a native speaker has checked it. Your words stay in the language you said them, never translated.",
    },
    {
      q: "Can I get my memory book out?",
      a: "Yes. Export it any time, for free: your letters, your recordings and a PDF of the book.",
    },
    {
      q: "How much does it cost?",
      // D-075: the website shows the price. D-085: no backup is claimed in v1.0.
      a: `Your first two letters are free, across every book. After that, keeping another letter is part of Plus: ${price.monthly}, or ${price.annual}. Reading, playing your recordings, Read together and export are never locked away, with or without Plus. Starting a book for each child is free.`,
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone by default, attached to its letter, and is part of your iPhone's own backup if you use one. Export them any time to keep a copy of your own, and delete your recordings and letters whenever you like.",
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

// Website copy for Early Letters. {price} and {child} are placeholders.
// v1 is digital only: no printed-book promises (PRD.md K-32).
//
// This file is a reference copy: the live site reads apps/web/src/content/site.ts, not this file.
// It states what is true of the FIRST store build (D-121): on this phone only, English only, no sign-in, no
// invite, no sync, no backup of our own, Plus on. Wording that belongs to a later 1.0.x release (family
// invites, sync, backup, more languages, the gift) is not here until that release ships; the held lines are
// listed in docs/exec-rulings-claims-trust-2026-11-01.md. The words about edits follow the founder's true
// line (D-133): it stays in your words, every change is marked, the original recording is kept unchanged.

export const site = {
  hero: {
    headline: "Talk for a minute. Keep it for years.",
    subhead:
      "Early Letters is the baby memory book you fill by talking. It stays in your words, and your letters stay on your iPhone.",
  },
  primaryCta: "Tell me at launch",
  benefits: [
    {
      title: "It stays in your words",
      body: "Transcription happens on your phone. We only fix small slips, like an um, a repeated word or a name spelled your way, and we mark each one. You can put any fix back before you keep the letter. We never add a word.",
    },
    {
      title: "Your voice, kept",
      body: "The original recording stays with each letter, on your phone. One day {child} can hear how you sounded, laughing at the same joke for the tenth time.",
    },
    {
      title: "A minute is plenty",
      body: "Say a few words at bedtime or in the car. On a quiet day, tap \"Not much today\". No counters, no badges, no scores. Just letters, whenever you have them.",
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
        body: "Tell {child} about today. A note or a long letter, both belong.",
      },
      {
        title: "Read it back",
        body: "See your words on the page, with each small fix marked. Put any one back. Nothing else changes.",
      },
      {
        title: "It joins the book",
        body: "Your letter is filed under {child}'s age that month, signed with your name.",
      },
    ],
  },
  readTogether: {
    title: "Read together",
    body: "Open a letter and it plays in the voice of the person who wrote it, while the words appear on the page. Curl up together at bedtime and listen to your own voice tell the story of the first steps, again and again.",
  },
  privacy: {
    title: "Our promise, in plain words",
    points: [
      "Your letters and recordings stay on your iPhone. They are not sent to us.",
      "We never rewrite your words. Transcription happens on your phone.",
      "No ads. We never sell your data or share it with advertisers.",
      "Every letter you have made stays yours to export, at any time.",
      "You can delete your own letters and recordings whenever you like. A deleted letter waits 30 days in Recently deleted, or you can erase it at once.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "Only you, on your phone. Letters and recordings stay on your iPhone and are not sent to us. If you use your iPhone's own backup, it holds them too.",
    },
    {
      q: "Do you rewrite my words?",
      a: "No. Transcription happens on your phone. We only fix small slips, like an um, a repeated word or a name spelled your way, and we mark each one so you can put it back. We never add a word, and your original recording is kept unchanged. Every sentence in your book is one you actually said.",
    },
    {
      q: "What if I skip a few days, or a few weeks?",
      a: "Nothing is keeping count, so there is nothing to catch up on. On a quiet day you can tap \"Not much today\", or just come back when you have something to say. Your book is still there.",
    },
    {
      q: "Which languages can I use?",
      a: "English first. Other languages arrive one at a time, each after a native speaker has read it. Your words stay in the language you said them.",
    },
    {
      q: "Can I get my memory book out?",
      a: "Yes. Export it any time: your letters, your recordings and a PDF of the book. Every letter you have made stays yours to export, with or without Plus.",
    },
    {
      q: "How much does it cost?",
      a: "Your first two letters are free, so you can try it. After that, adding new letters needs Plus membership: $4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial, through the App Store in the US. One membership covers every child's book. Every letter you have made stays yours to read, play and export, even if you stop.",
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone, attached to its letter, and is never altered. If you use your iPhone's own backup, it holds the recordings too. You can delete your recordings and letters whenever you like.",
    },
  ],
  waitlist: {
    label: "Your email",
    button: "Tell me at launch",
    success: "Thank you. We will write to you when Early Letters launches.",
    error: "That did not go through. Please check your email address and try again.",
  },
} as const;

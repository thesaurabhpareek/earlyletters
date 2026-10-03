// Website copy. {child} is a placeholder; the web renders it as "your child".
// v1 is digital only: no printed-book promises (PRD.md K-32).
// The brand name comes from packages/brand, never typed here (CLAUDE.md).
// v1.0 scope (Brief decisions 3, 5, 6, 9 and founder decisions of Oct 3 2026): co-parent only, no
// grandparents, contributors, approvals or gifts; recordings back up for their owner only and are not
// shared with family; seven spoken languages, no Hindi-English mixing claim; no word highlighting claim.
import { brand } from '@scribe/brand';

/** Plus prices as shown on the website (Brief decision 3). The App Store shows the localized price. */
const price = {
  line: "$3.99 a month or $29.99 a year",
  monthly: "$3.99 a month, with the first month free",
  annual: "$29.99 a year, with the first 2 months free",
} as const;

export const site = {
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
      body: "Transcription happens on your phone by default and only fixes microphone slips. Every small fix is marked, and you can undo it. We never rewrite your words. Every sentence is one you actually said.",
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
      body: "Invite {child}'s other parent to add letters of their own, from their own phone. Each one is signed, like From Papa or From Mama.",
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
    body: "Open a letter and it plays in your own voice, with the letter on the page. Curl up together at bedtime and listen to the story of the first steps, again and again.",
  },
  family: {
    title: "Two parents, one book",
    body: "Invite {child}'s other parent to write too. Each letter is signed. Each of you keeps private letters until you add them to the book, and you both read everything in it.",
  },
  privacy: {
    title: "Our promise, in plain words",
    points: [
      "Your letters are private by default. Only the family you invite can read what you add to the book.",
      "We never rewrite your words. Transcription happens on your phone by default. If you ever choose cloud transcription, we ask first.",
      "Your recordings stay on your phone unless you back them up or choose cloud transcription. A backup is for you alone.",
      "Backups are encrypted on your phone first. We keep a recovery key so we can help you restore them, unless you choose Vault mode.",
      "No ads. We never sell your data or share it with advertisers.",
      "You can export your book, free, at any time.",
      "You can delete your own letters and recordings whenever you like.",
      "Each child has their own book. Inviting someone to one book does not open the others.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "You, and {child}'s other parent if you invite them. Letters are private by default, and you decide what goes into the book. When you sign in, your letters sync to our servers so your co-parent and your next phone can read them. Our staff look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. That access is restricted and logged.",
    },
    {
      q: "Do you rewrite my words?",
      a: "No. Transcription happens on your phone by default and only fixes microphone and grammar slips, like a misheard word or a missing full stop. Every small fix is marked, and you can undo it. It never changes what you meant or how you said it. Every sentence in your book is one you actually said.",
    },
    {
      q: "What if I skip a few days, or a few weeks?",
      a: "That is completely fine. There is nothing to keep up with and nothing counting. On a quiet day you can tap \"Not much today\", or simply come back when you have something to say. Your book is still there.",
    },
    {
      q: "Can {child}'s other parent write too?",
      a: "Yes. Invite them from the app and they can talk or type letters of their own on their own phone, each one signed with their name, like From Papa. You both read the whole book.",
    },
    {
      q: "Which languages can I use?",
      a: "Speak English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them.",
    },
    {
      q: "Can I get my memory book out?",
      a: "Yes. Export it any time, for free: your letters, your recordings and a PDF of the book.",
    },
    {
      q: "How much does it cost?",
      a: `Writing, reading, playing your recordings and export are free, always. Plus is optional: ${price.monthly}, or ${price.annual}. It adds backup for every recording, books for more children, Read together after your first 3 sessions, and a few extras. Your first child's book is free, and so are twins or more you add together when you set up.`,
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone by default, attached to its letter. It leaves your phone only if you back it up or choose cloud transcription. A backup is for you alone. Backups are encrypted on your phone first, and we keep a recovery key so we can help you restore them, unless you choose Vault mode. You can delete your recordings and letters whenever you like.",
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

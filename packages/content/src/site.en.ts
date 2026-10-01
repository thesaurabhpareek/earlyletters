// Website copy for Early Letters. {price} and {child} are placeholders.

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
      body: "Transcription happens on your phone and only fixes microphone slips. We never rewrite your words. Every sentence is one you actually said.",
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
      title: "The whole family, signed",
      body: "Invite grandparents and close family to add letters of their own. Each one is signed, From Papa, From Nani, and you approve what goes in the book.",
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
    body: "Open a letter and it plays in the voice of the person who wrote it, while the words appear on the page. Curl up at bedtime and listen to Dadi tell the story of the first steps. Or let {child} choose a favourite letter and listen alone, again and again.",
  },
  family: {
    title: "Room for everyone who loves {child}",
    body: "Grandparents, aunts, uncles and close friends can add their own letters, from anywhere. Each letter is signed. Each author chooses what to share, and parents approve what goes into the book. It is a simple way for family far away to be part of the everyday.",
  },
  privacy: {
    title: "Our promise, in plain words",
    points: [
      "Your letters are private by default. Nothing is shared unless you share it.",
      "We never rewrite your words. Transcription happens on your phone.",
      "Your recordings stay on your phone unless you turn on the encrypted backup.",
      "You can export everything as a PDF, free, at any time.",
      "You can delete a letter or a recording whenever you like.",
    ],
  },
  faq: [
    {
      q: "Who can see my letters?",
      a: "Only you, until you choose otherwise. Letters are private by default. You decide what goes into the book and who you invite to it.",
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
      a: "Yes. Invite them and they can talk or type letters of their own, signed with their name, like From Nani. Parents approve family letters before they go into the book.",
    },
    {
      q: "Which languages can I use?",
      a: "Speak the way your family speaks. Hindi, English, or both in the same sentence. Your words stay in the language you said them.",
    },
    {
      q: "Can I get my memory book out?",
      a: "Yes. Export it as a PDF any time, for free. Printed books, starting with Early Letters: Year One, are coming later.",
    },
    {
      q: "How much does it cost?",
      a: "Early Letters will cost {price}. PDF export is always free. Printed books will be priced separately when they arrive.",
    },
    {
      q: "What happens to my recordings?",
      a: "Each recording stays on your phone by default, attached to its letter. If you turn on backup, recordings are encrypted before they are stored. You can delete a recording or a letter whenever you like.",
    },
  ],
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

// App Store listing copy for Early Letters. Plain text only.
// Limits: appName <= 30, subtitle <= 30, promotionalText <= 170,
// keywords <= 100 (comma-separated, no spaces), captions <= 40.
// v1 is digital only: no printed-book promises in store copy (PRD.md K-32).
// Build 1 is on-device (D-121): no sign-in, sync, invites or family, no backup of our own, English only (D-126, D-115).
// Nothing here may promise those, name a "coming soon" or say "beta" (D-060). "Exactly as you said it" and "every word"
// are out: the app removes ums and repeats and adds punctuation, so the line is D-133's "It stays in your words."
// docs/store/listing/listing.json mirrors these fields; the content rules test pins the claims in both.
// No other platform's name in iOS metadata (App Review 2.3.10).

export const storeListing = {
  appName: "Early Letters: Memory Book",
  subtitle: "Baby memory book in your voice",
  promotionalText:
    "Tell your child about today in a minute. It stays in your words. Every change is marked, and your original recording is kept unchanged. Read it together for years.",
  keywords:
    "journal,diary,keepsake,newborn,toddler,parents,mom,dad,family,audio,scrapbook,dictation",
  description: `Early Letters is the baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. Early Letters keeps it as a letter, in your words and in your voice, and files it by month of age. Over time it becomes a book your child can read, and hear, for years.

IT STAYS IN YOUR WORDS
Your speech is written down on your phone. Early Letters fixes only small slips: an um, an accidental repeat, a name spelled the way you spell it, a capital letter, a full stop. It never adds a word. Every change is marked, and you can put any of them back. A microphone can mishear, so read each letter before you keep it. Letters you type stay exactly as you typed them.

YOUR VOICE, KEPT
Each letter you speak keeps its original recording, unchanged. It stays on your phone, and in your iPhone's own backup if you use one. Years from now, your child can hear how you sounded when you said it.

READ TOGETHER
Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page.

A SENTENCE IS PLENTY
Some days you have a sentence, some days a long letter. If today was quiet, tap "Not much today" and that is enough. There are no counters, no badges and no scores.

IN ENGLISH
Early Letters works in English.

PRIVATE BY DEFAULT
Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models. Your book stays on your phone. Delete a letter and it waits 30 days in Recently deleted, or you can erase it at once.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months. Starting a book is free, and your first two letters are free across every book.

TAKE IT WITH YOU
Export your memory book any time: your letters, your recordings and a PDF of the book. Every letter you have made stays yours to read, play and export, even if you stop.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if one is wrong.
3. It is saved to this month in your child's memory book.

Early Letters is for parents of babies and young children, from the first weeks to the first years. Written early. Read again and again.

Your first two letters are free, so you can try it. To keep adding letters, choose Plus: $4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial. Subscriptions renew automatically until you cancel, at least 24 hours before they renew, and you can cancel any time in your Apple Account settings. One membership covers every child's book. Every letter you have made stays yours to read, play and export, even if you stop.`,
  whatsNewV1:
    "Hello. This is the first version of Early Letters. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book as a PDF. Your first two letters are free.",
  screenshotCaptions: [
    "Talk to your child for a minute",
    "Every change is marked",
    "Your voice stays with every letter",
    "A memory book, month by month",
    "Read together at bedtime",
    "Private by default",
  ],
} as const;

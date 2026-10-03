// App Store listing copy. Plain text only.
// Limits: appName <= 30, subtitle <= 30, promotionalText <= 170,
// keywords <= 100 (comma-separated, no spaces), captions <= 40.
// v1 is digital only: no printed-book promises in store copy (PRD.md K-32).
// v1.0 family is the co-parent only (Brief decision 5): no grandparents, contributors, approvals or gifts.
// Recordings back up for their owner only and are not shared with family in v1.0 (founder decision, Oct 3 2026).
// The listing never says "beta" (Brief decision 10; D-030). The in-app "early version" note is the only one.
// No word-by-word highlighting claims (v1.1). No other platform's name in iOS metadata (App Review 2.3.10).
// The brand name comes from packages/brand, never typed here (CLAUDE.md).
import { brand } from '@scribe/brand';

export const storeListing = {
  appName: brand.storeName,
  subtitle: brand.subtitle,
  promotionalText:
    `Talk to your child for a minute. ${brand.name} keeps every word exactly as you said it, with your voice, in a memory book you can read together for years.`,
  keywords:
    "journal,diary,keepsake,newborn,parents,milestones,family,toddler,audio,bilingual,scrapbook",
  description: `${brand.name} is the baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. ${brand.name} keeps it as a letter, in your words and in your voice, and files it by month of age. Over time it becomes a book your child can read, and hear, for a lifetime.

EXACTLY AS YOU SAID IT
Transcription happens on your phone by default. It only fixes the mistakes a microphone makes, like a misheard word or a missing full stop, and every small fix is marked so you can undo it. We never rewrite your words. Every sentence in your book is one you actually said.

YOUR VOICE, KEPT
The original recording stays with each letter, on your phone by default. With the optional backup, recordings are encrypted on your phone before upload, and only you can restore them. We keep a recovery key so we can help you, unless you choose Vault mode. Years from now, your child can hear how you sounded when you said it.

READ TOGETHER
Open any letter and it plays in your own voice, with the letter on the page. Listen together at bedtime. Your first 3 Read together sessions are free; after that, Read together is part of Plus. Playing any single recording is always free.

NOTES AND LETTERS
Some days are a quick note. Some days are a proper letter. Both belong. If today was quiet, tap "Not much today" and that is enough. There are no counters, no badges and no scores. Come back whenever you like.

WRITE IT TOGETHER
Invite your child's other parent to add letters of their own from the free app on their own phone. Each one is signed, like "From Papa" or "From Mama", and you both read the whole book.

SEVEN LANGUAGES, AS SPOKEN
Speak English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. ${brand.name} keeps your words in the language you said them.

PRIVATE BY DEFAULT
Your letters are yours. Only the family you invite can read them, and you decide what goes into the book. No ads. We never sell your data or share it with advertisers.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months and settings. Switch between them in one tap. Your first child's book is free, and so are twins or more you add together when you set up. Books you start for more children later are part of Plus.

TAKE IT WITH YOU
Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if the microphone slipped.
3. It is saved to this month in your child's memory book.

${brand.name} is for parents of children from birth to five. Written early. Kept for good. Read again and again.

Writing, reading, playing your recordings and export are free, always. Plus is optional and renews automatically until you cancel.`,
  whatsNewV1:
    `Hello. This is the first version of ${brand.name}. Talk or type a letter to your child, keep your voice with it, write it together with your child's other parent, read together, and export your memory book as a PDF any time.`,
  screenshotCaptions: [
    "Talk to your child for a minute",
    "Kept exactly as you said it",
    "Your voice stays with every letter",
    "Two parents, one book",
    "Read together, in your voice",
    "A memory book, month by month",
  ],
} as const;

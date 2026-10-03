// App Store listing copy for Early Letters. Plain text only.
// Limits: appName <= 30, subtitle <= 30, promotionalText <= 170,
// keywords <= 100 (comma-separated, no spaces), captions <= 40.
// v1 is digital only: no printed-book promises in store copy (PRD.md K-32).
// v1.0 family write from the app; no web-page or "no app needed" promise until v1.1 (PRD.md K-35).
// No other platform's name in iOS metadata (App Review 2.3.10).
// Never says "beta": the beta runs on TestFlight (brief 3 Oct decision 10, D-030, App Review 2.2).
// Adult audience: no "kids", "for children" or child-directed phrases (LEGAL-REQ-045, App Review 2.3.8).

export const storeListing = {
  appName: "Early Letters: Memory Book",
  subtitle: "Baby memory book in your voice",
  promotionalText:
    "Talk to your child for a minute. Early Letters keeps every word exactly as you said it, with your voice, in a memory book you can read together for years.",
  keywords:
    "journal,diary,keepsake,newborn,parents,milestones,family,grandparents,audio,bilingual,scrapbook",
  description: `Early Letters is a baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. Early Letters keeps it as a letter, in your words and in your voice, and files it by month of age. Over time it becomes a book your child can read, and hear, for a lifetime.

EXACTLY AS YOU SAID IT
Transcription happens on your phone by default. It only fixes the mistakes a microphone makes, like a misheard word or a missing full stop. We never rewrite your words. Every sentence in your book is one you actually said.

YOUR VOICE, KEPT
The original recording stays with each letter, on your phone by default. With the optional backup, recordings are encrypted on your phone before upload, and we keep a recovery key so we can help you restore them, unless you choose Vault mode. Years from now, your child can hear how you sounded when you said it.

READ TOGETHER
Open any letter and it plays in the voice of the person who wrote it, while the words appear on the page. Listen together at bedtime. Your first 3 Read together sessions are free; after that, Read together is part of Plus. Playing any single recording is always free.

NOTES AND LETTERS
Some days are a quick note. Some days are a proper letter. Both belong. If today was quiet, tap "Not much today" and that is enough. There are no counters, no badges and no scores. Come back whenever you like.

A BOOK FOR THE WHOLE FAMILY
Invite grandparents and close family to add their own letters from the free app on their phone. Each one is signed, like "From Papa" or "From Nani". You approve what goes into the book, and each author chooses what they share.

EVERY LANGUAGE, AS SPOKEN
Speak Hindi, English, both in one sentence, or any mix your family uses. Early Letters keeps your words in the language you said them.

PRIVATE BY DEFAULT
Your letters are yours. Only the family you invite can read them, and you decide what goes into the book. No ads. We never sell your data or share it with advertisers.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months, family and settings. Switch between them in one tap. Your first child's book is free, and so are twins or more you add together when you set up. Books you start for more children later are part of Plus.

TAKE IT WITH YOU
Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if the microphone slipped.
3. It is saved to this month in your child's memory book.

Early Letters is for parents of children from birth to five, and for the grandparents, aunts, uncles and close friends who love them. Written early. Kept for good. Read again and again.

Writing, reading, playing your recordings, export and family letters are free, always. Plus is optional and renews automatically until you cancel.`,
  whatsNewV1:
    "Hello. This is the first version of Early Letters. Talk or type a letter to your child, keep your voice with it, invite family, read together, and export your memory book as a PDF any time.",
  screenshotCaptions: [
    "Talk to your child for a minute",
    "Kept exactly as you said it",
    "Your voice stays with every letter",
    "Grandparents can write too",
    "Read together, in their voices",
    "A memory book, month by month",
  ],
} as const;

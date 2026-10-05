// App Store listing copy. Plain text only. docs/store/app-store.md mirrors these
// fields for App Store Connect, and the content rules test fails if the two drift.
// Limits: appName <= 30, subtitle <= 30, promotionalText <= 170, keywords <= 100 (comma-separated,
// no spaces, no words already in the name or subtitle), whatsNew <= 4000, captions <= 40.
//
// v1.0 claims only (docs/DECISIONS.md, 3 Oct 2026):
// - no "beta" anywhere (D-060, App Review 2.2): the beta runs on TestFlight; no "early version" or
//   "early access" either, since the in-app note says "early version";
// - no other platform's name (App Review 2.3.10); Apple's own Family Sharing is fine;
// - adults only: no "kids", "for children" or child-directed phrases (LEGAL-REQ-045, App Review 2.3.8);
// - 7 spoken languages, one per letter, no mixing in one sentence (D-056, D-059);
// - family = the co-parent only (D-055); no grandparent or web-page promise;
// - recordings: no backup of our own in v1.0 (D-085 amends D-073); the person's own iPhone backup plus Export;
//   no family listening and no word highlight in Read together (D-059);
// - digital only, no printed-book promise (K-32); no health or development-tracking words (D-004);
// - the privacy promise is `en.trust.promise`, word for word (D-061).
// Legal URLs come from packages/brand (D-063). The brand name too, never typed here (D-076).
import { brand } from '@scribe/brand';
import { en } from './strings.en';

/** The six App Store screenshots, in order. Frames are rendered by scripts/brand/screenshots.mts. */
const screenshots = [
  { id: 'talk', caption: "Talk to your child for a minute", subline: "A sentence is plenty. It becomes a letter.", scheme: 'light' },
  { id: 'exact', caption: "Kept exactly as you said it", subline: "We fix slips of the tongue. Never your words.", scheme: 'light' },
  { id: 'voice', caption: "Your voice stays with every letter", subline: "One day your child can hear you say it.", scheme: 'light' },
  { id: 'book', caption: "A memory book, month by month", subline: "Every letter finds its month on its own.", scheme: 'light' },
  { id: 'together', caption: "Read together at bedtime", subline: "The letters you spoke, in your own voice.", scheme: 'dark' },
  { id: 'private', caption: "Private to your family", subline: "Never sold. Never used for ads.", scheme: 'light' },
] as const;

export const storeListing = {
  appName: brand.storeName,
  subtitle: brand.subtitle,
  promotionalText:
    "Talk to your child for a minute. Every word is kept exactly as you said it, with your voice. Private by default: never sold, never used for ads.",
  keywords: "diary,keepsake,newborn,toddler,parents,mom,dad,family,audio,scrapbook,bilingual,hindi,spanish,arabic",
  description: `${brand.name} is a baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. ${brand.name} keeps it as a letter, in your words and in your voice, and files it by your child's month of age. Over time it becomes a book your child can read, and hear, for years.

EXACTLY AS YOU SAID IT
Your words are written down on your phone. We only fix what a microphone gets wrong: a stray "um", a repeated word, a missing full stop. We never rewrite your words. Read each letter back, and put any fix back with one tap.

YOUR VOICE, KEPT
The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one. Years from now, your child can hear how you sounded when you said it. ${en.trust.voice}

READ TOGETHER
Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page.

NOTES AND LETTERS
Some days are a quick note. Some days are a proper letter. Both belong. If today was quiet, tap "Not much today" and that is enough. There are no counters, no badges and no scores.

WRITE IT TOGETHER
Invite your co-parent to the same book. You each sign your own letters, like "From Papa" or "From Amma", and the book holds both your voices.

YOUR LANGUAGE, AS SPOKEN
Speak your letters in English, Hindi, Spanish, Mandarin Chinese, French, Arabic or Portuguese. Your words stay in the language you said them, in its own script, never translated. A language downloads only when you choose it, so the app stays small.

PRIVATE BY DEFAULT
${en.trust.promise} Only you and the people you invite can read your book. You can export everything or delete everything, any time, from Settings.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months. Starting a book is free, and your first two letters are free across every book.

TAKE IT WITH YOU
Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if the microphone slipped.
3. It is saved to this month in your child's memory book.

${brand.name} is for parents of babies and young children, from the first weeks to the first years. Written early. Read again and again.

Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus. Plus is an optional subscription that lets you keep adding letters. It renews automatically until you cancel, and works with Family Sharing.

Terms of Use: ${brand.web.terms}
Privacy Policy: ${brand.web.privacy}`,
  // App Store Connect fields (D-063).
  supportUrl: brand.web.origin,
  marketingUrl: brand.web.origin,
  privacyPolicyUrl: brand.web.privacy,
  supportEmail: brand.support.email,
  /** Listed in Lifestyle, never Health and Fitness or Medical (D-004, guideline 5.1.1(ix) mitigation). */
  primaryCategory: 'Lifestyle',
  whatsNewV1:
    `Hello. This is the first version of ${brand.name}. Talk or type a letter to your child, keep your voice with it, write together with your co-parent, read together at bedtime, and export your book any time.`,
  screenshots,
  screenshotCaptions: screenshots.map((s) => s.caption),
} as const;

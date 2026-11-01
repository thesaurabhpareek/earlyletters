// App Store listing copy. Plain text only. docs/store/app-store.md mirrors these
// fields for App Store Connect, and the content rules test fails if the two drift.
// Limits: appName <= 30, subtitle <= 30, promotionalText <= 170, keywords <= 100 (comma-separated,
// no spaces, no words already in the name or subtitle), whatsNew <= 4000, captions <= 40.
//
// The first store build (D-121, staged release): on-device only, with server features, backup, status report
// and analytics off, English only, Plus on. Applied from docs/store/app-store-staged-1.0-proposal.md, 31 Oct 2026.
// Each later 1.0.x release that turns a feature on adds it back here in the same pull request.
// - no "beta" anywhere (D-060, App Review 2.2): the beta runs on TestFlight; no "early version" or
//   "early access" either, since the in-app note says "early version";
// - no other platform's name (App Review 2.3.10); Apple's own Family Sharing is fine;
// - adults only: no "kids", "for children" or child-directed phrases (LEGAL-REQ-045, App Review 2.3.8);
// - English only (D-121 item 1); the other six languages return one by one as each passes its gate (D-125 item 2);
// - no co-parent sharing, sign-in or sync in this build (D-121, D-126): nothing invites anyone;
// - "exactly as you said it" is held from the listing until counsel clears it at T30 (D-125 item 9);
// - recordings: no backup of our own (backup flag off); the person's own iPhone backup plus Export;
//   no family listening and no word highlight in Read together (D-059);
// - digital only, no printed-book promise (K-32); no health or development-tracking words (D-004);
// - the privacy promise is `en.trust.promise`, word for word (D-061);
// - v1.0 makes no notes (S26), so the listing talks about letters only.
// Legal URLs come from packages/brand (D-063). The brand name too, never typed here (D-076).
import { brand } from '@scribe/brand';
import { en } from './strings.en';

/** The six App Store screenshots, in order. Frames are rendered by scripts/brand/screenshots.mts. */
const screenshots = [
  { id: 'talk', caption: "Talk to your child for a minute", subline: "A sentence is plenty. It becomes a letter.", scheme: 'light' },
  { id: 'exact', caption: "Every change is marked", subline: "We fix small slips. Never your words.", scheme: 'light' },
  { id: 'voice', caption: "Your voice stays with every letter", subline: "One day your child can hear you say it.", scheme: 'light' },
  { id: 'book', caption: "A memory book, month by month", subline: "Every letter finds its month on its own.", scheme: 'light' },
  { id: 'together', caption: "Read together at bedtime", subline: "The letters you spoke, in your own voice.", scheme: 'dark' },
  { id: 'private', caption: "Private by default", subline: "Never sold. Never used for ads.", scheme: 'light' },
] as const;

export const storeListing = {
  appName: brand.storeName,
  subtitle: brand.subtitle,
  promotionalText:
    "Talk to your child for a minute and keep it as a letter, in your words and your voice. Every fix is marked. Private by default: never sold, never used for ads.",
  keywords: "diary,keepsake,newborn,toddler,parents,mom,dad,family,audio,scrapbook,dictation",
  description: `${brand.name} is the baby memory book you fill by talking.

Say a few words to your child at the end of the day. A first laugh, a long night, a song you made up in the car. ${brand.name} keeps it as a letter, in your words and in your voice, and files it by your child's month of age. Over time it becomes a book your child can read, and hear, for years.

EVERY CHANGE SHOWN
Your words are written down on your phone. We only fix small slips, like an um, a repeat or a misheard word, and mark each one. You can put any fix back with one tap, and we never rewrite your words.

YOUR VOICE, KEPT
The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one. Years from now, your child can hear how you sounded when you said it. ${en.trust.voice}

READ TOGETHER
Open the book at bedtime and hear the letters you spoke, in your own voice, with the words on the page.

A SENTENCE IS PLENTY
Some days you have a sentence, some days a long letter. If today was quiet, tap "Not much today" and that is enough. Nothing keeps score. Write when you have something to say.

IN ENGLISH
This version works in English. The English speech model is a one-time download that you choose at the end of setup, so the app stays small.

PRIVATE BY DEFAULT
${en.trust.promise} Your book stays on your phone. You can export everything or delete everything, any time, from Settings.

A BOOK FOR EACH CHILD
Each child gets their own book, with their own months. Starting a book is free, and your first two letters are free across every book.

TAKE IT WITH YOU
Export your memory book any time, for free: your letters, your recordings and a PDF of the book.

HOW IT WORKS
1. Tap and talk, or type if you prefer.
2. Read it back. Fix a word if one is wrong.
3. It goes into this month of your child's book.

${brand.name} is for parents of babies and young children, from the first weeks to the first years. Written early. Read again and again.

Your first two letters are free. Every letter you keep stays yours to read, play and export, with or without Plus. Plus is an optional subscription that lets you keep adding letters. It renews automatically until you cancel, and works with Family Sharing.

Terms of Service: ${brand.web.terms}
Privacy Policy: ${brand.web.privacy}`,
  // App Store Connect fields (D-063).
  supportUrl: brand.web.origin,
  marketingUrl: brand.web.origin,
  privacyPolicyUrl: brand.web.privacy,
  supportEmail: brand.support.email,
  /**
   * App Review notes (guideline 2.1; D-004 positioning). Sent by the release workflow, never shown to families.
   * First draft for BL-341, which adds how to reach Plus. True for the on-device v1.0 only (PR #54): update it
   * when sign-in ships.
   */
  reviewNotes:
    "A family memory journal: parents speak or type short letters to their child. The app never rewrites what a person says. It makes only small marked fixes to the transcript (stray sounds, repeated words, a misheard name from the family's own word list, punctuation), and each fix can be put back. Version 1.0 keeps everything on the phone: there is no sign-in, no account and no server copy of letters. The birthday or due date a parent enters is used to file letters by month of age. This is not a health or medical service and gives no health advice.",
  /** Listed in Lifestyle, never Health and Fitness or Medical (D-004, guideline 5.1.1(ix) mitigation). */
  primaryCategory: 'Lifestyle',
  whatsNewV1:
    `This is the first version of ${brand.name}. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book any time.`,
  screenshots,
  screenshotCaptions: screenshots.map((s) => s.caption),
} as const;

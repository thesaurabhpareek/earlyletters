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

/**
 * The App Store screenshots, in order (store lane 1.0, 1 Nov 2026). Frames 1 to 6 are the set; 7 and 8 are optional.
 * Captured from the real app on web and composed by docs/store/screenshots/tools (see its README). `scheme` is the
 * appearance of the captured screen. Frame 5's subline says what Read together does: it goes through the whole book,
 * oldest first (there is no "open a month").
 */
const screenshots = [
  { id: '01-tonight', caption: "Tell your child about today.", subline: "A minute is plenty. It becomes a letter.", scheme: 'dark' },
  { id: '02-review', caption: "Every change is marked.", subline: "We only fix small slips. Tap one to put it back.", scheme: 'light' },
  { id: '03-letter', caption: "Your voice stays with each letter.", subline: "The original recording is kept unchanged.", scheme: 'light' },
  { id: '04-book', caption: "A book that grows by month.", subline: "Each letter goes into your child's month of age.", scheme: 'light' },
  { id: '05-letter-night', caption: "Read together at bedtime.", subline: "One letter at a time, oldest first.", scheme: 'dark' },
  { id: '06-privacy', caption: "Your book stays on your phone.", subline: "Private by default. Never sold, never used for ads.", scheme: 'light' },
  { id: '07-quiet-day', caption: "Quiet days are fine.", subline: "Tap Not much today. That is enough.", scheme: 'dark' },
  { id: '08-listening', caption: "Pause, laugh, start again.", subline: "Take your time. Say it however it comes.", scheme: 'dark' },
] as const;

export const storeListing = {
  appName: brand.storeName,
  subtitle: brand.subtitle,
  promotionalText:
    "Tell your child about today in a minute. It stays in your words. Every change is marked, and your original recording is kept unchanged.",
  keywords: "diary,keepsake,newborn,toddler,child,parenting,audio,recorder,bedtime,mom,dad,private,talk,mama",
  description: `${brand.name} is the baby memory book you fill by talking.

Tell your child one thing about today. The first laugh, the long night, the song you made up in the car. It becomes a letter in your own words, with your voice kept beside it.

Years from now, your child can read it, and hear how you sounded when you said it.

IT STAYS IN YOUR WORDS
Your words are written down on your phone, and the app only fixes small slips, like an um, a repeat or a name spelled your way. It never adds a word. Every change is marked, and you can put any of them back. We never rewrite your words, shorten them or write for you. A word can be misheard, so have a quick read before you keep a letter. Letters you type stay as you typed them.

YOUR VOICE, KEPT
Every letter you speak keeps its recording, on your phone and in your iPhone's own backup if you use one. ${en.trust.voice}

READ TOGETHER AT BEDTIME
Open Read together and go through the book one letter at a time, oldest first. Listen to the letters you spoke, with the words on the screen. Typed letters are there too, ready to read aloud.

A MINUTE IS PLENTY
Some nights it is a sentence, some nights a long letter. Stuck for words? There is a question to begin with. If today was quiet, tap "Not much today" and that is enough. Nothing keeps score.

A BOOK THAT GROWS BY MONTH
Each letter goes into your child's month of age, so the book reads in order. Expecting? Start before the birth, in a part of the book called Before You. Twins or more each get their own book.

NAMES SPELLED YOUR WAY
Add the names and home words you use, like a nickname or the name of a stuffed rabbit, so we spell them your way.

PRIVATE BY DEFAULT
${en.trust.promise} There is no account to make, and your book stays on your phone. Keep any letter just for you, out of the book. Delete one and it waits in Recently deleted for 30 days, or erase it at once.

REMINDERS, ONLY IF YOU WANT THEM
Reminders are off until you turn them on. You pick the days and the time, and none comes after 9:30 at night.

TAKE IT WITH YOU
Export your book any time, for free: your letters, your recordings and a PDF of the book.

IN ENGLISH
This version writes down letters spoken in English. The speech model is a one-time download, on Wi-Fi unless you turn on cellular data, 575 MB on most iPhones and smaller on some, and you choose when it starts. Until it is ready, your recordings are kept and the words follow.

PLUS
Your first two letters are free, so you can see how it feels. To keep adding letters, choose Plus: $4.99 a month with the first month free, or $49.99 a year with the first 2 months free. The free months are for people new to Plus. One plan covers every child's book and works with Family Sharing. A new letter past the free two waits on your phone until you decide. Every letter you have kept stays yours to read, play and export, with or without Plus.

Payment is charged to your Apple Account. Plus renews automatically unless you turn off renewal at least 24 hours before the end of the current period. Manage or cancel any time in your Apple Account settings.

For parents of babies and young children, from the first weeks to the first years.

Terms of Use: ${brand.web.terms}
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
    "A family memory journal: parents speak or type short letters to their child. The app never rewrites what a person says. It makes only small marked fixes to the transcript (stray sounds, repeated words, a misheard name from the family's own word list, punctuation), and each fix can be put back. Version 1.0 keeps everything on the phone: there is no account to create and no server copy of letters. The birthday or due date a parent enters is used to file letters by month of age. This is not a health or medical service and gives no health advice.",
  /** Listed in Lifestyle, never Health and Fitness or Medical (D-004, guideline 5.1.1(ix) mitigation). */
  primaryCategory: 'Lifestyle',
  whatsNewV1:
    `This is the first version of ${brand.name}. Talk or type a letter to your child, keep your voice with it, read together at bedtime, and export your book any time.`,
  screenshots,
  screenshotCaptions: screenshots.map((s) => s.caption),
} as const;

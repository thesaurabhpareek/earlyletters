// TestFlight texts for testers (RA-16-01, docs/release/AUTOMATION.md section 5, S16; AF-11, B1-11, B2-20).
// The one place these words live: docs/release/TESTFLIGHT.md links here, and `what-to-test.mjs` and the testers
// workflow read them (RA-20-06, RA-20-07). The words go to Apple and to testers, not into the app, so like the emails
// they carry the public name from packages/brand in template literals and need no filling.
//
// The alpha (D-106, D-100):
// - Build 1, the `testflight` profile: servers off. For "Family" (internal) and "Friends" (external, after Beta App
//   Review). No sign-in, no sync, no sharing.
// - Build 2, the `preview` profile: servers on, against staging, for "Family" only until the R-17 sign-off. Sign-in,
//   letters sync, the co-parent invite. Recordings are not uploaded (backup off).
// Both builds use the `.preview` app record, separate from the App Store app, so letters do not move across.
//
// Every text asks testers never to put a child's name or a letter's words into feedback (B1-11, B2-20; AUTOMATION
// 2.7). No feedback address is typed here: TestFlight's own feedback goes to the address the founder sets in App Store
// Connect (a dedicated mailbox, AF-11), never to the support address.
//
// To check before build 1 [unverified, from memory]: that purchases in a TestFlight build are not charged, and that a
// screenshot taken in a TestFlight build offers to send it as feedback. RA-17-04 (S17) confirms the visibility line.

import { brand } from '@scribe/brand';

/** How to send feedback, and what never to put in it. */
const feedbackLine = `To send feedback, take a screenshot while you use ${brand.name} and share it as feedback, or open the TestFlight app and send it from there. Please never include your child's name or the words of a letter. If a screen shows them, describe it in words instead of sending a screenshot.`;

/** Who can read feedback (AUTOMATION 2.7: internal testers can read each other's feedback in App Store Connect). */
const visibilityLine = 'Other testers on the team can see feedback you send through TestFlight.';

const askLine = 'Tell us what felt confusing, slow or wrong, and what you were doing just before.';

const separateApp =
  'This test app is separate from the App Store version, so letters written here do not move across on their own. To keep a copy, use Settings, Export your book.';

const plusLine = 'After the first two letters, keeping another one asks for Plus. Purchases in TestFlight are not charged.';

const speechLine =
  'The first time you speak a letter, the app offers a one-time download on Wi-Fi so it can write down your words. Until it finishes, your recordings are kept and the words follow.';

export const testflightCopy = {
  /**
   * Beta App Description (App Store Connect, Test Information; required for external testing and read by Beta App
   * Review). It is the same for every build on the record, so it says only what both builds do.
   */
  betaAppDescription: [
    `${brand.name}, the baby memory book you fill by talking.`,
    'Tap the red circle and tell your child something about today. Your words are written down on your phone and kept as a letter, exactly as you said them, with the recording beside it. Small slips, like an um or a word said twice, are marked, and you can put any of them back.',
    'Letters gather in your child\'s book, month by month, to read and hear together for years. You can also type a letter, or tap "Not much today" on a quiet day.',
    'This is an early test. Some things will change, and some may not work yet.',
  ].join('\n\n'),

  feedbackLine,
  visibilityLine,

  /** "What to Test", one per build. */
  whatToTest: {
    build1: [
      `Thank you for trying ${brand.name} early. This build keeps everything on your phone: there is no sign-in and no sharing in it yet.`,
      [
        'Please try:',
        '- Setting up the book: your child\'s name, a birthday or due date, and how you sign your letters.',
        '- Speaking a letter, reading it back and keeping it.',
        '- Typing a letter.',
        '- The Book, a letter on its own page, and Read together.',
        '- Tapping "Not much today" on a quiet day.',
        '- Dark mode and larger text, if you use them.',
      ].join('\n'),
      speechLine,
      plusLine,
      separateApp,
      askLine,
      feedbackLine,
      visibilityLine,
    ].join('\n\n'),

    build2: [
      `This build of ${brand.name} adds signing in and sharing the book with your child's other parent.`,
      [
        'Please try:',
        '- Signing in with Apple, or with your email and a sign-in link or code.',
        '- Keeping a few letters, then signing out and back in on this phone. Every letter should still be there.',
        '- If you are two parents: invite the other parent from the Family tab, then each write a letter and look for both in the Book.',
        '- Anything from the first build, if you have time.',
      ].join('\n'),
      'Letters you add to the book sync through our test server, so they show on both parents\' phones. Recordings are not uploaded in this build: the other parent sees your words, and each recording plays only on the phone that made it.',
      plusLine,
      'This test app and its server are separate from the App Store version, so letters written here do not move across on their own. To keep a copy, use Settings, Export your book.',
      askLine,
      feedbackLine,
      visibilityLine,
    ].join('\n\n'),

    /** Added to a build that goes out before the speech files can download (TESTFLIGHT.md, "Without this, no words"). */
    withoutSpeech: 'Recording works in this build, but the words do not appear yet. Typed letters work as usual.',
  },

  /**
   * The founder's own invitation, sent with Apple's TestFlight email. Short, and it carries the same ask.
   * friendsServersOn is only for after the R-17 sign-off (D-100), when friends may have a servers-on build (B2-20).
   */
  invitation: {
    family: [
      `Would you try ${brand.name} early? It is the baby memory book you fill by talking: you tell your child something about the day, and it keeps your words and your voice as a letter.`,
      'Apple will email you an invitation to TestFlight. It is an early test, so some things will not work yet.',
      'When you send feedback, please never include your child\'s name or the words of a letter.',
      visibilityLine,
    ].join('\n\n'),
    friends: [
      `Would you try ${brand.name} early? It is the baby memory book you fill by talking: you tell your child something about the day, and it keeps your words and your voice as a letter.`,
      'Apple will email you an invitation to TestFlight. It is an early test, so some things will not work yet. This build keeps everything on your phone, with no sign-in.',
      'When you send feedback, please never include your child\'s name or the words of a letter.',
      visibilityLine,
    ].join('\n\n'),
    friendsServersOn: [
      `A new test build of ${brand.name} is ready for you. It adds signing in and sharing the book with your child's other parent.`,
      'It is still an early test. Letters you add to the book sync to our test server.',
      'When you send feedback, please never include your child\'s name or the words of a letter.',
      visibilityLine,
    ].join('\n\n'),
  },
} as const;

// TestFlight texts for testers (RA-16-01, docs/release/AUTOMATION.md section 5, S16; AF-11, B1-11, B2-20), aligned
// with S17's tester notice (RA-17-04, docs/legal/TESTFLIGHT_TESTERS.md on #195, sections 5.1 to 5.4).
// The one place these words live: docs/release/TESTFLIGHT.md links here, and `what-to-test.mjs` and the testers
// workflow read them (RA-20-06, RA-20-07). The words go to Apple and to testers, not into the app, so like the emails
// they carry the public name from packages/brand in template literals.
//
// The alpha (D-106, D-100; ALPHA_PLAN on #152):
// - Build 1, the `testflight` profile: servers off. For "Family" (internal) and "Friends" (external, after Beta App
//   Review). No account.
// - Build 2, the `preview` profile: servers on, against staging. Recording backup is not in the build (the build flag
//   EXPO_PUBLIC_BACKUP is off in eas.json, #145), so recordings are not uploaded. For "Family" only until the R-17
//   sign-off.
// Both builds use the `.preview` app record, separate from the App Store app, so letters do not move across.
//
// "What to Test" is set per build, not per group, and build 1 goes to both groups. So no What to Test offers in-app
// screenshot feedback (it is off for Friends, TESTFLIGHT_TESTERS 4.2): each one gives the email route and the line for
// each group. The screenshot route is only in the family invitation.
//
// {feedbackEmail} is the one placeholder: the dedicated feedback mailbox (AF-11), which the founder fills in when the
// text goes into App Store Connect, or the workflow fills from its variable. No address is typed here, and never the
// support address. Founder facts still open (TESTFLIGHT_TESTERS 5.2): what happens to the test server's letters when
// the alpha ends (the text uses S17's default: we say so before it closes, and Export keeps a copy), and whether build
// 2's recovery key is held the way Privacy Policy section 4 describes (if not, build 2 must say it uses a test key).

import { brand } from '@scribe/brand';

/** Replaced by the feedback mailbox's address before the text reaches Apple or a tester. */
const feedbackEmail = '{feedbackEmail}';

/** What TestFlight sends with feedback, what never to put in it, and how to stop (TESTFLIGHT_TESTERS 5.1, 5.4). */
const feedbackLine =
  "When you send feedback through TestFlight, Apple sends us your name, your email address and details about your phone, such as its model, iOS version, battery, free space, network type, language and time zone. A screenshot shows whatever is on your screen, so please pick a screen without your letters, and never put your child's name or your letters' words in what you write. You can stop testing at any time in TestFlight, and ask us to delete your feedback.";

/** Who can see feedback, one line per group (TESTFLIGHT_TESTERS 5.3; Friends with in-app feedback off, 4.2). */
const groupLines = {
  family:
    'Everyone on the testing team can see what you send through TestFlight, and the name and email address of every tester. The team is the founder and the family members who test.',
  friends: `Sending feedback from inside the app is off for this group, so please email it to ${feedbackEmail}. Only the founder reads it. The founder's family members who test the app can see your name and email address in Apple's list of testers.`,
};

/** The short ask, for the invitations. */
const askShort = "Please never put your child's name or your letters' words in feedback.";

const howToEmail = `Tell us what felt confusing, slow or wrong, and what you were doing just before. To send feedback, open the TestFlight app and send it by email, or write to ${feedbackEmail}. Only the founder reads that mailbox.`;

/** The end of every What to Test: how, what is sent, and who sees it, for whichever group the reader is in. */
const feedbackBlock = [
  howToEmail,
  feedbackLine,
  `If you are testing as family: ${groupLines.family}`,
  `If you were invited as a friend: ${groupLines.friends}`,
].join('\n\n');

const plusLine = 'After the first two letters, keeping another one asks for Plus. Purchases in this test cost nothing.';

// The ask comes at the end of first run, and again in Review while words are waiting if the person chose "Not now"
// (speechConsentCopy, features/speech.en.ts).
const speechLine =
  'At the end of setting up, the app offers a one-time download on Wi-Fi so it can write down your words. If you tap "Not now", it asks again when words are waiting. Until the download finishes, your recordings are kept and the words follow.';

const pleaseTryCore = [
  "- Setting up the book: your child's name, a birthday or due date, and how you sign your letters.",
  '- Speaking a letter, reading it back and keeping it.',
  '- Typing a letter.',
  '- The Book, a letter on its own page, and Read together.',
  '- Tapping "Not much today" on a quiet day.',
  '- Dark mode and larger text, if you use them.',
];

const describeApp = `It is the baby memory book you fill by talking: you tell your child something about the day, and it keeps your words and your voice as a letter.`;
const earlyTest = 'It is an early test version, so it can make mistakes, and it will change. You must be 18 or older to take part.';

export const testflightCopy = {
  /** The placeholder in the texts below, for the workflow or the founder to replace with the feedback mailbox. */
  feedbackEmailPlaceholder: feedbackEmail,

  /**
   * Beta App Description (App Store Connect, Test Information; required for external testing, shown in the TestFlight
   * invitation, read by Beta App Review). The same for every build on the record, so it says only what both builds do.
   */
  betaAppDescription: [
    `${brand.name}, the baby memory book you fill by talking.`,
    'Tap the red circle and tell your child something about today. Your words are written down on your phone and kept as a letter, exactly as you said them, with the recording beside it. Small slips, like an um or a word said twice, are marked, and you can put any of them back.',
    'Letters gather in your child\'s book, month by month, to read and hear together for years. You can also type a letter, or tap "Not much today" on a quiet day.',
    'This is an early test version for a small group of family and friends. It can make mistakes, and it will change. You must be 18 or older to take part. Purchases in this test cost nothing.',
  ].join('\n\n'),

  feedbackLine,
  /** Replaces the single "other testers on the team" line (TESTFLIGHT_TESTERS section 6). */
  groupLines,

  /** "What to Test", one per build. Each works for every group that can receive that build. */
  whatToTest: {
    build1: [
      `Thank you for testing ${brand.name}. This build has no account: your letters stay on this phone. Feedback you send leaves the phone, and so can a crash report if the app crashes.`,
      ['Please try:', ...pleaseTryCore].join('\n'),
      speechLine,
      plusLine,
      'This test app is separate from the App Store version, so letters written here do not move across on their own. To keep a copy, use Settings, Export your book.',
      feedbackBlock,
    ].join('\n\n'),

    build2: [
      `Thank you for testing ${brand.name}. This build can sync. If you sign in, your letters and your child's details are stored on our test server, so they reach your other phone and your child's other parent. The Privacy Policy and Terms you agree to in the app apply to this test. Recordings are not uploaded in this test.`,
      [
        'Please try:',
        '- Signing in with Apple, or with your email and a sign-in link or code.',
        '- Keeping a few letters, then signing out and back in on this phone. Every letter should still be there.',
        '- If you are two parents: invite the other parent from the Family tab, then each write a letter and look for both in the Book.',
        '- Anything from the first build, if you have time.',
      ].join('\n'),
      'The other parent sees your words. Your recordings are not shared with them in this test.',
      plusLine,
      'This test app and its server are separate from the App Store version, so letters written here do not move across on their own. We will tell you before the test server is closed. To keep a copy of your book, use Settings, Export your book, now and then. To delete your account and its letters, use Settings, Delete account.',
      'Feedback you send leaves the phone, and so can a crash report if the app crashes.',
      feedbackBlock,
    ].join('\n\n'),

    /** Added to a build that goes out before the speech files can download (TESTFLIGHT.md, "Without this, no words"). */
    withoutSpeech: 'Recording works in this build, but the words do not appear yet. Typed letters work as usual.',
  },

  /**
   * The founder's own invitation, sent with Apple's TestFlight email. friendsServersOn is only for after the R-17
   * sign-off (D-100), when friends may have a servers-on build (B2-20).
   */
  invitation: {
    family: [
      `Would you help test ${brand.name}? ${describeApp}`,
      `Apple will email you an invitation to TestFlight. ${earlyTest}`,
      `To send feedback, take a screenshot while you use ${brand.name} and share it as feedback, or open the TestFlight app and send it from there. A screenshot shows whatever is on your screen, so please pick a screen without your letters. ${askShort}`,
      groupLines.family,
    ].join('\n\n'),
    friends: [
      `Would you help test ${brand.name}? ${describeApp}`,
      `Apple will email you an invitation to TestFlight. ${earlyTest} This build has no account: your letters stay on your phone.`,
      askShort,
      groupLines.friends,
    ].join('\n\n'),
    friendsServersOn: [
      `A new test build of ${brand.name} is ready for you. It adds signing in and sharing the book with your child's other parent.`,
      `${earlyTest} If you sign in, your letters and your child's details are stored on our test server.`,
      askShort,
      groupLines.friends,
    ].join('\n\n'),
  },
} as const;

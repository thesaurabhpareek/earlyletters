// First run and sign-in words (docs/design/specs/FIRST-RUN-WORDS-10nov.md, DRAFT; journey spec PR #776).
// NEW strings only. Wherever an existing line says the right thing it is reused from authCopy, appLockCopy or
// familyCopy and is not repeated here. Lives under `features.firstRun`, a path the claims scanner
// (test/claims-capabilities.test.ts) does not read, so the sign-in lines below do not become new false claims
// while the production profile has servers off. test/first-run.test.ts pins every key.
//
// COUNSEL-READ (counsel and the founder read these exact words before they ship; not cleared): story.exact.v3
// (stories.en.ts), auth.body, auth.privacy, auth.emailAlreadyUsed, auth.accountDeleted.
// SERVERS-ON: auth.body and auth.privacy are true only when EXPO_PUBLIC_SERVER_FEATURES is on.
// UNVERIFIED (Apple or server behaviour, not re-read): lock.tryAgain, lock.lockedOut, auth.codeExpired,
// auth.emailAlreadyUsed, auth.accountDeleted.
// HELD, not written: the region-blocked line (no region check exists in the repo).
//
// A new person has no letters yet, so none of these lines says "Your letters are safe". The existing errors keep
// that line for people who have letters. One verb everywhere: "sign in" (BRAND.md glossary, LNG-13).
export const firstRunCopy = {
  story: {
    // Glossary row: "Skip" is the intro's button only; the quiet-day action is still "Not much today".
    skipButton: 'Skip',
    nextButton: 'Next',
    // The journey spec's word (PR #776). The last card leads to the sign-in screen.
    startButton: 'Get started',
    // Spoken labels. The position phrase is contentBlocksCopy.storyPositionA11y ("Story {n} of {count}.").
    backA11y: 'Previous card',
    skipA11y: 'Skip the introduction',
    nextA11y: 'Next card',
  },

  auth: {
    title: 'Start your book',
    // Journey Option A (FIRST-RUN-AND-SIGN-IN-JOURNEY section 2.4, founder: "log in or sign up"): the Welcome heading names
    // creating and signing in, because they are one flow. Added by the tier A mobile PR; COUNSEL-READ not needed (no promise).
    // The words doc prefers `title` above and one verb; the founder picks. The Welcome reads this key, so swapping needs no code.
    titleBoth: 'Create your account or sign in',
    // SERVERS-ON, COUNSEL-READ: true of sync, which production has off until eas.json flips.
    body: 'Sign in once and your letters come with you to a new phone.',
    // One path in the code (shouldCreateUser), so one set of buttons and no "sign up" door.
    newOrBack: 'New here or back again, the steps are the same. Use the same way as last time.',
    // The accessibility label when Apple's own system button is drawn.
    appleButton: 'Sign in with Apple',
    // SERVERS-ON, COUNSEL-READ: a candidate to replace en.trust.signIn.privacy ("the people you invite") while
    // co-parent is "coming soon". Not wired until counsel agrees.
    privacy: 'You choose what goes in the book. Never sold, never used for ads.',

    codeExpired: "That code didn't match or has expired. Send a new email for a fresh one.",
    codePaused: 'Too many tries for now. You can try a code again in 15 minutes.',
    offline: 'No connection right now. Connect to the internet and try again.',
    didNotFinish: 'That sign-in did not finish. Try again, or try another way.',
    invalidEmail: "That email doesn't look quite right.",
    waitAMoment: 'Too many tries for now. Wait a few minutes, then try again.',
    notAvailable: "This way of signing in isn't available right now. Try another way.",
    // COUNSEL-READ, UNVERIFIED that the server returns this case. Pair with authCopy.sheet.lastMethod.
    emailAlreadyUsed: 'That email already has a book. Sign in the way you did last time.',
    // COUNSEL-READ, UNVERIFIED how Apple and Google behave after deletion.
    accountDeleted: 'That account was deleted. You can start a new book any time.',
    unknown: 'That did not go through. Try again in a moment.',
  },

  lock: {
    // UNVERIFIED that iOS offers the passcode fallback in this flow; say "passcode" only if the fallback is on.
    tryAgain: "Face ID didn't match. Try again, or use your iPhone passcode.",
    lockedOut: 'Face ID is paused for now. Your iPhone passcode opens the book.',
    // No line after a Cancel on the system sheet: only Unlock asks again. A nag there reads as pressure.
  },
} as const;

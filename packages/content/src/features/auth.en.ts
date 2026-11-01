// Moved from apps/mobile/src/lib/auth/copy.ts on 3 Oct 2026; that file now re-exports this one.
import { en } from '../strings.en';

/** errors.network's first sentence, also said under the code field while the email is on its way (S54, P8a critics S2). */
const lettersSafe = 'Your letters are safe on this phone.';

/**
 * Words for sign-in, consent and the Account screen (PRD A sections 7 and 9,
 * PRD B, BRIEF decisions 4 and 11), as EXPERIENCE_PASS_2026-10 chapter 7 sets
 * them (S52 to S56, package P8a). test/rules.test.ts runs the content rules on
 * this file, and chapter 7's own, from the `authCopy` row of
 * test/support/copy-surfaces.ts: no "we" outside the registered disclosure keys,
 * buttons of 22 characters or fewer, the placeholders below. test/server-surfaces-auth.test.ts
 * pins every changed and new line word for word. Registered text
 * (docs/legal/in-app-disclosures.md) is counsel's and changes only through counsel.
 * Placeholders: {child}, {app}, {email}. The public name is never typed here.
 */
export const authCopy = {
  sheet: {
    titles: {
      first_letter: "Keep {child}'s book on any phone",
      // A book has at most two parents in v1.0, so "the book", not "the family book".
      invite: 'Sign in to join the book',
      invite_create: 'Sign in to invite a co-parent',
      sign_in: 'Welcome back',
      settings: 'Sign in',
    },
    bodies: {
      // What is true, in one sentence; never "sign in so". account.signedOutBody says the same, word for word.
      first_letter: "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
      invite: 'You each write from your own phone, in the same book.',
      invite_create: 'You both sign in, each on your own phone.',
      // Kept: it prevents a second account (PRD A F4).
      sign_in: 'Sign in the same way as last time to see every letter.',
      settings: "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
    },
    // BRAND.md glossary, Sign-in buttons: the same words the emails tell people to tap (LNG-13).
    google: 'Sign in with Google',
    email: 'Sign in with email',
    passkey: 'Use a passkey',
    later: 'Not now',
    // Registered (in-app-disclosures.md 3a): word for word. Counsel's proposed line is C6.
    privacy: en.trust.signIn.privacy,
    why: en.trust.signIn.why,
    emailUse: en.trust.signIn.email,
    lastMethod: {
      apple: 'Last time you used Apple.',
      google: 'Last time you used Google.',
      email: 'Last time you used email.',
      passkey: 'Last time you used a passkey.',
    },
    // The kill path only (a build with no project settings).
    notConfigured: 'Signing in is not available right now. Your letters are safe on this phone.',
    busy: 'Signing you in',
  },

  email: {
    title: 'Sign in with email',
    label: 'Email',
    placeholder: 'you@example.com',
    help: 'A link and a code arrive by email. No password to remember.',
    send: 'Send link',
  },

  code: {
    title: 'Check your email',
    // {email}: the address the email went to, shown in `text`, the rest of the line in `textMuted`.
    sentToEmail: 'A link and a code are on their way to {email}.',
    body: 'Tap the link on this phone, or type the code here.',
    // Shown only when the app restarted between sending and typing the code (the address is never stored).
    emailLabel: 'Your email address',
    label: 'Code',
    verify: 'Continue',
    openMail: 'Open Mail',
    resend: 'Send a new email',
    resendWait: 'You can send another in a minute.',
    resent: 'A new email is on its way.',
    differentEmail: 'Use a different email',
    /** Under the code field while waiting for the email: errors.network's first sentence, the same words (P8a critics S2). */
    lettersSafe,
    /**
     * With `errors.code_paused`, in the same line, while the pause after five wrong codes holds (P8a critics S1, F02-U14):
     * only typing a code is paused; the newest email's link still signs in (as `errors.wrong_code` says, the newest
     * email is the one that counts), and so do Apple and Google. Calm facts, no count of minutes left.
     */
    // Names no provider: a build may offer neither Apple nor Google (SIGN-01, BL-475 point 3).
    pausedOtherWays: 'The link in the newest email still works, and so do the other ways to sign in.',
  },

  verify: {
    title: 'Signing you in',
    // Heading over the two refusals (F02-U11 `errors.other_phone`, F02-U27 `errors.already_signed_in`): nothing is signing in.
    refusedTitle: "This link can't be used here",
    typeCode: 'Type the code instead',
    newEmail: 'Send a new email',
    close: 'Close',
  },

  /**
   * Before this phone's letters join an account (BL-347, F02 6.2 step 6,
   * F02-REQ-019). {email} is the account address, masked ("a***@example.com").
   */
  claim: {
    title: 'Keep your letters in this account?',
    body: 'Your letters on this phone will be kept in the account {email}.',
    noEmail: 'Your letters on this phone will be kept in the account you just signed in to.',
    help: "If this isn't your account, choose Not my account. Nothing on this phone changes.",
    // BL-488: 'Keep them here' read as this phone; the choice is this account. Names it, 20 characters (a button may have 22).
    keep: 'Keep in this account',
    notMine: 'Not my account',
    waiting: 'Finish setting up to choose where your letters are kept.',
  },

  errors: {
    // As the S52 table in docs/design/EXPERIENCE_PASS_2026-10.md words them (amended 28 Oct, #360): service- or
    // network-caused errors say the letters are safe first (VOICE, the Error row); input errors (wrong_code,
    // expired, invalid_email) keep their words; unknown says it second.
    network: `${lettersSafe} Sign in once you are back online.`,
    expired: 'That link has expired. Send a new email for a fresh one.',
    wrong_code: "That code didn't match. Check the newest email, or send a new one.",
    code_paused: 'Your letters are safe. You can try a code again in 15 minutes.',
    // SIGN-01. A 429 has more than one cause (the per-address wait between emails, the project's hourly email cap, the
    // per-IP verify limit), and the app cannot tell them apart from the answer, so neither line names a length it cannot
    // know, and neither names a provider the build may not offer. `email_wait`: a 429 while sending an email.
    // `rate_limited`: a 429 anywhere else (checking a code or a link), where no email was being sent.
    email_wait: "Your letters are safe. Another email can't be sent just yet. Wait a few minutes, then try again.",
    rate_limited: 'Your letters are safe. Too many tries for now. Wait a few minutes, then try again.',
    invalid_email: "That email doesn't look quite right.",
    not_available: "Your letters are safe. This way of signing in isn't available right now. Try another way.",
    provider: 'Your letters are safe. That sign-in did not finish. Try again, or try another way.',
    session_expired: 'Your letters are safe on this phone. Sign in again to keep sharing them.',
    under_18: '{app} is currently for adults 18 and over.',
    consent_unavailable: 'Your letters are safe on this phone. Setting up your account did not finish. Try again.',
    unknown: 'That did not go through. Your letters are safe on this phone.',
    // BL-347: F02-U11 (`auth.link.otherDevice`) and F02-U27, worded as the spec gives them.
    other_phone: 'Type the code from the email on this phone instead.',
    // SIGN-06: the same refusal, reached after the link was already checked with the server (verify started), so the
    // email's code may be spent too. Points to a new email, which always works, instead of the code.
    other_phone_spent: 'This link was opened on a different phone. Send a new email, then use the link or code from it.',
    // Any account, this one included. Sign-out drops this phone's pending request, so the same link
    // never works after it; the code from the email does.
    already_signed_in: "You're already signed in on this phone. To use another account, sign out, then type the code from the email.",
  },

  consent: {
    settingUp: 'Setting up your account',
    terms: {
      title: 'Before your book syncs',
      body: 'Your letters stay private to you and the family you invite. We never sell them, use them for ads or use them to train machine learning models.',
      agreeLine: 'By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.',
      termsLink: 'Terms of Service',
      privacyLink: 'Privacy Policy',
      agree: 'Agree and continue',
      notNow: 'Not now',
    },
    // The age step is the gate's own question (S01): the question as the title, Yes and No as
    // pills, and common.continueButton. No explanatory line (LEGAL-REQ-002: presented neutrally).
    age: {
      body: 'Are you 18 or older?',
      yes: 'Yes',
      no: 'No',
    },
    childFallback: 'your child',
    noBook: {
      title: 'No book here yet',
      body: 'Did you use a different way to sign in last time?',
      tryAnother: 'Try another way',
      startBook: 'Start a book',
    },
  },

  account: {
    title: 'Account',
    signedOutTitle: 'Not signed in',
    // S52's body, word for word.
    signedOutBody: "Your letters come with you to a new phone, and {child}'s other parent can write in the same book.",
    signIn: 'Sign in',
    signedInWith: {
      apple: 'Signed in with Apple',
      google: 'Signed in with Google',
      email: 'Signed in with email',
      other: 'Signed in',
    },
    syncTitle: 'Sync',
    syncLabel: 'Sync and sharing',
    sync: {
      on: 'On',
      off: 'Off, kept on this phone',
      waiting: 'Not set up yet',
      unknown: 'Waiting for a connection',
    },
    // BL-488: AccountGate's branch for a phone that IS signed in but whose account settings could not be read at launch
    // (invite, join and leave sheets). That is any failed read, not only a missing connection: offline, a server error or
    // the 10 second timeout (session-provider.tsx GATE_TIMEOUT_MS), so the line never says the phone is offline or asks
    // for it to be back online. Names the connection, never the sign-in: errors.network ends "Sign in once you are back
    // online", which is for a person who is signed out. Says nothing about where the letters are (BL-475 point 1).
    gateOffline: "You're signed in. This needs a connection. Try again in a moment.",
    finishSetup: 'Finish setting up',
    passkeysTitle: 'Passkeys',
    passkeysHelp: 'Sign in next time with Face ID or Touch ID, on this phone or your other Apple devices.',
    addPasskey: 'Add a passkey',
    passkeyAdded: 'Passkey added.',
    passkeyFallbackName: 'Passkey',
    removePasskey: 'Remove',
    removePasskeyTitle: 'Remove this passkey?',
    removePasskeyBody: 'You can still sign in another way.',
    devicesTitle: 'Devices',
    signOutOthers: 'Sign out other devices',
    signOutOthersHelp: 'Other phones signed in to this account will need to sign in again.',
    signOutOthersDone: 'Other devices are signed out.',
    signOut: 'Sign out',
    signOutTitle: 'Sign out on this phone?',
    // True: signing out leaves this phone's letters in place (one of the three keys allowed to say so).
    signOutBody: 'Your letters stay on this phone. Sign in again any time.',
    // Shown while the outbox drains (F16, A-REQ-033): sign-out never drops a queued letter.
    signOutWaiting: 'Your newest letters are still on their way. This phone signs out once they are sent.',
    // BL-451: while that wait runs, for a sign-out the person asked for: back to signed in, nothing deleted or sent.
    staySignedIn: 'Stay signed in',
    // BL-451: on the signed-out page when the wait ended before they were sent (sync turned off, or the session lost).
    signOutEarly: 'Your newest letters are kept on this phone. They are sent the next time you sign in to this account.',
    cancel: 'Cancel',
  },
} as const;

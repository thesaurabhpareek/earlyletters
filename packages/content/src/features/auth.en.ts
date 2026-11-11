// Moved from apps/mobile/src/lib/auth/copy.ts on 3 Oct 2026; that file now re-exports this one.
import { en } from '../strings.en';

/**
 * Said under the code field while the email is on its way (S54, P8a critics S2), and only where this phone holds a book:
 * the code screen draws it only when a book exists (`useChildren().active`). It is NOT in any error line, because an error
 * is also read on a fresh install or a restored phone, where there are no letters here to be "still" anywhere.
 * Build 12: it says where the letters are, not that they are "safe" (VOICE.md, "safe"): there is no recording backup, so
 * a promise of safety is one the build does not make. The key keeps its name (`code.lettersSafe`) so the screen is untouched.
 */
const lettersSafe = 'Your letters are still on this phone.';

/**
 * Registered (docs/legal/in-app-disclosures.md): the agreement line, word for word. The consent screen (`consent.terms.agreeLine`)
 * and the Welcome (`sheet.agreeLine`, NX-36 S2) say the same sentence, so it is typed once and neither can drift from the other.
 */
const agreeLine = 'By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.';

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
      // Build 12: the words of a letter sync to the account; recordings stay on the phone that made them (no backup).
      first_letter: "Keep {child}'s words on any phone",
      // Build 12 hides co-parent surfaces (BL-604, D-126), so these two name no book, no invite and no co-parent.
      invite: 'Sign in',
      invite_create: 'Sign in',
      sign_in: 'Welcome back',
      settings: 'Sign in',
    },
    bodies: {
      // What is true, in two short sentences; never "sign in so". account.signedOutBody says the same, word for word.
      first_letter: 'The words of your letters come with you to a new phone. Recordings are kept on the phone that made them.',
      invite: 'Sign in on this phone to carry on.',
      invite_create: 'Sign in on this phone to carry on.',
      // Kept: it prevents a second account (PRD A F4).
      sign_in: 'Sign in the same way as last time to see every letter.',
      settings: 'The words of your letters come with you to a new phone. Recordings are kept on the phone that made them.',
      // NX-36 S2: the Welcome line under the subtitle.
      // Build 12 (red-team): claims nothing about phones, recordings or where letters go; a sign-in does not move anything
      // before the person has agreed. TODO(founder, counsel): approve this line or replace it (placeholder, needs word approval).
      sign_in_first: 'Sign in to begin your book.',
    },
    // NX-36 S2, above the two buttons. The two documents follow it as their own 44 pt links (labels: consent.terms.termsLink and .privacyLink).
    agreeLine,
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
    notConfigured: 'Signing in is not available right now. Nothing on this phone has changed.',
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
    /** Under the code field while waiting for the email, drawn only when a book is on this phone (P8a critics S2). */
    lettersSafe,
    /**
     * With `errors.code_paused`, in the same line, while the pause after five wrong codes holds (P8a critics S1, F02-U14):
     * only typing a code is paused; the newest email's link still signs in (as `errors.wrong_code` says, the newest
     * email is the one that counts), and so do Apple and Google. Calm facts, no count of minutes left.
     */
    // Names no provider: a build may offer neither Apple nor Google (SIGN-01, BL-475 point 3).
    pausedOtherWays: 'The link in the newest email still works, and so do the other ways to sign in.',
    // NX-36 S5, the recovery set after a minute (NX-31-R11). Placeholder words; each needs founder word approval.
    noMailHelp: 'Nothing yet? Look in spam, or send a new email.',
    announceResend: 'You can send another email.',
  },

  /**
   * Account-first first run (NX-36 S2 and S3), behind the server-features switch. The key names are NX-36's own and the
   * words are placeholders: each needs founder word approval (the PR body lists them). The Apple button is Apple's
   * (ASAuthorizationAppleIDButton, "Sign in with Apple"). No line here says a recording is kept safe or backed up, or
   * says where the book opens. Without "Your letters are safe": a brand-new install has no letters (NX-36 2.6).
   * Only the one failure that stays on the Welcome has a first-run line. A 429, "not available" and a lost connection
   * go to the outage screen through the gate, so they have none here (they used to; nothing could reach them).
   */
  firstRun: {
    errors: {
      provider: 'That sign-in did not finish. Try again, or try another way.',
    },
  },
  // S3, sign-in cannot be reached. The button is the 22-character form; its sentence is the note, and it shows only where
  // the button does. The body says one thing, so the shown paragraph (body, then note) repeats nothing.
  outage: {
    // Differs from NX-36 ("We can't reach sign-in right now."): the content rules allow no "we" outside registered lines.
    title: 'Sign-in cannot be reached right now.',
    // Differs from NX-36 (which also named the local start here, and so said it when the button was not there).
    body: 'Try again in a moment.',
    retry: 'Try again',
    startLocal: 'Start on this phone',
    startLocalNote: 'Start the book on this phone for now. You can sign in later and choose to keep your letters in your account.',
    // Announcement only, when the connection comes back under the outage screen.
    backOnline: 'You are back online.',
  },
  offline: {
    title: 'Sign-in needs a connection.',
    // Differs from NX-36 ("We will try again when you are back online."): no "we", and the screen does not try to sign
    // anyone in by itself. It reads the connection when Try again is tapped, and it goes back to sign in on its own when
    // the connection returns, so the line says what the person does.
    body: 'Connect to the internet, then tap Try again.',
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
    // Account-first slice 4a (exec council 9 Nov 2026, D; RW-21, RW-23, RW-27). Shown when the account already has a book
    // and this phone holds a book or letters: "Keep in this account" adds the phone's book as a second book. Nothing is
    // merged or deleted, and the recordings stay on the phone. Each says where letters go, so counsel reads it, and each
    // needs founder word approval.
    bodyHasBook: 'This account already has a book. The book on this phone will be added to it as a second book. Nothing is deleted.',
    recordingsNote: 'The recordings are kept on this phone.',
    keepHint: 'Adds the book on this phone to this account as a second book. Nothing is deleted.',
  },

  errors: {
    // As the S52 table in docs/design/EXPERIENCE_PASS_2026-10.md words them (amended 28 Oct, #360): service- or
    // network-caused errors say nothing has changed first (VOICE, the Error row); input errors (wrong_code,
    // expired, invalid_email) keep their words; unknown says it second.
    network: 'Nothing has changed. Sign in once you are back online.',
    expired: 'That link has expired. Send a new email for a fresh one.',
    wrong_code: "That code didn't match. Check the newest email, or send a new one.",
    code_paused: 'Nothing has changed. You can try a code again in 15 minutes.',
    // SIGN-01. A 429 has more than one cause (the per-address wait between emails, the project's hourly email cap, the
    // per-IP verify limit), and the app cannot tell them apart from the answer, so neither line names a length it cannot
    // know, and neither names a provider the build may not offer. `email_wait`: a 429 while sending an email.
    // `rate_limited`: a 429 anywhere else (checking a code or a link), where no email was being sent.
    email_wait: "Nothing has changed. Another email can't be sent just yet. Wait a few minutes, then try again.",
    rate_limited: 'Nothing has changed. Too many tries for now. Wait a few minutes, then try again.',
    invalid_email: "That email doesn't look quite right.",
    not_available: "Nothing has changed. This way of signing in isn't available right now. Try another way.",
    provider: 'Nothing has changed. That sign-in did not finish. Try again, or try another way.',
    session_expired: 'You were signed out. Sign in again to carry on.',
    under_18: '{app} is currently for adults 18 and over.',
    consent_unavailable: 'Setting up your account did not finish. Try again.',
    unknown: 'That did not go through. Nothing has changed.',
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
      agreeLine,
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
    // `sheet.bodies.first_letter`, word for word (Build 12: no co-parent, recordings stay on the phone).
    signedOutBody: 'The words of your letters come with you to a new phone. Recordings are kept on the phone that made them.',
    signIn: 'Sign in',
    signedInWith: {
      apple: 'Signed in with Apple',
      google: 'Signed in with Google',
      email: 'Signed in with email',
      other: 'Signed in',
    },
    syncTitle: 'Sync',
    syncLabel: 'Sync across your phones',
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

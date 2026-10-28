// Moved from apps/mobile/src/lib/auth/copy.ts on 3 Oct 2026; that file now re-exports this one.
import { en } from '../strings.en';

/**
 * Words for sign-in, consent and the Account screen (PRD A sections 7 and 9,
 * PRD B, BRIEF decisions 4 and 11), as EXPERIENCE_PASS_2026-10 chapter 7 sets
 * them (S52 to S56, package P8a). The content rules test scans this file, and
 * test/server-surfaces-auth.test.ts pins chapter 7's rules on it: no "we" outside
 * the registered disclosure keys, buttons of 22 characters or fewer, and every
 * changed and new line word for word. Registered text (docs/legal/in-app-disclosures.md)
 * is counsel's and changes only through counsel.
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
    google: 'Continue with Google',
    email: 'Continue with email',
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
    title: 'Continue with email',
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
    keep: 'Keep them here',
    notMine: 'Not my account',
    waiting: 'Finish setting up to choose where your letters are kept.',
  },

  errors: {
    // After an offline or failed attempt the reassurance comes first (VOICE, the Error row).
    network: 'Your letters are safe on this phone. Sign in once you are back online.',
    expired: 'That link has expired. Send a new email for a fresh one.',
    wrong_code: "That code didn't match. Check the newest email, or send a new one.",
    code_paused: 'You can try a code again in 15 minutes.',
    rate_limited: 'Sign-in emails are paused for an hour. Use Apple or Google, or try again later.',
    invalid_email: "That email doesn't look quite right.",
    not_available: "This way of signing in isn't available right now. Try another way.",
    provider: 'That did not work this time. Try again, or try another way.',
    session_expired: 'Your letters are safe on this phone. Sign in again to keep sharing them.',
    under_18: '{app} is currently for adults 18 and over.',
    consent_unavailable: 'Your letters are safe on this phone. Setting up your account did not finish. Try again.',
    unknown: 'That did not work this time. Your letters are safe on this phone.',
    // BL-347: F02-U11 (`auth.link.otherDevice`) and F02-U27, worded as the spec gives them.
    other_phone: 'Type the code from the email on this phone instead.',
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
      healthLink: 'Consumer Health Data Privacy Policy',
      agree: 'Agree and continue',
      notNow: 'Not now',
    },
    age: {
      title: 'One quick question',
      body: 'Are you 18 or older?',
      help: 'We ask everyone the same question.',
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
    signedOutBody: 'Sign in so your co-parent can write too, and so your letters come with you to a new phone. Your letters are safe on this phone either way.',
    signIn: 'Sign in',
    signedInWith: {
      apple: 'Signed in with Apple',
      google: 'Signed in with Google',
      email: 'Signed in with email',
      other: 'Signed in',
    },
    syncTitle: 'Sync',
    syncLabel: 'Sync and family sharing',
    sync: {
      on: 'On',
      off: 'Off, kept on this phone',
      waiting: 'Waiting for your answer',
      unknown: 'Waiting for a connection',
    },
    finishSetup: 'Finish setting up',
    passkeysTitle: 'Passkeys',
    passkeysHelp: 'Sign in next time with Face ID or Touch ID, on this phone or your other Apple devices.',
    addPasskey: 'Add a passkey',
    passkeyAdded: 'Passkey added.',
    passkeyFallbackName: 'Passkey',
    removePasskey: 'Remove',
    removePasskeyTitle: 'Remove this passkey?',
    removePasskeyBody: 'You can still sign in with Apple, Google or email.',
    devicesTitle: 'Devices',
    signOutOthers: 'Sign out of other devices',
    signOutOthersHelp: 'Other phones signed in to this account will need to sign in again.',
    signOutOthersDone: 'Other devices are signed out.',
    signOut: 'Sign out',
    signOutTitle: 'Sign out on this phone?',
    signOutBody: 'Your letters stay on this phone. Sign in again any time to sync.',
    signOutWaiting: 'Your newest letters are still syncing. We will sign you out as soon as they are done.',
    cancel: 'Cancel',
  },
} as const;

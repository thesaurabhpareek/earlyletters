// Moved from apps/mobile/src/lib/auth/copy.ts on 3 Oct 2026; that file now re-exports this one.
import { en } from '../strings.en';

/**
 * Words for sign-in, consent and the Account screen (PRD A sections 7 and 9,
 * PRD B, BRIEF decisions 4 and 11). Feature-local until the content agent
 * moves them into packages/content; the content rules test scans this file.
 * Placeholders: {child}, {app}. The public name is never typed here.
 */
export const authCopy = {
  sheet: {
    titles: {
      first_letter: "Keep {child}'s book on any phone",
      invite: 'Sign in to join the family book',
      invite_create: 'Sign in to invite a co-parent',
      sign_in: 'Welcome back',
      settings: 'Sign in',
    },
    bodies: {
      first_letter: 'Sign in so your co-parent can write too, and so your letters come with you to a new phone.',
      invite: 'Sign in so you can write to your child together, each from your own phone.',
      invite_create: 'Your co-parent joins from their own phone, so you both need an account.',
      sign_in: 'Sign in the same way as last time to see every letter.',
      settings: 'Sign in so your co-parent can write too, and so your letters come with you to a new phone.',
    },
    google: 'Continue with Google',
    email: 'Continue with email',
    passkey: 'Use a passkey',
    later: 'Not now',
    privacy: en.trust.signIn.privacy,
    why: en.trust.signIn.why,
    emailUse: en.trust.signIn.email,
    lastMethod: {
      apple: 'Last time you used Apple.',
      google: 'Last time you used Google.',
      email: 'Last time you used email.',
      passkey: 'Last time you used a passkey.',
    },
    notConfigured: 'Signing in is not available in this build yet. Your letters are safe on this phone.',
    busy: 'Signing you in',
  },

  email: {
    title: 'Continue with email',
    label: 'Email',
    placeholder: 'you@example.com',
    help: 'We will send you a link and a code. There is no password to remember.',
    send: 'Send link',
  },

  code: {
    title: 'Check your email',
    sentTo: 'We sent a link and a code to',
    body: 'Tap the link on this phone, or type the code here.',
    emailLabel: 'Which email did we send it to?',
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
    typeCode: 'Type the code instead',
    newEmail: 'Send a new email',
  },

  errors: {
    network: "You're offline. Your letters are saved on this phone. Sign in when you're back online.",
    expired: 'That link has expired. We can send a new one.',
    wrong_code: "That code didn't match. Check the newest email, or send a new one.",
    code_paused: "Let's take a short break. Try again in 15 minutes.",
    rate_limited: "That's a lot of emails for one hour. Try again a little later.",
    invalid_email: "That email doesn't look quite right.",
    not_available: "This way of signing in isn't available right now. Try another way.",
    provider: "That didn't work. Please try again, or try another way.",
    session_expired: 'Sign in again to keep your book in sync. Your letters are safe on this phone.',
    under_18: '{app} is currently for adults 18 and over.',
    consent_unavailable: "We couldn't finish setting up your account. Your letters are safe on this phone. Please try again.",
    unknown: 'Something went wrong. Your letters are safe on this phone. Please try again.',
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

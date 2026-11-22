// PROPOSED (E83, E-S34, docs/design/SCREEN-PATHS-20nov.md PATH-08). The words of the web confirm page that the
// "Not you?" link in the new-device sign-in email opens. The page does not exist in apps/web yet; nothing here is
// shown until it does, and the founder has not read these words. Placeholders: {device}, {when}.
//
// Shown: the device name and the time, and nothing else about the sign-in. Records: one account-security audit
// row when the button is pressed (security-architect decides the rest). Never: an action on page load, a sign-in
// code or password field, a letter or child name, a claim that the account is hacked or safe. Decline: "This was
// me", or closing the page, changes nothing and keeps the session.
// Same rules as every other word: no fear or guilt, no AI wording, and errors say "Nothing has changed" first.
export const newDevicePageCopy = {
  status: 'PROPOSED',

  // E78: HELD. The sender adds this line to the new-device sign-in email only once the one-session sign-out lever and
  // this page both exist. Until then it is shown to nobody; do not add it to emails/auth.en.ts before then.
  heldEmailLine: 'On that page you can choose to sign that device out. Nothing is signed out until you press the button.',

  // First view. Read only: the page itself never signs anything out.
  title: 'Was this you?',
  what: 'Your account was signed in on {device}, {when}.',
  readOnly: 'Opening this page has not changed anything.',
  signOutButton: 'Sign that device out',
  thisWasMe: 'This was me',
  signOutHelp: 'This signs out that one device. Your other devices stay signed in.',

  // After the button is pressed, while it works (polite live region).
  signingOut: 'Signing that device out',

  // Done.
  done: {
    title: 'That device is signed out',
    body: 'It will need a new sign-in code or link the next time it is used.',
    email: 'You sign in with a code or a link sent to your email, so it is also worth checking the security settings of your email account.',
  },

  // "This was me": a closing line and no further step.
  decline: {
    title: 'Thank you for checking',
    body: 'Nothing has changed, and there is nothing else to do. You can close this page.',
  },

  // The same in-app path, repeated on every end state.
  inAppPath: 'You can also do this in the app. Go to Me, then Account, then Sign out other devices.',

  // Not an error screen: calm lines with the in-app path beside them.
  states: {
    // No connection when the button is pressed; the button stays pressable.
    offline: 'Nothing has changed. Try again once you are back online.',
    // The sign-out did not go through on our side.
    failed: 'Nothing has changed. That device is still signed in.',
    // The link is too old, or has been used already.
    expired: 'This link is too old, or it has already been used.',
    // That session is already signed out.
    already: 'That device is already signed out.',
  },
} as const;

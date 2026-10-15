/**
 * Words for the BL-347 screens: a refused email link and the claim screen
 * (F02 6.2 step 6, F02-U11, F02-U27). Feature-local and temporary, like the
 * copy files the content owner moves into packages/content: requested to move
 * into `authCopy.link` and `authCopy.claim` in
 * packages/content/src/features/auth.en.ts (keys `auth.link.otherDevice`,
 * `auth.link.signedInOther`, `auth.claim.*`, new). Same content rules: no
 * dashes, curly quotes, ellipsis or emoji; the child is never gendered.
 * Placeholder: {email} is always a masked address (claim.logic maskEmail).
 */
export const linkCopy = {
  link: {
    title: 'Use the code instead',
    otherDevice: 'Type the code from the email on this phone instead.',
    signedInOther: "You're signed in as another account. Sign out first to use this link.",
  },
  claim: {
    title: 'Your letters on this phone',
    body: 'Your letters on this phone will be kept in the account {email}.',
    bodyNoEmail: 'Your letters on this phone will be kept in the account you just signed in to.',
    help: 'If that is not your account, nothing moves. Sign out and sign in the way you usually do.',
    keep: 'Keep them here',
    notMine: 'This is not my account',
  },
} as const;

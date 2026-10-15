/**
 * Recording backup words (PRD V2 F08 section 6.7; D-073, D-102; WP-F08-B5c).
 * Shown only in a build with `capabilities.backup` on. Draft for S16 and for
 * counsel, who approves every backup line before it ships (D-102, F08
 * section 6.7).
 *
 * What the copy may claim, and only that (D-102; F08 6.5 "What we can prove"):
 * recordings are encrypted on the phone before they leave it; we keep a
 * recovery key and use it only through our recovery service, which logs every
 * use and emails the owner each time; we never listen to recordings, sell them
 * or use them to train models; other family members cannot hear them yet.
 * Never: "only you can play them", "only your family's keys", "end-to-end",
 * an unscoped "every use is logged", fear or urgency (apps/mobile/test/backup-copy.test.ts).
 * No counting of what is left (VOICE.md, the no-guilt rule).
 */
export const backupCopy = {
  /** Settings row and screen title (`backup.title`). */
  title: 'Back up my recordings',
  rowOn: 'On',
  rowOff: 'Off',

  /** The turn-on sheet and its consent act (F08 6.5 A; F08-REQ-039). */
  sheetTitle: 'Back up your recordings',
  sheetBody:
    'Your recordings are encrypted on this phone before they leave it. We keep a recovery key so you can get them back on a new phone. We use it only through our recovery service, which logs every use and emails you each time. We never listen to your recordings, sell them or use them to train models.',
  sheetNotIncluded: "Other family members can't hear your recordings yet. Listening copies stay on this phone.",
  turnOnButton: 'Back up my recordings',
  signInFirst: 'Sign in to back up your recordings.',
  unavailable: 'Backup is not ready on this phone yet. Your recordings are kept here as always.',

  /** The quiet state under the switch. Never a count of what is left. */
  lastBackedUp: 'Backed up {date}',
  backingUp: 'Backing up',
  waitingWifi: 'Backs up on Wi-Fi',
  paused: 'Backup will carry on later.',
  quotaReached: "New recordings are not being backed up. Write to us and we'll help.",
  needsConsent: 'Backup is off. Turn it on again to keep backing up new recordings.',

  cellularTitle: 'Use mobile data',
  cellularHelp: 'When this is off, recordings back up on Wi-Fi.',

  /** Turning off (F08 6.5 D3). "Delete the backup" arrives with WP-F08-B5d. */
  offButton: 'Turn off backup',
  offTitle: 'Turn off backup?',
  offBody: "New recordings stop backing up. What's backed up stays, and can come back on a new phone.",
  offKeep: "Keep what's backed up",
  keepOn: 'Keep backup on',

  /** A new phone (F08 6.5 B; F08-U18, U19). */
  restoreLooking: 'Bringing your recordings to this phone.',
  restoreWaiting:
    "Your recordings will start coming back by {date}. We emailed you to check it's you. If you still have your old iPhone, open the app there to say yes sooner.",
  restoreUnavailable: 'Your recordings will come back when we can reach them.',
  restoreStopped: 'Bringing your recordings to this phone was stopped.',
  restoreSignInAgain: 'Sign in again to bring your recordings to this phone.',
  restoreTryAgain: 'Try again',
} as const;

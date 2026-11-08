/**
 * App lock words, verbatim from proposals/account-security/content.md sections 4.2 to 4.5 (content, 1 Nov 2026; every
 * string checked against packages/content/test/rules.test.ts, which also scans this file). Feature-local until
 * `content` moves them into packages/content/src/features/app-lock.en.ts (content.md section 9).
 *
 * Face ID, Touch ID and passcode each get their own variant (no `{method}` placeholder). `{child}` and `{app}` are the
 * only placeholders; `{app}` is filled from packages/brand by withBrandName.
 */
import { withBrandName } from '@/lib/copy';

const raw = {
  offer: {
    title: "A lock for {child}'s book",
    body: {
      faceId: 'Face ID or your iPhone passcode opens it. Anyone else who picks up your phone sees a cover.',
      touchId: 'Touch ID or your iPhone passcode opens it. Anyone else who picks up your phone sees a cover.',
      passcode: 'Your iPhone passcode opens it. Anyone else who picks up your phone sees a cover.',
    },
    turnOn: { faceId: 'Turn on Face ID', touchId: 'Turn on Touch ID', passcode: 'Turn on the lock' },
    notNow: 'Not now',
  },
  onToast: { faceId: 'Face ID lock is on.', touchId: 'Touch ID lock is on.', passcode: 'Passcode lock is on.' },
  offToast: 'The lock is off.',
  faceIdDenied: 'Face ID is off for {app} in iPhone Settings, so your passcode opens the book.',
  unlock: 'Unlock',
  unlockHint: { faceId: 'Opens the book with Face ID.', touchId: 'Opens the book with Touch ID.', passcode: 'Opens the book with your passcode.' },
  coverLabel: '{app}',
  unlockReason: 'Open your book',
  passcodeRemoved: 'The lock is off because this iPhone has no passcode. Set one to turn the lock on again.',
  pageTitle: 'App lock',
  toggle: { faceId: 'Lock with Face ID', touchId: 'Lock with Touch ID', passcode: 'Lock with passcode' },
  askAfter: 'Ask again after',
  grace: { immediately: 'Immediately', oneMinute: 'After 1 minute', fiveMinutes: 'After 5 minutes' },
  footer: 'When the lock is on, reminders never show a name.',
  recordingLine: 'The lock waits until a recording ends.',
  noPasscode: 'This iPhone has no passcode. Set one in iPhone Settings, then turn on the lock here.',
  openSettings: 'Open Settings',
  turnOnReason: 'Confirm it is you to turn on the lock',
  turnOffReason: 'Confirm it is you to turn off the lock',
  exportReason: 'Confirm it is you to export your book',
  settingsHome: { appLock: 'App lock', appLockOn: 'On', appLockOff: 'Off' },
} as const;

export const appLockCopy: typeof raw = withBrandName(raw);

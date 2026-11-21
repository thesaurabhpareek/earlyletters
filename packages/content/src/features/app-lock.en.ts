// PROPOSED (PATH-04, E-S22, docs/design/SCREEN-PATHS-20nov.md; written 21 Nov 2026, read by nobody yet).
// The one line of ours that sits above the App lock switch, before iOS asks for Face ID. It says only what is true:
// the iPhone does the checking, and the app is told yes or no (PERMISSIONS-AND-DISCLOSURE-MATRIX row 3; the app never
// holds a face, a template or a voiceprint). One variant per method, as the rest of the lock words do.
//
// The other App lock words (the offer, toasts, the Face ID off line, the passcode line) are still in
// apps/mobile/src/lib/app-lock/copy.ts and move here in a later PR (BRIEF coordination rule, standing duty 1).
// `{app}` is filled from packages/brand by the app. Never: biometric data, "secure", "safe", "protected".
export const appLockLines = {
  beforeSwitch: {
    faceId: 'Face ID or your iPhone passcode opens your book. {app} is only told yes or no.',
    touchId: 'Touch ID or your iPhone passcode opens your book. {app} is only told yes or no.',
    passcode: 'Your iPhone passcode opens your book. {app} is only told yes or no.',
  },
} as const;

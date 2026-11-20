// OS permission purpose strings (Info.plist). Dependency-free on purpose, so build-time config can
// load this file on its own. Source: docs/legal/app-store-privacy-labels.md section 4 (counsel review
// pending). {app} is filled from packages/brand, never typed here. Microphone, and Face ID for the app
// lock only (LEGAL-REQ-007, F17 Q3); never speech recognition.
//
// apps/mobile/src/lib/permission-copy.ts still holds the copy that app.config.ts reads today; the
// content rules test fails if the two differ. Owner follow-up: point app.config.ts at this file and
// delete permission-copy.ts.

export const permissions = {
  // NSMicrophoneUsageDescription
  microphone:
    // First sentence only (counsel, labels 1.4.0 section 5): a purpose string must be true whatever the person's backup setting is.
    "{app} uses the microphone to record the letters you speak to your child.",
  // NSFaceIDUsageDescription, only because the app lock ships (founder F1; CPO-2, CISO-1). Draft pending counsel:
  // content.md section 3 option 2, true whether or not the lock is on (LEGAL-REQ-007 amendment, F17 Q3).
  faceId: '{app} uses Face ID to open your book and confirm it is you.',
} as const;

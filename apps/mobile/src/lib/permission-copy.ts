/**
 * OS permission purpose strings, part of `pendingCopy` (copy.ts) awaiting a
 * home in packages/content. Kept in this dependency-free file because
 * app.config.ts reads it at build time, where @scribe/content cannot load.
 *
 * Source: docs/legal/app-store-privacy-labels.md section 4 (1.1.0, counsel
 * review pending). `{app}` is filled from packages/brand, never typed here.
 * Rules (LEGAL-REQ-007): the microphone, and Face ID only because the app lock
 * ships (F17 Q3); never speech recognition. Each must equal packages/content
 * `permissions` word for word (test/app-lock-config.test.ts, rules.test.ts).
 */
export const permissionCopy = {
  // permissions.microphone (Info.plist NSMicrophoneUsageDescription)
  microphone:
    '{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone.',
  // permissions.faceId (Info.plist NSFaceIDUsageDescription, through the expo-local-authentication plugin).
  // Draft pending counsel (account-security/content.md section 3, option 2).
  faceId: '{app} uses Face ID to open your book and confirm it is you.',
} as const;

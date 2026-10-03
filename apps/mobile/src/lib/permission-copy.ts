/**
 * OS permission purpose strings, part of `pendingCopy` (copy.ts) awaiting a
 * home in packages/content. Kept in this dependency-free file because
 * app.config.ts reads it at build time, where @scribe/content cannot load.
 *
 * Source: docs/legal/app-store-privacy-labels.md section 4 (1.1.0, counsel
 * review pending). `{app}` is filled from packages/brand, never typed here.
 * Rules (LEGAL-REQ-007): microphone only; never speech recognition.
 */
export const permissionCopy = {
  // permissions.microphone (Info.plist NSMicrophoneUsageDescription)
  microphone:
    '{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone unless you choose to back them up, share them with family, or use cloud transcription.',
} as const;

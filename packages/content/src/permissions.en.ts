// OS permission purpose strings (Info.plist). Dependency-free on purpose, so build-time config can
// load this file on its own. Source: docs/legal/app-store-privacy-labels.md section 4 (counsel review
// pending). {app} is filled from packages/brand, never typed here. Microphone only; never speech
// recognition (LEGAL-REQ-007).
//
// apps/mobile/src/lib/permission-copy.ts still holds the copy that app.config.ts reads today; the
// content rules test fails if the two differ. Owner follow-up: point app.config.ts at this file and
// delete permission-copy.ts.

export const permissions = {
  // NSMicrophoneUsageDescription
  microphone:
    "{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone unless you choose to back them up, share them with family, or use cloud transcription.",
} as const;

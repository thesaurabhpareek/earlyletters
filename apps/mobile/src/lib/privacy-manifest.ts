/**
 * The app's iOS privacy manifest (PrivacyInfo.xcprivacy), written by Expo from
 * `ios.privacyManifests` in app.config.ts at prebuild. Dependency-free: the
 * config loads this file at build time (like permission-copy.ts).
 *
 * Source of truth: docs/legal/app-store-privacy-labels.md 1.3.0, section 3.3
 * (with the recommended Q-005 answer, "Linked"). The collected data types must
 * match section 1.2 and the App Store Connect answers exactly; the test
 * test/privacy-manifest.test.ts compares this object with the JSON in 3.3.
 *
 * Required-reason APIs, checked in node_modules on 3 Oct 2026 (G-23):
 * - UserDefaults CA92.1: React Native (RCTSettingsManager), expo-constants,
 *   expo-notifications, expo-system-ui (each also ships its own manifest).
 *   expo-sharing 57.0.22 reads an App Group suite only in its share-into
 *   functions, which this app never calls and has no App Group for.
 * - FileTimestamp C617.1: SQLite (expo-sqlite's vendored sqlite3.c: stat,
 *   fstat), whisper.rn (ggml stat on model files, no manifest of its own),
 *   expo-file-system and expo-application, React Native, all on files in the
 *   app container.
 * - SystemBootTime 35F9.1: React Native timing, expo-device (systemUptime).
 * - DiskSpace E174.1: we check free space before a language pack or model
 *   download (lib/packs) and before writing an export (lib/export) and visibly
 *   decline; expo-file-system reads it for us. We never display the free space.
 * - ActiveKeyboards: not used by the app or any dependency.
 * Our own modules (scribe-audio, scribe-files, scribe-store) use none of them.
 * GoogleSignIn, AppAuth, GTMAppAuth, GTMSessionFetcher and hermes come as pods
 * with their own signed manifests (Apple's list); check the archived .ipa
 * before external TestFlight (labels doc 3.2).
 */

type Purpose = 'NSPrivacyCollectedDataTypePurposeAppFunctionality' | 'NSPrivacyCollectedDataTypePurposeAnalytics';

export interface CollectedDataType {
  NSPrivacyCollectedDataType: string;
  NSPrivacyCollectedDataTypeLinked: boolean;
  NSPrivacyCollectedDataTypeTracking: boolean;
  NSPrivacyCollectedDataTypePurposes: Purpose[];
}

export interface AccessedApiType {
  NSPrivacyAccessedAPIType: string;
  NSPrivacyAccessedAPITypeReasons: string[];
}

export interface PrivacyManifests {
  NSPrivacyTracking: boolean;
  NSPrivacyTrackingDomains: string[];
  NSPrivacyAccessedAPITypes: AccessedApiType[];
  NSPrivacyCollectedDataTypes: CollectedDataType[];
}

const APP: Purpose = 'NSPrivacyCollectedDataTypePurposeAppFunctionality';
const ANALYTICS: Purpose = 'NSPrivacyCollectedDataTypePurposeAnalytics';

const collected = (type: string, purposes: Purpose[]): CollectedDataType => ({
  NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${type}`,
  NSPrivacyCollectedDataTypeLinked: true, // Q-005 recommended answer; counsel may move the analytics rows to false
  NSPrivacyCollectedDataTypeTracking: false,
  NSPrivacyCollectedDataTypePurposes: purposes,
});

export const privacyManifests: PrivacyManifests = {
  NSPrivacyTracking: false,
  NSPrivacyTrackingDomains: [],
  NSPrivacyAccessedAPITypes: [
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
    { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
  ],
  NSPrivacyCollectedDataTypes: [
    collected('Name', [APP]),
    collected('EmailAddress', [APP]),
    collected('SensitiveInfo', [APP]), // due date (pregnancy or childbirth information)
    collected('OtherUserContent', [APP]), // letter text, transcripts, child profile
    collected('UserID', [APP, ANALYTICS]),
    collected('PurchaseHistory', [ANALYTICS]), // opt-in plan-state events only
    collected('ProductInteraction', [ANALYTICS]),
    collected('PerformanceData', [ANALYTICS]),
    collected('OtherDiagnosticData', [ANALYTICS, APP]),
    // No CrashData: no crash SDK in v1.0 (DEBATES Q-013). No AudioData, PhotosorVideos: nothing uploads them.
  ],
};

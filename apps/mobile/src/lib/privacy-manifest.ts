/**
 * The app-level iOS privacy manifest, PrivacyInfo.xcprivacy (BL-349, LEGAL-REQ-043, security review L7).
 *
 * app.config.ts passes `privacyManifest(flags)` as `ios.privacyManifests`. Expo's PrivacyInfo mod writes it
 * into ios/<app>/PrivacyInfo.xcprivacy at prebuild, and React Native's pod install step then adds every pod's
 * declared reasons to that file and keeps these collected data types
 * (react-native/scripts/cocoapods/privacy_manifest_utils.rb, `add_aggregated_privacy_manifest`).
 *
 * Two halves:
 *  - Required-reason APIs: one set for every build. The native binary is the same in every profile; only
 *    the JavaScript switches differ.
 *  - Collected data types: follow the build switches, as S17's App Privacy worksheet answers them
 *    (docs/legal/app-store-privacy-labels.md 1.4.0, sections 3.2, 3.4 and 4, on PR #163). A build with
 *    server features off sends nothing we keep, so it declares nothing.
 *
 * Apple's definitions (read 16 Oct 2026 from Apple's own documentation data):
 *  - reasons: developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
 *    and .../app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype
 *  - collected types and purposes: .../app-privacy-configuration/nsprivacycollecteddatatypes/
 *    nsprivacycollecteddatatype and .../nsprivacycollecteddatatypepurposes
 *  - "collect" means kept off the device "in a readable form" longer than the request needs:
 *    developer.apple.com/app-store/app-privacy-details/
 *
 * Re-run the audit (BL-349 PR description) after any native dependency change. Apple's email after each
 * upload is the final check for the reasons (ITMS-91053). Dependency-free, so app.config.ts can load it at
 * config time and Node tests import it directly.
 */

/** The build switches the manifest depends on: the same values app.config.ts records in `extra`. */
export interface ManifestSwitches {
  /** EXPO_PUBLIC_SERVER_FEATURES=on: sign-in, sync, co-parent sharing. */
  readonly serverFeatures: boolean;
  /** EXPO_PUBLIC_BACKUP=on (needs the server switch): encrypted recording backup. */
  readonly backup: boolean;
  /** EXPO_PUBLIC_STATUS_REPORT=on (needs the server switch): the subscription status report. */
  readonly statusReport: boolean;
}

export interface AccessedApiType {
  NSPrivacyAccessedAPIType: string;
  NSPrivacyAccessedAPITypeReasons: string[];
}

export interface CollectedDataType {
  NSPrivacyCollectedDataType: string;
  NSPrivacyCollectedDataTypeLinked: boolean;
  NSPrivacyCollectedDataTypeTracking: boolean;
  NSPrivacyCollectedDataTypePurposes: string[];
}

export interface PrivacyManifest {
  NSPrivacyTracking: boolean;
  NSPrivacyTrackingDomains: string[];
  NSPrivacyAccessedAPITypes: AccessedApiType[];
  NSPrivacyCollectedDataTypes: CollectedDataType[];
}

/**
 * Required-reason API categories and the reasons this app declares. Evidence read on 16 Oct 2026 from
 * node_modules (Expo SDK 57.0.26, react-native 0.86.3, whisper.rn 0.7.4, expo-sqlite 57.0.3) and, for the
 * CocoaPods-only SDKs, from each SDK's own repository at the version GoogleSignIn ~> 9.0 resolves to.
 * Pods that ship a manifest: react-native (React, cxxreact, react/timing), RCT-Folly, boost, glog,
 * expo-application, expo-constants, expo-device, expo-file-system, expo-notifications, expo-system-ui,
 * GoogleSignIn, GTMSessionFetcher, GoogleUtilities, AppAuth, GTMAppAuth, PromisesObjC. Apple does not read
 * every static pod's manifest (Expo, "Privacy manifests" guide), so each category any linked code uses is
 * declared here too, with the reason that matches this app's own use.
 */
export const REQUIRED_REASON_APIS: readonly AccessedApiType[] = [
  {
    // CA92.1: read and write data only this app can see. react-native (React/Resources), expo-constants,
    // expo-notifications, expo-system-ui, GoogleSignIn and GTMSessionFetcher declare CA92.1; GoogleUtilities
    // declares its own wrapper reason C56D.1. expo-dev-launcher and expo-dev-menu use standard defaults and
    // ship no manifest. expo-sharing reads an App Group suite only for "share into", which this app never
    // calls. App code calls no UserDefaults API.
    NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
    NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
  },
  {
    // C617.1: timestamps, size or other metadata of files inside the app container. React Native core,
    // RCT-Folly, boost, glog, expo-application and GoogleUtilities declare C617.1. expo-file-system declares
    // only 0A2A.1 (a wrapper; SDKs only) and 3B52.1, so the app owns the reason for its own calls:
    // src/lib/capture/sweep.ts reads creationTime/modificationTime of recordings in Documents, and
    // src/lib/packs/expo-adapter.ts reads Paths.info of pack files. expo-sqlite ships no manifest; its
    // vendored sqlite3.c (3.50.3) calls stat, fstat and lstat on the database files in the container.
    NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
    NSPrivacyAccessedAPITypeReasons: ['C617.1'],
  },
  {
    // 35F9.1: elapsed time between in-app events. react-native (ReactCommon/react/timing), boost and
    // expo-device declare it; all three are linked statically into the app binary. App code does not read
    // boot time. whisper.rn calls clock_gettime only, which is not on Apple's list.
    NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
    NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
  },
  {
    // E174.1: check for enough space before writing files, behaving visibly differently, including not
    // downloading when space is short. App code reads expo-file-system's Paths.availableDiskSpace before a
    // speech model or pack download (src/lib/models/speech-consent.ts, src/lib/packs/expo-adapter.ts) and
    // before writing an export (src/lib/export/device.ts), and declines or warns on screen
    // (speechConsentCopy.lowSpace, export lowSpaceBody). expo-file-system declares E174.1 and 85F4.1 itself.
    // 85F4.1 is not ours: the app never shows free space (the low-space line shows the download's size).
    // expo-sqlite's vendored sqlite3.c also calls fstatfs (unixOpen) and statfs (locking-style finder) on
    // Apple platforms, only to read the filesystem type; no approved reason names that use, so it rests on
    // this category being declared. Apple's upload email is the final check.
    NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
    NSPrivacyAccessedAPITypeReasons: ['E174.1'],
  },
  // ActiveKeyboards: nothing linked calls activeInputModes, so it is not declared.
];

/** When a data type leaves the phone: with the server switch, or only with a build flag on top of it. */
type CollectedWhen = 'serverFeatures' | 'backup' | 'statusReport';

interface CollectedRow {
  readonly type: string;
  readonly when: CollectedWhen;
}

/**
 * S17's worksheet (app-store-privacy-labels.md 1.4.0 section 3.2), in its section 4 order. Every row is
 * linked to the person, never used for tracking, and App Functionality only: no analytics SDK ships
 * (D-095; posthog-react-native is out of the bundle) and no advertising or personalization purpose exists.
 * Apple's free-form rule (app-privacy-details, "free-form text fields or voice recordings") makes letters
 * Other User Content and recordings Audio Data.
 */
const COLLECTED_ROWS: readonly CollectedRow[] = [
  // The parent's signature, "what {child} calls you" (signs_as in book prefs and on letters), and the name
  // Sign in with Apple shares on first sign-in.
  { type: 'NSPrivacyCollectedDataTypeName', when: 'serverFeatures' },
  // Sign-in by email link and code (Supabase Auth); Apple's relay address; account and deletion notices.
  { type: 'NSPrivacyCollectedDataTypeEmailAddress', when: 'serverFeatures' },
  // A due date ("pregnancy or childbirth information" in Apple's list) syncs with the child profile
  // (book.create: date_of_birth, due_date).
  { type: 'NSPrivacyCollectedDataTypeSensitiveInfo', when: 'serverFeatures' },
  // Recordings uploaded encrypted to the entry-audio bucket. We hold a recovery key that can open them
  // under logged access (D-102), so S17 treats them as collected; counsel to confirm (COUNSEL_PACKET Q54).
  { type: 'NSPrivacyCollectedDataTypeAudioData', when: 'backup' },
  // Letter text, original transcripts and the list of fixes, names and words, the child profile (name,
  // nickname, birthday), co-parent membership.
  { type: 'NSPrivacyCollectedDataTypeOtherUserContent', when: 'serverFeatures' },
  // The Supabase account id: sync, sharing and access control (author_id, profile_id).
  { type: 'NSPrivacyCollectedDataTypeUserID', when: 'serverFeatures' },
  // A random per-install id for backup and restore (backup_devices, from modules/scribe-keys on #150). Not
  // the advertising identifier or IDFV; declared as the cautious reading, counsel to confirm (Q54).
  { type: 'NSPrivacyCollectedDataTypeDeviceID', when: 'backup' },
  // The status report: plan, trial end, renewal date, cancelled flag, and the purchase consent record
  // (D-080, D-081).
  { type: 'NSPrivacyCollectedDataTypePurchaseHistory', when: 'statusReport' },
];

const APP_FUNCTIONALITY = 'NSPrivacyCollectedDataTypePurposeAppFunctionality';

/** The collected data types for a build. Empty with server features off, whatever the build flags say. */
export function collectedDataTypes(s: ManifestSwitches): CollectedDataType[] {
  if (!s.serverFeatures) return [];
  const on: Record<CollectedWhen, boolean> = { serverFeatures: true, backup: s.backup, statusReport: s.statusReport };
  return COLLECTED_ROWS.filter((r) => on[r.when]).map((r) => ({
    NSPrivacyCollectedDataType: r.type,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: [APP_FUNCTIONALITY],
  }));
}

/** The whole `ios.privacyManifests` value for a build. No tracking and no tracking domains, ever. */
export function privacyManifest(s: ManifestSwitches): PrivacyManifest {
  return {
    NSPrivacyTracking: false,
    NSPrivacyTrackingDomains: [],
    NSPrivacyAccessedAPITypes: REQUIRED_REASON_APIS.map((t) => ({
      NSPrivacyAccessedAPIType: t.NSPrivacyAccessedAPIType,
      NSPrivacyAccessedAPITypeReasons: [...t.NSPrivacyAccessedAPITypeReasons],
    })),
    NSPrivacyCollectedDataTypes: collectedDataTypes(s),
  };
}

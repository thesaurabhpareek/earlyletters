---
title: Early Letters App Privacy labels, Data safety form, privacy manifest and permission strings
version: 1.2.0
status: draft-for-counsel
last_updated: 2026-10-03
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD), iOS engineer
---

> **Drafting notice.** Drafted by an AI (Claude) acting as privacy counsel and privacy engineer, for review by a licensed attorney and an engineer. Not legal advice. Answers describe the app as designed in `docs/ARCHITECTURE.md`, the ADRs, PRD sections A to C and the integrated `docs/prd/PRD.md` 1.1 on 2 October 2026. Version 1.1.0 reflects the privacy review in `memos/lawyer-2.md`. Re-check every answer against the actual build before each submission: these labels are legal representations, and they must match the privacy policy (`docs/legal/privacy-policy.md`) and the privacy manifest.

## 0. Ground rules we applied

From Apple's App Privacy Details page [R1]:

- **"Collect"** means sending data off the device so we or a partner can access it longer than needed to service the request in real time. Data processed only on device is not collected.
- **Server data that isn't retained** (sent and immediately discarded after servicing the request) need not be disclosed. This is why server transcription with Groq Zero Data Retention or DeepInfra in-memory processing is not, on its own, a "collected" Audio Data use. Audio is still declared because backups and web playback retain it.
- **Free-form content.** We need not disclose every kind of data users might type or say into free-form fields, but we must disclose a specific data type when we ask for it (for example a name, a due date) or when a feature uploads a media type (photos, recordings).
- **Linked to identity** unless stripped of direct identifiers before collection and never re-linked. We claim "not linked" only where engineering can guarantee those conditions (see 1.3).
- **Tracking** means linking our data with third-party data for targeted ads or ad measurement, or sharing with a data broker. We do neither.
- Our third-party SDKs (PostHog, Sentry, Supabase, `expo-iap` for StoreKit; PowerSync only if used, D-023; Google Sign-In from v1.1) count as our collection. RevenueCat is not used (ADR 0013).

From Google Play's Data safety guidance [R4]: collection is any transmission off device; on-device processing and end-to-end encrypted data need not be disclosed; transfers to service providers acting on our behalf are not "sharing"; ephemeral in-memory processing need not be disclosed.

## 1. Apple App Privacy questionnaire (App Store Connect)

### 1.1 Top-level answers

| Question | Answer |
|---|---|
| Do you or your third-party partners collect data from this app? | **Yes** |
| Do you or your third-party partners use data for tracking? | **No**. No ad SDKs, no IDFA, no data brokers, no App Tracking Transparency prompt (PRD C-NFR-005). |
| Privacy policy URL | {PRIVACY_POLICY_URL} (must be live before submission; `packages/brand` still points to `example.com/privacy`) |
| Privacy choices URL (optional) | {PRIVACY_CHOICES_URL}, a page explaining export, deletion and Settings, Privacy |

### 1.2 Data types

"Linked" = linked to the user's identity. All purposes below use Apple's purpose names.

| Category | Data type | Collected? | Linked? | Tracking? | Purposes | Why |
|---|---|---|---|---|---|---|
| Contact Info | Name | **Yes** | Yes | No | App Functionality | Display name, "what {child} calls you", name from Sign in with Apple (first sign-in only). |
| Contact Info | Email Address | **Yes** | Yes | No | App Functionality | Magic-link and code sign-in; Apple or Google sign-in returns an email or private relay address; trial and renewal notices. If we ever send marketing email, add Developer's Advertising or Marketing. |
| Contact Info | Phone Number, Physical Address, Other User Contact Info | No | | | | Not requested. Print shipping addresses (P2) will change this. |
| Health & Fitness | Health | No | | | | We do not ask for health data. Health mentioned inside a letter is free-form content (see 0). The due date is declared under Sensitive Info (pregnancy), which is Apple's specific type for it. Revisit if any structured health field is added. |
| Health & Fitness | Fitness | No | | | | |
| Financial Info | Payment Info, Credit Info, Other Financial Info | No | | | | Payment goes through Apple; we never see card data. |
| Location | Precise, Coarse | No | | | | Not requested. Confirm PostHog GeoIP is off (see 1.3); if on, Coarse Location becomes Yes. |
| Sensitive Info | Sensitive Info | **Yes** | Yes | No | App Functionality | Apple lists "pregnancy or childbirth information" as Sensitive Info [R1]. Due-date mode asks for and syncs a due date (B-REQ-005). Decided: due-date mode stays P0 and the due date is health data (PRD K-25), so declare. Biometric data is also in this Apple type; we collect none (we create no voiceprints or face templates, LEGAL-REQ-019), so recordings and photos stay under User Content only. |
| Contacts | Contacts | No | | | | Never requested (A-REQ-035, B non-goals). |
| User Content | Emails or Text Messages | No | | | | |
| User Content | Photos or Videos | **Yes** | Yes | No | App Functionality | Photos attached to letters and profiles are uploaded to the private `entry-photos` bucket. |
| User Content | Audio Data | **Yes** | Yes | No | App Functionality | Optional encrypted backup (Standard mode keeps a server-escrowed key, so the service can decrypt) and web playback. Vault-mode backups are end-to-end encrypted, but the type is still collected in Standard mode. Server transcription alone would not count (not retained). |
| User Content | Gameplay Content | No | | | | |
| User Content | Customer Support | No | | | | Support happens by email outside the app. If we add an in-app support form, change to Yes, App Functionality. |
| User Content | Other User Content | **Yes** | Yes | No | App Functionality | Letter text, raw transcripts and edit history, names-and-words dictionary, child profile (name, nickname, birthday), signatures, family relationships, languages and goals. |
| Browsing History | Browsing History | No | | | | |
| Search History | Search History | No | | | | In-app search runs on the local database. Revisit if server search is added. |
| Identifiers | User ID | **Yes** | Yes | No | App Functionality | Supabase account ID, used for sync and access control. If the analytics ID is judged linked (1.3), add Analytics. |
| Identifiers | Device ID | No | | | | No IDFA, no IDFV sent. Engineering check: confirm PostHog and Sentry send no IDFV or vendor device ID (and that `expo-iap` sends nothing off the device except to Apple); if any does, declare Device ID. |
| Purchases | Purchase History | **Yes** | Yes | No | App Functionality, Analytics | App Store transaction and renewal status for a random `appAccountToken`, held per account on our server as entitlements (PRD K-28, ADR 0013), so linked to the account. Analytics purpose because business totals come from the entitlement ledger (PRD-REQ-017); drop it if counsel reads server aggregates as App Functionality only. |
| Usage Data | Product Interaction | **Yes** | **No** (conditional, 1.3) | No | Analytics | Allowlisted PostHog events (ADR 0008; PRD K-01, PRD-REQ-016; C-REQ-034), sent only after the user opts in (Apple 5.1.1(ii); compliance register CR-082). Children appear only as ordinals and a `child_count_bucket` property, never ids, names or birthdays. Apple's label has no "optional" flag, so the type is still declared. |
| Usage Data | Advertising Data | No | | | | |
| Usage Data | Other Usage Data | No | | | | |
| Diagnostics | Crash Data | **Yes** | No | No | App Functionality | Sentry, `sendDefaultPii: false`, content scrubbed, no user ID. |
| Diagnostics | Performance Data | **Yes** | No | No | App Functionality, Analytics | Sentry performance (if enabled) and PostHog `app_cold_start {ttfi_bucket}`. |
| Diagnostics | Other Diagnostic Data | **Yes** | No | No | App Functionality | Model download outcomes, sync errors (enums only). |
| Surroundings, Body | all | No | | | | |
| Other Data | Other Data Types | No | | | | |

### 1.3 Conditions for "Not linked" on Usage Data and Diagnostics

Answer "No" (not linked) only if all of these hold in the shipped build. Otherwise answer "Yes".

1. PostHog uses a random analytics ID that is never set to the Supabase user ID or email (ADR 0008), and `identify()` is never called with account data.
2. No server job joins PostHog or Sentry data with account data, and the analytics ID is never stored in our database.
3. PostHog project setting "IP data capture" is off and GeoIP enrichment disabled [R7]; Sentry "prevent storing IP addresses" is on [R8].
4. Sentry events carry no user ID (`sendDefaultPii: false`, no `setUser`).
5. Neither SDK initializes before the user opts in, so no event, crash or device metadata leaves the phone before a choice.
6. Account deletion may pass the current analytics ID to the deletion function once, in memory, so PostHog events can be deleted (privacy policy CN-18). It is never written to our database or logs, so condition 2 still holds. If engineering instead stores it, answer "Yes" (linked).

Note: the App Store `appAccountToken` is random (ADR 0013) but entitlements are mapped to accounts and books on our server, so Purchases stay "Linked".

### 1.4 What the label will show (expected)

- **Data Used to Track You:** none.
- **Data Linked to You:** Contact Info, User Content, Identifiers, Purchases, Sensitive Info.
- **Data Not Linked to You:** Usage Data, Diagnostics.

## 2. Google Play Data safety form (Android, later)

Same app, same SDKs, so the answers mirror section 1. Play's form differs in three ways: it asks about "sharing" (we answer No, because every transfer is to a service provider acting for us [R4]); it asks whether each type is required or optional; and app-scoped random IDs count as "Device or other IDs".

### 2.1 Overview questions

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by your app encrypted in transit? | Yes (TLS everywhere; confirm no plain HTTP model download) |
| Do you provide a way for users to request that their data be deleted? | Yes: in-app (Settings, Your data, Delete account) and web deletion page at {WEB_DELETION_URL} (required by Play for apps with accounts, PRD A section 8) |
| Independent security review (MASA) | No (optional) |
| Target audience and content | Adults 18+. Not designed for children; not in the Families program. Confirm in the Play Console target audience form (PRD A marks this Unverified). |

### 2.2 Data types

| Play category | Data type | Collected | Shared | Ephemeral only? | Required or optional | Purposes |
|---|---|---|---|---|---|---|
| Personal info | Name | Yes | No | No | Required (signature on letters) | App functionality, Account management |
| Personal info | Email address | Yes | No | No | Optional (only when signing in; local use works without an account) | Account management, App functionality, Developer communications (trial and renewal notices) |
| Personal info | User IDs | Yes | No | No | Optional | Account management, App functionality |
| Personal info | Other info | Yes | No | No | Required (child's name and birthday or due date) | App functionality |
| Personal info | Address, Phone, Race and ethnicity, Political or religious beliefs, Sexual orientation | No | | | | |
| Financial info | Purchase history | Yes | No | No | Optional | App functionality, Analytics |
| Health and fitness | Health info | Yes | No | No | Optional (due-date mode only) | App functionality. The due date is health data (PRD K-25). |
| Messages | all | No | | | | |
| Photos and videos | Photos | Yes | No | No | Optional | App functionality |
| Audio files | Voice or sound recordings | Yes | No | No | Optional (backup, server transcription, web) | App functionality |
| Files and docs | Files and docs | No | | | | Export ZIP and PDF are created on device and handed to the share sheet by the user. |
| Calendar, Contacts, Location, Web browsing | all | No | | | | |
| App activity | App interactions | Yes | No | No | Optional (analytics is opt-in, LEGAL-REQ-003) | Analytics |
| App activity | In-app search history | No | | | | Local only |
| App activity | Other user-generated content | Yes | No | No | Required to sync (optional overall, since local use needs no account) | App functionality |
| App activity | Installed apps, Other actions | No | | | | |
| App info and performance | Crash logs | Yes | No | No | Optional (crash reporting is opt-in, LEGAL-REQ-003) | App functionality |
| App info and performance | Diagnostics | Yes | No | No | Optional | App functionality, Analytics |
| Device or other IDs | Device or other IDs | Yes | No | No | Optional | Analytics (random PostHog ID), App functionality (random App Store account token) |

Server transcription data is ephemeral (in memory, not retained) and may be marked as such if the form asks; it is still covered by "Voice or sound recordings" because of backup.

## 3. iOS privacy manifest (PrivacyInfo.xcprivacy)

### 3.1 What Apple requires (verified 2 October 2026)

Apple's current required-reason API categories and approved reasons [R2]:

| Category | APIs (examples) | Reasons |
|---|---|---|
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `creationDate`, `modificationDate`, `stat`, `getattrlist` | DDA9.1 display to user, on device only; **C617.1** files inside the app container, app group or CloudKit container; 3B52.1 files the user granted access to; 0A2A.1 SDK wrapper only |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `systemUptime`, `mach_absolute_time()` | **35F9.1** measure elapsed time between in-app events or timers; 8FFB.1 absolute timestamps for in-app events; 3D61.1 optional user bug report |
| `NSPrivacyAccessedAPICategoryDiskSpace` | `volumeAvailableCapacityForImportantUsageKey`, `statfs` | 85F4.1 display to user; **E174.1** check space before writing files, or delete when low, with observable behavior (includes not downloading when space is short); 7D9E.1 user bug report; B728.1 health research apps only |
| `NSPrivacyAccessedAPICategoryActiveKeyboards` | `activeInputModes` | 3EC4.1 custom keyboard apps; 54BD.1 customize UI based on active keyboards |
| `NSPrivacyAccessedAPICategoryUserDefaults` | `UserDefaults` | **CA92.1** app-only data; 1C8F.1 App Group; C56D.1 SDK wrapper only; AC6B.1 MDM managed config |

Apple rejects uploads that use these APIs without declared reasons (since 1 May 2024) [R2]. Each third-party SDK must ship its own manifest; it cannot rely on the app's [R2]. Apple's list of SDKs that must ship a signed manifest includes `hermes` (React Native), `GoogleSignIn`, `AppAuth`, `GTMAppAuth`, `GTMSessionFetcher`, `OpenSSL` and `BoringSSL`; Sentry, PostHog and op-sqlite (and RevenueCat, no longer used) are not on that list [R3], but should still ship manifests.

### 3.2 What our app likely uses, and why

| Category | Reason | Who uses it | Why we think so |
|---|---|---|---|
| UserDefaults | CA92.1 | React Native, Expo modules (including `expo-iap`), PostHog, Sentry, our settings | Universal in RN apps; Expo's guide uses it as the example [R5] |
| FileTimestamp | C617.1 | RN and Expo file system, our audio files, model download cache, op-sqlite, PowerSync attachment queue | Reading size and dates of files in our container (audio `.m4a`, model files, photos) |
| SystemBootTime | 35F9.1 | React Native (`mach_absolute_time` for timers and performance), Sentry, recorder elapsed time | Elapsed time between in-app events. Only durations leave the device. |
| DiskSpace | E174.1 | Our model downloader (574 MB Whisper model, ADR 0001), recorder, export | We must check free space before downloading the model or writing an export, and visibly decline or warn. Do not use 85F4.1 unless Settings displays free space; "storage used" by our own files is not disk space. |
| ActiveKeyboards | none | | Not used. Confirm no SDK uses it. |

Engineering check before first submission: Expo notes that Apple does not always parse manifests inside static CocoaPods dependencies, so reasons from SDK manifests may need to be copied into the app's own config [R5]. Search `node_modules/**/PrivacyInfo.xcprivacy` and `ios/Pods/**/PrivacyInfo.xcprivacy`, merge every reason found, and rebuild. Apple's warning email after upload is the final check.

### 3.3 Proposed `app.json` config (Expo `ios.privacyManifests`)

The collected-data section must match section 1.2 exactly. Key names verified against Apple's documentation [R2].

```json
{
  "expo": {
    "ios": {
      "privacyManifests": {
        "NSPrivacyTracking": false,
        "NSPrivacyTrackingDomains": [],
        "NSPrivacyAccessedAPITypes": [
          { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults", "NSPrivacyAccessedAPITypeReasons": ["CA92.1"] },
          { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp", "NSPrivacyAccessedAPITypeReasons": ["C617.1"] },
          { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime", "NSPrivacyAccessedAPITypeReasons": ["35F9.1"] },
          { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace", "NSPrivacyAccessedAPITypeReasons": ["E174.1"] }
        ],
        "NSPrivacyCollectedDataTypes": [
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeName", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeEmailAddress", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeSensitiveInfo", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePhotosorVideos", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeAudioData", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeOtherUserContent", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeUserID", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePurchaseHistory", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality", "NSPrivacyCollectedDataTypePurposeAnalytics"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeProductInteraction", "NSPrivacyCollectedDataTypeLinked": false, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAnalytics"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeCrashData", "NSPrivacyCollectedDataTypeLinked": false, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePerformanceData", "NSPrivacyCollectedDataTypeLinked": false, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality", "NSPrivacyCollectedDataTypePurposeAnalytics"] },
          { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeOtherDiagnosticData", "NSPrivacyCollectedDataTypeLinked": false, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] }
        ]
      }
    }
  }
}
```

If due dates are ever kept on device only, remove the `SensitiveInfo` entry here and in 1.2 together (checklist, section 5).

## 4. iOS permission strings (Info.plist), in our voice

Rules applied: VOICE.md (warm, calm, plain; no naming the technology; never gender the child; straight quotes; no dashes, ellipsis characters or emoji). Info.plist strings are static, so `{child}` can't be filled; we say "your child". Each string says what we use it for and where the data goes, which Apple's review checks.

| Key | String | Notes |
|---|---|---|
| `NSMicrophoneUsageDescription` | Early Letters uses the microphone to record the letters you speak to your child. Your recordings stay on this phone unless you choose to back them up, share them with family, or use cloud transcription. | Required for expo-audio. Asked the first time someone taps record, never at launch (PRD A, C-REQ-001 sequencing). If denied: existing string `Allow the microphone in Settings to speak your letters. Or type instead.` |
| `NSPhotoLibraryUsageDescription` | Early Letters opens your photos so you can add one to a letter. Only the photo you pick is used. | Prefer the system photo picker (PHPicker), which needs no library permission, so most people never see this. The Expo image picker plugin adds the key anyway; keep the string honest in case it shows. |
| `NSPhotoLibraryAddUsageDescription` | Early Letters saves the photo or page you chose to your photo library. | Only if we add "Save to Photos". Export goes through the share sheet, which does not need it. Omit otherwise. |
| `NSCameraUsageDescription` | Early Letters uses the camera so you can take a photo for a letter. Photos stay private to the family you invite. | Only if "Take a photo" ships. Omit otherwise; an unused permission string invites review questions. |
| `NSFaceIDUsageDescription` | Early Letters uses Face ID to keep your letters private on this phone. | Only if an app lock ships (competitive research item 20). |
| `NSSpeechRecognitionUsageDescription` | Not needed | whisper.rn runs our own model and does not use Apple's Speech framework. Add only if Apple SpeechAnalyzer becomes an option (ARCHITECTURE Phase 1.x). |
| Notifications | No Info.plist string exists | iOS shows its own fixed prompt. Our priming card comes first (PRD C, F1): title "A gentle nudge, now and then?", body "A couple of evenings a week, at a time you pick. Never late at night." Buttons: "Yes, evenings", "Pick a time", "Not now". |

The 1.0.0 note about `permissionTitle` ("One small reminder a day") is resolved: PRD section 8 rewrote it. Version 1.1.0 adds "or use cloud transcription" to the microphone string, because cloud transcription is a real exit path (PRD K-21) and Apple reviews purpose strings for accuracy. Info.plist strings are set through `app.json`; generate the app name in them from `packages/brand` rather than typing it (CLAUDE.md).

Android equivalents (later): `RECORD_AUDIO` with an in-app explanation using the microphone string; `POST_NOTIFICATIONS` on Android 13+ after the priming card; use the Android photo picker so no media permission is requested.

## 5. Consistency checklist before each submission

- [ ] Every "Yes" in 1.2 appears in the privacy policy section 3 table and in 3.3 `NSPrivacyCollectedDataTypes`.
- [ ] Analytics allowlist (`packages/analytics`) still contains no strings over 40 characters, no names, no emails, no letter text.
- [ ] PostHog IP capture off; Sentry IP storage off; neither SDK calls `identify` or `setUser` with account data; neither initializes before opt-in.
- [ ] Server `safety_events` table dropped (PRD K-06, PRD-REQ-006, LEGAL-REQ-015) and the draft data-governance purge of it removed; otherwise add Health or Sensitive Info for the inference and re-run 1.2.
- [ ] Due-date mode still ships; if it is removed or kept on device only, remove Sensitive Info here, in 3.3 and Health info in 2.2 together.
- [ ] No face detection, landmarking or recognition on photos and no speaker features on audio (LEGAL-REQ-019); otherwise Sensitive Info (biometric) changes.
- [ ] The `child-input` flag is off in the production build (PRD K-19); a child-voice feature changes the COPPA analysis and possibly the age rating.
- [ ] No new SDK added since the last review. If one was, re-run sections 1 to 3.
- [ ] Privacy policy URL live and matching the version in the app.
- [ ] Consent sheet for server transcription shown before any audio leaves the device (Apple 5.1.2(i)).

## Appendix. Sources (opened 2 October 2026)

- [R1] Apple, App privacy details on the App Store (data types, purposes, definitions of collect, linked, tracking, optional disclosure, free-form content, data not retained): https://developer.apple.com/app-store/app-privacy-details/
- [R2] Apple, Describing use of required reason API, and NSPrivacyAccessedAPIType (categories and reason codes, read from Apple's documentation data on 2 October 2026): https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api ; https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype ; collected data type keys: https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacycollecteddatatypes/nsprivacycollecteddatatype
- [R3] Apple, Upcoming third-party SDK requirements (list of SDKs requiring privacy manifests and signatures): https://developer.apple.com/support/third-party-SDK-requirements/
- [R4] Google Play Console Help, Provide information for Google Play's Data safety section: https://support.google.com/googleplay/android-developer/answer/10787469
- [R5] Expo, Privacy manifests: https://docs.expo.dev/guides/apple-privacy/
- [R6] RevenueCat, Apple App Privacy: https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy
- [R7] PostHog, Data collection and IP capture settings: https://posthog.com/docs/privacy/data-collection
- [R8] Sentry, Server-side data scrubbing (IP storage setting): https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/
- Repository: `docs/ARCHITECTURE.md`; ADR 0001, 0002, 0006, 0007, 0008; PRD A, B, C; `apps/mobile/app.json`; `apps/mobile/package.json`; `packages/content/src/strings.en.ts`; `packages/content/VOICE.md`.

Unverified: whether the Sentry or PostHog RN SDKs send IDFV by default; which required-reason APIs `expo-iap` declares in its own manifest; exact Sentry IP setting name; the Play target audience form wording.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.2.0 | 2026-10-03 | Alignment with PRD.md 1.3 (ADR 0013, D-001): RevenueCat removed from the SDK list, Purchases source and identifiers; App Store `appAccountToken` described; `expo-iap` added; PowerSync conditional on D-023; Google Sign-In from v1.1. Labels unchanged in substance (Purchases stay Linked). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`): Sensitive Info and Play Health info declared for the due date (PRD K-25); Purchases per account (K-28); analytics child-count note; "not linked" condition for analytics deletion; microphone string adds cloud transcription; stale reminder-string note resolved; checklist adds `safety_events` drop, due-date, biometric and child-input checks. Pre-submission draft; nothing published. |
| 1.0.0 | 2026-10-02 | First draft for counsel and engineering review. |

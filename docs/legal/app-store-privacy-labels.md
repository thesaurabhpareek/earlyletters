---
title: Early Letters App Privacy labels, Data safety form, privacy manifest and permission strings
version: 1.4.0
status: draft-for-counsel
last_updated: 2026-10-15
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD), iOS engineer
---

> **Draft for counsel review, not legal advice.** Drafted by an AI (Claude) as drafting support for counsel and an engineer. **Version 1.4.0 is a draft for the server-on v1.0** (M14, D-089): accounts, sync and co-parent sharing, opt-in encrypted recording backup with a recovery key we hold (D-073, D-091; F08 6.5), the subscription status report and reminder emails (D-080, D-081), and push notifications from our server (F11). It follows PRD V2 F17 section 8.5 and R4 PT-24, and replaces the "Data Not Collected" position of D-088, which D-089 amends. Version 1.3.0 described the on-device build of 3 Oct 2026. Re-check every answer against the actual release build before each submission: these labels are legal representations, and they must match the Privacy Policy (`docs/legal/privacy-policy.md` 1.5.0) and the privacy manifest (BL-349, owned by S20; F17-REQ-028). Open questions are numbered in `COUNSEL_PACKET.md` 1.1.0 (Q7 is DEBATES Q-005; Q32 (d) asks whether Audio Data is collected; Q8 covers Purchases). If the submission build ships with `capabilities.backup` off, the Audio Data row is re-run for that build (section 5).

## 0. Ground rules we applied

From Apple's App Privacy Details page [R1]:

- **"Collect"** means sending data off the device so we or a partner can access it longer than needed to service the request in real time. Data processed only on device is not collected.
- **Free-form content.** We need not disclose every kind of data users might type or say into free-form fields, but we must disclose a specific data type when we ask for it (for example a name, a due date) or when a feature uploads a media type (photos, recordings).
- **Linked to identity** unless stripped of direct identifiers before collection and never re-linked. Apple also says: "Personal Information and Personal Data, as defined under relevant privacy laws, are considered linked to the user" (quoted in `docs/analytics/TRACKING_PLAN.md` section 10, checked 3 Oct 2026).
- **Tracking** means linking our data with third-party data for targeted ads or ad measurement, or sharing with a data broker. We do neither.
- Our third-party SDKs in v1.0 are PostHog (`posthog-react-native`, only after opt-in), Supabase (`supabase-js`), Google Sign-In (`@react-native-google-signin/google-signin`) and `whisper.rn` (on-device only). StoreKit is called through our own module (`modules/scribe-store`, ADR 0013); `expo-iap` was removed. No RevenueCat, no PowerSync (D-023), no Sentry in the v1.0 app.

From Google Play's Data safety guidance [R4]: collection is any transmission off device; on-device processing and end-to-end encrypted data need not be disclosed; transfers to service providers acting on our behalf are not "sharing"; ephemeral in-memory processing need not be disclosed. Android is not in v1.0 (D-059).

## 1. Apple App Privacy questionnaire (App Store Connect)

### 1.1 Top-level answers

| Question | Answer |
|---|---|
| Do you or your third-party partners collect data from this app? | **Yes** |
| Do you or your third-party partners use data for tracking? | **No**. No ad SDKs, no IDFA, no IDFV, no data brokers, no App Tracking Transparency prompt (TRACKING_PLAN section 10; LEGAL-REQ-016) |
| Privacy policy URL | https://earlyletters.com/privacy (live before submission; D-063) |
| Privacy choices URL (optional) | https://earlyletters.com/delete-account, until a privacy-choices page exists |

### 1.2 Data types

"Linked" = linked to the user's identity. All purposes below use Apple's purpose names.

| Category | Data type | Collected? | Linked? | Tracking? | Purposes | Why |
|---|---|---|---|---|---|---|
| Contact Info | Name | **Yes** | Yes | No | App Functionality | Display name, "what {child} calls you", name from Sign in with Apple or Google (first sign-in only). |
| Contact Info | Email Address | **Yes** | Yes | No | App Functionality | Magic-link sign-in; Apple or Google sign-in returns an email or private relay address; account, security (new sign-in, restore requests, each recovery-key use) and deletion emails, and **billing notice emails** (acknowledgment and auto-renewal reminders, D-080, D-081; changed in 1.4.0) through Resend. Billing notices are transactional and required by law, so they stay App Functionality. If we ever send marketing email, add Developer's Advertising or Marketing. |
| Contact Info | Phone Number, Physical Address, Other User Contact Info | No | | | | Not requested. |
| Health & Fitness | Health | No | | | | We do not ask for health data. Health mentioned inside a letter is free-form content (section 0). The due date is declared under Sensitive Info. |
| Health & Fitness | Fitness | No | | | | |
| Financial Info | Payment Info, Credit Info, Other Financial Info | No | | | | Apple takes payment; we never see card data. |
| Location | Precise, Coarse | No | | | | Not requested. PostHog IP capture and GeoIP must stay off (1.3 condition 3); otherwise Coarse Location becomes Yes. |
| Sensitive Info | Sensitive Info | **Yes** | Yes | No | App Functionality | Apple lists "pregnancy or childbirth information" as Sensitive Info [R1]. Due-date mode asks for and syncs a due date (PRD K-25: health data). We collect no biometric data (no voiceprints, LEGAL-REQ-019). |
| Contacts | Contacts | No | | | | Never requested. Invites go through the system share sheet. |
| User Content | Emails or Text Messages | No | | | | |
| User Content | Photos or Videos | **No** (changed in 1.3.0) | | | | No photo feature in v1.0 (ROADMAP 2.0 section 5; no photo picker in `apps/mobile/package.json`). The `entry-photos` bucket and `photo_path` column exist in the schema but nothing uploads to them. Re-run when photos ship (BL-320, BL-314). |
| User Content | Audio Data | **Yes** (changed in 1.4.0) | **Yes** | No | App Functionality | Opt-in owner backup uploads recordings, encrypted on the phone, and we hold a recovery key that can open them (D-073, M16; F08 6.5). Data sent off the device and accessible to us beyond real-time servicing is collected; end-to-end encrypted data we cannot read would not be, but escrow means we can (R4 PT-24; F08-REQ-038; F17 8.5). Apple's label has no "optional" flag, so the type is declared although backup is off until the owner turns it on. Transcription still runs on the phone; no cloud transcription. COUNSEL_PACKET Q32 (d) |
| User Content | Gameplay Content | No | | | | |
| User Content | Customer Support | No | | | | Support happens by email outside the app. |
| User Content | Other User Content | **Yes** | Yes | No | App Functionality | Letter text, raw transcripts and edit history, names-and-words dictionary, child profile (name, nickname, birthday), signature, co-parent membership, and held letters waiting at the Keep step (author-only; F14-REQ-039). Confirm against the synced columns at submission (F17 8.5). |
| Browsing History | Browsing History | No | | | | |
| Search History | Search History | No | | | | In-app search runs on the local database. |
| Identifiers | User ID | **Yes** | Yes | No | App Functionality; **Analytics** (recommended, Q-005) | Supabase account ID for sync and access control. The random analytics ID is an "assigned" ID used for analytics after opt-in; declaring it here under Analytics is the cautious reading (TRACKING_PLAN 10 point 2). |
| Identifiers | Device ID | **Yes (cautious reading; new in 1.4.0)** | Yes | No | App Functionality | No IDFA, no IDFV: PostHog RN 4.78.4 reads none (TRACKING_PLAN 10). New: a random per-install device id in `backup_devices` (F08 6.5) and an APNs push token in `push_tokens` (F11), both tied to the account. Whether these are Apple "device-level IDs" is unclear; over-declaring is not deceptive. Counsel may answer No |
| Purchases | Purchase History | **Yes** (changed in 1.4.0) | **Yes** | No | **App Functionality**; Analytics | The D-080 status report sends plan, trial end, renewal date and the cancelled flag (and, on the first report, the D-081 consent facts) to our server, linked to the account, to send the reminder emails the law requires: App Functionality, linked whatever the Q-005 answer (F17 8.5; R4 PT-24; F14 Q-C9). Opt-in plan-state analytics events keep the Analytics purpose. No receipts, transaction ids in clear, prices or payment data (F14 section 8). |
| Usage Data | Product Interaction | **Yes** | **Yes** (recommended, Q-005) | No | Analytics | Allowlisted PostHog events, sent only after opt-in (LEGAL-REQ-003). Children appear only as ordinals and a `child_count_bucket`. One of seven language codes on two events (DEBATES Q-004). Apple's label has no "optional" flag, so the type is declared. |
| Usage Data | Advertising Data | No | | | | |
| Usage Data | Other Usage Data | No | | | | |
| Diagnostics | Crash Data | **No** (changed in 1.3.0) | | | | Sentry is not in the v1.0 app (TRACKING_PLAN 7: "Sentry, when added"). Apple's own crash reports reach us through App Store Connect and Xcode Organizer under the user's Apple setting; that is Apple's collection, not ours. Re-run when Sentry ships. |
| Diagnostics | Performance Data | **Yes** | Same as Usage Data | No | Analytics | PostHog `app_cold_start {ttfi_bucket}` after opt-in. |
| Diagnostics | Other Diagnostic Data | **Yes** | Same as Usage Data | No | Analytics, App Functionality | Opt-in events for model and pack download outcomes, sync errors and error codes (enums only). |
| Surroundings, Body | all | No | | | | |
| Other Data | Other Data Types | No | | | | |

**Download hosts.** Speech models and language packs come from Hugging Face (pinned upstream revisions) and our planned download host (Cloudflare R2, DEBATES Q-001). Those requests carry an IP address and a file name, are needed to service the request, and nothing is sent that we keep or link. Not declared as a data type; disclosed in the Privacy Policy section 8 (COUNSEL_PACKET Q12).

### 1.3 Q-005: "Linked" or "Not linked" for Usage Data, Diagnostics and Purchases

**Facts (TRACKING_PLAN sections 0, 7 and 10; PostHog RN 4.78.4 source as checked by the analytics owner):** the analytics ID is a fresh random UUID per consent period, never the email, account ID, a device ID or an App Store token; no PostHog person properties; no `identify` with account data; the PostHog project discards client IP and GeoIP is off; the SDK keeps state in memory only; no server of ours stores or joins the ID. On withdrawal the ID is retired but **kept on the phone** (at most 20) so the phone can later ask the stateless `analytics-forget` function to delete those events; at account deletion the phone sends them with the user's session, and the function stores nothing.

**Analysis.**
1. Apple: data is "not linked" only if it is stripped of direct identifiers before collection and never re-linked, and personal data under privacy laws counts as linked.
2. CCPA: "personal information" includes a "unique identifier" or "unique personal identifier", which covers a persistent identifier that recognises a consumer or device over time (Cal. Civ. Code 1798.140, read from the Privacy Policy's [L10] source; counsel to confirm the exact words). A random ID that persists for a whole consent period and carries behaviour is very likely personal information. Data is outside the CCPA only if "deidentified": reasonable measures so it cannot be linked, a public commitment not to re-identify, and contracts binding recipients.
3. Our design does most of that (random ID, no IP, no person properties, PostHog DPA, the new public commitment in Privacy Policy section 6). But we deliberately keep the ability to link: the phone retains past IDs and sends them, alongside the account session, to delete the events. That is good privacy practice and it weakens a claim that the data "cannot reasonably be linked".

**Recommendation: declare Usage Data, Diagnostics and Purchases (Analytics) as "Linked", and add Analytics to Identifiers > User ID.** Over-declaring is not deceptive; under-declaring is (FTC Act section 5, LEGAL-REQ-042). "Linked" is not "tracking": the "Data Used to Track You" section stays empty either way. The cost is cosmetic: Usage Data appears under "Data Linked to You". **Option (a), "Not linked"**, stays available if counsel concludes the six conditions below plus the Privacy Policy commitment meet CCPA de-identification despite the deletion path. **Default if counsel does not answer by 29 Oct 2026: Linked.**

Conditions that must hold for either answer (engineering checks before each submission):
1. PostHog uses a random analytics ID that is never set to the Supabase user ID or email, and `identify()` is never called with account data.
2. No server job joins PostHog data with account data, and the analytics ID is never stored in our database or logs (`analytics-forget` is stateless).
3. PostHog project setting "Discard client IP data" is on and GeoIP enrichment is off [R7].
4. No PostHog person properties; `$set` and `$set_once` are stripped (TRACKING_PLAN 6.3).
5. The SDK is not constructed before opt-in, so nothing leaves the phone before a choice.
6. The phone sends retained analytics IDs only to `analytics-forget`, only for deletion.

### 1.4 What the label will show (expected, with the recommended Q-005 answer)

- **Data Used to Track You:** none.
- **Data Linked to You:** Contact Info, User Content (including Audio Data), Identifiers, Purchases, Usage Data, Diagnostics, Sensitive Info.
- **Data Not Linked to You:** none.

With option (a): Linked: Contact Info, User Content, Identifiers (App Functionality), Sensitive Info; Not Linked: Usage Data, Diagnostics. From 1.4.0 Purchases stay Linked in both cases, because the status report is linked to the account.

## 2. Google Play Data safety form (Android, later)

Not needed for v1.0 (D-059: Google Play and Android are v1.1 or later). When Android ships, mirror section 1 from the Android build: Play asks about "sharing" (No: every transfer is to a service provider [R4]), whether each type is required or optional, and counts app-scoped random IDs as "Device or other IDs". Declare target audience 18+ and not in the Families program, and provide the web deletion URL (https://earlyletters.com/delete-account, with the full web flow by then, D-042). The 1.2.0 table is in git history; it described backup, photos and server transcription, none of which ship in v1.0.

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

Apple rejects uploads that use these APIs without declared reasons (since 1 May 2024) [R2]. Each third-party SDK must ship its own manifest [R2]. Apple's list of SDKs that must ship a signed manifest includes `hermes` (React Native), `GoogleSignIn`, `AppAuth`, `GTMAppAuth`, `GTMSessionFetcher`, `OpenSSL` and `BoringSSL` [R3].

### 3.2 What our app likely uses, and why

| Category | Reason | Who uses it | Why we think so |
|---|---|---|---|
| UserDefaults | CA92.1 | React Native, Expo modules, our StoreKit module (`plus.cache`), PostHog, our settings | Universal in RN apps; Expo's guide uses it as the example [R5] |
| FileTimestamp | C617.1 | RN and Expo file system, our audio files, pack and model cache, expo-sqlite | Reading size and dates of files in our container |
| SystemBootTime | 35F9.1 | React Native (`mach_absolute_time`), recorder elapsed time | Elapsed time between in-app events. Only durations leave the device, and only after opt-in |
| DiskSpace | E174.1 | Our pack and model downloader, recorder, export | We check free space before downloading a pack or model (up to 575 MB, ADR 0015) or writing an export, and visibly decline or warn. Use 85F4.1 too only if Settings, Storage displays free disk space (not just our own files) |
| ActiveKeyboards | none | | Not used. Confirm no SDK uses it, including `whisper.rn` |

Engineering check before first submission: the security review (2026-10-04, L7) found no `ios.privacyManifests` in `apps/mobile/app.config.ts` and unverified required-reason use in React Native and `whisper.rn`. Add 3.3, search `node_modules/**/PrivacyInfo.xcprivacy` and `ios/Pods/**/PrivacyInfo.xcprivacy`, merge every reason found, rebuild, and inspect the archived `.ipa` before external TestFlight (C1). Apple's warning email after upload is the final check.

### 3.3 Proposed `app.config.ts` entry (Expo `ios.privacyManifests`)

The collected-data section must match section 1.2 exactly (here with the recommended Q-005 answer; with option (a), set `Linked` to false for ProductInteraction, PerformanceData, OtherDiagnosticData and PurchaseHistory, and drop Analytics from UserID; PurchaseHistory stays linked). Changed in 1.4.0: AudioData, DeviceID and the App Functionality purpose on PurchaseHistory. Verify the AudioData and DeviceID key names against [R2] before merge (not re-opened in this pass). Key names verified against Apple's documentation [R2].

```json
{
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
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeOtherUserContent", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeAudioData", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeDeviceID", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeUserID", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality", "NSPrivacyCollectedDataTypePurposeAnalytics"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePurchaseHistory", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality", "NSPrivacyCollectedDataTypePurposeAnalytics"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeProductInteraction", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAnalytics"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePerformanceData", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAnalytics"] },
        { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeOtherDiagnosticData", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAnalytics", "NSPrivacyCollectedDataTypePurposeAppFunctionality"] }
      ]
    }
  }
}
```

If due dates are ever kept on device only, remove `SensitiveInfo` here and in 1.2 together (checklist, section 5).

## 4. iOS permission strings (Info.plist), in our voice

Rules applied: VOICE.md (warm, calm, plain; no naming the technology; never gender the child; straight quotes; no dashes, ellipsis characters or emoji). Info.plist strings are static, so `{child}` can't be filled; we say "your child". `{app}` is filled from `packages/brand` at build time. Each string says what we use it for and where the data goes, which Apple's review checks.

| Key | String | Notes |
|---|---|---|
| `NSMicrophoneUsageDescription` | {app} uses the microphone to record the letters you speak to your child. | **Changed in 1.4.0** (F08-REQ-036; R4 PT-01; M16). 1.3.0's second sentence, "Your recordings stay on this phone.", is false for anyone who turns on backup, and iOS shows the string to every user. Keep only the first sentence. Owners: S16 (`packages/content/src/permissions.en.ts`), S20 (`apps/mobile/src/lib/permission-copy.ts`, `app.config.ts`); counsel approves. Asked the first time someone taps record, never at launch. If denied: `Allow the microphone in Settings to speak your letters. Or type instead.` |
| `NSPhotoLibraryUsageDescription` | Not used in v1.0 | No photo feature ships. Add only with photos (and prefer the system picker, which needs no library permission) |
| `NSPhotoLibraryAddUsageDescription` | Not used in v1.0 | Only if "Save to Photos" ships (pm-3 BK-10). Export goes through the share sheet, which does not need it |
| `NSCameraUsageDescription` | Not used | Omit; an unused permission string invites review questions |
| `NSFaceIDUsageDescription` | Not used in v1.0 | Only if an app lock ships (T5-14). Re-authentication before deletion uses the device passcode through LocalAuthentication; if Face ID is offered there, this string is required: "{app} uses Face ID to confirm it's you before deleting your account." |
| `NSSpeechRecognitionUsageDescription` | Not used | `whisper.rn` runs our own model and does not use Apple's Speech framework (LEGAL-REQ-007) |
| Notifications | No Info.plist string exists | iOS shows its own fixed prompt after our priming card. Plus reminders (Q-003) use the same permission; the one-time "Remind me before the free months end" ask comes first. New in 1.4.0: our server sends push through APNs (co-parent letter, passive; restore request, time-sensitive; F11-REQ-014, -029); payloads carry no letter text, names or ids |

Android equivalents (later): `RECORD_AUDIO` with an in-app explanation using the microphone string; `POST_NOTIFICATIONS` on Android 13+ after the priming card.

## 5. Consistency checklist before each submission

- [ ] Every "Yes" in 1.2 appears in the Privacy Policy section 3 table and in 3.3 `NSPrivacyCollectedDataTypes`, with the same Linked answer.
- [ ] The Q-005 answer (Linked or Not linked) is recorded in COUNSEL_PACKET Q7 and applied in 1.2, 1.4 and 3.3 together.
- [ ] Analytics allowlist (`packages/analytics`) still contains no strings over 40 characters, no names, no emails, no letter text; plan-state events present or absent matches the Purchases row.
- [ ] PostHog IP discard on, GeoIP off; no `identify` with account data; the SDK not constructed before opt-in.
- [ ] Backup (`capabilities.backup`) on or switchable on: Audio Data is Yes. If the submission build has no backup path at all, re-run the row with counsel. The microphone string is the one-sentence version in every case. No cloud transcription.
- [ ] Status report sends only the D-080 and D-081 fields plus `sub_ref` and `environment` (R4 PT-07; R8 R2A-21); Purchase History carries App Functionality.
- [ ] Push payloads carry no content or ids; Device ID answered with counsel.
- [ ] Privacy Policy 1.5.0 sections 3 and 15 list Audio Data, Purchase History and billing emails.
- [ ] No photo picker or photo upload in the build (otherwise Photos or Videos becomes Yes).
- [ ] No Sentry or other crash SDK in the build (otherwise Crash Data becomes Yes, and the analytics consent copy must name crash reports).
- [ ] Server `safety_events` table dropped on the production project (governance migration applied).
- [ ] Due-date mode still ships; if it is removed or kept on device only, remove Sensitive Info here and in 3.3.
- [ ] No face detection or recognition and no speaker features on audio (LEGAL-REQ-019).
- [ ] The `child-input` flag is off in the production build.
- [ ] No new SDK added since the last review (`apps/mobile/package.json` diff). If one was, re-run sections 1 to 3.
- [ ] Privacy policy URL live (https://earlyletters.com/privacy) at the version the app links to.

## Appendix. Sources

Opened 2 October 2026 unless marked:
- [R1] Apple, App privacy details on the App Store (data types, purposes, definitions of collect, linked, tracking, optional disclosure, free-form content, data not retained): https://developer.apple.com/app-store/app-privacy-details/ (the "considered linked" sentence as quoted by the analytics owner on 3 Oct 2026, TRACKING_PLAN section 10)
- [R2] Apple, Describing use of required reason API, and NSPrivacyAccessedAPIType: https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api ; https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype ; collected data type keys: https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacycollecteddatatypes/nsprivacycollecteddatatype
- [R3] Apple, Upcoming third-party SDK requirements: https://developer.apple.com/support/third-party-SDK-requirements/
- [R4] Google Play Console Help, Provide information for Google Play's Data safety section: https://support.google.com/googleplay/android-developer/answer/10787469
- [R5] Expo, Privacy manifests: https://docs.expo.dev/guides/apple-privacy/
- [R7] PostHog, Data collection and IP capture settings: https://posthog.com/docs/privacy/data-collection
- Repository (3 Oct 2026): `docs/analytics/TRACKING_PLAN.md` sections 0, 6, 7, 10; `packages/analytics/src/catalog.ts` (`plan_changed`, `plus_offer_closed`, `restore_result`); `apps/mobile/package.json`; `apps/mobile/app.config.ts`; `apps/mobile/src/lib/models/catalog.ts`; `packages/content/src/permissions.en.ts`; ADR 0013, 0015; DECISIONS D-023, D-053, D-059, D-061; `docs/reviews/2026-10-04-security-privacy.md` (L7).

Unverified: the exact CCPA "unique identifier" wording (counsel); which required-reason APIs `whisper.rn` and our StoreKit module use; whether Apple's App Store Connect crash reports need any declaration by us (we believe not).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.4.0 | 2026-10-15 | Draft for the server-on v1.0 (M14, D-089; F17 8.5; R4 PT-24). Audio Data No to Yes, Linked, App Functionality (D-073, M16; F08-REQ-038). Purchase History to Yes, Linked, App Functionality and Analytics (D-080, D-081; F14 Q-C9). Email Address adds billing and security emails (D-080; F02-REQ-017; F08 6.5 C7). Other User Content adds held letters (F14-REQ-039). Device ID Yes on a cautious reading, for counsel. Microphone string second sentence removed (F08-REQ-036; R4 PT-01). Notifications row: server push via APNs. Manifest (3.3) and checklist (5) updated. Replaces the D-088 "Data Not Collected" position (amended by D-089). Pre-submission draft; counsel signs off before submission (F17-REQ-028). |
| 1.3.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round. Purchases: no longer held on our server (D-053, ADR 0013); now "Yes, Analytics only" from opt-in plan-state events. Audio Data, Photos or Videos and Crash Data: No in v1.0 (D-059; no photo feature; no Sentry). Q-005 analysis written (1.3): recommended "Linked" for Usage Data, Diagnostics and Purchases, plus Analytics on User ID; tracking section stays empty; option (a) kept for counsel. Microphone string changed to "Your recordings stay on this phone." (D-061). SDK list updated (no RevenueCat, PowerSync, `expo-iap` or Sentry; Google Sign-In in v1.0, D-054). Download hosts noted. Play section deferred (Android later). Manifest JSON updated; security review L7 check added. Pre-submission draft; nothing published. |
| 1.2.0 | 2026-10-03 | Alignment with PRD.md 1.3 (ADR 0013, D-001): RevenueCat removed from the SDK list, Purchases source and identifiers; App Store `appAccountToken` described; `expo-iap` added; PowerSync conditional on D-023; Google Sign-In from v1.1. Labels unchanged in substance (Purchases stay Linked). |
| 1.1.0 | 2026-10-02 | Privacy review (`memos/lawyer-2.md`): Sensitive Info and Play Health info declared for the due date (PRD K-25); Purchases per account (K-28); analytics child-count note; "not linked" condition for analytics deletion; microphone string adds cloud transcription; stale reminder-string note resolved; checklist adds `safety_events` drop, due-date, biometric and child-input checks. Pre-submission draft; nothing published. |
| 1.0.0 | 2026-10-02 | First draft for counsel and engineering review. |

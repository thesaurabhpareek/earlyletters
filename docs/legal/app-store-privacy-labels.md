---
title: Early Letters App Privacy answers, privacy manifest and permission strings
version: 1.4.0
status: draft-for-counsel
last_updated: 2026-10-15
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD), iOS engineer
---

# App Privacy answers, privacy manifest and permission strings

Drafted for counsel. Not legal advice. Version 1.4.0 describes the v1.0 build under option B (founder, 15 Oct 2026; D-089 as proposed): sign-in, sync, co-parent sharing with two parents per book, encrypted recording backup with a recovery key we hold, and the subscription status report with reminder emails. There is no analytics SDK in v1.0 (D-095). These answers are statements to Apple: re-check each one against the release build before every submission, and keep them in line with the Privacy Policy (2.1.0) and the privacy manifest. Counsel approves this draft before App Store Connect is filled in (F17 section 8.5, F21-REQ-007; COUNSEL_PACKET Q54).

## 1. Apple's rules we rely on

Read on developer.apple.com/app-store/app-privacy-details/ on 15 Oct 2026 (BENCHMARK rows 1 to 4):

- **Collect** means "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time." Data processed only on the device is not collected.
- **Free-form fields.** Apple suggests "Other User Content" for generic free-form text and "Audio Data" for voice recordings, and does not ask us to disclose every kind of data people might type into a free-form field.
- **Linked.** Data is linked to the user unless it is stripped of direct identifiers (such as a user ID or name) before collection and never re-linked.
- **Tracking** means linking our data with third-party data for targeted advertising or advertising measurement, or sharing it with a data broker. We do neither.

## 2. History: why the earlier answer no longer holds

The pull request #81 draft (2.0.0, never merged) answered "Data Not Collected", because it described an on-device build without sign-in. Under option B the app creates accounts and sends letters, child details, encrypted recordings and plan status to our servers, so that answer is no longer true for v1.0 (D-089 amends D-088). It stays in this file's history only.

## 3. App Store Connect answers (v1.0, option B)

### 3.1 Top-level answers

| Question | Answer |
|---|---|
| Do you or your third-party partners collect data from this app? | **Yes** |
| Do you or your third-party partners use data for tracking? | **No.** No ad SDKs, no advertising identifier, no IDFV, no data brokers, no App Tracking Transparency prompt (LEGAL-REQ-016) |
| Privacy Policy URL | https://earlyletters.com/privacy (live at the version the build links to before submission) |
| Privacy choices URL | https://earlyletters.com/delete-account |

### 3.2 Data types

All purposes use Apple's names. "Linked" means linked to the user's identity. Every row is App Functionality only: there is no analytics, advertising or personalization purpose in v1.0.

| Category | Data type | Collected? | Linked? | Tracking? | Purpose | Why |
|---|---|---|---|---|---|---|
| Contact Info | Name | **Yes** | Yes | No | App Functionality | Display name and "what the child calls you"; name from Sign in with Apple or Google if shared |
| Contact Info | Email Address | **Yes** | Yes | No | App Functionality | Sign-in codes and links; new-device notices; account, deletion and backup recovery notices; Plus reminder emails from the status report (D-080). The website's mailing list is collected on the website, not by the app |
| Contact Info | Phone Number, Physical Address, Other User Contact Info | No | | | | Not requested |
| Health and Fitness | Health, Fitness | No | | | | We do not ask for health data. Health mentioned inside a letter is free-form content (section 1). The due date is declared under Sensitive Info |
| Financial Info | Payment Info, Credit Info, Other Financial Info | No | | | | Apple takes payment; we never see card data or receipts |
| Location | Precise, Coarse | No | | | | Not requested; no IP-derived location is stored |
| Sensitive Info | Sensitive Info | **Yes** | Yes | No | App Functionality | Apple lists "pregnancy or childbirth information". A due date, if the person starts the book before birth, syncs with the child profile |
| Contacts | Contacts | No | | | | Never requested. Invites go through the system share sheet |
| User Content | Emails or Text Messages | No | | | | |
| User Content | Photos or Videos | No | | | | No photo feature in v1.0 |
| User Content | Audio Data | **Yes** (changed in 1.4.0) | Yes | No | App Functionality | Recording backup, off until the owner turns it on, uploads each recording encrypted on the phone to the private Supabase Storage bucket `entry-audio`. We hold a recovery key that can open it under logged access (Privacy Policy section 4; D-091), so we treat it as collected. Counsel to confirm (Q54) |
| User Content | Gameplay Content, Customer Support | No | | | | Support happens by email outside the app |
| User Content | Other User Content | **Yes** | Yes | No | App Functionality | Letter text, original transcripts and the list of fixes, names and words, child profile (name, nickname, birthday), signature, co-parent membership, letters waiting at the Keep step |
| Browsing History, Search History | all | No | | | | In-app search runs on the local database |
| Identifiers | User ID | **Yes** | Yes | No | App Functionality | The Supabase account ID for sync, sharing and access control |
| Identifiers | Device ID | **Yes** (new in 1.4.0, recommended) | Yes | No | App Functionality | A random ID each install creates for backup and restore (`backup_devices`) and for new-device sign-in notices (`account_sessions_seen`), stored with the account. It is not the advertising identifier or IDFV. Apple's example list for Device ID is device-level IDs; declaring it is the cautious reading. Counsel to confirm (Q54) |
| Purchases | Purchase History | **Yes** (changed in 1.4.0) | Yes | No | App Functionality | The status report sends the plan, trial end date, renewal date and cancelled flag, and on first purchase a consent record (product, offer type, Subscription Terms version, time), so we can send the reminder emails (D-080, D-081). No receipts, prices or transaction IDs in clear. Apple defines Purchase History as "an account's or individual's purchases or purchase tendencies" |
| Usage Data | Product Interaction, Advertising Data, Other Usage Data | No (changed in 1.4.0) | | | | No analytics SDK in v1.0 (D-095): the PostHog client is never constructed and no usage event leaves the phone |
| Diagnostics | Crash Data, Performance Data, Other Diagnostic Data | No (changed in 1.4.0) | | | | No crash SDK and no analytics in v1.0. Apple's own crash reports reach us through App Store Connect under the user's Apple setting; that is Apple's collection |
| Surroundings, Body | all | No | | | | |
| Other Data | Other Data Types | No | | | | Push notification tokens are used only to deliver our notifications through Apple's service. Whether they need a row is a counsel question (Q54); default: no row |

**Download hosts.** Speech packs are to come from Cloudflare R2 (D-097; the code on 15 Oct still names `models.earlyletters.com`), and upstream model files from Hugging Face (`apps/mobile/src/lib/models/catalog.ts`) until they are mirrored. Those requests carry an IP address and a file name, are needed to service the request, and nothing is kept or linked by us. Not declared as a data type; disclosed in the Privacy Policy section 6 (COUNSEL_PACKET Q12).

### 3.3 What the label will show (expected)

- **Data Used to Track You:** none.
- **Data Linked to You:** Contact Info (Name, Email Address), User Content (Audio Data, Other User Content), Identifiers (User ID, Device ID), Purchases (Purchase History), Sensitive Info.
- **Data Not Linked to You:** none.

### 3.4 Build-state variants

| Build | Label |
|---|---|
| v1.0 as planned (server features on, `capabilities.backup` on) | Section 3.2 as written |
| Server features on, `capabilities.backup` off (the C1 build before T27) | As 3.2, but Audio Data No, and Device ID only if `account_sessions_seen` ships (F02-REQ-017) |
| Kill-path build (server features off) | Only what the build still sends; with sign-in off there are no Contact Info, Identifiers, Purchases or User Content rows. Re-run this file before submitting one |
| A later build with opt-in analytics (v1.1) | Add Usage Data and Diagnostics for Analytics, and Analytics on the identifier rows; the Linked or Not linked question (COUNSEL_PACKET Q7) returns |

## 4. Privacy manifest (`PrivacyInfo.xcprivacy`)

Owned by the release stream (S20, BL-349) in `apps/mobile/app.config.ts`. The collected data types must equal section 3.2 exactly:

```json
{
  "NSPrivacyTracking": false,
  "NSPrivacyTrackingDomains": [],
  "NSPrivacyCollectedDataTypes": [
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeName", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeEmailAddress", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeSensitiveInfo", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeAudioData", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeOtherUserContent", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeUserID", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypeDeviceID", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] },
    { "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePurchaseHistory", "NSPrivacyCollectedDataTypeLinked": true, "NSPrivacyCollectedDataTypeTracking": false, "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"] }
  ]
}
```

Required-reason API declarations stay as 1.3.0 listed them (UserDefaults CA92.1, file timestamps C617.1, system boot time 35F9.1, disk space E174.1); the Apple pages that define the reasons are rendered by JavaScript and were not readable here on 15 Oct 2026, so the reason codes are unverified (BENCHMARK row 13). Confirm on the first TestFlight upload; Apple's warning email after upload is the final check. The key names above were verified on 2 Oct 2026 and not re-read.

## 5. Permission strings (Info.plist)

| Key | String | Notes |
|---|---|---|
| `NSMicrophoneUsageDescription` | {app} uses the microphone to record the letters you speak to your child. | **Changed in 1.4.0.** The second sentence ("Your recordings stay on this phone.") is dropped: a purpose string is shown to every user and must be true whatever their backup setting (F08-REQ-036, R4 PT-01). Request to the content owner (S16) for `packages/content/src/permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts` |
| Notifications | No Info.plist string | iOS shows its own prompt after our priming card. Used for writing reminders (local), plan reminders (local), co-parent letter notices and backup restore requests (sent by our server through Apple's service, with no letter text and no names) |
| `NSFaceIDUsageDescription` | Not used unless the app lock ships (F17, P1) | If it ships: "{app} uses Face ID to open the app and confirm it's you." Needs a LEGAL-REQ-007 amendment (F17 Q3) |
| Photos, camera, speech recognition, location, contacts, tracking | Not used | |

## 6. Check before each submission

- [ ] Section 3.2 matches the Privacy Policy section 2 and the manifest, with the same Linked answers.
- [ ] Backup state of the build matches the row chosen in 3.4.
- [ ] No analytics or crash SDK is constructed (`EXPO_PUBLIC_ANALYTICS` off in every profile, D-095); if one is, re-run section 3.
- [ ] The status report sends only the D-080 and D-081 fields (LEGAL-REQ-062); otherwise Purchases and Financial Info change.
- [ ] The microphone string is the one in section 5.
- [ ] No photo picker, no new SDK since the last review (`apps/mobile/package.json` diff).
- [ ] Review notes describe sign-in, backup and the recovery key, and give a demo account with a two-parent book for the fictional child Asha (F21 6.4).
- [ ] The Privacy Policy URL is live at the version the app links to.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.4.0 | 2026-10-15 | Drafted for option B (founder, 15 Oct 2026; D-089 as proposed; F17 8.5, R4 PT-24): Audio Data Yes (backup with a recovery key we hold, D-091); Purchase History Yes for App Functionality (status report, D-080, D-081); Email adds billing reminders; Device ID added (random install ID for backup and new-device notices; counsel to confirm); Usage Data and Diagnostics No (no analytics SDK in v1.0, D-095); every row App Functionality; microphone string drops "Your recordings stay on this phone."; build-state variants; manifest to match. The 2.0.0 answer of pull request #81 ("Data Not Collected", on-device build, never merged) is superseded and kept only in this history. Draft for counsel. |
| 1.3.0 | 2026-10-03 | Draft for the signed-in build without backup or the status report, with opt-in analytics and the Linked analysis. Earlier text and its changelog are in git history. |

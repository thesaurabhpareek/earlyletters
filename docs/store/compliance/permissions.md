# Permissions list and exact usage-description strings

Checked against `apps/mobile/app.config.ts`, `apps/mobile/src/lib/permission-copy.ts`, `apps/mobile/package.json` and the `expo-audio` config plugin (`node_modules/expo-audio/plugin/build/withAudio.js`) at HEAD `3ce511e`. No prebuild was run, so the merged `Info.plist` and `AndroidManifest.xml` are inferred from the plugin code and must be checked after `expo prebuild` (OPEN-19, OPEN-20).

Rule for every permission: ask at the moment the feature is used, never at launch, with a string that says what it is for and where the data goes. An unused permission string invites review questions (Guideline 5.1.1), so only the permissions the build actually needs are listed.

## 1. iOS: permissions the build requests

### 1.1 Microphone (the only runtime permission in the current build)

| Item | Value |
|---|---|
| Info.plist key | `NSMicrophoneUsageDescription` |
| Set by | `expo-audio` plugin, option `microphonePermission`, fed from `permissionCopy.microphone` in `permission-copy.ts` with `{app}` replaced by `brand.name` |
| When asked | First time the person taps Speak: `listen.tsx` `start()` calls `requestRecordingPermissionsAsync()` when the screen opens. Never at launch |
| If denied | Screen "We can't hear you yet": "Allow the microphone in Settings to speak your letters. Or type instead." with Open Settings and Type instead (`strings.en.ts` `errors.micDenied`) |
| Background recording | Off. `enableBackgroundRecording: false`, `enableBackgroundPlayback: false`, so no `UIBackgroundModes` `audio` is added (LEGAL-REQ-011) |

**Exact string as it will appear (current code):**

```
Early Letters uses the microphone to record the letters you speak to your child. Your recordings stay on this phone unless you choose to back them up, share them with family, or use cloud transcription.
```

(202 characters.) It follows the content rules (straight punctuation, no dashes, "your child" because Info.plist strings cannot fill `{child}`).

**OPEN-14.** In the current build there is no backup, no family sharing and no cloud transcription, so the second sentence describes options that do not exist. Apple reviews purpose strings for accuracy. For Profile A, use this shorter, fully accurate string by changing `permissionCopy.microphone` (an edit to `permission-copy.ts` that is outside this pack):

```
Early Letters uses the microphone to record the letters you speak to your child. Your recordings stay on this phone.
```

For Profile B, keep the long string only for the options that ship. If cloud transcription is not offered, drop "or use cloud transcription"; if backup and sharing ship, keep those two. Counsel review of the wording is still pending (header of `permission-copy.ts`).

### 1.2 Permissions deliberately not requested (and no string present)

| Permission / key | Status in code | Why it is absent |
|---|---|---|
| `NSSpeechRecognitionUsageDescription` | Not present | Speech to text uses an on-device model through whisper.rn, not Apple's Speech framework. LEGAL-REQ-007: microphone only, never speech recognition. Add only if Apple speech is adopted |
| `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryAddUsageDescription` | Not present | No image picker or camera package in `package.json`. If photo attach ships (OPEN-27) prefer the system photo picker, which needs no permission. Draft strings if ever needed: `docs/legal/app-store-privacy-labels.md` section 4 |
| `NSFaceIDUsageDescription` | Not present | No app lock |
| `NSUserTrackingUsageDescription` | Not present | No tracking (PRD C-NFR-005) |
| `NSContactsUsageDescription`, location keys, `NSBluetooth*`, `NSLocalNetworkUsageDescription` | Not present | Never requested. After prebuild confirm that `expo-dev-client` (a production dependency in `package.json`) leaves no development-only keys (local network, Bonjour) in a **release** `Info.plist` |
| Push notifications | Not requested | No `expo-notifications` package; reminder choices are saved but nothing is scheduled (`settings/reminders.tsx`). When built, iOS shows its own fixed prompt after the app's priming card (title "A gentle nudge, now and then?", per `docs/legal/app-store-privacy-labels.md` section 4). Needs the Push Notifications capability |
| Sign in with Apple | Not present | Profile B only. Needs the capability and `expo-apple-authentication` (or equivalent) (OPEN-18) |
| In-App Purchase | Not present | Profile B only. Needs the capability and `expo-iap` (OPEN-18) |
| Associated Domains | Not present | Profile B only (invite universal links, needs the real domain, OPEN-02) |
| Background modes | None | Audio background modes are explicitly off |

Other `app.config.ts` facts: `supportsTablet: false`; `CADisableMinimumFrameDurationOnPhone: true`; `ITSAppUsesNonExemptEncryption` missing (OPEN-15); `ios.privacyManifests` missing (OPEN-19).

## 2. Android: permissions the build will request

From the `expo-audio` plugin with the options in `app.config.ts` (both background options false, `recordAudioAndroid` defaults to true):

| Permission | Why | Runtime prompt | Notes |
|---|---|---|---|
| `android.permission.RECORD_AUDIO` | Record the spoken letter | Yes, on first Speak | Dangerous permission. Play requires the Data safety form to cover Audio if recordings leave the device (OPEN-14) |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Audio session handling around recording and playback | No (normal) | |

Not requested because the background options are off: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `FOREGROUND_SERVICE_MICROPHONE`, `POST_NOTIFICATIONS`. The plugin also removes its two audio services from the manifest when both options are false.

Expected from the Expo template or other modules and **unverified** until a prebuild is read (OPEN-20): `android.permission.INTERNET` (Expo default; unused in Profile A), `android.permission.VIBRATE` (`expo-haptics`). Check for legacy storage permissions (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW`) that some templates add; if present, block them with `android.blockedPermissions` so the Play listing does not show permissions the app does not use.

Android has no usage-description string. Show an in-app explanation before the system prompt, reusing the microphone string above. For Android 13 and later, `POST_NOTIFICATIONS` is requested only after the priming card, when reminders are built. Use the Android photo picker so no media permission is needed (OPEN-27).

## 3. Quick reference for the store forms

| Question | Answer |
|---|---|
| Permissions shown to the user at runtime (iOS) | Microphone only |
| Permissions shown to the user at runtime (Android) | Microphone only |
| Background microphone use | No |
| Camera, photos, contacts, location, Bluetooth, health data, motion | None requested |
| Notifications | Not in the current build; Profile B reminders use one priming card then the system prompt |

## 4. Privacy manifest (iOS) required-reason APIs

Apple rejects uploads that use required-reason APIs without declared reasons, and each SDK must carry its own manifest. Manifests that exist in `node_modules` for modules this app links:

| Module | Categories and reasons it declares |
|---|---|
| `react-native` (React resources, timing) | UserDefaults `CA92.1`; FileTimestamp `C617.1`; SystemBootTime `35F9.1` |
| `expo-file-system` | FileTimestamp `0A2A.1`, `3B52.1`; DiskSpace `E174.1`, `85F4.1` |
| `expo-constants`, `expo-system-ui` | UserDefaults `CA92.1` |
| `expo-device` | SystemBootTime `35F9.1` |

No `PrivacyInfo.xcprivacy` was found for `expo-audio`, `expo-sqlite`, `whisper.rn` or our own `scribe-files` module. Expo notes that Apple does not always read manifests inside static pods, so merge the reasons above into the app's own `ios.privacyManifests` and read Apple's post-upload warning email. The proposal in `docs/legal/app-store-privacy-labels.md` section 3.3 (UserDefaults `CA92.1`, FileTimestamp `C617.1`, SystemBootTime `35F9.1`, DiskSpace `E174.1`) is a reasonable base. Add `0A2A.1`/`3B52.1` only if the prebuilt dependencies need them. Keep `NSPrivacyTracking` false and `NSPrivacyTrackingDomains` empty. For Profile A, `NSPrivacyCollectedDataTypes` stays empty; for Profile B it must equal the table in `privacy-labels-apple.md`.

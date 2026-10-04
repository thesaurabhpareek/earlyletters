---
title: Early Letters App Privacy answers, privacy manifest and permission strings
version: 2.0.0
status: draft-for-counsel
last_updated: 2026-10-04
effective_date: TBD
owner: founder
reviewers: outside privacy counsel (TBD), iOS engineer
---

# App Privacy answers, privacy manifest and permission strings

These answers describe the first version of the iPhone app: everything stays on the phone, no account, no sync. They are statements to Apple, so re-check each one against the actual release build before every submission, and keep them in line with the Privacy Policy (2.0.0).

## 1. Apple's rule we rely on

Apple says "collect" means transmitting data off the device in a way that lets you or your partners access it for longer than needed to service the request in real time, and that data processed only on the device is not collected and need not be disclosed (https://developer.apple.com/app-store/app-privacy-details/, read 4 Oct 2026).

## 2. App Store Connect answers

| Question | Answer |
|---|---|
| Do you or your third-party partners collect data from this app? | **No, Data Not Collected**, for a build without a usage-reports key (section 3) |
| Tracking | **No.** No ad SDKs, no advertising ID, no tracking prompt |
| Privacy Policy URL | https://earlyletters.com/privacy |

Why Data Not Collected holds for v1.0: letters, recordings, child details, settings and Plus status stay on the phone. Speech model downloads send only an IP address and a file name, used to answer the request. There is no sign-in and no server of ours in the app (`EXPO_PUBLIC_SERVER_FEATURES=off` in every `eas.json` profile; no Supabase client is built). Speech recognition runs on the phone (`whisper.rn`). StoreKit purchases are checked on the phone.

## 3. If usage reports ship

The PostHog SDK (`posthog-react-native`) is linked, but it is not loaded until a person says yes, and it does nothing unless `EXPO_PUBLIC_POSTHOG_KEY` is set in the build. If the production build has that key, change the answer to Yes and declare, for Analytics only: Usage Data (Product Interaction), Diagnostics (Performance Data, Other Diagnostic Data) and Identifiers (User ID, a random ID). Whether to mark them Linked or Not linked is a question for counsel (COUNSEL_PACKET.md); declaring Linked is the cautious default. Tracking stays No. Update `NSPrivacyCollectedDataTypes` in `app.config.ts` to match in the same change.

<!-- TODO(founder): decide whether v1.0 ships with the PostHog key. Without it, the consent sheet and Settings toggle ask for something that does nothing. -->

## 4. Privacy manifest

`apps/mobile/app.config.ts` sets `NSPrivacyTracking` false, no tracking domains, no collected data types (matching section 2), and declares required-reason API use for UserDefaults (CA92.1), file timestamps (C617.1), system boot time (35F9.1) and disk space (E174.1). The disk space reason is marked unverified in the config: confirm it on the first TestFlight upload, and treat Apple's warning email after upload as the final check. Third-party SDKs must ship their own manifests. Re-check after every native dependency change.

## 5. Permission strings

| Key | String |
|---|---|
| `NSMicrophoneUsageDescription` | {app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone. |

No other permission strings are used: no photos, camera, Face ID, speech recognition or location. Notifications use the system prompt, for reminders only. If the microphone is denied, the app offers typing instead.

## 6. Check before each submission

- [ ] Privacy answers match section 2 or 3, the Privacy Policy and `NSPrivacyCollectedDataTypes`.
- [ ] `EXPO_PUBLIC_SERVER_FEATURES` is `off` in the production profile.
- [ ] No audio upload, backup or cloud transcription in the build; if there is, Audio Data becomes Yes and the microphone string changes.
- [ ] No photo feature, crash SDK or other new SDK since the last review (`apps/mobile/package.json` diff).
- [ ] Review notes describe the sign-in, sync and co-parent code that stays in the build behind the switch (App Review 2.3.1(a), no hidden or dormant features).
- [ ] Privacy Policy URL is live at the version the app links to.

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-10-04 | Rewritten for the first version: Data Not Collected, with the PostHog alternative marked. Removed Supabase, Google Sign-In, Sentry and Cloudflare, the Linked analysis, the Google Play form and the long manifest listing (now in app.config.ts). Nothing is published. Earlier text is in git history. |
| 1.3.0 | 2026-10-03 | Draft for the server version. |

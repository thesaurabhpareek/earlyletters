# Permissions and disclosure matrix

Status: PROPOSED. Not a requirement until the founder accepts it. Author: privacy engineer. Read on develop at 841e9c4, 20 Nov 2026.

Founder ask (20 Nov 2026): everything we access is covered in the Terms of Service and Privacy Policy a parent accepts at sign-up, and anything the phone guards (location, and especially photos) is asked for with the standard iOS permission popup.

Legend. iOS modal: Apple's own permission alert. System picker: Apple's picker, no permission. In-app consent: our own sheet. GAP: not covered where it should be. UNVERIFIED: not confirmed by reading code or a document this session. Doc references: PP = privacy-policy.md, ToS = terms-of-service.md, IAD = in-app-disclosures.md, LBL = app-store-privacy-labels.md (all under docs/legal).

## 1. Matrix

| # | Access or collection | Mechanism | Purpose-string key (content and app.config.ts) | When shown | If the parent says No | ToS | PP | IAD | Store label | Fix owner |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Microphone | iOS modal | `permissions.microphone` in packages/content/src/permissions.en.ts; mirrored in apps/mobile/src/lib/permission-copy.ts; written as NSMicrophoneUsageDescription through the expo-audio plugin (app.config.ts, `microphonePermission`) | Our primer first (`speech`-area `primer`, strings.en.ts about line 330: "Your phone will ask about the microphone"), shown once on the first Speak tap; then the iOS modal | Parent can type instead (`errors.micDenied.typeButton`) | Covered by service description, no explicit mic clause UNVERIFIED | PP 2 (recordings), PP "How speech becomes text" | IAD 1 row "Microphone permission" | LBL 5 row NSMicrophoneUsageDescription; audio is not collected until backup ships (LBL 3.2) | none; wording is counsel-pending |
| 2 | Notifications (local reminders, plan reminders) | iOS modal | None (no Info.plist string; LBL 5). Requested in apps/mobile/src/lib/reminders/scheduler.ts line 302 (alert only, no badge, no sound) | After our priming card (LBL 5 says so); primer string key UNVERIFIED (not found by grep) | Reminders are not scheduled; app works | no clause UNVERIFIED | PP 2 ("Your reminder times stay on your phone"), PP 5 | IAD 1 row "Plan reminders and in-app note" | LBL 5 row "Notifications" | privacy engineer to confirm primer exists; legal for ToS |
| 3 | Face ID, app lock | iOS modal (first use of Face ID) | `permissions.faceId`; NSFaceIDUsageDescription through expo-local-authentication plugin (app.config.ts, `faceIDPermission`) | When the parent turns the lock on; primer UNVERIFIED | Passcode fallback or lock stays off | none | PP 2 says "never create a voiceprint or any other biometric identifier"; Face ID stays in iOS, we receive a yes or no (UNVERIFIED in code this session) | no row | GAP: LBL 5 says Face ID "Not used unless the app lock ships"; the lock ships and the plugin writes the key | legal (LBL 5 and a PP sentence); data-architect not needed |
| 4 | Photos | System picker (PHPickerViewController, no library permission) | None, by design. apps/mobile/modules/scribe-photo/ios/ScribePhotoModule.swift line 135 and 139; podspec says "no permission request"; test apps/mobile/test/photos-device.test.ts line 326 fails the build on PHPhotoLibrary, requestAuthorization, UsageDescription | Parent taps add photo; iOS shows its picker, parent chooses each picture; no popup | Parent cancels the picker; nothing is read | GAP: no clause on photos UNVERIFIED | GAP: PP 45 says "We do not collect ... photos". The app reads and stores a picked photo (re-encoded JPEG, no metadata). Whether it syncs to our servers is UNVERIFIED | GAP: no photo row | GAP: LBL 3.2 row Photos or Videos says "No. No photo feature in v1.0" and LBL 5 says photos "Not used"; the feature now exists in apps/mobile/src/lib/photos | legal and privacy engineer |
| 5 | Camera | None | None; the same test forbids AVCapture and UIImagePickerController. The picker's own camera is not enabled UNVERIFIED | Never | n/a | n/a | n/a | n/a | LBL 5 "Not used", correct | none |
| 6 | Location | None | None. No expo-location, CoreLocation or CLLocation in apps or packages (grep, whole app and packages, this session; photo module test also forbids it) | Never | n/a | n/a | PP 45 "We do not collect your location": matches code. Caveat: the sign-up country check (PP 12) uses the IP address server side; PP 45 says it keeps no location | n/a | LBL 3.2 Location: No, matches | none; keep the code test |
| 7 | Contacts | None | None. invite-sheet.test.ts line 107 forbids expo-contacts; invites use the share sheet | Never | n/a | n/a | PP 45 matches | n/a | LBL 3.2 Contacts: No, matches | none |
| 8 | Email address and sign-in (Apple, Google, email code) | In-app consent, plus Apple's own sign-in sheet | none | Agreement line on sign-in and Before you begin screen (see section 2) | Parent uses the app on the phone without an account (ToS 3.1) | ToS 1.3, 3.1 | PP 2 "Your account" | IAD 1 row "Sign-in agreement line" | LBL 3.2 Name, Email, User ID: Yes | none, subject to section 2 gaps |
| 9 | Child details (name or nickname, birthday or due date) | In-app consent (sensitive-data agreement before first sync) | none | One screen after a new account, before first sync (IAD 1) | Keep on this phone | ToS 5 | PP 2 "Your book", PP 8, PP 9 | IAD 1 row "Sensitive-data agreement" | LBL 3.2 Other User Content, Sensitive Info (due date): Yes | none |
| 10 | Letters and recordings | In-app consent for sync; recordings stay on phone | none | Sensitive-data agreement; recording is only on the phone today | Keep on this phone | ToS 5, 6, 7 | PP 2, 3, 4 | IAD 1 rows "Voice line", "Sensitive-data agreement" | LBL 3.2 Other User Content Yes; Audio Data No until backup ships | none |
| 11 | Backup and sync | In-app consent (sync); backup sheet (backup not built) | none | Sync: sensitive-data agreement. Backup: backup sheet, off in every eas.json profile read (EXPO_PUBLIC_BACKUP off) | Sync off, book stays on the phone | ToS 7 | PP 4 (effective only when backup ships) | IAD 1 rows "Backup sheet", "Backup off" | LBL 3.4 variants | none today |
| 12 | Analytics (founder: ships in production, opt-in) | In-app consent sheet; no iOS modal; no App Tracking Transparency prompt | none (no Info.plist key). Choice stored by packages/analytics/src/consent.ts: `unknown`, `granted`, `denied`; nothing sent or queued until granted. Copy: `analyticsConsent` in strings.en.ts line 1084 | After first use (apps/mobile/src/lib/analytics/ask-sequencer); exact trigger UNVERIFIED | Same as never asked: nothing is sent | GAP: no analytics clause UNVERIFIED | GAP: PP "Which builds" says "Analytics. There are none in any build"; PP 45 says no analytics | GAP: no analytics row (only the "Trust promise" row) | GAP: LBL 3.2 Usage Data and Diagnostics say No; LBL 3.4 schedules analytics for v1.1; the privacy manifest in apps/mobile/src/lib/privacy-manifest.ts follows build switches. eas.json profiles read all set EXPO_PUBLIC_ANALYTICS off | analytics, privacy engineer (switch and manifest), legal (PP, label) |
| 13 | Crash data | None collected by us | none | Never | n/a | n/a | PP 45 "no ... crash reports" | n/a | LBL 3.2 Diagnostics No; Apple's own crash reports are Apple's collection. No crash SDK found in apps/mobile/package.json by grep UNVERIFIED (grep returned nothing) | none |
| 14 | Subscriptions via Apple | Apple's purchase sheet | none | Parent opens Plus | Parent stays on free plan | ToS 8, Subscription Terms | PP 2 "Plus" | IAD 1 rows "Plus text above Apple's plans", "Purchase confirmation" | LBL 3.2 Purchase History: No while status report off | none |
| 15 | Model and pack downloads (network, no permission) | In-app consent card (`speechConsentCopy`) | none | First-run speech card | Parent declines the download | UNVERIFIED | PP "How speech becomes text" says nothing is sent to a speech service; the download itself is not a PP row UNVERIFIED | UNVERIFIED | LBL 3.2 "Download hosts" note | legal |

## 2. How sign-up acceptance works today

- ToS 1.3 (line 34): "You accept these Terms by using the Service, and again when you create an account."
- IAD 1 row "Sign-in agreement line": above the sign-in buttons, "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy" (versioned links). Code: `agreeLine` in packages/content/src/features/auth.en.ts line 17, also used on the consent screen and the Welcome sheet.
- Before you begin screen (strings.en.ts about line 1555, founder decision F2): an age question and an unticked box, "I agree to the Terms of Service and Privacy Policy." The sentence is hashed and stored locally (apps/mobile/src/lib/age-gate.ts, `acceptBeforeYouBegin`; agreements.logic.ts). The comment says "Q-D (agree or acknowledge the Privacy Policy) is with counsel."
- PP 2 says we keep the version of the Terms accepted and the agreements given or withdrawn.

## 3. Gaps against the founder's ask

1. Photos: PP 45, LBL 3.2 and LBL 5 all say no photos, yet the app now stores parent-picked photos. Whether they sync is UNVERIFIED. Neither the Terms nor the Privacy Policy tells the parent about them at sign-up.
2. Analytics: PP, IAD and LBL say none or v1.1; the founder now says production ships it behind opt-in. All eas.json profiles read set it off.
3. Face ID: LBL 5 is stale (lock ships).
4. Sign-up acceptance names the documents but no list of what the app touches. A parent who ticks the box is not told in one place about microphone, notifications, Face ID, photos picked, reminders, analytics choice. The Terms have no section for device access.
5. Acceptance is a bare link agreement; whether the sign-in screen and Before you begin screen are one acceptance or two is UNVERIFIED, and counsel Q-D is open.
6. Notifications and Face ID primer strings not confirmed (UNVERIFIED).
7. A server-side acceptance record (`policy_acceptances`, per PP 2 and consent.ts header) was not read this session: UNVERIFIED.

## 4. Founder decision: photo access level

Default (shipped): system picker, no permission, no popup, the parent picks each picture. This is the least we ask. Alternative: request full or limited library access through the iOS photo permission popup, which would let the app suggest pictures by date. It is a larger ask, needs an NSPhotoLibraryUsageDescription string, a primer, new Terms and Privacy text, a label change and removal of the code test at photos-device.test.ts line 326. Recommendation: keep the default. Decision needed from the founder.

## 5. Proposed text changes (docs/legal is founder-only; not edited here). All counsel-must-confirm.

| File | Section | Proposed sentence | Status |
|---|---|---|---|
| terms-of-service.md | New 3.5 | "To work, the app may ask your phone for the microphone, notifications and Face ID. You choose each one in your iPhone's own question, and you can change it in iPhone Settings. You add photos one at a time with Apple's picker; we never see the rest of your photos." | counsel-must-confirm |
| terms-of-service.md | 1.3 | Keep as is; add "The agreement line you see when you sign in is your acceptance." | counsel-must-confirm |
| privacy-policy.md | 2, "What we do not collect" (line 45) | Replace "photos" with "your photo library. If you add a picture to a letter, we keep that one picture (section 2)." Add whether synced. | counsel-must-confirm |
| privacy-policy.md | "Which builds" | Replace "Analytics. There are none in any build." with a sentence that analytics are off until you say yes and never include letter text, names or recordings. | counsel-must-confirm |
| privacy-policy.md | 2 | "If you turn on the app lock, Face ID stays on your iPhone; we receive only that it worked." | counsel-must-confirm |
| in-app-disclosures.md | 1 | New rows: photo picker line, analytics consent sheet, Face ID. | counsel-must-confirm |
| app-store-privacy-labels.md | 3.2, 5 | Photos or Videos row; Usage Data and Diagnostics rows when analytics is on; Face ID row. | counsel-must-confirm |

## 6. Not verified this session

Server-side policy acceptance record; whether photos sync; the notifications and Face ID primer strings; the analytics ask trigger; every eas.json profile beyond the first five EXPO_PUBLIC_ANALYTICS matches; Apple's current guideline wording.

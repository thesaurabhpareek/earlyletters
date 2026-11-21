# Permissions and Terms audit (founder instruction, 20 Nov 2026)

Status: AUDIT, read-only on code. Author: privacy engineer. Read on `develop` at `5aecb3f` (sparse depth-1 clone). Companion to `docs/product/prd/PERMISSIONS-AND-DISCLOSURE-MATRIX.md` (#1054, PROPOSED). Nothing was run on a phone. Docs only: no requirement, legal or code file is edited; changes are proposals.

Founder instruction: every permission uses the standard iOS popup (photos use the system picker, so no photo permission), with our own words only before or after. Tracking must be none.

Legend: OK = read in a file this session. GAP = missing or contradicts. UNVERIFIED = not confirmed (file not read, or only a comment says so).

## 1. Result in one table

| # | Permission | iOS mechanism | (a) Plist string, plain | (b) Requirement, BL row, screen path | (c) Copy follows content rules | (d) Where the parent is told / accepts |
|---|---|---|---|---|---|---|
| 1 | Microphone | iOS popup | OK. `NSMicrophoneUsageDescription` via expo-audio, `microphonePermission` (`app.config.ts`); text "{app} uses the microphone to record the letters you speak to your child." (`permissions.en.ts`, mirrored in `permission-copy.ts`). Background recording off | Req: LEGAL-REQ-007 (OK). BL: BL-381 (permission card; OK). Path: PATH-02 (OK). Primer requirement ids SR-C-05, F04-REQ-034 are cited in a strings comment only: UNVERIFIED | OK. Primer `listen.primer.*` has no dashes, curly quotes or emoji (scan: 0 hits). `{child}` used. Test `rules.test.ts` not run: UNVERIFIED | Primer then iOS popup. No microphone clause in the Terms (grep of `terms-of-service.md`: no hit). Privacy policy covers recordings (matrix row 1) |
| 2 | Notifications (local only) | iOS popup | OK, none needed. `requestPermissionsAsync({ios:{allowAlert:true, allowBadge:false, allowSound:false}})` at `reminders/scheduler.ts:296`. `aps-environment` removed by `withoutRemotePush` (`app.config.ts`) | Req: F13-REQ-019 (quiet window, cited in BACKLOG; the F13 file not read: UNVERIFIED). BL: BL-151, BL-157, BL-943. Path: PATH-03, PATH-13 | OK. `reminderCopy.priming.privacyLine` and `.quietLine`, `.settings.deniedTitle` have no banned characters. Open: BL-474 (notification copy says "we") is needs-decision | Footer lines on the Reminders page, then iOS popup. No Terms clause. LBL 5 says "after our priming card"; PATH-03 says the footer is the primer. Wording conflict, see gap 6 |
| 3 | Face ID and app lock | iOS popup (first Face ID use) | OK. `NSFaceIDUsageDescription` via expo-local-authentication `faceIDPermission`; "{app} uses Face ID to open your book and confirm it is you." | Req: LEGAL-REQ-007 amendment (F17 Q3), F1 (cited; F1 file not read: UNVERIFIED). BL: no BL row titled App lock found; only BL-782 ("Extends ... F1, the app lock, #640") and BL-314 row. Path: PATH-04 | OK for the plist string. The App lock screen copy is not in `packages/content` (grep "App lock": only reminders `lockNames` and testflight text); where it lives is UNVERIFIED | Our line above the switch is CONTENT-NEEDED (PATH-04). No Terms clause. Label doc is stale, see gap 3 |
| 4 | Photos | System picker (`PHPickerConfiguration`, no permission) | OK, none by design. No `NSPhotoLibraryUsageDescription` in `app.config.ts`; no image-picker, media-library or camera package in `apps/mobile/package.json`; `ScribePhotoModule.swift` uses PHPicker only. Test `photos-device.test.ts` (fails the build on PHPhotoLibrary etc.): existence only, not run | Req: NS-01 (PRD 01), LEGAL-REQ-007 ("photos use the system picker"). BL: BL-931, BL-544, BL-847. Path: PATH-09 (DARK in Build 13; `EXPO_PUBLIC_PHOTOS` is not in `eas.json`) | PATH-09 copy keys are all CONTENT-NEEDED, so (c) cannot be checked | Sign-up device-access line is CONTENT-NEEDED (PATH-01). Privacy policy line 45 and LBL 3.2/5 still say no photos: GAP, see gap 2 |
| 5 | Tracking (ATT) | none | OK. No `NSUserTrackingUsageDescription`; no tracking-transparency package; privacy manifest `NSPrivacyTracking: false`, `NSPrivacyTrackingDomains: []` (`privacy-manifest.ts`) | Req: LEGAL-REQ-016 ("No ATT prompt"), LEGAL-REQ-007. BL: BL-117 (denylist of AppTrackingTransparency, status ready, so the CI scan is not yet proven). Path: none, correct for none | n/a | Label rows say Not used (LBL 5). OK |
| 6 | Camera, location, contacts, calendar | none | OK. None in `app.config.ts` or `package.json` (no expo-camera, location, contacts, calendar). Contacts guard test `invite-sheet.test.ts` cited by the matrix: UNVERIFIED this session | Req: LEGAL-REQ-007 ("never requested"). BL: none needed. Path: none | n/a | Privacy policy line 45 matches (matrix row 6, 7) |
| 7 | Analytics (not an OS permission) | Our sheet. No iOS popup, and ATT must not be used | OK, no plist key | Req: `packages/analytics/src/consent.ts`; DATA-REQ-004 / LEGAL-REQ-014 (cited in agent brief). BL: BL-023, BL-389. Path: PATH-05, PATH-06 | OK for `analyticsConsent.*`: no banned characters; equal-weight buttons per PATH-05 | Sheet after first kept letter. Privacy policy "Which builds" still says no analytics; `eas.json` sets `EXPO_PUBLIC_ANALYTICS` off in the five profiles read |
| 8 | Terms and Privacy at first run | Our own screens. No Apple popup exists for Terms | n/a | Req: LEGAL-REQ-001, LEGAL-REQ-002. BL: BL-565, BL-564, BL-579, BL-866. Path: PATH-01 | OK for `agreeLine` (auth.en.ts:17) and `beforeBegin.*` (0 banned characters) | See section 3 |

## 2. Gaps

1. The instruction "the Terms disclosure must use the standard iOS popup" cannot be met as written: iOS has no popup for accepting Terms. What can be true: every device permission uses the iOS popup (met for microphone, notifications, Face ID; photos use the picker), and the Terms are accepted on our screens with a line that is a notice, not a grant (PATH-01 "Never"). The founder should confirm this reading.
2. Photos: `privacy-policy.md` line 45 and `app-store-privacy-labels.md` 3.2 ("No photo feature in v1.0") and 5 contradict NS-01. Terms have no clause. Whether a picked photo syncs is UNVERIFIED.
3. Face ID: `app-store-privacy-labels.md` line 116 says "Not used unless the app lock ships" and quotes a different string ("open the app and confirm it's you") than the code ("open your book and confirm it is you"). The lock ships. The code string is the plain one; the label doc is stale.
4. Terms (`terms-of-service.md`) have no device-access clause (microphone, notifications, Face ID, photo picker). PATH-01's device-access line is CONTENT-NEEDED and its key (`consent.deviceAccessLine`) does not exist.
5. No BL row for the app lock itself, and no BL row for the device-access line or the Face ID primer line (`appLock.faceIdLine`, CONTENT-NEEDED).
6. Notifications primer: LBL 5 says "our priming card"; PATH-03 says the footer is the primer and the D-S04 card is shown once after the first kept letter. One of them is stale. Also no screen path covers where the Terms acceptance is stored server side.
7. `permission-copy.ts` still duplicates `permissions.en.ts` (a drift test guards it, not run here).

## 3. Terms and Privacy at first run, and where each is accepted

| Step | Where | What is shown | Where accepted or recorded | Status |
|---|---|---|---|---|
| Before you begin | Age gate screen (`strings.en.ts` `ageGate`, `beforeBegin`) | Age question, unticked box "I agree to the Terms of Service and Privacy Policy.", two links | `acceptBeforeYouBegin` in `apps/mobile/src/lib/age-gate.ts`: sentence hashed, stored on the phone | OK (code read). Counsel Q-D (agree or acknowledge Privacy Policy) is open |
| Sign-in sheet (Welcome) | `authCopy.sheet.agreeLine` | "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." plus two versioned links | Account creation, with consent step E-S07 `terms` (PATH-01) | Two acceptances (box, then line). Whether they are one or two records: UNVERIFIED |
| Server record | `policy_acceptances` | Cited by privacy policy section 2 and `consent.ts` header | Server row | UNVERIFIED (migration not read). PATH-01 says hashing of the full shown text is UNVERIFIED |
| Device-access line | below the agree line | Not written | Notice only, not a grant | GAP (CONTENT-NEEDED) |

## 4. Proposals (not applied; `docs/legal` is founder-only and counsel must confirm)

- Founder confirms the reading in gap 1.
- `legal` and the founder apply the #1054 section 5 sentences (ToS 3.5 device access, privacy policy photo and Face ID lines, label rows for Photos and Face ID).
- `content` writes `consent.deviceAccessLine` and `appLock.faceIdLine`, plain words, no promise beyond ToS 3.5.
- `product` adds a BL row for the app lock and the device-access line.
- `mobile` or `privacy` runs `npm test` (content rules, drift tests) and an Info.plist check on a prebuilt app; neither was run here.

## 5. Not verified

Any test run; the built Info.plist (only `app.config.ts` was read); F1, F13 and F04 requirement files; `invite-sheet.test.ts`; `policy_acceptances` migration; the App lock screen strings; PATH-09 copy; `eas.json` profiles beyond those with `EXPO_PUBLIC_ANALYTICS` (five found); Apple's current guideline wording.

# NX-39 phases: What to Test and App Review notes (DRAFTS, BL-858)

Status: DRAFT. Nothing here is pasted into App Store Connect or TestFlight, and nothing here is shown in the app. A block
moves into `packages/content/src/release/testflight.en.ts` or `packages/content/src/release/app-review.en.ts` only in
the pull request that turns its phase switch on in `preview` and `testflight` (the row in
`scripts/release/store-flags.mjs` changes in the same diff), after counsel has read it (CLAUDE.md, Approval). Words a
parent reads in the app stay in `packages/content` and are not drafted here.

Source of the phases and their gates: `docs/roadmap/next/03-requirements/NX-39-memory-library.md` section 3 (the one
phase table) and rows R4, R11, R26, R37, R39, R46, R60. Switches: `MEDIA_PHASE_SWITCHES` in
`apps/mobile/src/lib/capabilities.ts`. Fictional family only: Asha.

Each block names the phase, the switch, what the reviewer or tester can reach, and the permission keys the built
Info.plist carries with that phase on. Bracketed text is for the person who moves the block: it is not pasted.

## 1. Permission keys in the built Info.plist

The list below is PR #2071's allowlist (BL-2131, `apps/mobile/test/config.test.ts`, open at the time of writing). It
reads the introspected config, not the plist inside a built .ipa, so the founder reads the plist of the build that is
submitted before any block below is pasted (open item E3).

| Key | Who writes it | In a Release build |
|---|---|---|
| `NSMicrophoneUsageDescription` | expo-audio plugin, `permissionCopy.microphone` | Yes |
| `NSFaceIDUsageDescription` | expo-local-authentication plugin, `permissionCopy.faceId` | Yes |
| `NSLocalNetworkUsageDescription` (with `NSBonjourServices`) | expo-dev-launcher | Expected no: its build phase strips it from non-Debug builds (read from its source, not from an .ipa) |

Keys a phase adds when its switch is on (NX-39-R4, R46). None is in any build today, and gate G6
(`apps/mobile/test/g6-production-flags-off.test.ts`) fails on any of them.

| Phase | Adds | Never adds |
|---|---|---|
| P0, P1 | Nothing (Apple's picker runs outside the app) | Any photo library key |
| P2a, P2b | `NSPhotoLibraryUsageDescription`, and `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` set to true | `NSPhotoLibraryAddUsageDescription`, any `NSLocation*` key |
| P2c | `UIBackgroundModes` and `BGTaskSchedulerPermittedIdentifiers` (only with the founder's recorded ruling, R46) | |
| P3 | Nothing new (uses P0's picker, or P2a's key) | |
| P4a | Nothing: local notifications need no plist key; iOS asks at the moment a reminder is turned on | Remote push (`aps-environment`) |

## 2. App Review notes

Each block is added to the end of `appReviewCopy.notesServersOn`, before the Contact line, and replaces the block of the
phase before it. The whole Notes box is 4,000 bytes; the servers-on text is about 2,216 bytes before the demo sign-in is
filled, so each block below is kept under 1,100 bytes.

### 2.0 Every phase off (the build that exists today, Build 12)

```
PHOTOS AND OTHER CODE THAT IS OFF IN THIS BUILD (2.3.1(a))
The binary contains code for adding photos to letters in a later update. It is switched off when the app is built, so no photo screen or button is shown, the app reads no photos, and no remote setting can turn it on. Remote settings can only pause a feature, never start one.

PERMISSIONS IN THIS BUILD
The Info.plist has two purpose strings. NSMicrophoneUsageDescription is asked the first time you tap Speak. NSFaceIDUsageDescription is asked only if you turn on App lock in Settings. Reminders are local notifications, and iOS asks the first time you turn one on. There is no photo library, camera, location or contacts permission, and no background mode.
```

### 2.1 P0, one photo with a letter (`EXPO_PUBLIC_PHOTOS`)

```
PHOTOS
A parent can add one photo to a letter: on Tonight tap "Start from a photo", or on Review tap "Add a photo to this letter". The photo is chosen in Apple's system photo picker, which runs outside the app, so the app never asks for photo library access. Only the chosen photo is copied into the app. [check against NS-01 before pasting: the place and camera details in the file are not kept.]
To test on a device with no photos: take a screenshot first (side button and volume up), then choose it in the picker.

PERMISSIONS IN THIS BUILD
NSMicrophoneUsageDescription (asked the first time you tap Speak) and NSFaceIDUsageDescription (asked only if you turn on App lock). No photo library, camera or location permission, and no background mode.
```

### 2.2 P1, the photo's date (`EXPO_PUBLIC_MEDIA_METADATA`)

Two forms: use the second only if BL-843 and BL-844 both passed (NX-39 section 3, P1).

```
PHOTOS
As before, a parent adds one photo with Apple's picker, and the app never asks for photo library access. The app now reads the date the photo was taken from the chosen file, and offers it as the letter's day.
To test on a device with no photos: take a screenshot, then choose it. The letter is offered for today's date.
```

```
PHOTOS
As before, a parent adds one photo with Apple's picker, and the app never asks for photo library access. The app now reads the date the photo was taken and the city it was taken in from the chosen file, and offers them with the letter. The city name is worked out on the phone from a table in the app; no location is sent anywhere, and the app has no location permission.
To test on a device with no photos: take a screenshot, then choose it. A screenshot has a date and no place, so only the date is offered.
```

Both forms end with the P0 PERMISSIONS block, unchanged.

### 2.3 P2a, "Add from your library" (`EXPO_PUBLIC_LIBRARY_CHOOSER`)

```
PHOTO LIBRARY
"Add from your library" lets a parent choose several photos for one letter from a range of dates. Photo library access is asked only when the parent taps it, never at launch. Limited access works fully: the app shows only the photos the parent selected. Choosing Don't Allow leaves the rest of the app as it was, and Apple's picker still works for one photo at a time.
To test on a device with no photos: take two or three screenshots, tap "Add from your library", choose Limit Access, and select them.

PERMISSIONS IN THIS BUILD
NSPhotoLibraryUsageDescription (asked when you tap "Add from your library"), NSMicrophoneUsageDescription (asked the first time you tap Speak) and NSFaceIDUsageDescription (asked only if you turn on App lock). PHPhotoLibraryPreventAutomaticLimitedAccessAlert is set, so iOS does not prompt again after Limited access. No camera or location permission, no photo library add permission, and no background mode.
```

### 2.4 P2b with P4b, "Suggest days" (`EXPO_PUBLIC_PHOTO_MOMENTS`)

```
SUGGEST DAYS
"Suggest days" is off until the parent turns it on. When it is on, and only while the app is open, the app may show one card for a day the parent could write about. It reads the dates stored with the photos (and their places, only if the parent turns Places on), never what a photo shows, and nothing leaves the phone. It can be turned off in one tap, and turning it off deletes the days it found.
To test on a device with no photos: take two screenshots, turn on Suggest days, and choose Limit Access with those two selected. [UNVERIFIED: that a same-day pair of screenshots makes a card. The engine owner confirms the smallest set that does, before pasting.]
```

Followed by the P2a PERMISSIONS block, unchanged: P2b adds no new key. Turning it off deleting the days it found, with the parent's own choices kept, is NX-39-R18.

### 2.5 P2c, "Also look when the app is closed" (`EXPO_PUBLIC_MOMENTS_BACKGROUND`)

Draft only. NX-39-R46 keeps this switch off in every profile until the founder records a ruling, and NX-39 section 13
expects extra reviewer questions for this phase.

```
LOOKING WHEN THE APP IS CLOSED
An optional setting under Suggest days, off until the parent turns it on with its own yes. When it is on, iOS may give the app a short background run, at most three times a day, to read the dates of new photos the parent has given access to. Nothing else runs in the background and nothing leaves the phone. Turning it off stops every run.
To test: turn it on, then check Settings for the line that says when the app last looked. Background runs are decided by iOS and may not happen during review.

PERMISSIONS IN THIS BUILD
NSPhotoLibraryUsageDescription, NSMicrophoneUsageDescription and NSFaceIDUsageDescription, as before. UIBackgroundModes holds [the mode the build uses, from the prebuild diff] and BGTaskSchedulerPermittedIdentifiers holds one identifier, used only for this setting.
```

### 2.6 P3, video (`EXPO_PUBLIC_VIDEO`)

```
VIDEO
A parent can add a short video to a letter the same way as a photo: with Apple's picker, or with "Add from your library" if library access was given. The app keeps its own copy of the video on the phone.
To test on a device with no videos: make a short screen recording from Control Center, then choose it.
```

Followed by the PERMISSIONS block of the phase before it (P0's or P2a's), unchanged: P3 adds no key.

### 2.7 P4a, occasions (`EXPO_PUBLIC_OCCASIONS`)

P4a needs no library, so it can ship before P2a (NX-39 section 3, Order).

```
DAYS THAT MATTER
A parent can type a day that matters to their family, like a grandparent's birthday, and choose a reminder on that day. Reminders are local notifications: nothing is sent from a server, and none arrives between 9:30 PM and 7 AM. The notification permission is asked the first time a parent turns one on.
To test: add a day for tomorrow with a reminder, then allow notifications when asked.
```

Followed by the PERMISSIONS block of the build it ships in, unchanged: P4a adds no key.

## 3. What to Test (TestFlight)

Each block is a paragraph added to the build's What to Test in `testflight.en.ts`, after "Please try" and before the
feedback block, which stays the same.

### 3.1 P0

```
New in this build: a photo with a letter.
- On Tonight, tap "Start from a photo", choose a photo, then speak or type the letter.
- On Review, or on a letter's page, add a photo, change it, and take it off. Undo is there for a few seconds.
- In the Book, open Photos to see the letters that have one.
The app never asks for access to your photo library. You choose a photo in Apple's own picker, and only that photo is copied. If you have no photo you want to use, a screenshot works. Erase removes the photos too. Export does not include photos in this build.
```

### 3.2 P1

```
New in this build: when you add a photo, the app offers the day it was taken as the letter's day. Please check that the day is right, and tell us if a photo's day was wrong or missing. [Form with a city: add "It also offers the city the photo was taken in, worked out on your phone. Tell us if the city was wrong."]
```

### 3.3 P2a

```
New in this build: "Add from your library", to choose several photos for one letter from a range of days.
- The first time you tap it, iOS asks about your photos. Please try Limit Access, and later Allow Full Access or Don't Allow in iOS Settings, Privacy and Security, Photos. Each one should work without the app asking you again.
- With Limit Access, the app shows only the photos you selected.
Nothing about your photos leaves your phone.
```

### 3.4 P2b with P4b

```
New in this build: Suggest days. It is off until you turn it on. When it is on, the app looks at the dates of your photos while it is open, and may show one card for a day you might like to write about, or a day coming up soon.
- Turn it on, use the app for a few days, and tell us whether the cards help.
- If a card ever felt wrong or painful to see, please tell us. That is the most useful thing you can send.
- Turn it off, and check that the cards stop.
It reads the dates stored with your photos, not what a photo shows, and nothing leaves your phone. Turning it off deletes the days it found.
```

### 3.5 P2c

```
New in this build: an extra setting under Suggest days, "Also look when the app is closed". It is off until you turn it on. When it is on, iOS may let the app check the dates of new photos up to three times a day. Tell us if you notice it in your battery use, and whether the cards feel any different.
```

### 3.6 P3

```
New in this build: a short video with a letter. Add one the same way as a photo, and tell us if it was slow to add or to play. A screen recording works if you have no video you want to use.
```

### 3.7 P4a

```
New in this build: days that matter. Type a day your family keeps, like a grandparent's birthday, and choose a reminder for it.
- Add a day for tomorrow with a reminder. iOS asks about notifications the first time.
- Check the reminder arrives, and that nothing arrives late at night.
```

## 4. Open for the exec team

Each item has the default these drafts use. Changing a default is a wording edit in this file before the block moves.

| Id | Question | Default used here |
|---|---|---|
| E1 | P2b's parent-facing name. NX-39 calls it "Suggest days"; the photo copy rule in `packages/content/src/features/photos.en.ts` bars "memory", "moment" and "album" | "Suggest days" in every block, and "Moments" nowhere in reviewer or tester text |
| E2 | The P2b switch name. NX-39 section 3 proposed `EXPO_PUBLIC_MOMENTS`; develop already pins `EXPO_PUBLIC_PHOTO_MOMENTS` (CR-69 A5, card 27, gate G6) | `EXPO_PUBLIC_PHOTO_MOMENTS`, so there is one Moments flag, not two |
| E3 | Whether the notes name `NSLocalNetworkUsageDescription` | Not named, because the dev-launcher build phase should strip it from Release. The founder reads the submitted .ipa's plist; if the key is there, the notes say it comes from a development tool and is never asked |
| E4 | Whether the P0 tester text says "Export does not include photos in this build" | Yes, while BL-933 (export schema 1.7.0 with photo files) is not merged; the line goes in the same PR that lands BL-933 |
| E5 | Whether P4a needs its own remote pause key. The kill-switch vocabulary (`packages/api/src/kill-switches.ts`) has none for occasions, and `libraryDays` leaves typed days alone | No key: P4a reads no library and only the build switch removes it. Adding a key is an additive API change in its own PR |
| E6 | Which remote key pauses P2a. `photoMoments` is documented as "picking from the photo library for a letter" (NS-51) | `photoMoments` pauses P2a and P2b, and `photos` pauses every picture phase (`MEDIA_PHASE_SWITCHES`) |
| E7 | The reviewer path for P2b with no real library (2.4) | Two screenshots under Limit Access, marked UNVERIFIED until the engine owner names the smallest set that makes a card |
| E8 | The reminder quiet window in the P4a text, 9:30 PM to 7 AM (NX-39-R26) | Stated as NX-39-R26 writes it, in 12-hour time for US reviewers |

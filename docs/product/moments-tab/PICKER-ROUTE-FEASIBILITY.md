# Moments: Apple system photo picker, embedded inline (feasibility and design options)

Status: PROPOSED, docs only. Nothing here is decided, built or in `DECISIONS.md`.
Date: 21 Nov 2026
Branch: `wip/moments-picker-feasibility` (cut from `wip/moments-prd`, head 1c1e05bc). No PR, no merge, no push to `develop` or `main`.
Extends: `docs/product/prd/28-moments-tab.md` (NS-53), written for a library-read route.
Fictional family: Asha only. Real family details appear nowhere in this file.

## 0. Founder rulings this answers, and the correction

1. First ruling (21 Nov): for Moments, use Apple's system photo picker (no photo library read, no library permission) and make it feel as much a part of the app as possible, using standard open source components.
2. Correction from Karma (21 Nov, relayed by the coordinator): the library-read ruling is NOT reversed. The first Moments release still ships WITH library read, for the proactive For you suggestions and the nudges. The Apple picker, embedded inline, replaces our own album chooser, grid and viewer, and is the fallback when library access is declined or Limited.

So the question is a hybrid: library read for suggestions (unchanged), Apple's inline picker for choosing pictures (new), and the same picker, with no library, as the whole path when access is off. Sections 1 to 6 answer the six questions as first asked (including the no-library case, which is the fallback). Section 7 adds the four hybrid questions (a to d). Section 8 is the recommendation.

How to read the evidence tags. VERIFIED means I read the primary source named. UNVERIFIED means I did not read a primary source, or only a forum post, or the behaviour is untested; UNVERIFIED rows that change the plan are collected in section 9. Apple documentation pages were read through Apple's documentation data service (`developer.apple.com/tutorials/data/documentation/...`), which serves the same content as the pages cited. A forum reply labelled "Engineer" is not Apple documentation and is tagged UNVERIFIED.

Sources read (all on 21 Nov 2026):
- Apple, PhotosPicker: https://developer.apple.com/documentation/photosui/photospicker
- Apple, `photosPickerStyle(_:)`, `PhotosPickerStyle.inline`, `.compact`: https://developer.apple.com/documentation/swiftui/view/photospickerstyle(_:)
- Apple, `photosPickerAccessoryVisibility(_:edges:)`: https://developer.apple.com/documentation/swiftui/view/photospickeraccessoryvisibility(_:edges:)
- Apple, `photosPickerDisabledCapabilities(_:)`, `PHPickerCapabilities`: https://developer.apple.com/documentation/swiftui/view/photospickerdisabledcapabilities(_:)
- Apple, `PhotosPickerSelectionBehavior` (`continuous`, `continuousAndOrdered`, `ordered`): https://developer.apple.com/documentation/photosui/photospickerselectionbehavior
- Apple, `PhotosPickerItem` and `itemIdentifier`: https://developer.apple.com/documentation/photosui/photospickeritem
- Apple, `PHPickerConfiguration` (init, `init(photoLibrary:)`, `preselectedAssetIdentifiers`, `mode`, `filter`, `containerIdentifier`, `searchText`, `title`): https://developer.apple.com/documentation/photosui/phpickerconfiguration-swift.struct
- Apple, `PHPickerViewController` (update, deselect, move, zoom, scroll): https://developer.apple.com/documentation/photosui/phpickerviewcontroller
- Apple sample, Selecting Photos and Videos in iOS: https://developer.apple.com/documentation/photokit/selecting-photos-and-videos-in-ios
- Apple sample, Bringing Photos picker to your SwiftUI app: https://developer.apple.com/documentation/photokit/bringing-photos-picker-to-your-swiftui-app
- Apple, Delivering an enhanced privacy experience in your Photos app: https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app
- WWDC23 session 10107, Embed the Photos Picker in your app: https://developer.apple.com/videos/play/wwdc2023/10107/ (read through a page summariser; quotes below are as returned, so re-read the video before quoting externally)
- App Review Guidelines, 5.1.1 and 5.1.2: https://developer.apple.com/app-store/review/guidelines/ (text read in full for 5.1.1(i) to (iv) and 5.1.2(i) to (vi))
- Apple Developer Forums, threads 759040 and 710587 (limited access): https://developer.apple.com/forums/thread/759040 and https://developer.apple.com/forums/thread/710587
- Expo, Extending with SwiftUI, SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/extending.md (also read: https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/ and https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/)
- Expo source: github.com/expo/expo, branch `sdk-57` (`@expo/ui` 57.0.26) and `main` (`@expo/ui` 58.0.23, `expo-image-picker` 58.0.10); published tarball `@expo/ui@58.0.29` unpacked from the npm registry
- npm registry records for `@expo/ui`, `expo-image-picker`, `react-native-image-picker`, `@baronha/react-native-multiple-image-picker`, `react-native-image-crop-picker`
- GitHub: https://github.com/react-native-image-picker/react-native-image-picker (head 61c0cd41, 13 Oct 2026) and https://github.com/NitrogenZLab/react-native-multiple-image-picker (head defc08c1, 11 Dec 2025)
- This repo, on `wip/moments-prd`: `CLAUDE.md`, `apps/mobile/package.json`, `apps/mobile/app.config.ts`, `.claude/skills/expo-native-module/SKILL.md`, `apps/mobile/modules/scribe-photo/**`, `apps/mobile/test/photos-device.test.ts`, `packages/design-tokens/src/tokens.ts`, `docs/product/prd/28-moments-tab.md`

## 1. What Apple's inline picker is, and what the app receives

### 1.1 Availability and process (question 1)

| Claim | Finding | Evidence |
|---|---|---|
| `PhotosPicker` exists | iOS 16.0 and later | VERIFIED, PhotosPicker page |
| `.photosPickerStyle(.inline)`, `.compact`, `.presentation` | iOS 17.0 and later. `.presentation` is the default. `.compact` is a single row for seriously constrained space | VERIFIED, `PhotosPickerStyle` pages; compact wording from WWDC23 10107 |
| `.photosPickerAccessoryVisibility(_:edges:)` | iOS 17.0. Accessories are "anything between the content and the edge, like the navigation bar or the sidebar"; on iOS the top accessory is the navigation bar and the bottom the toolbar | VERIFIED (Apple page); iOS edge meaning from WWDC23 10107 |
| `.photosPickerDisabledCapabilities(_:)` | iOS 17.0. `PHPickerCapabilities` members read: `search` (search bar), `collectionNavigation` (albums tab or sidebar), `stagingArea` (the area showing the selected photos), `selectionActions` (Cancel and Add), `sensitivityAnalysisIntervention` (prompt before a photo with nudity is selected) | VERIFIED, `PHPickerCapabilities` page |
| Selection behavior `.continuous`, `.continuousAndOrdered` | iOS 17.0. `.ordered` and `.default` are iOS 16.0. With `.continuous` the binding updates live; per the session, with selection actions disabled and continuous selection both buttons can be hidden | VERIFIED (availability); session behavior as summarised |
| Out of process | "Both PHPickerViewController and UIImagePickerController use the out-of-process Photos picker user interface ... Displaying the photo library doesn't need user permission because it's running in a separate process. An app can't take screenshots of content and can only read the assets that the user selects." The session says the same of the embedded picker: only what the user selected is passed back; the app cannot access the picker directly or take screenshots of its content | VERIFIED for the modal picker (sample page); session statement for the embedded picker as summarised. That the inline `PhotosPicker` is the same process model is stated in the session, not in a reference page: treat as VERIFIED to the extent the session is |
| No library permission string | Not needed for the picker: "you don't need to request any photo library access to use it" (session). A purpose string is needed only for PhotoKit access: "Attempting to access the Photos library without a valid usage description causes your app to crash" (privacy sample page) | VERIFIED as read. Whether passing `photoLibrary: .shared()` to the picker (needed for identifiers, 1.2) raises the system prompt: Apple's sample passes `.shared()` and says apps "don't need to request photo library permission when using either class". Not tested on a device: UNVERIFIED |
| Privacy badge and onboarding | "The first time an embedded picker appears, an onboarding UI will automatically appear explaining that your app can only access selected photos." "The Photos privacy badge indicates that the picker is private and out of process." Whether the onboarding can be suppressed or restyled is not stated: UNVERIFIED | VERIFIED (quote, session) |

### 1.2 What the app receives, with and without a library

The picker returns placeholders, not pictures. `PhotosPickerItem` "conforms to Transferable, and allows you to load a representation you request" and "the selection results you get are placeholder objects" (PhotosPicker page). The app loads data per item, on demand. A load can fail, for example "if the picker tries to download data from iCloud Photos without a network connection" (same page). Large or many items: use a file representation, copy it into the app directory, and remove it when done (SwiftUI sample page).

| Picker made | `itemIdentifier` / `assetIdentifier` | Data | Evidence |
|---|---|---|---|
| No photo library (`PHPickerConfiguration()`; SwiftUI `PhotosPicker` initializers without `photoLibrary:`) | Absent. `PHPickerConfiguration.init()`: "This configuration doesn't return asset identifiers"; `PhotosPickerItem.itemIdentifier` "is nil if you create a Photos picker without a photo library" | File data through the item provider or `Transferable` | VERIFIED |
| With a library (`PHPickerConfiguration(photoLibrary: .shared())`; SwiftUI `photoLibrary: .shared()`) | Present: "The results contain local identifiers because of initializing the configuration with a photo library" | Same, plus the identifier, which resolves to a `PHAsset` only if the app has library authorization (see 7.1) | VERIFIED (sample page) for presence; resolution rule is 7.1 |

What is available without library access, from Apple's sample: "Retrieving metadata for an asset doesn't require special permission. An app can get the properties after loading an object from an item provider. However, it may not include all properties because of the transcoding process." The sample loads the data representation and reads `CGImageSourceCopyPropertiesAtIndex`, "which avoids losing information from transcoding". The session adds `preferredItemEncoding: .current` with a generic content type (`.image`, `.movie`) to get originals; a specific type such as `.jpeg` may still transcode. `Image` as `Transferable` is PNG and JPEG only (PhotosPicker page), so a custom `Transferable` or an item provider is needed for HEIC.

So, without a library, from the picked file's own metadata: the capture date and time (EXIF) and, if present in the file, GPS. Both come from file properties, not from PhotoKit. Dimensions, container type and duration come from the file.

Location is not guaranteed to be there, and it is not stripped by us. WWDC23 10107 introduced an Options menu in the picker: "By default, all image metadata are included, but users can now choose to remove sensitive metadata, like location, from selected photos." "If you are using the PhotosPicker and Transferable API, you don't need to do any adoption work to support the new Options menu ... The Options menu will not be supported for apps that use the legacy UIImagePickerController API or have full library access." Two consequences. (1) With the picker, a parent can drop location per selection, so a place line from a picked photo is best effort. (2) The sentence "not supported ... for apps that have full library access" reads as: with full authorization the Options menu may not be offered. Not verified on a device: UNVERIFIED.

What the existing `scribe-photo` pipeline already does with this: `pickOne` copies one picked file to `Caches/ImagePicker`; `reencodeUpright` writes an upright JPEG with no Exif, XMP, IPTC, GPS or thumbnail (read in `ScribePhotoModule.swift`). Anything we read for a date or place must be read BEFORE that strip, in memory, and dropped (see the place rules, NS-53-R61).

Other without-library limits from the session: cinematic video comes back rendered with the depth effect baked in; depth data needs full library access and PhotoKit.

## 2. Embedding options in the React Native app (question 2)

The app today (`apps/mobile/package.json`): Expo SDK 57 (`expo ~57.0.26`), React Native 0.86.3, `@expo/ui ~57.0.21` already installed and used (`Host` and `Toggle` in `src/components/platform/toggle.ios.tsx`, whose header says "APIs verified against @expo/ui 57.0.21"), deployment target iOS 17.0 (`IOS_DEPLOYMENT_TARGET` in `app.config.ts`, D-098), `scribe-photo` and four other local modules, no `expo-image-picker`. iOS 17.0 is exactly the floor for `.inline`, `.compact`, accessory visibility and disabled capabilities, so no `#available` fallback is needed for those.

| Option | Licence | Maintenance (read from npm and repo) | iOS 17 inline | Permissions and label | Size of work | Fit with tokens |
|---|---|---|---|---|---|---|
| A1. `@expo/ui` built-in component | MIT | `@expo/ui` 58.0.29 published 17 Nov 2026; 57.0.26 published 21 Oct 2026 | NO. No `PhotosPicker` in the `sdk-57` branch (57.0.26), in `main` (58.0.23), or in the unpacked 58.0.29 tarball (searched for `PhotosPicker` and `PhotosUI`: no match). The SwiftUI component list for SDK 57 has Picker, DatePicker, Menu, BottomSheet and others, not a photo picker | None until a component exists | Not available. Not planned that I could find: UNVERIFIED (no roadmap read) | n/a |
| A2. `@expo/ui` "Extending with SwiftUI": our own `PhotosPicker` SwiftUI view registered with `ExpoUIView`, shown inside `Host` | MIT (`@expo/ui`); our code is ours | Documented for SDK 57 in the page above (modified 23 Sep 2026): a local module whose podspec has `s.dependency 'ExpoUI'`, a props class extending `UIBaseViewProps`, a view struct conforming to `ExpoSwiftUI.View`, `ExpoUIView(MyView.self)`, and a JS wrapper with `createViewModifierEventListener`. Built-in modifiers (`padding`, `background`, `frame`, `cornerRadius`) then apply to it | YES by construction: the view is plain SwiftUI, so `.photosPickerStyle(.inline)` and the two other modifiers are ours to write | Same as 1.1. Linking changes nothing in the plist. If the Swift passes `photoLibrary: .shared()` the module is a library-touching module and falls under the library gates (7.5) | About 250 to 350 lines Swift and TypeScript plus a source-scan test; one PR of the spec's 300 to 400 line class. Needs a native build (`ios-compile.yml`) | Good. Layout, padding, background and corner radius come from our tokens through modifiers; the grid itself is Apple's (3.4). `Host` already takes `colorScheme`, as in `toggle.ios.tsx` |
| B. Plain local Expo module with its own `ExpoView` hosting a `UIHostingController` | Ours | Expo Modules API, current | YES | Same as A2 | Slightly larger than A2: we own the hosting, safe-area, sizing and parent view controller handling that `Host` already does. Roughly 350 to 450 lines | Same, but modifiers must be hand-built. No benefit over A2 here; A2 is B with the host written by Expo |
| B'. The same view as a UIKit child controller: `PHPickerViewController` with `mode = .compact` or default, `edgesWithoutContentMargins`, `disabledCapabilities`, `selection = .continuous` | Ours | Apple UIKit | YES (`mode` and the others are iOS 17.0; read) | Same; `PHPickerConfiguration(photoLibrary:)` needed for identifiers and `preselectedAssetIdentifiers` ("works only when initializing ... with a photo library") | Similar to B. Gives UIKit-only controls: `updatePicker(using:)` for `edgesWithoutContentMargins` and `selectionLimit` at run time, `deselectAssets(withIdentifiers:)`, `moveAsset`, `scrollToInitialPosition()`, `zoomIn()`, `zoomOut()` (all read; deselect and move need a library init). SwiftUI has fewer of these | Same |
| C1. `expo-image-picker` | MIT | 58.0.10 published 1 Oct 2026, modified 5 Nov 2026 (SDK 57 line also published) | NO. Modal only: `launchImageLibraryAsync` builds a `PHPickerViewController` (or `UIImagePickerController`) and presents it from the current view controller (`ImagePickerModule.swift`, `presentPickerUI`) | Not zero-permission by default: the config plugin writes `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` with default text unless a value is given (`withImagePicker.ts`). It exposes `requestMediaLibraryPermissionsAsync`. Docs: "No permissions request is necessary for launching the image library", with an exception for video at the default Passthrough preset (iOS asks for media library permission when the video is picked). Source: `MediaHandler.swift` reads `authorizationStatus(for: .readWrite)` and fetches the `PHAsset` for video passthrough. `assetId` "might be null when the ID is unavailable or the user gave limited permission". This is the exact finding of the #833 reviews recorded in the `expo-native-module` skill; `CLAUDE.md` says one photo comes from `scribe-photo`, never from `expo-image-picker` | Small to adopt, but it cannot be inline and it carries the permission strings | Modal, so not part of the tab |
| C2. `react-native-image-picker` | MIT | 8.3.0 published 13 Oct 2026 | NO. Modal: `PHPickerConfiguration` through `ImagePickerManager.mm`, or `UIImagePickerController` | README lists `NSPhotoLibraryUsageDescription` for "Select image/video from photos"; `includeExtra` "requires library permissions (i.e. exif data)"; source calls `PHPhotoLibrary requestAuthorization` in one path | Small, but modal and permission-bearing | Modal |
| D1. `@baronha/react-native-multiple-image-picker` | MIT | 2.2.5 published 10 Dec 2025 (11 months old at 21 Nov 2026) | NO. A custom picker built on `HXPhotoPicker` (podspec dependency read). It is our-own-grid-style, not Apple's picker | Reads the library (UNVERIFIED in detail; not source-read beyond the podspec) | Large third-party dependency | Fully themeable but it is the thing the founder wants to replace |
| D2. `react-native-image-crop-picker` | MIT | 0.52.0 published 29 Sep 2026 | NO (modal, crop oriented) | UNVERIFIED (not source-read) | Not relevant | Not relevant |
| D3. Any other maintained library that wraps the SwiftUI inline `PhotosPicker` | n/a | I searched the web and the npm records above and found none: UNVERIFIED that none exists | n/a | n/a | n/a | n/a |

Reading of the table. "Standard open source components" gives the mechanism, not the component: there is no maintained open source React Native component for the inline Apple picker. The standard pieces are `@expo/ui` (MIT, Expo's own, already in the app) and Apple's `PhotosPicker`; the small amount of glue is ours. A2 is the option that uses the most standard parts.

## 3. Design: making an inline picker feel like part of Moments (question 3)

### 3.1 Principles from the repo

From `28-moments-tab.md` 14.1 and `CLAUDE.md`: content on paper, glass only on navigation and controls (at most three surfaces, solid `glassFallback`), text never over a photo, 44 pt targets, no counts of gaps, no streaks, nothing that says AI. Tokens read from `packages/design-tokens/src/tokens.ts`: `bg` `#FBF8F3` (paper), `surface` `#F5EFE7`, `surfaceRaised` `#FFFFFF`, `text` `#2B2722`, `textMuted` `#6B645B`, `accent` `#8A5A3B`, `accentSoft` `#F1E6DC`, `onAccent`, `mediaFrame`; dark counterparts; radii sm 8, md 14, lg 20, xl 28 (sheets), pill. The `mediaFrame` token exists for photo frames (3:1 outline).

### 3.2 What we control and what Apple controls

| Ours (tokens, copy, behaviour) | Apple's (cannot be restyled) |
|---|---|
| The route and its header (title, date heading, close) | The photo grid, thumbnails, spacing, scrolling, zoom gesture |
| The frame around the picker: corner radius, hairline, padding, safe-area, height | Selection marks and numbering (numbering only with `.ordered`) |
| Hiding Apple's bars: `photosPickerAccessoryVisibility(.hidden, edges: .all)`, search and albums off, Cancel and Add off with continuous selection | The Photos privacy badge and first-appearance onboarding (not suppressible as far as the session says: UNVERIFIED) |
| Our selection tray: count line, Keep, Not now, glass on controls | The Options menu (location and metadata) if shown (VERIFIED it exists; where it sits when bars are hidden: UNVERIFIED) |
| Our limit line ("at most 6 pictures or 2 videos"), checked by us | The picker's typography, localisation, Dynamic Type and VoiceOver behaviour inside the grid |
| Light and dark scheme passed through `Host colorScheme` | The grid's own background colour (whether our paper shows through: UNVERIFIED, spike item S5) |

Limits of Dynamic Type and VoiceOver: the picker content is Apple's, so our Dynamic Type work stops at the frame. At AX3 to AX5 our header, tray and buttons reflow as spec'd, but the grid will follow whatever Apple does. For VoiceOver and Switch Control the picker is a system accessibility element tree; I did not test it. A forum thread titled "Keyboard Navigation Not Working for inline PhotosPicker" (https://developer.apple.com/forums/thread/770878) appeared in search; I did not read its body: UNVERIFIED. G5 (accessibility) in the PRD must therefore test the inline picker on a device, and the tray must offer the whole job without the grid being operable: a parent who cannot use the grid still has the existing "Add pictures" path through the platform's modal picker (the route that exists today in `scribe-photo`) and the typed day.

### 3.3 Recommended layout

The route stays `moments/pick`, a platform modal (the PRD's day sheet position), but its body is the inline picker, not our grid.

```
+--------------------------------------------+
| (X)   Saturday 14 November                 |  paper, our header, 44 pt close
|       Choose pictures for a letter         |  muted, one line
+--------------------------------------------+
|  +--------------------------------------+  |
|  | Apple grid (inline, accessories off) |  |  frame: radius md (14), hairline
|  | [ ][ ][ ][ ]   privacy badge (Apple) |  |  mediaFrame line, no shadow
|  | [x][ ][x][ ]                         |  |  tall, about 60 percent of height
|  | [ ][ ][ ][ ]                         |  |
|  +--------------------------------------+  |
+--------------------------------------------+
|  3 chosen                                  |  tray on surface (F5EFE7)
|  [ Not now ]                  [ Keep ]     |  pill buttons, glass on controls only
+--------------------------------------------+
```

Behaviour:
1. The picker is made with `.photosPickerStyle(.inline)`, `.photosPickerAccessoryVisibility(.hidden, edges: .all)`, `.photosPickerDisabledCapabilities([.search, .collectionNavigation, .stagingArea, .selectionActions])` and `selectionBehavior: .continuous`. This hides search, albums, the staging bar and Cancel and Add, and delivers each selection change to us (WWDC23 10107). Whether hiding collection navigation and search is wise for a parent who wants an album is a product choice; the hybrid keeps them off because day and suggestion routes replace them (7.4). Search and albums can stay on; they are Apple-styled either way.
2. Our tray shows a count only ("3 chosen", in the parent's language, from `packages/content`). Thumbnails of the chosen pictures would need the app to load each item before Keep; that is a memory cost and, for iCloud items, a download. Recommendation: count only in the first release (the grid already shows the ticks); thumbnails are an enhancement after the spike.
3. Keep copies the chosen items out of the picker (section 7.2) and starts capture. Not now closes the route; nothing was copied, 0 files, 0 rows (PRD 9.2). `Keep` here is a naming collision to settle with `content`: in the PRD `Keep` is what stores the letter (9.1 step 5). The founder named the buttons "Keep and Not now"; the button that attaches pictures and moves on may need a different verb from the one that stores the letter.
4. Equal weight for the two buttons, as the ask card requires (NS-53-R71).
5. The Apple privacy badge and onboarding appear on first appearance and are not ours to schedule. Design for it: do not place our own copy over the first 3 seconds of the grid, and do not add a second explanation of what the app can see. The existing primer text (8.5) already says what the library read does; for a parent with access off, the first-appearance onboarding is Apple's own statement that only selected photos are read, which is true and needs no copy from us.
6. Sizes: iPhone SE 3 at AX5 has little height; at that size use the `.compact` style (a single row) or let the route scroll with the picker at a fixed minimum height. The PRD's AX rules (NS-53-R71) already move the ask inline from AX1; the same rule applies to the tray.
7. Offline and failures: a failed load (iCloud without network) gives one calm line under the tray, the other items stay (PRD 9.2 wording).

## 4. What Moments can and cannot do without library read (question 4)

This table is the picker-only world. In the corrected plan it is exactly the state of a parent who declined, who is Restricted, or whose build has the flag off (ACC-0, ACC-1, ACC-4, ACC-5, flag off), and, for suggestions, nearly the state of Limited (ACC-3, section 7.1).

| Capability | With library read (spec) | Picker only | Evidence and notes |
|---|---|---|---|
| For you suggestions from the library ("pictures from this day", RSN-DAY, RSN-YEAR, RSN-HEART, RSN-VIDEO, RSN-PLACE) | Yes | LOST. The app cannot enumerate anything. The only pictures it sees are the ones a parent picks, and only at the moment of picking | Picker design, 1.1 and 1.2 |
| Recent (months, day cards, collage) from the library | Yes | LOST as a library surface. A "Recent" built from pictures the parent already picked is possible but covers only those | Same |
| Journaling Suggestions (Apple's phase 3, Route A) | Optional later door | Unchanged: it is its own Apple door and needs its own entitlement (O-section of the PRD). It is not part of the picker | PRD 19.3 |
| Push nudge tied to a picture event (a "you took pictures yesterday" reminder, F4) | Phase 2, gated on counsel | LOST. With no library read there is no picture event to time against. A reminder can only be timed from facts the phone holds without pictures: birth date, month days, holidays, parent-typed days, a letter's own date | PRD 13 |
| Lifecycle email tied to a picture event | Phase 2, dark | LOST for the same reason; date-based email survives | PRD 13.6 |
| Occasions from the child's birth date: birthday, monthiversary | Yes | SURVIVES. No pictures involved (7a.3) | PRD 7a.3 |
| Public holidays (shipped table by date and region), parent-typed days, ticked Days, firsts the parent marked, "a year ago" from kept letters | Yes | SURVIVES | PRD 7a.3, 6.2 |
| 111 prompts, question card | Yes | SURVIVES | Not photo dependent |
| Parent-driven picking, attach to a letter, copy, strip, resize | Yes | SURVIVES. It is the picker's own function | `scribe-photo` today |
| Date-grouped display of picked pictures | From library dates | SURVIVES in part: the picked file's EXIF capture time can group the picks of one session ("these 4 are from Saturday 14 November"), or each picked picture can show its capture date. Applies only to what was just picked | 1.2; EXIF time is in the file for most pictures but not guaranteed (a screenshot or an edited file may lack it): UNVERIFIED how often |
| Place line from a picked photo | From library location, offline table | PARTIAL. If the picked file carries GPS and the parent did not remove location in the picker's Options menu, the offline place table can name a city on the phone, exactly as NS-53-R61 specifies (arithmetic on the phone, coordinate dropped at once). Many picks will have no location. Place for a day or a theme (RSN-PLACE) is LOST because there is no set of pictures to take a majority over | 1.2 |
| Grouping into days and stays (7.3, 7a.2) | Yes | LOST except within one picking session | Same |
| Counts ("12 pictures") | Not shown in the spec (no counts) | Not applicable; the tray count of pictures chosen is a selection count, not a gap or total | PRD rules |
| Faces, scenes (K-SUG) | NOT PLANNED | NOT PLANNED | PRD 7a.4 |
| Hearts, burst ids, subtype flags (READ_SET_V1, G3) | Yes, signed set | LOST. These are PhotoKit properties | PRD G3 |
| Hidden album, Recently Deleted handling | Needed by the library read | Not applicable. Apple's picker applies its own rules; what it shows is Apple's. I did not verify what it does for the hidden album: UNVERIFIED | Spec G1a |

The biggest lost capability is the proactive one: the For you cards "pictures from this day" and the picture-timed reminder cannot exist without a library read. What survives is everything the app can know from dates it already holds and from what a parent picks.

## 5. Privacy and store implications (question 5)

Two cases: the picker alone (no library read), which is the fallback state, and the corrected hybrid, which still ships a library read.

### 5.1 Picker alone, no library read in the build

| Item | Removed by the picker route? | Notes |
|---|---|---|
| `NSPhotoLibraryUsageDescription` purpose string | Yes, for the picker. Apple: the picker needs no library access; the string is needed for PhotoKit access (read, privacy sample page) | If any code calls PhotoKit, the string is needed or the app crashes (same page). `scribe-photo` already ships with no permission call, enforced by a source scan |
| Library permission prompt | Yes | None is raised by the picker (session, sample) |
| Gates G1a, G1b (library read device runs), G3 (READ_SET_V1), G11 (security read of `scribe-library`, place table, data inventory) | G1a, G1b, G3 fall away. G11(a) shrinks to a read of the picker module. G11(b) place table remains only if the place line from EXIF is kept | PRD 21 |
| G2 counsel read, G8 place data flow | G2 shrinks to the store-label and backup questions. G8 is unchanged (the Apple geocoder is not planned for the first release) | PRD 21.3 |
| Location consent | Reduced, not zero. No library location is read. If the offline place table reads GPS from a picked file, location data is still processed on the phone; the PRD's rule "location metadata of pictures is read on the phone to name a place" and the label question for Location apply to that | PRD 7a.1 |
| 5.1.2 questions (the PRD's R80 set: purposes not drifted, no marketing or data mining, no profile or contact database, no contacting people) | The text I read is the live guidelines. 5.1.2(vi): "Data gathered from ... depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining". 5.1.2(iv): "Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database". 5.1.2(v): "Do not contact people using information collected via a user's Contacts or Photos, except at the explicit initiative of that user on an individualized basis". These apply to information obtained from Photos; whether data from an out-of-process picker is "from Photo APIs" in Apple's sense is a legal reading: UNVERIFIED, counsel's | Text VERIFIED; application UNVERIFIED |
| 5.1.1(iii), the argument for the picker | VERIFIED text: "Apps should only request access to data relevant to the core functionality of the app ... Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts." This is the sentence the Notes for Review in R80 argue against ("why the out-of-process picker alone is not enough"). The hybrid makes that argument for suggestions only; the picker is already the route for choosing | VERIFIED text |
| What remains in either case | (1) The stored picture copy in `entry_media` sits on the phone and is not excluded from iPhone backup (PRD R81 backup line). (2) EXIF handling: our pipeline strips Exif, XMP, IPTC, GPS, thumbnails before storage; any date or place read must happen before the strip, in memory (`reencodeUpright` header). (3) The label: "Photos or Videos" is still collected if a picture is stored in a way that leaves the phone (it does not; the stored copy stays in the app container, and the family's letters sync only per existing rules). The Apple privacy label definitions were not re-read for this file: UNVERIFIED. (4) The Apple privacy onboarding is Apple's, not ours to describe | PRD 10, 17 |

### 5.2 The corrected hybrid

Nothing in 5.1 is removed for the build, because the library read still ships: the purpose string, the prompt, G1 to G3, G8 (still phase 2), G11 and the 5.1.2 questions all stay as the PRD has them. The picker changes three things:

1. It reduces what the library read must do. `scribe-library` no longer needs the full-image, player and poster functions that the day sheet and viewer used (R220 lists "full image and player item or poster for the day sheet"). That narrows the G11(a) source read.
2. It makes the permission refusal path real. With access Denied, Restricted or Not now, the whole choose-and-attach job still works through Apple's picker (this is the PRD's ACC-1, ACC-4 and ACC-5 fallback; today the fallback is the single-photo modal).
3. It adds a new module surface. If the SwiftUI view is made with `photoLibrary: .shared()` it contains `PHPhotoLibrary`/`photoLibrary` text, which the source scan in `apps/mobile/test/photos-device.test.ts` forbids in `scribe-photo` (the scan's `never` list includes `PHPhotoLibrary` and `\bphotoLibrary\b`; line 513, and tests at lines 625 to 677 that fail if it is added). So the library-aware picker must live in the library module (or a new one) under the G3 and G11 gates, and `scribe-photo` must keep its scan. The no-library picker can live in `scribe-photo` under its existing scan.

## 6. Options in one line, and the decisive differences

| | A2 `@expo/ui` extension, inline picker | B or B' own module, UIKit or SwiftUI | C1 `expo-image-picker` | C2 `react-native-image-picker` |
|---|---|---|---|---|
| Inline in the tab | Yes | Yes | No | No |
| Zero permission strings by default | Yes | Yes | No (plugin writes three strings) | No (README: library string) |
| Uses standard open source parts | Most | Fewest | Yes | Yes |
| New native code to own | One view, small | One view plus host | None | None |
| Fits the paper design | Frame yes, grid Apple's | Same | Modal | Modal |

## 7. The hybrid questions (from Karma's correction)

### 7.1 (a) How the inline picker behaves when the app HAS library authorization

Full access: the picker made with `photoLibrary: .shared()` returns `itemIdentifier` (SwiftUI) and `assetIdentifier` (UIKit `PHPickerResult`), "local identifiers because of initializing the configuration with a photo library" (sample page). With full authorization the local identifier resolves with `PHAsset.fetchAssets(withLocalIdentifiers:options:)`, which is how `expo-image-picker` reads video assets when it has `.authorized` or `.limited` status (`MediaHandler.swift`, read). The app then has everything PhotoKit offers: creation date, location, subtype flags, full resource. Apple documents that with full library access the picker's Options menu (metadata removal) "will not be supported" (session, as summarised): UNVERIFIED on a device. Practical effect: in ACC-2 a parent cannot use the Options menu to remove location, but our own copy is stripped anyway.

Limited access: two findings, both from Apple Developer Forums replies labelled "Engineer", so UNVERIFIED as documentation:
- The picker shows the entire library regardless of the limited selection. Thread 759040: "It shows the entire photo library, with a note at the top saying that the app can only access the items that I select." The reply: "In this case, the asset data is only accessible through the item provider, not the asset identifier." The poster found `fetchAssetsWithLocalIdentifiers` returns no results for the identifier.
- Thread 710587 (reply labelled Apple, Jul 2022): "Limited Library will not be automatically extended when items are selected using PHPickerViewController. You should still be able to access image data using the returned NSItemProvider provided in the PHPickerResult object." The thread's author reports that item providers failed to load images outside the limited list; the reply does not address that. So the two threads disagree on whether data loads for a non-granted pick. This is spike item S3.

Apple's own limited-library page (read) says the limited selection means "your app can only access these assets", and that the PhotoKit APIs otherwise "largely function the same". It does not describe the picker. The caveat is therefore: in Limited, the picker shows everything; only granted assets resolve to a `PHAsset`; a picked non-granted asset is, per the threads, still reachable through the item provider, and its identifier will not resolve.

Design answer: never depend on a resolvable identifier for the attach path. Attach always uses the item provider (7.2). Identifiers are used only for two optional things that need a resolvable asset: the teaching verbs ("Not this one", "Keep close") that store a day key or id, and preselection (7.3). If an identifier does not resolve, those verbs are not offered for that picture, with no message. Cards in ACC-3 stay built only from the granted set, as the PRD says (NS-53-R75).

Also: no prompt change. The picker does not extend the limited selection. "Choose which pictures" (the limited picker, `presentLimitedLibraryPicker`) stays as the one quiet control for the feed, per the PRD.

### 7.2 (b) Passing a selection from the embedded picker into our Keep and attach flow

Design (pull, not push):
1. Native: the SwiftUI view holds `@State var selection: [PhotosPickerItem]` and emits one event per change containing only: the count, each item's `supportedContentTypes` reduced to "image" or "video", and, where an identifier exists, that identifier. It does not load any data. Nothing is read before Keep.
2. JS (`lib/moments`, not the screen): keeps the count and kinds in memory for the tray and the cap check (at most 6 pictures or 2 videos, NS-52-R1 and R2; the picker's `maxSelectionCount` enforces only a count, so the video limit and the 60 second limit are ours to check, after load for duration).
3. Keep: JS calls one native function `exportSelection(destinations: string[]) -> {uri, kind}[]`. Swift copies each chosen item to a plain file name under `Caches/ImagePicker` using `loadTransferable` with a file representation (SwiftUI sample page recommends file representation for many or large items), with `preferredItemEncoding: .current`. Each result is one of the existing closed error codes. This is the same destination and name rules as `pickOne` (`fileIn`), so the one stripper (`reencodeUpright`, R220's "the one stripper stays one stripper") is the only way a file becomes a letter picture.
4. JS hands `AttachRequest` the file URIs to `startCapture({source:'moment'})`, exactly as the one-shot in-memory hand-off of PRD 9.1 step 3 (no id in a route).
5. Before the strip, `scribe-photo` may read the capture date and, if the place table is on, a coordinate to a place id in Swift, and drop the coordinate (R61, R228). The picker path gives the same bytes in ACC-2 and in no-library modes, so there is one code path.

Difference from the spec: the spec copies at letter Keep ("nothing copied before Keep", 9.1). Here the copy happens at our pictures Keep, one step earlier than the letter's Keep. Backing out of capture after that leaves temp files in `Caches`, which the existing launch sweep already removes (PRD 10.3, 9.2 "temp files swept at launch"). Worth confirming in review: UNVERIFIED that the sweep covers `Caches/ImagePicker` for this case (read the sweep).

Why pull and not the other way (stream each item as picked): `continuous` selection fires on every tick and untick; loading data per tick copies files that may never be used, and a tick that is undone needs cleanup. Pull keeps "nothing copied before Keep".

### 7.3 (c) Can the picker be filtered or preselected to a Moments date range or a suggested group?

| Want | Possible | Evidence |
|---|---|---|
| Filter to a date range | NO at iOS 17. `PHPickerFilter` has `images`, `livePhotos`, `videos`, `bursts`, `cinematicVideos`, `depthEffectPhotos`, `panoramas`, `screenRecordings`, `screenshots`, `slomoVideos`, `timelapseVideos`, `landscapeAspectRatio`, `spatialMedia`, and `any(of:)`, `all(of:)`, `not(_:)`, `playbackStyle(_:)`. No date or time predicate | VERIFIED, `PHPickerFilter` page |
| Filter to a collection or scope | Only on the newest systems. `PHPickerConfiguration.containerIdentifier` ("The collection of items that can be shown"; `nil` means any) is listed as iOS 27.3, and `searchText` as iOS 27.0, `title`, `minimumSelectionLimit`, `aspectRatio`, `primaryButtonType` as 27.3. Our floor is iOS 17.0, so these are `#available` extras at best. What `containerIdentifier` accepts (an album, or something else), and whether `searchText` can express a date, are not in the pages I read: UNVERIFIED | VERIFIED availability; semantics UNVERIFIED |
| Preselect a suggested group (the day's pictures already ticked) | YES, when the picker has a library. UIKit: `preselectedAssetIdentifiers` (iOS 15), "works only when initializing ... with a photo library. Otherwise, the system returns an error"; results "include all preselected identifiers when canceling" and "don't include item providers for preselected assets that remain selected"; the done action is disabled while the count exceeds `selectionLimit`. SwiftUI: `PhotosPickerItem(itemIdentifier:)` "creates a picker item with the identifier you specify, and without any representation" and the `photoLibrary:` initializers (identifiers need a library); whether an inline `PhotosPicker` honours a pre-filled selection binding and scrolls to it is not stated: UNVERIFIED, spike item S4 | VERIFIED for the UIKit API; SwiftUI behaviour UNVERIFIED |
| Preselection quirk that matters for us | Preselected items that stay selected come back WITHOUT an item provider. For the attach path, which needs the data, the app must load preselected assets itself, by resolving the identifier (which works only with authorization) | VERIFIED text; implication follows |
| Scroll the grid to a date | No API read. `scrollToInitialPosition()` resets to the initial position only (iOS 17, UIKit) | VERIFIED |
| Preselect when Limited | Only ids from the granted set exist in our suggestions, so preselection works for them | Follows from 7.1 |
| Preselect with no library | Not possible. No identifiers exist in that mode | VERIFIED |

Design consequence: a suggestion card (the day of the 14th, with its pictures) opens the picker with the suggested pictures ticked (ACC-2 and ACC-3 only). The parent unticks what they do not want and scrolls Apple's grid to add others. The picker does not scroll to the date; the parent sees the grid at the picker's own position. This is weaker than the spec's day sheet, which shows exactly that day's pictures in time order. It is the honest price of using Apple's grid. Where a precise day view is wanted, keep our own day tile row for suggestions only (7.4).

### 7.4 (d) The hybrid recommendation, and which planned screens it removes

Recommended hybrid ("H"):
- Keep the library read and everything proactive: `scribe-library` (access status, fetch window, place id, thumbnails for cards), the engine, For you, Recent cards, nudges, teaching verbs.
- Replace our own choosing UI with Apple's inline picker inside the `moments/pick` route. The route body is the picker (section 3.3). Suggestion cards enter it preselected (ACC-2, ACC-3); cards without library, and every ACC-0, ACC-1, ACC-4, ACC-5 and flag-off state, enter it empty, with no library, no identifiers and no preselection.
- Two picker constructions, one view: with `photoLibrary: .shared()` only when authorization is full or limited; without a library otherwise. This keeps the no-access build provably free of identifiers and of library calls in the module that must not have them (5.2 item 3).

Screens and PR rows removed or shrunk (sizes from PRD 19.4, all ASSUMED):

| Planned item (PRD 19.4 and R220) | Under H |
|---|---|
| Day sheet (in PR 17: "Primer, ask flow, Recent, day sheet", 400 lines) | REMOVED. Replaced by the picker route body and tray. Expected saving about 150 of the 400 lines |
| Viewer: PR 20, "Viewer (full image, video poster and play)", 300 lines | REMOVED. Apple's picker has its own full-size preview; our viewer, its pinch and pan, and the poster play are not built. 300 lines |
| PR 10, "Native thumbnail view, bounded LRU, cancellation", 350 lines | KEPT but smaller: thumbnails for cards only, no day-sheet tiles at 96 pt. Saving about 100 lines |
| R220 library functions "full image and player item or poster for the day sheet" | REMOVED from `scribe-library`. Narrows G11(a) |
| PR 21 teaching verb "Use album" and the album chooser | REMOVED. Apple's albums tab (if left on) replaces it. "Keep close", "Leave out", "Name" stay and need a resolvable id (7.1) |
| PR 18, copy-for-attach in `scribe-photo` | CHANGED: copies from the item provider at pictures Keep (7.2), not from library ids. Same size |
| PR 19, capture hand-off | CHANGED: carries file URIs, not ids. Same size |
| Limited "Choose which pictures" control | KEPT, unchanged |
| New: `ScribePickerView` and `exportSelection`, the route body and tray, preselection | ADDED, see section 8 |

Net: roughly 550 lines removed (ASSUMED) and about 1,150 added (section 8), so the hybrid is about 600 lines larger than the spec in total but removes the two riskiest UI screens (the 20,000-item grid on an iPhone SE 3 in G1b, and the viewer's gesture and VoiceOver work).

What the hybrid does NOT remove: the library permission, purpose string, primer, G1 to G3, G7, G8, G11 and the 5.1.2 questions, because the library read still ships. It also does not give a date-ranged picker (7.3).

## 8. Recommendation (question 6)

One option: H with A2. Build the inline Apple picker as a custom SwiftUI view registered through `@expo/ui`'s "Extending with SwiftUI" mechanism (MIT, already in the app, documented for SDK 57), shown inside `Host`, in the `moments/pick` route, as the only way to choose pictures. Library-aware (preselection and identifiers) only in the library module and only when authorization is full or limited; library-free otherwise, in `scribe-photo`. Our tray, Keep and Not now, header and frame use the design tokens; the grid stays Apple's.

Effort in PRs, using the spec's 19.4 sizes as the yardstick (changed lines excluding generated data, each under CODE-R02: 400 lines and 20 files):

| New PR | Content | Size (ASSUMED) |
|---|---|---|
| H1 | `ScribePickerView`: SwiftUI inline `PhotosPicker`, props (max count, library mode, preselected ids), events (count, kinds, ids), `ExpoUIView` registration, TypeScript wrapper, podspec with `ExpoUI`, source scan (no `requestAuthorization`, no `PHAsset`, library init only in the library file), Swift compile job | 380 |
| H2 | `exportSelection` in `scribe-photo` (item provider to `Caches/ImagePicker`, closed error codes, path rules reused), `lib/moments/picker-selection.logic.ts` (pure caps and state, tested in Node) | 350 |
| H3 | `moments/pick` route body: header, framed picker, tray, Keep and Not now, states ACC-0 to ACC-5 entry, content keys, tests at AX sizes | 400 |
| H4 | Library-aware entry: preselect from a suggestion, resolve ids only when authorized, "no resolvable id" handling, teaching verbs wiring | 250 |

Total about 1,380 lines in 4 PRs, against roughly 550 lines removed from PRs 10, 17 and 20 (7.4). Fallback only (no library in the build, the picker as the whole path): H1 + H2 + H3 without H4, about 1,130 lines in 3 PRs, and it would replace PR 9, PR 10, PR 15's library part, PR 17, PR 20 (about 1,800 spec lines across PRs 9, 10, 17, 20 and part of 15, ASSUMED). The picker is the cheaper of the two routes by this yardstick; the cost is the proactive features (section 4).

Open risks:
1. No maintained open source component exists for the inline picker (section 2). We own about 400 lines of Swift against SwiftUI APIs that Apple may change; the `ExpoUI` extension API is documented for SDK 57 but I did not check its stability promise: UNVERIFIED.
2. Appearance at paper: whether the grid shows our paper or Apple's system background, and whether the inline picker can be framed cleanly at `md` radius (S5).
3. Accessibility inside the grid is Apple's. The PRD's G5 must test it.
4. Limited access: the threads conflict on whether a non-granted pick loads (S3).
5. `Keep` naming collides with the letter's Keep (3.3).
6. Location: parent Options-menu removal means a place line is best effort; set the expectation in the PRD (7a.1 already says first-release places are coarse and rare).
7. The 2 video and 60 second caps are not enforceable by the picker; they need a check after load.
8. A library-aware picker must sit in the library module, not in `scribe-photo` (the scan forbids it there), so H1 either lives in `scribe-library` or the scan is extended with a reviewed exception: needs `security-architect` (the roster does not route `apps/mobile/modules/**` to them, so ask in the PR body, per the `expo-native-module` skill).
9. Dependency: `@expo/ui` already approved and installed; no new package is added, so AIE-R21's founder approval for a new dependency should not be needed. Confirm.

Decisive test to run first, on a real iPhone (iOS 17 and the newest available), as a throwaway spike script, no code merged: a local Expo module on a spike branch with one SwiftUI inline picker and five switches, run against a script-made library of about 200 items (some with GPS, some without, one iCloud-only, one video over 60 seconds, a HEIC, a screenshot).

| Spike | Question | Pass |
|---|---|---|
| S1 | Does the no-library inline picker raise any system prompt or console permission message, with no purpose string in the plist? Does `photoLibrary: .shared()` raise one with access not determined? | No prompt in either |
| S2 | Do `.inline`, accessories hidden, `[.search, .collectionNavigation, .stagingArea, .selectionActions]` disabled and `.continuous` give a clean grid with no Cancel and no Add, and a live count in a React Native `Host` on an iPhone SE 3 at default size and AX5? | Yes, and the count updates per tick |
| S3 | Authorization Limited with 5 granted: pick 3 granted and 3 not granted. Do identifiers resolve for the 3 granted only, and does the item provider load data for the 3 not granted (threads 710587 and 759040 disagree)? | Data loads for all 6, ids resolve for 3. If the non-granted do not load, the hybrid must say so on Limited |
| S4 | Preselect 4 suggested ids in an inline SwiftUI picker (a pre-filled selection built with `PhotosPickerItem(itemIdentifier:)`) and in the UIKit `preselectedAssetIdentifiers` path. Does it tick them, does it scroll to them, do untouched ones return without a provider? | Ticks yes; scroll position noted; the app loads preselected data itself |
| S5 | Is the picker background paper or system white; does `.background` or a frame change it; does light and dark follow `Host colorScheme`; is the privacy onboarding visible on first appearance; can it be seen again? | A clean frame at `md` radius with the badge visible |
| S6 | EXIF: for each of the 200 items, read DateTimeOriginal and GPS from the exported file with `preferredItemEncoding: .current`, then with the user's Options menu "remove location". Is GPS absent when removed? Present for HEIC and JPEG? Rate of missing date | Rates recorded; read-out holds rates only (no picture content) |
| S7 | VoiceOver, Switch Control and Voice Control: can each select 3 pictures and reach our Keep? | Yes, or the fallback route is named |

Output: one dated read-out (timings and rates only, per the PRD's G1a rule), which becomes the input to H1.

## 9. UNVERIFIED items that matter

1. Whether creating a picker with `photoLibrary: .shared()` raises the system prompt (S1). Everything about the "no permission" claim for the library-aware picker rests on Apple's sample text, not a device.
2. Limited access: whether a non-granted pick loads via the item provider, and that its id does not resolve. Forum replies only (threads 710587 and 759040); not Apple documentation (S3).
3. Whether the inline SwiftUI `PhotosPicker` honours a pre-filled selection and scrolls to it, and what `containerIdentifier` and `searchText` (iOS 27.x only) accept. No date range filter exists at iOS 17 (VERIFIED), so a suggested day can only be preselected, not shown alone (S4).
4. Whether the Options menu (location removal) is available when the app has full library authorization, and where it sits with the bars hidden. Session summary only.
5. Whether the first-appearance privacy onboarding can be restyled or suppressed (S5). The session says it appears automatically.
6. Accessibility of the inline grid under VoiceOver, Switch Control, Voice Control and keyboard (S7). One forum thread title seen, body not read.
7. Legal reading: whether data from the out-of-process picker is "from Photo APIs" under 5.1.2(iv) to (vi) (guideline text VERIFIED, application is counsel's), and the Apple privacy label treatment of Photos and Location for on-phone EXIF reads (label definitions not read).
8. The WWDC23 10107 quotes were read through a page summariser, not the video; the `@expo/ui` extension API stability promise, any Expo plan for a built-in `PhotosPicker`, and `react-native-multiple-image-picker` and `react-native-image-crop-picker` library permission behaviour in detail were not read.
9. Whether the launch sweep covers `Caches/ImagePicker` for an abandoned capture that started from the picker.

## 10. Content check

This file was checked against the repo's content rules: no em dashes, en dashes, curly quotes, ellipsis characters or emoji; the fictional family is Asha only (named once in the header, no real family details); no model names. Product wording quoted from the PRD (Keep, Not now) is the PRD's own; final words belong to `content`.

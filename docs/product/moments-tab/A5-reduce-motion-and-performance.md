# Moments tab: Reduce Motion, performance and testing of motion (A5)

Status: PROPOSED, 21 Nov 2026. Author: animation lead A5 of 5. Branch `wip/moments-a5`. Docs only. Nothing here is built, and nothing here has been seen or measured on a phone.

Where this doc disagrees with another doc or with A1, it says so and marks it **RECONCILE**. It changes no ruling by itself.

## 1. Purpose and scope

A1 says what moves on the Moments tab. This doc says three other things:

1. What every one of those motions does when a parent has Reduce Motion, Reduce Transparency, Increase Contrast, Low Power Mode or a hot phone.
2. How fast it must be and how much memory a photo-heavy feed may use, on an iPhone SE 3 and on a 120 Hz phone.
3. How we test motion, and which claims no test on a Linux machine or a simulator can prove.

In scope: frame budgets; which thread animates what (Expo SDK 57, Reanimated, native); thumbnail sizes, caching and recycling for a feed of day collages; battery and thermal limits; unit tests, Maestro flows and a manual device checklist; the list of things we cannot know without a real iPhone.

Out of scope: what moves and for how long (A1), the transitions between screens (transition leads), the design of the cards (design concept), words (content), and Route A versus Route B (feasibility). Where the route changes performance, this doc says so in section 4.9.

The founder's direction applies: learn from the screenshots and do it smarter. For performance, smarter means a quiet feed that never janks under a thumb, never heats a phone and never keeps more pictures in memory than are on screen.

## 2. Inputs read

Read this session, in a fresh clone of `develop` (not the founder's working copy), plus the A1 branch.

| Input | Path or id | Used for |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | scope, constitution, privacy, reversals |
| A1 motion principles | branch `wip/moments-a1`, `docs/product/moments-tab/A1-motion-principles.md` (head 802f858), MT-A1-R1 to R24, sections 4, 5, 8 | every motion this doc covers |
| Motion system | `docs/design/MOTION.md` section 7 (performance rules 1 to 6), 5i, 5j, 5k | rules, loops, lamp, tabs |
| Budgets | `docs/BACKLOG.md` line 84 (Definition of Done item 8), BL-929, BL-930; `docs/tdd/01-mobile-client.md` section 5.3 (budget table); `docs/qa/DEVICE_TEST_PLAN.md` S1-03 | cold start, transitions, battery |
| Measurement plan | `docs/engineering/readiness-20nov/performance/MEASUREMENT-PLAN.md` sections 2 and 4 (H1 to H10) | harnesses, content-free markers, Instruments |
| Perf markers | `apps/mobile/src/lib/perf/markers.ts`, `apps/mobile/test/perf-markers.test.ts` | closed event list, content-free rule |
| End to end | `apps/mobile/e2e/README.md`, `apps/mobile/e2e/flows/` (20 Maestro flows) | what Maestro already does here |
| Memory library spec | `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` lines 198, 290, 317 | tile loading rules |
| Photo card | `docs/product/prd/01-photo-with-a-letter.md` (thumbnail rules R3, R39, R42) | thumbnail precedent |
| App config | `apps/mobile/app.config.ts:244` | `CADisableMinimumFrameDurationOnPhone: true` is set |
| Dependencies | `apps/mobile/package.json` | Expo `~57.0.26`, React Native 0.86.3, Reanimated 4.5.1, Gesture Handler `~2.32.0`, bottom-sheet `^5.2.14`, `expo-device`, `react-native-svg`; **no** `expo-image`, **no** `expo-battery`, **no** list library |
| Native modules | `apps/mobile/modules/scribe-photo` | picker copy only; no PhotoKit thumbnail call (comment in `index.ts` line 6: no photo library) |
| Apple pages fetched | see section 12 | thumbnails, thermal, Low Power Mode |
| Other docs | Reanimated performance guide, `expo-image` docs | animation cost, image cache, recycling |

Not found: the Moments concept, feasibility and privacy docs as merged files. I did not check their branches beyond listing `wip/moments-*` heads. **Assumption:** Moments is a vertical list of day cards, each with a collage of up to a handful of thumbnails and a compose button, under a For you and Recent switch (the same assumption as A1). Reconcile in Q1.

I did not open the founder's screenshots. They are not needed here and hold real family details.

### 2.1 Where I disagree with a doc or with A1

- **RECONCILE (MOTION 5j and A1 section 8):** both say Low Power Mode turns the empty-state breath off "via `expo-battery`". `expo-battery` is not in `apps/mobile/package.json`. Also, Apple says that in Low Power Mode the system itself reduces animations (section 12). We do not need a new dependency to be calm: the only loop is an opacity breath, and R9 below proposes reading Low Power Mode only if the design systems lead adds the dependency (permissive licence, Definition of Done). Until then Low Power Mode is a device check, not a feature.
- **RECONCILE (A1 R24):** A1 says "no frame exceeds 16.7 ms on the SE 3 and a mid-tier 60 Hz Android". `MOTION.md` rule 6 says the same. On a 120 Hz phone the frame is 8.3 ms (arithmetic: 1000 / 120). A1 has no 120 Hz statement. R2 here adds one.
- **RECONCILE (BL-930):** the proposed wording for NFR row 42 (start within 100 ms, controls usable by 350 ms, no frame over 16.7 ms) is blocked and unmerged. I cite it as proposed, not as a ruling.
- **A1 R8 placeholder grace** is left "to be tuned on device". I agree and add how to measure it (R14), but I propose no value.

## 3. Reduce Motion and the other display settings

### 3.1 One mechanism

Every Moments component reads `useMotion()` (design systems; Reanimated `ReduceMotion` is set to `Never` on our own timing so that the token, not the library, decides, as `apps/mobile/src/components/ui/agreement-row.tsx` does). No Moments file reads `AccessibilityInfo` directly. This matches A1 R16 and `MOTION.md` principle on one mechanism.

Under Reduce Motion the rule is: opacity only, 200 ms (`fadeMs`), or no motion at all where the state change is instant. No slide, no scale, no spring, no draw, no loop, no lamp breath.

### 3.2 Every motion in A1 and what it does under each setting

The first column is the A1 section 4.1 row. "RM" is Reduce Motion. "RT" is Reduce Transparency. "IC" is Increase Contrast.

| A1 row | Motion | Reduce Motion | Reduce Transparency and Increase Contrast | Low Power Mode or hot phone (serious) |
|---|---|---|---|---|
| 1 | Cold-launch `enter` on first 3 blocks (y 8, 280 ms, 30 ms stagger) | 200 ms opacity fade, no y, no stagger | no change | skip the stagger, keep the fade (R9) |
| 2 | `heroEnter` (dy 12, 420 ms), first install only | 200 ms opacity fade | no change | 200 ms fade |
| 3 | Optional one-time line drawing (off in v1 per A1 Q4) | shown complete, no draw | no change | shown complete |
| 4 | Switch cross-fade, `swapMs` 150 | unchanged (opacity only) | no change | unchanged |
| 5 | Thumbnail fade-in, `fadeMs` 200 | unchanged (opacity only) | no change | image appears with no fade (R9) |
| 6 | Permission state cross-fade, 200 ms | unchanged | no change | unchanged |
| 7 | Prompt refresh cross-fade, 150 ms; height by `standard` spring if a line is added | text cross-fade stays; the height change is instant, no spring | no change | height instant |
| 8 | Press scale (0.97 control, 0.98 card) on `snappy` | no scale; opacity 0.9 only (the `press` token already has an opacity) | no change | unchanged (cheap) |
| 9 | Card to capture, platform rise | the platform decides (native sheet and stack honour RM themselves); our own scrim fades 200 ms | no change | unchanged |
| 10 | Hide a day: exit 160 ms, then `LinearTransition` on `standard` | card fades 160 ms, gap closes instantly, Undo stays | no change | gap closes instantly |
| 11 | Lamp, one still scene `moments` | still final state, no return settle | plain paper, lamp off | still |
| 12 | Focus move, no motion | unchanged | unchanged | unchanged |

Rules that follow:

- **RM never removes information.** A hidden card still leaves, a prompt still changes, the Undo still shows. Only the travel is removed (A1 R18).
- **RM can change while the app is open.** Components subscribe, so a loop in flight stops at once (A1 R16, Edge paths).
- **Reduce Transparency never removes a control.** Our own glass controls (at most three surfaces per DESIGN-LANGUAGE-V2) show the solid `glassFallback`. The tab bar is the system's and adapts itself (A1 R17). **UNVERIFIED:** how the SDK 57 paper tab bar behaves under Reduce Transparency; first device check.
- **Increase Contrast** changes borders and colour tokens, never timing. Any state that used colour alone to say "selected" also shows weight and shape (A1 section 4.5).
- **Smart Invert** (`accessibilityIgnoresInvertColors`) applies to every photo and video thumbnail, as NS-01-R40 asks for pictures. A feed of inverted family photos would be a real harm to a parent using Smart Invert.
- **Prefer Cross-Fade Transitions** (the iOS setting that swaps slides for fades): UNVERIFIED how it interacts with our stack routes. Device check D7.

### 3.3 What Reduce Motion does not cover

Reduce Motion is not a performance mode. A phone with Reduce Motion on must still meet every frame budget in section 4, because scroll is motion we do not own and cannot switch off. The feed scrolls the same way under every setting. That is why the thumbnail and memory rules (section 5) matter more than any animation rule.

## 4. Frame budgets and threads

### 4.1 Budgets

| Budget | Value | Source |
|---|---|---|
| Frame time at 60 Hz (iPhone SE 3) | 16.7 ms, no frame over | `MOTION.md` rule 6; `docs/tdd/01-mobile-client.md` section 5.3 (screen transitions) |
| Frame time at 120 Hz | 8.3 ms (1000 / 120) | arithmetic; no repo doc states it, so this is a **proposal** |
| Transition start / complete | start within 100 ms, complete 350 ms | TDD 01 section 5.3; BL-930 proposes the same wording (unmerged) |
| Controls usable | by 350 ms | BL-930 (proposed) |
| Any Moments sequence | at most 900 ms; hard ceiling 2000 ms | A1 R1; `motion.sequenceMaxMs`, `hardCeilingMs` |
| Cold start | p50 at most 1.2 s, p90 at most 2.0 s on iPhone SE 3 | BACKLOG Definition of Done item 8; DEVICE_TEST_PLAN S1-03 |
| Warm start | p50 400 ms | agent brief for `mobile` (not re-checked in TDD this session) |
| No awaited network or model load on launch | yes | BACKLOG item 8 |
| Scrolling a big list | no frame over 16.7 ms while scrolling 240 letters | BACKLOG line 2636 (Book); the Moments feed adopts the same bar |

The cold start budget has one consequence for Moments, which A1 4.8 makes the landing tab if the founder signs it: the first frame of the tab must not wait for the library. See R5.

### 4.2 Hitches versus frames

A JS marker cannot see a UI-thread frame (MEASUREMENT-PLAN section 4: "frame hitches come from Instruments, not markers"). So:

- Unit tests prove logic and timelines.
- Frame claims come from Instruments (Animation Hitches) on a development-signed Release build, or a 240 fps second-phone video (MEASUREMENT-PLAN H7 and H8). Instruments cannot attach to a TestFlight build ([U] in that plan).
- A simulator number is never frame evidence.

### 4.3 What runs on which thread (Expo SDK 57, Reanimated 4.5.1, RN 0.86.3)

| Work | Thread | Rule |
|---|---|---|
| Scroll offset of the list | the native scroll view (UI thread) | we read it only to anchor or restore, never `setState` per frame |
| Opacity and transform animations (press, fades, enter, switch) | UI thread via Reanimated worklets | JS writes targets, not frames (`MOTION.md` rule 1) |
| Layout animation (`LinearTransition` after a hide) | UI thread, but it drives layout | allowed only for the one hide gap and one prompt-height change; never inside a scroll |
| Image decode | native (off the main thread, by the image view or PhotoKit) | never decode in JS; never in a render |
| PhotoKit requests (Route B) | a PhotoKit queue, results on a callback | a native module call, batched; never one JS bridge call per frame |
| Photo library change observer | native, then one batched event to JS | coalesce (R17) |
| Permission checks | native, async | never awaited on the first frame (R5) |
| Haptics | native, fire and forget | never gate a commit on it (A1 R22) |
| Our state machines (`moments.logic.ts`) | JS, pure | no React, testable on Linux |

Reanimated's own guide, read this session, says non-layout properties (`transform`, `opacity`, `backgroundColor`) are generally more performant than layout ones, which cost a layout pass on each frame, and gives a rough limit of "no more than 100 components for low-end Android and no more than 500 for iOS" animated at once (section 12). Moments animates far fewer: see R10.

Reanimated's guide also lists a scroll flicker problem for animated components inside `FlatList` or `ScrollView` and the feature flags that address it. **UNVERIFIED for our build:** whether any of those flags are needed with RN 0.86.3 and Reanimated 4.5.1. First device check D3 looks for it. We do not turn on an "experimental" flag the guide itself warns about without a measured reason.

### 4.4 120 Hz

`CADisableMinimumFrameDurationOnPhone` is already `true` (`app.config.ts:244`), so the app is allowed to render above 60 Hz. I could not read Apple's ProMotion page this session (it needs JavaScript; the fetch returned no text), so what Apple says about the key and about frame-rate ranges is **UNVERIFIED** here. The repo rule is that "all smoothing uses `dt`" (`MOTION.md` rule 4).

Consequences for Moments:

- No hard-coded 16.7 ms step. Timed motion uses duration, springs use stiffness and damping. A1 tokens already do.
- A frame budget on a 120 Hz phone is 8.3 ms, but the pass bar is "no more hitches than at 60 Hz, and no frame over 16.7 ms" until a device run shows that 8.3 ms is realistic for a list of images. I will not invent a stricter pass number.
- Low Power Mode may cap the refresh rate on some phones. **UNVERIFIED**; device check D5.

### 4.5 One loop at most

Same as A1 R15: at most one loop, only on the focused tab, stopped on blur, on background and under a sheet. The Moments scene lamp is still. The empty-state breath is the only loop. A scroll-linked effect is not a loop and is already banned by A1 4.4.

### 4.6 What this means for the list

- Day cards are pressables with fixed collage frames (A1 R8). No `onLayout` measuring after first paint to size a collage.
- Row height is knowable before images arrive, so a list can recycle rows and keep the scroll offset.
- No animated style on a card that is not pressed, entering or leaving. A card at rest has no worklet attached.
- Gesture objects inside list rows are created once (memoised), because Reanimated's guide says this matters for `FlatList` items (section 12).

### 4.7 The list component

The repo has no list library today. React Native's own `FlatList` is the standard choice and needs nothing new. A faster recycling list is a new dependency and a design systems and `mobile` decision. I do not recommend one here without a measurement: first build on `FlatList`, then measure on an SE 3 with the fixture in section 7.3, then decide (Q3).

### 4.8 What the frame budget excludes

The system sheet, the system permission alert and the system tab bar animate in system code. We neither slow them nor speed them. If a hitch shows during them it is logged as "platform", not as ours, with the iOS version.

### 4.9 Route A versus Route B

- **Route A (Apple's journaling suggestions picker):** the picker is a system sheet. Its frame rate, its memory and its thumbnails are Apple's. We budget only what happens after it closes: the picked items arrive on our paper through the R8 rules in A1. Nothing in section 5 applies before they arrive. Whether the app receives full images, file URLs or only identifiers is **UNVERIFIED** (feasibility owns it).
- **Route B (our own PhotoKit read):** every rule in section 5 applies. This is where a photo-heavy feed can hurt, so it is the route this doc sizes.

## 5. Thumbnails, memory and recycling (Route B, and any picked photo on a card)

### 5.1 What Apple's pages say (read this session)

- A caching image manager "can prepare asset images in the background" and is meant for "populating a collection view or similar UI with thumbnails of photo or video assets". You start caching with the same target size, content mode and options that you later pass to `requestImage`. If the image you request is already prepared, the manager returns it immediately. Otherwise Photos prepares it on demand and caches it (PHCachingImageManager page).
- The image manager "caches the asset images and data it provides, so later requests for the same assets with similar parameters will return results more quickly", and for many assets you "preheat" the cache "ahead of the current scroll position" (PHImageManager page).
- The manager lets you cancel an asynchronous request (`cancelImageRequest`) and gives a special value for the largest image available (`PHImageManagerMaximumSize`) (PHImageManager page). We must never pass that maximum for a thumbnail.
- `PHImageRequestOptions` has `deliveryMode`, `resizeMode` and `isNetworkAccessAllowed` ("whether Photos can download the requested image from iCloud") (PHImageRequestOptions page). The page I fetched lists them but I did not get the wording of each mode, so what each `deliveryMode` value does is **UNVERIFIED** here.

### 5.2 Sizes, as arithmetic

Pixel memory for a decoded bitmap is width times height times bytes per pixel. I use 4 bytes (RGBA, 8 bits per channel). Wide-colour or HDR formats may use more: **UNVERIFIED**.

| Image | Pixels | Decoded size (4 bytes per pixel) |
|---|---|---|
| A 4032 by 3024 original (the stored-copy ceiling in NS-01 R37a is 4,032 px on the long side) | 12,192,768 | 48,771,072 bytes, about 46.5 MiB |
| One thumbnail, 160 by 160 pt at 2x = 320 by 320 px | 102,400 | 409,600 bytes, about 0.39 MiB |
| One thumbnail, 160 by 160 pt at 3x = 480 by 480 px | 230,400 | 921,600 bytes, about 0.88 MiB |
| A 100-thumbnail window at 3x, 160 pt | 23,040,000 | 92,160,000 bytes, about 88 MiB |

The scale factors (2x on SE 3, 3x on large iPhones) are recalled from device specs and are **UNVERIFIED** this session. Read them from `PixelRatio` on the device, never from a constant.

Two conclusions:

1. One full-size decode is about as large as 119 thumbnails at 2x (48,771,072 / 409,600, rounded). A single mistake (asking for full size on a collage) costs more than a screenful of correct thumbnails.
2. A window of 100 thumbnails at 3x is already large. A feed must hold only what is near the screen, not every day it has loaded.

### 5.3 Rules

- **Request at display size times scale, never bigger.** The target size is the collage cell in points times `PixelRatio`. A collage with a big cell and small cells asks for each its own size.
- **Same parameters when preheating and requesting** (Apple's page requires it to hit the cache).
- **Preheat ahead of the scroll direction; stop caching what scrolled away** (`stopCachingImages`). Cancel in-flight requests for rows that left the window.
- **No network.** `isNetworkAccessAllowed` is false for thumbnails. A photo only in iCloud shows the static placeholder and no spinner (A1 R12, R8). This also protects privacy: an iCloud download is a network event the parent did not start. **UNVERIFIED:** whether a degraded thumbnail is delivered for an iCloud-only asset when network access is off (an Apple forum thread suggests no low-quality substitute for cloud assets; I did not read it in full, so I do not rely on it).
- **Never animate image size or crop.** Fade only (A1 R6, R8).
- **Fixed frame before the image exists** (A1 R8), including for a failed decode.
- **Do not decode on the JS thread.** The native side hands the image view a thumbnail it can show.
- **Recycle by identity.** If a row is reused for another day, the old image must not show for a frame. If we adopt `expo-image`, its `recyclingKey` prop "resets the image view content to blank or a placeholder before loading", meant for recycled views (section 12). If we use the stock `Image`, a recycling list must clear the source on reuse. Either way this has a test (R12).
- **Memory cap on the window.** The number of live thumbnails is a fixed constant in `moments.logic.ts` (window size) with a test. I do not set the number: it is set from the first SE 3 Allocations run (D4). Until then the proposed procedure is: start at the screenful plus one screen ahead and one behind, and measure.
- **Memory warning.** On a system memory warning the window shrinks to the visible rows and the cache is dropped. The pictures are re-requested when the parent scrolls. Nothing else is lost.
- **No thumbnail is written to disk by us** for Route B. Photos' own cache is the cache. A thumbnail file of a family photo that lives in our container would be a new private file with its own lifecycle, a Data Not Collected story, and an export and deletion duty. **Flag for the privacy lead:** if feasibility decides we need our own disk cache, it needs a cache directory that is excluded from backup and purged on library-access loss. I do not propose it.
- **Videos show a still and a plain static length** (A1 R6). We request a poster frame, never a player, never autoplay. A video's still counts as one thumbnail.
- **Live Photos are stills here.** No live playback (A1 R6).

### 5.4 If we adopt `expo-image` (decision for design systems and `mobile`)

Facts read this session (section 12): the default cache policy is disk; `memory-disk` keeps images in memory with a disk fallback and the memory cache lasts only while the app runs; the disk cache ignores `Cache-Control` and `Expires`; `allowDownscaling` defaults to true; `enforceEarlyResizing` on iOS helps memory when the image is bigger than its container; `placeholder` with a lower-resolution image "may cause flickering due to scaling"; `transition` with `skipOnCacheHit` avoids re-animating cached images.

What this means: `expo-image` caches by source. A PhotoKit asset is not a URL. Whether `expo-image` can show a PhotoKit thumbnail without copying it somewhere is **UNVERIFIED**, and a disk cache of family photos is the problem in 5.3. So for Route B the thumbnails more likely come from our own small native call that returns a decoded image to a native view, which is a `scribe-*` module and needs the `expo-native-module` rules, a security architect review and counsel on BL-1305. For picked items (Route A and the NS-01 photo) a file URL exists and `expo-image` is plausible. `expo-image` is not in `package.json` today, and adding it follows Definition of Done (permissive licence, `npx expo install`). **Recommendation:** decide after feasibility (Q2).

### 5.5 Cold start and thumbnails

No thumbnail loads on cold start before the first frame. The first frame shows the static value showcase or the static placeholders. Library access and thumbnails start after first paint and after `launch_interactive`. This is how the "no awaited network or model load on launch" budget (A-NFR-001, A-NFR-002) stays true.

## 6. Battery and thermal

### 6.1 What Apple says (read this session, "Responding to power notifications")

- In Low Power Mode "the system enacts energy-saving measures, including reducing animations".
- Register for the power state change notification; when it fires, read whether Low Power Mode is on. If it is, "pausing any optional activities", "reducing display updates" and "minimizing animations" are listed as steps.
- For thermal state: nominal, enable all functionality; fair, defer work the person does not immediately need; serious, "reduce networking and location activity, screen updates, and animations"; critical, "reduce or stop all work that your app is doing" and "minimize computation".

### 6.2 What this means for Moments

Moments is the only tab that reads many images, so it is the one that can heat a phone.

| State | Behaviour | Notes |
|---|---|---|
| Nominal | everything as designed | |
| Fair | defer preheating beyond the next screen; no library-wide work | the "defer work nobody needs now" rule |
| Serious | drop fades to nothing (images just appear), stop preheating, keep the visible thumbnails, keep presses | "reduce screen updates and animations" |
| Critical | show only what is already decoded; stop new requests; no animation; one static plain line only if something is blank | words by content |
| Low Power Mode | same as Serious for animation; no preheating | **UNVERIFIED** how long before the app sees the notification |

How we read these (native, one small event, no payload with any content) is a mobile and design systems question, because the repo has no thermal or power module. React Native's own APIs do not expose the thermal state to our knowledge (**UNVERIFIED**). A tiny addition to an existing `scribe-*` module or a new one is the likely route (Q4). If it costs a new dependency or module, the budget for it is the same as any dependency. Until then thermal behaviour is a device check, and Low Power Mode behaviour is "the system reduces animations itself, we add nothing".

### 6.3 Battery numbers

The only battery budget in the repo is "idle battery drain 1% per day or less; no background work except OS-scheduled sync and local notifications" (TDD 01 section 5.3), measured by a 24-hour device run. Moments must not add a background task: **no background library scan, no background fetch, no silent push for moments** (this also follows ML-3 in the brief). The foreground cost of the feed is unmeasured. I give no milliwatt, percentage or minute figure. The measuring method is Instruments Energy Log on a development build (MEASUREMENT-PLAN H7), D6 below.

### 6.4 What we do not do

- No timers that wake the library "to be ready". The feed reads when the tab is focused and the app is active.
- No periodic refresh of the For you part while open, other than one read on focus and one on a coalesced library change.
- No work when the app is in the background, except finishing a write that has already started.

## 7. How motion is tested

### 7.1 What exists

- **Vitest** unit tests for `apps/mobile` (`"test": "vitest run"`), 328 files in `apps/mobile/test`, run on Linux by `npm test`. Tokens and their spring damping are tested in `packages/design-tokens`. The content-free marker ring has a test that scans source for the closed event list.
- **Maestro** end-to-end flows on the iOS simulator: 20 flow files in `apps/mobile/e2e/flows/`, including `E2E-15-voiceover-smoke.yaml` (AX5, light and dark, screenshots for a human). `npm test` lints the flow files on Linux (`qa-e2e-flows.test.ts`), so a broken flow fails CI before a Mac exists. README status: nothing has been run yet, 125 of 134 test ids are missing from the app on 15 Oct (stale; recount), and the e2e build profile and nightly are the founder's calls. The Maestro flows need a Mac, so I cannot run them here.
- **Device plan:** `docs/qa/DEVICE_TEST_PLAN.md` (S1 rows, SE 3 first). S1-03 is the cold start protocol: 10 cold starts, 60 fps screen recording, p50 and p90 recorded.
- **Perf markers:** a closed list of content-free event names and one number, in memory, shared only through the dev export button, off unless `EXPO_PUBLIC_PERF` is "on" (`lib/perf/markers.ts`). Today the list has `launch_first_frame`, `launch_interactive`, `book_first_render`, `book_scroll_hitch` and others; there is no Moments event.
- **Instruments, second-phone video:** the plan for frame evidence (H7, H8), run by the founder.

### 7.2 Four layers for Moments

| Layer | What it proves | Where it runs | What it cannot prove |
|---|---|---|---|
| U: unit | token values, timelines against ceilings, Reduce Motion plan table, window size constant, anchor logic, reduce-to-final-state rules | Linux CI, `npm test` | any frame time, any look, any feel |
| C: component | no transform animation when Reduce Motion is on; loop count; hit area at frame 1; layout height before and after an image arrives; accessibility tree after a state change; haptic spy | Linux CI, using the repo's existing component test helpers (`apps/mobile/test/helpers/`) | the real compositor, the real scroll view, memory |
| E: Maestro | the paths: cold launch to tab, permission states, switch, hide with Undo, return from capture keeps position, AX5 reachability with screenshots | Mac with a simulator, e2e build | frame time (a simulator is not device evidence), VoiceOver speech, thermal, Low Power Mode, real photo library size |
| D: device checklist | frames, memory, heat, battery, real Reduce Motion toggling, VoiceOver | founder's iPhone SE 3 and a 120 Hz phone | nothing else is left; this is the last layer |

The test layer letters in section 8 use U, C, E, D, S (source scan), R (review).

### 7.3 The fixtures

All fixtures use the fictional family Asha. No real photo, no real place. The photo fixtures are generated synthetic images (plain gradients or noise) with the sizes in section 5.2, never a family photo.

- F1: 30 days, up to 5 thumbnails each (a feed of 150 images).
- F2: 365 days, mixed 1 to 8 thumbnails (a big library).
- F3: one 48 MP image and one panorama (NS-01 precedent) in a collage.
- F4: 200 videos with static lengths.
- F5: a library with 20% iCloud-only items (no network).
- F6: a limited-access set of 12 items.

On a phone, a synthetic set can be loaded into a test album by a Mac script, so the feed reads real PhotoKit assets without a family photo. How is a device-side prep task for `qa`. **UNVERIFIED** that a script can seed the simulator and a device the same way.

### 7.4 Unit tests worth writing first

These are Linux-only and cheap. All PROPOSED.

1. Timeline table: every Moments motion is listed with its duration and a test asserts each is at most 420 ms and each sequence at most 900 ms (A1 R1).
2. Reduce Motion plan: a pure function maps "motion kind and Reduce Motion flag" to "opacity-only or none" and a test walks the whole table in section 3.2.
3. Window: given a scroll offset and row height, the set of rows to preheat and the set to cancel; a test proves the live count never exceeds the constant.
4. Target size: cell size in points and a scale produce the request size; a test proves it is never the maximum-size constant and never larger than the cell times scale.
5. Source scan (like `perf-markers.test.ts` scans `mark(` calls): fail the build if the Moments tree contains `withRepeat`, a progress or activity component, a `shimmer`, a direct `AccessibilityInfo` read, a `PHImageManagerMaximumSize` or equivalent, or a string literal that is a duration.
6. Thermal and power plan: a pure function from (thermal state, low power) to (preheat, fade, stagger) with a test per row of 6.2.
7. Marker allowlist: any new Moments perf marker name is added to the closed list in the same PR, with a test that its call has a literal name and a number (markers rule).

### 7.5 Maestro flows to add (PROPOSED)

Written as new flow files by the `qa-e2e` owner when the tab exists; names are placeholders.

- M-01: cold launch to Moments with no permission. Asserts the Allow and Not now controls are visible and tappable at the first assertion, and a screenshot for review. Reduce Motion is toggled by a Maestro setting call. **UNVERIFIED** that Maestro can toggle Reduce Motion on the iOS simulator; if not, it is a launch setting in the e2e build or a device check.
- M-02: Not now, then the value and real things appear. Allow, then the feed appears. Limited, then the feed appears with a quiet line.
- M-03: switch For you and Recent twice, scroll position kept.
- M-04: hide a day, Undo, the card returns in place.
- M-05: compose, capture opens, back, scroll position kept.
- M-06: AX5 on an SE 3 simulator, light and dark, screenshots (the E2E-15 pattern).

Maestro cannot count frames. Its job is paths and reachability. Frames come from D.

### 7.6 Manual device checklist (for the founder; two phones)

Needs an iPhone SE 3 and a 120 Hz phone (which one he holds is his; MEASUREMENT-PLAN section 7 says buying is his). Each row is a `human` device-check row. Record phone, iOS version, build and fingerprint in the header (the markers header does exactly this; no feed content is ever written down).

| Id | Check | How | Pass |
|---|---|---|---|
| D1 | Cold start to the Moments first frame | S1-03 protocol, 10 cold starts, airplane mode | p50 at most 1.2 s, p90 at most 2.0 s |
| D2 | Scroll F1 and F2 | Instruments Animation Hitches on a development Release build (H7) | no frame over 16.7 ms at 60 Hz; 120 Hz phone: no frame over 16.7 ms and the hitch count not above the 60 Hz run |
| D3 | Press, switch, hide, refresh during scroll | same | no hitch; no flicker of animated cards |
| D4 | Memory while scrolling F2 end to end and back | Instruments Allocations | resident image memory stays flat after leaving rows; write the peak down; set the window constant from it |
| D5 | 120 Hz and Low Power Mode | scroll the same feed with Low Power Mode on | record the frame rate and any change; UNVERIFIED today |
| D6 | Energy | Energy Log, 5 minutes of scrolling, then 24-hour idle run | write numbers; idle at most 1% per day per TDD 01 |
| D7 | Reduce Motion on | toggle in Settings while the app is open, in each state of the tab | nothing slides or scales; opacity only; loops stop at once |
| D8 | Reduce Transparency and Increase Contrast on | every state, light and dark | solid fallbacks; legible; no motion depends on blur |
| D9 | Smart Invert | the feed | photos are not inverted |
| D10 | AX5, Bold Text, VoiceOver | SE 3 | no truncated letter text; VoiceOver reads each state change once; focus moves to the new heading |
| D11 | Thermal | scroll F2 for several minutes, in a warm room or while charging, then check a hot phone | the app calms down at "serious"; no stall |
| D12 | Memory warning | simulate or use a low-memory device state | the window shrinks; no crash |
| D13 | Library change during scroll | add and delete photos from another source while scrolling | the content on screen does not jump (A1 R9) |
| D14 | iCloud-only items | F5 | static placeholder, no spinner, no network |
| D15 | Permission changes in Settings with the app backgrounded | change Photos access to None, Limited, Full | the state shows with the 200 ms fade; no replay of cold launch |

D1 to D4 are the budget gates. Without them the tab does not ship as the landing tab.

## 8. Requirements

Format: id, user need in plain words, Given/When/Then, test layer (section 7.2). All PROPOSED. None changes a ruling. The reversals the founder owns are in the brief.

**MT-A5-R1. Reduce Motion has one table and one reader.**
As a parent who has turned off motion, I want the tab to be still and complete.
Given Reduce Motion is on, including when it turns on while the app is open. When any motion in A1 section 4.1 would play. Then it follows the Reduce Motion column of section 3.2: opacity only at 200 ms or no motion, no slide, scale, spring, draw or loop. Every component reads `useMotion()` and none reads the setting directly.
Test: U (plan table), S (no direct `AccessibilityInfo`), C (no transform in the animated style), D7.

**MT-A5-R2. Frame budgets are stated for both refresh rates.**
As a parent with a ProMotion phone or an SE 3, I want scrolling that does not catch.
Given the Moments feed with F1 and F2. When scrolled, and when press, switch, hide or refresh run during the scroll. Then on the SE 3 no frame is over 16.7 ms, and on a 120 Hz phone no frame is over 16.7 ms and hitches are no worse than on the SE 3 run, until a measured 8.3 ms target replaces this by the founder's approval.
Test: D2, D3. A simulator figure does not count.

**MT-A5-R3. Reduce Motion is not a performance mode.**
Given Reduce Motion is on. When the feed scrolls. Then the frame budget of R2 holds with no change.
Test: D2 with Reduce Motion on.

**MT-A5-R4. Animations run on the UI thread, with a short list of exceptions.**
Given any animation on the tab. When it runs. Then it is a Reanimated worklet or a native animation on `transform` or `opacity`; JS never calls `setState` per frame; the only layout-affecting animations are `LinearTransition` after a hide and a single prompt-height change, never during scroll.
Test: S (no `setState` in a frame callback, no `width` or `height` animated style outside the two named places), R.

**MT-A5-R5. The first frame never waits for the library.**
As a parent opening the app at night, I want the app to open fast.
Given a cold launch with Moments as the landing tab. When the first frame draws. Then it shows the showcase or static placeholders, no photo permission check or library read is awaited before `launch_first_frame`, and no thumbnail request starts before `launch_interactive`. Cold start meets p50 1.2 s and p90 2.0 s on the SE 3.
Test: U (order of calls with injected fakes), D1.

**MT-A5-R6. Thumbnails are requested at display size.**
Given a collage cell. When a thumbnail is requested. Then the target size is the cell in points times `PixelRatio` read at runtime, never the maximum-size constant, and preheating and requesting use the same parameters.
Test: U (target size function), S (no maximum-size constant), R with the native module owner.

**MT-A5-R7. The live thumbnail window is bounded.**
Given a scroll through F2. When rows leave the window. Then their requests are cancelled and their caching is stopped, and the number of live thumbnails never exceeds a constant set from D4.
Test: U (window logic), D4 (measured).

**MT-A5-R8. iCloud-only and failed images stay still.**
Given a photo that is only in iCloud, or whose thumbnail failed. When the card shows. Then the static placeholder stays at final size, no spinner, no retry animation, no download starts, and nothing is recorded about it.
Test: C, D14.

**MT-A5-R9. Low Power Mode and heat calm the tab.**
Given Low Power Mode, or a thermal state of serious or critical. When the feed runs. Then fades become instant appearances, stagger is off, preheating stops, presses and visible thumbnails remain, and nothing is blocked. At fair, preheating is limited to the next screen. At nominal, all behaviour is as designed.
Test: U (plan function per row of 6.2), D11. Reading the states needs a native event (Q4); until it exists this row ships as the Reduce Motion behaviour only and D11 is a check.

**MT-A5-R10. Few things are animated at once.**
Given the feed. When it is on screen. Then no more than a small constant number of components carry an animated style (a card being pressed, a hiding card, the switch, one cross-fade), and at rest none does. The constant is set from D3; the repo has no figure and I do not invent one. Reanimated's own guide suggests far larger limits (100 components low-end Android, 500 iOS) as a ceiling, not a target.
Test: U (counter in a test harness), C.

**MT-A5-R11. Fixed frames, no layout shift.**
Given a card whose images load late. When they arrive. Then the card height before equals the card height after (A1 R8) and the scroll offset is unchanged.
Test: C, D13.

**MT-A5-R12. A recycled row never shows the last day's picture.**
Given a list that reuses rows. When a row is reused. Then the old image is cleared before the new source loads, so no frame shows a picture from another day.
Test: C (reuse sequence with a spy), D3 (video of fast scroll).

**MT-A5-R13. Memory warnings are survived.**
Given a system memory warning. When it arrives while the feed is open. Then the live window shrinks to the visible rows, the thumbnail cache is released, no crash occurs, and pictures reload as the parent scrolls.
Test: C (simulate the event through the injected app-state source), D12.

**MT-A5-R14. The placeholder grace is measured, not guessed.**
Given A1 R8's grace value. When it is chosen. Then it is set from an SE 3 run (D2 with a trace of first paint to image ready) and written into `tokens.ts` with its test. Until then no grace is used.
Test: D, U (token).

**MT-A5-R15. No background work.**
Given the app is in the background. When the library changes or the clock passes. Then Moments schedules no scan, no fetch and no wake. A change is read once when the tab is focused again.
Test: S (no background task registration in the tree), D6.

**MT-A5-R16. No loop outlives its screen.**
Given the tab loses focus, the app goes to the background, a sheet covers it, or Reduce Motion turns on. When it happens. Then every loop stops, and there is at most one loop while focused (A1 R15).
Test: C (a spy on `withRepeat` and the lamp), D7.

**MT-A5-R17. Library change events are coalesced.**
Given the library changes many times quickly (iCloud sync, an import). When change events arrive. Then the app applies at most one update per short window, keeps scroll anchoring (A1 R9), and does not rebuild the whole feed. The window length is set from D13.
Test: U (coalescer with a fake clock), D13.

**MT-A5-R18. Photos are never inverted.**
Given Smart Invert. When any thumbnail shows. Then it ignores invert (NS-01-R40 precedent).
Test: C (prop on the image wrapper), D9.

**MT-A5-R19. Reduce Transparency and Increase Contrast keep the tab whole.**
Given either setting. When every state renders. Then glass controls use the solid fallback, the lamp is off, borders gain contrast, and no timing or layout changes.
Test: C, D8.

**MT-A5-R20. Largest text and small phone survive motion.**
Given AX5 and Bold Text on an SE 3. When anything animates. Then no letter text is truncated, clipped or reflowed by the motion, font size never animates, and targets stay at least 44 pt during motion (A1 R20).
Test: E (M-06), D10.

**MT-A5-R21. Frame evidence is real evidence.**
Given a claim that the tab meets a frame or memory budget. When it is written in a PR or a run sheet. Then it names the phone, iOS version, build, fingerprint, tool and number of runs, and it came from a device. A simulator, a Linux unit test or a screenshot is not accepted for frames, memory, heat or battery.
Test: R (the review gate), D.

**MT-A5-R22. Performance markers carry no content.**
Given any marker, log, crash report or run sheet written for Moments. When it is stored or shared. Then it holds only a closed event name and a number, plus the phone and build header, and never a photo, filename, album, place, date, count of photos or the child's name (brief; markers rule). A new event name is added to the closed list in the same PR.
Test: S (the existing marker scan extended), R with the privacy lead. Proposed new names, each a literal: `moments_first_frame`, `moments_scroll_hitch`, `moments_thumb_ready`. These are names, not ids, until the marker owner adds them.

**MT-A5-R23. The motion tests are the minimum.**
Given the Moments PR. When it is opened. Then it contains the unit tests of section 7.4 for the motion and performance rules it touches, the Maestro flows M-01 to M-06 are drafted (or listed as a `human` task if a Mac is not available), and a device-check row for D1 to D4 exists in `docs/qa/DEVICE_TEST_PLAN.md` before the tab becomes the landing tab.
Test: R (the review gate).

**MT-A5-R24. Thermal and battery are checked, not claimed.**
Given D6 and D11. When the first build exists. Then the founder's numbers (energy, idle drain, behaviour at serious) are written into the run sheet before the PR says the tab is calm on a hot phone. Until then the PR says "not measured".
Test: D, R.

## 9. Edge and unhappy paths

- **Reduce Motion toggled while a sequence is mid-flight:** the sequence ends at its final state at once; springs jump to the target.
- **Limited access with 12 items:** the feed is short, the same rules apply; the window constant is not reached. No "more" prompt animates.
- **A very large library (tens of thousands):** the feed shows days newest first in order and never reads the whole library to draw the first screen. Reading is paged by days. **UNVERIFIED:** the cost of fetching asset metadata for a big library on an SE 3; D2 and D4 use F2 for this.
- **A 48 MP image or a panorama:** requested at cell size like any other, never the maximum size (R6). The cell fits the image uncropped only if the design says so (NS-01 R42 precedent).
- **Video with a long length label:** static text, no tick (A1 R5).
- **Many images fail to decode:** placeholders stay; no retry animation (A1 section 8).
- **The parent scrolls very fast:** requests for rows that already left are cancelled; nothing is drawn for them.
- **A phone is hot and in Low Power Mode at once:** the stricter row (critical, then serious) wins.
- **The photo permission changes while the tab is open (control centre, Settings):** the state block cross-fades (A1 R11); live requests for revoked items are cancelled; nothing from the revoked set stays in memory.
- **A parent has Reduce Motion on and a slow phone:** the tab is calm and still slow. Only R2 to R5 and the window can help. We do not add a spinner to reassure.
- **Android later:** frame budget for a mid-tier 60 Hz Android is already in MOTION 7 rule 6; animator scale 0 must map to the same Reduce Motion path ("verify on device", per A1 section 8). Thumbnail sizes come from the device pixel ratio. The Android media API is not covered.
- **Maestro cannot toggle a setting:** the flow is a device check instead. Never mark a flow as passing that skipped the setting.

## 10. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| The machine never adds meaning | nothing here writes text; a "wait line" is content's, static (R8) |
| No counts, gaps, streaks, points or badges | no "loaded N" progress; no count in any marker (R22); no animated number (A1 R5) |
| Never implies AI writes | no shimmer, no "working through your photos" look (A1 rule 5) |
| No fear, guilt or loss | a failed or cloud-only picture is a quiet static placeholder, not an error to fix |
| Privacy: nothing about a photo in logs, analytics or crash reports | R22; markers are numbers; thumbnail file or disk cache of family photos is not proposed (5.3) |
| Nothing leaves the phone from the library | `isNetworkAccessAllowed` false for thumbnails (5.3); no background task (R15) |
| Data Not Collected story | an `expo-image` disk cache or any thumbnail file of a library photo would need counsel and the privacy lead before it exists (5.4) |
| WCAG 2.2 AA, Apple HIG | Reduce Motion, Reduce Transparency, Increase Contrast, Smart Invert, AX5, Bold Text, VoiceOver, 44 pt (R1, R18 to R20). I did not fetch WCAG or the HIG this session: the wording is **UNVERIFIED** |
| Dynamic Type to AX5, letter text never truncated (D-027) | R20 |
| BL-1305 and ML-6 reversals | Route B is a PhotoKit read and a usage string; this doc takes both as the founder's reversals in the brief and plans only the performance of them |
| Definition of Done item 8 | R5 and section 7.6 state how each budget is checked; the ones that need a phone are `human` rows |

## 11. Open questions

| # | Question | Recommended default | Deadline |
|---|---|---|---|
| Q1 | Does the concept use a collage that could change size, and how many thumbnails per day card at most? | fixed frame, with a maximum set by design; the window constant waits on D4 | before design handoff to `mobile` |
| Q2 | Does Route B show PhotoKit thumbnails through a small native call, or through `expo-image` on copied files? | native call; no copied thumbnails on disk; decide with feasibility, the security architect and counsel | when feasibility closes Route A or B |
| Q3 | Plain `FlatList` first, or a recycling list library? | `FlatList` first, measure F2 on an SE 3, then decide | first device run |
| Q4 | How does the app learn Low Power Mode and thermal state? Is a new native piece or a new dependency acceptable (`expo-battery` is named in MOTION 5j but is not installed)? | add one tiny native event in an existing or new `scribe-*` module only if D5 or D11 shows a problem; otherwise rely on the system's own reductions | after D5 and D11 |
| Q5 | Is the 120 Hz bar "no worse than 60 Hz" acceptable until measured? | yes, replace with a measured figure after D2 | first device run |
| Q6 | Which 120 Hz phone does the founder hold? | whatever he has; if none, the 120 Hz rows stay UNVERIFIED and the PR says so | before D2 |
| Q7 | Can Maestro toggle Reduce Motion on the simulator? | check once on a Mac; if not, put the setting in the e2e build or keep D7 manual | when the e2e build exists |
| Q8 | Do we add `moments_*` perf markers (R22)? | yes, three literal names, after the marker owner agrees | with the first Moments PR |
| Q9 | Does the tab need a Low Power Mode or thermal notice for the parent? | no; the tab simply becomes calmer; no words | design concept review |

## 12. Dependencies

- Design systems: tokens for any measured grace (R14); a `useMotion()` plan for Low Power Mode and heat if Q4 says yes; a list row and image wrapper that clear on reuse (R12) and ignore invert (R18).
- Native module owner and security architect: any thumbnail request (R6, R7, Q2), per the `expo-native-module` skill.
- `qa` and `qa-e2e`: flows M-01 to M-06 (7.5), a Moments run sheet like `docs/qa/run-sheets/NS-34-SE3-SPEED.md` (BL-929), and the synthetic photo fixtures (7.3).
- The founder: D1 to D15 on his phones, the 120 Hz phone choice, and the e2e build and nightly decision.
- A1: R8, R15, R24 (reconciled in 2.1). Transition leads: route table timings. Feasibility: Route A or B. Privacy and constitution doc: R22, no disk cache. Content: the one static wait line, if any.
- Counsel: BL-1305 and ML-6 reversals, an Apple-side network event if a place name is ever sought (brief).

## 13. VERIFIED, UNVERIFIED, guess

**VERIFIED (read this session):**
- A1 text, branch `wip/moments-a1` (head 802f858): R1 to R24 and sections 4 to 8.
- `docs/design/MOTION.md` section 7 (the six performance rules, including 16.7 ms on SE 3 and a mid-tier 60 Hz Android, and "all smoothing uses `dt`").
- `docs/BACKLOG.md` line 84 (budgets), BL-929 and BL-930 (proposed), `docs/tdd/01-mobile-client.md` section 5.3 (transition, battery rows), `docs/qa/DEVICE_TEST_PLAN.md` S1-03.
- `docs/engineering/readiness-20nov/performance/MEASUREMENT-PLAN.md` H1 to H10, and its statement that frame hitches come from Instruments, not markers.
- `apps/mobile/app.config.ts:244` `CADisableMinimumFrameDurationOnPhone: true`; `apps/mobile/package.json` dependency list (no `expo-image`, no `expo-battery`, no list library); `apps/mobile/e2e/README.md` and the flow list; `apps/mobile/src/lib/perf/markers.ts` and its test.
- Apple, PHCachingImageManager page: https://developer.apple.com/documentation/photos/phcachingimagemanager.md
- Apple, PHImageManager page: https://developer.apple.com/documentation/photos/phimagemanager.md
- Apple, PHImageRequestOptions page (names of options only): https://developer.apple.com/documentation/photos/phimagerequestoptions.md
- Apple, Responding to power notifications: https://developer.apple.com/documentation/xcode/responding-to-power-notifications.md
- Reanimated performance guide: https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/
- `expo-image` docs: https://docs.expo.dev/versions/latest/sdk/image/
- Arithmetic in 4.1 and 5.2 (pixels times 4 bytes; 1000 ms divided by 120).

**UNVERIFIED (not read, or read but not confirmed):**
- Apple's ProMotion page and what the Info.plist key does exactly (the fetch returned no text); behaviour in Low Power Mode at 120 Hz.
- What each `deliveryMode` and `resizeMode` value does; whether a degraded image is delivered for an iCloud-only asset when network access is off.
- Screen scale factors of the SE 3 and the large iPhones (read from `PixelRatio` at runtime); bytes per pixel for wide colour or HDR.
- Whether Reanimated 4.5.1 with RN 0.86.3 shows scroll flicker needing any flag; whether `expo-image` can show a PhotoKit asset without a copy; how the SDK 57 paper tab bar behaves under Reduce Transparency; Prefer Cross-Fade Transitions.
- Whether React Native or Expo exposes thermal state or a Low Power Mode event today (Q4).
- Whether Maestro can toggle Reduce Motion or seed a photo album on a simulator.
- WCAG and HIG wording; PR #1264 content; the Moments concept, feasibility and privacy docs.
- Every frame time, memory figure, heat and battery figure. Nothing was run on any device or simulator, and this machine is Linux.

**Guess (labelled):**
- That the day feed is a vertical list of fixed-height cards with a collage of a few thumbnails.
- That the window of live thumbnails is "the screenful plus one before and after" as a starting point to measure, not a decision.
- That `FlatList` is enough for a first build.
- Names of the three new markers in R22.

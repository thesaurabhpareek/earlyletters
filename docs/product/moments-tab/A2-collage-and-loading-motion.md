# A2: Moments tab, collage and loading motion

Status: PROPOSED. Animation lead A2 of 5. Written 21 Nov 2026. Nothing here is a ruling until the founder signs. Brief of record: `/home/claude/moments-brief.md` (20 Nov 2026).

## 1. Purpose and scope

This doc says how pictures and cards arrive, wait, scroll and refresh on the Moments tab, so that the tab feels calm, never jumps, and stays smooth on the smallest phone we support.

In scope:
- Thumbnail and collage loading in Recent (newest-first days).
- Skeletons versus none.
- How one day's photos arrive with no layout jump.
- Video markers.
- Pull to refresh, and the refresh of prompt cards in For you.
- Scrolling for a large library.
- Frame budgets on an iPhone SE (3rd generation).
- Requirement rows MT-A2-R1 onward.

Out of scope (other leads, linked not duplicated): the visual layout of the day card, the map tile, the compose button and the tab's overall look (design leads); tab and sheet transitions and the open-a-day move (transition leads A3 to A5 where they exist); the permission ask and the value screen before it (product and design leads); the route decision between Apple's picker and our own library read (feasibility doc).

Which route this doc assumes. Both, with one rule. Route B (our own on-device library read, Limited access honoured) is the only route where we draw a person's day collages ourselves. Under Route A (Apple's picker) the sheet is Apple's, its motion is Apple's, and we draw only the pictures a parent picked, after they come back to us. Everything in sections 4 to 8 applies to Route B in full and to the "picked pictures" strip under Route A. Where a row applies to one route only it says so.

## 2. Inputs read

Read this session, in the clone of `develop` at `86eccfa` (clone deleted at the end):
- `/home/claude/moments-brief.md`, in full.
- `docs/design/MOTION.md` v0.2: principles (section 2), tokens (3), Reduce Motion (4), signature moments 5a to 5m, haptics (6), performance rules (7), open questions (10).
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md`: the two layers (content paper, glass only on navigation and controls, at most three glass surfaces), the iPhone SE 3 gate, the NativeTabs and FlatList caveat, minimum iOS 17.0 (D-098).
- `packages/design-tokens/src/tokens.ts` lines 315 to 340: `fadeMs` 200, `exitMs` 160, `enter` `{ dy: 8, durationMs: 280 }`, `easing` `[0.2, 0, 0, 1]`, `staggerMs` 30, `staggerMax` 6, `sequenceMaxMs` 900, `hardCeilingMs` 2000, `newMarkMs` 1600, springs `snappy`, `standard`, `gentle`, `reduceMotion` `{ type: 'fade', durationMs: 200 }`. `swapMs` 150 is named in MOTION section 3; I did not find it in the lines I read, so confirm it exists before citing it in code.
- `apps/mobile/package.json` and `apps/mobile/src/app/(tabs)/book.tsx` (list usage only).
- Open PR titles (REST): #1264 (Home engagement wheel), #836 to #840 (photo with a letter, slices 3b to 5), #754 (Memory Library moment engine). I did not read their diffs.

Not found (assumption stated): the privacy and constitution analysis, the feasibility doc and the design concept for Moments are not on `develop` and I found no open PR for them. I assume: the library read is on device, Limited access is honoured, day grouping is by local calendar day, and a title appears only if the parent typed or chose it. Reconcile with the feasibility doc when it lands; section 11 lists the points that depend on it.

## 3. Principles for this tab (taken from MOTION, applied here)

1. Motion follows a real signal (MOTION principle 1). A photo arriving is a real signal, so one short fade is allowed. Waiting is not a signal, so nothing loops, shimmers or pulses while we wait.
2. Controls are there from the first frame (principle 2). The compose button, the Recent and For you switch and every refresh control are opaque and hittable before any picture has loaded.
3. Content never moves under a finger. A row's height is known before the row is drawn, and never changes when its pictures arrive.
4. Interruptible and cancellable (principle 4, HIG). Scrolling cancels work for rows that leave the window.
5. Quiet. No counters, no "loading n of m", no streaks, no badges, no gap counting. A day with few pictures is a complete day.
6. One loop on screen at most (MOTION section 7 rule 5): this tab has zero loops.

## 4. Requirements

Test layers: U = unit test of pure logic (no device), C = component test (React Native test renderer or web build), S = simulator run with the synthetic library (section 9), D = physical iPhone SE 3 (device evidence is the only evidence for frame budgets; simulator evidence is not device evidence, per the V2 gate).

### 4.1 Placeholders and skeletons

Decision: no skeletons. A skeleton is a drawing of a layout we do not yet know, and its shimmer is a loop with no signal behind it. We know each day's layout from metadata before the row exists (R3), so the day arrives already shaped, and the only waiting thing is the picture inside a still tile.

Table of what waits and how.

| Thing | While waiting | Why |
|---|---|---|
| A day row (header, collage frame, compose button) | Not drawn at all until its metadata is ready (R3). | There is nothing to wait inside; the row appears whole. |
| A picture tile | A still, flat paper-tone tile, no shimmer, no pulse, no blur. | Calm; same colour as the paper family, so a late picture feels like a photograph set down. |
| The For you cards | Not applicable: they are our own words and illustrations and render on the first frame. | The tab is the default landing tab; it must not wait on the library. |
| The list as a whole on first library read | The first frame shows For you (own content). Recent shows its rows when ready, with no spinner and no text. | See R4. |

**MT-A2-R1. A waiting tile is flat and still.**
Given a tile whose picture has not arrived,
When the tile is on screen,
Then it shows one flat paper-tone fill from the semantic tokens, a hairline in `controlBorder` only under Increase Contrast, no gradient, no shimmer, no opacity loop and no blur.
Test: C (no animated style attached to the placeholder), S, D. Token: design-systems to name the fill (a paper-tone token that passes 3:1 against the page for the non-text contrast rule; I could not verify one exists, see section 11).

**MT-A2-R2. No block-level loading indicator on Recent, ever.**
Given the library read is under way,
When the parent looks at Recent,
Then no spinner, progress bar, "loading" word or count appears; if the read takes long enough that Recent has nothing to show yet, it shows its settled empty-or-waiting line (words by content, one sentence, no ellipsis) and nothing moves.
Test: C, S. Note: whether a waiting line is ever needed is measured in the spike (section 8).

### 4.2 A day arrives with no layout jump

How it works. The library read is two steps. Step one reads only metadata for assets, newest first (creation date, pixel width and height, media type, video length). It does not decode any picture. Step two asks for thumbnails, only for tiles in or near the window. A day row is created only after its step-one data is complete, so the collage layout is computed from numbers, not from pictures.

**MT-A2-R3. A row is drawn only when its layout is known.**
Given the library read has returned metadata for a calendar day,
When the day becomes a row,
Then the collage's template, tile frames and total height are computed from that day's asset count, each asset's width and height ratio and its type (photo or video), before any picture is requested, and the row's height never changes afterwards (a late picture, a failed picture, an iCloud-only picture, all keep the frame).
Test: U (pure function from metadata to frames, snapshot over cases: 1, 2, 3, 4, 5 and more; portrait, landscape and square; mixed video), C (row height equal before and after a picture resolves), S.

**MT-A2-R4. The first frame never waits on the library.**
Given a cold launch lands on Moments,
When the first frame is drawn,
Then it contains For you's own cards, the tab chrome and the Recent and For you switch, and no area whose size depends on the library.
Test: S (first frame with permission granted and a large library), D. Open point in section 11: where library moments sit in For you.

**MT-A2-R5. Day collage is a fixed template, not a layout engine at runtime.**
Given a day with N assets,
When the collage is built,
Then it uses one template from a small fixed set keyed by N up to a stated cap, and the same day always gives the same template and the same tile order (newest first within the day, or the order the feasibility doc rules; one order, tested).
Beyond the cap the collage shows the cap's worth of tiles and opens to the full day when tapped. It shows no "plus n" chip and no count of pictures: counts are out under the brief's "no counts, gaps" rule, and a number on a day invites comparison. (The cap value is a design lead's number; I do not invent it. Default proposal: the cap is the most tiles that still pass the 44 pt rule for the tap target of the whole collage and keep each tile large enough to recognise at AX5 widths; design leads set it in the concept doc.)
Test: U (determinism, property test: same input same frames, frames inside the row bounds, no overlap, gutters equal the spacing token).

**MT-A2-R6. Aspect ratios are respected, then cropped by one rule.**
Given an asset with a known ratio,
When it is placed in a tile,
Then the tile crops to fill (centre crop), no stretch, no letterbox bars, and never zooms or pans (no Ken Burns; MOTION benchmark row "Photos Memories: Avoid").
Test: C, S.

**MT-A2-R7. Thumbnails are requested at tile size, not larger.**
Given a tile frame of w by h points on a screen of scale s,
When its picture is requested,
Then the request size is about w times s by h times s pixels (for example a full-width collage on an SE 3 is 343 pt wide at 16 pt gutters, so roughly 686 px at 2x; 2x for SE 3 is UNVERIFIED this session), never the original size, and the full-size picture is requested only when the parent opens it or attaches it.
Test: U (size calculation), S (log request sizes in a debug build only, never in a store build, never anywhere that leaves the phone).

**MT-A2-R8. A picture arrives with one short fade, or none.**
Given a tile whose picture arrives,
When it is drawn,
Then:
- if the picture was already in memory (scrolling back, returning to the tab), it is drawn at once with no fade;
- if it arrives while the list is scrolling fast, it is drawn at once with no fade (a fade on a moving thing is noise);
- otherwise it fades in over `fadeMs` (200 ms) on opacity only, from the flat tile, easing `easing`;
- there is no stagger across tiles (picture arrival order is decided by decoding, so a stagger would be fake choreography), no scale, no translate, no blur-up.
Under Reduce Motion the same: opacity fade at `reduceMotion.durationMs` (200 ms), which is already fade-only. No haptic.
Test: C (style assertions), S, D (visual).

**MT-A2-R9. A low quality version to a final one cross-fades in place.**
Given the library offers a fast, low quality picture before the final one (Apple's image request can call back more than once; the result carries a flag for "degraded"; UNVERIFIED, see section 12),
When the final one arrives,
Then it replaces the first in the same tile with a cross-dissolve over `swapMs` (150 ms), no flash, no size change, the degraded one never shown after the final.
If we ask for the final format only, this row does not apply and the tile goes straight from flat to final (R8).
Open point: which request mode the spike picks (section 11).
Test: C (the two-callback order), D.

**MT-A2-R10. A failed or unavailable picture keeps the frame and stays quiet.**
Given a picture cannot be produced (deleted since the read, iCloud only and not downloadable for a thumbnail, corrupted),
When its request fails or returns nothing,
Then the tile stays the flat paper-tone tile, its frame is kept, nothing is announced, no error toast, no retry spinner; the next time the row comes into the window it is asked again once.
Test: U (state machine: waiting, shown, unavailable), C, S (delete an asset under the app).

**MT-A2-R11. Tiles do not load from the network for thumbnails.**
Given a thumbnail whose original lives only in iCloud,
When we ask for a tile,
Then we ask for the on-device version only, and if none exists the tile stays flat (R10); we download the full picture only when the parent attaches it, and then show a calm in-place state with a plain sentence (words by content), no spinner theatre, and a way back.
Reason: a tile list that triggers iCloud downloads wakes the radio and uses data the parent did not ask us to use. Privacy check: the download is between the phone and Apple, not our servers; confirm with the privacy analysis that this holds for the Data Not Collected story.
Test: S (library with iCloud-only assets, if the simulator can model it; otherwise D).

### 4.3 Video markers

**MT-A2-R12. A video tile shows its length as a small solid marker, drawn with the tile.**
Given an asset that is a video with a known length,
When its tile is drawn,
Then the marker is present from the first frame of the row (it comes from metadata, so it does not wait for the picture), sits in the same corner of every video tile, and shows a play shape and the length in minutes and seconds (for example 0:14) in a tabular-figure text style.
The marker is a solid dark pill, not glass (glass is for navigation and controls only, V2 rule), with its fill dark enough that white text on it reaches 4.5:1 even over a pure white photo. Derivation: black at alpha a over white gives sRGB grey of about 255 times (1 minus a); white text needs a pill background of relative luminance 0.183 or less, which is about sRGB 0.465, so a is at least about 0.54; ask for a margin, proposal a of 0.6 or more, and a test computes it from the token.
No autoplay, no live preview, no looping frame strip, no motion on the marker.
Colour is never the only signal (A-NFR-005): the play shape plus the length says "video"; the VoiceOver label says it too (R13).
Test: U (contrast calculation from tokens, worst case white), C, S, D.

**MT-A2-R13. VoiceOver names a tile only with facts we hold.**
Given VoiceOver is on,
When focus lands on a tile,
Then a photo tile is read as "Photo" and a video tile as "Video, 14 seconds" (words by content; PROPOSED), never a description of what is in the picture (no scene, person or place guess; constitution), and the collage is one grouped element per day with the day's date and any parent-typed or parent-chosen label first, then the tiles in the visual order.
Test: C (label strings from a function, U), D (VoiceOver pass).

**MT-A2-R14. At large text sizes the marker moves out of the picture.**
Given Dynamic Type is at an accessibility size (AX1 and up; exact switch size set by design leads, default AX1),
When a video tile would carry a marker larger than a stated share of the tile's width (proposal: if it would cover more than a third of the tile width),
Then the marker is not drawn on the picture; the day's caption line under the collage carries "Video, 0:14" in the same text style, wrapping and never truncated (D-027), and the tile keeps a small play shape only if it fits at 44 pt-independent size.
Test: C (AX5 snapshot on an SE 3 width), D.

### 4.4 Scrolling a large library

How it works. Recent is a vertical list of day rows, newest first, windowed: only rows in or near the screen exist as views; pictures exist only for tiles in or near the screen. The list is fed in chunks; the next chunk is read when the parent nears the end, never shown with a footer spinner.

**MT-A2-R15. Rows are windowed and tiles are cancellable.**
Given a library of many thousands of assets,
When the parent scrolls,
Then only rows in and near the visible window are mounted, a tile that leaves the window cancels its pending picture request, and a row that comes back asks again (or hits memory).
Test: C (mount count bounded as scroll position moves), S, D. The window size and number of in-flight requests are set by the spike, not invented here; the rule is that both are fixed numbers in one config object (no number typed in a screen, as for motion).

**MT-A2-R16. Fast scrolling shows flat tiles, not a queue of work.**
Given the scroll velocity is above a threshold,
When rows pass,
Then no new picture requests are started for rows moving through quickly (the flat tiles are the honest state), and requests resume when the list slows. The threshold is a spike output.
Test: C (velocity gate as pure logic: U), D.

**MT-A2-R17. Loading the next chunk is invisible.**
Given the parent scrolls near the end of the days already read,
When the next chunk of metadata is read,
Then new rows are appended below with no spinner, no footer text, no animation and no shift of any visible row; at the true end the list simply ends (no "you have reached the end", no count).
Test: C, S.

**MT-A2-R18. Nothing is inserted above what the parent is looking at.**
Given the library changes while the parent is scrolled down (a new photo is taken, Limited access changes),
When the change arrives,
Then the visible rows do not move; changes above the viewport are applied when the parent is at the top or pulls to refresh (R19); the top day may update in place when the parent is at the top, by fade only (R8), with no slide.
Mechanism: either keep position when content is inserted above (React Native's `maintainVisibleContentPosition`, UNVERIFIED this session) or defer the insert; the spike picks one.
Test: C (insert above, assert visible offset unchanged), S.

**MT-A2-R19. Tapping the active tab again scrolls to top, on our own control.**
Given the parent is partway down Recent,
When they tap the Moments tab again,
Then the list scrolls to the top over a short, interruptible move (the system standard; Reduce Motion: a jump).
Note: the V2 doc says Expo states scroll to top and minimise on scroll do not work with FlatList lists under NativeTabs. If the system tab bar ships, we implement this ourselves and test it. Do not assume it works.
Test: C, D.

### 4.5 Pull to refresh

What refresh means on this tab. The library is read live and changes are observed, so refresh is rarely needed; it exists as a trust gesture ("have I missed something") and as the moment when changes above the viewport are applied (R18). It is not a network fetch. It must therefore be quick, and look it.

**MT-A2-R20. Use the platform's refresh control, and never stretch it.**
Given the parent pulls down at the top of Recent or For you,
When they release past the system's threshold,
Then the platform's own refresh control runs (it follows Reduce Motion itself and is accessible by default) with no custom spinner, no custom text ("pull to refresh", "updated just now", "last updated"), no sound, and no haptic from us.
The refresh ends the moment the work ends. There is no minimum display time, and no artificial delay added so the spinner "feels real": that is spinner theatre. If the work finished before the control had settled, it ends as soon as the system allows.
Test: C (no timer added around the end-refresh call: U on the controller; the lack of a minimum duration is asserted), D.

**MT-A2-R21. A refresh changes only what changed, in place.**
Given a refresh completes,
When new or changed rows exist,
Then they appear by fade (R8) at their place, rows that did not change are untouched (no whole-list fade, no re-stagger), and if nothing changed nothing at all happens: no "you are up to date" toast, no message.
Test: C, S.

**MT-A2-R22. Pull to refresh has a button and gesture alternative.**
Given a parent who cannot pull (switch control, VoiceOver, motor limits),
When they use the accessibility action,
Then the list exposes a "Refresh" custom accessibility action on the list, and the same result occurs. (Label by content.)
Test: C, D (VoiceOver rotor, Switch Control).

### 4.6 Refresh of prompt cards (For you)

The founder's screenshots show a coloured prompt card with a small refresh control. Ours show one of our 111 written prompts, chosen by `packages/core` prompt selection. The control means "another one". It is a button, not a gesture.

**MT-A2-R23. "Another one" swaps the words in place with a short cross-fade.**
Given a prompt card is on screen,
When the parent taps its refresh control,
Then the next prompt is chosen from our written set (the same selector, never repeating the current one, never text from a model, never edited), the old words fade out over 120 ms and the new fade in over 160 ms (the same pair MOTION 5d uses for "Put it back": 120 out, 160 in; implement from tokens, do not type 120 and 160 in a screen; if no token carries them, design-systems adds them) with no travel, no flip, no spin of the icon, no card replacement animation, and the control is hittable the whole time (principle 2).
Haptic: `selection` (the "pick alternative" row of the haptics map). It is a choice, not a navigation.
Reduce Motion: one `fadeMs` cross-fade, same as now, no movement exists to remove.
Test: U (selector never repeats; no mutation of text), C (the two fades from tokens), D.

**MT-A2-R24. The card's height does not jump the list.**
Given the new prompt is longer or shorter than the old one (or the type is at AX5),
When the swap completes,
Then the card height change is applied once, as a layout move of the cards below on the `standard` spring (Reanimated layout transition, as the inline expansion in MOTION 5d) , clipped to the screen, and the card never overflows its container or truncates the prompt (D-027); under Reduce Motion the height change is immediate and the words cross-fade as in R23.
Alternative if the spike shows jank: reserve the height of the longest prompt of the day's set in advance. Decision at the spike; default is the spring.
Test: C (AX5), D.

**MT-A2-R25. VoiceOver hears the new prompt without losing its place.**
Given VoiceOver focus is on the refresh control,
When the prompt changes,
Then focus stays on the control and the new prompt is announced politely, once (prompt text is our own written text, so safe to read aloud), and the card's grouped label updates.
Test: C, D.

**MT-A2-R26. The card never refreshes by itself.**
Given a prompt card is on screen,
When the parent has not tapped refresh,
Then the card does not rotate, auto-advance or animate; a pull to refresh on For you (R20) reorders at the top only, never replaces the prompt under the parent's eyes mid-read.
Test: C.

### 4.7 Cold launch and returning to the tab

**MT-A2-R27. Cold launch enter applies to the first six cards of For you, not to library tiles.**
Given the app starts cold on Moments,
When the first frame arrives,
Then the first cards use `enter` (opacity 0 to 1 and 8 pt rise, `staggerMs` 30, at most `staggerMax` 6, done in about 400 ms as in MOTION 5a), and library tiles never use `enter`.
On a warm return, and on a return from a day or a letter, nothing re-enters (MOTION 5l rule 2).
Disagreement to resolve: MOTION 5l rule 2 and 5a describe Tonight as the cold launch screen. Moments becomes the landing tab, so those rules should name it; this doc applies them to Moments and does not change the ruling. Founder to confirm with the landing-tab decision.
Test: C (first six only), S.

**MT-A2-R28. Returning to the tab keeps its place and its pictures.**
Given the parent leaves Moments and comes back (tab switch, or back from a letter),
When the tab reappears,
Then scroll position, the Recent or For you choice and loaded pictures are as they were, no fade, no refresh, no re-stagger.
Test: C, S.

**MT-A2-R29. Changed permission mid-session.**
Given the parent changes photo access in Settings and comes back,
When the app returns to the foreground,
Then rows that are no longer allowed leave by a single `fadeMs` fade and the rest stay; no alert from us, no scolding line; the tab shows what is still allowed (J5: never an empty promise).
Test: S (revoke while running), D.

## 5. Frame budgets on an iPhone SE (3rd generation)

The repo's rule (MOTION section 7 rule 6, read this session): no frame over 16.7 ms on iPhone SE (3rd gen) and a mid-tier 60 Hz Android. 16.7 ms is one frame at 60 Hz. That the SE 3 is a 60 Hz display with no ProMotion is UNVERIFIED this session (remembered).

**MT-A2-R30. Budget statement.**
Given a release build on a physical SE 3,
When the parent scrolls Recent through the large fixture library (section 9), with pictures loading,
Then no frame takes longer than 16.7 ms in a steady scroll, and the stated hitch count in the evidence file is zero for a 10 second scripted scroll; a failure is a ship blocker for this tab, not a note.
Test: D only (Instruments, an Animation Hitches trace; the tool name is from memory, UNVERIFIED). Evidence file says "device". Debug and simulator runs are not evidence for this row; FlashList's own docs say to judge performance in release mode (read this session), and the same holds for any list.

How the 16.7 ms is protected (rules, each testable):

| Rule | Why | Layer |
|---|---|---|
| Tile fade is opacity on the UI thread; the JS thread writes one target and does nothing per frame (MOTION 7 rule 1). | A JS-driven fade across many tiles drops frames. | C, D |
| A tile owns its own state; a picture arriving never re-renders the list or its row. | One arrival must not cost a list pass. | C (render counts) |
| Row components do no work in render beyond reading precomputed frames; frames come from the pure function in R3. | Item render cost is paid every recycle. FlashList docs: keep item render cheap, memoise, no `key` inside items. | C |
| No shadows, no blur, no per-frame gradients, no `elevation` on tiles (MOTION 7 rule 3). | Offscreen passes cost frames. A tile's edge is a hairline or nothing. | C |
| Thumbnails are decoded at tile size (R7). | A full-size decode on the main path is the classic hitch. | S, D |
| Metadata reads and day bucketing run in chunks that fit well inside one frame each, or off the JS thread. Chunk size is a spike output, not invented here. | A big synchronous bucket blocks scrolling. | D |
| In-flight picture requests are capped by one config number (R15). | Unbounded requests starve the frame. | C, D |
| No loop of any kind runs on this tab (section 3). | Principle: one loop at most; here zero. | C |

Guess, labelled: I expect the costs to rank as picture decode, then layout of day rows at AX5 with many tiles, then bucketing. This is a guess; the spike order in section 8 tests it.

## 6. Reduce Motion, Reduce Transparency, text and contrast

- Reduce Motion: everything here is already opacity-only except the prompt-card height move (R24) and scroll to top (R19). Those become immediate (jump), fades stay at `fadeMs`. The platform refresh control follows the system. The Reanimated default `ReduceMotion.System` jumps to the end; per MOTION 4 we pair movement with a fade and do not rely on the jump.
- Reduce Transparency: no glass is used in the content area, so nothing to change here. Our video marker is a solid pill (R12).
- Increase Contrast: placeholder tile gets a hairline (R1); video marker passes 4.5:1 with margin (R12).
- Bold Text and AX5: day titles and captions wrap and never truncate; collage width does not depend on text size; only headers grow (R3 keeps header measurement separate from collage height so a text change does not recompute the collage).
- 44 pt: the collage is one tap target for the whole day (height far above 44); the compose button and the refresh control meet 44 pt including at AX5; tile spacing is never so small that two tap targets sit under one finger, because tiles inside a collage are not separate targets on this screen (open to a day first).
- Light and dark: flat tile fill and marker are semantic tokens in both schemes; photos are never tinted by the scheme.
- Never colour alone (A-NFR-005): the video marker has a shape and a length.

## 7. Edge and unhappy paths

| Case | Behaviour |
|---|---|
| Limited access with a few assets | Rows for what is allowed; a one-picture day is a complete day (R5); no mention of what is hidden. |
| Limited access changes while open | Rows update on the observer; visible rows do not move (R18). |
| Zero assets | The tab shows its own value content (our Asha examples) per brief item 2; no empty promise, no spinner (R2). |
| A day with only videos | Video markers on every tile (R12); same template (R5). |
| A day with a huge number of assets | Cap tiles drawn; no count shown (R5). |
| Deleted since read | Tile stays flat, frame kept (R10); the row refreshes at the next refresh or observer tick. |
| Screen rotation | Not supported on iOS first (portrait); if enabled later, recompute frames from the pure function (R3) and fade nothing. |
| Memory warning | Drop thumbnails outside the window; tiles return to flat and re-request on demand; no visible change inside the window. |
| Background then foreground | No re-enter, no refresh (R28). |
| Low Power Mode | Not read (MOTION: needs a new dependency, D-065). The design has nothing to switch off: no loops. |
| Very slow device state (thermal) | Fast-scroll gate (R16) already reduces work; nothing else changes. |
| Screenshots and Live Photos, burst, panorama | Treated as photo tiles; ratio from metadata; panorama crops to the tile (R6); no special marker (any special marker is a machine meaning; out). |
| Photo with a very wide ratio | Same crop rule. |
| Asset is a video but its length unknown | Marker shows the play shape with no length; VoiceOver says "Video". |

## 8. Spike (before build): what to measure on a physical SE 3

Ordered so the biggest unknown goes first. Each result is recorded in an evidence file marked device.
1. The cost of reading metadata for a very large library in chunks, and the chunk size that stays well inside a frame.
2. Thumbnail request mode: final-only versus fast-then-final (R9), and the cost of a caching manager preloading the next window (a feature of PhotoKit that I recall exists; UNVERIFIED).
3. Window size and in-flight request cap (R15), and the velocity threshold (R16).
4. FlatList (what the Book uses today) versus a faster list library for Recent. The repo has no FlashList, no expo-image and no media library module in `apps/mobile/package.json` (read this session), so any of them is a new dependency and needs a ruling (D-065). Default proposal: start with FlatList and the fixed-frame rows of R3 (which remove most of what a measuring list library saves); adopt a library only if the spike shows hitches. FlashList's own docs (read this session) say recycling lists want `getItemType` for different row types and no `key` props inside items.
5. Insert-above handling (R18).
6. The prompt-card height move (R24) at AX5.
Also confirm whether a `ph://`-style picture URI can feed an image component directly; the expo-image page I read does not mention it, so do not assume.

## 9. Test fixtures

Synthetic only. No real photo, name, place or business anywhere (brief; `no-real-family-data.test.ts`). The fixture library is generated: flat-colour and line-drawn images of the fictional family "Asha", a few short generated videos, in three sizes of library for the spike (proposal, not measured: a few dozen assets, several thousand, and a very large library of tens of thousands; the largest number is the spike lead's call). Mixed ratios, many days with one asset, some with a great many, and a day with only videos. Never import the founder's screenshots or any file derived from them.

## 10. Constitution, privacy and accessibility checks

Constitution
- No machine-written title, caption or summary: the collage has none; VoiceOver labels hold only "Photo", "Video, n seconds" and parent-typed or chosen labels (R13).
- No scene, place or person guess; no face matching; no ordering by "best". Order is time only.
- Prompt cards use only our written prompts, unedited (R23). The selector may not rewrite them.
- Nothing implies a machine writes anything: the refresh control means "another one" of our words.
- No counts, gaps, streaks, points or badges: no "plus n" chip (R5), no end-of-list message (R17), no "up to date" message (R21), no loading counts (R2).
- Never gender the child: nothing here prints the child's name or pronoun.

Privacy
- Nothing from the library leaves the phone. No asset id, filename, album, place, date or picture size in analytics, logs or crash reports. Request-size logging in R7 is debug only and local.
- No instrumentation of load times with asset detail: if a performance number is ever sent it carries only a duration and a coarse bucket, and goes through the analytics allowlist (`packages/analytics`); the default is none. Recommend none for v1.
- iCloud: thumbnails never trigger downloads (R11).
- Memory only: thumbnails live in memory and the system's own caches; we write no thumbnail file to disk (no persistent thumbnail cache of a person's photos). This keeps the Data Not Collected story simple. Confirm with the privacy analysis, because an image library's default disk cache would write them (the expo-image page I read lists a default disk cache policy); if an image library is adopted, its cache policy must be set to none or memory only for library pictures.

Accessibility (every row above has a test layer; the minimum gate for this tab)
- iPhone SE 3 and the largest iPhone; AX5 with letter text never truncated; Bold Text; VoiceOver order (day label, then tiles in visual order, then the compose button); Reduce Motion; Reduce Transparency; Increase Contrast; light and dark; 44 pt targets; evidence says simulator or device per line.

## 11. Open questions (recommended default, deadline)

Deadlines are relative to the founder's sign-off on the Moments scope; no date is invented.

1. Where do library moments sit in For you? Default: below the first screenful of our own cards, so the first frame never depends on the library (R4). Product leads decide; before the For you ranking is specced.
2. Is a "plus n" or any picture count on a day allowed? Default: no (R5). Product and content to confirm before the day card is built.
3. Which token is the waiting tile fill, and does the semantic set carry a dim token for the video marker? Default: design-systems adds `mediaPlaceholder` and `mediaMarkerScrim` (names are mine, not in `packages/design-tokens` as far as I read) with contrast tests. Before the first tile is built.
4. Fade versus none for a degraded-to-final swap (R9). Default: final only if the spike shows the fast version is already sharp enough at tile size; otherwise cross-dissolve at `swapMs`. At the spike.
5. List library. Default: FlatList with fixed frames, no new dependency (section 8, item 4). At the spike.
6. Cap on tiles per collage (R5) and the AX size at which the marker moves out (R14). Default from the concept doc; design leads.
7. Does the system tab bar (NativeTabs) ship, and so does scroll to top need our own code (R19)? Default: assume our own code. Follows the SDK 58 spike in the V2 doc.
8. The Route A picked-pictures strip: do we draw a collage at all, or a simple row? Default: a simple row (the app sees only what was picked, so there are no "days" to arrange). Feasibility doc decides.
9. Reversals: this doc leans on the founder-owned reversals in the brief (J4, K-02, BL-1305, ML-6, three-tab ruling). It makes none of its own. It does ask the founder to confirm that MOTION 5a and 5l's "cold launch" rule names Moments (R27).

## 12. Dependencies

- Feasibility doc (route A or B; whether Limited access and the change observer are used as assumed).
- Privacy and constitution analysis (thumbnail caching, iCloud, no performance numbers sent).
- Design concept (day card layout, collage templates and cap, tile gutters).
- `packages/design-tokens`: new placeholder fill and marker scrim tokens with tests; confirm `swapMs` and any 120 and 160 ms pair exist as tokens (design-systems, T6 motion).
- `packages/core`: prompt selector never repeating the current prompt (R23).
- `packages/content`: the VoiceOver strings (R13), the refresh control label (R22, R23), any waiting line (R2).
- Mobile: the pure frame function (R3), a media request wrapper with cancel and a caching decision (R15), the device spike (section 8).
- QA: the synthetic library and a device run on an SE 3.
- Transition leads: the move from a day to its page and back, and tab switches. I did not define them here.

## 13. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session):
- `docs/design/MOTION.md` v0.2 content cited above, including 16.7 ms on SE 3 as a repo rule (section 7), the 120 ms out and 160 ms in for "Put it back" (5d), `enter` (5a), the haptics map (6), and "one loop at most".
- `packages/design-tokens/src/tokens.ts` values listed in section 2.
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md`: glass only on navigation and controls; solid `glassFallback`; SE 3 gate; NativeTabs and FlatList caveat; iOS 17.0 minimum.
- `apps/mobile/package.json` lists no expo-image, no list library such as FlashList and no media library module; `book.tsx` uses a FlatList or SectionList (grep hit only).
- FlashList performance page (https://shopify.github.io/flash-list/docs/fundamentals/performance): recycling, no `key` inside items, cheap item render, `getItemType`, release mode for judging.
- Expo Image page (https://docs.expo.dev/versions/latest/sdk/image/): placeholder, transition (cross-dissolve), `recyclingKey`, default disk cache policy; no mention of `ph://` URIs.

UNVERIFIED (remembered or from a summarising fetch I do not trust as Apple's own text):
- PhotoKit behaviour: that an image request can call back more than once with a degraded flag, that requests can be cancelled, that a caching manager exists, that a thumbnail request can refuse network access, and that a change observer exists. The one fetch I tried of Apple's page returned no page text (it needs JavaScript) and the answer came from a summariser's general knowledge. Do not cite it as Apple. Re-check on developer.apple.com before building R9, R11, R15 and R18.
- SE 3 screen scale 2x and a 60 Hz panel; Instruments hitch tooling names; `maintainVisibleContentPosition` behaviour.

GUESS:
- Cost ranking in section 5; default for list library; default for the For you ordering; default AX size and tile share for the marker; the 0.6 alpha margin (the 0.54 minimum is arithmetic, shown in R12).

No number in this doc is a measured number. Every performance threshold marked "spike output" is deliberately blank.

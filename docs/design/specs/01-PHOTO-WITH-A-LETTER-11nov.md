# 1. Photo with a letter

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. This spec refines `MEMORY-LIBRARY-FLOWS-10nov.md` (ML-S4 to S9) under the founder's rule: only Home captures; elsewhere a photo can only be added to a letter that exists. It does not repeat the chooser, chip and viewer designs; it says where each one is entered from now, and adds what is new: the photo-first mode on Home and the Photos lens in the Book.

## 1. Job

One sentence: I put a picture beside the words I say about it. (11 words, verb "put", a CAPTURE enricher; the only part that can start a letter is Home's photo-first mode, which is a way to Say.)

The rule that makes it safe: every picture belongs to a letter. A picture with no words is dropped, never kept (PRD forbids photo-only entries; NX-33 rule, quoted in ML-S9; EVIDENCE as cited there, not re-read).

## 1a. Build 13 scope: one photo per letter

Build 13 holds ONE photo per letter (coordinator, 11 Nov). Everything in this spec that handles several photos is marked post-Build 13 and is not built then: the cap of 8 photos and 2 videos, the multi-select chooser, the "Add photos" row in Review, the 3-photo and 8-photo letter layouts, the strip of tiles, and the viewer's swipe between items. In Build 13 the single picker returns one photo; the Photos lens, the letter page and Share show one. Videos are not in Build 13.

Aligned to PRD #795 (head `41ed5166`), which wins where it differs: no date chip from the file in Build 13; the picture's VoiceOver label is the fixed phrase "Photo with this letter" (NS-01-R9), or the parent's own typed text when present (NS-01-R21); the Photos lens shows no count and no add control (NS-01-R11).

## 2. Where a photo can be added (the whole map)

| # | Where | What it does | Creates a letter? | Tab |
|---|---|---|---|---|
| A | Home, photo-first mode ("Start from a photo") | Opens the picker, then the same Speak or Type screens with the picture attached | Yes, through Home's one capture function, with the photo as context | Home |
| B | Review, "Add photos" row | Attaches to the letter in Review (ML-S5) | No | Home flow (Review is the end of capture) |
| C | Letter page, "Add a photo" | Attaches to this kept letter (ML-S8) | No | Book |
| D | Book, Photos lens | Reads photos only. It has no add button (this is the change from ML-S9) | No | Book |
| E | Home day card (ML-S10, "Tell a letter about it") | A prompt source that opens A scoped to a day | Yes, as A | Home |

D loses ML-S9's "Add photos or videos" button, because that button started a letter on a second tab (finding O7 in NAV-TAB-ROLES section 1). A parent who looks at the Photos lens and wants to add a photo opens a letter first (open question Q1, default: no "which letter" picker; they open the letter, section 7).

**Build 13 rule (PRD NS-01-R22, which wins):** every door opens the iOS system picker and nothing else; it returns one photo. There is no `MediaChooser`, no library access, no pre-prompt (ML-S1), no camera, no video and no multi-select. **Post-Build 13:** all of A, B, C and E open one `MediaChooser` (ML-S4) when library access is on, with the system picker as the fallback (ML section 1.4); the cap, strip and viewer below belong there. One door-set, four doors.

## 3. Home: the photo-first mode (new)

### 3.1 Layout (Home, inside the capture cluster)

```
 [ Speak ]            [ Type ]          <- 64 pt, the two equal buttons
     Start from a photo                 <- quiet button, 44 pt, text only
        Not much today                  <- quiet button, 44 pt
```

- "Start from a photo" is a `Button quiet md` with a leading Phosphor `Image` glyph (decorative, hidden from VoiceOver). It is the third and quietest item inside the capture cluster, under Speak and Type and above "Not much today", in the same container, never larger than either. Karma asked for placement inside the cluster per PRD R1; I did not read that PRD requirement (UNVERIFIED), and this placement is my reading of it. I prefer it to a separate row for one reason: a parent finds all the ways to start a letter in one place, which is the founder's one-entry rule. It stays a quiet button so Speak and Type remain the two equal primary actions. It appears only when the build switch for photos is on; absent, not greyed, when off (ML header).
- It does not appear on Book or Me. This is the single place on any tab where a photo can start something (J3).
- Tap: the system picker opens (one photo in Build 13; several is post-Build 13; videos are out of this spec, see section 10). Cancel returns to Home untouched.

### 3.2 After the picture is chosen: Ready with a photo

The existing Listen "Ready" state (F04: nothing records until the person taps) with one addition, a `PhotoFrame inline` thumbnail above the red circle, at most 160 pt tall, with a quiet `Button quiet` "Change" (44 pt) under it. Type does the same on the Write sheet: the thumbnail sits above the field.

```
 To {child}                          [Let it go]
 +----------------------+
 |      (the photo)     |   160 pt max, 1 pt line edge, radius md
 +----------------------+
            Change
 Tap the red circle and talk.      <- existing listen.ready.hint
          ( red circle )
          or type instead
```

- The prompt is replaced by a photo-aware line (slot `capture.photo.ready`). Never a machine description of the photo (the machine may not add meaning). The line may not name what is in the picture.
- Recording, pause, finish: unchanged (spec 5). The thumbnail stays; it never covers the aura or the timer.
- Finish goes to Review, where the photo is in the strip (ML-S5), above Keep, and, in Build 13, no date or place chip is derived from the file (below, section 1a). A parent may type optional photo text (140 characters) and a place (60), per PRD NS-01-R21.
- If the parent leaves Ready or Review without keeping words: the photo is dropped and the existing "Let it go" confirm names it (slot `capture.photo.dropNote`). The picture was never copied into the book before Keep, so nothing remains (HYPOTHESIS about the implementation; `mobile` confirms; UNVERIFIED).

### 3.3 Components

| Part | Component | Status |
|---|---|---|
| Entry | `Button quiet md` | exists |
| Thumbnail | `PhotoFrame inline` | spec'd (COMPONENTS 2.23), not in `components/ui`; build it, use `expo-image` |
| Change | `Button quiet md` | exists |
| Picker | system picker (needs no permission, UNVERIFIED) in Build 13; `MediaChooser` post-Build 13 | NEW (ML-S4), post-Build 13 |

## 4. Review and the letter page (as ML, with the entry rule)

- Review (B): the "Photos" section from ML-S5, after the words and small-fix marks, before the chips and Keep. Build 13: one photo per letter, so the control reads as adding a photo and is hidden once one is attached (a Change action replaces it). The multi-photo "Add photos" row is post-Build 13. Words above never move.
- Letter page (C): after the words, before the signature rows (ML-S8). An "Add a photo" `quiet` object action sits with the other object actions ("Add to this letter" group: photo, a first, a seal; specs 4). It opens the same chooser and changes this letter only. Build 13 shows one photo (the 1-photo layout). The 3 and 8 layouts in ML-S8 are post-Build 13.
- Own letters only. A co-parent's letter does not get an "Add a photo" action on this phone (HYPOTHESIS, aligned with "nobody changes another author's letter", PRINCIPLES 15; UNVERIFIED against F11).
- Build 13: no date chip and no place chip from the file. PRD OQ-1 says Build 13 takes NX-39 P0 only; the date chip waits for spike BL-843 (PRD NS-01, PR #795 head `41ed5166`, which wins over ML-S6 here). ML-S6 chips are post-Build 13. The parent's typed text and place (ML-S7 fields) stay optional. Take-off behaves as ML-S8.

## 5. The Photos lens in the Book (D)

### 5.1 Layout

The Book header has a `LensRow` under the cover band: "Months" always; "Photos" only once a photo is attached to a kept, open letter; photos on a sealed letter do not count and do not show until it opens (04 FS-R10) (NAV-R4). With no photo there is no lens row at all, no empty tab, no hint.

```
 Asha's book                        [find]
 7 months          [ Read together ]
 ( Months )  Photos                 <- LensRow, text labels
 JUNE
 [photo][photo][photo]              <- 3 columns, 4 pt gap
 [photo][photo]
 MAY
 [photo][photo][photo]
```

- Month headings reuse the Book's own month words (`MonthOpener` words, not a new label).
- A tile opens its letter, not a viewer (ML-S9). Back returns to the lens.
- No add button, no count, no "N photos this month".
- The lens still shows the letter's date under each tile at AX5.

### 5.2 Components

`LensRow` (NEW, a `SegmentedControl` preset: text labels, 44 pt, becomes `Chip` filters at AX5 per COMPONENTS 2.9), `MediaGrid` (NEW, ML 5.2), `MediaTile` (NEW).

## 6. States (all surfaces)

| State | Home A/E | Review B | Letter page C | Photos lens D |
|---|---|---|---|---|
| First run, no photo ever | "Start from a photo" visible when the build switch is on; nothing else about photos | Add button only | Add action only | Lens absent |
| Loading | Picker is the system's; thumbnail appears with a flat `surface` box, no blur animation | "Adding" label under the strip (ML-S5) | Flat `surface` until ready | Tiles fill in, no skeleton |
| Offline | Local photos work. iCloud-only items say so in the chooser (ML-S4) | Same | Same | Fully local |
| Error | `ErrorLine` under the thumbnail: "That photo could not be opened. Choose another." (slot); Speak and Type still work | ML-S5 failed line | ML-S8 missing-file box | Missing-file box on the tile |
| Photo access | Build 13: not applicable, the system picker needs none; the app never asks. Post-Build 13: unchanged button; system picker or chooser per ML 1.4; no mention of access | Same | Same | Lens never reads the camera roll |
| Missing file | n/a | n/a | "Not on this phone any more" box with a quiet Remove | Same box |
| Long letter | Words whole; thumbnail never covers text | Words never move | Words whole; media after | Tiles only |

## 7. Motion (tokens only)

| Moment | Motion | Reduce Motion |
|---|---|---|
| Thumbnail appears on Ready | `enter` (8 pt, 280 ms) | `fadeMs` |
| Change | cross-fade `swapMs` (150) | same |
| Photo added to a letter (B, C) | `enter` with layout on `standard` (NX-35 M10) | `fadeMs`, no layout spring |
| Take off | fade `exitMs` plus `Toast` Undo | same |
| Lens switch | cross-fade `swapMs`; no slide | same |
| Tile press | `press.cardScale` 0.98 | none |

No parallax, Ken Burns, slideshow, autoplay or reel, ever. Haptic: `tap` on selecting in the chooser only.

## 8. Dynamic Type and VoiceOver

- AX5: the Home photo-first button stays 44 pt and wraps onto two lines if needed; the thumbnail on Ready scales to the screen width and the aura moves below it; Review and the letter page use one tile per row; the lens row becomes chips that wrap; tile dates sit under tiles in `callout`. Letter text is whole in every state.
- VoiceOver on Home: the button reads as its own words; after the pick, focus moves to the thumbnail (label: the fixed phrase "Photo with this letter", NS-01-R9, or the parent's own typed text if there is any; then "Change") then the red circle. The reading order is thumbnail, prompt, Speak, Type (NS-01-R20). The app never generates a description.
- Lens row: the segmented control's own selected trait; no count of pictures in any VoiceOver string (NS-01-R11). Each lens card reads the letter's card name plus the fixed photo label.
- Typed description (ML-S7, 140 characters) is the only text alternative. Said plainly in the spec, as ML-S8 does: a video carries speech and the app makes no captions.

## 9. Copy slots (for `content`; I write no final strings)

Existing on `develop`: `tonight.states.*`, `listen.*` (EVIDENCE). Drafts exist in `MEMORY-LIBRARY-WORDS-10nov.md` (not read in full by me this session). New slots needed by this spec:

| Slot | Intent | Limits and rules |
|---|---|---|
| `capture.photo.startButton` | The quiet button on Home | 22 characters or fewer; says photo; verb "start" or "say"; no "memory" |
| `capture.photo.ready` | Line on Ready when a picture is attached | One sentence; does not describe the picture; no counting |
| `capture.photo.change` | Change the chosen picture | 1 to 2 words |
| `capture.photo.dropNote` | In the "Let it go" confirm: the picture goes too | One sentence; true only if nothing was copied |
| `capture.photo.openFailed` | The picture could not be opened | Says what to do next |
| `book.lens.months`, `book.lens.photos` | Lens labels | One glossary word each |
| `book.letter.addPhoto` | Object action on the letter page | Starts with a verb; "this letter" |
| `book.photos.a11yTile` | The fixed VoiceOver label of a picture: the PRD's phrase "Photo with this letter" (NS-01-R9); the parent's typed text replaces it when present | No machine caption, no count, no date generated |
| Reuse | ML chooser, chips, cap, cloud, missing strings | Per `MEMORY-LIBRARY-WORDS-10nov.md`; its Truth lines still apply |

Door lines (COORDINATION section 10; COUNSEL-READ, none cleared):
- Shown: the picker is the system's; Home shows the button and nothing about access. There is no pre-prompt in Build 13. If the app asks for library access later (post-Build 13), that is ML-S1.
- Records: the kept copy of a chosen picture, its date and typed place, in a phone-only table (ML gap 2). This spec adds no analytics event. The PRD proposes one opt-in event, `media_added` with `source` and `kind` only (NX-39-R34); that is the PRD's and proposed-only, not part of this spec, and it needs the catalog first.
- Never: the picture, its description, date or place in analytics, logs, crash reports, push, URLs or sync payloads beyond the letter's own rules; no face, object or scene analysis; no auto-attach.
- Decline: Cancel in the picker costs nothing. (Post-Build 13: denying library access still leaves the system picker.)

## 10. Out of scope here (each with a default)

- Video: same doors, cap and tile as ML-S4 and S8; later (NAV-TAB-ROLES C21). Default: not in this scope.
- Camera ("Take a photo now"): needs the camera permission and a purpose string. Default: no; the library only.
- Photo-only letters: forbidden.
- Editing a photo (crop, filter): no. Default: none.

## 11. Requirements (Given, When, Then; working ids PW-R#; `product` assigns real ones)

| Id | Requirement | Proof |
|---|---|---|
| PW-R1 | One photo-led entry. Given any build, Then the only control outside a letter that starts something with a photo is Home's photo-first button (and the day card). Book and Me have none | navigation test N3(f) and (g) (06 section 10: `photoFirst` only from Home's module), plus PRD NS-01-R1's route and AST scan; device |
| PW-R2 | Never a photo alone. Given a picture chosen on Home, When the parent leaves without keeping words, Then the picture is not kept and the confirm said so | device; unit test on the capture function |
| PW-R3 | Enrich only. Given the letter page, When the parent adds a photo, Then that letter changes and no letter is created | unit test (NX-39 style) |
| PW-R4 | Lens on material. Given at least one kept photo, Then the Book offers Photos; Given none, Then no lens row and no empty state | device |
| PW-R5 | Words are whole. Given any photo count and AX5, Then letter text is not truncated and does not move when a photo is added | device, AX5 |
| PW-R6 | No machine words. Given a photo, Then no caption, tag, description or place is generated by the app; only the parent's typed text or the file's own date and place (as ML-S6) is shown | review of strings and code |
| PW-R7 | Accessibility. Given VoiceOver, AX5, Reduce Motion, Reduce Transparency, both themes, Then section 8 holds and the viewer text meets 15 : 1 (ML section 6) | device |
| PW-R8 | Truth. Given any line about where a photo is kept, Then it is shown only if true of the shipped build (ML 1.2) | `legal`, `privacy` |

## 12. The 12-line job-clarity review

| # | Result | Reason |
|---|---|---|
| J1 | Pass | "I put a picture beside the words I say about it." One verb |
| J2 | Pass | "Put" is not Say, Read or Look after; on Home it is a mode of Say |
| J3 | Pass, with the change | Photos lens loses its "Add" button; the only starter is Home |
| J4 | Pass | Object: a letter with a picture |
| J5 | Pass | The button names a photo; the lens is labelled Photos |
| J6 | Pass | On Ready, the red circle stays primary; the photo button is quiet |
| J7 | Pass | Home shows no photos list; the Book lens shows them |
| J8 | Pass | No photo: lens absent; Home button is one quiet line |
| J9 | Pass | Section 6 gives a next step for each |
| J10 | Open | All slots are new; `content` and the founder approve |
| J11 | Open | Needs a device pass; tables in sections 7 and 8 are the targets |
| J12 | Pass | Without it a parent attaches pictures only in Review; the phone's own picker could not start a letter from a picture |

## 13. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | A parent on the Photos lens wants to add a photo. Do we offer a "which letter" step? | No. They open a letter and add there. One fewer door |
| Q2 | Does "Start from a photo" show before any photo exists? | Yes, one quiet line, so the mode can be found |
| Q3 | Cap of 8 items and 2 videos (ML Q3) | Post-Build 13. Build 13 is one photo per letter, no video |
| Q4 | New token names `mediaScrim`, `onScrim`, `viewer` instead of changing `scrim` | New names; `scrim` stays the sheet dimmer |

## 14. UNVERIFIED

Apple's picker needing no permission and what it returns about location; `expo-image` and picker behaviour in SDK 57; that the Ready state can carry a thumbnail without crowding at 375 pt and AX5; that copying happens only at Keep; whether the open stack's `book.tsx` can host a lens row; every ML statement I relied on (I read ML-S4 to S9 and section 5 to 8 only).

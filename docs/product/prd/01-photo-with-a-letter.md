# NS-01: Photo with a letter (photo-first capture on Home, a Photos lens in the Book)

Status: Draft v1.1, 11 Nov 2026 (UTC), aligned to design spec `docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md` (PR #794, head `e872793d`). Docs only. Author: `product`. Rank 1 of 7 in the new-scope stack rank (`closed-questions-2026-11-11.md`, X1). Index: `README.md`.
Build target: Build 13, behind `EXPO_PUBLIC_PHOTOS` (the P0 switch named in `NX-39-memory-library.md` section 3). Library chooser (P2a) and video (P3) are not in this PRD.

Tags: EVIDENCE = a repo file or PR read this session. HYPOTHESIS = what a parent will do or feel. UNVERIFIED = not read or not run. I did not run the app and I did not open the photo code (the repo has `photo_path` in the core schema and a `photo: null` export field, and no picker code on `develop` at `da83fb1ee`).

## 1. Job to be done

I go to Home to tell {child} about a picture I just took or found, so that the picture and what I said about it are kept as one letter.

The Book's Photos lens answers the second job: I go to the Book to look at the pictures that have a letter with them.

## 2. Who and when

- A parent holding a phone with a picture of {child} that they want to talk about. Often one-handed, often in the evening, sometimes with {child} on their lap. HYPOTHESIS: the picture is the reason they open the app on that day.
- The co-parent, when co-parent sharing is live (not Build 13). Their letters carry their pictures the same way.
- Not a grandparent or a child. Nothing here is a child-facing surface (`NX-39-R57`).

## 3. The single capture entry rule

Only Home starts a letter (`NAV-TAB-ROLES-10nov.md` rules P1 and P2). Photo-first is a mode of Home's one capture entry, not a button on another tab.

- Home carries one extra start in the capture cluster, next to Speak, Type and Not much today. It opens the same capture screens with a picture already attached.
- The Book's Photos lens only reads. It has no "add" button and no "start a letter" button.
- The letter page and Review may "add a photo to this letter". That is an enricher (P9): it needs a letter that exists or a draft, and it never creates one.
- Camera capture is out (system picker only). A picture alone is never a letter. The PRD forbids photo-only entries, and a letter counts only when its words exist and are kept from Review (D-103).

## 4. User stories

| Id | Story |
|---|---|
| S1 | As a parent with a picture of {child} laughing, I tap the photo start on Home, pick it, and say what happened. The picture and my words are kept together. |
| S2 | As a parent who has already kept a letter, I add a picture to it later from the letter page. My words do not change. |
| S3 | As a parent in the Book, I open Photos and see the letters that have a picture, newest first, and tap one to read it. |
| S4 | As a parent who picked the wrong picture, I change or remove it in one tap and can undo. |
| S5 | As a parent who has never added a picture, I see no empty Photos page, no hint and no count. |
| S6 | As a parent, I may type a few words about a picture (up to 140 characters). They are mine; the app writes none. |

## 5. Acceptance criteria

Phase: P0 of NX-39 (one picture per letter, the stripped copy, no permission question). Rows that restate an `NX-39-R#` cite it; the test title carries both ids so one test proves both. Device checks use an iPhone 17 Pro and an SE-class phone.

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-01-R1 | Given the Home route with `EXPO_PUBLIC_PHOTOS` on, When it renders, Then exactly 1 photo start exists, inside the capture cluster. Given the Book and Me routes, Then 0 controls start a letter from a picture. | `[NS-01-R1] only Home registers a photo start` (route and AST scan) |
| NS-01-R2 | Given the photo start, When the parent taps it, Then the system picker opens, 0 permission questions are asked and no full-library authorization call is made (`NX-39-R2`). | `[NS-01-R2][NX-39-R2] the photo start asks no library question` |
| NS-01-R3 | Given a picked picture, When Home's capture opens, Then the picture shows as a thumbnail at least 64 pt on its longest side above the capture buttons, and the prompt line is chosen by the same function as today, from age and history only. With 3 different fixture pictures and one fixed state, the chosen prompt is identical. | `[NS-01-R3] the prompt does not depend on the picture` |
| NS-01-R4 | Given a picked picture and no speech or typing started, When the parent goes back, Then 0 rows and 0 files are written and Home looks as before (`NX-39-R14`). | `[NS-01-R4][NX-39-R14] backing out writes nothing` |
| NS-01-R5 | Given a draft with a picture and no words, When the parent opens Review, Then Keep is disabled and the picture alone cannot be kept. Given words exist, Then Keep works and the letter counts under D-103. | `[NS-01-R5] a picture without words cannot be kept` |
| NS-01-R6 | Given any picked file with location, date, device and thumbnail segments, When the stored copy is written, Then 0 of 10 fixtures carry an Exif, XMP or IPTC segment, also after export (`NX-39-R8`). | `[NS-01-R6][NX-39-R8] 0 of 10 stored files carry metadata` |
| NS-01-R7 | Given a letter that has a picture, When the parent adds a second one, Then it asks to replace, the first stays until the replace is confirmed, and Undo restores it for 10 seconds (one picture per letter at P0). | `[NS-01-R7] a second picture replaces only after confirm, with Undo` |
| NS-01-R8 | Given any add, replace or remove of a picture, Then the letter's `final_text`, `raw_transcript`, machine edits and recording hash are byte-identical before and after (`NX-39-R10` extended to P0). | `[NS-01-R8] picture changes never touch words or recording` |
| NS-01-R9 | Given a kept letter with a picture, When the letter page opens, Then the picture shows with the letter and its VoiceOver label is the fixed phrase "Photo with this letter". No machine caption, title, tag or description exists anywhere (`NX-39-R9`). | `[NS-01-R9] the picture has a fixed label and no machine text` |
| NS-01-R10 | Given at least 1 kept letter with a picture, When the Book opens, Then a Photos lens is offered. Given 0 such letters, Then no Photos control, empty state or hint appears. | `[NS-01-R10] the Photos lens exists only when a picture does` |
| NS-01-R11 | Given the Photos lens, Then it lists letters that have a picture, newest first by the letter's date, each as a letter card with a thumbnail; it shows no number of pictures, no count in any VoiceOver string and no "add" control. | `[NS-01-R11] the lens shows no count and no add control` |
| NS-01-R12 | Given the last picture is removed or its letter is deleted, When the Book opens, Then the Photos lens is gone and no message says so. | `[NS-01-R12] the lens disappears quietly` |
| NS-01-R13 | Given App lock on, When the app goes to the switcher or opens cold, Then screens that show a picture render blank in the snapshot (`NX-39-R36`). | `[NS-01-R13][NX-39-R36] the switcher snapshot is blank` |
| NS-01-R14 | Given an export, Then the stored stripped copy is included at the path `NX-39-R32` names and the export `counts.photos` equals the number of pictures; no original bytes and no "originals" option exist. | `[NS-01-R14][NX-39-R32] export carries the stripped copy only` |
| NS-01-R15 | Given sync on, When a letter with a picture syncs, Then `photo_path` stays null and 0 bytes of media upload (`NX-39-R33`, `R54`). | `[NS-01-R15][NX-39-R33] sync carries no picture` |
| NS-01-R16 | Given a letter is deleted, Then its picture file is deleted in the same step; Given Recently deleted restore, Then the letter and its picture return together while inside the restore window (F17), and a purge removes the file (`NX-39-R31`). | `[NS-01-R16] delete, restore and purge treat letter and picture as one` |
| NS-01-R17 | Given an attach that is cancelled, fails to decode, or runs on a full phone, Then 0 files remain and the letter is kept (`NX-39-R14`). Given an iCloud-only picture, Then it downloads on demand with progress and Cancel (`NX-39-R13`). Given a Live Photo, Then only the still is stored (`NX-39-R12`). | `[NS-01-R17] failed picks leave nothing; iCloud and Live Photo behave` |
| NS-01-R18 | Given the plan engine, Then attaching, replacing, viewing and exporting a picture never call the Keep gate; the only gate on the path is Keep after the allowance (`NX-39-R58`). | `[NS-01-R18][NX-39-R58] pictures are never gated` |
| NS-01-R19 | Given the switch `EXPO_PUBLIC_PHOTOS` off or the remote pause on, Then the photo start, the lens and the add-a-photo actions do not render, and Export and Erase everything still work (`NX-39-R37`). | `[NS-01-R19][NX-39-R37] the switch removes the screens, not the data rights` |
| NS-01-R20 | Given VoiceOver, AX5 and Reduce Motion, Then every new control is at least 44 pt, announces its state, reads in order (thumbnail, prompt, Speak, Type), and at AX5 stacks to one column (`NX-39-R35`). | `[NS-01-R20] new controls pass VoiceOver, AX5 and Reduce Motion` |
| NS-01-R22 | Given a picked picture, When the parent types photo text, Then it is optional, at most 140 characters, stored in its own field, never filled in or suggested by the app, and is the picture's only text alternative for VoiceOver when present (else the fixed phrase of R9). Find searches it (NS-02-R5). | `[NS-01-R22] photo text is the parent's, optional and 140 characters` |
| NS-01-R23 | Given the picture source, Then only the system picker exists: no camera control, no camera permission string and no "Take a photo now" in the plist or the screens. | `[NS-01-R23] the system picker is the only source` |
| NS-01-R24 | Given the Book with 0 letters, Then its empty-state button (`book.empty.bookCta`, today "Write a letter") reads as a pointer to Home, its action is a switch to the Home tab and calls no capture function, and the Book has 0 controls that start a letter (`content` writes the word; design spec 06, J3). Given the Photos lens, Then it has no "Add photos" button. | `[NS-01-R24] the Book empty button only moves to Home; the lens cannot start a letter` |
| NS-01-R25 | Given the strings, Then they pass `packages/content/test/rules.test.ts`: no dash, curly quote, ellipsis character or emoji; no "memory" or "moment" for a letter; no implication a machine writes; `{child}` for the child. | existing content rules test, extended |

## 6. Edge cases, empty and error states

| Case | Behaviour |
|---|---|
| A quiet day ("Not much today") | Takes no picture. D-084 keeps it a mark with no text. |
| Picture of someone other than {child} | The app does nothing different. The right-to-add and other-people terms are counsel's (`NX-39-R38`; CB-6 and CB-7). |
| Two phones, one account | The picture lives on the phone that added it (R15). The second phone shows the letter with no picture slot and no broken image, and no message. Open question OQ-2 below. |
| Phone lost, restored from an iPhone backup | The pictures return only if the iPhone's own backup carries them. NX-39 F9 default: pictures in the backup, video out. |
| Co-parent's letter with a picture | Not applicable in Build 13 (no live co-parent). When it is live, the picture follows the same non-sync rule. |
| App lock cold open | No picture draws until the parent has passed App lock (R13). |
| Permission "Limited" or "Denied" | Not an issue at P0: the picker needs no permission. |
| Very large picture | Stored copy is the stripped copy at the size `NX-39` BL-847 sets; a failure to write is R17. |
| Draft abandoned after the picture is attached | The draft waits as today ("Waiting to be kept"); a discarded draft deletes its picture file. |

## 7. Privacy and constitution check

- The machine adds nothing: no caption, classification, face or scene detection, no title, no "best photo" (`NX-39-R9`). Words stay the parent's.
- No picture, thumbnail, file name or path in analytics, logs or crash reports (`NX-39-R30`, `R50`). The log canary test in NX-39 covers it.
- Door lines (the picture start is an act the person agrees to by tapping, not a consent record):
  - Shown: the picker is Apple's own; our line above it is one sentence from `packages/content` (the counsel-approved NX-33 label, `NX-39-R1`). Until counsel clears the line, the line is absent and the control still works.
  - Records: nothing about the act. The stored copy and its date field are on the phone only.
  - Never: reading any picture the parent did not pick; location; faces; the library; background reads; upload.
  - Decline: Cancel in the picker. Nothing is written. Export and erase work either way.
- No streaks, points, badges or gap counting. The lens shows no count and no "letters without a picture".
- Language: "photo" and "picture" are fine. "Memory", "moment" and "album" are banned for what a person makes (BRAND.md glossary).

## 8. Free vs Plus

- Free: the photo start, adding, replacing, removing, the lens, export. None of these is a gate (`NX-39-R58`).
- The one gate is Keep after the allowance (D-082: 2 letters, planned raise 2, 5, 10). Capture is never blocked: a draft with a picture waits, nothing is lost, and the picture stays on the phone.
- What a family kept stays theirs to read, hear and export, pictures included.
- No Plus line mentions pictures. Counsel confirms the wording of the allowance copy (closed X4).

## 9. Metrics (content-free)

- Opt-in analytics is off for the 1.0 line (D-124). If a parent opts in, the only new event is `media_added` with `source` (`photo_first`, `review`, `letter_page`) and `kind` (`photo`), as `NX-39-R34` allows. No count of pictures per child, no frequency goal.
- Learning without telemetry: a five-parent study. Pass line proposed here: 4 of 5 start a letter from a picture without help, and 0 of 5 say the Photos lens felt like a second place to start a letter.

## 10. Dependencies

- NX-39 P0 and its counsel tier A read on the NX-33 label (BL-846, BL-847); counsel is asked for the label only, not for new behaviour.
- A picker package with native code: `security-architect` reviews the lockfile and plist diff (`NX-39-R52`).
- The Book lens needs the Book's lens frame from `NAV-TAB-ROLES-10nov.md` rule P3 (design lead, PR #789). UNVERIFIED that it merged.
- NX-41's tab labels: Home | Book | Me are closed. The lens is inside the Book.
- Export schema bump for the picture field (ADR 0027, `data-architect`).

## 11. Risks

| Risk | Mitigation |
|---|---|
| Photo-first becomes a second way to write a letter and the Home/Book overlap returns | R1 test; the lens has no add control (R11). |
| Pictures do not follow the account to a new phone | Said once, plainly, in the Where-your-letters-live words by `content` after counsel; export keeps them. OQ-2. |
| A picture beside the words makes the letter feel unfinished without one (gap counting by design) | R10 and R12: nothing marks letters without a picture. |
| Counsel does not clear the label in time | Ship with the line absent (Shown above); feature stays on a TestFlight-only profile. |
| Native module raises review friction | `NX-39-R51` allows no widget or app group; the picker needs neither. |

## 12. Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-1 | Does Build 13 take NX-39 P1 (date from the file)? | Founder | No. P0 only; the date chip waits for spike BL-843. | Fri 20 Nov 2026 |
| OQ-2 | What does a second phone show where a picture was? | `design-systems`, `content` | Nothing. The letter reads whole without it. | Before the design freeze for Build 13 |
| OQ-3 | Placement of the photo start in the capture cluster | `design-systems` | Fourth item, same size as Type, after Speak and Type, before Not much today. | Design spec |
| OQ-4 | Does the Photos lens sit in the Months sheet area or above the chapters? | `design-systems` | A switch above the chapters (Months, Photos), Photos shown only when a picture exists. | Design spec |

## 13. Rollout

- Flag: `EXPO_PUBLIC_PHOTOS`, off in `production` until the counsel read on the label returns and the plist and snapshot checks pass (`NX-39-R4`, `R36`); on in `testflight` and `preview` first.
- Target: Build 13. It ships alone: no later NX-39 phase rides with it.
- Kill: the remote pause can hide the surface but never turns it on (`NX-39-R37`).
- Backlog rows: BL-847 (build) exists in NX-39's table; new rows for the Home start and the lens are for the next `product` backlog PR, because this PR touches no backlog file.

## 14. Not fully testable

- NS-01-R3's "64 pt thumbnail" is a design number the design lead confirms.
- NS-01-R20 needs a device run with VoiceOver; there is no stand-in.
- OQ-2 behaviour is untested until a second-phone run exists.

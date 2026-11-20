## Review B at 9a57d61395646d10a8853a3f560211a8e4cf3803: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens B, principal-architect's domain: code shape, module boundaries, one definition of each rule, and the flag. PR #840, photo slice 5 (BL-931): the Book's Photos lens as letter cards. Base feat/mobile-photo-4c-letter-page at 2d3994e7. Diff reviewed: `git diff origin/feat/mobile-photo-4c-letter-page...origin/feat/mobile-photo-5-lens`.

Head history. I started at f811c9a6. There, `LensRow` was a View with `accessibilityRole="tablist"` around two Buttons. NS-33-R3 (11-foundations.md:264, P0 (b)) and NS-01-R48 rule that out, and it would have been my must-fix. The head moved to 9a57d613 (12:45 UTC): a merge from 4c (bd45dc40) and one own commit (9a57d613).
- The own commit makes `LensRow` a segmented `ChoiceGroup` (components/photos/photos-lens.tsx:29-39). It is labelled by a new PROPOSED key, `book.lens.label` ("Show letters by", photos.en.ts:31-34).
- It keeps the ids `book.lens.months` and `book.lens.photos`.
- It adds `[NS-33-R3]`, a test that pins the radiogroup, the radio and the checked state in choice-group.tsx.
- Apart from that, the slice's own diff is unchanged. I reviewed the new content.

Must fix: none.

Notes (most serious first):
N1. With the switch off, the lens still does its work (flag shape, NS-01-R19). `usePhotosLens` runs on every Book render (`app/(tabs)/book.tsx:341`), and it re-runs on every store event (`lib/photos/hooks.ts:60-73`). Each run lists the book's letters and reads all `entry_media` rows through `photoDeps()`, which also builds the photo deps (expo-crypto, the baker). This happens whether or not the switch and the pause allow the lens. Nothing is drawn, so R19 holds, but a switched-off build pays a query on each store change. Return the empty lens before `photoDeps()` when `photoSurfaces(...).lens` is false.
N2. One assembly of the surface rule (CODE-R14). `photoSurfaces({ build: photosBuildEnabled(), paused: photosPausedNow() })` is now written out in three places: use-photo-start.ts:10-11, letter-photo.tsx:35 and book.tsx:342. A `photoSurfacesNow()` in flag.ts (or pause.ts) would make one place decide. The `[NS-01-R19] every surface asks for the pause` test could then pin the one helper and its callers.
N3. book.tsx (CODE-R06): it grows from 522 to 545 lines and takes five photo imports (flag, pause, lens, hooks, photos-lens), which the R23 test now pins as a list. One `usePhotosLensView(activeId)` hook returning `{ lensOn, showPhotos, mode, setMode, photos }` would leave the screen one import and three lines. It would also take N1's short-circuit and N4's reset.
N4. The chosen mode outlives the lens. `lensMode` stays 'photos' when the lens disappears (book.tsx:340-343), and when the active book changes. R12 (the Book shows Months once the last picture goes) holds while `lensOn` is false. But the next picture added, or a return to a book with pictures, opens straight on the Photos page with no choice made. Reset to 'months' when `lensOn` turns false.
N5. NS-01-R53 and NS-37: the Photos page is a non-virtualised ScrollView (book.tsx:434-438), and each card decodes the stored copy into a 72 pt PhotoFrame (photos-lens.tsx:44, :58). The locked card lists this as not met. The plan puts BL-932 (list copies) before the flag turns on, so this is not for this slice.
N6. The boundary is good, and worth keeping. `LetterCard` takes an optional `photo` of `{ thumb: ReactNode, label }` (components/book/letter-card.tsx:50-57, :128-145) and imports nothing from photos. The thumbnail is hidden from VoiceOver, and the card reads its own label, then the photo label. lens.ts is pure and tested (visible only for kept, open letters; no count; chapters filtered in the Book's own order). The R23 test refuses picker, pending, session, device and capture imports in book.tsx. photos-lens.tsx reaches `photoUri` through lib/photos/device, which loads the store and picker wiring. A `photoUri` in files.ts, or a re-export from lens.ts, would keep the Book's path off device.ts.
N7. What "kept, open" means here is `inBook`, `kind !== 'not_much'`, no `deletedAt` (lens.ts:26-33), and only the active book's letters. The closed-seal option exists but nothing passes it yet (R10b: no seal source). When the seal lands, its PR must pass `isClosedSeal`; a test that fails without it belongs there.
N8. Size (CODE-R02): 300 changed lines in 11 files without the lockfile and licences (198 code, 101 tests, 1 board line). That is within the limit, and up from 269 with the radio group fix.

What I checked:
- NS-33-R3 and NS-01-R48: ChoiceGroup gives one `radiogroup` with the label and two `radio` options with `checked` (choice-group.tsx). It stacks at large text. Nothing in photos-lens.tsx says tablist, uses Button or sets `selected`.
- NS-01-R11 and R23b: no count in lens.ts or in the strings (content tests). No add or start control on the lens. The Book's empty button only navigates to Home (the R23 AST test).
- R19: the row and the page draw only with `lensOn` (switch, pause and visible); source-pinned. The pause test now covers use-photo-start.ts too. #838's mutation N8 is RED at this head.
- No log, analytics or network call added. The new strings are marked TODO(founder).
- Full apps/mobile suite at 9a57d613: see the last section. tsc --noEmit: the 5 known errors only. packages/content: all pass.
- CI at 9a57d613 (REST, about 12:56 UTC): required, compliance-fence, applied migrations unchanged, tests and content rules, typecheck, web and web e2e are success. The iOS simulator build was skipped. The store-profile Release launch was queued.

Not verified:
- The cards at AX5 and in dark mode, and VoiceOver reading "radio button, 1 of 2, checked" on a device.
- The queued store-profile Release launch.
- Lens A's findings on this slice are for its own reviewer. I ran only the photo test files and the full suite here.

Reviewer: independent of the author (CR-44).

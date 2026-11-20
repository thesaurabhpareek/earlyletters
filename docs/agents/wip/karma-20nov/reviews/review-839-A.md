## Review A at 2d3994e7b907d0472ac5d28e4f8897d7345375c9: CHANGES
<!-- agent:principal-architect -->

Lens A (correctness, tests that fail on the old code, code shape, module boundaries). PR #839, photo slice 4c (BL-931): the photo on Review and on the letter page, add, replace with a confirm, take off, Undo, and the draft's picture going at Let it go. Base feat/mobile-photo-4-capture at 0f253840. Diff reviewed: `git diff origin/feat/mobile-photo-4-capture...origin/feat/mobile-photo-4c-letter-page`.

Head history. I started at 279ba898. The head moved to 2d3994e7 (12:37 UTC): a merge from 4b (2028baaa) and one own commit (2d3994e7).
- The own commit drops `maxLength` from the words and place fields (letter-photo.tsx:105-107) and adds `[NS-01-R21][BL-957]`, a test over Devanagari and ZWJ family emoji.
- Apart from that, the slice's own diff is unchanged.
- I reviewed the new content at 2d3994e7.

Must fix:
1. The NS-01-R8 test cannot fail (CODE-R04). R8 is P0 (a): a picture change, or an edit of its words or place, leaves the letter's final_text, raw_transcript, edits, edit level and recording hash byte-identical.
   - The test at `test/photos-capture.test.ts:171-180` freezes an object that it never passes to any photo function, then compares its JSON with itself. It runs over the in-memory store, which has no `entries` table.
   - Mutation P1: `entryMediaStore.put` also runs `UPDATE entries SET final_text = 'x' WHERE id = ?`. That is the real way a picture write could reach a letter, because put deletes and inserts in a transaction beside `entries`. It stays GREEN across photos-device, photos-phone, photos-surfaces, photos-capture and erase-all (167 tests).
   - Fix: run add, confirmed replace, Undo, remove and `editPhotoWords` against `entryMediaStore` on node SQLite, with a letter row from `helpers/store-fixture` (final_text, raw_transcript, machine_edits, edit_level, audio_sha256 set). Compare that `entries` row byte for byte before and after. P1 must then go red.

Notes (most serious first):
N1. The Undo can be pressed after it stops working (NS-01-R38b, P0 (b), which the locked card already lists as "not met in the stack"). A toast with an action never times out (`components/ui/toast.tsx:9-10`), but `undoPhotoChange` refuses after 10 s (`src/lib/photos/attach.ts:55`).
   - After that, a tap on Undo does nothing, and the toast closes as if it had worked.
   - Separately, `toastStore.hide()` never calls `onDismiss` (toast.logic.ts; Undo closes through it, and so, by toast.tsx's header, does a change of screen). So `settlePhotoChange` runs only on Close, a swipe or a replacing toast (letter-photo.tsx:43). A picture taken off or replaced then stays on disk until the next launch sweep. That is within the sweep's promise, but it is later than "when the window closes".
   - The plan maps the T4 rule to BL-954. It must land before the flag turns on.
N2. The draft eraser also matches kept letters. `store.deleteDraft` and `finishDiscard` call the injected eraser with the draft id (store.ts:1311 and :1328). `erasePictureOf` deletes by `COALESCE(entry_id, draft_id) = ?` (photos/device.ts:95), and a draft's id becomes its letter's id.
   - Today no caller passes a kept letter's id: Write's emptied draft, swapPrompt, the sweep's empty recording, and Let it go in the 'discarding' state. A later caller that did would erase that letter's picture.
   - Hand the store a draft-only eraser (`WHERE draft_id = ?`).
N3. Shape of the store change (CODE-R06; module boundaries).
   - store.ts grows by 21 lines (1356 on develop, 1380 at the top of the stack). The chapter says files over the limit must not grow.
   - The eraser reaches the store through a module-level setter that `capture/erase.ts:32` sets as a side effect of being imported (via `_layout.tsx` and `capture/sweep.ts`). A test or an entry point that never imports erase.ts silently gets the no-op, and the photo sweep catches it at the next launch.
   - The store already takes erasers as parameters (`eraseEntry(..., eraser)`, `AudioEraser`). Passing one to `finishDiscard` and `deleteDraft` the same way would keep one pattern.
   - A throw from the eraser inside `deleteDraft` now reaches Write's `session.close()` (write-session.logic.ts:125) with no catch. `swapPrompt` catches it (write.tsx:246-251); the launch sweep calls it only for a recording draft, which never holds a picture.
N4. Uncapped fields with a silent cut. With `maxLength` gone, the fields accept any length, while `editPhotoWords` stores only 140 and 60 characters on every keystroke (letter-photo.tsx:106-107). The field still shows everything typed until the page reopens, so words the parent typed beyond the cap are dropped without a sign.
   - A grapheme-aware counter, or a controlled value cut at the cap, would show it.
   - Each keystroke is also a DELETE and INSERT of the row, plus a store event that re-renders every store subscriber.
N5. `photoUri` returns '' for an id that cannot make a stored name (photos/device.ts:56). The body says the frame then shows the picture as missing, but that relies on React Native's Image calling `onError` for an empty uri, which I could not confirm. Render the missing state directly when `photoUri` is ''.
N6. With the remote pause on or the switch off, `LetterPhoto` returns null (letter-photo.tsx:79), so a letter's existing picture is no longer shown on its page. The card's R19 hides the start, the lens and the add, change and remove actions. It does not say viewing is hidden. Worth one line from `product`.
N7. Most of the screen wiring tests are source regexes: the not-saved line, Review's adoption, R25's `own && words` and R19's `on` guard. They do fail when removed (mutation P5, the author check, is RED).
N8. The Keep call to `commitPendingPhoto` (review.tsx) is still unpinned at this head. See #838 Review A, must fix 1.
N9. Size (CODE-R02): 533 changed lines in 17 files without the lockfile and licences (354 code, 178 tests, 1 board line). That is 15 more than the 518 that the founder's exception was given on, from the BL-957 round. Name it on the PR.

What I checked:
- `attach.ts` takes an owner id and the photo ports only. Add asks before a replace. A failed replace keeps the first picture. Undo restores the row and removes the replacement's file. Settle removes the earlier file.
- Mutations, each alone and restored, at 2d3994e7:
  - RED: P2 (erase.ts never hands in the eraser) and P3 (deleteDraft skips the picture), both in erase-all's Let it go test; P4 (Undo after the window), photos-capture; P5 (author check dropped), photos-device and photos-capture.
  - GREEN: P1 (Must fix 1).
- R25: a quiet mark gets `needs_words` with 0 writes, and its page draws no control. R9c: controls only when `own`.
- The draft's picture: Review adopts the pending picture to the draft once (review-photo.tsx:15-17; the latch in adopt.ts). Keep moves the row inside the letter's transaction (3a). Let it go and an emptied Write draft take file then row (erase-all).
- No log, analytics or network call in the new code. All words come from packages/content, marked TODO(founder).
- Full apps/mobile suite at 2d3994e7: see the last section. tsc --noEmit: the 5 known errors only. packages/content: all pass.
- CI at 2d3994e7 (REST, about 12:56 UTC): required, compliance-fence, applied migrations unchanged, tests and content rules, typecheck, web and web e2e are success. The store-profile Release launch and the e2e simulator app were queued.

Not verified:
- On a device: the confirm Alert's button weights, the Undo toast with VoiceOver (T4), AX5, and whether an empty uri reaches Image's onError.
- The queued macOS jobs.

Reviewer: independent of the author (CR-44).

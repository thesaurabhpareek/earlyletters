## Photo with a letter, slice 4c: the photo on Review and the letter page (BL-931)

**Base:** `feat/mobile-photo-4-capture`. **Branch:** `feat/mobile-photo-4c-letter-page`. Split from #796 (8a026397).

### What and why
- **The letter page.** It shows a kept letter's picture after its words, with the parent's own words about it and a typed place. Both are optional, capped at 140 and 60, and never filled in.
- **The author's controls.**
  - Add a photo.
  - Change it: it asks first, and the first stays until confirmed, then Undo for 10 s.
  - Take it off, with Undo for 10 s.
  - `attach.ts` is given the letter's id and nothing else, so it cannot touch words, transcript, edits or recording.
- **Missing or failed.** A missing file reads "Not on this phone any more" with Remove. A picture that was not stored is said once, above Add.
- **Review.** It uses the same controls for the draft: the Home pick is stored with the draft when Review opens, and Keep moves it.
- **Listen.** Let it go removes a draft's picture, the file and then the row.
- **A let-go draft takes its picture at once** (c12e13ff; #835 reviews A N1 and B note 1, ADR 0028 D5). This is the first slice where a draft holds a stored picture: `review-photo.tsx` adopts the pending picture to the draft when Review opens.
  - `store.finishDiscard` and `store.deleteDraft` now remove the draft's picture first, file then row, through `erasePictureOf`:
    - `finishDiscard` is Let it go's last step, which Review's Let it go, Listen's Discard and the launch sweep all run;
    - `deleteDraft` is Write's emptied draft.
  - `capture/erase.ts` hands the eraser to the store when it loads, which the launch sweep does at every start, so the store loads no photo code.
  - A picture file that will not go keeps the draft marked for the launch sweep, as a recording does (BL-924). A draft not marked for Let it go loses nothing.
  - Before, Review's Let it go left the picture on the phone, and in the iPhone backup, until the next cold launch. Listen's separate `dropDraftPicture` call, and the helper, are gone.
  - Test (`erase-all.test.ts`): the Let it go steps and `deleteDraft` take the picture at once. It fails with the eraser not handed in.
- **The words fields count characters a person sees** (2d3994e7, BL-957).
  - The letter page's words and place fields lose `maxLength`, which counted UTF-16 units: it stopped a Devanagari or emoji writer well short of 140 characters and could cut one in half.
  - `editPhotoWords` keeps 140 and 60 characters through 3b's cap, which is now the one limit.
  - Test: the page has no `maxLength`, and 141 Devanagari "ki" and 61 emoji families are kept as 140 and 60. It fails on the old page.
- **One guard** (c0e4e1af and 4df391c0, review N3 on #841). `photoUri` now goes through 3a's `storedPhotoFile`. An id that cannot make a stored name gives no uri, and the frame shows the picture as missing. Its test fails on the old `photoUri`.

### Words
These use design spec 01 section 9's slot names, each marked TODO(founder):
- `book.letter.addPhoto`, `changePhoto`, `replacePhotoAsk` (question, body, confirm, keep) and `replacePhotoUndo`;
- `book.letter.removePhoto`, `removed`, `undo`, `notSaved`, `missing` and `missingRemove`;
- `text.*`.

### R25
A "Not much today" mark has no words, so the page draws no photo control and an attach returns `needs_words` with 0 files written. The test is in this slice.

### Rows
NS-01-R7, R8, R9, R16, R17, R19, R21, R25.

### Tests
- 11 new in mobile:
  - `photos-capture` (6): replace with confirm and Undo, words byte-identical, the quiet day;
  - `photos-device` (4): word edits, the not-saved line, Review's pick;
  - `photos-surfaces` (1): the switch.
- 1 new in content.

### Flag-off proof
`[NS-01-R19] off, the letter page and Review draw no photo control`.

### Reviewer notes
- The replace confirm is an iOS Alert whose Keep button uses the cancel style, which iOS shows bold. Spec 01 section 9 asks for two buttons of equal weight.
- `replacePhotoAsk.body` goes beyond the spec's "one question". It is kept from #796.

### Not verified
On a device: the 10 s Undo toast, VoiceOver and AX5.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 533 changed lines in 17 files against the 400-line, 20-file limit, not counting the lockfile and the generated `licences.json`. 355 lines are code and 178 are tests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

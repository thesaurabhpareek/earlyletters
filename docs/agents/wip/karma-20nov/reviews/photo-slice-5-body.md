## Photo with a letter, slice 5: the Book's Photos lens as letter cards (BL-931)

**Base:** `feat/mobile-photo-4c-letter-page`. **Branch:** `feat/mobile-photo-5-lens`. Split from #796 (8a026397). When this is open, #796 can close with pointers to the eight branches.

### What and why
- **The switch.** The Book header gains a Months / Photos switch after #764's arrival line, as 8a026397 resolved it.
  - It shows only while a kept, open letter has a picture.
  - A quiet day, a private letter, a deleted letter and a closed seal do not count.
  - Otherwise it is absent, with no empty state and no hint.
- **The Photos page.** It shows the Book's own chapters under its own month openers, newest first, keeping only the letters with a picture. Each is the Book's LetterCard with a 72 pt thumbnail leading its words, or above them at accessibility sizes.
- **VoiceOver.** The thumbnail is hidden. The card reads its own label, then the photo label.
- **What it never shows.** No count, no add control, no grid.
- **The change from #796.** #796 drew a 3-column grid of bare tiles. Design spec 01 section 5.1 withdrew it for letter cards, because a VoiceOver user could not tell which letter a bare tile opens; NS-01-R11 asks for cards too.
  - `LetterCard` takes an optional `photo` (thumbnail and label) and draws exactly as before without one.

### Words
`book.lens.months` and `book.lens.photos`, marked TODO(founder).

### Rows
NS-01-R9, R10, R11, R12, R19, R23.

### Tests
- 7 new in mobile:
  - `photos-capture` (3): the lens over the Book's chapters, no total, the quiet disappearance;
  - `photos-surfaces` (3): the Book's imports, the empty button, the switch;
  - `photos-device` (1): every surface asks for the pause.
- 2 new in content.

### Flag-off proof
`[NS-01-R19] off, the Book draws no lens row and no Photos page`.

### Not verified
The cards at AX5 and in dark mode on a device.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
11 files, 269 changed lines (185 code, 84 tests), not counting the lockfile and the generated `licences.json`. Within the limit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

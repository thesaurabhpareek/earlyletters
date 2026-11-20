Agent: mobile
Mode: task BL-931
Satisfies: NS-01-R2, R4 to R6, R15, R17, R21; BL-957 (the app limit half)
Data classes touched: C (the parent's words and place about a picture, the stored copy), phone only

## Photo with a letter, slice 3b: the stored copy (BL-931)

**Both reviews must be redone at the final head.** This round changes how the words and place are capped and merges 3a's new head (with develop).

### This round: the caps count characters a person sees (BL-957)
- `text.ts` caps the parent's words at 140 and the place at 60 grapheme clusters, keeping whole clusters only. It uses Intl.Segmenter where the engine has one, and on Hermes, which has none (ADR 0014), the small fallback rule: a base character with its marks and skin tones, joined across a ZWJ or an Indic virama, and a flag's pair.
- Migration 11's CHECKs (3a) are ceilings of 8 code points per character. A character can be longer (a family with skin tones is 11), so the cut also stops before the ceiling: the store never refuses what the app kept.
- This replaces last round's code-point cap. That cap fitted the old 140 and 60 CHECKs, but it was not the product limit.
- Kept small on purpose: BL-957 (wave 2) moves one grapheme helper into `packages/core`, and this one goes then.

### This round: room for a picture is its size plus 50 MB (NS-01-R45, 293a8006)
- `commitPhoto` stores a copy only when the phone has free the copy's size plus 50 MB (`PHOTO_FREE_MARGIN_BYTES`, 50 x 1024 x 1024), as the locked card's R45 asks. The old check was twice the size.
- Below that, nothing is written, the letter is kept, and the result is `no_space`.
- Handoff #900 from ops.
- Test `[NS-01-R45] a picture needs room plus 50 MB`: one byte short gives `no_space` with 0 files and 0 rows, and exactly enough is stored. It fails on the old check.
- Test (`photos-device.test.ts`): at the limit and one over, for a Devanagari conjunct, Devanagari "ki", a decomposed accent, an emoji ZWJ family and a flag, with Intl.Segmenter and with it removed. Every kept value goes through the real SQLite store and its CHECK, and 140 skin-toned families stop at the ceiling. The test fails on the old code-point cap.

**Base:** `feat/mobile-photo-3-store`. **Branch:** `feat/mobile-photo-3b-stored-copy`. Split from #796 (8a026397).

### What and why
- **The strip.** `strip.ts` removes the Exif, XMP, IPTC, MPF and comment segments and the JFIF thumbnail. It keeps the pixels and the colour profile, and stops at the first end-of-image marker.
- **The pick and the commit.** `session.ts` holds three things:
  - the in-memory pick, which keeps the uri only and never a Live Photo's video;
  - `runPick`, over a picker port that has no permission method;
  - `commitPhoto`, the one place a picture file and its row are made. It needs words for a kept letter and routes a turned picture or a HEIC to the native re-encode. It refuses anything that still carries metadata and checks free space. On any failure it leaves 0 files, with the first picture in place.
- **The parent's words.** `text.ts` caps the parent's words at 140 and a typed place at 60, and never fills either in.
- **Why separate.** It is split from slice 3 for size.

### From #835's reviews at f55be7b8 (Karma: in this slice, so #835 stands)
- **Behavioural erase tests** (7a785681; review A N3, review B note 2). Three source scans that a mutant passed are replaced by tests on `erase-all.test.ts`'s harness, with the real erase, launch sweep and store over the disk stand-in and SQLite. Review B's probe was the model. Each test is red against its mutant:
  - Erase now on a letter, a letter erased on another phone, and Erase now on a book take their pictures, file then row, and the launch sweep empties the picker cache. Red with the eraser call commented out.
  - Erase everything removes the photos folder itself and both caches, even when no row eraser touches a picture. Red with the folder delete dropped.
  - Keep moves a draft's picture inside the letter's own transaction: a failed letter write or a failed move leaves the picture the draft's and no letter. Red with the move before or after the transaction.

  The eraser test's title (`photos-phone.test.ts:99`) now says what it checks.
- **An unknown owner is refused** (25160fa3; review A N4, DQ-R07). `entryMediaStore.put` throws `PhotoOwnerUnknown` (`photo_owner_unknown`) and writes nothing when the owner is neither a letter nor a draft. `commitPhoto` already turns that into `failed` with no file left.
- **Small fixes** (58921fc5). erase-everything imports the two cache folder names, and the sweep.ts comment no longer says the photo code loads on demand.
- **The inventory moved out** (f84924a7, then e34e696b). This slice first added the data-policy 4.4 and DATA_CLASSIFICATION 4.5 rows. `docs/legal/**` is the founder's merge (D-125, D-132; #836 review B note 3), so they now live on `docs/photo-inventory-rows`, a founder PR with both #836 reviews' corrections, and this slice is code-only again.

### From #836's reviews at 4596b3c1 (both pass with notes; Karma: in this slice)
- **The caps** (dbdf1943): first counted in code points to fit the old CHECKs; superseded this round by grapheme counting under BL-957 (above).
- **The guard reads metadata, not pictures** (dbdf1943; review A N2).
  - `carriesMetadata` searches only marker segments (in the headers and between scans) and anything after the end marker, never the compressed data, so a clean picture is never refused by chance.
  - An Exif signature in any kept segment still refuses it.
  - Test: a random-data scan holding 8BIM and MPF is stored, while Exif text in a JPGn segment is refused (review B Q5, which keeps M11 red).
- **A failed commit never throws** (dbdf1943; review A N5). It takes back only a row it wrote. If that fails too (an owner gone, a full database), the earlier row and file stay. Test: both cases return `failed` and keep the first picture.
- **The surviving mutants are red now** (11c336e3):
  - The 30 day purge and the day-30 book purge take their pictures in the purge itself, asserted before the photo sweep can tidy up (M3).
  - A picture file that will not go keeps its row and letter (M9).
  - M11 is covered by the guard test above.
  - Review B's script confirms M3, M9, M11, M12 and M14 all red.
- **Migration 11's level comments** (14239a08) follow privacy's ruling: `entry_id` and `draft_id` L3, `bytes` L2, `kind` and `ext` L2. This is a comment only.
- **Smaller:**
  - The capture test header says what the file holds.
  - The fixed 50 ms wait is now `vi.waitFor`.
  - commitPhoto's comment says a replaced picture's file stays for Undo and goes at the latest at the next launch (review A N4).
- **Left as written notes:**
  - The strip keeps non-APP marker segments and the ICC header as they are (review B note 4: an allowlist would be stronger).
  - The NS-01-R15 test pins the mapper only (#835's P9 is the end-to-end shape).
  - Sweep and commit stay in step only because the row follows the file in the same tick (review A N8).
  - Let it go with a picture is wired in 4c (#839, c12e13ff), the first slice where a draft holds one.

### Rows
NS-01-R2, R4, R5, R6, R15, R17, R21; NX-39-R2, R8, R12 to R14, R33; C8.

### Tests
31 new, and the 3 source scans they replace are gone (the first count, 22, missed 4):
- `photos-capture` (15) and `photos-c8` (4): 10 fixtures carrying location, date, device and thumbnail segments, and 0 stored copies carry any.
- `photos-surfaces` (2): sync sends `photo_path` null.
- `photos-device` (4): a draft's picture needs no words, put refusing an unknown owner, the caps against the real store, a commit failure that never throws.
- `photos-capture` (1 more): the guard reads marker segments only.
- `erase-all` (5): every erase path takes the picture, Erase everything's folder, Keep inside its transaction, the 30 day purges, and the file-before-row order.

### Flag-off proof
No screen and no caller in `src` yet: slice 4a's pending picture is the first. `[NS-01-R4]` shows that backing out writes 0 rows and 0 files.

### Not verified
The ten fixtures through the real ImageIO step on a device.

### Stack and merge
Eight stacked PRs from #796, as reworked after Karma's ruling of 20 Nov 2026. Slice 1 (#833) closed with its picker package, and 2b is new:
- 2 (#834, on `develop`), 2b (#841), 2c (#842), 3a (#835, now on 2c), 3b (#836), 4a (#837), 4b (#838), 4c (#839), 5 (#840).
- Each targets the slice below it, so its diff is only its own. Each branch merged the reworked slice below: merge commits, no force push.
- When the slice below merges, this PR is retargeted to `develop` and `develop` is merged in.
- Two counted reviews at that final head and green required CI, plus the macOS store-profile Release launch, then Karma merges under D-132.
- Everything is behind `EXPO_PUBLIC_PHOTOS`, which is off in every profile.

### Size (CODE-R02)
Size exception: 1018 changed lines in 17 files against the 400-line, 20-file limit, not counting the lockfile and the generated `licences.json`. 413 lines are code and 605 are tests: the review rounds added about 310, mostly tests that each fail on the old code. The legal rows are no longer here.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

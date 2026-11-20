## The photos folder and entry_media in the data inventory (BL-931, ADR 0028 D1)

**Base:** `develop`. **Branch:** `docs/photo-inventory-rows`. **Merge: the founder.** `docs/legal/**` is not delegated (D-125, D-132), so this PR is the founder's to merge, not Karma's. Docs only: two files, no code.

### Why a separate PR
DATA-REQ-001 asks that every device store be in `docs/legal/data-policy.md` section 4 in the PR that first writes it, and ADR 0028 D1 gives the row. The photo stack's first writer is slice 3b (#836). That PR first carried these rows. #836's review B (note 3) pointed out that legal files need the founder's merge, so the rows moved here, and #836 is code-only again.

### What
- **data-policy.md section 4.4, Devices.**
  - One new row: the pictures (`Library/Application Support/photos/<media_id>.jpg`, the stripped copy) and their `entry_media` rows, class C.
  - The iOS device backup row gains a separate clause for pictures.
- **DATA_CLASSIFICATION.md section 4.5:** the `entry_media` table, column by column, at the levels `privacy` ruled (section 4 owner, review B on #836).
- **DATA_CLASSIFICATION.md section 4.6:**
  - the photos folder, and the two picker caches (`Caches/ImagePicker`, the original with its location, and `Caches/ScribePhoto`), all L4;
  - the older "Photos, cached book audio of other members" row now reads "Synced photos (planned)", so it is not taken for these pictures, which never come from the server.

### The levels (privacy's ruling, #836 review B)
- `id`, `width`, `height` and `added_at` are L2.
- `entry_id` and `draft_id` are L3. They hold letter and draft ids, as `entries.id` and `drafts.id` do (rule 1.1.5). This corrects the earlier L2.
- `bytes` is L2, as `audio_bytes`.
- `kind` and `ext` are L2: they are enums, as `entries.kind` is.
- `sha256`, `photo_text` and `place` are L4.
- The picture file and both caches are C and L4.

Migration 11's comment carries the same levels: corrected in slice 3b (#836, 14239a08), a comment only.

### Open items, stated as open (CR-62)
- **Owner backup (CR-62 item 6):** "not in the owner backup in Build 13 (ADR 0028 Q4 default; open for the founder, CR-62 item 6)". That is true of the code: the owner backup reads audio columns only.
- **iPhone backup (CR-62 item 7):** "Pictures kept with letters are included too, as built (NX-39 F9 default; the founder's to change, CR-62 item 7; no parent-facing line says so yet, CR-62 item 4)". These are review B's words.
- **Export (CR-62 item 3):**
  - "The book export carries no picture yet (BL-933)". The export writes `photos: 0` today.
  - The recovery export carries the rows inside the database file, but no picture file.

### Other wording, from both reviews on #836
- **Retention** names every erase path:
  - Erase now on the letter or its book;
  - the 30 day purge;
  - an erase on another phone of the author;
  - a let-go draft;
  - Erase everything;
  - deleting the app.
- **A replaced picture:** its file stays for Undo, and goes at the latest at the next launch.
- **No more "privacy confirms" tails.** The levels are ruled, and nothing is left flagged.

### What the rows describe
The rows describe the photo stack as built, #834 to #840, which is behind `EXPO_PUBLIC_PHOTOS`. A let-go draft loses its picture at once from slice 4c (#839, c12e13ff). Until #839 merges, it goes at the next launch's sweep. The picker original is read once and removed from slice 4a (#837). Nothing on develop writes a picture before #836.

### Not changed here
- The parent-facing lines that must mention pictures before the switch is on anywhere. These are for `content`, and counsel reads them; ADR 0028 D1 and #835 review B note 7 list them.
- DATA_CLASSIFICATION 4.5's heading, which still says schema version 4.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF

## Review B at b4240805a711f700ad336b27ab985c335d626d01: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: identity and security (chapters 05 IAM, 06 SEC). Diff: `docs/adr/0028-photo-seal-find-on-device-data.md` (11 lines added, 9 removed) and the check-in file. Head committed 05:50:16 UTC, read again live at 11:10 UTC (unchanged). CI on the head: complete. Ten checks pass. Two duplicate `compliance-fence` runs were cancelled, and their sibling run passed.

Must fix: none.

## What I checked
Facts. I sampled 17 cites. All hold:
- `DATA_CLASSIFICATION.md` at `20553b18`: `:47` (L2 covers internal ids of non-person records), `:53` (rule 1), `:57` (rule 5, including its second sentence on version ids), `:275-276` (`entry_versions` id L2, entry_id L3) and `:639` (`drafts.id` "Future letter id" L3).
- CR-62 at `RULINGS.md:570-592`, which accepts the ADR at `1bee878b` and closes Q9.
- `1bee878b` and `e9dca86c` are identical for the ADR (diff empty), and `e9dca86c` is on `develop`.
- NS-36-R4 at `11-foundations.md:678`; X10 at `16-council-review-round-2.md:78`.
- NS-01 section 11 (`01-photo-with-a-letter.md:255-256, 259`) and NS-02 section 11 (`02-find.md:202-203`).
- BL-959 at `BACKLOG.md:3776-3780` at the lock head.
- #835 `migrations.ts:438-439` still says L2; #836 `3395e5a6` says L3.
- `adopt.ts:12-16` passes one `ownerId` for a draft and its letter (at `apps/mobile/src/lib/photos/adopt.ts` on #837).
- Privacy's ruling on #836 (comment 7031015653).

Lens: is any id classed below what it reveals?
- `entry_media.entry_id` and `letter_search_rows.entry_id` at L3: correct. They are letter ids (rule 5).
- `entry_media.draft_id` at L3: correct. A draft keeps its id when it becomes a letter.
- `entry_media.id` (media id) at L2: correct on what it reveals.
  - It is a UUIDv7, so it carries the moment the picture was added to the millisecond. `added_at` already holds that at L2.
  - It reaches a letter only through the L3 columns on the phone. It never reaches the server (NS-01-R15).
  - It appears in the export only under `photos/<entry_id>/`, a path that is L3 anyway because it contains a letter id.
  - The card puts it at L2 (`01-photo-with-a-letter.md:255`), so the card wins (CR-66).
- `letter_search_rows.row_id` at L2: correct. It is an integer map key on the phone only, and at most shows indexing order.
- `sha256` stays L4 (rule 2). The seal columns stay L4 (CR-62).

Did the change alter any decision?
- D1 location, D2 export, D3 and D3a seal, D4 index lifecycle and D5 erasers are unchanged.
- The review gate sentence (red-team, `approve-migration`, D-041) is kept on the status line.
- The scope note correctly leaves the B10.1, CP1 and CK3 items for rulings.

## Findings (most serious first)
1. "No decision changed" (`:3`, `:9`) is slightly too broad. The D1 Class bullet sits under "Decisions inside it", and its levels change for three columns. Suggested wording: "no decision changed except the D1 and D4 Class levels, brought into line with rule 5". Raising them is a tightening with no access or storage effect: letter ids are L3 everywhere else, so no new rule applies.
2. The status line against CR-62. CR-62's last bullet says the ADR "merges with its status as Proposed, as 0025 and 0026 did". Changing the status to "Accepted under CR-62" matches what CR-62 decided, but not that sentence. Karma should say whether status lines now follow acceptance, so 0025 and 0026 do not stay inconsistent. This needs no ruling of its own.
3. Card gap, outside this PR, for product. NS-01 section 11 classes the "Photo not saved" mark as "L2 (letter id only)" (`01-photo-with-a-letter.md:259` area). A letter id is L3 by rule 5. It lives in memory and is never logged, so the risk is low, but the level is wrong.
4. The card allows the media id in logs ("ids only, never with a path"). NSC-06 closed error codes carry no value. I recommend no id at all in a photo error code, so nobody can join a log to a file name.
5. The asked `qa` check (`:222`): "a letter, draft, book or person id below L3" fails, while a record's own id may be L2. That is the right shape. List the allowed L2 ids by name, so the check stays a positive allowlist.
6. Pre-existing and not in this diff: the D1 table gives `bytes` L1, while the Class bullet says "sizes are L2". Privacy's OQ-P2 is handling it.
7. Format: ASCII, marked [A4], no copied card text.

## Not verified
- Docs only. Nothing was run.
- I did not open #836's full diff beyond `migrations.ts:436-442`.

Reviewer: independent of the author (CR-44).

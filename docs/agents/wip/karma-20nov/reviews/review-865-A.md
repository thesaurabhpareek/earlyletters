## Review A at b4240805a711f700ad336b27ab985c335d626d01: PASS WITH NOTES
<!-- agent:data-steward -->
Must fix: none.

Lens A, data lens. Files: `docs/adr/0028-photo-seal-find-on-device-data.md` (+10 -9) and `docs/agents/checkins/data-architect-bl-959.md` (1 line). CI at this head: every check completed green (compliance-fence has one cancelled duplicate and one success). Head is from 05:50 UTC, well over 10 minutes old.

### What I checked
- Each id against `DATA_CLASSIFICATION.md` section 1.1 on `develop` 20553b18 (all lines read):
  - `entry_media.entry_id`: L3 by rule 5 (`:57`). Correct.
  - `entry_media.draft_id`: L3. Correct: a draft keeps its id as a letter; `drafts.id` is listed L3 "Future letter id" at `:639`.
  - `letter_search_rows.entry_id`: L3 by rule 5. Correct.
  - `entry_media.id`: L2 by rule 5's second sentence and the L2 meaning (`:47`), with the `entry_versions` precedent (`:275-276`). Correct; rule 1 (`:53`) does not raise it.
  - `letter_search_rows.row_id`: L2. Correct.
- The locked cards at 450bcb4a: NS-36-R4 (`11-foundations.md:678`) names exactly these three ids at L3. NS-01 section 11 (`01-photo-with-a-letter.md:255-256`) has media id L2 and letter and draft ids L3. NS-02 section 11 (`02-find.md:202-203`) has `entry_id` L3 and `row_id` L2. The ADR now matches all three.
- Facts:
  - #835 f55be7b8 `migrations.ts:438-439` still says L2; #836 3395e5a6 says L3. Holds.
  - ADR at `1bee878b` equals `e9dca86c` (#797) equals `develop` (empty diff). Holds.
  - CR-62 is at RULINGS `:570-592`. Holds.
  - BL-959's scope is ids only (`BACKLOG.md:3776-3780` at 450bcb4a). Holds.
  - `data-and-sync.md:111` gives BL-959 three more items, and L11 says "ids L3" (`:39`). Both hold.
  - #836 writes `kind`, `ext`, `bytes` as L2. Holds.
  - 14 of 14 cites checked hold.
- No decision changed. The diff touches only the status line, the [A4] amendment line and label, the D1 note, two table levels, the D1 Class bullet, the D4 Class line, the `qa` test request and Sources. D1 to D6 and Q1 to Q10 keep their wording.
- Conflicts list: right and complete for ids.
  - Media id: the card wins over the "ids L3" wording in `data-and-sync.md` L11 and the `11-foundations.md` design.
  - `kind`, `ext`, `bytes`: rightly left to `privacy` (OQ-P2).
  - Scope note and #836 half: both accurate.
- No `supabase/**` or `docs/legal/**` touched, so no `approve-migration` is needed. ASCII only.

### Findings (notes)
1. CR-62's last paragraph says 0028 "merges with its status as Proposed, as 0025 and 0026 did ... this entry is its acceptance record". This PR's "Accepted under CR-62" departs from that convention; 0025 and 0026 still say Proposed. It is the task Karma set, and it makes NS-36-R4's "after its counted reviews" readable from the ADR. Record the convention change in a ruling or the PR body so 0025 and 0026 are not left inconsistent by accident.
2. Outside this ADR, for product: NS-01 section 11 classes the in-memory "Photo not saved" mark "L2 (letter id only)" (`01-photo-with-a-letter.md:260`). By rule 5 a letter id is L3. It is memory only, but the card row contradicts the rule this PR applies.
3. The `qa` request (ADR `:222`) now says what the phone class-label check must allow: a record's own id at L2. That matches `data-and-sync.md` T3 once its L11 row is corrected (my note 7 on #860).

### Not verified
- `privacy`'s #836 ruling (comment 7031015653).
- The eval C s4.2 item 3 and `privacy.md` 4.1 claims in the Conflicts list (other branches).
- I ran no test (docs only).

Reviewer: independent of the author (CR-44).

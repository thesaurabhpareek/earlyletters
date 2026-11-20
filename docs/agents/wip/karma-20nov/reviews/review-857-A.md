## Review A at b60a0687228a048be04da28075a4ae3eb992ce44: PASS WITH NOTES
<!-- agent:data-steward -->
Must fix: none.

Lens A (correctness and buildability), read with the data lens (chapters 03 and 04). Files: `docs/tdd/new-scope/architecture.md` (210 lines) and `docs/tdd/new-scope/README.md` (40 lines). Round 2, at b60a0687 (head committed 11:15:34 UTC; final as of 11:30 UTC). I read the diff from 575fc607; `architecture.md` is still 210 lines and ASCII only. CI at this head: all nine checks completed green.

### What changed since 575fc607, checked
- 2.2 item 2, AC-16 and AR-1: a narrowing group (`seal`, and `words_withheld` if S3 is ever ruled) is never dropped; the whole op for that letter waits until the server advertises the group. This fails closed, like today's `22023` (`sync_v1_server.sql:1031-1032`, holds). The negative test (a sealed letter sends nothing, then goes whole and sealed once `seal` is advertised; NS-06-B8) is right for the data lens: words can no longer go up unsealed. The claim that `in_book` is the only narrowing group today and every v1 server accepts it holds (`FIELD_GROUPS`, `sync.ts:94`).
- AC-15: `p_api_version` is never an access input, and the update screen never blocks local use (`remote-config.ts:98` says exactly that). Holds.
- AX-12: the cancel-on-hide rule cites NS-32-R12 (P0, `11-foundations.md:106` at 450bcb4a), `app-lock-layer.tsx:80` (`accessibilityViewIsModal`) and `_layout.tsx:241-242` (nothing under the cover unmounts). All hold.
- AX-4 now records that CR-67 wins. AX-16 now takes CR-67's 367 lines (closes my old note 5). AX-17 notes that `security.md` still owes B8 to B10.
- New cites: 6 of 6 hold. Running total: 46 of 48.

### What I checked
- Facts: 42 cites sampled against `develop` 20553b18, #835 f55be7b8, #836 3395e5a6 and eval A at 6c011919. 40 hold. Held, among others: `sync.ts:23, 45-51, 94-104, 191, 201, 263-267, 959-963`; `remote-config.ts:99` with no `minSupportedVersion` read in `apps/mobile/src`; `sync_v1_server.sql:1031-1032, 1119, 506-507, 722, 550-566`; `envelope.ts:194, 225`; `outbox.ts:278-280, 772-779`; `types.ts:9-12, 51`; `engine.ts:241`; `merge.ts:487-499, 622-643`; `migrations.ts` 451-467 and `migrations.test.ts:136, 143, 247`; `contract-drift.test.ts:93`; `kill-switches.ts:1-5, 39`; `export/schema.ts:7-8, 26-28, 90`; `capabilities.ts:186, 266`; `capabilities.test.ts:242`; `start-capture.ts:24`; `navigation-one-entry.test.ts:198, 234`; `erase-everything.ts:57`; `sweep.ts:56`; `_layout.tsx:194`; `global-errors.ts:49`; `eas.json` profiles; the five hotspot line counts (1,356, 1,317, 1,005, 940, 670); ADR 0028 `:88-110` (option (a), the purge worker); README code findings (`gate.logic.ts:110-125`, `ownership.ts:49`, `consent.ts:117`, `prefs.ts:115-117`, #835 `migrations.ts:460-461`). Two did not hold: notes 2 and 5 (5 is now closed).
- Boundaries: no founder or counsel question is decided, no date, no parent words (AP-5 keeps PROPOSED), no weakening of the constitution: AB-8 holds `raw_transcript` and routes S3 to a reading. Nothing new leaves the phone (AB-6).
- Cards (CR-66): AX-4 follows the cards over eval C; the card gaps are listed for product in section 7. No build against a card without a Conflict line found.
- CR-67 at 5a6ba2f3: compared line by line (notes 4 and 5).
- Data lens: AP-3 (local migrations), AP-6 (erase and export hooks), 2.1 key-present guard (`sync_v1_server.sql:1119`), AS-3 (one lane for `sync_pull` and `book_entries`), AR-5 (a re-grant reopens the view; `explicit_grants.test.mjs`). All match chapter 03 (DB-R08, DB-R13, DB-R25) and chapter 04 (DQ-R01).
- Format: ASCII only, both files under 400 lines, TDD 01 tags used, no copied card text.

### Findings (most serious first; all notes)
1. Still open for widening groups such as `first`: section 2.2 item 2 (`caps`) has no rule for keeping the dropped group's value. The narrowing case is now closed. "Keeps the local value for a later push" needs a mechanism. Once the trimmed op is acknowledged, the letter has no queued op, and `merge.ts:622-643` then writes the server's values over an own row whatever its version. So the next pull can wipe a Firsts mark the server never took. Rec: keep a residual op for the dropped group, held like an unadvertised op, and make the merge key-present for every new column. Add a test: the unadvertised group's local value survives a pull and is sent once `caps` lists the group. Today the only test is "a words edit queued with an unadvertised group is applied".
2. Still open: AX-13 lists H1 among "eval A's numbers". H1 is `data-and-sync.md`'s own id; CR-67 AX-13 at #856 4aee3dae now says so, and CR-67 wins until this file's next touch.
3. AP-3 says to clear `sync_books.cursor` "as a restore-epoch reset does". The restore-epoch code (`merge.ts:888-925`) also queues an `entry.reupload` of every own letter and re-sends held drafts. Say: clear `cursor` only (and `seal_watermark` at L13); no reupload and no epoch change. Otherwise a builder may copy the whole block.
4. AX-5 and AB-8 send the S3 reading to Karma. CR-67 AX-5 sends it to the founder, and CR-67 wins until this file's next touch. AB-8 also covers a phone-side move of `raw_transcript` (L15 in `data-and-sync.md`, moved into `withheld_words`). CR-67 names only S3. Keep AB-8's wider scope and ask Karma to align AX-5.
5. Closed at b60a0687: AX-16 now takes CR-67's ruling.
6. AX-3 cites "NS-06-A10" for the export minor. In the locked card that is the analytics row (`06-firsts-...md:105`); the export line sits in section A10 (`:164`). Write "NS-06 section A10" (AC-01 already writes "NS-06 A10"). The same applies to "NS-06 B10" in AC-04.
7. Data steward's own drift (not this PR's): chapter 03 DB-R09 still says `deploy-db.yml` does not exist (it does), and DB-R23 still names `server_seq` and `book_access` while the code uses `sync_xid` and `book_entries`. I will fix this in my own docs PR, beside the chapter 02 drift that section 7 names.

### Buildability
2.2, AP-3 and AP-6 name owners, files and tests. The architecture file has no wave-1 or wave-2 PR breakdown of its own; `data-and-sync.md` section 3.6 carries it. The one test gap is note 1.

### Not verified
- That `caps` fits the `sync_pull` budget.
- Writing Tools on iOS 17 and 18.
- Whether Caches sits outside the iPhone backup.
- The `security.md`, `privacy.md`, `08`, `09` and `10` line cites (other PR branches; I spot-read only the `11-foundations.md` length).
- I ran no test.

Reviewer: independent of the author (CR-44).

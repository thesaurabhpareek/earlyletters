## Review A at 4aee3dae522ca10f8498c0e0b012acaecd97b3d7: PASS WITH NOTES
<!-- agent:data-steward -->
Must fix: none.

Round 3. The one must-fix from my review at 5a6ba2f3 is closed. CR-67 AX-13 now reads "eval A's (L11 to L15, S1 to S5), plus H1, the hooks refactor, which is `data-and-sync.md`'s own id (eval A has none)". That matches eval A at 6c011919 (no "H1") and `data-and-sync.md:6`. The diff from 5a6ba2f3 changes only that line.

Lens A, the facts behind each line, data lens. I reviewed round 2 at 5a6ba2f3 and round 3 at 4aee3dae, and read both diffs. CI at 4aee3dae: all ten checks completed green. The head was committed at 11:14:49 UTC and is final as of 11:25 UTC.

### What I checked (each line against `architecture.md` section 5 at 575fc607, `data-and-sync.md` at ae358257, eval A to C at 6c011919, the locked cards at 450bcb4a, and code on `develop` 20553b18)
- AX-2 holds. ADR 0028 D3 (`:88-110`) is option (a), run by the purge worker (`:101`). Eval A s2.3 has the four corrections. CK10's reasoning holds: the window must read the same clock as the `book_entries` clause. Its Postgres timing claim is an Assumption in the design.
- AX-3 holds as a fact: ADR 0028 `:75, 102, 148` put the seal at 1.8.0. But the line does not deal with a P0 card row (note 1).
- AX-4 (round 2) holds: `kill-switches.ts:1-5` says "each one only stops a server-dependent feature" and keeps the never-list (LEGAL-REQ-040). `photos` is a key at `:16`, and no build reads `killSwitches.photos`.
- AX-5 holds: `held_drafts_stamp` refuses a change at `sync_v1_server.sql:506-507`, and `held_upsert` keeps the words on a null push at `:722`. Wording and scope: note 2.
- AX-6 holds: `merge.ts:622-643` takes the server values for an own row with no queued op; `sync_books.cursor` exists (`migrations.ts:228-230`); a full cursor reset has precedent (`merge.ts:918`). Note 3.
- AX-13 holds at 4aee3dae (it was the must-fix at 5a6ba2f3).
- AX-14 holds: ADR 0028 D3a has three columns and `SCSEL` (`:99`); eval C `:38` names `seal_opens_at` and `sealed_until`; eval C `:288` offers reusing `22023`.
- AX-15 and AX-16: `11-foundations.md` is 367 lines at #864 b46f2e75, so CR-67 is right and `architecture.md`'s 501 is stale.
- D1 holds: held ops already wait for the server's `held` section (`outbox.ts:772-779`); `lib/billing/status-report.ts:28` imports from `@scribe/api/server` (a type). Design gap: note 4.
- D9 holds: CODE-R02 (`01-code-and-change.md:31`) leaves size exceptions to the founder.
- Also held: AX-12's NS-10-R3 code facts (`ownership.ts:49`, `gate.logic.ts:110-125`).
- CR-66 round 2: the ranking is clear. `docs/product/prd/18-errata-after-lock.md` exists on no branch or PR I listed (note 5).
- Format: ASCII only in the added lines.

### Findings (notes, most serious first)
1. AX-3 contradicts NS-36-R5 (P0, `11-foundations.md` at 450bcb4a), which fixes "seal fields arrive in 1.8.0". NS-06-B5 and section A10 already allow "the next free minor". Under round-2 CR-66, a founder-approved card wins on scope. Have AX-3 send NS-36-R5 to the errata file (or product), as `architecture.md` section 7 and eval A s8 item 5 ask. Otherwise a 1.9.0 seal export fails a P0 row as written.
2. AX-5 says "the server sets `raw_transcript` to null". S3 changes `held_drafts.raw_transcript` (the held copy), never `entries`; say so. The founder's reading should also cover L15, which moves the phone's `raw_transcript` into `withheld_words` (`architecture.md` AB-8; eval A s2.2). `data-and-sync.md` OQ-K2 still names Karma.
3. AX-6: say "clear `sync_books.cursor` (and `seal_watermark` at L13) only". The restore-epoch block around `merge.ts:918` also queues a reupload of every own letter, which an upgrade must not do.
4. D1: dropping an unadvertised group needs a rule that keeps its value. Without one, `merge.ts:622-643` overwrites the local value at the next pull once the trimmed op is acknowledged. I raised this on #857 (note 1). D1 can stand, but the ADR 0025 amendment should carry that test.
5. CR-66 cites `docs/product/prd/18-errata-after-lock.md`, which does not exist yet. Say who creates it and where, or cite it as planned.
6. AX-2: the ADR 0028 amendment that records option (b) changes D3, which CR-62 accepted. That is fine under CR-66 (NS-06 B10.1's default is (b)). The amendment PR should cite CR-67 AX-2 as its authority. #865 (BL-959) rightly does not carry it.

### Not verified
- Postgres `now()` against `statement_timestamp()` under PostgREST.
- The `security.md`, `08`, `09` and `10` cites behind AX-1, AX-7 to AX-12 and AX-17 (outside my lens; spot-read only).
- I ran no test.

Reviewer: independent of the author (CR-44).

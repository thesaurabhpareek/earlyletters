# Data and sync for the locked pack v1.0 (NS-01 to NS-37): phone schema, server, sync contract, inventory, export, erase

Status: design for review, 20 Nov 2026. Author: `data-architect` (Claude session). Target `docs/tdd/new-scope/data-and-sync.md`; Karma assembles the PR. Docs only: no migration, test or contract is written here, nothing is applied anywhere, and no agent applies a migration to a hosted project or reads production data (D-041, DB-R09).
Sources: locked pack `docs/prd-lock-v1-20nov` at `450bcb4a` (#846; head unchanged when read) with its backlog rows BL-952 to BL-987; develop `d5d12178`; #847 (`17-engineering-project-plan.md`); PR heads #835 `f55be7b8`, #836 `4596b3c1`, #798 `7f36031a`. Every `file:line` is at develop `d5d12178` unless a head is named.
Input adopted: "eval A" is `docs/engineering/eval-20nov/A-data-and-sync.md` on `docs/eng-eval-20nov` at `6c011919` (the product thread's `data-architect` evaluation of the same pack). Where it settles a point this file cites "eval A s<section>" and does not repeat it; where this file disagrees, a Conflict line names both sources and is listed under For Karma (section 10).
Tags as in TDD 01: Fact, Assumption, Rec, Risk, OQ (owner, default), Conflict, Unverified. Ids are stable so the mobile designs 08, 09 and 10 can cite them: L11 to L15 phone migrations and S1 to S5 server migrations use eval A's numbers (s1.2, s1.4); H1 is this file's hook refactor; C1 to C8 contract changes; K1 to K11 settings keys and F1 to F3 files; T1 to T3 tests; E1 to E3 export minors.
Depth: section 2 registers every data change once so designs can cite it; per-card text follows the brief's depth by wave (waves 1 and 2 in section 3, wave 3 in section 4, waves 4 and 5 and unscheduled cards one paragraph each in section 5).

## 0. What matters most

1. Fact: in waves 1 to 3 only S1 (photo write-deny, ADR 0028 D6) changes the server; NS-01-R61 makes it P0 before `EXPO_PUBLIC_PHOTOS` is on in `production`. BL-870 (`docs/BACKLOG.md:3414`, unchanged on the lock branch) says "No migration here", so S1 needs its own row (CP6).
2. Fact: the only phone migration before wave 4 is L11 (`entry_media`, #835), and it must change before merge: its CHECKs count code points, so a 140-grapheme caption is refused (eval A s0.1 item 4, s1.5).
3. Rec: B10.1 is decided as option (b), with eval A s2.3's four corrections plus a fifth (CK10): the watermark and the window must read the transaction time the `book_entries` clause reads, not `statement_timestamp()`, or an opening that falls between the two is lost for good.
4. Risk: every synced column (Firsts, seal) restates `sync_push` (354 lines) and `sync_pull` (358 lines) of `20261016000000:931, 1302`. Eval A s5 asks a size exception per PR; Rec: H1, a one-time hook refactor, so later column PRs stay small (CK9, OQ-K1).
5. Fact: since `20261023060000` nobody holds a grant on `book_entries` (`:50`, `:99`; `grants.mjs:5-11`); every view replace restates the revoke only (eval A s0.1 item 2; CK3).
6. Fact: `language` and `words_reviewed_at` are synced but absent from the content-consent tuple (`20261015030000:174-184`). T1 turns F12 into a test that fails on any such column unless it is a named exemption (OQ-P3).
7. F4: staging and production have never been migrated by CI; both dry runs failed on 11 Nov (runs 42976572128, 42973935354) and a staging run has waited for approval since 11 Nov (42983835990). Section 6 is the founder's checklist; eval A s0.1 item 9 leaves this open.
8. Fact: the history is sound on a fresh database: `db-cli.yml` run 44642662637 (20 Nov, CLI 2.119.0) passed "Rebuild from every migration" on all 31 files.
9. Risk: open #424 adds `20261031000000_compliance_gates.sql`, which sorts before develop's newest file `20261109000000`; it must be renamed on rebase (CK5).
10. Fact: the inventory home is stale (`DATA_CLASSIFICATION.md` 4.5 says local schema version 4; `data-policy.md` is 1.2.0). BL-960 brings it current before the first new row (X2, NS-36-R6).

## 1. Rules every data change follows

- Phone and server rules: eval A s1.2 (append-only, number at merge, levels in the comment, no CHECK on an added column) and s1.4 "Common to every file" (DB-R10, DB-R14, comments on view columns, APPLY section, red-team, `approve-migration`), adopted.
- Upgrade test for every L-migration: from the previous version with letters, drafts, agreements, `entry_media` and outbox rows, byte-identical after, nothing queued (eval A s6.2). Today #836 checks one letter and the outbox count (`photos-device.test.ts:179-188`): extend it before #835 merges.
- Timestamps: when written, after the newest file on develop (`20261109000000`) and in any open PR (#677 `20261109010000`); eval A's dates are placeholders (its s1.4). APPLY file number from `node scripts/agents/next-id.mjs`: 33 on 20 Nov.
- Grants: a table grant is a row in `grants.mjs` `GRANTS`; a `service_role` function a row in `SERVICE_ROLE_FUNCTIONS`; `authenticated` RPCs have no list today (eval A R9: `qa` adds `AUTHENTICATED_FUNCTIONS`); a new view fails `classification.test.mjs:51` until reviewed.
- F12 and NS-36-R11: a synced column joins the `entries_family_rules()` tuple and, unless author-only, `book_entries`, in the same migration; T1 enforces it.
- Server before flag: a phone that sends an unknown group gets `22023` for good (`20261016000000:1031-1033`), so each server migration reaches production before its flag is on outside the founder's family (eval A s2.1).
- The founder alone applies: staging by approving the `staging` run of `deploy-db.yml`, production by a `db-v*` tag on `main` and approving `db-production`; a PR then records the files in `.github/migrations-applied.txt` (DEPLOY.md "After a deploy").
- Export: the next free minor at merge (`export/schema.ts:7-10`; eval A s3). Inventory: rows in `data-policy.md` section 4 and `DATA_CLASSIFICATION.md` in the same PR; `docs/legal` is the founder's merge (D-125); `privacy` confirms classes.

## 2. The register (what designs cite)

### 2.1 Phone migrations (eval A s1.2, adopted)

| Id | Card, wave | Content (eval A s1.2 row) | Delta in this file |
|---|---|---|---|
| L11 | NS-01, wave 1 (#835, #836) | `entry_media`; CHECK ceilings `photo_text <= 1120`, `place <= 480` code points (s1.5); ids L3, `kind`, `ext`, `bytes` L2 | Ceilings 2240 and 960 as built at `39cf30d3` (`apps/mobile/src/lib/db/migrations.ts:462`; 1120 and 480 in eval A are superseded) [Amended 16-A-8]. The coupled `kind`/`ext` CHECK is not added: CR-69 A2 withdrew A-minimal, #835 merges as it is |
| NS-52 media [Amended 16-A-8, CR-69 A2] | NS-52, wave 5, after 1.0 | A new local migration after 11 rebuilds `entry_media` (drops the `searchable_letters` view first): drops the one-photo index, adds `position` L2 and `duration_ms` L2, two triggers | No L-number is written here: the number comes from merge order (CR-69 A11; the design's "L16" is not used) |
| L12 | NS-06 A, wave 4 (BL-968) | `entries` and `drafts` `first_mark` L3, `first_label` L4; no index until NS-06-A24 misses | none (my first draft proposed `entries_first_idx`; eval A's DB-R22 reading stands) |
| L13 | NS-06 B, wave 5 (BL-969, BL-970) | three seal columns L4, the draft pair, `entries_seal_idx`, `sync_books.seal_watermark` L2 | the watermark holds eval A's composite `"<instant>|<id>"` (C5) |
| L14 | NS-16, wave 5 (BL-980) | `drafts.author_signs_as` L3 | none |
| L15 | NS-17, wave 5 (no row yet, eval A R14) | `drafts.words_withheld`, `entries.words_withheld` L4 and table `withheld_words` | none (my first draft had a bare flag; eval A's separate table keeps the output out of every reader by construction) |

L13 to L15 take numbers in merge order (eval A s5).

### 2.2 Settings keys and files (eval A s1.3, adopted; ids for citation)

K1 `discard.failures.<draft id>` (NS-09); K2 `newPhoneLine.dismissed` (NS-10); K3 `copySlip.<child id>.<year>` (NS-11); K4 `reminders.onSince` (NS-13); K5 `signAs.recent` (NS-16); K6 `typedDay.<yyyy-mm-dd>`, K7 `typedDay.showWords` (NS-18); K8 `home.pastLetters`, K9 `home.pastLetter.dismissedOn` (NS-23); K10 `find.dirtyAt`, K11 `find.secureDelete` (NS-02, built in #798); [Amended 17-A11] K12 `culture.asked.<ownerKey>` (L2, PROPOSED), K13 `notifications.dayNames` (L3), K14 `days.clearedNote` (L1), K15 `asks.daysPermission` and `asks.daysAskShown` (L1) (NS-47; the dismissed date lives inside the days file, CR-69 A4), and [Amended 12-A9] `update.serverRequiredFor` (L2, settings) and `scribe.auth.codePausedUntil` (L2, Keychain); F1 the 512 and 1280 copies (NS-37). Levels, sign-out and erase behaviour: eval A s1.3. Folded in from the cards (eval A does not list them): F2 `tmp/share/letter-photo.jpg` (NS-05 section 11, L4, removed at completion and by the launch sweep) and F3 the printable PDF in `tmp` (NS-07 section 4.11, L4, same removal). Each joins `DATA_CLASSIFICATION.md` 4.5 or 4.6 through BL-960.

### 2.3 Server migrations (eval A s1.4, adopted except where marked)

| Id | Card, wave | Eval A | Delta in this file |
|---|---|---|---|
| File 28 [Amended 12-A9] | NS-40, NS-41 (first run) | `20261031000000` compliance gates (region hook), from open #424 | Pending; re-stamp by `data-architect` (it sorts before develop's newest file; CK5) |
| S1 | NS-01-R61, NS-36-R1d; wave 2 | s1.4 S1: drop `entry_photos_author_insert` and `_update` (created `scribe_core.sql:294-300`, last altered `20261028000000:88-101`), keep read and delete; trigger `entries_15_photo_closed` with `entries_photo_closed()`, `SCPHO`; trigger order asserted | CK8: refuse a non-null value on insert and a change to a non-null value on update; an unchanged value passes. Evidence: `sync_push`'s insert and update lists never name `photo_path` (`20261016000000:1091-1135`), so an author edit of a row that already holds a legacy path carries it unchanged and eval A's rule would refuse that letter's every later write for good. Q8's founder count (expected zero) is the check before the tag |
| H1 | prep for S2 and S4; wave 3 | none (s5 takes a size exception per restating PR) | CK9, OQ-K1: restate `sync_push`, `sync_pull` and `entries_family_rules()` once with three hooks, each a no-op at first: `sync_private.entry_groups_apply(p_id, d, p_changed)` (security invoker; one guarded update that writes only when a value differs), `sync_private.entry_own_extra(public.entries)` (keys appended to both own-row builders, `:1481-1496` and the left-book builder eval A s0.1 item 3 names), `public.entries_extra_content(new, old)` (OR-ed into the tuple). Later column PRs replace the hooks only. Proof: the existing sync suite unchanged and green, and a `pg_get_functiondef` comparison against `20261016000000` with the hook lines excepted; `sync` points `test/contract-drift.test.ts` at the hooks |
| S2 | NS-06 A, wave 4 (BL-968) | s1.4 S2, including `held_drafts.first_mark`, `first_label` (A11 requires them; they reach the author's other phones through `to_jsonb(h)`, `:1635`) and the 320 code point ceiling (s1.5, Q1) | through H1 if OQ-K1 holds |
| S3 | NS-17, wave 5 (needs a row) | s1.4 S3: `held_drafts.words_withheld`; `held_drafts_stamp()` lets `raw_transcript` go to null only with the flag; `held_upsert` ignores words on a withheld row | none. My first draft cleared the server words with `held.discard` then a word-free `held.upsert`; withdrawn, because a discard writes `purge_ledger ('held_draft', id)` and a `discarded` marker that the author's other phones read as a let-go (`20261016000000:550-566`) |
| S4 | NS-06 B, wave 5 (BL-969) | s1.4 S4 and s2.3 (option (b), four corrections, `entries_seal_open_idx`, no `service_role` function) | CK10: `v_now := now()` (the transaction time the `book_entries` clause reads), not `statement_timestamp()` |
| S5 | NS-12, unscheduled (BL-979) | s1.4 S5: `entry_versions` gains `edit_level`, `author_edits`, `locked_spans`; definer `entry_versions_list` and `entry_version_remove` with legal-hold refusal and an ids-only audit row | none |

### 2.4 Sync contract (`packages/api/src/server/sync.ts`; owner `sync`)

| Id | Wave | Change |
|---|---|---|
| C1 | 1-2 | No key added. Tests: `ENTRY_DATA_KEYS` (`:263`) and the outbox payload never hold `photo_path`, `photo_text`, `place` or `photo` (NS-01-R15, R26; eval A s6.2). `PulledRowSchema.photo_path` stays `v.nullish(str)` (`:618`) so a legacy server value never fails a page; the merge never writes it. Rec: no narrowing on push (eval A S1 asks it), since the push has no such key. `SCPHO` joins the error table of `02-api-and-contracts.md` (API-R09) |
| C2 | 1-2 | T1 lives in `test/contract-drift.test.ts` |
| C3 | 4 | group `first` (eval A s2.1, s2.2): `FIELD_GROUPS` (`:94`), `FIELD_GROUP_COLUMNS`, `EntryData`, `ENTRY_DATA_KEYS`, `PulledRowSchema`, `PulledHeldSchema`; phone `ALL_GROUPS` (`lib/sync/types.ts:51`), `entrySnapshot` (`lib/sync/outbox.ts:161`), merge |
| C4 | 5 | group `seal`, `AUTHOR_ONLY_COLUMNS` (`:160`) += three, `SCSEL` (eval A s2.1, s2.2, s2.4); old author builds: eval A R7 |
| C5 | 5 | `BookRequest.seal_since` (`:554`), `PulledBookSchema.seal_watermark` (`:666`), composite `"<instant>|<uuid>"` (eval A s2.3). Old builds strip the key (eval A s0.1 item 8; Fact: valibot 1.5.0 `object` copies declared keys only, `node_modules/valibot/dist/index.mjs:5655`) |
| C6 | 2 | PROPOSED by NS-13: `KILL_SWITCH_KEYS` += `reminders` (stop only), remote-config default false, `ERROR_DETAILS`, as #798 added `bookSearch`; with eval A R13's header fix |
| C7 | unscheduled | the S5 RPC types (eval A S5); endpoint class `read_rpc` |
| C8 | 5 | `HeldDraftData` and `HELD_DRAFT_DATA_KEYS` (`:308`) += `words_withheld` (eval A S3, s2.4) |

T1 (`[NS-36-R11]`, owner `sync`): every column in `FIELD_GROUP_COLUMNS`, `SHARED_GROUP_COLUMNS` and `INSERT_ONLY_COLUMNS` except `id` is in the latest `entries_family_rules()` tuple, and every one not in `AUTHOR_ONLY_COLUMNS` is in the latest `book_entries` list; exemptions are a named list with a reason each: `in_book` (its own clause, `20261015030000:184`), and `language` and `words_reviewed_at` until OQ-P3. Eval A has no generic guard; its `firsts.test.mjs` and `seal_publish.test.mjs` check one feature each (s6.1). T2 (`[NS-09-R14]`): eval A s6.1, the `sync_v1_server.test.mjs` addition. T3 (`[NS-36-R10]` phone, owner `qa`): every column a migration in `migrations.ts` adds has `L1` to `L4` in its comment (ADR 0028's request to `qa`; not in eval A).

### 2.5 Export, erase and classes

[Amended 17-A11] The days folder joins `eraseDeviceFiles` and the Caches suggestion folder joins `CACHE_COPIES` (AP-6, `architecture.md:128`); NS-46 to NS-50 need no local migration, no L-number, and nothing is synced or exported.

Export minors: eval A s3, adopted: E1 1.7.0 pictures (BL-933, gated by BL-868), E2 1.8.0 Firsts, E3 1.9.0 seals (1.8.0 if the seal merges first), and a media minor for videos and several pictures, by merge order [Amended 16-A-8]; no bump for NS-12, NS-15, NS-16, NS-37; NS-17's waiting-letter question stays with eval A. Delete, restore, purge, let go, Erase everything, sign-out and server account deletion per new field: eval A s4, adopted; F2 and F3 add only "removed at completion and by the launch sweep; never exported". Classes: eval A s1.6, adopted.

### 2.6 Inventory (BL-960, `privacy` with me; the founder merges)

BL-960's scope stands. Deltas it must also carry: `DATA_CLASSIFICATION.md` 4.5 from local version 4 to 11 (v5 to v10 columns, `agreements`, `entry_media` with X10 levels, the Find tables, K1 to K11), 4.6 F1 to F3; `data-policy.md` 4.4 the pictures row (ADR 0028 D1 text) and pictures in the `:144` backup row, plus #799's Find row. With S2, S4, L14, L15 and S5, their rows in the same PR (eval A s1.6 classes).

## 3. Waves 1 and 2 (full design, data side)

### 3.1 NS-01 photo, NS-36 rules, NS-37 copies (in review: #841, #842, #835 to #840; #834 merged)
- Built: L11, the eraser, sweep and Erase order of ADR 0028 D1 and D5 (#835), the X10 comment (#836). Open and owned here: the L11 CHECK ceilings (eval A R1) and the stronger upgrade test, both before #835 merges; S1; BL-959 (the ADR's X10 text); BL-868 (my spec edit with `legal`; gates BL-933).
- Open rows and their design: NS-01-R61, NS-36-R1d by S1; NS-36-R4 by BL-959; R6 by BL-960; R10 by T3 and `classification.test.mjs`; R11 by T1; R1a to R1c, R2, R5, R7 by P-5 and BL-933 (`mobile`; eval A s3, s4, s6.2); R12 by the J-N18 canary (BL-862); NS-01-R54 by L11's ceilings and BL-957; NS-37-R5 by the sweep's name rule (eval A s1.2); NS-01-R15, R26 by C1.
- Deletion per item [Amended 16-A-8]: for NS-52, derived copies, poster, primary file, then the row, for every item of a letter.
- Native work: none from this design. Flags: `EXPO_PUBLIC_PHOTOS` (exists); S1 needs none.
- Privacy and X2: S1 makes "pictures never leave the phone" true on the server too; nothing new leaves the phone. Threat: an author or a crafted client uploading to `entry-photos`; control S1; test `photo_bucket_closed.test.mjs` (eval A s6.1).
- Performance: S1 adds one column compare per `entries` write, inside `push_50_inserts` 120 ms (`sync_perf.test.mjs:38`); phone delete and restore stay one transaction inside the 200 ms save commit (DATA-REQ-048).
- P0 tests: S1 cells (unit, embedded Postgres); T1; T3; device journey J-N9 (P0) by `qa`.
- Dependencies and way back: S1 merges any time, does not hold the Build 13 cut, and reaches production with the first tag after F4; a fault is fixed forward. A photo flag turned off leaves rows and files; L11 is never reversed.

### 3.2 NS-09 let it go (built: #832; P-4 open)
No migration: `held_discard` already deletes the held row and its words in the acknowledging request, except on a stale base or a legal hold (eval A s0.1 item 6, s8 item 8). T2 proves NS-09-R14; R7, R8, R10 to R12 are phone work in P-4 (`mobile`) with K1.

### 3.3 NS-08 backup readiness (wave 1 per #847 D3; CK7)
No data change now. The flip's tables already exist in develop's file 19 (`20261023000000_backup_server.sql`) and reach production with the F4 re-run while `EXPO_PUBLIC_BACKUP` stays off (NS-08-R5); a schema with no rows collects nothing (Assumption: `privacy` confirms the label reading). R9, the backup of the backup, is the founder's; data input: Storage objects are outside the nightly dump on Free (NS-08 section 3). At the flip, rows per NS-08 section 11, by `privacy` with me.

### 3.4 NS-02 Find (built: #798; #799 open)
No migration (ADR 0028 D4; eval A s1.2). Open data rows: L3 for `letter_search_rows.entry_id` (BL-959, BL-960), #799's row, NS-02-R24 (eval A s6.2 `[X4-R1]`).

### 3.5 No data change: NS-10 (K2; eval A s0.1 item 7: `sync_pull` serves rows while consent is outstanding, so "nothing downloads" is a phone rule), NS-13 (K4, C6), NS-32, NS-33, NS-34, NS-35 (built #828), NS-21, NS-03 (pilot data lives outside the product)

### 3.6 PR breakdown, waves 1 and 2 (data side, merge order; each within 400 lines and 20 files unless said)

| # | PR | Owner | Lenses A / B | Size | Depends on |
|---|---|---|---|---|---|
| 1 | BL-959: ADR 0028 amendment (X10 levels at `:34-35, :184`; the B10.1 choice with eval A's corrections and CK10; export minors by merge order; revoke-only view replace) | data-architect | data-steward / compliance-engineer | S, 1 file | none |
| 2 | #835 change: L11 CHECK ceilings; #836: `capTyped` by graphemes; the upgrade test of section 1 | mobile | data-steward / security-architect | S each | #842 |
| 3 | T1 drift guard and C1 tests | sync | principal-architect / data-steward | S, 2 files | none |
| 4 | T2 held discard test | data-architect | data-steward / security-architect | S, 1 file | none |
| 5 | T3 phone class-label check | qa | data-steward / principal-architect | S, 1 file | none |
| 6 | S1 migration, `photo_bucket_closed.test.mjs`, the two setup changes (`access_matrix.test.mjs:56, 395`; `data_governance.test.mjs:114, 121`), APPLY file 33 | data-architect | red-team / security-architect; founder `approve-migration` | about 280 lines, 5 files | none; before photo on in production |
| 7 | BL-868 spec edit (with `legal`) | data-architect | compliance-engineer / data-steward | S; founder merges | #797 (merged) |
| 8 | BL-960 inventory catch-up | privacy (with me) | compliance-engineer / data-steward | S; founder merges | #836, #799 |
| 9 | BL-933 export 1.7.0 (E1); P-5 picture rows | mobile | data-steward / compliance-engineer | M | BL-868, #835, #836 |
| 10 | P-7 record the applied files | ops | data-steward / security-architect | S | F4 (section 6) |

## 4. Wave 3 (outline)

- NS-15 another day: no data change (eval A s1.4 S0): `occurred_on` and `occurred_precision` exist on `entries` (`scribe_core.sql:125`), `drafts` (v6) and `held_drafts` (`20261016000000:307-308`), travel as group `occurred_on` (`sync.ts:102`), are in the consent tuple and `book_entries`, and export since 1.5.0. The Review dateline writes the draft's pair; Keep sends it. CK1: #847 treats BL-945 as a new synced field.
- NS-11 (K3; E1 for R10), NS-23 (K8, K9; the existing `entries_child (child_id, occurred_on)` index), NS-05 Level 1 (F2), NS-14, NS-22, NS-01 slice 5: no schema or contract change.
- H1 (OQ-K1): interface in 2.3. PRs: H1a `sync_push`, H1b `sync_pull`, H1c `entries_family_rules` (each a restatement; one founder size exception covers the three); owner data-architect with `sync`; lenses red-team / principal-architect. Risk: a restatement drifts from `20261016000000`; way back: the existing sync suite and the `pg_get_functiondef` comparison.

## 5. Waves 4 and 5, gated and unscheduled (one paragraph each)

**NS-06 Part A Firsts (wave 4).** Rests on L12, S2, C3, E2 and NS-02's extra source; held drafts carry the mark (card A11; eval A S2 step 2). Decide first: H1 or a size exception (OQ-K1, Karma), and the label ceiling, 320 or the card's 200 (eval A Q1; `product`).

**NS-06 Part B the seal (wave 5).** Rests on ADR 0028 D3 and D3a (CR-62), L13, S4, C4, C5, E3. B10.1 (BL-987's `data-architect` line): option (b), because it needs no `pg_cron` or `pg_net` on the Free plan (Unverified there), writes nothing on the author's row and adds no `service_role` function; with eval A s2.3's four corrections (composite watermark, no lower clamp on a supplied `seal_since`, an absent one on a non-fresh pull means no lower bound, extra rows on the last page only) and CK10. Decide first: counsel's new "open at 18" question and Q50 (founder with counsel; default ordinary dates only); that the author's phones run the seal build before the flag is on (eval A R7).

**NS-25 the other parent (wave 5).** No new data: `child_invites`, `child_members`, `policy_acceptances`, `peek_invite`, accept and `undo_parent_join` exist (`20261015010000`, `20261015020000`). Rests on T1, so every later synced column reaches the other parent or is named author-only, and on access cells for R2, R3, R4, R10, R14, R15. Decide first: counsel Q48, Q49, Q53 and the founder on D-053; BL-882 to BL-889 live only on draft #767.

**NS-16 someone else speaks (wave 5).** Rests on `entries.author_signs_as` (insert-only, 30 code points, `data_governance.sql:95`, `sync.ts:157`), L14 and K5; the name is counted in code points, not by BL-957's grapheme rule (eval A s1.5, s8 item 10); a held draft does not carry it (eval A R8). Decide first: counsel Q45, Q48, Q54(f).

**NS-17 second language (wave 5).** Rests on L15, S3 and C8 (eval A). BL-987's `data-architect` line: `held_drafts` does not allow nulling the words today (`20261016000000:506-507, 722`), so S3 is needed. Decide first: Karma's constitution reading of S3 (eval A R6), a backlog row (eval A R14), the native reviewer and the founder.

**NS-18, NS-07, NS-24, NS-04 (wave 4).** NS-18: K6, K7 only (counsel retention BL-949 Q5). NS-07: F3 only; reads stored copies (E1) and keeps closed seals out by the one visibility rule. NS-24, NS-04: no data.

**NS-12 earlier versions (no wave).** Rests on S5, C7 and restore as an ordinary `text` edit (eval A S5). Decide first: counsel Q51, Q32, Q48; Karma's reading of D8 (eval A R6); export of versions (me with `privacy`; default no).

**NS-19 continue a draft (no wave).** Would rest on a per-take child table with its own immutable `raw_transcript` guard, its own words group and its own `verifyEdits` pass, never a join of takes. Decide first: `product` and the constitution review: a take as a `drafts` row linked to the first, or a new table, and how `held_drafts` carries it.

**NS-20 two books (no wave).** The card's default (two copies at Keep, each counted) needs no schema: two `entries` rows, each its own immutable `raw_transcript`, and a copied picture file per `entry_media` row (one file per row keeps the sweep simple). Decide first: one letter or two copies (founder with the CPO role and me; default not built).

**NS-26 to NS-31.** No data until reopened; preconditions are in each decision record (NS-26 push tokens L3 with a `grants.mjs` row; NS-27 a new access rule under F12; NS-28 and the printed book of NS-30 need X2; NS-29 per-word timings in `stt_meta`, which no phone stores today).

## 6. F4: staging and production have never been migrated by CI

Facts. Production run 42973935354 (tag `db-v0.1.0`, 11 Nov) passed "Tag must point at a commit on main" and "Check the secret exists" and failed "Dry run" ("failed to parse connection string", per #847 3a; the log has expired). Staging catch-up run 42976572128 (11 Nov) failed at "Dry run" too; run 42983835990 has waited for the `staging` approval since 11 Nov. `migrations-applied.txt` lists 2 files, which describe `early-letters` (DEPLOY.md:38), while production is `scribe-prod`, a new Free-plan project (DEPLOY.md:36; `free-tier-ops.md:3`); so the push applies 31 files if the secret names `scribe-prod`, or 29 if it names `early-letters` (CK2). All 31 apply on a fresh database with CLI 2.119.0 (run 44642662637).
Assumption: the stored URL does not parse: a password character not percent-encoded (DEPLOY.md:54 asks for encoding), quotes or a trailing newline pasted with it, the dashboard's placeholder left in, or a key=value string instead of a URL.

[Amended 12-A9] Files that must be applied before store builds also include `20261108000000` (consent fields, applied first, backward compatible) and `20261109000000` (CR-69 A6 sets the order and the measured gate before `app.consent_fields_required` goes on).

Founder steps, in order (no agent can do any of them):
1. In the SQL editor of the project each secret should name, read only: `select to_regclass('supabase_migrations.schema_migrations');` then, if not null, `select version, name from supabase_migrations.schema_migrations order by 1;`. Expected: null (a new project), or exactly `20260930000000` and `20261001000000`. Any other version (APPLY.md:11 records file 2 "as `scribe_hardening_indexes_and_grants`") means stop: a repair writes history and is a decision, never a step (OQ-F2).
2. Run APPLY.md "Hosted checks before the first apply" a) to d) and write the answers in the deploy notes.
3. Reset the database password to letters and digits only, build the session pooler URL (port 5432, user `postgres.<ref>`, DEPLOY.md:52-56), and paste it into `SUPABASE_DB_URL_STAGING` (environment `staging`) and `SUPABASE_DB_URL_PROD` (`db-production`) with no quotes, spaces or newline.
4. Staging first: start the catch-up run on `develop` (Actions, Deploy database, Run workflow), read the dry run's file list (31 on a new project), approve, then the smoke.
5. Production: "Re-run failed jobs" on run 42973935354 (same tag, same commit), approve `db-production`, read the dry run list (31 or 29 names), then push.
6. Then APPLY step 6 (consent pepper) and step 7 (purge schedule), and the three D-159 jobs.
7. P-7 (`ops`): one PR adds the applied names to `migrations-applied.txt` and the states in `supabase/APPLY.md`. After it, the guard freezes all 31 files.
Risk: 31 files in one push; on `early-letters`, files 20 to 23 have Before counts that can refuse (APPLY.md:82-88). Way back: the dry run first; forward-fix only; restore is the last resort (DEPLOY.md "Rollback").

## 7. Contracts for the three mobile designs

| Design | Cards | Reads and writes (ids) | Sync and API | Export and erase it must honour |
|---|---|---|---|---|
| 08 keeping | NS-08 to NS-12 | K1 (NS-09), K2 (NS-10), K3 (NS-11); NS-12 later: S5 | `held.discard` as built (T2); C7 when NS-12 is taken up; NS-08 none until the flip | NS-11 copy equals the export (E1 when photos are on); K-keys never exported; NS-12 versions in memory for the open letter only (eval A s1.2) |
| 09 capture | NS-13 to NS-20 | K4 (NS-13), L14 and K5 (NS-16), L15 (NS-17), K6 and K7 (NS-18); NS-15 the draft's existing `occurred_on` and `occurred_precision` | C6 (NS-13); NS-15 group `occurred_on` (exists); NS-16 `author_signs_as` insert-only, sent with the first insert; C8 and S3 (NS-17) | NS-15 export unchanged (1.5.0 fields); NS-16 `author.signs_as` (exists); K6 deleted after delivery; eval A s4 rows for the From name and withheld words |
| 10 reading and family | NS-21 to NS-31 | K8 and K9 (NS-23); NS-21, NS-22, NS-24 read existing columns only | NS-25: `peek_invite`, accept, `undo_parent_join`, `SCINV`, `SCCAP`, `SCPAR`, `killSwitches.invites` (all exist) | NS-24 reads `occurred_on`; nothing new |
| any design that shows Firsts or seals | NS-06 | L12, L13; one visibility rule (ADR 0028 D3a sentence) on every surface | C3, C4, C5; merge rules eval A s2.2 | E2, E3; a closed seal contributes to no surface (NS-06-B2); eval A s3 for the author's ZIP |

## 8. Risks (top five first)

| # | Risk | Way back |
|---|---|---|
| 1 | F4: the first CI apply of 31 files, against a project whose history the repo does not know | Section 6 step 1 stops on an unexpected history; dry run first; forward-fix |
| 2 | An opened seal never reaches the other parent (P0 NS-06-B8b) | Option (b) with eval A's four corrections and CK10; `seal_publish.test.mjs` regressions (eval A s6.1) plus a case at the transaction and statement boundary; eval A R2's option (c) only if Karma rules it |
| 3 | Each synced column restates about 700 lines of sync SQL: review cost and silent drift (eval A R3) | H1, or eval A's per-PR size exception with a function-body diff |
| 4 | A synced column bypasses the consent gate or never reaches the other parent (F12) | T1 fails the build; named exemptions only |
| 5 | L11 ships with code point CHECKs and every later fix needs a table rebuild (eval A R1) | Fix in #835 and #836 before merge |
| 6 | Inventory and classification drift while `docs/legal` waits on the founder | BL-960 first; X2's interim inventory line in each PR; gates G1 and G5 hold the flags |
| 7 | #424 merges with a timestamp before develop's newest file | Rename on rebase (CK5); DB-R08 review |
| 8 | A view replace re-grants `select` on `book_entries` (eval A R4) | Revoke-only block; `explicit_grants.test.mjs` fails on a grant |

Also carried from eval A s7: R6 (constitution reading for S3 and D8), R7 (an old author build strips seal keys), R9 (`grants.mjs` has no `authenticated` function list), R13 (kill-switch header).

## 9. Open questions

| Id | Question | Owner | Default |
|---|---|---|---|
| OQ-F1 | Fix both secrets and re-run (section 6) | founder | blocks every servers-on build until done |
| OQ-F2 | If a project's history holds an unexpected version: repair or not | founder, after my read of the schema | no repair; stop and ask |
| OQ-F3 | `approve-migration` on S1 to S5 and H1 | founder | not merged without it |
| OQ-F4 | ADR 0028 Q4: the owner backup carries pictures | founder with `privacy` | no |
| OQ-F5 | Size exception for H1 (or for each of S2 and S4, eval A s5) | founder | one, for H1 |
| OQ-C1 | Counsel: "open at 18" and Q50 (seal); Q45, Q48 (NS-16); Q51, Q32 (versions); Q54 (the seal row states the sealing zone's offset) | counsel through the founder | per the cards: ordinary dates only; flags off |
| OQ-K1 | H1 hooks, or a size exception per restating PR (CK9) | Karma | H1 |
| OQ-K2 | The constitution reading of S3 and D8 (eval A R6) | Karma | eval A's reading: nothing is rewritten; the words as heard stay on the phone |
| OQ-P2 | `entry_media.kind`, `ext`, `bytes`: L1 (NS-01 section 11) or L2 (#836, eval A s1.6) | `privacy` | L2 |
| OQ-P3 | Should `language` and `words_reviewed_at` changes pass the content-consent gate | `privacy` | yes, folded into the next restatement of the tuple (H1 or S2) |
| OQ-P5 | `first_label` ceiling 320 or 200 (eval A Q1) | `product` | 320 |

## 10. Conflicts

For product:
- CP1: NS-36-R5 and ADR 0028 D2 put the seal in 1.8.0; wave order makes Firsts 1.8.0 (eval A s8 item 5). Rule: next free minor at merge.
- CP2: NS-06-A10 cites `:1589-1602` as the held builder and omits the `held_drafts` columns A11 needs (eval A s0.1 item 3, s8 item 2).
- CP3: NS-17 section 10 and R8 ("the next push sets them null") against `20261016000000:506-507, 722` (eval A s8 item 7); S3 is required.
- CP4: NS-01 section 11 classes `kind`, `ext`, `bytes` L1; #836 and eval A s1.6 say L2 (OQ-P2).
- CP5: NS-12-R3 wants a faithful restore; `entry_versions` keeps no `edit_level`, `author_edits` or `locked_spans` (eval A S5, R5).
- CP6: BL-870 says "No migration here" and names `sync`; NS-01-R61 needs S1, which eval A s1.4 also files under BL-870. A new row is owed, owner data-architect (`product` numbers it).
- CP7: NS-06 B10.1's option (b) spec loses openings (eval A s8 item 3; CK10 adds one more way).
- Also carried from eval A s8: item 4 (NS-36 section 23's default against B10.1's), item 6 (BL-969 and BL-970 against NS-06 Part B), item 9 (NS-10's consent question), item 10 (BL-957 against NS-16), item 11 (cards treat ADR 0028 as unmerged), item 12 (NS-06-A23's 200 ceiling).
For Karma:
- CK1: #847 BL-944, BL-945 and 3c treat NS-15 as a new synced field under F12 (13 sizes it L); the locked card adds no field (eval A s1.4 S0 agrees). The card wins.
- CK2: #847 3a says the re-run applies 29 files; DEPLOY.md:36-38 makes production `scribe-prod`, a new project (31 files). Eval A s0.1 item 9 leaves it unverified.
- CK3: ADR 0028 D3, NS-06-A10 item 3 and B10 item 4 re-run a block that grants `select` on `book_entries`; explicit grants removed it (agreed with eval A s0.1 item 2).
- CK4: ADR 0028 D1 and D4 (`:34-35`, `:184`) still class the ids L2; NS-36-R4 needs L3 (BL-959; eval A s0.1 item 1).
- CK5: #424's `20261031000000` sorts before develop's newest migration.
- CK6: DB-R10 forbids `begin`/`commit`; file 3 has both (`20261002010000:4, 11`). The fresh rebuild passes, so it is not an F4 blocker; DB-R10's check is still pending (#32).
- CK7: 13 gives NS-08 no wave; #847 D3 puts its reads in wave 1. I followed #847.
- CK8 (this file against eval A s1.4 S1): S1 should pass an unchanged legacy `photo_path`; evidence in 2.3. Both agree when Q8's count is zero.
- CK9 (this file against eval A s5): H1 hooks once, against a founder size exception for each restating PR. Mine trades one large review now for small Firsts and seal PRs; eval A's keeps each feature PR self-contained.
- CK10 (this file against eval A s2.3): eval A reads `v_now := statement_timestamp()`; the `book_entries` clause reads `now()`, the transaction start, which is earlier when PostgREST runs the call inside a transaction it opened before the statement (Assumption from Postgres semantics, not re-read). A seal whose instant falls between the two passes the window, fails the view, and is then behind the watermark for good. Use `now()` for both. Seals open only at whole or half-hour instants (local midnights), so many seals share a few instants and a narrow window is still reachable; one lost opening breaks a P0 row (NS-06-B8b).

## 11. Unverified

Which project each secret names and what was malformed (the log expired); how CLI 2.119.0 treats a remote history version missing locally; `pg_cron` and `pg_net` on the Free plan (option (a) only); that `create or replace view` keeps the view's privileges and that `now()` is the transaction start under PostgREST (Postgres semantics as I know them, not re-read this session); SQLite CHECK on `ADD COLUMN` (eval A R11); every FTS5 claim (ADR 0028); whether `language` changes are gated elsewhere (T1 will show). Nothing was run: no test, app, device or hosted project.

# NS-53 Moments tab: data alignment check (data-architect)

Status: findings only, docs only. No migration, no grant, no classification edit was made. Classification decisions stay with `privacy`.
Date: 21 Nov 2026. Base: `origin/develop` at `abc7d57e6` (the corrections of 21 Nov were made on `f308da806`).
Read: `docs/product/moments-tab/ARCHITECTURE-BRIEF.md`, `HARNESS-REPLAN-HYBRID.md`, spec `docs/product/prd/28-moments-tab.md` (sections 17, 17.1, 17.2, 18, 19.4, 26b), `docs/BACKLOG.md` rows BL-1432 to BL-1438 and BL-1447 to BL-1453 (block starting `docs/BACKLOG.md:7214`), `docs/legal/DATA_CLASSIFICATION.md` 4.6 and 4.7, `docs/adr/0032-on-device-sensitive-store.md`, `docs/adr/0028-photo-seal-find-on-device-data.md`, `packages/analytics/src/catalog.ts`, `values.ts`, `registry.ts`, `apps/mobile/src/lib/erase-everything.ts`, `supabase/tests/classification.test.mjs`.
Rulings applied on 21 Nov (docs-only edits): R250 and the 4.6 rows are PR 8's, with `erase-everything.ts` and `erase-all.test.ts` in its file list; PR 5b carries a 4.6 row (bundled place table, L1); `picker_unavailable` stays a local code (no wire code, no catalog row, reversible) and R167 and R282 are reworded; whether `labels{}` is exported is an OPEN item for `privacy` and the founder; DATA-REQ-001 (`docs/legal/DELETION_AND_EXPORT_SPEC.md:51`) makes the Devices table in `docs/legal/data-policy.md` 4.4 an inventory home, and it needs a device-store row, `privacy` decides. The findings below are as written on the base.
Labels: READ means I read the line cited. UNVERIFIED means I did not read the primary text or could not check it here. I ran nothing (no `npm run test:db`), because nothing in `supabase/` changed.

## 1. Verdict in one paragraph

(b) holds: nothing in the cited material needs a server table, column, RPC or sync op, and the newest migration is `supabase/migrations/20261121020000_new_device_fill_rekey.sql` (READ, directory listing), with no Moments file in `supabase/migrations`. The homes proposed for data rows are mostly right, with four gaps (G1 to G4) and three errors in the spec text about analytics (E1 to E3), listed in section 3. The classification (c) is stated per store, not per field, and its device rows are not in `DATA_CLASSIFICATION.md` yet.

## 2. (a) Proposed homes of every data-touching row

| Item | Proposed home (file:line) | Finding |
|---|---|---|
| `moments.json` local store | PR 8, BL-1433 (`docs/BACKLOG.md:7240`; HARNESS-REPLAN-HYBRID.md:29; spec 19.4 line 1029) | Home is right: the store is a device file outside `scribe.db`, so there is no SQL migration and no `supabase/tests/grants.mjs` line. Gap: PR 8's scope text names the store, clear, `eraseDeviceFiles` and schema tests, and no classification row or ADR step (spec line 1029; BACKLOG.md:7241 area). See G1. |
| ADR 0032 as the pattern | spec 17 row 1 (line 904); brief 2.6 (line 161) | READ: ADR 0032 is `Status: Proposed` (`docs/adr/0032-on-device-sensitive-store.md:3`) and says it holds the days store and "the moments index (NS-51)". It does not name `dayKeys`, `labels` or `hiddenPlaces`. R250 (spec line 1286) already says it is amended or a new ADR is written. No PR carries that step. See G1. |
| Erase path for the file | PR 8 "clear, `eraseDeviceFiles`" | Function exists: `apps/mobile/src/lib/erase-everything.ts:62`. The days store is wired by a separate import at `erase-everything.ts:42` (`eraseDaysFile`), and `PICKER_CACHE_FOLDER` at line 41. So PR 8 must edit `erase-everything.ts` and `apps/mobile/test/erase-all.test.ts`; both belong to PR 8's file count (the spec's estimate of about 7 files is ASSUMED there; that the two extra files fit is UNVERIFIED, and the row now says about 9) and should be named in its body. |
| PR 5 synthetic place table | PR 5, BL-1432 (`BACKLOG.md:7228`), 10 rows, `packages/core` test fixtures | Fictional rows, no real coordinates. No classification row is needed if the rows are Asha-only and generated; `privacy` confirms. No migration, no grant. |
| PR 5b real place table | BL-1451 (`BACKLOG.md:7270`); spec 19.4 line 1026 | A bundled public dataset is L1 by the definition of L1 in `DATA_CLASSIFICATION.md` (Public) [UNVERIFIED: licence read by counsel, G11b, is open]. Gap: the PR scope names licence note, ledger, checksum and scan test, and no inventory row for the bundled table or its version. Add a 4.6 row (bundled file, L1) in the same PR. |
| Any `supabase/migrations` entry | none proposed | Correct for the first release. The only server data named anywhere is phase 2 lifecycle email rows, "new table and migration (not written here)" (spec line 913). When written they need RLS, an allow and a deny test, column labels, a grants entry and a 4.3 row; I would own that PR. |
| `supabase/tests/grants.mjs` entry | none proposed | Correct while there is no new `public` table, view, sequence or function (CLAUDE.md "Branches and commits"). |
| `picker_unavailable` allowlist row | brief 5.2 (line 439) says the row is owed in `packages/analytics` before PR 18b-1a merges; spec 18 (line 965); R282 | No row home. BL-1452 (PR 7, `BACKLOG.md:7246`) defaults to "the no-change note", and BL-1447 (`BACKLOG.md:7294`) names no catalog row. See G2 and E1 to E3. |
| Data-map entries (BL-016 YAML) | brief 5.2; R250 | BL-016 is deferred; the inventory of record is `DATA_CLASSIFICATION.md` section 4 (task brief). Entries belong there in 4.6 (device files) and 4.7 (analytics). |
| `DATA_CLASSIFICATION.md` 4.6 row for the picker | BL-1447 scope (`BACKLOG.md:7297`), PR 18b-1a | Partly exists already: READ `DATA_CLASSIFICATION.md:758` has `Caches/ImagePicker/<id>.img` as L4 "a pick in flight only", emptied at every launch and by Erase. The new facts (a library original written by `exportForAttach` into the same folder; process kill between pick and strip; lock and back-out removal) need an edit to that row; PR 18b-1a is the right home. |
| Retention and deletion of kept picture copies | spec 17 row at line 912 | READ `DATA_CLASSIFICATION.md:757` already carries retention (with the letter or draft, erased with its book, a let-go draft, or Erase everything). No new column or store. |
| iPhone backup question O-44 | spec line 1400; R235 (line 1271); brief 2.6 (line 165) and 5 (line 614) | Facts, section 5. |

## 3. Gaps and corrections

G1. No PR owns the `moments.json` classification row and the ADR. Spec R250 (line 1286) says rows exist in `DATA_CLASSIFICATION.md` 4.6 "in the same PR as the code". Spec 26b maps R250 to no PR (only gate G11c, "paperwork read", line 1931 area). `DATA_CLASSIFICATION.md` has no `moments` or `days` store row today (grep, no hit for `moments` in the file). Correction: R250 home becomes PR 8, with one 4.6 row per field class (section 5 below), plus the ADR 0032 amendment or a new ADR.

G2. `picker_unavailable` has no owner PR and the default of PR 7 contradicts the brief. Brief 5.2 (line 439) says the allowlist row is owed before 18b-1a merges. BL-1452 says the default is a "no-change note" and depends only on BL-1433 and O-49 (`BACKLOG.md:7247`). BL-1447 does not depend on BL-1452. Correction: either PR 7 carries the catalog row (and BL-1447 18b-1a depends on it), or the wire code is dropped and the code stays local, which also matches R282's "no new analytics event". The two cannot both stand.

G3. Backup text for pictures is split across two documents and two meanings of "backup". `DATA_CLASSIFICATION.md:672` says `entry_media` is "not in the owner backup" (our own ADR 0024 backup). `DATA_CLASSIFICATION.md:757` says the pictures are "in the device backup". Both can be true, but R235 and R81 say "iPhone backup" only. State both words in the same inventory row (privacy owns wording).

G4. R250 requires that typed place labels and picture labels "stay on this phone, in no backup and no export, or are exported as a labelled section" (spec line 1286). Export duty for the parent's own L4 words is `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ). The decision between the two options is `privacy` and the founder. The first release has no picture label: UNVERIFIED: spec line 939 lists what is not in the file (a picture identifier, an album identifier, a coordinate, a count, a score, a thumbnail) and does not mention a picture label, so I did not find a source for it and only the 60 character `labels{}` is certainly affected. UNVERIFIED: I did not re-read the export spec for the exact DATA-REQ id this session.

## 4. (b) The claim that no server table or sync op is needed

Supported by: spec 17 first line (line 900), R116 (line 615), brief line 47 and line 155. Checks I made:
- READ: no migration in `supabase/migrations` after `20261121020000` mentions Moments; the three newest are new-device sign-in files.
- READ: `moments.json` is a file, so `scribe.db` local migrations (`apps/mobile/src/lib/db/migrations.ts`) are also not touched by PR 8.
- READ: `entry_media` is "never synced or pulled" (`DATA_CLASSIFICATION.md:672`), and kept picture copies are not server data (spec line 912).
- Conditions on the claim: it holds only while `labels{}` text is not read by the outbox, pull merge, push mapper or export (R162, spec line 921, canary of R257). That is a test in PR 8 and PR 24, not a database test; I add no SQL test.
- Phase 2 lifecycle email rows are the one exception and are explicitly out of the first release (spec line 913; HARNESS-REPLAN-HYBRID.md:83).

## 5. (c) Classification of every new field

Device store `moments.json` (spec 17.1, lines 927 to 939; no row exists yet in `DATA_CLASSIFICATION.md` 4.6). Levels are the spec's proposal; `privacy` rules.

| Field | Spec level | Data-architect read |
|---|---|---|
| `v` | not stated per field (store is L4) | Integer, no personal content; L2 would be accurate, but a file-level L4 is simpler. `privacy` decides. |
| `owner` | L4 (store) | Opaque local id, "never a person id" (line 932). Needs a rule for how it is derived; UNVERIFIED, not specified. |
| `dayKeys[]` | L4 | Local ISO date strings with no zone; "Not this one" applies to the date as the parent saw it (spec 17.1, line 933). They are dates, so L4 as stated is fine. |
| `labels{}` | L4 | Free text up to 60 characters and "can hold a child's name" (brief line 169). Correctly L4. Highest-risk field. |
| `hiddenPlaces[]` | L4 | External place ids, no readable name (line 935). L4 stated. |
| `homePlace` | L4 | One value per book (R249). A home place is location of a family; L4 is right. |
| Unknown fields preserved | none | A preserved unknown field has no level. State that it is L4 by default. |

Other device and memory items (spec 17, lines 904 to 912):

| Item | Level in spec | Present in `DATA_CLASSIFICATION.md` 4.6? |
|---|---|---|
| Primer answered flag and nudge flags, phone settings | L2 | No row found (UNVERIFIED for settings keys; I did not grep the settings table rows). |
| Coordinates, place ids, home place, thumbnails, memory only | L4 | Not a stored element; no row needed beyond a note that memory only is not an inventory item. |
| Picked original `Caches/ImagePicker` | L4 | Yes (`DATA_CLASSIFICATION.md:758`), needs the update in section 2. |
| Kept letter's picture copies | L4 | Yes (`DATA_CLASSIFICATION.md:757`). |
| Bundled place table (PR 5b) | not stated | No. Add as L1 once the licence is read. |

Server columns: none are new, so the classification test (`supabase/tests/classification.test.mjs:1 to 25`, which reads `public` columns only) has nothing to check. That test does not cover device files; 4.6 rows for device files are manual.

Analytics: spec 18 (lines 958 to 965) lists six events in the standard naming. The shipped catalog is different, see E1 to E3.

## 6. Errors in the spec text (facts)

E1. Spec line 971 (R167) says "the existing `picker_unavailable` code". READ: `packages/analytics/src/values.ts:154` and `catalog.ts:171` define `ERROR_CODE` as `save_failed, mic_denied, transcription_failed, offline, backup_failed, invite_expired, storage_low, generic`. `picker_unavailable` is not in it, and no file under `packages/` or `apps/` contains the string (grep). It is not existing.

E2. Spec line 965 names an event `system.error.raised` with `area: moments`. READ: the catalog has `error_shown`, `area: 'errors'`, `props: { code: ERROR_CODE }` (`catalog.ts:895 to 900`; `registry.ts:310 to 318`), and `system.error.raised` appears in no `.ts`, `.md` or `.mjs` outside the Moments documents (grep). UNVERIFIED: whether an event standard document I did not find renames events; the HARNESS note at spec line 956 says registry docs are generated.

E3. R282 says "no new analytics event, identifier or stored field" (spec line 1325 area) while also adding one wire code. Adding a value to a closed enum is a catalog change with a `SCHEMA_VERSION` consequence (UNVERIFIED which); the two statements need one wording.

## 7. Rows I would move or reject

- Move R250 (classification rows and ADR) to PR 8 (spec 26b line 1931 area has no PR).
- Move the `picker_unavailable` catalog row either into PR 7 with BL-1447 18b-1a depending on BL-1452, or reject the wire code and keep it local. I recommend rejecting it: it adds a wire value for a failure with no decision attached, and BL-1452's default already is no change.
- Add to PR 5b a 4.6 inventory row (bundled place table, L1).
- Add to PR 8 the edits to `erase-everything.ts` and `erase-all.test.ts` in its file list.
- Reword R167 (spec line 971) to drop "existing" (E1), and R282 per E3.
- Reject any claim that PR 8 or any other row in this plan needs a `supabase/migrations` file or a `grants.mjs` line. None does.

## 8. O-44 (iPhone backup)

Facts only: the folder `Library/Application Support/photos` is not excluded from the iPhone backup, confirmed in ADR 0028 by "the absence of any exclusion call under `lib/photos/`" at commit `39efe1ac` (`docs/adr/0028-photo-seal-find-on-device-data.md:58`); the same absence holds for this worktree for `apps/mobile/src/lib/photos/*.ts` (grep for "exclu" found no hit). `moments.json` follows ADR 0032, which writes a backup exclusion and reads it back (`0032-on-device-sensitive-store.md:16`). So the two stores are treated differently today, as brief line 165 says. `Caches/ImagePicker` outside backup is UNVERIFIED against Apple's text (brief line 602). Nothing here decides O-44; it is the founder's call with `privacy` and counsel (spec line 1400).

## 9. What I did not do

No migration, test, grant, catalog or classification edit. No read of production data. No `npm run test:db` run.

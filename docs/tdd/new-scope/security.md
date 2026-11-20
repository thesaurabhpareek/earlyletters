# New scope: security design and threat model (cards NS-01 to NS-37)

Target: `docs/tdd/new-scope/security.md`. Renamed from `security-and-privacy.md` after Karma's scope change of 20 Nov 2026: `privacy.md` owns each card's DPIA, consent, label and data inventory; `architecture.md` owns the system view and contracts. This file owns the STRIDE threat model, the security controls and their tests, the open security handoffs and review routing. Where a data right applies, it points to `privacy.md`.

Author: `security-architect`, in an interactive session for Karma, 20 Nov 2026. Docs only. Nothing here was run on a phone. Sources: #846 head `450bcb4a` (the brief's head, unchanged), develop `d5d12178`, #847 head `de44b839`, my lens B reviews on #834 (issue comment 7029345255, head `44dd950e`) and #842 (7031012667, head `96c226ac`), issue #851, and open PR #342 (`80116d33`, the v1 threat model). Tags as in `docs/tdd/01-mobile-client.md`: Fact (file:line), Assumption, Rec, Risk, OQ, Conflict, Unverified. Control ids `NSC-nn` are new in this file. Card rows are cited by id, never restated.

## 0. Verdict and top five risks

The locked cards name their trust boundaries well, and most card threat rows map to a machine check. Three gaps block a `production` flag or the agent lane, not a dark merge:
- `[X4-R1]` has no test on develop.
- Native Swift reaches merge without the security lens.
- The agent harness would read a counted lens review as the founder's own words.

| # | Risk | Where | Way back |
|---|---|---|---|
| 1 | The harness treats a counted review (`## Review A/B at <sha>`) from the owner account as a founder instruction. That would put the author agent into maintain mode, and `brief.mjs` would quote the review (PR text and diff excerpts included) under the founder's name. Untrusted text then reaches an agent in the founder's voice (A10) | Fact: `scripts/agents/lib.mjs:250-254`; `dispatch.mjs:130,133`; `brief.mjs:74-75`; #851. My own reviews on #834 and #842 carry no marker line | Keep the lane off (`agents.yml` is `disabled_manually`; #847 Q6 default) until NSC-12 merges (section 5) |
| 2 | Native code bypasses the security lens. `apps/mobile/modules/**` is not in my `review_paths` (Fact: `agents/roster.json:237-253`), so #834 was routed elsewhere (#847 section 9). The name scan in `photos-device.test.ts` is beaten by shadowing and run-time names (#842 N-B3d): one Swift line can copy the location-bearing picker copy into Documents | NS-01, P-1, NS-04, NS-06 Part C | NSC-01 (routing plus a hash pin of reviewed native sources). Until then, Karma routes every module PR to me by hand |
| 3 | A second account on one phone may see the first account's letters. Sign-out keeps the book (ruling D1). On a mismatch, sync stops and "the letters stay" (Fact: `apps/mobile/src/lib/auth/account-claim.logic.ts:15-16`). The first-run gate opens Tonight for any session with a local book (Fact: `apps/mobile/src/lib/first-run/gate.logic.ts:122-125`). No code or test scopes the Book, Find, the lens, seals or reminders to the owner, so a reminder planned under A can name A's child to B | NS-10-R3, NS-32-R12, NS-01-R29, NS-02-R24, NS-05-R27, NS-06-B17, NS-25-R19 | NSC-03 test first; the fix goes in the same PR if it fails |
| 4 | RLS does not protect versions or seals. Security-definer RPCs run past RLS, and `entry_versions` and `book_entries` have had no client grant since `20261023060000_explicit_grants.sql:49-51,99`. So the NS-12 RPCs and the seal pull clause are the whole access control. NS-06 B10 step 4 copies a block that re-grants `book_entries` (Conflict K-3) | NS-12, NS-06 Part B | NSC-10 checklist plus access-matrix deny cells, in the same PR |
| 5 | The phone's own services act on letter text (A11). React Native 0.86.3 exposes no Writing Tools switch (Fact: no `writingTools` in `node_modules/react-native` or `apps/mobile`, grep of 20 Nov). Rows NS-01-R50 and the other D2 rows are P0, so gate G6 keeps photos off in `production` until they pass. Unverified: whether Writing Tools sends text off the phone (Private Cloud Compute, an extension) | Review editor, photo words, place, From, Firsts label | NSC-05: a small native setting, reviewed under NSC-01 |

## 1. Method, adversaries and boundaries

Method: STRIDE for each card that crosses a boundary (infosec skill section 2). Each threat maps to a control and a test. OWASP MASVS STORAGE, PLATFORM and CODE cover the phone; the IAM chapter's RPC checklist covers SQL (`05-identity-and-access.md` "How to apply it").

Adversaries: A1 to A9 as in `docs/tdd/04-security-identity.md:110-118`. Two are added. Rec: add them to the threat-model file's adversary table.
- **A10 The agent harness.** A session reads untrusted text and acts on it, or its own post is read as the founder's (SEC-R21; #342 T2, T3).
- **A11 The phone's own services.** Writing Tools, third-party keyboards, share extensions (including AI apps), the system pasteboard, and Spotlight, Siri and App Intents donation (rulings D2, D3).

| Id | Boundary | Crossed by |
|---|---|---|
| B1 | JavaScript to the app's own Swift modules | NS-01 `scribe-photo`; P-1; NS-04 and NS-06 Part C (later targets); NSC-05 |
| B2 | App sandbox to iOS services, including the lock screen and Notification Center | NS-01 picker and iCloud backup; NS-02 (backup of `scribe.db`); NS-05 share sheet; NS-04 and NS-06 C; NS-13, NS-18, NS-32 (notifications); every text field (A11) |
| B3 | Phone to our server (sync, RPC, Storage) | NS-06 A and B, NS-08 flip, NS-12, NS-16, NS-25, BL-870 |
| B4 | Member to member in one book (RLS, `book_entries`, `sync_pull`) | NS-06 B, NS-12, NS-16, NS-25 |
| B5 | Account to account on one phone | every card (`[X4-R1]`) |
| B6 | Phone to the parent's own messages and the recipient | NS-05, NS-03, NS-11, NS-07, the NS-25 invite message |
| B7 | Repository to agents | #851, review routing, the agent lane |
| B8 | Repository and CI to the production build (eval C TB6; CR-67 AX-17) | every flag: G6, preflight (NSC-02) |
| B9 | Real family to tests and evidence (eval C TB7) | every device row: D13, `no-real-family-data.test.ts` |
| B10 | Phone to logs and crash reports (eval C TB8) | every new path: NSC-06, J-N18 |
| B11 | Our server to the escrow project and any second storage provider | the NS-08 flip only (NS-08-R9; 3.4) |

No STRIDE table here (no new boundary of ours; the section 2 controls still apply): NS-09, NS-10, NS-14, NS-15, NS-21 to NS-24, NS-33 to NS-37. NS-13, NS-18 and NS-32 cross B2 at the lock screen (3.11). NS-07 and NS-11 cross B6 as Export does, and carry pictures (3.5).

## 2. Cross-cutting controls (every design cites these by id)

| Id | Control | Test | Status on develop | Builds |
|---|---|---|---|---|
| NSC-01 | Native gate. Every PR touching `apps/mobile/modules/**` routes to `security-architect` (section 6). A SHA-256 manifest of each reviewed native source (`apps/mobile/modules/REVIEWED.sha256`, with the reviewed head named in it) fails CI on any edit until the manifest changes in a PR I review. The name scan stays as a second line. Folds BL-878 | new `apps/mobile/test/native-sources.test.ts` (fails on old code: no manifest) | not yet | `mobile`; before P-1 |
| NSC-02 | Plist and entitlement allowlist. Preflight already refuses `UIBackgroundModes` (Fact: `apps/mobile/scripts/preflight-testflight.mjs:589-590`). Extend it to refuse app groups, `NSUserActivityTypes`, photo-library and camera usage strings, any `NSAppTransportSecurity` key (SEC-R16 "not yet"), and any entitlement not on the list. A change to the list needs my read (NS-04 EX-3, NS-06-C3) | preflight plus `apps/mobile/test/config.test.ts` | partly (background modes only) | `ops` (BL-864) |
| NSC-03 | Second account. When the signed-in user is not `sync.owner`, every local read for display (Book, Find, Photos lens, share, seals, the versions cache, the names list) returns 0 rows of the owner's book; no notification planned for A's book is still scheduled or planned while B is signed in; nothing is claimed or uploaded. A cover over A's screens sets `accessibilityViewIsModal` (as `app-lock-layer.tsx:80`), since screens under it stay mounted | `[X4-R1]`: one test over every surface and the reminder planner (Asha as A, a second fixture account as B); it cannot pass while a reminder names A's child (NS-10-R3, NS-32-R12) | not yet: no test cites X4 | `mobile` |
| NSC-04 | No donation to the system (D3). `apps/mobile/test/no-system-indexing.test.ts:1-15` already scans `src`, `modules`, config and dependencies. Add `[X6-R1]` to its titles, and ban by presence (an allowlist I approve for NS-04 and NS-06 C): `AppIntent`, `AppEntity`, `IndexedEntity`, `IntentDonationManager`, `AppShortcutsProvider`, `INVocabulary`, `INRelevantShortcut`, `RelevantIntentManager`, `UIApplicationShortcutItem`, `AssistantIntent`, `AssistantEntity`; also scan `apps/mobile/shims` and plugins inlined in `app.config.ts` | that file | partly enforced (no App Intents era tokens), under another id | `qa` (P-8 style retitle) |
| NSC-05 | Writing Tools off on every field whose text becomes a letter's words (D2). React Native has no prop (Fact, risk 5), so this needs a native setting on the text views. The fields set autocorrect off only where the card says (NS-02-R14). Keyboards: OQ-S3 | a source pin and a device row per field | not yet | `mobile`, under NSC-01 |
| NSC-06 | Content-free logs and errors (PRIV-R10). The J-N18 canary, plus closed error-code sets: an error carries a code, never a path, name, hash or text | the canary harness (BL-862, #759) | partly | `qa`; the field list is in `privacy.md` |
| NSC-07 | Snapshot and App lock. Pictures blank on inactive (NS-01-R13a). The share preview is blank in the switcher (NS-05-R14). Nothing new draws before unlock (NS-01-R13b) | those rows | built for pictures (#838) | `mobile` |
| NSC-08 | Temporary L4 files. Each lives in one known folder (`Caches/ImagePicker`, `Caches/ScribePhoto`, `tmp/share`, the export temp). Each is deleted on completion and on cancel, swept at launch, and removed by Erase everything. The share temp also has complete protection and is excluded from backup | NS-01-R52, NS-05-R10a to R10c, NS-11-R23 | photo folders built (#841) | `mobile` |
| NSC-09 | One visibility definition. `searchable_letters`, which is `isVisibleTo` (NS-06-B6). The local seal columns and the view's seal clause land in the same PR, so Find never sees a sealed letter in between | NS-02-R16b with a sealed fixture; NS-06-B6 call-site test | view built in #798; seal clause not yet | `mobile`, `sync` |
| NSC-10 | Server RPC and view checklist (IAM-R14, R15, R24; 05 "How to apply it"). Each item is required: `require_user()` first; an explicit author or role check inside every definer (RLS does not apply there); `require_content_consent()` before content writes, never before a deletion (PRIV-R09); revoke from `public`, `anon` (and `authenticated` unless clients call it); a `grants.mjs` row; access-matrix allow and deny cells for parent, co-parent, contributor, outsider, anonymous and anon; an audit row for membership and deletion acts; a named SQLSTATE. A replaced view keeps its grants (Postgres `create or replace view` does), so a migration restates only the revoke and never re-grants | `access_matrix.test.mjs`, `explicit_grants.test.mjs` | enforced for new functions | `data-architect`, `sync` |
| NSC-11 | The server refuses pictures: BL-870 (NS-01-R61). Required before `EXPO_PUBLIC_PHOTOS` is on in `production` | `supabase/tests/photo_bucket_closed.test.mjs` | not yet (no such file) | `sync` |
| NSC-13 [Amended 12-A8, PROPOSED] | `modules/age-range` returns one of three strings only; a source scan fails on any return of a range, bound, date or error text | scan | not built | FP-10a, FP-10b |
| NSC-14 [Amended 12-A8, PROPOSED] | `buildConsentAct` is the only caller of `record_policy_act` | scan | not built | FP-2, FP-4 |
| NSC-12 | The harness fails closed. `isFounderComment` returns false for counted review headers and for any post carrying the session footer `_Generated by [Claude Code]`. A `brief.mjs` fixture proves a quoted review is never shown under "From <founder>" | `scripts/agents/*.test.mjs` | not yet (#851) | Karma (founder-owned file) |

## 3. Per-card threat models

### 3.1 NS-01 Photo with a letter (built; not redesigned)

What is built: the nine-PR stack in merge order #834 (merged as `76a4a5d7`), #841, #842, #835 to #840 (#847 section 2.1). My lens B passes are #834 round 4 (PASS WITH NOTES at `44dd950e`; must fix: none) and #842 (PASS WITH NOTES at `96c226ac`; must fix: none).

Those reviews established the following:
- The module writes only to `Caches/ImagePicker` and `Caches/ScribePhoto`, and removes regular files only.
- Picked names pass one plain-name rule. The Swift `\z` anchor and #841's `PLAIN_NAME` agree.
- No photo-library or camera permission call, plist key, entitlement or package is added.
- The re-encode runs on its own serial queue.
- 98 committed mutants go red under the scan.

| STRIDE | Threat | Control | Test | Open item, with its design |
|---|---|---|---|---|
| T | A changed module writes the picker copy (with GPS) outside the swept folders, to the pasteboard, to `UserDefaults`, or with lower file protection | Name scan and steward read | `photos-device.test.ts` | Not closed by the scan: N-B3d (shadowing a pinned name; names built at run time with `dlsym`, `CF*` or split strings). Design: NSC-01 hash pin. P-1 (progress and Cancel) changes the module and must wait for NSC-01 |
| T | Path traversal across B1 | Plain-name rule on both sides; stored names `<id>.jpg` only | #834 and #841 tests; NS-01-R34 | N-B1r residuals 1 to 3 (a link in place of a folder; time of check against time of use in the copy; a linked source). When #837 wires the door: `.typeDirectory` for the folders, `fileIn` again inside `copyPicked`, `.typeRegular` for the source |
| I | GPS or Exif in the stored copy, the export or a share | `strip.ts` segment walk and signature scan (#836) | NS-01-R6 | BL-933 runs the same scan over the export bytes (NS-01-R14); NS-05 runs it at send time (3.3) |
| I | The picker copy is left behind | Delete after read; launch sweep (#841); a late pick under App lock or after Cancel is removed (#837 `picker.ts`) | NS-01-R52, R47 | none |
| I | Files readable while the phone is locked | App default `NSFileProtectionCompleteUntilFirstUserAuthentication` (Fact: `apps/mobile/app.config.ts:93`) | device row | N-B2. Unverified that a `copyItem` clone keeps the class. Rec: set `.protectionKey` explicitly on both writes (two lines), which also turns a protection downgrade into a changed pin. BL-851 device row |
| I | Exposure through the iPhone backup (A4) | The same exposure as recordings, said plainly | NS-01-R27, R32 | Copy rows are in `privacy.md` |
| I | Shoulder-surfing or the switcher snapshot (A3) | NSC-07 | NS-01-R13a, R13b | none |
| I | Upload to the server, or `photo_path` set | NSC-11 | NS-01-R15, R26, R61 | BL-870 |
| I | Donation to the system, or Writing Tools (A11) | NSC-04, NSC-05 | NS-01-R49, R50 | R50 open (risk 5) |
| D | A decompression bomb or a long decode | Type allowlist; 150 MP cap read before decode; own queue; 20 s timeout | #834 scan | N-Q1: a re-encode can overlap `scribe-audio` enhance (memory). Device row |
| D | Picker slot stuck | Stale check at `ScribePhotoModule.swift:126` | device row | N-P3: a covered sheet removed by code waits for the next call. Fix with a `PickerHost` deinit that cancels, or have #837 and #838 call `cancel()` on unmount |
| E | Supply chain (A8) | No picker package; lockfile and plist scan | NS-01-R22 | NSC-02 keeps it true |

S and R: not applicable. The picker carries no identity, and the act is local with no audit need; the second account is NSC-03 (NS-01-R29). [Amended 16-A-10] Source scans: NS-51-R29, library calls only in one module (allow-list scan); NS-52-R38, no third-party media package in the lockfile.

### 3.2 Find's local index (NS-02, #798)

| STRIDE | Threat | Control | Test |
|---|---|---|---|
| S | Account B searches account A's book (B5) | NSC-03 | NS-02-R24 (not yet) |
| T | Query text read as FTS5 operators, or a crash | Terms quoted in `ftsMatchString` | NS-02-R45 |
| T | The index lags a hide, delete or seal | Every query joins `searchable_letters`; the index changes in the letter's own transaction; NSC-09 for seals | NS-02-R16a to R16d, R44 |
| I | Removed words recovered from free pages, the WAL or the iPhone backup | `secure_delete`; FTS5 `secure-delete` where the build accepts it; `optimize` at idle | NS-02-R30 (P1). Unverified: the WAL keeps old pages until a checkpoint. Rec: `wal_checkpoint(TRUNCATE)` after `optimize`, in the same test |
| I | The index leaves by our hand | Allowlists in export, owner backup and sync | NS-02-R31 |
| I | The query reaches a log, URL, route or crash report | Component state only; no log or analytics import | NS-02-R15, R22, R25 |
| I | Another author's private letter is found | The view excludes it | NS-02-R4, R16b |
| D | A very long query or a heavy prefix | Rec (not in the card): cap the query at 200 code points before matching (PROPOSED; For product) | new row |

R and E: not applicable. Find writes nothing (NS-02-R49) and calls no privileged path. Donation (NS-02-R26) is NSC-04.

### 3.3 NS-05 Share one letter (wave 3: outline)

Level 1 crosses B6 only. Nothing reaches our server.

| STRIDE | Threat | Control | Test |
|---|---|---|---|
| T | The text sent differs from the preview | One pure function builds the payload, and the preview renders that same string | NS-05-R4a, R18 |
| I | The picture carries metadata, or the birthday through its file name | Fixed name; bytes are the stored copy. Rec: before the sheet opens, check that the temp file's sha256 equals `entry_media.sha256` and run the R6b scan at send time | NS-05-R5b, R6a, R6b, plus one new equality test |
| I | The temp file stays, is backed up, or is readable while locked | NSC-08 | NS-05-R10a to R10c |
| I | We learn where it went | The activity type is never read | NS-05-R3b, R12 |
| I | A share extension (an AI app, say) receives the words (A11) | Residual risk: the parent's own choice. Copy never claims control | n/a |
| E | The share path reaches audio | The payload type admits text plus at most one image URI (a type-level test) | NS-05-R5a, R16a |

S, R and D: not applicable. The recipient is unauthenticated by design, nothing is recorded by design, and nothing is served.

**Security read on the optional picture (X2; Conflict K-1).** My read: acceptable at Level 1 if four conditions hold:
- P1: the bytes are the stored copy and pass the R6b scan at send time.
- P2: the file name is fixed (R6a).
- P3: the temp file follows NSC-08.
- P4: the picture is off by default, chosen per share, and the choice is never remembered (R5b, R12).

Counsel Q45 still gates the flag. Levels 2 and 3 need a fresh read: per-letter author-only links that are 256-bit, hashed (L3), expiring and revocable; short-lived signed audio URLs; no page that can be indexed and no link preview naming the child; per-token rate limits; a "seen by" never stored; the label moving in the same build. These are the NS-28 preconditions too (3.9).

### 3.4 NS-08 Recording backup: readiness now, the flip later

The readiness reads are wave 1 (#847 P-6; lens A is mine). The flip is a voice leaving the phone (X2), so it needs my read and counsel's. My review of the NS-08-R1 note checks each item below by file and line:
- (a) `entry-audio` storage policies have per-persona deny cells (co-parent, contributor, outsider, anonymous, anon) in `audio_backup_escrow.test.mjs` and the access matrix (IAM-R24).
- (b) A server-side owner check refuses an upload under account B for account A's entry, so NS-08-R11 does not rest on the phone alone.
- (c) The escrow unwrap path: logged; 24 or 72 hour hold; approval only from a device enrolled 7 days (D-108); email on use.
- (d) The `escrow_svc` `search_path` (#342 row P4, #311) is fixed or listed.
- (e) Every flip secret has a `docs/ops/SECRETS.md` row (SEC-R02), and none sits in GitHub.
- (f) The seventh condition (NS-08-R9): any backup of the backup holds ciphertext only and never in the same store as a key wrap.
- (g) `killSwitches.backupUploads` and `escrow` stop work with no dangling row (NS-08-R14).
- (h) The restore drill runs on a scratch project with Asha data only (D13).

Flip STRIDE (boundary B11), in short:
- S: a second account (R11).
- T: object overwrite (idempotent key, R13).
- R: unwrap log.
- I: a storage breach (ciphertext, A6) or an insider (A5, an honest residual).
- D: quota (R18).
- E: the escrow role.

### 3.5 X2: a child's voice or picture leaving the phone

The rule (closed X2; `00-product-frame.md:85`): no copy of a child's voice or picture leaves the phone without my read and counsel's on record. Status of each path:

| Path | Wave | Read |
|---|---|---|
| NS-05 Level 1 optional picture | 3 | Mine in 3.3 (P1 to P4); counsel Q45 owed |
| Export 1.7.0 with `photos/` (BL-933), sent by Export or NS-11 Save a copy | 2 and 3 | Mine below (E1 to E3); counsel Q45 default: the same act as Export (the parent's own share sheet; export never gated, PRIV-R09) |
| NS-51 photo moments [Amended 16-A-10] | after 1.0 | Reads dates and identifiers only, on the phone; nothing leaves; index in an excluded folder; no X2 read needed while NS-51-R26 holds |
| NS-52 pictures and videos, Variant A [Amended 16-A-10] | after 1.0 | Nothing leaves except the parent's Save a copy and the one-picture NS-05 share (both X2 paths with E23 reads); Variant B is not designed and every upload needs the X2 read and counsel's read first |
| NS-07 printable PDF with stored copies (NS-07-C28-2) | 4 | Mine below (E1 to E3); same counsel default |
| NS-03 Arm V (pilot) | 1 | Mine is below; counsel's voice read is still owed |
| NS-05 Level 2 and 3 | not scheduled | Owed after the NS-03 read-out (3.3 lists the preconditions) |
| NS-28 family link | parked | Owed (3.9) |
| NS-08 flip | founder decision | Owed (3.4) |

**Security read for pictures in Export, Save a copy and the PDF.** Yes, if:
- **E1.** Only stored copies leave (never a picker copy), and BL-933 and the PDF build run the NS-01-R6 scan over the bytes they write.
- **E2.** The ZIP and the PDF temp follow NSC-08 (NS-11-R23, NS-07-C28-12); file names follow NS-11-R11.
- **E3.** No path sends a picture to our server (NSC-11). A sealed letter's picture stays out of the NS-07 PDF and out of any export other than the author's own until it opens; the author's own Export and Save a copy carry a sealed letter whole, picture included (NS-06-B2 exception, NS-06-B5, ADR 0028 D2).

**Security read for NS-03 Arm V (sections 3, 4 and 15 of the card).** Yes, if V1 to V4 hold:
- **V1.** One recording only, taken from Export's `audio/` folder. The parent never sends the ZIP. The instruction tells the parent to delete the export ZIP from Files after sending and never to put it on a shared drive.
- **V2.** Before recruiting, `qa` dumps one Asha `.m4a` fixture's atoms (beside NS-03-R9) and confirms no device name, account id or location. Unverified until then.
- **V3.** The team never receives a recording (card section 3). The pilot log never enters a session (NS-03-R8).
- **V4.** The consent states the residuals: the relative's messaging provider keeps a copy, and a forward cannot be undone.

Rec (not a condition): the file name `<entry id>.m4a` (Fact: `apps/mobile/src/lib/export/schema.ts:31-32`) carries an L3 id. Being a UUIDv7 (Fact: `lib/sync/ownership.ts:33`), it also carries the recording time to the millisecond. The instruction may ask the parent to rename the file.

The read counts once I post it dated on BL-935's PR or in the pilot file. Arm V still waits for counsel's voice read (NS-03-R2).

### 3.6 NS-06 sealed letter (wave 5: outline), Firsts (wave 4) and quick capture (wave 5)

| STRIDE | Threat | Control | Test |
|---|---|---|---|
| S | A reader's clock set forward opens a seal | Server `now()` decides | NS-06-B16 |
| T | The pair is changed or resealed; a non-author writes the seal columns; `seal_cleared_at` is forged | `entries_12_seal_guard` (`SCSEL`); author-only update RLS; the server stamps the time | NS-06-B10, B14, guard tests |
| R | Open now changes who can see content | Content consent gate on both tuples | NS-06-B21 |
| I | Another member pulls the words before the instant | The `book_entries` clause. Option (b) extra rows also pass `book_entries`, so a forged `seal_since` re-fetches only rows the caller can already read | NS-06-B8, B8b, B20, B22, plus the forged-window variant (B13) |
| I | The seal columns leak the sealing zone's offset | Author-only; never in `book_entries`; never logged | NS-06-B20, B23 |
| I | The letter appears in Find, the lenses, Share or the PDF before it opens | NSC-09 | NS-06-B2, B6 |
| I | An insider or `service_role` reads sealed words (A5) | Residual risk. Copy says "hidden, not locked" | n/a (Q43) |
| D | The extra pull scan costs too much | `entries_seal_open_idx`; at most `p_limit` rows | `sync_perf.test.mjs` |
| E | Option (a)'s job | `service_role` only, with a `grants.mjs` row | grants test |

Rec: option (b), from the security side as well. It adds no privileged job, and no `service_role` read of L4 seal columns. NSC-10 applies to the `sync_pull` change. The migration must not re-grant `book_entries` (K-3).

**Part A (Firsts).** `first_label` (L4) syncs through `book_entries`. The same migration adds both columns to the content trigger tuple and to the view (F12), with author-only update and the `mustBeL4` test. Writing Tools are off on the label (NSC-05).

**Part C (doorways).** It rests on the NS-04 spike. Required:
- EX-3 and my read of the plist and entitlement delta (NSC-02);
- no app group;
- an App Shortcut never carries words as a parameter (NSC-04);
- no take starts from the lock screen;
- 0 starts without a tap in 200 fires (NS-04-R7).

### 3.7 NS-12 Earlier versions (no wave: decision record)

The design rests on two new definer RPCs (list and remove). Since `20261023060000`, `entry_versions` has no client grant. The policy `entry_versions_author_select` (`scribe_core.sql:271`) therefore never applies, so both RPCs need these checks inside:
- `e.author_id = v_uid` and `e.deleted_at is null`;
- deny cells for every other persona (NS-12-R8; Conflict K-4).

The remove RPC is a deletion:
- no consent gate (PRIV-R09);
- a content-free audit row;
- refused while a legal hold covers the account (as `20261023020000_purge_legal_holds.sql` does for the purge; OQ-S7).

The phone cache holds only the open letter's versions. It clears on leave and on sign-out, and NSC-03 covers it.

Decided first: retention and removal (counsel Q51, Q48) and export of versions (`privacy.md`).

### 3.8 NS-16 Someone else speaks (wave 5)

- S: "From Nani" is the parent's assertion, not an identity (D9). No surface may imply it was verified. No speaker identification exists (NS-16-R9).
- T: the name cannot be rewritten after the first upload (insert-only, `packages/api/src/server/sync.ts:157`).
- I: the name reaches the co-parent by design (R11). It is never logged (J-N18, NSC-06) and never indexed (R8).
- E: none.

The data-rights questions (Q45, Q46, Q48, Q54(f)) are in `privacy.md`.

### 3.9 NS-25 the other parent (wave 5) and NS-28 (parked)

| STRIDE | Threat | Control | Test |
|---|---|---|---|
| S | A forwarded or leaked invite (A2, A7) | Hashed token; single use; 7-day expiry; peek needs sign-in; revocable. Risk: the invite message the app composes names the child (Fact: `apps/mobile/src/lib/family/share-text.ts:8`), so a forward carries the name with a live link (OQ-S9) | NS-25-R2, R6, R18 |
| T | P2 edits or deletes P1's letters | Author-only RLS; members read through definer pull only | NS-25-R3; access matrix (co-parent persona) |
| R | Undo within 72 hours | Audit `member_join_undone` (IAM-R20) | NS-25-R4 |
| I | An ex-partner (A1) reads private letters, versions, sealed letters or pictures | Private letters stay private; versions are author-only (3.7); seals are author-only; pictures never leave the phone | NS-25-R3, NS-12-R8, NS-06-B8, NS-01-R15 |
| D | Invite spam | `killSwitches.invites`; per-IP limit. Unverified: `CLIENT_IP_HEADER` is set (#342 row P5) | NS-25-R11 |
| E | A third adult joins, or P2 invites a hostile contributor (A1) | `SCCAP`; contributor invites refused while `app.contributors_enabled` is off (Fact: `20261015010000_v1_gate_peek_invite_consent_pepper.sql:121-123,169`; OQ-S10); accepting never changes a role (IAM-R19) | NS-25-R5; `security_family.test.mjs` |

Before the store build turns co-parent on, IAM-R12 ("Sign out other devices", not yet built) is needed against A1.

**NS-28.** Parked. A design needs, first:
- my read and counsel's on record (Q45, Q42);
- link tokens on the `member_return_links` pattern (256-bit, hashed, L3, 90-day clock, revocable);
- the 3.3 Level 3 preconditions;
- the NS-08 decision, since hosted audio depends on it;
- the founder's cost decision.

### 3.10 NS-04 hands-free spike (wave 4)

It runs on a separate bundle id with an Asha-only account (NS-04-R6). My EX-3 read covers the plist, entitlement and label delta of each trigger. Default: no app group and no background mode, or a founder decision (OQ-3 of the card). Siri receives the spoken phrase, so no "nothing leaves your phone" line appears near a Siri trigger.

### 3.11 Notifications: NS-13, NS-18 and NS-32 (lock screen, B2)

| STRIDE | Threat | Control | Test |
|---|---|---|---|
| I | The lock screen or Notification Center shows a child name, letter words or typed-day words to anyone holding the phone (A3) | Names and typed words off by default (D-025, NS-18); `hiddenPreviewsBodyPlaceholder` on the category; plan notices carry no name, count or price | NS-32-R12, R13; J-N24 |
| I | A reminder planned under account A names A's child after B signs in (B5) | Sign-out and an account change cancel and re-plan from the signed-in owner's books only (NSC-03) | `[X4-R1]` reminder case; NS-10-R3 |
| I | A notification payload or identifier carries an id, name or text into logs (B10) | Identifiers are opaque; NSC-06 | J-N18 |
| I [Amended 17-A9] | A day note shows a day's name or words on the lock screen | Rendering rules of `14-days-planner-and-catalogue.md` section 2: opaque `el.day.<date>` id, payload `{source, kind}`, no category sets `hiddenPreviewsShowTitle`, typed-day words only behind `notifications.dayNames` (NS-47-R36, R37) | J-N24 |

S, T, R, D and E: not applicable. Notifications are local, with no push service and no server sender (NS-26 parked).

### 3.12 NS-40 to NS-45 first run [Amended 12-A8]

The threat rows by boundary (B1, B2, B3, B5, B8, B10, the region hook) and the PROPOSED abuse rows AB-FR1 to AB-FR5 are in `12-first-run-5.md` section 1; they are read as part of this file. New controls: NSC-13 and NSC-14 (section 2).

## 4. Controls each parallel design must include (for Karma's cross-check)

| Design | Must cite and carry |
|---|---|
| Mobile: capture, Home and Review | NSC-01 for any Swift (P-1, Writing Tools); NSC-05 on the Review editor, photo words, place, From and the Firsts label; NSC-07; NSC-08; NS-01 open items N-B1r, N-B2, N-P3 (3.1); the D1 sign-out sheet with NSC-03 |
| Mobile: Book, Find, letter page and share | NSC-03 across Book, Find, lens, share and versions; NSC-09 and the seal clause in the same PR; the 3.2 query cap and WAL checkpoint; 3.3 P1 to P4 and the sha256 equality test; NSC-04; NSC-06 for queries and snippets |
| Mobile: Me, keeping and settings | The NSC-03 claim and mismatch behaviour, including the reminder planner (NS-13, NS-18, NS-32 with NSC-03 and 3.11); E1 to E3 for Save a copy; NSC-08 for the export temp (NS-11-R23); the NS-08-R6 test before the cut; NSC-02 for any new permission |
| Data and sync | NSC-10 on every RPC and view (no `book_entries` re-grant, K-3); NSC-11; the NS-12 author check inside the definer (3.7); F12 tuple and view in the same migration; option (b) seal pull with the forged-window test; NS-08 items (a), (b) and (g) |
| `architecture.md` | Boundaries B1 to B11 (B8 to B10 are eval C TB6 to TB8, CR-67 AX-17) and adversaries A10 and A11; review routing (section 6); no new network host or SDK without PRIV-R12 |
| `privacy.md` | Owns inventory, DPIA, consent and label rows. Security depends on: the J-N18 field list (NSC-06), the X2 rows (3.5) and the NS-12 retention |

## 5. Open security handoffs and the agent lane

- **#851, my answer to item 3.** I confirm the identity reading.
  - Why the classifier fails: it is a deny-list on the first line (`lib.mjs:253`), so any new post format from the owner account fails open to "founder". The product thread's approval record on #834 (issue comment 7030095860) already starts with plain text. My #834 and #842 reviews carry no marker.
  - Better test (NSC-12): treat a post as machine when its first line matches `^## Review [AB] at [0-9a-f]{40}:` or when it carries the session footer.
  - Brief hygiene: `brief.mjs` quotes reviews as data in a fenced block, never under "From <founder>".
  - Long term: SEC-R20. Agent posts move to the agents App identity, so authorship decides and content does not.
  - Format choice (item 1, the founder's): marker first is fail-closed with today's classifier; header first needs NSC-12 before any lane runs. I do not object to ai-eng-lead's header-first recommendation, provided NSC-12 merges first. Until item 1 is settled, my reviews follow the interim `review-gate` practice (header on line 1, marker on line 2).
- **The autonomous lane stays off.** Default for Q6 in #847: off until all of these are true:
  - L1: OPERATING_MODEL section 4 states the counted-review rule.
  - L2: NSC-12 is merged with its test.
  - L3: the section 6 `review_paths` fix is merged.
  - L4: no unattended run holds a write connector (SEC-R19; #342 row T4).
  - L5: injection tests cover every place a brief quotes public text (#342 row T2, RB-16).
- **BL-851** (`security`, threat model for media on the phone): folded into S-1. Its device rows are the protection class and backup checks (N-B2, NS-01-R27).
- **BL-878** (`security`, native-module gate checklist): becomes NSC-01. It lands before P-1.
- **P-6** (NS-08 reads): I review the R1 note against 3.4.
- **The NS-03 Arm V read:** 3.5. I post it dated on BL-935's PR once that PR exists.
- **#342** (threat model v1, open since 28 Oct): refresh it and land it. New-scope rows go into it (S-1), not into a second file.

## 6. The `review_paths` gap

Fact: my `review_paths` (`agents/roster.json:237-253`) lack:
- `apps/mobile/modules/**`, so the Swift module went to `principal-architect` and `ai-eng-lead` (#847 section 9);
- `supabase/tests/**`, which my charter lists (`.claude/agents/security-architect.md:30`);
- `apps/mobile/scripts/preflight-testflight.mjs`, the plist gate.

Fix (S-3): add all three to the roster, with the matching charter line. `/agents/` is founder-owned (`.github/CODEOWNERS:29`). Rec for `ai-eng-lead`: `agents-check.yml` fails when a charter's listed paths and its roster `review_paths` differ.

Capacity: `wip_limit` 1 and 2 runs a day (#847 risk 4). NSC-01 keeps the load small: only a native diff routes to me, so JavaScript-only photo slices can take `compliance-engineer` as lens B.

## 7. Work this file creates (each PR at most 400 lines and 20 files, in merge order)

| PR | What | Owner | Lens A / B | Size |
|---|---|---|---|---|
| S-1 | `docs/security/threat-model.md`: #342 refreshed; A10 and A11 added; section 2a carries this file's rows; BL-851 rows | `security` | principal-architect / security-architect | about 250 lines, 1 file |
| S-2 | NSC-12 in `scripts/agents/lib.mjs` and `brief.mjs`, with tests (after the founder answers #851 item 1) | Karma | ai-eng-lead / security-architect | about 80 lines, 3 files |
| S-3 | `review_paths` and the charter line | founder (via ai-eng-lead) | ai-eng-lead / security-architect | about 6 lines, 2 files |
| S-4 | NSC-01 manifest and test (BL-878), before P-1 | `mobile` | principal-architect / security-architect | about 150 lines, 3 files |
| S-5 | `[X4-R1]` (NSC-03) test, with the fix if it fails | `mobile` | principal-architect / security-architect | M [E] |
| S-6 | NSC-02 preflight allowlist (BL-864) | `ops` | qa / security-architect | about 120 lines, 2 files |
| S-7 | `[X6-R1]` retitle and App Intents tokens (NSC-04) | `qa` | principal-architect / security-architect | about 40 lines, 1 file |
| S-8 | Chapter 06 conformance: SEC-R01 home, SEC-R10 drift (`agents.yml` is pinned: `.github/workflows/agents.yml:132,154`), A10 and A11. A new MUST for NSC-01 goes as an RFC to principal-architect, data-steward, compliance-engineer and ai-eng-lead, with founder approval | `security-architect` | principal-architect / ai-eng-lead | about 60 lines, 1 file |
| S-9 [Amended 12-A8] | First run PRs FP-10a, FP-10b (`modules/age-range`, NSC-13), FP-6 and FP-2 (NSC-14); see `12-first-run-5.md` section 2 for owner, lenses and size | `mobile` | principal-architect / security-architect | per that table |

## 8. Founder and counsel questions (defaults in force until answered)

| Id | Question | Owner | Default |
|---|---|---|---|
| OQ-S1 | Counted review format (#851 item 1) | founder | Header on line 1, agent marker on line 2 (ai-eng-lead), only with NSC-12 merged first |
| OQ-S2 | Switch on the autonomous lane (#847 Q6) | founder | Off until L1 to L5 (section 5) |
| OQ-S3 | Refuse third-party keyboards on letter fields (A11) | founder | Allow. Multilingual parents (P4) rely on them; the residual is stated in the threat model; no claim says otherwise |
| OQ-S4 | NS-05 Level 1 optional picture (Q45) | counsel | As the card says: the same as Export. My read in 3.3 is on file |
| OQ-S5 | NS-03 Arm V voice lines (Q45) | counsel | Arm W only until read |
| OQ-S6 | Sealed letters and custody or legal orders (Q50); "hidden, not locked" (Q43) | counsel | As NS-06 B12 and B17 |
| OQ-S7 | Removing a version while a legal hold covers the account (NS-12, D8; Q51) | counsel | Refuse with a plain line, as the purge does |
| OQ-S8 | Co-parent safety removal (Q50, Q53) | counsel | Ruling D11: the 72-hour undo only |
| OQ-S9 | The invite message names the child (`share-text.ts:8`) | `content` with the founder | Keep it as built (the parent's own act); the token controls hold |
| OQ-S10 | `app.contributors_enabled` in production | founder, with `ops` | Off until NS-28 is designed |
| OQ-S11 | Who keeps the threat model: SEC-R01 says `security`; the infosec skill points to #342 | Karma | `security` keeps it; `security-architect` reviews |

## 9. Keeping the threat model current

- **One home.** `docs/security/threat-model.md` (S-1). Once it lands, this file's section 3 shrinks to a pointer, so the rows never live in two places.
- **Row upkeep.** Each row carries `Checked: <develop sha> <date>` and the ids of its tests.
- **A row is reopened when:**
  - (a) a PR adds a surface (SEC-R01): a migration, an RPC, a native file, a plist key, an `EXPO_PUBLIC_*` flag in `eas.json`, a host or SDK;
  - (b) a card's flag turns on in `preview`, `testflight` or `production` (gate G5);
  - (c) a store candidate is cut (14 section 3);
  - (d) Karma re-syncs #847 and changes ids;
  - (e) an incident or a new adversary appears.
- **Machine checks.** Rec for `qa`, with the G0 trace work (#819):
  - every NS id and test title the threat model cites exists, or is marked "owed";
  - a PR touching the paths in (a) either edits the threat-model file or says `Threat model: no change, because ...` in its body (warn-only at first).
- **Standing duty.** Each run, I take one card's rows and grep their controls on develop (conformance sweep), and refresh external references at most quarterly.

## 10. Conflicts

**For product:**
- **K-1.** `00-product-frame.md` section 7 and 13 section 5 say a child's picture leaving the phone needs a security read and a counsel read. The README ground rules and NS-05 section 3 gate the Level 1 picture on counsel Q45 alone. Proposed: NS-05 lists this file's 3.3 read as a gate.
- **K-2.** `[X4-R1]` says a second account "never sees" the first account's letters. The D1 sign-out sheet says "anyone who opens the app here can read them", and `account-claim.logic.ts:15-16` only stops sync. The card should say what B's screens show. NSC-03 assumes nothing.
- **K-3.** NS-06 B10 step 4 and A10 step 3 copy the block at `20261015030000_v1_wire_contract_columns.sql:251-253`, including `grant select on public.book_entries to authenticated`. Since `20261023060000_explicit_grants.sql:99` revoked it, `book_entries` has had no client grant (`:49-51`). A replaced view keeps its grants, so the migration restates the revoke only.
- **K-4.** NS-12 section 13 cites "author-only RLS". `entry_versions` has no client grant (`explicit_grants.sql:49-51`), so the policy at `scribe_core.sql:271` never runs, and the RPC check is the control.
- **K-5.** The 3.2 query cap is not a card row.

**For Karma:**
- **K-6.** The charter's review paths and `roster.json` disagree (section 6).
- **K-7.** SEC-R10's enforcement line says `agents.yml` is unpinned, but it is pinned. I fix this in S-8.
- **K-8.** The counted header (`merge-queue.mjs:75`) disagrees with the agent marker of `OPERATING_MODEL.md:58`, the red-team marker of `:83` and the steward marker in the charters (#851).
- **K-9.** SEC-R01 names `security` as owner of a file that does not exist on develop, while #342 has held one open since 28 Oct (OQ-S11).

## 11. Not verified

- Whether B's screens show A's local book after a mismatch (K-2). `gate.logic.ts:122-125` opens Tonight for any session with a local book; no screen reads `sync.owner`.
- Writing Tools:
  - whether iOS applies it to React Native text views by default;
  - whether it sends text off the phone;
  - whether a native setting exists for every iOS version we support (iOS 17 has no Writing Tools).
- The protection class of copied picture files (N-B2).
- FTS5 `secure-delete` in the `expo-sqlite` build, and WAL residue after `optimize`.
- The atoms in an `AVAudioRecorder` M4A (V2).
- Every Apple behaviour listed as unverified in my #834 and #842 reviews (picker lifecycle, embedding, ICU).
- Whether `CLIENT_IP_HEADER` is set on staging or production.
- `pg_cron` on the Free plan (option (a)).
- That `create or replace view` keeps grants on the hosted Postgres version. This is documented Postgres behaviour, not run here.

Nothing was run on a phone, a hosted project or a Swift toolchain.

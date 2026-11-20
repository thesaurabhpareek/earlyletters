# New scope: privacy architecture (cards NS-01 to NS-37)

Target: `docs/tdd/new-scope/privacy.md`. Author: `privacy` (privacy engineer), in a session for Karma, 20 Nov 2026. Docs only; nothing was run on a phone or a hosted project.
Scope: each card's privacy-by-design assessment (DPIA-style), consent and notice, the App Store privacy label, one inventory list for one founder-merged `docs/legal` PR, the privacy controls with their tests, and the founder and counsel questions. Threats, STRIDE and the security controls `NSC-01` to `NSC-12` are in `security.md` (security steward); this file cites them by id and does not repeat them. Schema and contracts are `data-and-sync.md`'s; screens are the area designs'.
Sources: #846 at `450bcb4a` (the brief's head, unchanged when I started), develop `1513b265`, #847 at `de44b839`, ADR 0028 on develop (`docs/adr/0028-photo-seal-find-on-device-data.md`, accepted by CR-62), the photo stack heads #835 `f55be7b8`, #836 `3395e5a6`, #837 `7122da97`, #839 `279ba898`, #840 `f811c9a6`, branch `docs/photo-inventory-rows` `47c1467f`, #799 `1fac1c6f`, my lens B review on #836 (classification ruling), the designs `security.md`, `09-capture.md`, `10-reading-and-family.md` (05:29 UTC) and `08-keeping.md`, `11-foundations.md`, `data-and-sync.md`, `architecture.md` (05:33 UTC), and the product thread's evaluations on `docs/eng-eval-20nov` at `6c011919` (eval A `A-data-and-sync.md` sections 1.3, 1.6, 2.5, 4; eval C `C-platform-quality-delivery.md` section 4), which are input, not a parallel design.
Tags as in `docs/tdd/01-mobile-client.md`: Fact (file:line, develop unless a PR is named), Assumption, Rec, Risk, OQ (owner, default), Conflict (never resolved silently; collected in section 7), Unverified. Words a parent reads are content keys; new ones are PROPOSED for `content`; the founder approves words. Every legal reading here is a question for counsel, not an answer.

## 0. Summary

1. Pictures (NS-01) leave no trace on our servers by construction only once BL-870 merges (NSC-11); until then "Photos or Videos: not collected" rests on the app alone (ADR 0028 Context fact 1). The label answer does not change; its "Why" text and the submission checklist do (section 3).
2. Four parent-facing truths are owed before photos are on in `production`: pictures are in the iPhone backup (CR-62 items 4 and 7), the owner backup carries none (item 6), the export carries the stripped copy only (item 3, BL-868), and account deletion cannot reach a phone's pictures (NS-01-R31). All four are founder and counsel items (section 6).
3. X2 covers a child's voice or picture leaving the phone through a feature of ours (00 section 7). NS-05 Level 1 therefore ships text only; its picture toggle waits for the `security-architect` read (`security.md` 3.3, conditions P1 to P4) and counsel Q45 on record. NS-03 Arm W needs the same once its file can show a picture (Conflict P-2).
4. Earlier versions (NS-12) already sit on our server today, written by trigger (`supabase/migrations/20260930000000_scribe_core.sql:213`, `20261016000000_sync_v1_server.sql:598`), and the Privacy Policy does not name them (`docs/legal/privacy-policy.md:35`). That disclosure is owed now, whatever NS-12's wave (Conflict F-3).
5. My ruling on the NS-12 export question (I co-own it with `data-architect`): the author's own versions belong in the author's export (Conflict P-5).
6. Classification rulings in this file (I own `data-policy.md` section 4 and the levels): letter and draft ids L3 everywhere (`entry_media`, `letter_search_rows`); a record's own id (media id, version id) L2; sizes, enums and flags L2 (`entry_media.bytes`, `kind`, `ext`, `find.secureDelete`); typed-day keys and words L4; `first_mark` L3; seal columns L4 (CR-62); the withheld-words flag L4. Each confirmation or correction of eval A s1.6 and of `data-and-sync.md` OQ-P2 to OQ-P4 is in 4.1.
7. One inventory PR for the founder, rows marked with their status, so later code PRs flip a status word instead of writing rows (section 4). That needs a paired-PR rule against DATA-REQ-001's "same PR" (Conflict K-2).
8. Analytics stays off through 1.0 (D-124 item 3): no card adds a catalogue event in the 1.0 line; the existing guard `apps/mobile/test/analytics-off-v1.test.ts` stays the proof.
9. Two built defects are mine to track (1.10): a second account signed in on a phone that holds the first account's book still sees that book (NS-10-R3, `[X4-R1]`), and a consent retry writes a second acceptance row (NS-10-R7). The first is a live privacy risk for every build with sign-in on.

## 1. Privacy-by-design assessment, per card

Levels per `docs/legal/DATA_CLASSIFICATION.md` section 1.1 (rule numbers cited as R1 to R9). "Leaves" means leaves the phone. "Parent's act" means through the iOS share sheet to a place the parent picks; we receive nothing.

| Card | Data, and whose | Why needed (minimised) | Where (phone, server, backup) | Level | Retention | Erase | Export | Who sees | Leaves |
|---|---|---|---|---|---|---|---|---|---|
| NS-01 Photo (built) | One picked picture per letter (the child; any adult in frame, Q48), photo words (140), typed place (60), `entry_media` row | A picture beside the words; one stripped copy, no camera original, no library read (CR-65), place only as typed (R26) | Phone `Library/Application Support/photos/<media_id>.jpg` and `scribe.db`; iPhone backup yes (CR-62 item 7 default); owner backup no (item 6 default); server none | file, sha256, words, place L4; entry_id, draft_id L3; id, bytes, kind, ext, width, height, added_at L2 | Life of the letter; Recently deleted 30 days; let-go draft; a replaced file at Undo close or next launch | `erasePictureOf`, file then row, on every letter, book, other-phone and draft path (`store.ts:1311, 1328` on #839); folder listing at Erase everything | 1.7.0 stripped copy only (BL-933 after BL-868) | Author, on the phone that added it | No |
| NS-37 copies | 512 and 1,280 px copies of the stored copy | Book speed; regenerable | Same folder, each file excluded from backup | L4 | As the stored copy | Same eraser; sweep; folder at Erase everything | No | Author | No |
| NS-02 Find | FTS5 index of kept words, photo words, place, Firsts label; map rows; the query | Search with no server; never `raw_transcript`, audio text, picture-read data, child name or past queries | `scribe.db`, so in the iPhone backup and inside the recovery export ZIP (Conflict P-4); never synced, never in the family export or owner backup | body, extra L4; `letter_search_rows.entry_id` L3; row_id, `find.dirtyAt`, `find.secureDelete` L2; query L4 in memory | As the findable letter; bytes gone at the next `optimize` | Same transaction as the letter; `DROP` at Erase everything | No | Reader, only what `searchable_letters` allows | No |
| NS-05 Share L1 | The words in the fixed wrapper; a child's name only if it is in the words | One letter, sent by the parent; we keep no destination, activity type or count (R3b, R12) | Memory only | Words L4; date L3 (L4 if a birthday) | The call | Released | n/a | Recipient | Parent's act |
| NS-06A Firsts | `first_mark`, `first_label` on own letters; a first can be a health fact (Q32) | Parent's own mark; nothing suggested or detected | Server author row, co-parent via `book_entries` when visible; phones; Find `extra`; the pair on local drafts | mark L3; label L4 (R3) | Life of the letter | With the letter | Its own minor | Author; co-parent if the letter is in the book and open | Syncs (User Content, declared) |
| NS-06B Seal | `seal_opens_at`, `seal_opens_on`, `seal_cleared_at`; the instant states the sealing zone's offset (CR-62 item 2) | Rule and words; no zone id | Server author row only, never `book_entries`; author's phones and their backups | L4 (CR-62) | Life of the letter; no extension of Recently deleted | With the letter; tombstoned at an account-deletion request, never published (D6) | Author ZIP 1.8.0; never the PDF or another's export before open | Author until the instant; then the letter, never the columns | Syncs, author row only |
| NS-07 PDF | The whole book, pictures, child name on the title | Parent's keepsake | Phone temp, complete protection, no backup | L4 | Until the sheet ends | Completion handler, launch sweep (C28-12) | It is an export | Parent | Parent's act |
| NS-08 Backup | Today none new. Flip: encrypted recordings (parent, baby, any NS-16 speaker), wraps, device id, `backup_consent` row | Restore on a new phone, opt-in | Today phone and iPhone backup; flip `entry-audio` and the escrow project | recording, wrap L4; device id, consent L3 | Life of the letter; withdrawal on 31/38/45 days (D12) | Letter delete, account deletion, withdrawal | Recordings already exported | Author (us only under logged escrow use) | Flip only, under X2 |
| NS-09 Let it go | `discard.failures.<draft id>`; server held-draft words until ack | Finish a deletion asked for | Phone settings; server `held_drafts` | key L3, count L2 | Until the draft is gone; server purge at ack (D7) | Sweep, Remove now, ack | No | Author | Discard op |
| NS-10, NS-11, NS-23 | `newPhoneLine.dismissed`; `copySlip.<child id>.<year>`; `home.pastLetters`, `home.pastLetter.dismissedOn`; NS-11 temp ZIP | Settings for one line or slip | Phone settings; temp | L2; copySlip key L3; ZIP L4 | Until changed, book deleted, Erase everything; ZIP until the sheet ends | Erase everything; ZIP sweep (NS-11-R23) | No (settings) | Author; NS-23 words on Home behind App lock cover | NS-11 by parent's act |
| NS-12 Versions | `entry_versions` rows the server keeps today (prior words, edits, `superseded_by`) | Author restores own earlier words | Server; phone memory for the open letter only (1.4) | words, edits L4; entry_id, superseded_by L3; id L2 | Life of the letter or until removed (D8); off backups 7 days later | Remove RPC; purge cascade; account deletion | Own versions (1.4) | Author only (R8) | Already on our server |
| NS-13, NS-32 | Reminder settings, `reminders.onSince`, bodies in the iOS pending list | Local reminders, back-off, one a day | Phone; iOS notification store | L2; bodies L3 (a month-day note reveals the birth day), L4 with names | Until re-plan, session end, Erase everything | `endReminderSession()` (`09-capture.md` 1.3) | No | Lock screen; names off by default | No |
| NS-16 Someone else speaks | A non-user's name (`author_signs_as`), their words, their voice; names-used list | Attribution only; no relationship, contact, photo, voiceprint (R4, R9) | Server name and words, `book_entries` shows the name; phone recording, list | name, list L3 (R3); words, voice L4 | Life of the letter; list until session end | By the account holder only (1.2) | `author.signs_as` | Account holder; co-parent sees From | Name and words sync; voice stays until a backup flip |
| NS-17 Language hold | Withheld machine output (`withheld_words`, eval A s1.2 row 15), the withheld flag | Keep the take whole without invented words (D10) | Output phone only; the flag also on `held_drafts` (eval A S3) | output L4; flag L4 (4.1) | Life of the take | Take delete, Erase everything; the server copy emptied at the mark | Never as words (Conflict P-4) | Nobody | Flag only |
| NS-18 Typed days | `typedDay.<yyyy-mm-dd>` words, `typedDay.showWords` | The parent's own reminder words | Phone settings; iOS pending list | key and words L4 (R1, R3, R6: a date can be a birthday, as for the seal); switch L2 | Deleted the day after delivery | Re-plan, session end, Erase everything | No (default, Q51) | Lock screen only with showWords on | No |
| NS-25 Other parent | P2's account and letters; P1's book, earlier letters, child name, birthday or due date (health-adjacent) to P2; invite hash; acceptance row | Two parents, one book; private stays private | Server and both phones; pictures and recordings stay on the phone that made them | account, hash, acceptance L3; letters, child data L4 | Life of account and letter; hash 90 days | Per parent (D-116); undo, leave or delete removes the other's letters from the phone at the next pull (`apps/mobile/src/lib/sync/merge.ts:843-848`) | Own whole; the other's as the book shows them | P1, P2 per `book_entries` | Syncs (declared since option B) |
| NS-03 Pilot | Code key, consent record, raw notes, counts (outside the product) | Research; counts only reach the repo | Founder's private store | L3; notes L4; counts L2 | Notes 30 days; consent 12 months (D4) | Founder, dated note | n/a | Founder | Parent's act, to a relative (Arm V under X2) |

No new data: NS-14, NS-15 (`occurred_on`, L3, exists), NS-21, NS-22, NS-24, NS-33, NS-34, NS-35. NS-04 and NS-06C store nothing; a Siri phrase goes to Apple by the parent's choice, and any app group must hold nothing L3 or L4 (NS-04 EX-3; NSC-02). Parked (NS-19, NS-20, NS-26 to NS-31): rows are owed when designed; NS-26 adds push tokens (L3, Q54(d)); NS-28 and the printed NS-30 are X2; NS-31 reads the photo library (NX-39 counsel brief).

### 1.1 The X2 rule (a child's voice or picture leaving the phone)
- Fact: closed X2 names voice (`docs/product/prd/README.md:41`); the locked frame names "voice or picture" (`00-product-frame.md` section 7). Both reads are needed: `security-architect` and counsel.
- Rec (my reading, OQ-F6 confirms): X2 covers our features whose purpose is to send a child's voice or picture to another person or to our servers: NS-05 picture toggle and Levels 2 and 3, NS-03 Arm V (and Arm W when its file shows a picture), the NS-08 flip, NS-28, the printed NS-30, C-32. It does not cover the parent's own export or Save a copy: export is a right (DATA-REQ-050, Terms 8.2) and recordings have always been in it.
- Status: the security read for the NS-05 picture is written (`security.md` 3.3, P1 to P4) and for Arm V (`security.md` 3.5, V1 to V4); neither counts until posted dated on the PR or pilot file. Counsel's reads (Q45) are owed for both.
- Rec: G11-1a (`07-remaining-capability-rows.md` section 5) gains a fixture: an image or audio URI in a `Share.share` call outside `lib/share/` fails unless the PR names a D-id.

### 1.2 Non-users (NS-16, and anyone named or heard in a letter)
- The parent is the user; a speaker, or an adult named in words or seen in a picture, is a data subject we cannot reach. Minimised by the card: no contact, relationship, photo or voiceprint (NS-16-R4, R9), name capped at 30 (L3), not indexed (R8), names list per phone (at most 20) cleared at session end (`09-capture.md` 1.3 and section 6). Agree with `drafts.author_signs_as` at L3.
- D9: an instruction, no attestation record. Flag off in `production` until Q45, Q46, Q48 and proposed Q54(f) are answered and PRIV-R20's `child-input` flag exists (card section 22). Rec: add `EXPO_PUBLIC_SIGN_AS_OTHER` to the preflight's held-off list (as `09-capture.md` section 6 says).
- A speaker asks us to delete their words or voice: DSR-R04 forbids deleting another author's letter on anyone else's request. Rec: support forwards the request to the account holder at the account email and changes nothing; counsel Q48 says whether more is owed (OQ-C4).
- At a backup flip another adult's voice reaches our server (Q42(c)); the flip consent says recordings may hold other people's voices (key PROPOSED in section 2).

### 1.3 Co-parent data (NS-25)
- Fact: `closeBook` deletes other authors' letters from the phone when a book is left, the join undone or the book deleted (`merge.ts:843-848`); copies already exported stay (`privacy-policy.md:58`).
- Pictures and recordings never cross (NS-01-R28; no audio upload). P2's export holds P1's letters as the book shows them, never transcripts, edits or versions (`DELETION_AND_EXPORT_SPEC.md` 4.1).
- The invite sheet (NS-25-R16) is the notice for earlier letters, including a due date (health-adjacent; Q48, MHMDA). The acceptance writes a PRIV-R21 row (`invite_accept`).
- Rec for NS-21 (with `10-reading-and-family.md` C4): the Who can read it row returns while an invite is pending, not only after a second adult joins, so a parent can make letters private before anyone else can read them.
- Fact: the invite message names the child (`apps/mobile/src/lib/family/share-text.ts:8`), while the policy says an invitation "names the parent who sent it" (`privacy-policy.md:90`). Rec: the founder PR says the message also carries the child's name (OQ-S9 in `security.md` keeps the message as built).
- Unverified: that P1's phone drops P2's purged letters at its next pull after P2 deletes the account (DSR-R07); `sync` owns the two-phone test.

### 1.4 Earlier versions (NS-12)
- Fact: every prior `final_text` is kept server-side by trigger, author-only by grant design (`security.md` K-4: the RPC check is the control); nothing on the phone reads it.
- The list RPC may return the text-group columns a faithful restore needs (eval A S5; `data-and-sync.md` S5; restore as an ordinary `text` edit, `08-keeping.md` section 6): they are the author's own L4, already on the author's phone for the current version, and reach no other reader. Never `superseded_by` (an L3 person id). No local cache table: memory for the open letter only, so nothing lands in the iPhone backup or the recovery export (agrees with eval A s2.5 and `08-keeping.md` section 6).
- OQ-P4 (`data-and-sync.md`): extending `entry_versions` with `edit_level` (L2), `author_edits` and `locked_spans` (L4) is acceptable to privacy, on two conditions: the remove RPC deletes the whole row, and versions written before the extension stay view-only (eval A R5).
- Remove (D8) deletes the row at once; the 31 and 38 day clocks cover backups. Under a legal hold, refuse with a plain line (`security.md` OQ-S7; Q51).
- Ruling on export (the card's OQ, `data-architect` with `privacy`): the author's export carries the author's own versions as `history/<entry_id>.json`, as the spec already promises (`DELETION_AND_EXPORT_SPEC.md` 4.2) and DATA_CLASSIFICATION section 2 requires ("Author exports all of their own L4"). Fetched at export time when signed in, in its own export minor; offline, the README says versions were not included. Default if `data-architect` disagrees: the card's default (not exported), and the spec line goes to the founder as a BL-868-style fix.

### 1.5 Seals (NS-06 Part B)
- All three columns L4, author row only, never logged (they state the sealing zone's offset). Privacy prefers B10.1 option (b), as the card and `security.md` 3.6 do: no `service_role` reader of the seal columns and no write to the author's row.
- D6 holds; the delete-account sheet says hidden letters go too. Export: author only, 1.8.0. "Hidden, not locked": not end-to-end encrypted, and we could read it (`privacy-policy.md:55`); the honest-limit line is a claim (Q43).
- The author's iPhone backup and new phone carry the sealed words to the author's devices only.

### 1.6 Backup (NS-08) and the iPhone backup
- iPhone backup today holds recordings, `scribe.db` (words, Find index, picture rows), pictures (CR-62 item 7 default) and settings. Excluded: models, packs, NS-37 copies, caches and temp files (Unverified: per-file exclusion of the copies through `ScribeFiles.setExcludedFromBackup`, `modules/scribe-files/index.ts:11`).
- No line tells the parent that pictures are in the iPhone backup (CR-62 item 4); the line lands with the `production` flag (section 2).
- Owner backup: no pictures (item 6 default). At the flip: Audio Data collected (section 3), X2, the `backup_consent` PRIV-R21 row, withdrawal per D12, Q45 for a baby's voice.
- Sign-out keeps the book (D1); Erase everything is the deletion control and says so.

### 1.7 Share (NS-05)
- Level 1 ships text only (Karma's framing; `10-reading-and-family.md` C7, PRs 1 and 2). The picture PR is built behind both reads; when built, as R5b, R6a, R6b, R10a to R10c, plus the sha256 equality check (`security.md` 3.3). The temp file sits in the app's Caches share folder (C8), swept at launch and by Erase everything (NSC-08).
- Residual: a share extension, including an AI app, receives the words by the parent's choice; no copy claims control.

### 1.8 Pictures (NS-01): built, and the rows still open
- Built in the stack: the strip, temporary-copy removal, every eraser (let-go draft wired at #839), the launch sweep, folder erase, no sync key.
- Open, with their design: R14 export (BL-933 after BL-868; CR-62 item 3); R31 deletion text and R32 where-it-lives lines (CR-62 item 4; BL-865); R61 write-deny (NSC-11); R50 writing tools (NSC-05, `09-capture.md` K3); label wording (section 3); the inventory rows (section 4).
- Hardening from my #836 review, not blocking: a segment allowlist in `strip.ts`; pin the `carriesMetadata` guard with probe Q5; adopt probes P2, P5 (30-day purge), Q2 (erase order) and P9 (a signed-in draft with a picture queues no media key).

### 1.9 Recovery export, Find and NS-17
- Fact: the launch recovery screen's ZIP copies `scribe.db` and its WAL and journal as they sit (`apps/mobile/src/lib/resilience/recovery-export.logic.ts:1-4, 34`). It therefore carries the Find index, `entry_media` rows (photo words, place), seal pairs and any withheld NS-17 output, but no picture file. It is the parent's own file, the same exposure as the words, and it has no inventory row today. Rec: state it truthfully (section 4) instead of changing the code.
- Rec: an `optimize` within 24 hours of a removal, then `wal_checkpoint(TRUNCATE)` (`security.md` 3.2), so removed words leave the file before a recovery export or a backup copies it.
- NS-17: I support `09-capture.md` section 7: a flagged take is never pushed until it has typed words, and the withheld output is erased when the take is kept (minimisation beyond D10). For a take whose words reached the server before the mark, the privacy requirement is the same either way (eval A S3, or `held.discard` then a wordless upsert, `data-and-sync.md` C8): the server holds no machine output after the next acknowledged sync, and backups drop it on the 38-day clock.

### 1.10 Two findings from finished designs (Karma, 20 Nov)
- **Second account (NS-10-R3, `[X4-R1]`).** Fact: with a local book the gate opens Tonight whoever is signed in (`apps/mobile/src/lib/first-run/gate.logic.ts:123-125`), and `takeOwnership` only refuses to sync on a mismatch (`apps/mobile/src/lib/sync/ownership.ts:49`). So account B reads account A's letters, child data and, once photos ship, pictures. Rec: the gate compares the signed-in id with `sync.owner`; on a mismatch it hides A's book from every surface and offers sign-out (`08-keeping.md` K8, OQ-5 default; NSC-03). Risk: this holds in any build with sign-in on; privacy asks for the fix and its test before the next store candidate (OQ-F10).
- **Consent retry (NS-10-R7, PRIV-R21).** Fact: `recordConsent` mints a new idempotency key per call (`apps/mobile/src/lib/auth/consent.ts:117`), so a retry after a lost answer writes a second acceptance row. Proof of consent must be one row per act. Rec: one key per (step, answer), made when the step mounts and reused on retry (BL-978a, `08-keeping.md` 3.2); no server change. Consent implementation is mine: `privacy` takes lens B on that PR.

## 2. Consent and notice

No card adds a new consent except NS-08 at its flip (`backup_consent`) and NS-25 (`invite_accept`, built machinery). Settings, picks and marks write "Records: on the phone only; no PRIV-R21 row" (X12). Privacy Policy edits are founder-owned (`docs/legal/**`, D-125); `legal` drafts, counsel reads. Each policy line uses the policy's own build preamble pattern (`privacy-policy.md:17-25`: a part "takes effect only when the feature it describes ships"), so it stays true with the switch off.

| Card | New PRIV-R21 consent | In-app notice (existing keys to recheck; new keys PROPOSED) | Privacy Policy change (founder) | Truthful with the switch off |
|---|---|---|---|---|
| NS-01 | No (picking is an act) | Recheck `whereLive.onPhone`, `whereLive.onPhoneSynced`, `whereLive.iphoneBackup.body`, `settings.privacy.keptOnPhone`, `.keptSynced`, `.iphoneBackup`, `settings.recordings.onPhoneBody`, `.onPhoneBodyBackupOff` (ADR 0028 D1), `pages.en.ts:240`; new `photosCopy.whereLive.onThisPhone`, `photosCopy.whereLive.iphoneBackup`, `photosCopy.account.otherPhonesKeepPictures` (R31), `photosCopy.signOut.pictures` (D1 sheet) | Section 2: pictures stay on the phone that added them and in its iPhone backup, never on our servers; section 7: export includes pictures (after BL-868); ":45 we do not collect photos" stays true while R15, R26, R61 hold | Picture clauses render when the flag is on or any `entry_media` row exists (a remote pause hides surfaces, not files) |
| NS-02 | No | None new | None (the index is a copy of words already described) | n/a |
| NS-05 L1 | No (parent's act) | `share.preview.title`, `share.preview.wordsAlwaysGo`, `share.preview.versionSmallFixes`, `share.preview.versionExactly`, `share.preview.whereItGoes` (card section 16 intent) | Section 5: a letter you send goes from your phone's share sheet; we do not see it or where it went | Preamble pattern; flag off draws nothing |
| NS-06A | No | Labels only | Section 2 "Your letters" adds marks and words you add to a letter | Conditional wording |
| NS-06B | No (a setting) | `seal.sheet.onlyYou`, `seal.sheet.honestLimits` (west-of-zone evening, clock set forward, hidden not locked), `account.delete.hiddenLettersGo` (D6) | Section 3: a letter you hide until a day is not shown to your co-parent until that day; section 7: it is deleted with your account | Preamble pattern |
| NS-08 | Flip: yes, `backup_consent` | Today: NS-08-R7 claims check, R8 keep-safe line; flip: `backup.sheet.otherVoices` (recordings may hold other people's voices) | Section 4 is drafted and stays behind its preamble (`:23`) | Today nothing claims backup (R7) |
| NS-09, NS-17 | No | BL-925 line, Storage line; reuse `languageCopy.waitingForLanguage` | None | n/a |
| NS-10 | Re-consent (existing) | `newPhoneLine` (card name, PROPOSED) | None | n/a |
| NS-11 | No | `export.copy.asPrivateAsWhereYouPutIt` | None (section 7 export line exists) | The Me row works with the slip flag off |
| NS-12 | No (D8) | `versions.keptUntilRemoved` (R7) | Section 2 names earlier versions (owed today, Conflict F-3); section 7: you can remove one, and it leaves backups within the clock | The gap exists with the switch off, so this line does not wait for the flag |
| NS-13, NS-32 | No (settings) | `notifications.previewPlaceholder` (`09-capture.md` 1.3) | None | n/a |
| NS-16 | No (D9) | `signAs.instruction` ("Ask before you record someone else", intent) | Sections 2 and 3: a letter can carry another person's name, words and voice; the co-parent sees the name | Lands with the `production` flag |
| NS-18 | No (setting) | `typedDays.showWords` | Section 2 ":45 reminder times stay on your phone" adds words you type for a reminder; section 5 adds "shown on the lock screen only if you turn it on" | Conditional wording |
| NS-25 | Yes, `invite_accept` (built) | `invite.sheet.whatIsShared` (R16) | Section 3 exists; ":90" adds that the invite message carries the child's name (1.3); recheck against Q48 | Alpha only (D-162) |
| NS-04, NS-06C | No | Doorway labels | Section 6: Apple handles a Siri phrase under its own terms, if one ships | Conditional |
| NS-03 | Research consent, founder's store (no PRIV-R21) | n/a | None | n/a |

## 3. App Store privacy label

Rule: the App Store Connect answers, `docs/legal/app-store-privacy-labels.md` and `PrivacyInfo.xcprivacy` (`apps/mobile/src/lib/privacy-manifest.ts` `collectedDataTypes`, pinned by `apps/mobile/test/privacy-manifest.test.ts`) change in the same build as the behaviour, never before or after (00 section 7; PRIV-R18). When: the founder's D-id and the label file edit merge before the release candidate tag `ios-v<x.y.z>-rc.<n>` of the first build whose `production` profile turns the flag on; the answers are entered in App Store Connect before submission; gate G5 and the G11 guard check both.

| Card | Answer affected | Decide by |
|---|---|---|
| NS-01 | None while R15, R26, R61 hold. Wording only: "Photos or Videos ... No photo feature in v1.0" (`app-store-privacy-labels.md:54`) becomes "pictures stay on the phone"; the checklist "No photo picker" (`:127`) becomes "no photo-library permission; PHPicker only"; permission row (`:117`) stays true | The candidate that turns `EXPO_PUBLIC_PHOTOS` on in `production`; counsel Q43, Q54 |
| C-32 (parked) | Photos or Videos: Yes, linked | Before any design |
| NS-02, NS-06A, NS-07, NS-09 to NS-13, NS-17, NS-18, NS-21 to NS-24, NS-32 to NS-37 | None (on the phone, or User Content already declared) | n/a |
| NS-05 | None at Level 1 or Level 2 (the parent's share sheet is not "collect", label section 1). Level 3: Audio Data Yes (Conflict P-3) | Level 3's build |
| NS-06B | None by default. Counsel decides whether the stored offset is Coarse Location (Q54, Q20) | Before the seal build's candidate |
| NS-06C | Per doorway, from NS-04 findings (`Label delta:` lines) | The doorway's candidate |
| NS-08 | Flip: Audio Data Yes; Device ID Yes if `backup_devices` exists (Q54(a), (b)) | The flip candidate (NS-08-R4 drafts the delta) |
| NS-16 | No answer changes: Name and Other User Content are already Yes and linked (`:45`, `:57`); the "Why" text gains a name the parent types to sign a letter (Conflict P-6) | The candidate that turns the flag on; Q54(f) |
| NS-25 | None expected: option B already declares Name, Email, Other User Content (with co-parent membership), User ID, Sensitive Info (`:45-60`). Re-run at the build (Q54); the age-rating "social" answer is the CCO's | The candidate that turns co-parent on in `production` |
| NS-26 | Push tokens: Other Data or none (Q54(d)) | Before design |
| NS-28, printed NS-30 | Audio Data Yes | Before design |

## 4. Data inventory changes: one list, one founder PR

Rec: one founder-merged PR, `docs/legal: new-scope inventory` (BL-960 on #846, owner `privacy` with `data-architect`; `data-and-sync.md` calls it I1; lens `compliance-engineer` and `data-steward`), carrying every row below with a status, so each later code PR changes only a status word in the same founder route. It folds the photo rows split out of #836 (branch `docs/photo-inventory-rows` at `47c1467f`, no PR yet) and #799's Find row, and supersedes both. It also brings `data-policy.md` section 4 to current facts first (X2; NS-36-R6). Rows describing unbuilt features say "Planned (card, flag)".

Bring current first (BL-960 problem line): `data-policy.md` 1.2.0 still says no audio leaves the phone in v1.0 and calls backup "planned" (4.3 backup audio row, 4.4 audio row). Fact: the backup tables and the `entry-audio` bucket are in a migration on develop (`supabase/migrations/20261023000000_backup_server.sql:677`), with `EXPO_PUBLIC_BACKUP` off in every profile. The rows say "bucket and tables exist; empty while backup is off". I confirm `data-and-sync.md`'s assumption: tables with no rows collect nothing, so the label rows stay No while the flag is off (label section 3.4).

`DATA_CLASSIFICATION.md`:
1. 4.5 header: `migrations.ts` "version 4" becomes "version 11" (stale since version 5).
2. 4.5 `entry_media`, as on `docs/photo-inventory-rows`: id L2; entry_id, draft_id L3; kind, ext L2; bytes L2; width, height, added_at L2; sha256 L4; photo_text L4; place L4.
3. 4.5 Find: `letter_search.body`, `.extra` L4; `letter_search_rows.entry_id` L3, `.row_id` L2; settings `find.dirtyAt` L2, `find.secureDelete` L2 (the card's L1 is wrong: flags are L2, section 1).
4. 4.5 settings keys: `discard.failures.<draft id>` key L3, value L2; `newPhoneLine.dismissed` L2; `copySlip.<child id>.<year>` key L3, value L2; `reminders.onSince` L2; `typedDay.<date>` key and value L4, `typedDay.showWords` L2; `home.pastLetters`, `home.pastLetter.dismissedOn` L2; `signAs.recent` L3; `seal_watermark` per book L2 (option (b)).
5. 4.5 local columns (Planned, with their migrations): `drafts.author_signs_as` L3; the withheld flag on `drafts` and `entries` L4 and the `withheld_words` table L4 (names per `data-and-sync.md` L15 or eval A row 15, whichever lands); `entries` and `drafts` `first_mark` L3, `first_label` L4; `entries` and `drafts` seal pair and `entries.seal_cleared_at` L4.
6. 4.3 planned server columns: `entries.first_mark` L3, `first_label` L4; the three seal columns L4; `held_drafts.words_withheld` L4; `entry_versions.edit_level` L2, `author_edits`, `locked_spans` L4 (if OQ-P4). Their migrations add `first_label` and the seal columns to `mustBeL4` in `supabase/tests/classification.test.mjs:24`.
7. 4.4 `entry-photos`: "Live, private; client insert and update dropped (BL-870)" when NSC-11 merges.
8. 4.1 `author_signs_as` note: may hold a non-user's name (NS-16); L3 by rule 3.
9. 4.6 files: the pictures row and the picker caches row (branch); `<media_id>-512.jpg`, `<media_id>-1280.jpg` L4, excluded from backup; the share temp in Caches L4; the printable PDF temp L4; the recovery export ZIP L4; "Photos, cached book audio" qualified as "Synced photos (planned)" (branch).
10. 4.7 analytics: no new property in the 1.0 line (D-124). `media_added`, `book_search_used`, `letter_share_started`, `capture_started` wait for v1.1.

`data-policy.md` section 4:
11. 4.1 `entries.photo_path` (`:90`): "always null; refused by `entries_15_photo_closed` (`SCPHO`) once BL-870 merges".
12. 4.1 planned columns (`:91`): `sealed_until` becomes `seal_opens_at`, `seal_opens_on`, `seal_cleared_at`, class C, Planned (NS-06B, ADR 0028 D3a); add `first_mark` (A) and `first_label` (C), Planned (NS-06A).
13. 4.1 `entry_versions` (`:92`): reason adds "read and removed by the author once NS-12 ships (D8)".
14. 4.1 `entries` metadata: `author_signs_as` may name another person (NS-16).
15. 4.3 `entry-photos` (`:123`): status as row 7.
16. 4.4 pictures row and the iOS backup row, as on the branch (my #836 notes already applied); recheck "the draft is let go" against #839 at merge (wired there).
17. 4.4 Find row from #799, amended: inside the database file, so in the iPhone backup and the recovery export ZIP.
18. 4.4 new rows: NS-37 copies; the recovery export ZIP (recordings and the database files as they sit; no picture file); typed-day words (C; phone settings and the iOS pending list; deleted the day after delivery); scheduled notification bodies (A; C with names or typed words); names-used list (A); withheld machine output (C, phone only); share temp and PDF temp (C, transient).
19. 4.4 iOS backup row: adds the Find index and settings with the database, and the exclusions (NS-37 copies, caches, temp files).
20. Section 6: "earlier versions until the author removes one or the letter is purged".
21. Optional section 4.7, research and testing outside the product: pilot rows (NS-03 section 14), hand-sent measures (00 section 3, D5), device evidence (D13: Asha only). OQ-F7.

### 4.1 Levels confirmed or corrected (eval A s1.3 and s1.6; `data-and-sync.md` OQ-P2 to OQ-P4)

| Data | Eval A or data-and-sync says | Ruling | Reason |
|---|---|---|---|
| Stored copy, list and page copies, temporary copies; `sha256`, `photo_text`, `place` | L4 (eval A s1.6) | Confirmed | A child's image and the parent's words; a hash of L4 is L4 (R2) |
| `entry_media.entry_id`, `draft_id`; `letter_search_rows.entry_id` | L3 (eval A s1.6) | Confirmed | Letter and draft ids (R5); my #836 ruling |
| `entry_media.id` (the media id, also the file name) | L2 (`data-and-sync.md` L11) | Confirmed; eval C s4.2 item 3 calls it L3 (Conflict P-8) | An internal id of a record under a letter, like a version id (R5); file paths are still never logged (NS-01 section 11), so eval C's rule stands on that ground |
| `entry_media.kind`, `ext`, `bytes` | OQ-P2, default L2 | L2 | Enums and sizes are L2 (section 1, `entries.kind`, `audio_bytes`); L1 is for public data |
| `letter_search.body`, `.extra` | L4 (eval A s1.6) | Confirmed | Derived from L4 (R2) |
| `find.dirtyAt`; `find.secureDelete` | L2; L1 (eval A s1.3; `data-and-sync.md` K10, K11) | L2 and L2: `find.secureDelete` corrected (Conflict P-7) | A flag about this phone's database is operational (L2), not public |
| `first_mark`; `first_label` | L3; L4 (eval A s1.6) | Confirmed | The mark says something about the child that is not content (L3); the label is free text (R3) and may be a health fact (Q32) |
| Seal pair and `seal_cleared_at` | L4 (eval A s1.6) | Confirmed | CR-62; a chosen day can state a birthday (R6) and the instant states the zone offset |
| `seal_watermark` | L2 | Confirmed | A server statement time; no content, never data (eval A s2.5) |
| `words_withheld` (eval A) or `language_withheld` (`data-and-sync.md` L15), on phone and on `held_drafts` | L4 | Confirmed | It states that the take was in another language: rule 2 lets a reduction of L4 languages drop only after review, and I do not drop it; author-only, so L4 costs nothing |
| `withheld_words.*` | L4 | Confirmed | Machine output of a parent's voice (R2) |
| `entry_versions.edit_level`; `author_edits`, `locked_spans` | L2; L4 | Confirmed (OQ-P4 conditions in 1.4) | Enum; edits and spans derive from L4 words (R2) |
| `drafts.author_signs_as`, `signAs.recent` | L3 | Confirmed | Capped names (R3), including a non-user's (1.2) |
| `typedDay.<yyyy-mm-dd>`; `typedDay.showWords` | L4; L2 (eval A s1.3) | Confirmed; the key's date is L4 too | A chosen day can be a birthday (R6), as for `seal_opens_on` |
| `discard.failures.<draft id>`; `copySlip.<child id>.<year>`; `reminders.onSince`; `home.*`; `newPhoneLine.dismissed` | L3 key and L2 count; L3 key and L2 value; L2; L2; L2 | Confirmed | Keys holding a draft or book id are L3 (R5) |
| OQ-P3: `language` and `words_reviewed_at` outside the content-consent tuple | default yes, gate them | Yes | PRIV-R08: every synced write that is not a deletion passes the server consent gate (deletions never do, PRIV-R09); `language` is S (`data-policy.md` 4.1); a named exemption list is a drift risk |

## 5. Privacy controls each design includes, and the tests that prove them

The J-N18 field list (`security.md` NSC-06 asks for it). Canary values that must appear in no log, breadcrumb, crash report, analytics event, URL, route, push payload, error message, email or support prefill: photo words, place, picture path, file name and sha256; the Find query and snippets; Firsts label; typed-day words and dates; the From name and names list; withheld output; seal dates and instant; version text; share payload; export and PDF file names and paths; child name; an entry id beside a path; invite tokens. Sinks as eval C s4.2 item 6 sets them (a `console.*` spy, every logger sink, router params, the content passed to `expo-notifications`, `Error.message`), plus analytics and crash payloads; the server half is the existing `canary.test.ts` behind `supabase/functions/_shared/log/log.ts`. I agree with eval C s4.2 items 1 to 5 (closed code sets, no paths or ids in logs, diagnostics counted locally only). Harness BL-862 (#759 draft); `qa` owns it.

| Control | Cards | Test (existing file, or new title) | Owner |
|---|---|---|---|
| Erase every new store on every path: letter, book, other phone, let go, purge, Erase everything, account deletion | NS-01, 02, 06, 09, 12, 16, 18, 36, 37 | `apps/mobile/test/erase-all.test.ts` extended per store; `[NS-36-R1a]` to `[R1c]`; probes P2, P5, Q2 adopted; `[NS-12-R6]`; `[NS-06-B18]`; `[NS-16-R15]`, `[R16]` | `mobile`, `sync` |
| Erased words leave the file | NS-01, 02, 06A, 18 | `erase-all.test.ts:628` gains photo words, place, label, typed day, index rows; checkpoint after `optimize` | `mobile` |
| Sign-out keeps the book; session end clears the account's settings | NS-08, 13, 16, 18 | `[NS-08-R6]`, J-N21; `test/reminders-session.test.ts` (`09-capture.md`) | `mobile` |
| Second account sees nothing of the first | all stores | `[X4-R1]` (NSC-03), one test over Book, Find, lens, share, seals, versions, names list, slips; `[NS-10-R3]` gate test: a mismatched owner never opens Tonight on A's book (red on `gate.logic.ts:123-125` today) | `mobile` |
| One consent row per act | NS-10, NS-25, NS-08 flip | `[NS-10-R7]`: a retry after a lost answer reuses the key and leaves one `policy_acceptances` row (red on `consent.ts:117` today) | `mobile`; lens B `privacy` |
| Export holds every part, one way | NS-01, 06, 12, 16, 36 | `[NS-36-R2]`, `[R5]`, `[R7]`; `[NS-01-R14]` with the metadata scan over export bytes; `[NS-06-B5]`; `[NS-12-R9] the author export carries own versions` (new, PROPOSED id) | export owner |
| Nothing leaves the phone | NS-01, 02, 05, 16 | `[NS-01-R15]` via probe P9; `[NS-05-R9]`; J-N10 airplane; `[NS-16-R4]`; `supabase/tests/photo_bucket_closed.test.mjs` (NSC-11) | `mobile`, `sync` |
| No content in logs and errors | all | J-N18 with the list above; `[NS-36-R12]`; closed error-code sets | `qa` |
| Analytics off through 1.0 | all | `apps/mobile/test/analytics-off-v1.test.ts` unchanged; `preflight-production.mjs` | `analytics`, `ops` |
| No donation, no writing tools | NS-01, 02, 05, 06, 16, 18 | `[X6-R1]` (NSC-04); NSC-05 per field | `qa`, `mobile` |
| Temp files gone | NS-01, 05, 07, 11 | `[NS-01-R52]`, `[NS-05-R10a]` to `[R10c]`, `[NS-11-R23]`, C28-12 (NSC-08) | `mobile` |
| Levels pinned | every new column | `classification.test.mjs` `mustBeL4`; a phone check that every `migrations.ts` column comment starts `L1` to `L4` (ADR 0028 asks `qa`) | `qa`, `data-architect` |
| Label and manifest match the build | every candidate | `privacy-manifest.test.ts`; G5; G11 | `compliance-engineer` |
| Recovery export says what it holds | NS-02, 01, 17 | `[NS-02-R31]` scoped to the family export and owner backup; a new test listing the recovery planner's folders, matched by the row 18 wording | `mobile` |

## 6. Questions for the founder and counsel (defaults in force until answered)

Founder (D-125 legal merges; delegated defaults stay reversible):
| Id | Question | Default |
|---|---|---|
| OQ-F1 | CR-62 item 7: pictures in the iPhone backup | Yes, as built (NX-39 F9) |
| OQ-F2 | CR-62 item 6 (ADR 0028 Q4): owner backup carries pictures | No; needed by the Build 13 freeze |
| OQ-F3 | CR-62 item 3: merge BL-868 (`DELETION_AND_EXPORT_SPEC.md:335`) before BL-933 | Merge it first; the export PR waits |
| OQ-F4 | CR-62 item 4: approve the picture lines (policy section 2, in-app keys, section 2 above) | Lines land before the `production` flag; counsel reads |
| OQ-F5 | NS-05 Level 1: text only until both X2 reads are on record | Yes |
| OQ-F6 | X2 scope: our sending features, not the parent's own export | As 1.1 |
| OQ-F7 | Research and testing data as `data-policy.md` 4.7 | Yes |
| OQ-F8 | One inventory PR per wave under the paired-PR rule (K-2) | No change until the founder approves: until then each PR that adds a stored key or column carries its own inventory row in the same PR (PRIV-R01, NS-36-R6), and the founder merges that PR |
| OQ-F9 | Name earlier versions in the Privacy Policy now (F-3) | Yes, in the next policy PR |
| OQ-F10 | A second account on a phone that holds the first account's book (1.10; `08-keeping.md` OQ-5) | Hide A's book and offer sign-out; fixed and tested before the next store candidate |

Counsel (packet 1.5.0 ids; `legal` numbers new ones through `next-id`):
| Id | Question | Default |
|---|---|---|
| OQ-C1 | Q45: a child's picture leaving by the parent's share sheet (NS-05, NS-03 Arm W); a child's voice (Arm V, NS-08 flip, NS-28) | Same as Export for the share sheet; nothing hosted |
| OQ-C2 | Q48: another adult in a picture, as a speaker (NS-16), in a label, or as co-parent at invite (one consent naming the co-parent) | As the cards; NS-16 flag off |
| OQ-C3 | Q54(f), proposed: a typed name of a non-user | No answer change (section 3) |
| OQ-C4 | Q48 with DSR-R04: a non-user asks us to delete their words or voice | Forward to the account holder; no edit by us |
| OQ-C5 | Q54 with Q20: the seal's stored UTC offset as Coarse Location (CR-62 item 2) | Not a Location row |
| OQ-C6 | Q51: removed versions in backups for 7 days; typed-day words not exported; pilot consent 12 months, notes 30 days | As written |
| OQ-C7 | Q43: "Pictures stay on this phone", "hidden, not locked", the share where-it-goes line, "as private as where you put it" | Read before each flag in `production` |
| OQ-C8 | Q50, Q49: a letter hidden from the other parent; fiduciary access to sealed letters | As NS-06 B12, B17 |
| OQ-C9 | New: "open at 18" and any duty to a minor (NS-06 B17) | No such wording |
| OQ-C10 | Q32: health detail in a Firsts label or an earlier version | Treated as letter content (L4) |

## 7. Conflicts

For product (card gaps):
- **P-1** NS-05 section 3 gates the Level 1 picture on counsel Q45 alone; 00 section 7 needs both reads for a child's picture. Same as `security.md` K-1 and `10-reading-and-family.md` C7; Rec: text first.
- **P-2** NS-03 section 0 exempts Arm W ("words and picture") from the security read; 00 section 7 does not, once the file shows a picture. Rec: Arm W sends a letter without a picture until `security-architect` reads it.
- **P-3** NS-05 label effect moves Audio Data at Level 2; a file the parent sends through their own share sheet is not collected (label section 1). Only Level 3 changes it.
- **P-4** NS-17 D10 ("never exported as words"), ADR 0028 D4 and #799 ("not in the recovery export") against the recovery export, which copies `scribe.db` whole (`recovery-export.logic.ts:34`). Rec: say so in the rows; no code change.
- **P-5** NS-12's OQ default (versions not exported), kept by eval A s3 (no bump for NS-12) and `data-and-sync.md` section 4 table, against `DELETION_AND_EXPORT_SPEC.md` 4.2 (`history/<entry_id>.json`) and DATA_CLASSIFICATION section 2. Ruled in 1.4; `data-architect` may hold the default, and then the spec line goes to the founder.
- **P-6** NS-16 section 18 ("possibly yes") against label rows already Yes (`app-store-privacy-labels.md:45`, `:57`); NS-25 section 18 ("changes when it ships") likewise.
- **P-7** NS-02 section 10, eval A s1.3 and `data-and-sync.md` K11 class `find.secureDelete` L1; flags are L2 (DATA_CLASSIFICATION section 1). Corrected in 4.1.
- **P-8** Eval C s4.2 item 3 says `photos/<media_id>.jpg` "holds an L3 id ... per BL-959"; BL-959's scope is the letter and draft ids only, and the media id is L2 (4.1). The rule it supports (no path or id in a log) is right and stays.

For Karma (engineering):
- **K-1** NS-36-R4 wants the X10 L3 fix in ADR 0028; ADR 0028 on develop still says L2 (`:34-35` for `entry_media`, `:184` for `letter_search_rows`). DATA_CLASSIFICATION is the authority (`:28`) and #836 fixes migration 11's comment. Rec: BL-959 (`data-architect`, on #846) amends the ADR in one line pointing to DATA_CLASSIFICATION, so R4 can count (same as `data-and-sync.md` CK4).
- **K-2** DATA-REQ-001 (P0) and NS-36-R6 want inventory rows in the same PR as the code; `docs/legal/**` is the founder's merge (D-125, D-132). Rec: a paired-PR rule: the code PR links its inventory PR, and no `eas.json` profile turns the flag on, and no build carries an unconditional local migration (CR-64), before that inventory PR merges.
- **K-3** `11-foundations.md` NS-36 rule 5 plans `local-classification.test.ts` to fail on "an id column below L3"; `entry_media.id` (the media id) is L2 by rule 5 (4.1), so the test would fail on a correct level. Rec: the test fails on a letter, draft, book or person id below L3 (R4, R5), and allows a record's own id at L2.
- **K-4** `data-and-sync.md` L15 and eval A row 15 name the withheld flag differently (`language_withheld`, `words_withheld`); the inventory uses whichever lands. Neither design yet says the recovery export carries `withheld_words` (P-4).

For the founder (docs/legal):
- **F-1** `privacy-policy.md:21` says the first App Store build has servers off; `app-store-privacy-labels.md:84` says Build 12 `production` has servers on. Any policy PR above fixes the preamble first.
- **F-2** `privacy-policy.md:90` says the invitation names the parent; the message also names the child (`share-text.ts:8`).
- **F-3** Earlier versions are kept on the server today and the policy does not name them (`:35`).

## 8. Not verified
- Anything on a phone: per-file backup exclusion of the NS-37 copies; Caches excluded from iCloud backup; FTS5 `secure-delete` in SDK 57's SQLite; WAL residue after `optimize`.
- That P1's phone drops P2's letters after P2's account deletion (1.3); that a purged account's session ends on a phone that never taps Sign out (`09-capture.md` 1.3).
- Whether `settings` keys live in `scribe.db` or another store on every path (it decides what the recovery export carries).
- Apple's label definitions were not re-read this session (label section 1 read 15 Oct 2026); every Apple fact is re-read before submission (Compliance standing rule).
- Counsel answers: none exist; every legal reading above is a question.

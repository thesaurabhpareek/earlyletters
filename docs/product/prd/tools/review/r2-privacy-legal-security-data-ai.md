# Executive council review: Early Letters requirements pack (VISION, 00 to 14), cards NS-01 to NS-37

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

All six reviewers below are Claude roles, not lawyers, auditors or regulators. This was a read-only review. I edited, committed and pushed nothing.

## What I read, and what I did not

**Repo files (read in full):**
- `origin/develop` at `697233d35` (#829).
- The six skills, `COUNCIL.md`, `CLAUDE.md`, `docs/legal/data-policy.md`, and `COUNSEL_PACKET.md` 1.5.0 (Q1 to Q57).
- `COORDINATION.md` section 10 and the RR rules (`docs/prd/v2/11-...`).
- `VISION.md`, PRD files 00 to 15, the README, and ADR 0023.

**ADR 0028 is not on `develop`.** I read it from branch `origin/docs/adr-photo-seal-find-data-11nov` at `1bee878b9`. Its status there is "Proposed", amended three times on 19 Nov.

**Code and records I checked to test claims in the cards:**
- `apps/mobile/src/lib/auth/session-provider.tsx` (sign-out)
- `packages/api/src/server/sync.ts`
- `supabase/migrations/20260930000000_scribe_core.sql` and `20261002020000_data_governance.sql`
- `apps/mobile/src/lib/export/schema.ts`
- `docs/engineering/07-privacy-engineering.md` (PRIV-R02/09/10/20/21)
- `DATA_CLASSIFICATION.md` 1.1
- `ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-012/013
- `DECISIONS.md` D-157 to D-160. D-161 and D-162 are not on `develop`.

**No outside source was read this session.** That covers law, Apple pages and vendor pages. Every legal or Apple statement below comes from the repo's own record, is UNVERIFIED by me, and counsel must confirm it.

**Marks used:**
- **M** = must-fix before the card is locked.
- **S** = should-fix.
- **F** = needs a founder decision; a recommended default is given.
- Packet numbers refer to `COUNSEL_PACKET.md` 1.5.0.

---

## 0. Cross-cutting findings (these apply to many cards; each card below points back to them)

**X1 (M). Counsel numbers in the cards are from packet 1.0.0, not 1.5.0.**
Replace these:
- "Q4" or "Q4(b)" becomes **Q45**.
- "Q2" becomes **Q48**.
- "Q29" becomes **Q49**.
- "Q27" becomes **Q50**.
- "Q13" and "Q26" become **Q51**.
- "Q1" becomes **Q47**.
- "Q7" becomes **Q54**.

Where they appear: 00 section 7; NS-08 legal inputs; NS-16 ("packet Q2", "packet, COPPA section"); NS-25 (Q29, Q2); 13 plan (NS-16, NS-25 gates).
15-council-review already admits that the new counsel questions are "not yet in COUNSEL_PACKET.md". The `legal` lane adds them under the numbers mapped in section 2 below.

**X2 (M). The inventory home is stale.**
- NS-36-R6 points at `data-policy.md` section 4. That file is 1.2.0. It still says "No audio leaves the phone in v1.0 (D-059)" and calls backup "Planned, later than v1.0". The packet itself lists it as an unfinished S17 follow-up.
- Add to NS-36-R6: "Each row lands in the same PR in both `docs/legal/data-policy.md` section 4 (class, owner, retention, reason, status) and `DATA_CLASSIFICATION.md` (column level). Before the first row lands, `privacy` with `data-architect` brings data-policy section 4 to Build 12 facts (D-100, D-157, D-159; bucket `entry-audio`), or the PR names `DATA_CLASSIFICATION.md` as the interim inventory (CDO rule until `data-map.yaml`, PR #37, lands)."

**X3 (M). Device runs touch real family data.**
- `14-test-plan.md` section 5 and NS-04 section 6 run on "the founder's phones", and those phones hold his family's book.
- Add to 14 section 5: "Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, screen recording, log, perf trace or note carries a real name, letter, picture or voice (CLAUDE.md privacy rules). The `no-real-family-data` test runs on every PR that adds device evidence."

**X4 (M, F). Sign-out keeps the book on the phone.**
- `session-provider.tsx` (around lines 296 to 306 and 325) signs out with `scope: 'local'`, and the code comment says "Letters on the phone stay (local sign-out only)".
- NS-08-R6, NS-10-R3, NS-13-R13 and every RR-5 "second account" row assume something the cards never state: after sign-out, whoever holds the phone can still read the book, including the child's name and recordings.
- **F, recommended default:** keep it as built, because deleting would remove the only copy of the voice while backup is off. The sign-out sheet says (intent): "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Turn on App lock, or use Erase everything to remove them."
- Add a test that a second account (B) never sees, claims or uploads account A's local letters: `[X4-R1]`. ADR 0023 says "sync stops on a mismatch"; the UI side is unproven.

**X5 (M). Every RR-5 table lacks two rows.**
Add these to every RR-5 table:
- **Kill switch:** `serverFeaturesEnabled()` off, and the card's remote pause, at the moment of the action.
- **Plan lapse.**
The tables in NS-09, NS-13 and NS-15 lack both. Full tables are given per card below.

**X6 (M; F for one part). System intelligence and the constitution (CAIO).**
Add to every card that stores a parent's words (NS-01-R21, NS-02, NS-06 A and C, NS-15, NS-16, NS-18, Review), as a Never line: "No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity."
- Test `[X6-R1]`: a source scan finds no `CSSearchableIndex`, no `isEligibleForSearch`, and no `AppEntity` built over letters, children or prompts.
- **F:** may iOS system writing tools (rewrite or proofread) operate on fields whose text becomes a letter's words (the Review editor, the Firsts label, photo text, typed-day words, the "From" name)?
  - Recommended default: off on those fields. A rewrite there would put machine-made words into a letter outside `verifyEdits`.
  - Whether React Native exposes that switch is UNVERIFIED. `mobile` checks.

**X7 (M). The P0 register skips NS-01 to NS-07.**
- 14 section 7 says every unlisted row is P1, so leak rows such as NS-01-R15 are currently P1.
- Add with reason (a)/(b):
  - NS-01-R6, R8, R9, R15, R16, R22, R26 (new)
  - NS-02-R5, R14, R15, R16, R22, R24 (new)
  - NS-05-R3, R4, R5, R6, R12, R16
  - NS-06-A2, A4, A5, B2, B5, B8, C2, C3
  - NS-07-C5-3, C28-2, C28-3
  - every new X-row in this report

**X8 (M). Label-effect lines are missing, so the G11-2 guard fails as written.**
- NS-07-G11-2 scans files whose names start with `0`. Files 00, 08 and 09 have no "Label effect:" line, so the test fails today. Files 10 and 11 start with `1` and escape the scan.
- Change G11-2 to: "every `## NS-` card heading in `docs/product/prd/*.md` is followed, before the next card, by a line starting `**Label effect.**` or `Label effect:`".
- Add the per-card lines given below.

**X9 (M). Columns the cards treat as new already exist.**
- `entries.occurred_on` and `occurred_precision` are synced (field group `occurred_on`, `sync.ts:94,102`) and exported since 1.5.0.
- `entries.author_signs_as` is L3, has `char_length <= 30`, is insert-only (`sync.ts:157`), and is exported as `author.signs_as`.
- `entries.stt_meta` holds per-token timestamps and is synced.
- This rewrites NS-15, NS-16, NS-29 and NS-36-R5 (details per card).

**X10 (S). Classification conflicts in ADR 0028 that the cards inherit.**
- `entry_media.entry_id`, `draft_id` and `letter_search_rows.entry_id` are labelled L2.
- `DATA_CLASSIFICATION.md` rule 5 says "every `entries.id` and child_id" is L3.
- Fix in the ADR before NS-36-R4 counts it as accepted.

**X11 (M). The ADR 0028 acceptance claim needs evidence.**
- 13 wave 1 says "NS-36's ADR accepted (CR-62)". The ADR is not on `develop` and its header says "Proposed".
- NEEDS EVIDENCE: the CR-62 record. Then merge the ADR to `develop` before any card cites it as accepted.

**X12 (S). Non-agreement acts need a plain Records line.**
For toggles, picks and settings, add: "Records: on the phone only. No PRIV-R21 row, because this is a setting, not an agreement." This keeps engineers from inventing consent rows.

---

## 1. Findings by card

### VISION and 00 product frame
- **M:** fix the 00 section 7 packet numbers (X1). "Children": the open edges are **Q45**. "Another adult's words": **Q48**. "Open-ended promises": **Q16** and **Q40**.
- **M, F:** hand-sent tester measures (00 section 3). Inventory row (outside the product):
  - Data: tester identity and the numbers they send.
  - Class: L3 (tester identity), numbers L2.
  - Where: the founder's private sheet, never the repo or a Claude session.
  - Synced: no.
  - Retention: 90 days after the tester round.
  - Deletion: manual by the founder, with a dated note.
  - Export: n/a.
  - Logs: never.
  - F: confirm 90 days (the default).
  - Counsel: **Q44** (tester text) and **Q51**.
- **S:** VISION "Four things must stay true: ... private". Add a claims-inventory row. Text "not end-to-end encrypted" is in Privacy 3 (**Q43**).
- **Label effect.** None (frame only).

### NS-01 Photo with a letter

**M1. Inventory rows** (content from ADR 0028 D1, corrected):

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Picture, stripped JPEG, `Library/Application Support/photos/<media_id>.jpg` | L4, C | phone sandbox; included in iPhone/iCloud backup (no exclusion call, D1) | No: `photo_path` always null; server write-deny (D6, BL-870) | life of the letter; Recently deleted 30 days then purge; draft let go; Erase everything; app deleted | `erasePictureOf` through `eraseAudioFile` (eraseEntry, finishServerErased, eraseBook); folder listing at Erase everything | ZIP `photos/<entry_id>/<media_id>.jpg` (1.7.0) | PRIV-R10; file name, path and hash never logged |
| `entry_media.id` | L2 | phone `scribe.db` | No | as the picture | same transaction | in the path | ids only in logs, never with the path |
| `entry_media.entry_id`, `draft_id` | **L3** (rule 5; ADR says L2) | phone | No | as the picture | as above | yes | never logged |
| `entry_media.sha256` | L4 | phone | No | as the picture | as above | manifest | never logged |
| `photo_text` (140 max), `place` (60 max) | L4 | phone | **No** (see M2) | as the picture | as above | `photo.text`, `photo.place` | canary (J-N18) |
| `kind`, `ext`, `bytes`, `width`, `height`, `added_at` | L1/L2 | phone | No | as the picture | as above | yes | allowed |
| server `entries.photo_path` | L3 (path holds ids, rule 4) | server | always null | n/a | n/a | n/a | n/a |

**M2. Add NS-01-R26** (P0): "Given a letter with photo text and a typed place, When sync pushes, Then the payload carries neither value and no key `photo_text`, `place` or `photo`." Test title: `[NS-01-R26] typed photo text and place never leave the phone`.
- Why: LEGAL-REQ-012 lists "precise or coarse location" as never collected on the server. A typed place is allowed only because it stays on the phone. C-32 (pictures follow the account) would reopen this.

**M3. RR-5 table:**

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Letter reads whole; no picture slot and no message; the picture is never pulled | `[NS-01-R27]` |
| Second account on this phone after sign-out | B sees none of A's pictures and no Photos lens (X4) | `[NS-01-R28]` |
| Sign out | Pictures stay with the letters (local sign-out); the sheet says so | `[NS-01-R29]` |
| Retry after a lost answer | No picture write exists; `photo_path` stays null on every retry | R15 |
| Kill during attach or replace | ADR 0028 D1 kill order; the launch sweep | D1 tests |
| Flag off or remote pause | R19 | R19 |
| `serverFeaturesEnabled()` off | No change; everything is local | R19 |
| Erase everything | Folder listed and deleted | D5 test |
| Account deletion | The server holds no picture; this phone's pictures go when this phone runs the deletion erase; the author's other phones keep theirs until erased there | `[NS-01-R30]` plus content test |
| Plan lapse | R18 | R18 |
| New phone restored from an iPhone backup | Pictures return with that backup; without one, no slot | device |

**M4. Fix a false claim.** `packages/content/src/pages.en.ts:240` ("letters, recordings and photos are removed from every book") is false for pictures on other phones. Rewrite it before photos ship (ADR 0028 D5). This also goes to CCO for Apple 5.1.1(v) evidence.

**M5. Add NS-01-R31:** "Given photos on in any build, Then the keys `whereLive.onPhone`, `.onPhoneSynced`, `.iphoneBackup.body`, `settings.recordings.onPhoneBody`, `.onPhoneBodyBackupOff`, `settings.privacy.keptOnPhone`, `.keptSynced`, `.iphoneBackup` and `privacy-policy.md:37` name pictures" (a content test listing the keys; ADR 0028 D1).

**M6. Door lines.** Add: "Records: nothing about the act. The picture and its row are on this phone only. No PRIV-R21 row (picking is not an agreement)."

**S1. Threat rows:**

| Asset | Threat | Control | Test |
|---|---|---|---|
| Child picture (L4) | A modified client or hostile contributor (A2, A7) uploads to `entry-photos` or sets `photo_path` | Drop the author insert/update policies; trigger `entries_15_photo_closed` refuses with SCPHO (D6) | `photo_bucket_closed.test.mjs` |
| Location in the file | GPS or device data leaks through export or share | Strip at write | R6 byte scan |
| Native picker module | Supply chain (A8) | `security-architect` lockfile and plist review (NX-39-R52) | review record in the PR |
| Snapshot | Lost phone, shoulder (A3) | R13 | R13 |
| Files app exposure | User-visible folder | Application Support, not Documents | `[NS-01-R33]` the path is under Library/Application Support |
| iPhone backup | Apple ID takeover (A4) | Stated plainly in copy; same exposure as recordings | claims row |

**S2. AI.** Add NS-01-R32: "the NX-39-R9 AST scanner runs over `lib/photos` and `modules/scribe-photo`". There is no Vision, OCR, face or scene call. The constitution check passes.

**S3. Children's data.** A child's image provided by a parent goes to **Q45**. A picture of another adult goes to **Q48**. The NX-33 label line goes under **Q43**.

**Label effect.** None while pictures stay on the phone (CPrivO). "Photos or Videos" becomes collected the day C-32 ships (**Q54**; Apple definitions UNVERIFIED this session).

### NS-02 Find

**M1. Inventory rows:**

| Field | Class | Where | Synced | Retention | Deletion | Export | Logs |
|---|---|---|---|---|---|---|---|
| `letter_search.body`, `.extra` (FTS5) | L4 (derived, rule 2) | phone `scribe.db`; **in the iPhone backup** with the database | No; not in the owner backup or recovery export | as the visible letter | terms removed in the same transaction; `DROP TABLE` at Erase everything; bytes gone after FTS `optimize` within 24 h (PROPOSED) | No | never |
| `letter_search_rows.entry_id` | **L3** (ADR says L2) | phone | No | as above | as above | No | never |
| Query | L4 (PRIV-R10 lists "search query") | memory only | No | none | n/a | No | R15 canary |

**M2. Section 7 is misleading.** "It never syncs and is not in the export" must add: "It is in the iPhone backup with the rest of the database, the same exposure as the words. A removed word stays in the file until the next FTS merge (24 hours at most, PROPOSED)."

**M3. Add NS-02-R24** (P0): "no letter text is registered with Core Spotlight, `NSUserActivity` or App Intents, and no embedding or vector index exists" (X6). Extend R14's Never list: "no spelling suggestion, synonym or 'did you mean'".

**S1. Add NS-02-R25:** after A signs out, B's Find returns 0 of A's letters (X4).

**S2. Threat row:** asset is the index. Threat: deleted-segment remnants recovered from a backup or forensically. Control: `secure_delete` plus `optimize`. Test: the ADR 0028 D4 lifecycle tests.

**Label effect.** None. No counsel question.

### NS-03 Family-hears-it pilot

**M1. Counsel.** Add one new packet question ("Concierge research with tester families"; the CLO assigns the next free number through `next-id`). Cross-reference:
- **Q44** (texts for tester families),
- **Q45** (Arm V: we instruct parents to send a child's voice),
- **Q22** (a recipient in another country).
Default as in the card.

**M2. Retention of consent records is unspecified.** Inventory, all outside the product, all in the founder's private store, never in the repo or a Claude session or Project doc:

| Data | Class | Retention |
|---|---|---|
| Code-to-person key | L3 | deleted with the raw notes |
| Consent record (code, arm, yes/no, text-version hash, date, method) | L2/L3 | **F, default: 12 months after the read-out as proof of consent, then deleted** |
| Raw notes | L4 (may mention a child) | 30 days after the read-out |
| Contact details | L3 | 30 days after the read-out |
| Counts | L2 | kept |

Counsel: **Q51**.

**M3. Publish counts only.** The public repo plus a group of 8 to 10 of the founder's friends makes "anonymised short answers" re-identifiable. Change section 3 to: "The read-out in the repo holds counts only; short answers stay in the private store."

**S1. Make "deleted unread" concrete.** Add: "the founder deletes the message from the thread on every device; Messages in iCloud syncs it."

**S2. Threat row:** asset is the pilot log. Threat: it lands in the repo or in an agent session. Control: agents never read it. Test: the no-real-family-data hash test on the read-out PR.

**Label effect.** None (correct as written).

### NS-04 Hands-free spike

**M1. Add NS-04-R6:** "The spike build uses a separate bundle id and a test account holding only Asha; it is never installed over the production app on a phone holding a real book" (X3).

**S1. Add Q11 to the spike questions:** "Does any doorway expose letters, prompts or a child name as an App Intents entity, to Siri, or to Spotlight?" Answer: Yes/No with the entity list. Add a threat row on app-group containers (L4 data readable by an extension process); EX-3 already defaults to no app group.

**Label effect.** None from the spike. Each trigger's line comes in the findings.

### NS-05 Share one letter

**M1. Rewrite R10:** "Given the share sheet completes (sent, cancelled or failed), Then the temporary file is deleted in its completion handler; a launch sweep is the backstop. The file sits in the app's tmp folder with complete file protection and is excluded from backup."

**M2. Counsel line for Level 1.** A picture of the child leaving through the parent's own share sheet goes under **Q45**, with default "same as Export: the parent's own act; we collect nothing". The preview's "goes where you send it; cannot be recalled" line needs a claims row (**Q43**).

**M3. Door lines Records:** "Nothing, on the phone or the server. No PRIV-R21 row. The activity type the share sheet returns is never read, stored or logged." Extend R3's test to assert that.

**S1. R6 file name (CPrivO can rule this alone, since it collects less).** A file named by the letter's date can state the child's birthday (L4, rule 6). Use a fixed name such as `letter-photo.jpg`.

**S2. AI.** No subject string is passed to Mail. Test: `[NS-05-R18] the payload has no subject`.

**S3. Residual risk.** A share extension the parent picks (any app, including AI apps) receives the words. That is the parent's choice. We never claim to control it.

**Label effect.** None at Level 1. Levels 2 and 3 make Audio Data collected and linked (**Q54(a)**, **Q42**).

### NS-06 Part A: Firsts

**M1. New server columns need inventory rows and the four sync changes ADR 0028 lists for seals:**

| Field | Class | Where | Synced | Retention | Deletion | Export | Logs |
|---|---|---|---|---|---|---|---|
| `entries.<first mark>` boolean (name per DB-R01) | L3 (privacy confirms) | server and phone | author's phones; co-parent through `book_entries` only when the letter is visible to them | life of the letter | with the letter | its own export minor (not 1.7.0 unless it ships with photos) | PRIV-R10 |
| `entries.<first label>`, 40 graphemes max | **L4** (free text, rule 3) | same | same; in the Find `extra` column | same | same | same | canary |

**Engineering text to add to the card:** a new field group in `FIELD_GROUPS`, `FIELD_GROUP_COLUMNS` and `ENTRY_DATA_KEYS`; `entrySnapshot` and the merge; a `comment on column` level; a LEGAL-REQ-012 data-map row. Without these, the mark never travels.

**M2. RR-5 table:**

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Arrives at the next pull; the later write wins for the group | `[NS-06-A13]` |
| Co-parent | Mark and label visible only with a visible letter; a private letter shows nothing | `[NS-06-A14]` |
| Offline | Queued, then applied | `[NS-06-A15]` |
| Lost answer | Applied once | `[NS-06-A16]` |
| Server kill switch off | Stays local; syncs when on | `[NS-06-A17]` |
| Sign out | X4 |  -  |
| Plan lapse | Marking and reading still work | `[NS-06-A18]` |
| Delete and restore | A8 | A8 |

**M3. AI.** Add to A1: "the label is never prefilled from the letter's words". Writing tools are off on the field (X6).

**S1.** A "first" can be a health fact. It is already L4 and goes to **Q32** and **Q48**.

**Label effect.** No new data type: User Content is already declared in label 1.4.0. CPrivO confirms.

### NS-06 Part B: The sealed letter

**M1. Align with ADR 0028 D3 and D3a**, which answered the question due Fri 20 Nov:
- **B1:** store `seal_opens_at` (the instant) plus `seal_opens_on` (the chosen day), written once together, plus `seal_cleared_at`, which the server stamps at Open now.
- **B5:** the export carries those three names in **1.8.0**, not `sealed_until`.
- **B8:** the mechanics are `publish_opened_seals()` run by the purge worker. A past instant is accepted.
- **B6:** remove "UNVERIFIED (I did not read ADR 0028 D3)".

**M2. Inventory rows:**
- Three columns, all **L4** (D3, A3).
- On the author-only row. Never in `book_entries`.
- Synced to the author's phones only. `drafts` carry the pair locally.
- Retention: life of the letter. The seal does not extend the 30-day window.
- Export: 1.8.0, author only.
- `service_role` reads them only in the publish job.
- Add them to `mustBeL4` and amend `data-policy.md:91`.
- Logs: never. The instant reveals the sealing zone's offset.

**M3. Door lines:**
- **Shown:** the date control, one sentence on what a seal does, and the honest-limit sentence ADR D3a says `content` *must* word ("in a zone west of where you sealed it, it opens the evening before"; "a clock set forward opens it early on that phone").
- **Records:** the pair at sealing and `seal_cleared_at` at Open now, on the author's own row and phones. No PRIV-R21 row.
- **Never:** a row, marker, count or notification on another person's phone; the letter in Find before it opens.
- **Decline:** do not seal, or Open now.

**M4. RR-5 table:**

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Receives the 3 columns; hides the letter until the instant; opens it at the instant offline | ADR D3 list |
| Co-parent phone | 0 rows before; a normal letter after the republish | B8 |
| Sealed offline, pushed after the instant | Server accepts; open for all at the next pull; the job does nothing | ADR A2 |
| Open now offline | The pair is resent unchanged with the cleared request; the server stamps it; the co-parent gets the letter at the next pull | `[NS-06-B11]` |
| Lost answer | Idempotent (the guard compares values) | `[NS-06-B12]` |
| Server kill switch off at sealing | Seal is local; pushes when on; a passed instant means open | `[NS-06-B13]` |
| Co-parent's clock set forward | Still 0 rows (the server uses its own now) | `[NS-06-B14]` |
| Sign out, then a second account | Stays hidden on the phone; B never sees it (X4) | `[NS-06-B15]` |
| Author deletes the account before the day | **F, default:** the letter is purged with the account and never published. The delete-account sheet says hidden-until letters go too | `[NS-06-B16]` |
| Plan lapse | Stays; opens; readable (B7) | `[NS-06-B17]` |

**M5. Counsel.** Add a new question: "open at 18" and any duty to deliver to a minor. Tie it to **Q49** (death, fiduciary access) and **Q50** (custody: a letter hidden from the other parent; a legal order). Default: ordinary dates only; no "open at 18" wording.

**S1. Threat rows:**

| Asset | Threat | Control | Test |
|---|---|---|---|
| Sealed words (L4) | Co-parent (A1) pulls them before the instant | `book_entries` clause; no row | B8 |
| Sealed words (L4) | Insider or service role (A5) reads them | Residual risk: not end-to-end encrypted, so the copy never says "secure" (B5; **Q43**) | n/a |
| Seal columns | The publish job exposes the zone offset | The job is the only server reader | `grants.mjs` row |

**Label effect.** None: columns on rows already declared as User Content. Counsel should not brief the seal as location-free (ADR D3a): **Q54**, **Q20**.

### NS-06 Part C: Quick capture
- **M1.** Add NS-06-C6: "no App Entity of a letter, child or prompt exists" (source scan; X6).
- **S1. Threat row:** asset is anything in an app-group container. Threat: an extension process reads L4 data. Control: no app group (C3). Test: the C3 preflight.
- **Label effect.** Per trigger, from NS-04 R4.

### NS-07 Remaining rows

**M1 (CISO). The G11-1 guard relies on a policy, not a control.**
- "PR body names a D-###" can be satisfied by any session, because every session posts as the founder.
- The guard must check three things: the D-id exists in `docs/DECISIONS.md` on the base branch; its text names the privacy label; and `docs/legal/app-store-privacy-labels.md` changes in the same PR.
- Residual risk: a session can still write a matching decision line, so the founder's merge stays the real gate. Say so in the guard's README.

**M2. G11-2 scope** (X8).

**S1. C5 "Not much today".** NS-07-C5-5's one-per-day rule is per phone. With two phones it should be per author per day. `sync` dedupes, or the card accepts two marks.

**S2. C28 print-ready PDF:**
- Temp-file deletion as in NS-05 M1.
- CLO: NEEDS EVIDENCE that the font licence allows embedding in user-made PDFs.
- A print partner later is a processor (**Q11**), and print needs the entity question settled (**Q47**).

**Label effect.** None for C5 and C28.

### NS-08 Recording backup readiness

**M1. Door lines for the later flip,** written now:
- **Shown:** the backup consent sheet; Privacy section 4 versioned link; the escrow sentence in D-102 wording ("we hold a key; each use is logged and emailed to you").
- **Records:** a PRIV-R21 row with document `backup_consent`, version, action, method, surface `backup_sheet`, times, app version and build, OS, platform, text language and text hash.
- **Never:** any upload before the yes; any claim that only the family's keys open it (D-102); any upload of another account's recordings.
- **Decline:** recordings stay on this phone; nothing uploads; export and deletion still work.
- **Withdraw (F, default):** Stop backup halts uploads at once and deletes server copies on the published 31/38/45-day clock (**Q42(d)**, **Q51**).

**M2. RR-5 table for the flip:**

| Case | Expected | Test |
|---|---|---|
| Second phone | Downloads recordings; never re-uploads a duplicate | `[NS-08-R8]` |
| Second account on the same phone | Never uploads A's recordings under B (ADR 0023 layer 3) | `[NS-08-R9]` |
| Offline for days | Queued | `[NS-08-R10]` |
| Lost answer | Idempotent object key (entry id plus sha256) | `[NS-08-R11]` |
| Kill switch during upload | Stops; no row points at a missing object | `[NS-08-R12]` |
| Sign out during upload | `signOutWouldWait` counts audio uploads too | `[NS-08-R13]` |
| Account deletion | Objects purged; escrow wrap deleted (key destroyed) | `[NS-08-R14]` |
| Plan lapse | Backup kept, free (D-111 item 6) | `[NS-08-R15]` |
| Quota reached | As in the card |  -  |

**M3.** The data-policy 4.3 backup row is stale (X2). The bucket is `entry-audio` (packet section 0, item 6).

**M4.** R2 must price restore egress against the Free plan's 5 GB egress quoted in 00 section 8, re-read on the day. All prices are UNVERIFIED this session.

**S1. Threat rows:**

| Asset | Threat | Control | Test |
|---|---|---|---|
| Escrow key | Insider or a compromised founder account (A5) | Logged unwrap; 24/72 h hold; approval only from a device enrolled 7 days (D-108); email on use | R3 drill |
| Backup objects | Breach of the storage | Access-rule cells on `entry-audio` (**Q42(b)**, **Q28**) | `audio_backup_escrow.test.mjs` |

**S2.** NS-08-R6 precondition: the sign-out code read this session keeps recordings (X4). Replace "UNVERIFIED ... read it first" with that citation. The device test stands.

**Counsel:** **Q42**, **Q45**, **Q54(a)(b)**, **Q55**, **Q28**, **Q51** (key-unwrap log 12 vs 24 months), **Q11**, **Q39**.

**Label effect.** None now. At the flip: Audio Data yes and linked; Device ID if `backup_devices` (**Q54**). Same build as the behaviour, never before.

### NS-09 Let it go always finishes

**M1. RR-5 rows to add:**

| Case | Expected | Test |
|---|---|---|
| Server kill switch off | The discard stays queued locally; sent when on | `[NS-09-R9]` |
| Second account | A's queued discard is never sent under B's session; it is held for A | `[NS-09-R10]` |
| Sign out with a discard queued | Sign-out waits for discard ops as it waits for uploads, or the draft comes back on another phone | `[NS-09-R11]` |
| Plan lapse | n/a |  -  |

**M2 (F). Server retention of a let-go held draft.**
- NEEDS EVIDENCE (`sync`): is the server copy of a never-kept draft a 30-day tombstone or purged at once?
- **Default:** purge at once, with no Recently deleted, because it was never kept.
- Otherwise a parent who let a take go still has its words on our server for 30 days. Counsel: **Q51**.

**M3. Door lines:**
- **Shown:** the existing confirm, plus BL-925's line.
- **Records:** the `discarding` mark and the outbox op on the phone; no PRIV-R21 row.
- **Never:** keep audio after a confirmed let-go beyond the retry; show the draft as keepable again.
- **Decline:** Cancel keeps the take.

**S1.** Claims row for the Review line.

**Label effect.** None.

### NS-10 A new phone

**M1. Rewrite the Decline line.** On a new phone, "the book stays on this phone" is false. New text: "Decline: nothing downloads to this phone and nothing uploads from it. The book stays on the server and the parent's other phone. Delete account works from this phone without agreeing (Apple 5.1.1(v); PRIV-R09). Export works for what is on this phone; if nothing is, the screen says the book is on the other phone."
- Split R4 into R4a (deletion works without agreeing) and R4b (export reachable, with the line above).

**M2.** NEEDS EVIDENCE (`sync`, by the design freeze): does `sync_pull` serve rows while a Terms version is outstanding? `can_write_content()` gates writes only. Add a row with the answer.

**M3. Add NS-10-R5** (P0): "After A signs out, B signing in is never offered A's letters on the claim screen and never uploads them" (ADR 0023 layer 3; X4).

**M4. RR-5 rows to add:**

| Case | Expected | Test |
|---|---|---|
| Lost answer during acceptance | One acceptance row (idempotent on document, version and client time) | `[NS-10-R6]` |
| Kill switch off | Local book only; no held screen | `[NS-10-R7]` |
| Account deleted on the other phone while this one waits | Held screen ends with a plain line | `[NS-10-R8]` |
| Plan lapse | Every letter arrives and reads | `[NS-10-R9]` |

**M5. Records:** a PRIV-R21 row with all fields, surface `returning_consent_sheet`, method `tap`.

**Counsel:** **Q44** (re-consent), **Q19** (pre-account local use).

**Label effect.** None.

### NS-11 Save a copy of the year

**M1. Door lines:**
- **Shown:** what the copy holds, plus "as private as where you put it" (intent; **Q43** if it uses a safety word).
- **Records:** slip state only, on the phone.
- **Never:** the destination, our cloud, a count.
- **Decline:** dismiss.

**M2. Inventory row:** slip state (book id L3, year, shown and dismissed L2). Phone only; not synced; deleted with the book and at Erase everything; not exported. The export ZIP temp file is deleted at sheet completion (as NS-05 M1).

**S1. RR-5:**
- The slip is per phone. Default: do not sync, since that collects less; CPrivO can rule this.
- After sign-out, B never sees A's slip.
- Add `[NS-11-R10] export works after lapse` (J-N25).

**Label effect.** None.

### NS-12 Earlier versions

**M1 (F). Raw transcript immutability versus removal.**
- `raw_transcript` also keeps words a parent edited out, and it is immutable by trigger.
- **Default:** an author may remove their own earlier *versions*, which counts as removal; the raw transcript stays until the letter is deleted.
- The screen says so plainly. Counsel: **Q51**, **Q32** (health detail), **Q48** (whether a Connecticut deletion right reaches a part of a letter).

**M2. Inventory row:** `entry_versions`, L4 C, author-only RLS (`entry_versions_author_select`), life of the letter, purged with it.
- New: pulling versions to the phone changes the sync contract (`data-architect`).
- Export: NEEDS EVIDENCE whether 1.6.0 already carries versions (`schema.ts:286-288` mentions conflict copies).

**M3. RR-5:** second phone; a restore on phone A while phone B edits; lost answer; offline; kill switch; account deletion; co-parent never sees them.

**S1. AI.** Restoring never re-runs the engine; the stored `machine_edits` return as stored.

**Label effect.** None.

### NS-13 Reminders

**M1. Inventory rows** (all on the phone, not synced, not exported, cleared at sign-out (R14), account deletion (R15) and Erase everything):
- Hour and days: L2.
- Name opt-in: L2.
- Back-off state (last made date, unanswered count): L2.
- Scheduled bodies in iOS: L3 by default; L4 with the name opt-in on.

**M2. Door lines for the notification permission:**
- **Shown:** the one sheet sentence, two equal choices, then the iOS prompt.
- **Records:** the choice, on the phone only.
- **Never:** a second ask from us.
- **Decline:** no reminders; Me explains in one sentence.

**M3. RR-5 rows to add:**

| Case | Expected | Test |
|---|---|---|
| Second phone, same account | Reminders are per phone (settings do not sync). A letter made on phone A cancels phone B's reminder after B's next pull; an offline B may still remind | `[NS-13-R18]` |
| Kill switch | No effect (local) | `[NS-13-R19]` |
| Plan lapse | R11 | R11 |

**M4. Claim wording.** Scope the claim to reminders, "Reminders don't show your child's name unless you choose", with a claims row (**Q43**). It must not promise more, because iOS preview settings are outside our control.

**S1. AI.** Add NS-13-R20: "every notification body is a `packages/content` key from the vetted prompt pool; no generated text" (source check).

**Label effect.** None. Guideline 4.5.4 for local notifications is UNVERIFIED; CCO re-reads it before submission.

### NS-14 Whose book
- **S1. Inventory:** the active book id, L3, phone only, not synced.
- **S2. RR-5:** the selection resets when a second account signs in (X4).
- **Label effect.** None.

### NS-15 A letter for another day

**M1. The field already exists (X9).** The about-day is `entries.occurred_on` (L3, `scribe_core.sql:125`) with `occurred_precision`, synced as field group `occurred_on`, exported since 1.5.0. The said-on day is `captured_at`.
- Rewrite "What" and "Legal, privacy inputs": no new synced field, no 1.7.0 change.
- Re-size; CTO confirms. It is likely M.
- NEEDS EVIDENCE: whether a UI already sets it (catch-up letters; `occurred_precision = month`).

**M2. RR-5 rows to add:** kill switch (stays local, syncs when on), `[NS-15-R12]`; second account (X4); co-parent phone (re-files after its pull), `[NS-15-R13]`; plan lapse (unchanged), `[NS-15-R14]`.

**S1. AI.** Never take a date from a photo without the parent's pick. The NX-39 P1 date chip must be parent-confirmed.

**Label effect.** None.

### NS-16 Someone else speaks

**M1. Existing column conflict (X9).** `author_signs_as` has `char_length <= 30` and is insert-only, and held drafts push before Keep (F16).
- NS-16-R1's 1 to 40 characters breaks the CHECK. Changing it on Review breaks insert-only.
- `data-architect` chooses before any build: (a) a 30-character cap, with "From" set before the draft's first push; or (b) a new mutable field group with its own migration.

**M2. Inventory row:** the typed name of a non-user.
- Class: L3 (rule 3: a capped name; privacy confirms).
- Synced. Visible to the co-parent, because `book_entries` selects `author_signs_as` (`data_governance.sql:210`).
- Exported as `author.signs_as`. Deleted with the letter or the account.
- The "names used before" list: L3, phone only, cleared at sign-out and Erase everything. PRIV-R10 lists the signature, so it is never logged.

**M3.** Ship behind a flag that stays off in production until **Q45** and **Q48** are answered and the PRIV-R20 `child-input` flag system exists (LEGAL-REQ-059 is "not yet").

**M4 (F). Door lines.** "One line that the person speaking agreed" creates an attestation with no record.
- **Default:** an instruction, not an attestation: "Ask before you record someone else" (intent). No checkbox, no record.
- **Never:** contacts, a photo, a relationship field, voiceprints.

**M5. AI.** Add NS-16-R6: "no speaker identification, diarization or voice comparison decides or suggests who spoke" (register CR-040, LEGAL-REQ-019). Source scan using the appendix A deny-list.

**M6. RR-5 table:**

| Case | Expected | Test |
|---|---|---|
| Author's second phone | Name arrives with the letter | `[NS-16-R7]` |
| Co-parent | Sees "From" the name | `[NS-16-R8]` |
| Lost answer | Applied once; a different value is refused | `[NS-16-R9]` |
| Offline | Pushes with the first insert | `[NS-16-R10]` |
| Kill switch | Local only | `[NS-16-R11]` |
| Sign out | Names list cleared | `[NS-16-R12]` |
| Account deletion | Purged | `[NS-16-R13]` |
| Backup on later | Another adult's voice reaches the server (**Q42(c)**) |  -  |

**Counsel:** **Q48**, **Q45** (a sibling), **Q46** (we cannot verify the speaker is an adult), **Q54** (add (f): is a typed name of a non-user a Contact Info row?).

**Label effect.** Possibly yes (**Q54**). CPrivO holds the card until answered.

### NS-17 A second spoken language

**M1. R2 cannot be tested as written.** A model forced to English may emit English words, or an English translation, for non-English speech. This is UNVERIFIED; measure it with `npm run gate` on fixture audio.
- Rewrite R2: "the English pipeline's output on fixture recordings in each unoffered language is measured and filed with the gate evidence; no such letter is kept without the parent seeing its words on Review."

**M2 (F). What happens to the raw transcript of a take marked "another language".**
- `raw_transcript` is immutable and syncs (`sync.ts:161`), so words nobody said would live on the server and in the export as "the words as heard".
- **Default:** keep the raw transcript as stored, plus a withheld flag (L4, synced to the author only). `final_text` is empty. The take is not indexed, shared, printed or shown. The export labels it "machine output the parent withheld".
- Alternative that collects less: do not sync the raw transcript of a withheld take (`data-architect` cost).

**M3. Add NS-17-R6:** "every transcription call passes the author's chosen language code, never auto-detect, and the task is transcribe, never translate" (source test).

**S1.** A low-confidence Review line from the average log-prob already in `stt_meta` is a separate CAIO proposal, not language detection.

**Counsel:** **Q9**, **Q12**.

**Label effect.** None.

### NS-18 Typed days
- **M1. Inventory row:** date plus words. L4 (free text, rule 3). Phone only; not synced.
  - **Default retention:** deleted the day after delivery, on delete, at Erase everything and at sign-out.
  - Export: no (**S:** CPrivO to confirm against data-rights expectations).
  - Canary: J-N18.
- **M2. Door lines for "show my words in the notification":**
  - **Shown:** the setting and its words.
  - **Records:** the choice, on the phone.
  - **Never:** the words in a notification by default.
  - **Decline:** the fixed line is used.
- **Label effect.** None.

### NS-19 Add more to this letter
- **M1, when taken up:** each take keeps its own immutable raw transcript and its own `verifyEdits` pass. No machine edit spans two takes. The letter shows takes in order without joining their text. New tables need inventory rows, sync and export.
- **Label effect.** None.

### NS-20 A letter to two books
- **S:** when decided, add inventory and visibility rows. A letter in two books may reach two sets of readers.
- **Label effect.** None.

### NS-21 The letter page as one list
- **S1. Door lines for the "Who can read it" row** once co-parent is live:
  - **Shown:** "Only you" and "In the book".
  - **Records:** `in_book` (existing).
  - **Never:** tell the other parent a letter became private.
  - **Decline:** no change.
- **Label effect.** None.

### NS-22 The calm Book header
- No findings in these domains.
- **Label effect.** None.

### NS-23 One past letter on Home
- **M1. Add NS-23-R9** (P0): "with App lock on, the app-switcher snapshot of Home shows no letter fragment" (as NS-01-R13).
- **S1. Inventory:** the past-letters switch and the dismissed-today flag. L2, phone only.
- **Label effect.** None.

### NS-24 Read the year back
- **S1 (CLO).** "Read together has no limit" is an open-ended public promise in the founder's name. Keep it in the internal rule. Publicly, list Read together among "free today" (Terms 8.4), not in the permanent list, unless the founder accepts it as permanent (**Q40**). Add a claims row.
- **Label effect.** None.

### NS-25 The other parent in the store app

**M1 (F). Conflict with the Terms drafts.** NS-25's gate "the second adult can be removed by the first", and R4, contradict Terms 3.3 and 4 plus `undo_parent_join`: there is a 72-hour undo by the inviter, then no removal between parents (packet **Q53**).
- **Default:** the Terms as drafted until counsel answers Q53.

**M2. Door lines for inviting.** Shown (to the inviter, before sending), intent: "They will be able to read every letter in this book that is not private, including the ones already there." This shares earlier health or pregnancy details (**Q48**, D-050).
- **Records:** PRIV-R21 rows for invite created, invite accepted (document, version, method, surface `invite_accept`), undo and leave.
- **Never:** a child name or letter before acceptance (`peek_invite`, D-111 item 8); the invitee's contacts.
- **Decline:** nothing joins; the inviter is not told why.
- **Leave:** define it (D-113 hides Leave today).

**M3. RR-5 table:**

| Case | Expected | Test |
|---|---|---|
| P2's second phone | Book arrives | `[NS-25-R7]` |
| Link opened while P2 is signed in | Refused (ADR 0023) | `[NS-25-R8]` |
| Lost accept answer | One membership | `[NS-25-R9]` |
| Kill switch off | Invite and join hidden; existing letters stay readable locally | `[NS-25-R10]` |
| Undo within 72 h | P2 stops receiving at the next sync; keeps own letters (D-116) | `[NS-25-R11]` |
| P2 deletes their account | P2's letters purged; P1's book intact | `[NS-25-R12]` |
| P1 deletes their account | P2's letters survive; the kept row keeps the child name and dates (D-116; Privacy lines still to fix) | `[NS-25-R13]` |
| Plan lapse | Allowance per author (D-103); Family Sharing | `[NS-25-R14]` |
| Third adult | Refused (R5) | R5 |

**M4. Inventory:** state the existing rows: `child_invites` (hash L3, kept 90 days after use, revocation or expiry); `child_members`; `policy_acceptances`.

**S1. Threat row:** asset is the whole book's history. Threat: an ex-partner co-parent (A1). Control: private letters; the 72-hour undo. Test: R3. Residual risk: a co-parent can screenshot (TDD 04).

**S2 (CCO).** The age-rating "social" answer (F21-REQ-NEW-E) changes when co-parent ships.

**Counsel:** **Q48**, **Q49**, **Q50**, **Q53**, **Q43**.

**Label effect.** CPrivO to confirm (**Q54**).

### NS-26 to NS-28, NS-30, NS-31 (parked)
- **S. NS-26:** push tokens are L3 in a server table with grants and a `grants.mjs` row (**Q54(d)**). Payloads follow PRIV-R10. Door lines for the permission.
- **S. NS-28:** X2 applies; **Q45**; Audio Data becomes collected and linked; link tokens hashed L3 with a 90-day clock (the `member_return_links` pattern).
- **S. NS-30:** **Q47** (entity), **Q11** (print partner); a QR code needs hosted audio (X2).
- **NS-27, NS-31:** none.
- **Label effect.** None until built.

### NS-29 Read-along highlight
- **S1.** NEEDS EVIDENCE (`speech`): `stt_meta` already stores per-token timestamps (data-policy 4.1; synced). "The engine does not keep yet" may be wrong.
- **AI rule:** highlight only tokens of the raw transcript, mapped through `machine_edits` offsets. A word that came from an `stt_fix` or `agreement` edit has no timing and is never highlighted.
- **Label effect.** None.

### NS-32 One notification budget
- **M1. Rewrite R4:** "delivered on time when notifications are allowed; when they are not, Settings, Plan shows the date (F14-REQ-NEW-A)" (**Q41(b)**). Plan notices never carry a child name or a count.
- **S1.** The budget is per phone per local day; say so.
- **Label effect.** None.

### NS-33 Accessibility
- **S1 (CCO).** Any accessibility claim on the store page needs a claims row and evidence per build (LEGAL-REQ-051). Apple's label scheme is UNVERIFIED this session.
- **Label effect.** None.

### NS-34 Speed on the smallest phone
- **S1.** Perf markers are content-free (PRIV-R10). Runs use the Asha install (X3).
- **Label effect.** None.

### NS-35 Only Home starts a letter
- No findings.
- **Label effect.** None.

### NS-36 New data follows the letter
- **M1.** R4: X11.
- **M2. Rewrite R5:** "export 1.7.0 carries each picture at `photos/<entry_id>/<media_id>.jpg` with the D2 `photo` object, and a 1.6.0 file still reads. Seal fields arrive in 1.8.0 with the seal build; firsts fields in their own minor."
  - The about-day (`occurred_on`, since 1.5.0) and the signature (`author.signs_as`) are already exported (X9).
- **M3. R1a.** Change "original and both derivatives" to "the stripped copy and both derivatives". No original is stored (NS-01-R14; ADR D2).
- **M4. Split R1c.** R1c: phone purge. R1d: "`entry-photos` holds 0 objects for the letter" (D6 write-deny). There is no server picture to purge.
- **M5. Add to the rule:** "it has a level in its migration comment (server `classification.test.mjs`; the phone class-label check ADR 0028 asks `qa` for), and it is inside the 31/38/45-day deletion clock and its receipts."
- **Label effect.** None.

### NS-37 The Book stays fast
- **M1.** Change "the original only for export" to "the stored stripped copy only for export".
- **M2. Derivatives inventory** (CPrivO can rule this alone, since it collects less):
  - Two files per picture (about 512 px and 1,280 px). L4. Regenerable.
  - Store them in `Library/Caches` or set the backup exclusion.
  - Erased by the same eraser as the picture. 0 metadata segments. Not exported. Never logged.
  - Tests: `[NS-37-R3] derivatives carry no metadata and are excluded from backup`; `[NS-37-R4] derivatives are erased with the picture`.
- **Label effect.** None.

---

## 2. Counsel questions, mapped to the packet (all "counsel must confirm")

| Packet number | Cards it now covers |
|---|---|
| Q32 | NS-06 A, NS-12, NS-13 R10 |
| Q40 | NS-24, 00 section 7 |
| Q41 | NS-32 |
| Q42 | NS-08, NS-16, NS-28 |
| Q43 | NS-01 label line, NS-05, NS-06 B, NS-09, NS-11, NS-13 claim, NS-25 |
| Q44 | NS-03, NS-10, 00 section 3 |
| Q45 | NS-01, NS-03 Arm V, NS-05, NS-08, NS-16, NS-28 |
| Q46 | NS-16 |
| Q47 | NS-30, NS-07 C28 |
| Q48 | NS-01, NS-06 A, NS-12, NS-16, NS-25 |
| Q49 | NS-06 B, NS-25 |
| Q50 | NS-06 B, NS-25 |
| Q51 | NS-03, NS-08, NS-09, NS-12, NS-18, 00 section 3 |
| Q53 | NS-25 |
| Q54 | NS-01, NS-06 B, NS-08, NS-16, NS-25, NS-26 |
| Q9, Q12 | NS-17 |
| Q11 | NS-07, NS-08, NS-30 |
| Q19 | NS-10 |
| Q20 | NS-06 B |
| Q22 | NS-03 |
| Q28 | NS-08 |

**New questions to number (by the CLO, through `next-id`):**
1. Concierge research with tester families (NS-03).
2. "Open at 18" and any duty to a minor (NS-06 B).
3. Whether a typed name of a non-user needs a label row (NS-16; it could instead be added as Q54(f)).

## 3. Founder decisions, each with a recommended default

| # | Decision | Recommended default |
|---|---|---|
| X4 | Sign-out leaves the book readable on the phone | Keep it as built; say so on the sign-out sheet; point to App lock and Erase everything |
| X6 | System writing tools on fields that become letter words | Off |
| NS-03 | How long to keep pilot consent records | 12 months after the read-out |
| 00 section 3 | How long to keep hand-sent tester measures | 90 days after the round |
| NS-06 B | Account deletion before the opening day | The sealed letter is deleted; the sheet says so |
| NS-09 | A let-go held draft on the server | Purged at once (after `sync` reports today's behaviour) |
| NS-12 | Removing earlier versions | Allowed for the author; the raw transcript stays immutable; said plainly |
| NS-16 | The "speaker agreed" line | An instruction, not an attestation; no record |
| NS-17 | The withheld transcript | Kept and flagged; never shown, indexed, shared or printed |
| NS-25 | Removing the other parent | The Terms' 72-hour undo only, until Q53 is answered |
| NS-08 | Withdrawing backup consent | Deletes server copies on the published deletion clock |

---

## 4. Verdicts

**Chief Privacy Officer.** The pack keeps the child as the subject and nothing new leaves the phone at Level 1. That is the right shape. What blocks locking it:
- Sign-out leaves a family's book readable on a phone (X4), and no card says so.
- NS-16 and NS-17 would put a non-user's name, and words nobody said, on our server.
- Typed place, photo text and the Find index are L4 data that needs explicit phone-only tests and backup honesty.
- The inventory home is a stale policy.

NS-01, NS-02 and NS-05 Level 1 can lock once their M items land. NS-06 B, NS-12, NS-16, NS-17 and NS-25 cannot lock until the founder decisions and the counsel answers in section 3. Chief Privacy Officer (Claude role, not counsel)

**Chief Compliance Officer.** Every legal or Apple fact in the pack is UNVERIFIED this session, including guideline 4.5.4, 5.1.1(v) and the App Privacy definitions. Each must be re-read from the source before submission. The rows with legal effect that have no evidence yet:
- The account-deletion text for pictures (`pages.en.ts:240`).
- The plan-notice windows (Q41).
- Accessibility claims.
- The privacy label staying unchanged while photos are local.

The P0 register omits NS-01 to NS-07, so today their leak rows would not block a store build. I would not pass a store gate on NS-01 or NS-02 until X7 is applied and the label line is read by counsel. Chief Compliance Officer (Claude role, not counsel)

**Chief Legal Officer.** Three texts the founder is personally bound by are contradicted by the pack:
- The Terms' co-parent removal rule (NS-25 against Q53).
- The account-deletion promise for pictures.
- An open-ended "no limit" on Read together.

Counsel numbering is stale throughout (X1). Three questions are new and still need numbers. Nothing here should be published or sent to counsel until the packet carries them. Holding those sentences unpublished is my ruling. Chief Legal Officer (Claude role, not a lawyer)

**CISO.** The trust boundaries are named and mostly controlled by machines: the photo bucket write-deny trigger, the `book_entries` seal clause, and the ADR 0023 claim layers. Three weak points:
- The label guard (G11-1) relies on PR-body text that any session can write as the founder. It is a policy until it checks `DECISIONS.md` and the label file.
- Device evidence on the founder's real phones is the largest live exposure in this pack (X3).
- System intelligence donation is an uncontrolled exit (X6).

Residual risk the founder carries: letters and sealed words are readable by the service and by anyone holding a signed-out phone. CISO (Claude role, not an auditor)

**Chief Data Officer.** The model is sound and ADR 0028 is careful. The cards, though, describe fields that already exist (`occurred_on`, `author_signs_as`, `stt_meta`) as new, and they mislabel the export versions (NS-36-R5). Engineers would build duplicate columns or ship the seal in the wrong schema minor. Fix X9, X10 and the NS-36 rewrites first. Every new field above now has a row with level, store, sync, clock, deletion path, export and log rule. The blind spot that remains: production holds an unknown migration state, so "exists" means exists on `develop`. Chief Data Officer (Claude role)

**Chief AI Officer.** The constitution holds in every card I read: no captions, no detection, no summaries, slices not rewrites, and dates only from the parent's pick. Three places it could quietly break:
- An English-only pipeline emitting or translating words in another language (NS-17).
- OS writing tools and Siri or Spotlight donation acting on letter fields (X6).
- A speaker feature drifting toward voice attribution (NS-16).

Each now has a structural test (NS-17-R6, X6-R1, NS-16-R6) rather than a prompt rule. I am Claude reviewing work written by Claude sessions. An independent reviewer on a different model family has not checked this. Chief AI Officer (Claude role)

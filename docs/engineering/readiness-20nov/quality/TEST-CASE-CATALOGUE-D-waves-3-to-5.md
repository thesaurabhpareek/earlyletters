# Catalogue D: waves 3 to 5 and unplaced cards (P0 rows only)

Owner: qa. Written 20 Nov 2026 against develop 16e61549 and the locked cards at 450bcb4a. This file holds 144 rows (144 P0, 0 others). No test is written here: each line is a design a builder can turn into a test and a reviewer can check.

How to read a line. Legend, tags and the rules behind it are in `CHECKS-AND-BALANCES.md` (C-R rules). Title: use it exactly; the card is the source. Lvl: U unit, I integration (real store on node SQLite or supabase test), S source scan (needs a positive control), J journey (simulator flow), D device, P process or document check. Run: SB runs in the sandbox (Node 22.5 and up; the 8 baseline files stay red); CI needs CI, macOS, Deno or a simulator; DV only on a phone; DOC a checklist. Today: `cited` means `scripts/trace.mjs` on develop finds a test title citing the row (T1 not yet checked: it may prove only part), `fails` means the design files say the code does not meet it today, `none` means no test cites it. Dsn: our design file that names the row (08, 09, 10, 11 = `docs/tdd/new-scope/*`, sec, priv, data, arch). Status DESIGNED means the card plus this line is enough to build a test that can fail; GAP means it is not and the line says what to add.

## NS-04

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-04-R2 | `[NS-04-R2] spike branch holds no real family data` | S | SB | 4 | none | no-real-family-data test on the spike PR plus a log and analytics scan for audio, words, names | (code not built yet) Commit a real recording hash | qa | 09 | DESIGNED |
| NS-04-R4 | `[NS-04-R4] every trigger states its plist, entitlement, label and audio delta` | P | DOC | 4 | none | Findings-file check: each trigger section has Plist, Entitlement, Label, Apple processes audio lines with an allowed value PROPOSE: node check over the findings file shape | (code not built yet) Missing line | qa | 09 | GAP |
| NS-04-R5 | `[NS-04-R5] a second trigger start is refused` | U | SB | 4 | none | Fire each trigger twice; Ready opens once; second refused (NS-35 closed list) | (code not built yet) Remove the second-start refusal | mobile | 09 | DESIGNED |
| NS-04-R6 | `[NS-04-R6] the spike runs on a separate bundle id and an Asha-only account` | S | CI | 4 | none | preflight: spike bundle id differs from packages/brand; sign-in limited to test account; run sheet row for the phone | (code not built yet) Reuse the production bundle id | qa | sec | DESIGNED |
| NS-04-R7 | `[NS-04-R7] no unmeant recording in 200 fires` | D | DV | 4 | none | 200 trigger fires across triggers on a device; 0 recordings without the tap on Ready | (code not built yet) Start the recorder in the trigger handler | mobile | 09 sec | DESIGNED |
| NS-04-R8 | `[NS-04-R8] no letter, child or prompt entity is exposed` | S | SB | 4 | none | [X6-R1] scan on the spike branch: no CSSearchableIndex, isEligibleForSearch, AppEntity over letters, children, prompts | (code not built yet) Add an AppEntity | security-architect | 09 | DESIGNED |

## NS-05

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-05-R3a | `[NS-05-R3a] the share sheet gets the words and the app records nothing` | U | SB | 3 | none | Share port spy: payload is text plus optional one image; no destination recorded anywhere (store spy) | (code not built yet) Persist activityType | mobile | - | DESIGNED |
| NS-05-R3b | `[NS-05-R3b] the activity type is never read` | S | SB | 3 | none | Scan share module: result.activityType never read; unit: result object discarded | (code not built yet) Log the activity type | privacy | sec | DESIGNED |
| NS-05-R4a | `[NS-05-R4a] the shared text is the letter's words inside the fixed wrapper` | U | SB | 3 | none | 20 fixtures (Devanagari, Arabic, Chinese): shared text equals wrapper(final_text) byte for byte | (code not built yet) Trim or normalise the words | mobile | sec | DESIGNED |
| NS-05-R5a | `[NS-05-R5a] no audio leaves` | U | SB | 3 | none | Payload contains no audio file and no audio/ MIME | (code not built yet) Attach the recording | mobile | sec | DESIGNED |
| NS-05-R5b | `[NS-05-R5b] the picture goes only if chosen, as the stored copy` | U | SB | 3 | none | Picture attached only with toggle on, as stored copy; toggle absent without a stored picture | (code not built yet) Attach by default | mobile | sec | DESIGNED |
| NS-05-R6a | `[NS-05-R6a] the picture's file name is fixed` | U | SB | 3 | none | Attached file name is exactly letter-photo.jpg | (code not built yet) Name with the letter date | mobile | 10 | DESIGNED |
| NS-05-R6b | `[NS-05-R6b] the picture carries no metadata` | U | SB | 3 | none | Byte scan of the attached file: 0 Exif, XMP, IPTC segments | (code not built yet) Share the unstripped original | mobile | - | DESIGNED |
| NS-05-R7 | `[NS-05-R7] only own, open, kept letters with words can be shared` | U | SB | 3 | none | Share absent for another's letter, sealed, quiet day, no words, draft; present for own kept with words | (code not built yet) Show Share on drafts | mobile | - | DESIGNED |
| NS-05-R10a | `[NS-05-R10a] the temp picture is deleted when the sheet completes` | I | SB | 3 | none | Completion handler for sent, cancelled, failed: tmp/share empty | (code not built yet) Delete only on success | mobile | 10 arch priv sec | DESIGNED |
| NS-05-R10b | `[NS-05-R10b] the launch sweep removes a left temp picture` | I | SB | 3 | none | Leave a file in tmp/share, launch; sweep deletes it | (code not built yet) Skip the launch sweep | mobile | - | DESIGNED |
| NS-05-R12 | `[NS-05-R12] nothing remembers that a letter was shared` | S | SB | 3 | none | Schema and settings-key test: no shared flag, counter, date anywhere | (code not built yet) Add last_shared_at | data-architect | - | DESIGNED |
| NS-05-R16a | `[NS-05-R16a][SH-R10] Level 1 has no recording path` | U | SB | 3 | none | Payload type has no recording field; unit asserts keys | (code not built yet) Add audioUri | mobile | - | DESIGNED |
| NS-05-R16b | `[NS-05-R16b] the wrapper carries no footer, brand or link` | U | SB | 3 | none | Wrapper scan: no brand.name, http, www., sent from; fixture words containing www.example pass untouched | (code not built yet) Add a footer | mobile | - | DESIGNED |
| NS-05-R18 | `[NS-05-R18] the wrapper is date, words, signature and nothing else` | U | SB | 3 | none | 20 fixtures: wrapper exact (about-day via Intl.DateTimeFormat or month-year, blank line, words, blank line, signature); nothing else | (code not built yet) Add a greeting line | mobile | - | DESIGNED |
| NS-05-R21 | `[NS-05-R21] the payload has no subject` | U | SB | 3 | none | Share options object has no subject or title key | (code not built yet) Pass a title | mobile | - | DESIGNED |
| NS-05-R25 | `[NS-05-R25] sharing donates nothing to the system` | S | SB | 3 | none | [X6-R1] scan covers the share flow | (code not built yet) Donate NSUserActivity | security-architect | - | DESIGNED |
| NS-05-R27 | `[NS-05-R27] a second account never shares the first account's letters` | I | SB | 3 | none | A signs out, B signs in; Share only on B's letters; A's not listed | (code not built yet) Query without the account clause | data-architect | sec | DESIGNED |

## NS-06

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-06-A2a | `[NS-06-A2a] unmark is one tap, words untouched` | I | SB | 4 | none | Mark then unmark an Asha letter on node SQLite; one tap clears mark and label; final_text, raw_transcript, audio sha byte-identical | (code not built yet) Unmark also trims final_text | mobile | - | DESIGNED |
| NS-06-A4 | `[NS-06-A4] firsts are never counted` | S | SB | 4 | none | Scan strings, export file names, PDF text and notification classes for a firsts count (positive control) | (code not built yet) Add a firsts counter to the header | content | - | DESIGNED |
| NS-06-A5 | `[NS-06-A5] no suggestions and no detection` | S | SB | 4 | none | Content keys of Firsts against appendix A list: 0 matches; scan Firsts folder for NLP, ML imports | (code not built yet) Add a suggested first | content | - | DESIGNED |
| NS-06-A13 | `[NS-06-A13] only the author marks` | I | CI | 4 | none | Client: no mark control on another's letter; supabase test: RLS refuses a first write from a non-author | (code not built yet) Relax the author-only update policy | data-architect | - | DESIGNED |
| NS-06-A15 | `[NS-06-A15] a sealed letter's mark stays hidden until it opens` | I | SB | 4 | none | Sealed marked letter: not in Firsts lens, Find or counts until it opens | (code not built yet) Include sealed in the lens | data-architect | - | DESIGNED |
| NS-06-A17 | `[NS-06-A17] a private letter's mark never reaches the other parent` | I | CI | 4 | none | supabase test: other parent reads the mark only through book_entries; private letter shows nothing | (code not built yet) Add the mark column to a broader view | data-architect | - | DESIGNED |
| NS-06-A22 | `[NS-06-A22] the label is the parent's alone` | S | SB | 4 | none | Label field never prefilled from words; writing tools off (or recorded finding) PROPOSE: shared test with NS-01-R50 and NS-21-R12 | (code not built yet) Prefill from the first sentence | mobile | 10 arch | GAP |
| NS-06-A25 | `[NS-06-A25] a second account sees no first marks` | I | SB | 4 | none | A signs out, B signs in; B sees no mark, label or lens from A | (code not built yet) Lens query without account clause | data-architect | - | DESIGNED |
| NS-06-B1 | `[NS-06-B1] sealing writes the pair and nothing else about the words` | I | SB | 5 | none | Seal a letter for a later day: one transaction writes the pair, nothing else about the words changes (byte compare) | (code not built yet) Write seal fields in two transactions | data-architect | - | DESIGNED |
| NS-06-B1b | `[NS-06-B1b] a seal made in UTC-8 stays closed at UTC+14 until the instant` | U | SB | 5 | none | Injected clock and zone: sealed in UTC-8 for 10 Jan, at UTC+14 closed 1 minute before the instant, open at it; zone change moves nothing (J-N14) | (code not built yet) Compare local dates | data-architect | - | DESIGNED |
| NS-06-B2 | `[NS-06-B2][FS-R10] a sealed letter contributes nothing to any surface until it opens` | I | SB | 5 | none | Sealed letter: Book row says hidden until, no words; absent from lens, recordings, Find, Share, Read together, export for others (one test per surface) | (code not built yet) One surface skips isVisibleTo | data-architect | data sec | DESIGNED |
| NS-06-B5 | `[NS-06-B5] the author's export keeps sealed letters whole` | I | SB | 5 | none | Author export holds sealed letter whole with seal_opens_at, seal_opens_on, seal_cleared_at (1.8.0 golden) | (code not built yet) Strip sealed letters from export | data-architect | priv sec | DESIGNED |
| NS-06-B6 | `[NS-06-B6] one visibility path` | S | SB | 5 | none | List call sites of isVisibleTo against the list of reading surfaces; a surface without it fails | (code not built yet) Add a surface that filters by hand | data-architect | sec | DESIGNED |
| NS-06-B8 | `[NS-06-B8] before the instant another member gets 0 rows; after it, a normal letter` | I | CI | 5 | none | supabase test: before T another member pulls 0 rows and no marker; after T a normal letter | (code not built yet) Return a placeholder row | data-architect | arch sec | DESIGNED |
| NS-06-B8b | `[NS-06-B8b] an opened seal reaches a phone whose cursor had passed it` | I | CI | 5 | none | Two-phone sync test with injected clock: B pulls 0 rows, cursor passes, T passes with no write, B pulls again and receives once | (code not built yet) Advance the cursor past rows hidden by seal without a repull | data-architect | data | DESIGNED |
| NS-06-B10 | `[NS-06-B10] a quiet day cannot be sealed` | I | CI | 5 | none | Quiet day: seal control absent; phone refuses; server entries_12_seal_guard refuses | (code not built yet) Remove the guard | data-architect | facts sec | DESIGNED |
| NS-06-B12 | `[NS-06-B12] the author's other phones receive the seal and hide the letter` | I | SB | 5 | none | Author's second phone receives the three seal columns and hides by the same rule | (code not built yet) Drop seal columns from the pull | data-architect | - | DESIGNED |
| NS-06-B16 | `[NS-06-B16] a reader's clock cannot open a seal` | I | CI | 5 | none | Other member with clock set forward: pull returns 0 rows (server now()) | (code not built yet) Use client time in the view | data-architect | sec | DESIGNED |
| NS-06-B17 | `[NS-06-B17] a second account never sees the first account's sealed letters` | I | SB | 5 | none | A signs out, B signs in: no hidden row, no sealed letter, no seal field of A's | (code not built yet) No account clause | data-architect | sec | DESIGNED |
| NS-06-B18 | `[NS-06-B18] a sealed letter is never published after its author asks to delete the account` | I | CI | 5 | none | Author requests deletion before T: tombstone deleted_reason account_deletion at the request; no other member receives it | (code not built yet) Publish at T | data-architect | priv | DESIGNED |
| NS-06-B20 | `[NS-06-B20] book_entries hides sealed letters from other readers` | I | CI | 5 | none | book_entries returns 0 rows to a non-author before T and the row after; column list has no seal column | (code not built yet) Add seal columns to the view | data-architect | sec | DESIGNED |
| NS-06-B21 | `[NS-06-B21] sealing and Open now pass the content-consent gate` | I | CI | 5 | none | Changing a seal column without content consent is refused (both tuples) | (code not built yet) Omit from the trigger tuple | data-architect | sec | DESIGNED |
| NS-06-B22 | `[NS-06-B22] entries stays author-only to read` | I | CI | 5 | none | entries_select stays author-only (policy scan) | (code not built yet) Widen the policy | data-architect | - | DESIGNED |
| NS-06-B23 | `[NS-06-B23] seal columns are classed L4` | S | CI | 5 | none | classification.test.mjs: three columns in mustBeL4 and comment starts L4 | (code not built yet) Comment says L3 | data-architect | - | DESIGNED |
| NS-06-B26 | `[NS-06-B26] sealed letters donate nothing to the system` | S | SB | 5 | none | [X6-R1] scan covers sealed-letter surfaces | (code not built yet) Donate a sealed letter | security-architect | - | DESIGNED |
| NS-06-C1 | `[NS-06-C1] every doorway lands in the one Listen screen` | U | SB | 5 | none | Each doorway calls startCapture with a source; second start refused | (code not built yet) A doorway pushing /listen directly | mobile | - | DESIGNED |
| NS-06-C2 | `[NS-06-C2] doorways carry no data` | S | SB | 5 | none | Widget or control data model is static: no child name, no text | (code not built yet) Add child name to the widget | mobile | - | DESIGNED |
| NS-06-C3 | `[NS-06-C3] the plist delta equals the approved delta` | S | CI | 5 | none | preflight: built plist has no app group, UIBackgroundModes or location without a recorded decision | (code not built yet) Add UIBackgroundModes audio | qa | sec | DESIGNED |
| NS-06-C4 | `[NS-06-C4] a doorway never keeps a letter` | U | SB | 5 | none | Hands-free start ends as a draft with recording; 0 kept letters from a doorway | (code not built yet) Auto-keep after silence | mobile | - | DESIGNED |
| NS-06-C7 | `[NS-06-C7] no letter, child or prompt entity exists` | S | SB | 5 | none | [X6-R1]: no AppEntity, NSUserActivity, Spotlight; shortcuts take no words parameter | (code not built yet) Add a parameter | security-architect | - | DESIGNED |
| NS-06-C9 | `[NS-06-C9] an interrupted doorway take is held` | D | DV | 5 | none | Call, Siri, alarm during a doorway take; take held not lost, same as Home | (code not built yet) Discard on interruption | mobile | - | DESIGNED |

## NS-07

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-07-C5-3 | `[NS-07-C5-3] quiet days are never counted` | S | SB | 4 | none | Scan screens, notifications, file names and PDF for a quiet-day count | (code not built yet) Add a run counter | content | - | DESIGNED |
| NS-07-C5-9 | `[NS-07-C5-9] consecutive quiet days are not drawn as a run` | U | SB | 4 | none | Consecutive quiet days render as separate rows, no run visual | (code not built yet) Group with a connector | design-systems | - | DESIGNED |
| NS-07-C5-12 | `[NS-07-C5-12] a second account sees no quiet days of the first` | I | SB | 4 | none | A signs out, B signs in: no quiet days of A | (code not built yet) No account clause | data-architect | - | DESIGNED |
| NS-07-C28-2 | `[NS-07-C28-2] the book holds only the parent's words and pictures` | U | SB | 4 | none | PDF page model holds only parent's words, stored-copy pictures and fixed unsigned words; no generated page type exists | (code not built yet) Add a highlights page | mobile | sec | DESIGNED |
| NS-07-C28-3 | `[NS-07-C28-3] the text layer equals the words` | U | SB | 4 | none | 20 fixtures: PDF text layer equals final_text in book order | (code not built yet) Normalise whitespace | mobile | - | DESIGNED |
| NS-07-C28-4 | `[NS-07-C28-4] quiet days and closed seals stay out` | U | SB | 4 | none | Quiet days and closed seals not in the book model | (code not built yet) Include sealed | mobile | - | DESIGNED |
| NS-07-C28-5 | `[NS-07-C28-5] gaps are not shown or counted` | U | SB | 4 | none | Empty months: no page or line; no page count text | (code not built yet) Print empty month headings | mobile | - | DESIGNED |
| NS-07-C28-11 | `[NS-07-C28-11] a kill leaves no partial file` | I | SB | 4 | none | Kill while generating; relaunch; no partial file in tmp | (code not built yet) Write to the final path directly | mobile | - | DESIGNED |
| NS-07-C28-12 | `[NS-07-C28-12] the temporary PDF never stays` | I | SB | 4 | none | Completion handler deletes the PDF for each outcome; launch sweep backstop; file protection and exclusion set | (code not built yet) Delete only on success | mobile | sec | DESIGNED |
| NS-07-C28-13 | `[NS-07-C28-13] fonts are embedded, licensed and complete` | U | SB | 4 | cites scripts/trace.test.mjs:264 | Every font embedded and subset; fixture PDF has no missing glyph; OFL licences listed (which Arabic and CJK face is UNVERIFIED) PROPOSE: library review settles the face; test checks font dictionary of the fixture PDF | Use a system font | mobile | - | GAP |
| NS-07-C28-17 | `[NS-07-C28-17] a second account prints only its own books` | I | SB | 4 | none | A signs out, B signs in: printable file has only B's books | (code not built yet) No account clause | data-architect | - | DESIGNED |
| NS-07-C28-18 | `[NS-07-C28-18] the printable file holds only what this parent can read` | I | SB | 4 | none | Two parents: file holds only what this parent can read, never the other's private letters | (code not built yet) Use entries not book_entries | data-architect | - | DESIGNED |
| NS-07-G11-1a | `[NS-07-G11-1a] an unrecorded data-leaving diff fails` | U | SB | 4 | cites label-effect.test.ts:42 +7 | Node test over diff fixtures: a diff adding a content-carrying network call or server table without a recorded decision exits non-zero | Guard ignores new function folders | qa | - | DESIGNED |
| NS-07-G11-3 | `[NS-07-G11-3] a new SDK, entitlement or usage string needs a recorded decision` | U | SB | 4 | cites label-effect.test.ts:95 +2 | Diff adding an SDK, entitlement or usage string exits non-zero without the recorded decision | Guard reads only package.json | qa | - | DESIGNED |

## NS-08

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-08-R4 | `[NS-08-R4] label and policy delta for counsel` | P | DOC | 3 (Rec) | none | Counsel page exists with each label and policy delta (doc check by product) PROPOSE: checklist in the claims inventory; no code test | (code not built yet) Missing page | privacy | priv | GAP |
| NS-08-R5 | `[NS-08-R5] backup off in store profiles` | S | SB | 3 (Rec) | cites preflight-keepsafe.test.ts:3 +1 | preflight-production and testflight: EXPO_PUBLIC_BACKUP not on in store profiles (positive control) | Set backup on in eas.json production | qa | 08 data | DESIGNED |
| NS-08-R6 | `[NS-08-R6] sign out never removes a recording` | J | DV | 3 (Rec) | cites ns08-sign-out-keeps-recordings.test.ts:3 +2 | Backup off; sign-out sheet text; confirm; every recording file still on the phone (J-N21) | Delete the audio folder at sign-out | mobile | 08 priv sec | DESIGNED |
| NS-08-R7 | `[NS-08-R7] no backup claim while backup is off` | S | SB | 3 (Rec) | none | Claims inventory scan across store, site, Save a copy strings: no backup claim while off; per-candidate diff | (code not built yet) Add Safe if you lose your phone | content | 08 priv | DESIGNED |
| NS-08-R9 | `[NS-08-R9] backup of the backup decided before a flip` | P | DOC | 3 (Rec) | none | Readiness pack file has the seventh flip condition answered or a written no-copy record PROPOSE: doc check in the flip checklist | (code not built yet) Missing answer | data-architect | 08 sec | GAP |
| NS-08-R10 | `[NS-08-R10] second phone downloads, never duplicates` | I | SB (flip build) | 3 (Rec) | none | Flip build: second store downloads, uploads nothing for a known sha256 | (code not built yet) Upload without checking the manifest | data-architect | - | DESIGNED |
| NS-08-R11 | `[NS-08-R11] second account never uploads the first's recordings` | I | SB (flip build) | 3 (Rec) | none | Flip build: B signs in over A's recordings; zero uploads under B | (code not built yet) Upload by sha256 only | data-architect | sec | DESIGNED |
| NS-08-R13 | `[NS-08-R13] upload is idempotent` | I | SB (flip build) | 3 (Rec) | none | Flip build: lost answer then retry; same key (entry id plus sha256); one object | (code not built yet) Key includes a nonce | data-architect | 08 | DESIGNED |
| NS-08-R14 | `[NS-08-R14] kill switch leaves no dangling row` | I | SB (flip build) | 3 (Rec) | none | Flip build: kill switch during upload; uploads stop, no row points at a missing object | (code not built yet) Write the row before the upload | data-architect | sec | DESIGNED |
| NS-08-R16 | `[NS-08-R16] deletion purges objects and key` | I | CI (flip build) | 3 (Rec) | none | Flip build: delete account; every object purged, escrow wrap deleted within the clock (supabase test) | (code not built yet) Leave the escrow wrap | data-architect | - | DESIGNED |
| NS-08-R17 | `[NS-08-R17] backup survives a lapse` | U | SB (flip build) | 3 (Rec) | none | Flip build: lapsed plan; backup runs | (code not built yet) Gate on plan | mobile | - | DESIGNED |
| NS-08-R18 | `[NS-08-R18] quota never blocks a letter` | U | SB (flip build) | 3 (Rec) | none | Flip build: quota reached server side; capture and Keep work; no charge or block text | (code not built yet) Block Keep on quota | mobile | - | DESIGNED |
| NS-08-R19 | `[NS-08-R19] withdrawing consent deletes server copies` | I | CI (flip build) | 3 (Rec) | none | Flip build: stop backup; uploads stop; server copies deleted on the clock (D12) | (code not built yet) Stop uploads but keep copies | data-architect | - | DESIGNED |

## NS-11

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-11-R5 | `[NS-11-R5] no counts or fear` | S | SB | 3 | none | npm test -w packages/content over Save a copy and slip strings: no count, gap, fear word | (code not built yet) Add you have 120 letters | content | - | DESIGNED |
| NS-11-R8 | `[NS-11-R8] a quiet book gets no slip` | U | SB | 3 | none | Quieted and hidden Asha book: slip not shown (J-N19) | (code not built yet) Ignore quiet in slip selection | mobile | - | DESIGNED |
| NS-11-R10 | `[NS-11-R10] the copy holds every picture` | I | SB | 3 | none | Export with pictures on: ZIP holds every stored copy of the book (count equals files) | (code not built yet) Skip the stored copy for the oldest | data-architect | - | DESIGNED |
| NS-11-R12 | `[NS-11-R12] export works after a lapse` | I | SB | 3 | none | Lapsed plan: export runs in full | (code not built yet) Gate export on hasPlus | data-architect | - | DESIGNED |
| NS-11-R23 | `[NS-11-R23] no temp copy left behind` | I | SB | 3 | none | Completion handler deletes temp ZIP (saved, cancelled); kill; launch sweep deletes leftover | (code not built yet) Delete only on success | mobile | priv sec | DESIGNED |

## NS-12

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-12-R2 | `[NS-12-R2] restore adds a version` | I | SB | 3 (Rec) | none | Restore adds a version; count +1; none deleted | (code not built yet) Overwrite the old version | data-architect | - | DESIGNED |
| NS-12-R3 | `[NS-12-R3] restore never re-runs the engine` | I | SB | 3 (Rec) | none | Restore: raw_transcript unchanged; engine port spy never called; stored machine_edits as stored | (code not built yet) Re-run the pipeline on restore | data-architect | data | DESIGNED |
| NS-12-R6 | `[NS-12-R6] removing a version deletes it` | I | CI | 3 (Rec) | none | Author removes a version; deleted on server within one sync and on the phone; raw transcript remains | (code not built yet) Soft hide only | data-architect | priv | DESIGNED |
| NS-12-R7 | `[NS-12-R7] the screen says versions are kept` | U | SB | 3 (Rec) | none | Versions screen has the kept-until-removed line (content key) | (code not built yet) Remove the line | content | - | DESIGNED |
| NS-12-R8 | `[NS-12-R8] never another author's versions` | U | SB | 3 (Rec) | none | Non-author: no version fetched (port spy) or shown | (code not built yet) Fetch then hide | data-architect | sec | DESIGNED |

## NS-14

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-14-R3 | `[NS-14-R3] the letter files where the parent chose` | U | SB | 3 | none | Switch to Asha-2 then keep; the letter's child id is the chosen book | (code not built yet) Use the first book | mobile | - | DESIGNED |
| NS-14-R4 | `[NS-14-R4] a draft keeps its child` | U | SB | 3 | none | Waiting draft for A, switch to B; draft still A's (J-N6) | (code not built yet) Re-parent drafts on switch | mobile | - | DESIGNED |
| NS-14-R8 | `[NS-14-R8] no switch during a take` | U | SB | 3 | none | Listen mounted: no switcher in the tree | (code not built yet) Render the header switcher on Listen | mobile | - | DESIGNED |
| NS-14-R11 | `[NS-14-R11] selection resets for a second account` | U | SB | 3 | none | A's selection, B signs in: selection reset and no name of A's | (code not built yet) Persist selection globally | mobile | 09 | DESIGNED |

## NS-15

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-15-R4 | `[NS-15-R4] the app never reads a date from the words` | U | SB | 3 | none | Letters containing dates and weekdays: no date field changes without a pick; fuzz 50 phrases with a fixed seed | (code not built yet) Parse dates from words | mobile | - | DESIGNED |
| NS-15-R11 | `[NS-15-R11] removed with the letter` | I | SB | 3 | none | Erase everything and account deletion remove both days with the letter | (code not built yet) Leave the about-day | data-architect | - | DESIGNED |
| NS-15-R16 | `[NS-15-R16] second account sees nothing` | I | SB | 3 | none | A signs out, B signs in: no letters or dates of A | (code not built yet) No account clause | data-architect | - | DESIGNED |
| NS-15-R18 | `[NS-15-R18] no date from a picture` | U | SB | 3 | none | Picture file date never becomes the about-day without a pick | (code not built yet) Default the day to the EXIF date | mobile | - | DESIGNED |

## NS-16

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-16-R3 | `[NS-16-R3] the keeper's rules apply` | U | SB | 5 | none | Letter recorded for the keeper: edit, delete, privacy, counting rules are the account holder's | (code not built yet) Count it for the speaker | mobile | - | DESIGNED |
| NS-16-R4 | `[NS-16-R4] no contacts, no network` | S | SB | 5 | none | Name field: no Contacts import, no network while typing (scan, positive control) | (code not built yet) Import expo-contacts | security-architect | priv | DESIGNED |
| NS-16-R5 | `[NS-16-R5] never invites a child` | S | SB | 5 | none | Content scan on the path: no string invites a child or sibling to speak | (code not built yet) Add Ask your child to say | content | - | DESIGNED |
| NS-16-R6 | `[NS-16-R6] over thirty refused before upload` | U | SB | 5 | none | Name of 31 characters: Keep refused before any upload with a calm line | (code not built yet) Check after upload | mobile | - | DESIGNED |
| NS-16-R9 | `[NS-16-R9] no speaker identification` | S | SB | 5 | none | Source scan deny-list (diarization, speaker id, voice comparison) with positive control | (code not built yet) Import a diarization lib | security-architect | sec | DESIGNED |
| NS-16-R15 | `[NS-16-R15] names list cleared` | I | SB | 5 | none | Sign-out and Erase everything clear the names-used-before list | (code not built yet) Keep it in AsyncStorage | mobile | priv | DESIGNED |
| NS-16-R16 | `[NS-16-R16] name purged with the account` | I | CI | 5 | none | Account deletion purges the name with letters (supabase and local) | (code not built yet) Leave the name column | data-architect | - | DESIGNED |
| NS-16-R18 | `[NS-16-R18] an instruction, not an attestation` | U | SB | 5 | none | Review line is an instruction: no checkbox, nothing recorded | (code not built yet) Add a checkbox that stores consent | mobile | - | DESIGNED |

## NS-17

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-17-R1 | `[NS-17-R1] ungated languages are absent` | S | SB | 5 | none | Build the picker list in a store profile: only gated languages (read the signed gate file) | (code not built yet) List an ungated language | mobile | - | DESIGNED |
| NS-17-R2 | `[NS-17-R2] English output on other languages is measured` | P | CI | 5 | none | npm run gate on fixtures in each unoffered language; evidence filed; Review always shows words PROPOSE: test that every offered-or-unoffered language has a gate evidence row | (code not built yet) Skip the fixture for one language | ai-eng-lead | - | GAP |
| NS-17-R3 | `[NS-17-R3] no translation` | S | SB | 5 | none | Scan: no translate or transliterate call or UI | (code not built yet) Add a translate button | security-architect | - | DESIGNED |
| NS-17-R4 | `[NS-17-R4] the listing names only shipped languages` | S | SB | 5 | none | Store listing strings name only shipped languages (content test against the shipped list) | (code not built yet) List a future language | content | - | DESIGNED |
| NS-17-R5 | `[NS-17-R5] another language is one tap from Review` | U | SB | 5 | none | Take in another language in English-only build: one tap marks it, words leave view, audio stays, letter waiting (J-N23) | (code not built yet) Delete the audio on mark | mobile | - | DESIGNED |
| NS-17-R6 | `[NS-17-R6] language is chosen, never detected` | S | SB | 5 | none | Source test: every transcription call passes language and task transcribe; no auto-detect or translate | (code not built yet) Pass language null | ai-eng-lead | 09 | DESIGNED |
| NS-17-R7 | `[NS-17-R7] withheld words stay withheld` | U | SB | 5 | none | Withheld take: its machine output is absent from Review, index, share, PDF, export as words | (code not built yet) Index the withheld text | data-architect | - | DESIGNED |
| NS-17-R8 | `[NS-17-R8] withheld words never on the server` | I | CI | 5 | none | Withheld take: not synced; a pushed held draft has no words after the next push | (code not built yet) Push final_text | data-architect | 09 arch | DESIGNED |
| NS-17-R10 | `[NS-17-R10] held languages never reach the recogniser` | U | SB | 5 | cites english-only-language-hold.test.ts:162 | Held language never reaches the recogniser and asks for no download | Call the recogniser then discard | ai-eng-lead | - | DESIGNED |

## NS-18

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-18-R3 | `[NS-18-R3] words hidden by default` | U | SB | 4 | none | Typed day default body is the fixed line; showing on gives their words unchanged | (code not built yet) Always show words | mobile | - | DESIGNED |
| NS-18-R6 | `[NS-18-R6] typed days removed` | I | SB | 4 | none | Sign-out, Erase, deletion remove typed days and notifications | (code not built yet) Leave the notification | mobile | - | DESIGNED |
| NS-18-R8 | `[NS-18-R8] typed words never logged` | I | SB | 4 | none | J-N18 canary in a typed day never in logs, crash, URLs, notifications | (code not built yet) Log the day text | privacy | - | DESIGNED |

## NS-19

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-19-R1 | `[NS-19-R1] a kept letter is never reopened for speech` | S | SB | 3 (Rec) | none | No recording control reachable on a kept letter (nav test) | (code not built yet) Add Record more on the letter page | mobile | - | DESIGNED |
| NS-19-R4 | `[NS-19-R4] no edit spans two takes` | U | SB | 3 (Rec) | none | Two takes: separate raw transcripts and verifyEdits calls; no edit spans takes | (code not built yet) Concatenate before verifyEdits | mobile | - | DESIGNED |

## NS-22

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-22-R2 | `[NS-22-R2] header controls at AX5` | D | DV | 3 | none | AX5 SE 3: header controls >= 44 pt, fixed order | (code not built yet) Fixed 36 pt icon | design-systems | - | DESIGNED |
| NS-22-R3 | `[NS-22-R3] quiet and hide in 2 taps` | U | SB | 3 | none | Book has no gear; Quiet and Hide reachable in 2 taps (navigation tree) | (code not built yet) Bury under three levels | design-systems | 10 | DESIGNED |

## NS-23

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-23-R5 | `[NS-23-R5] never a private or sealed letter` | U | SB | 3 | none | Sealed, hidden, private, recently deleted letters never chosen (fixture of each) | (code not built yet) Skip the sealed filter | mobile | - | DESIGNED |
| NS-23-R8 | `[NS-23-R8] quiet book never resurfaces` | U | SB | 3 | cites month-ago-quiet.test.ts:41 +1 | Quieted or hidden book: no letter chosen | Ignore book quiet | mobile | 10 | DESIGNED |
| NS-23-R11 | `[NS-23-R11] snapshot hides the fragment` | D | DV | 3 | none | App lock on, background Home: snapshot has no fragment (switcher screenshot on device) | (code not built yet) Draw the fragment above the cover | mobile | 10 | DESIGNED |
| NS-23-R15 | `[NS-23-R15] never a hard-day letter` | U | SB | 3 | none | hard.* prompt, today's, empty words: never chosen | (code not built yet) Allow hard prompts | mobile | - | DESIGNED |
| NS-23-R17 | `[NS-23-R17] no donation from Home` | S | SB | 3 | none | [X6-R1] scan covers Home card | (code not built yet) Donate the fragment | security-architect | - | DESIGNED |

## NS-24

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-24-R2 | `[NS-24-R2] only their words` | U | SB | 4 | none | Year view pages hold only parents' words and datelines and labels | (code not built yet) Add a summary line | mobile | - | DESIGNED |
| NS-24-R3 | `[NS-24-R3] skips private and sealed` | I | SB | 4 | none | Private, sealed, hidden letters skipped | (code not built yet) Include private | data-architect | - | DESIGNED |
| NS-24-R10 | `[NS-24-R10] reads with a lapsed plan` | I | SB | 4 | none | Lapsed plan: the year reads in full | (code not built yet) Gate on plan | mobile | - | DESIGNED |

## NS-25

| Row | Exact title | Lvl | Run | W | Today | Fixture, act, assert | Mutant that must turn it red | Lane | Dsn | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| NS-25-R1 | `[NS-25-R1] no co-parent surface in store builds` | S | SB | 5 | none | Store profile: no co-parent surface or coming-soon line (flag off scan, test with the flag off) | (code not built yet) Render the invite row without the flag | mobile | - | DESIGNED |
| NS-25-R2 | `[NS-25-R2] peek shows sign-off and role only` | I | CI | 5 | cites v1_gate_limits_peek_pepper.test.mjs:126 | Peek endpoint returns sign-off and role only before agree (supabase test) | Return child name | data-architect | sec | DESIGNED |
| NS-25-R3 | `[NS-25-R3] private stays private` | I | CI | 5 | none | Neither parent reads or deletes the other's private letters (RLS test) | (code not built yet) Allow co-parent delete | data-architect | sec | DESIGNED |
| NS-25-R4 | `[NS-25-R4] undo within 72 hours` | I | CI | 5 | cites v1_gate_coparent.test.mjs:137 +3 | undo_parent_join within 72 h: P2 stops receiving; P2's letters leave the book and stay theirs | Keep P2's letters in the book | data-architect | sec | DESIGNED |
| NS-25-R6 | `[NS-25-R6] link page names no child` | S | SB | 5 | none | Link page template has no child or letter fields | (code not built yet) Add the child name | mobile | - | DESIGNED |
| NS-25-R7 | `[NS-25-R7] allowance per author` | I | SB | 5 | none | Each parent's allowance counts their own kept letters | (code not built yet) Count book total | data-architect | - | DESIGNED |
| NS-25-R10 | `[NS-25-R10] lost accept answer` | I | CI | 5 | none | Lost accept answer then retry: one membership | (code not built yet) New key per retry | data-architect | - | DESIGNED |
| NS-25-R12 | `[NS-25-R12] servers off hides co-parent` | U | SB | 5 | none | serverFeaturesEnabled false: invite and join absent; letters readable | (code not built yet) Hide letters | mobile | - | DESIGNED |
| NS-25-R14 | `[NS-25-R14] P2 deletes account` | I | CI | 5 | none | P2 deletes: P2's letters purged on the clock; P1's book intact | (code not built yet) Purge P1's letters | data-architect | - | DESIGNED |
| NS-25-R15 | `[NS-25-R15] P1 deletes account` | I | CI | 5 | none | P1 deletes: P2's letters survive with labels | (code not built yet) Cascade delete | data-architect | - | DESIGNED |
| NS-25-R16 | `[NS-25-R16] invite says what is shared` | U | SB | 5 | none | Invite sheet states other parent will read every non-private letter incl. earlier (content key) | (code not built yet) Drop earlier | content | priv | DESIGNED |
| NS-25-R17 | `[NS-25-R17] accept is recorded` | I | SB | 5 | none | Accept records one PRIV-R21 row (document, version, method, surface invite_accept) | (code not built yet) Skip the record | privacy | - | DESIGNED |
| NS-25-R19 | `[NS-25-R19] second account on the phone` | I | SB | 5 | none | Second account on P1's phone never sees, claims or uploads P1's letters ([X4-R1]) | (code not built yet) Claim unowned rows | data-architect | sec | DESIGNED |

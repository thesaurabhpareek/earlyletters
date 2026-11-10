# NX-39 council review record, 10 Nov 2026 (UTC)

Author: Chief Product Officer (Claude role), for `product`. Docs only. This is the record of a nine-lens review of the Memory Library drafts (#745 ADR, #746 flows, #747 NX-39, #748 privacy analysis, #749 benchmark, and the design spec in #751) and of how NX-39 v2 (`NX-39-memory-library.md`, same folder) answers it. It is evidence, not a counted review, not legal advice and not a founder decision. Every legal reading is an engineering reading for counsel.

Heads reviewed: #747 359f4ea2, #745 19c6eb1d, #746 00a1082c, #748 9bb1696c, #749 ae434ee7, #751 33912d22 (draft, branch `docs/design-memlib-consent-batching-10nov`).

## 1. How it was run, and its limits

Nine lens files were written independently into the council scratchpad: CPO with CBO and CFO (one session played three roles and had no ledger, so every money statement is structural), architecture and Chief AI Officer, privacy and compliance, CLO, CISO, CDO, CMO, User Researcher, Chief Design Officer. The CTO (Karma) then ruled on twelve points; `product` wrote the rulings into v2 and tie-broke where lenses disagreed.

Limits, stated plainly. (a) All lenses are Claude roles; none held a phone. Nothing about iOS background behaviour was measured by this team. (b) The User Researcher could not read the PRs and worked from the brief; I verified its file pointers on 10 Nov: `docs/research/USER_RESEARCH.md`, `NOTIFICATION_EVIDENCE_2026-11-01.md` and `PARENT_STUDY_PLAN.md` exist and say what the lens says; `docs/research/studies/` does not exist. Its section references to the PRs were not checked beyond that. (c) Several lenses did not read #746, #749 or most of #748 in full (each says so). (d) The merged UNVERIFIED list is NX-39 v2 section 14.

## 2. Verdicts per lens

SUPPORT (S), SUPPORT WITH CHANGES (SC), NEEDS EVIDENCE (NE), BLOCK (B). "Batch" is the idea of reading the library 2 to 3 times a day.

| Lens | P0 | P1 | P2 | P3 | P4 | Batch |
|---|---|---|---|---|---|---|
| CPO, CBO, CFO | S | SC (ship date only if place fails) | NE (study first) | SC (after P4 and P2) | SC (typed first; could ship before P2) | B as stated; NE as a smaller thing |
| Architecture, CAIO | S | SC (picker date and city UNVERIFIED) | P2a SC; P2b NE (Limited visibility) | SC (native transcode) | P4a S; moment reminder SC (bonus only) | B as a promise; NE as a mechanism |
| Privacy, compliance | S | SC | SC, but the ADR whole-library index is B | SC | SC typed only; B on a list | NE as a schedule; B as the trigger for a library notification |
| CLO | SC (short form not accurate) | SC | B as drafted (not in principle) | NE | SC typed; B on the nine-festival list | NE; B as a stated promise; SC as best effort behind its own switch |
| CISO | SC | SC | NE (index design) | SC | SC | B as specified; SC as foreground plus best-effort top-up |
| CDO | SC (fix export spec) | SC | NE (index shape) | SC | SC typed only | B as specified |
| CMO | SC (backup-aware line) | SC (no "place" in a public line until BL-843 and BL-844) | NE | SC | SC typed only | B as a public promise; NE as a capability |
| User Researcher | SC (test the promise wording) | SC | NE (study bars) | NE | NE | NE, leaning B; test what the parent feels |
| Chief Design Officer | S | SC | SC (ledger, date-only, hidden page) | SC (typed description) | SC (typed first) | SC, NE (look at open first) |

Reading across: no lens blocked P0. No lens supported unseen reads as a promise. Seven of nine ask for the study before P2b. All nine agree reading is not notifying.

## 3. Objections and how each was resolved

Resolved as: ACCEPTED (in v2), ACCEPTED WITH CHANGE, REJECTED (reason), or FOUNDER (section 6 of NX-39 v2 section 10). The id column is the v2 requirement or the backlog row.

| # | Lens | Objection | Resolution | Where |
|---|---|---|---|---|
| 1 | CAIO, CISO, CPO, CLO, CMO, CDO, privacy, design | The batch ask contradicts v1 R27, the ADR "no background modes", and LEGAL-REQ-011; nobody reconciled them | ACCEPTED. Read on open is the base; a best-effort top-up is P2c, its own switch and consent, flag off in production, ceiling 3 a day, never a floor, no number in copy; a sixth reversal row (S6) records it; the founder's request is met only as far as iOS allows | v2 sections 1.2, 2, 3; R44 to R46 |
| 2 | CAIO, CISO, CDO, CLO, privacy | The ADR persists a per-asset location trail (`library_asset`, geohash 6, `local_id`, epoch ms) | ACCEPTED. Moments rows only, day granularity, city key, no cell; ADR `library_asset` and `library_moment_asset` to be deleted in the ADR amendment | R40; BL-846, BL-877 |
| 3 | CAIO, CDO | Geohash 6 may be precise geolocation by area (arithmetic by three lenses: about 0.72 km2 against about 1.0 km2 for the California circle) | MOOT by design: no cell is stored. The question stays in the counsel brief only as confirmation (CB-12b) | R6, R40 |
| 4 | CAIO, CDO, privacy | A "home" is inferred by the ADR's modal-cell rule | ACCEPTED. Deleted; "away" is never defined | R15, R40 |
| 5 | CDO, design | Hidden and dismissed decisions sit in a table declared rebuildable, keyed by a hash that changes with the rule version | ACCEPTED. A separate store keyed by day range | R41 |
| 6 | CAIO | Limited access may make passive suggestions see almost nothing new | ACCEPTED as a gate: BL-871 (CAIO-1) before any P2b copy for Limited; no "full-strength" wording | R11; BL-871 |
| 7 | privacy, CISO, CAIO, CFO, design | A library-derived notification discloses a derived fact by existing, including by its timing | ACCEPTED; Karma ruled the same. No library-derived push at all. v1 R27 reversed | R27 |
| 8 | CLO, CMO, privacy | The short form "Your photos and videos stay on your phone" is an express claim contradicted by backup, iCloud download, export, print and synced words | ACCEPTED. Withdrawn; candidates for counsel in v2 5.1; wording not ruled | R1; F4 |
| 9 | CLO, CMO, privacy | The P2 permission string and pre-sheet do not describe an unseen read (Apple 5.1.1(ii), read) | ACCEPTED. The string names background use if and only if P2c is on in that profile; it is purpose only | R56 |
| 10 | CMO | The v1 string carries a promise ("on this phone only") | ACCEPTED. Purpose in the plist; where-it-goes in the sheet | R56 |
| 11 | CMO | Flows ML-S1 body says the app offers "a few words about it", which implies it supplies words | ACCEPTED as a note to `content` for BL-873; offer the parent a chance to speak | BL-873 |
| 12 | CLO, CMO, privacy, UR, design, CPO | The nine-festival starter list and "Falls on 12 Nov" are an editorial and religion-adjacent statement | ACCEPTED. Typed by the parent only; the word "festival" and named religious days stay out of copy and out of #746's nine-festival card until counsel answers CB-21 | R25 |
| 13 | design, privacy, CPO | The card shows a place | ACCEPTED. Date only; place after the tap on a kept item, only if Places is on | R16 |
| 14 | design | The Tonight card was drawn with up to 4 thumbnails (v1 R16) | ACCEPTED WITH CHANGE: no thumbnail on the card either (shoulder-surfing on a shared phone); thumbnails only in the chooser after the tap | R16, T4 |
| 15 | design | R17 forbids a list of dismissed moments while #746 stores them | ACCEPTED WITH CHANGE: R17 forbids counts and gap lists; the parent's own hides get a visible Hidden choices page behind App Lock | R17, R49 |
| 16 | design | #746's three-button "clear" dialog | ACCEPTED. Replaced by the ledger and a one-tap Forget | R49 |
| 17 | design | A media badge token named `scrim` collides with the existing `scrim` in `tokens.ts` | ACCEPTED. Rename to `mediaScrim`; recompute the contrast on that name | BL-849 |
| 18 | design, CPO | Numbers disagree between #746 and #747 (items per letter, snooze, card interval) | ACCEPTED. One table, owner `product` | v2 section 6 |
| 19 | CPO, privacy, CFO, UR | The pack's notification cap is unclear: v1 K6 says "one a day", the brief says weekly, and `planner.ts` has no numeric cap | ACCEPTED. One shared number, the founder's; default is the existing cadence; a constant and class registry are built first. Two lenses and `product` found no numeric cap in the code | R61; BL-869; F6 |
| 20 | CISO | Notification `userInfo` must not be derivable from an asset | ACCEPTED. A random per-notification id; the tap handler ignores all else | R26, R28 |
| 21 | CAIO | "Waiting" in the P4 string implies a backlog | ACCEPTED. No "waiting", "missed", "still", "forgot", "don't"; content proposes lines in BL-873 | R17, R26 |
| 22 | CAIO | A local notification's text is fixed at schedule time (a service extension works only on remote notifications, read) | ACCEPTED. Bodies are content keys | R26 |
| 23 | CAIO | Time zone is not available from PhotoKit | ACCEPTED. The phone's current zone, one function, fixtures, an accepted limit | R5 |
| 24 | CISO | The source scan is a text grep; aliasing defeats it; "passes by absence" proves nothing | ACCEPTED. AST scan, adapter field allowlist, positive controls, CODEOWNERS | R9; BL-845 |
| 25 | CAIO | Apple-derived collections (smart albums, People, Places) and album titles are ML output or typed text | ACCEPTED. Banned in code | R9 |
| 26 | CISO | The log canary is "not built", so R30 proves nothing yet | ACCEPTED. Marked NOT BUILT; a gate for P2b and P2c | R30; BL-862 |
| 27 | CISO | Native errors can carry file URLs or ids across the bridge | ACCEPTED. Closed enum codes | R50 |
| 28 | CISO | The index file class, backup flag and restore are unspecified | ACCEPTED. Set again on every open and rebuild; stated per file; restored index is rebuilt | R43, R42 |
| 29 | CISO | The app-switcher snapshot is not proven blank; this gates P0, not P2 | ACCEPTED | R36 |
| 30 | CISO | No test stops a widget, share extension, notification extension or app group being added | ACCEPTED | R51; BL-864 |
| 31 | CISO | Three new native modules are supply chain | ACCEPTED as process | R52; BL-878 |
| 32 | CISO | Temp originals hold GPS | ACCEPTED | R53 |
| 33 | CISO | Video container location atoms | ACCEPTED, folded into R8 | R8 |
| 34 | CDO | Export spec 4.2 says "original bytes"; filenames collide | ACCEPTED. A founder-merge fix to `DELETION_AND_EXPORT_SPEC.md` line 335; per-item filenames; schema bump | R32; BL-868 |
| 35 | CDO | `classification.test.mjs` cannot see device SQLite; R30 is untestable as written | ACCEPTED. A device-side column register test, interim until BL-016 | R30; BL-846 |
| 36 | CDO | Analytics events `moment_card_opened` and `moment_card_hidden` exist only if a moment exists | ACCEPTED. Removed from the catalog | R34 |
| 37 | CDO | Revoke is "at next launch" while the index persists | ACCEPTED. Check before every read | R42 |
| 38 | CDO | The unseen batch needs a data model; background results must not be stored as "pending suggestions" | ACCEPTED. Cursor and last-looked time only; no stored pending result | R46 |
| 39 | CLO | Server side is not closed: the `entry-photos` bucket and `photo_path` exist | ACCEPTED. Write-deny test | R54; BL-870 |
| 40 | CLO | No legal-document work is in the plan; the version path is muddled | ACCEPTED. Privacy and Terms major bumps and the right-to-add clause are counsel-gated rows with owner `legal`; the founder decides the path | BL-865, 866, 867; F5 |
| 41 | CLO | Terms 4.1.0 do not cover media the parent did not make | ACCEPTED as a draft task and counsel question CB-6 | BL-866 |
| 42 | privacy | The claims test must change: new Profile fields, denial claims, frequency patterns, notification strings | ACCEPTED | R55; BL-863 |
| 43 | privacy | Each consent layer needs its own act by the PRIV-R21 function with a hash | ACCEPTED | R47; BL-861 |
| 44 | privacy | A silent server push to wake the app must be refused in writing | ACCEPTED | R27, v2 section 9 |
| 45 | privacy | Tonight is not a child-facing surface | ACCEPTED | R57 |
| 46 | privacy | Compliance register rows CR-083, CR-040, CR-031 and six new rows | ACCEPTED as proposals to `legal` | BL-867 |
| 47 | CMO | Never say "travel", "trip", "holiday", "festival" in a public reminder line | ACCEPTED | R25; BL-863 |
| 48 | CMO | Photo counts: three documents disagree | ACCEPTED. No counts anywhere (card, notification, marketing) | R16, R17 |
| 49 | CMO | App Review plan, Notes for Review, a reviewer path with no real library | ACCEPTED | BL-858 |
| 50 | CBO | Free core stays ungated; no Plus copy for the library; media on a kept letter is not blocked | ACCEPTED | R58 |
| 51 | CFO | A cost table with counts, not dollars | ACCEPTED | v2 section 13 |
| 52 | CPO | Pre-written pass line and a stop rule | ACCEPTED | R59, R60; section 12 |
| 53 | UR | The success measure of the consent design is comprehension and a comfortable No | ACCEPTED | R48 |
| 54 | UR | Founder bias: the founder should not run the permission sessions | ACCEPTED as a recommendation | F3 |
| 55 | UR | Hard-season handling is not designed | ACCEPTED. Hide a day, a stretch or a photo; global off in two taps; study stop rule | R20, R49, R60 |
| 56 | design | The limited-library system prompt could break "never at launch" | ACCEPTED. `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` true, own picker | R3, R4 |
| 57 | design | The weekly digest | REJECTED. A digest is a library-derived notification (ruling 3). The Tonight card and shelf carry the in-app signal | R27 |
| 58 | design | CS-S4 wording "asks your iPhone for up to 3 looks a day" in parent copy | REJECTED. No frequency or number in any parent copy (ruling 2; privacy, CMO, UR, CISO, CAIO agree). The ledger shows real look times and no number | R44 |
| 59 | design | CS-S10 share-sheet route as an early honest win | DEFERRED, spec only. A share extension is a banned target (R51); it needs its own decision and a security review | v2 section 1.2 |
| 60 | design | CS-S11 widget | REJECTED, not offered (K1, R51) | R51 |
| 61 | CAIO, CISO | Moment reminders: CAIO would allow a bonus; CISO and privacy say never | CISO and privacy upheld (ruling 3). The P4b surface is in-app only | R27 |
| 62 | CAIO | Reading the cursor: change token or last-looked timestamp; photos AirDropped with old dates | ACCEPTED. Compare added date with last-looked day | R45 |
| 63 | CPO | P3 video waits behind P4 and P2 | ACCEPTED as order, since nothing depends on P3 | v2 section 3 |
| 64 | CDO | Retention: drop an unused index after 90 days | ACCEPTED as proposed number | v2 section 6 |
| 65 | CISO | Re-ask cooldown of 90 days | REJECTED in favour of "holds until the parent opens the control" (Apple 5.1.1(iv), read by CMO and privacy) | v2 section 6, T6 |
| 66 | CPO | A clickable prototype test of the pre-sheet before any P2 code | ACCEPTED as the study | section 12 |

## 4. Where lenses disagreed, and the tie-break

| Id | Disagreement | Tie-break and reason |
|---|---|---|
| T1 | Background read: CAIO and design allow it as a best-effort sub-switch; CISO, CDO, CPO-lens, privacy would not build it at P2 | Both recorded. Karma: foreground base; P2c is a separate off switch built behind a flag that is off in production; it does not ship until the two spikes, a counsel ruling on `UIBackgroundModes` and purpose-string completeness, and the study pass line. The CISO's cost (the weaker file class that a locked-phone read needs) is named in R43 |
| T2 | Moment reminder as a notification: CAIO "bonus"; CISO, privacy, design flows "never" | Never. The existence and timing of the nudge is the disclosure |
| T3 | Digest: design offers it; privacy and CISO refuse | Refused (T2) |
| T4 | Thumbnails on the Tonight card: v1 R16 allowed 4; design CDESO-8 none; privacy "date only" | None on the card; thumbnails after the tap. Reason: Tonight is read over shoulders |
| T5 | What clears what: CDO says "Stop these" clears the index and the decisions; design says Forget keeps the hidden choices | Decisions are kept by Forget, Stop these and revoke; only Erase everything, Delete account and an explicit "Clear hidden choices" on the Hidden choices page remove them. Reason: wiping a convenience action would bring a hidden hospital week back (CDO's own objection 3) |
| T6 | Re-ask: CISO and UR 90 days; privacy and design "holds" | Holds. A parent-initiated control only |
| T7 | P0 line wording: v1 and CMO A differ; CLO and privacy say backup-aware | Wording is counsel's and the founder's. The backup-aware qualifier is required in every candidate |
| T8 | Persisted index: ADR per-asset; privacy none; CISO and CDO "smallest shape" | Moments rows, city key, day granularity (CDO Shape A) |
| T9 | Phase table: v1, ADR and benchmark differ | CAIO section 5, adopted |
| T10 | Study gate on P2a: CPO and UR say no build before the study; CAIO gates P2a on counsel and D9 only | P2a needs counsel, D9 and the promise comprehension bar; P2b needs the full pass line. Reason: P2a is user-initiated and cheaper in trust; its words still need testing |
| T11 | Frequency: design wants "up to"; privacy, CMO, CISO, UR want none | None (ruling 2) |
| T12 | Places on cards: design separate Places switch; privacy and CLO date-only | Date-only on cards; the Places switch (default off) controls the chip in the chooser. The founder may veto |
| T13 | P4 before P2: CPO lens yes; v1 no | Offered. P4a needs no library and may ship first; the founder chooses by naming a release |

## 5. Merged counsel brief

Source: CLO section 4 (CB-1 to CB-24), which already merged NX-39 C1 to C13 and the privacy analysis ML-Q1 to ML-Q24 with a dedup map, plus questions added by other lenses. Each is a draft for counsel. The founder takes them to counsel; `product` and the CLO do not ask counsel for advice on his behalf. Proposed numbering in `COUNSEL_PACKET.md`: Q58 onward (Q57 was the last row the CLO saw, UNVERIFIED on other branches).

Status notes: CB-12b (the ADR index) and CB-16 (counts on a card) are reduced to confirmation by the v2 design. CB-22 is narrowed to the text of the typed-occasion reminder, since no library-derived nudge exists.

### Tier A: before P0 and P1 ship (first public text, first date and city read)

- **CB-1** (C9, Q1, Q22, C12). Are the proposed claims (the candidates PW-A to PW-D in NX-39 v2 5.1) accurate and not deceptive under FTC Act section 5, given (a) iPhone and iCloud device backup of app files, (b) Apple downloading an iCloud-only original during a pick, (c) Build 12 syncing the words of a letter, (d) the parent's own export and any print order? Is "We do not receive your photos, videos, or when and where they were taken" acceptable instead of "stay on your phone"? Which qualifier must sit beside the claim?
- **CB-2** (C1, Q2). Under Apple's definition of collect (data transmitted off the device), does reading the date and city of a photo on the phone, with nothing leaving it, leave Photos or Videos, Precise Location and Coarse Location answered No, for each route (picker, limited, full, Journaling Suggestions)? Does a derived list on the phone change that?
- **CB-3** (Q6, Q23, C9). Does adding media and removing "photos" from the not-collected sentence of Privacy section 2 need a material-change notice, the 30-day gap and re-acknowledgement? Are Privacy and Terms both major bumps under POLICY_VERSIONING 2.1 (draft revision Privacy 3.0.0 to 4.0.0, Terms 4.1.0 to 5.0.0; published 2.0.0 each if 1.0.0 is out)? One text for all phases or one per release?
- **CB-4** (Q5, Q6, Q4; design Q-D1). Is a consent act of our own needed beyond Apple's prompt? New key `media-library`, or inside `sensitive-data` (LEGAL-REQ-006)? Is the PRIV-R21 form sufficient, and may the act be recorded on the phone and uploaded at sign-in with no media fact in it? Is allowing photo access a counted act?
- **CB-5** (C2, Q4). Words for `NSPhotoLibraryUsageDescription` and the pre-sheet. May the string say only purpose (the microphone precedent)? Is the sheet an adequate notice at collection? If a background read exists, must the string and sheet name it (CB-19, CB-27)?
- **CB-6** (Q14, Q15, C6). Draft a right-to-add term for media the parent did not make, covering copyright, licence and a one-line first-add notice. Does the NCMEC sentence in Terms 9 stay accurate for a local-only app?
- **CB-7** (C5, C6, R38). Is the parent's own-book position enough for pictures of other people and other children when no detection runs? Confirm no biometric statute is touched (Washington, Illinois named; not opened).
- **CB-8** (C5, Q19, Q20, Q16). With children's media in the book, does the 2025 COPPA amendment, Read together showing media to a child, the 18+ gate, or a future adult's request for childhood images change any answer?
- **CB-9** (Q18, C13). A video with other people's voices, kept on the phone and possibly exported: exposure under California Penal Code 632 (register CR-041). Is Terms 5.5 and 9 enough?
- **CB-10** (C3, Q7, Q9, Q10). A city-level name kept with a letter, on the phone only: is it precise geolocation (California 1,850 feet, Washington 1,750 feet) or, taken at a hospital or clinic, consumer health data? Safest granularity? Does "we do not collect your location" stay true?
- **CB-11** (Q8). Which state sensitive-data and precise-geolocation rules apply to data that never leaves the phone? Is on-device reading by our app "collection" or "processing"?
- **CB-12** (C7, Q3). If Apple's geocoder were used instead of a bundled table, do the coordinates sent count as our collection? If the table is used, is anything left to disclose, including attribution of its licence?
- **CB-13** (C8, Q13). Export and print: the export may carry places as text; a print order sends content to a processor. Does "stays on your phone" survive? What warning, what defaults, should occasions be in the export?
- **CB-14** (C10, Q11). Is a picker-only P1 within App Review 5.1.1(iii)? For the Journaling Suggestions picker, what statement does the entitlement need? Please read the full Apple Developer Program License Agreement for any term on user and device data (only a fragment of 3.3.9 was seen, in a forum thread).

### Tier B: before P2 (library read, derived data, background)

- **CB-15** (C10, Q9 part). Is a library read justified over the picker for suggestion cards (5.1.1(iii))? Is Limited handled as the whole library acceptable, and does revocation need more than clearing the index?
- **CB-16** (Q21). Reduced: the card shows a date range only. Confirm a count shown on screen in the chooser (not on the card, never in a notification or analytics) is acceptable, or drop it.
- **CB-17** (Q17). For any future server copy of media, what duties arise under 18 U.S.C. 2258A (only (a)(1) and (f) read; the definition of provider not seen)? Is the unused `entry-photos` bucket with `photo_path` already relevant?
- **CB-18** (Q24). Does extending the no-inference rule (LEGAL-REQ-015) mean the app may not classify a place on the phone (for example to hide a hospital), and is any on-device place classification itself a health inference?
- **CB-19** (new, batch). The founder wants a best-effort background read, with a ceiling and no promise, behind its own switch. Does an unseen, repeated read change any answer above (CB-1, CB-2, CB-10, CB-11)? What must the sheet, the purpose string and the Privacy text say? May the product ever state a frequency? (v2 answer by design: it will not.)
- **CB-20** (new, batch; merges CLO CB-20 and CISO S6). Which Apple terms apply to scheduled background work and to deriving data from the library in the background (background modes, App Review 2.5.4, the license agreement)? Counsel's ruling on `UIBackgroundModes` and LEGAL-REQ-011 (`preflight-testflight.mjs` lines 575 to 576) is required before the flag for P2c can ever be on in a shipped build.
- **CB-12b** (new, ADR index). Reduced to confirmation: v2 stores moments rows (a day range and a city key). Is that a location history or precise geolocation, even on the phone? Would computing on open and keeping nothing change the answer?
- **CB-25** (new, design and privacy). The parent's hidden days and stretches (and the 14-day snoozes, which are a date range plus an expiry) are stored as bare dates on the phone. Is that sensitive data? Should it be excluded from device backup? Should it be exported?
- **CB-26** (new, design). The ledger's recent-looks list holds only times and a reason. Is that a new record needing disclosure?
- **CB-27** (new, privacy and CMO). Purpose-string completeness per build: if the string must name background reading, and cannot, the background top-up does not ship.
- **CB-28** (new, engineer's points 7 and 9, PR #754). When access narrows (All to Limited, or fewer photos shared) the app records no fresh consent act, wipes the index and shows the parent a plain note; when iOS access is revoked it records no withdrawn act. Is the existing record of the agreement still accurate and sufficient in both cases, or must a narrowing or a revoke produce its own act? Is the plain ledger note adequate notice? (Also read with CB-4 on the act vocabulary.)

### Tier C: before P4 (occasions, reminders)

- **CB-21** (C4, Q12). Is a parent-typed occasion, on the phone only, outside special-category or sensitive-data rules? Would a neutral list change it, and how should a list be chosen, dated and reviewed? Which regions does the 1.0 audience include?
- **CB-22** (reduced). Is the fixed neutral text of a reminder for a parent-typed day misleading or an implied claim? Which fixed lines carry no inference?
- **CB-23** (C11). Marketing-consent, quiet-hours or religion-adjacent concerns for local notifications with neutral text? Is "Show the day's name on the lock screen", off by default, acceptable?
- **CB-24** (flows Q5). If the app ever shows a date for a lunar or sighting-based day, is a wrong date a misrepresentation, and who signs off the date table? (Moot while occasions are typed only.)

### Candidate promise forms for counsel (not ruled)

See NX-39 v2 5.1 (PW-A to PW-D). The "we do not receive" family is the shortest honest form; the backup-aware wording is needed under each. The words, the verb ("receive" or "send") and the label answer are counsel's and the founder's.

### Policy and legal-document work (CLO-7), owner `legal`, accountable the founder

Privacy Policy major bump; Terms major bump with the right-to-add clause and the one-line first-add notice; in-app disclosures; the App Store labels doc (2.1.0 to the next minor or major by phase); the data policy rows for `entries.photo_path` and `entry-photos`; the new `media-library` consent key in the POLICY_VERSIONING section 1 table; the claims registry in `docs/legal/CLAIMS.md` (absent today); Trust promise strings in `strings.en.ts`; compliance-register updates (CR-083 becomes untrue when P2a ships; CR-040 extended to OS vision and people frameworks via Photos APIs; CR-031 a row for place near a health facility; six new rows: background-run disclosure, notification content and 4.5.4, purpose-string completeness, derived-cache retention and deletion, sensitive treatment of typed occasions, silent-push refusal). Rows: BL-865, BL-866, BL-867, BL-868. Legal text under `docs/legal/**` is merged by the founder only.

### Dedup map (from the CLO)

C1=CB-2; C2=CB-5; C3=CB-10; C4=CB-21; C5=CB-7, CB-8; C6=CB-6, CB-7; C7=CB-12; C8=CB-13; C9=CB-1, CB-3; C10=CB-14, CB-15; C11=CB-23; C12=CB-1; C13=CB-9. Q1=CB-1; Q2=CB-2; Q3=CB-12; Q4=CB-5; Q5=CB-4; Q6=CB-3, CB-4; Q7=CB-10; Q8=CB-11; Q9, Q10=CB-10; Q11=CB-14; Q12=CB-21; Q13=CB-13; Q14, Q15=CB-6; Q16=CB-8; Q17=CB-17; Q18=CB-9; Q19, Q20=CB-8; Q21=CB-16; Q22=CB-1; Q23=CB-3; Q24=CB-18. New: CB-12b, CB-19, CB-20, CB-22 (reduced), CB-24, CB-25, CB-26, CB-27, CB-28.

## 6. Settled by the CTO and the CPO, not founder decisions

Not on the founder's list because they are ruled or follow from a rule the founder already set: the single phase table; read on open as the base; the background top-up as a separate off switch with a ceiling and no number in copy; no library-derived notification; moments rows only in the index and the decisions store; occasions typed only; date-only cards; export carries the stored copy only; the study extends Q5 with bars written first; free core ungated; everything from P2 onward off in production until its gate passes; the shared cap built as one constant; Dates and Places as separate switches (default Places off); Forget turns looking off and keeps hidden choices; revoked access clears the index; the Hidden choices page is visible; no digest; no widget; no share extension; the share-sheet route deferred. The founder may reverse any of these.

## 7. Design PR #751 folded in

Taken: the `when` block in the pre-sheet, the ledger page (CS-S3), the second consent (CS-S4a) with its recent-looks list of times, Forget as one tap (CS-S13), the Hidden choices page (CS-S12c), the date-only card (CS-S6), the composer shelf (CS-S9), the state matrix (CS-S14), the `mediaScrim` rename, the typed video description, the plist key that stops the system's automatic limited-library sheet, the design agent's finding that Limited makes background surfacing thin. Not taken: the weekly digest (CS-S7), "up to 3 a day" in parent copy (CS-S4), the share-sheet route and the widget (CS-S10, CS-S11). Open design questions answered: background looks are P2c after the spikes; no frequency is shown; Dates and Places are separate; the digest is not offered. The design agent found no numeric weekly-cap constant in `planner.ts`; `product` confirmed it.

## 8. Engineer's ten points on PR #754, and the rulings (10 Nov 2026, UTC)

An engineer built the moment engine, the decisions store and the consent state machine from NX-39 v2 (PR #754, branch `feat/core-memlib-moment-engine-10nov`, head de11e2d0) and found ten ambiguities, written as comments in `packages/core/src/moments.ts`, `decisions.ts`, `media-consent.ts` and their tests. Karma (CTO) ruled on each. The rulings are reversible and the founder may overrule any of them. This section records that the rulings below answer those ten points, in the order Karma gave them, and where each landed in NX-39 v2 (same folder) and the backlog. `product` adopted every ruling; four need a note, listed after the table as tie-breaks the founder can reverse. The engineer's own wording of the ten points is in the code comments named above; this record does not restate it.

| # | Ruling | Landed in |
|---|---|---|
| 1 | R15 monotonicity holds only for additions with no city key or a city the day already has. Adding a different city between matching days may split a moment. | R15 text and a second test title; BL-859 |
| 2 | Hidden photo key: opaque, random, per item, made at chooser time, kept only in the decisions store, never an asset id and never derived from one, at most 200 characters. SUPERSEDED by ML-13 below: no stored per-photo key for an unattached photo. | R41, R20, R49; BL-874, BL-877, BL-860, BL-876 |
| 3 | The 14-day snooze and "Not now" for cards are records with an expiry in the decisions store. They survive a rebuild and go on Erase everything, Delete account and Clear hidden choices, not on Forget the list or Stop these. | R17, R41, R31, R18, R49; BL-860, BL-876, BL-877 |
| 4 | Hiding a day inside a moment trims it, splits it if a middle day is hidden, and each leftover piece must re-qualify under the same rule (a lone leftover day is dropped). | R20; BL-860 |
| 5 | Reason codes as the engineer defined them: `MIN_ITEMS_MET`, `DAY_RUN`, `SAME_CITY`, `NO_PLACE_JOINED`; a multi-city moment (a flight day) has `cityKey` null. | R15; BL-859 |
| 6 | `dayKeyAt` stays in `moments.ts` as a pure helper for R5; the caller supplies the offset. | R5; BL-859 |
| 7 | Acts are `agreed` and `withdrawn` only. "Not now" and a system revoke record no act. The PRIV-R21 act vocabulary and the writer's location are UNVERIFIED and counsel-adjacent. | R47, section 8 of NX-39 (door lines), section 14 item 30; BL-861; CB-28 |
| 8 | After "Not now", tapping a chooser entry shows no consent sheet and the picker keeps working. Only opening the control brings the sheet back. | R3; BL-861, BL-874 |
| 9 | Narrowed (All to Limited, or fewer photos): no fresh consent act, the index is wiped, the ledger shows a plain note. Flagged for counsel. | R11; CB-28 (new, Tier B); BL-861 |
| 10 | `media_background` and `occasions` use the same seven states, except that Limited and Narrowed apply only to `media_read`. State tables added. | NX-39 section 7.3.1; BL-861 |

### Tie-breaks the founder can reverse

Rulings 1, 3, 5, 6, 8 and 9 are adopted as given with no reservation. Rulings 7 and 10 are adopted with a stated limit. Rulings 2 and 4 are adopted but are not enough on their own to build from; `product` thinks each needs the founder or Karma to confirm one more thing.

- **Ruling 2 (hidden photo key).** Adopted as written. Limit, stated in the requirement: a random key that is not an asset id and not derived from one cannot find the same photo again in a later session, unless the key travels with the item (an item already attached to a letter) or the chooser holds its own session map. So "Hide this photo" can hold across sessions only where the app can re-match, and `product` does not know a way to re-match an unattached library photo without an asset id or a derived value. Recommendation: either accept that a hidden unattached photo is hidden for the open chooser session only (and say so in the Hidden choices page copy), or allow a per-install keyed hash of the asset id, which needs CISO and counsel (CB-25) first. BL-874 asks the engineer to say which. Reading of "what happens when the item is removed": an item leaving a letter, a letter being purged, or a photo leaving the phone's library changes nothing in the decisions store (the app cannot know, and decisions survive purging, R41); the key is then inert, at most 200 characters, and goes on Undo or the three removal paths. If Karma meant the key should also go when its item is removed, that is a one-line change in BL-877.
- **Ruling 4 (re-qualify leftover pieces).** Adopted. It changes the built code: `applyDecisions` in PR #754 takes moments only and keeps the parent moment's reasons on each piece, and a moment carries no item count and no active-day count (R40, R15), so it cannot judge a piece. NX-39 R20 therefore says each piece is judged by running the R15 function on the items inside the piece with the hidden day as a barrier (without a barrier, removing a middle day would leave a one-empty-day gap that the rule bridges, and the split would not happen). The engineer's decisions test "pieces keep the moment city key, reasons and rule version" will change. This is a signature change for BL-860, not a ruling `product` disputes.
- **Ruling 7 (no act for Not now or a system revoke).** Adopted. Limit: after a system revoke the last act on record still reads `agreed` while access is gone. That is truthful about what the person chose, but it is a question for counsel, so it sits in CB-28 beside ruling 9.
- **Ruling 10 (state tables).** Adopted. Limit: `media_background` has no system question, so Denied is never entered (the parent's No is Held); the tables say so. The engineer's code also keeps the background layer's status at All with the switch off when the read layer goes away, where the table says Revoked; the outcome (switch off, requests cancelled, no read) is the same, and BL-861 reconciles the name.

### 8.1 Later rulings: ML-13 and ML-14 (10 Nov 2026, UTC)

**ML-13 (Karma, supersedes the stored-key part of ruling 2).** Hiding ONE photo that is not attached to a letter holds for the open chooser session only. A random key cannot re-match an unattached library photo in a later session without an asset id or a derived value, and ML-4 forbids both. Durable hides are a day or a stretch. Where it landed: R20 (a single unattached photo is session-only), R40 (no per-photo key stored for an unattached photo), R41 (no stored per-photo key; an attached item keeps its own opaque random key inside the letter's media row, capped at 200 characters, which is the only place the cap still applies), R49 and BL-876 (the Hidden choices page lists days and stretches and tells the parent, in plain words, that hiding one photo lasts only while choosing and that a day or a stretch is the durable way), BL-874 (session-only, in memory, test that the next session offers it again), BL-877 and BL-860 (no photo key in either store). This removes the open question in the ruling 2 tie-break above: the first of the two options was taken.

Option NOT taken: a per-install keyed hash of the asset id, which would let "Hide this photo" last across sessions. It is a value derived from an asset id, so it needs the CISO and counsel (CB-25) before anyone builds it, and it would need ML-4 to be reopened by the founder. Until then it is not in scope and no task builds it.

**ML-14 (Karma).** `applyDecisions` must judge leftover pieces by running the R15 rule on the items inside each piece, with the hidden day as a barrier. This is ruling 4 made binding on the code: PR #754 (head de11e2d0dee10a7aa57273b001ea8697f3b89af3) takes moments only and keeps the parent's reasons on each piece, so it needs a follow-up commit. Tracked as BL-881 with a Done-when and named tests; BL-860 is not marked done until BL-881 is merged.

Nothing in the rulings reverses a founder decision, a LEGAL-REQ line or the constitution.

Chief Product Officer (Claude role)

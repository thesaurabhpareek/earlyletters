> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

# Moments tab: executive review, Privacy (NS-53)

Reviewer: Chief Privacy Officer (a role played by an AI session, not counsel). Nothing here is legal advice; every legal judgment is marked "counsel must confirm" and goes to the CLO for the counsel brief.
Date: 21 Nov 2026
Reviewed: `docs/product/prd/28-moments-tab.md` at branch `wip/moments-prd`, commit 5bebd892, read in full (1187 lines, NS-53-R1 to R191). Section 25.8 is this review.
Also read: `docs/agents/exec/COUNCIL.md`, `docs/legal/DATA_CLASSIFICATION.md`, `docs/legal/privacy-policy.md`, `docs/legal/app-store-privacy-labels.md`, `docs/adr/0032-on-device-sensitive-store.md`, `apps/mobile/src/lib/days/store-file.ts`, `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/eas.json`.

## Verdict: ACCEPT-WITH-CHANGES

Recommendation on READ_SET_V1 (to the founder, who signs G3 and G10): APPROVE WITH CHANGES. The set is the right size for the job. Two of its members need a handling condition (location, left-out identifier) and the consent text must name what the set reads. Detail in section "READ_SET_V1 recommendation".

What a parent would be told: the app reads the date, time, kind, favourite mark and place of their pictures on the phone, shows days and city names, and sends none of it anywhere. I can sign that sentence as true of the design as written, with the conditions below. I cannot sign it today, because the consent text in 8.5 does not yet say "place".

### Conditions (all must be met before F2 is turned on in the release profile)

1. EX-PRV-1: the primer sentence, the purpose string and the Decline line name the place read and what withdrawal does not remove. No consent text ships that says "date and time" alone.
2. EX-PRV-2: the library surfaces (pictures slot, Recent, places, picture year-ago) obey the quiet, hidden, hard-stretch and expecting-only rules that S4 already obeys.
3. EX-PRV-3: raw coordinates never reach JavaScript; the native module returns a coarse cell or a place id.
4. EX-PRV-4: the network geocoder adapter is absent from the release binary while F3 is off, proved by a binary scan.
5. EX-PRV-7: analytics kinds that can mark a birthday or month day are removed from the allowlist before the registry rows land.
6. EX-PRV-8: policy, label and in-app text are published in the same build, written for the production profile (servers on), with the stored-copy backup line and a correct "we hold nothing from the library" sentence.
7. EX-PRV-5, EX-PRV-6: the place-harm controls and the stored-identifier controls below are written into the rows.

Counsel must confirm: G2 items (label per type, the backup line, 5.1.2(vi), COPPA reading for a child's picture copied by a parent), unchanged from the PRD. I add none that the packet lacks, except the Apple geocoder as "collection" (already in 7a.1) and the email processor inference in EX-PRV-11.

### Counts

14 findings: 2 BLOCKER, 6 MAJOR, 6 MINOR.

| Id | Severity | One line |
|---|---|---|
| EX-PRV-1 | BLOCKER | Consent text omits the location read |
| EX-PRV-2 | BLOCKER | Library surfaces ignore quiet, hard-stretch and expecting-only books |
| EX-PRV-3 | MAJOR | Raw coordinates cross into JavaScript |
| EX-PRV-4 | MAJOR | Apple geocoder code ships dormant in the release binary |
| EX-PRV-5 | MAJOR | Place labels can name a hospital stay or the birth city |
| EX-PRV-6 | MAJOR | Stored photo identifier: approve with five controls |
| EX-PRV-7 | MAJOR | Analytics kinds mark birthdays; a source contradiction; an error code leaks access state |
| EX-PRV-8 | MAJOR | Label, policy and backup statements for the production profile |
| EX-PRV-9 | MINOR | A sensitive picture can surface as a tile before the parent can remove it |
| EX-PRV-10 | MINOR | Withdrawal does not remove attached copies; the Decline line must say so |
| EX-PRV-11 | MINOR | Lifecycle email: a processor learns the child's birthday |
| EX-PRV-12 | MINOR | Spike and card sort use real family libraries |
| EX-PRV-13 | MINOR | Privacy manifest and logging details in the native module |
| EX-PRV-14 | MINOR | The canary test does not cover attach, Keep, sync and export |

## What I traced (the flow, in words)

Collected where: the user's photo library, on the phone, through PhotoKit, by one native module (10.1 step 1). Read: identifier, creation date, media type, duration, subtype flags, favourite flag, burst id, and (RV-19) location coordinates.
Held where: in memory for the session. On disk only: the decisions file `moments.json` (day keys, a 60 character parent label, hidden place keys, home correction, and with O-13 a picture identifier), outside `scribe.db`, excluded from backup (17, 10.2). Copies of pictures a parent attaches go into `entry_media` in the app container after Keep.
Who reads it: the parent on this phone. No server table, column, RPC or sync op is added (R116). Staff cannot read it because it never arrives.
Leaves the phone: nothing by design. The two possible exits are the Apple geocoder (P-B, flag F3 off) and phase 2 email rows (parent-chosen date, repeat flag, channel only).
How long: the session for memory; until the parent removes it for `moments.json`; with the letter for attached copies.
Deleted by: Turn off, Erase, sign-out, Delete account for the file (R115); the existing letter deletion paths for copies (R97).

The promise it touches: `docs/legal/app-store-privacy-labels.md` line 50 ("Location: not requested") and line 54 ("Photos or Videos: No photo feature in v1.0"), `docs/legal/privacy-policy.md` line 21 (servers off in "the first App Store build"), and `apps/mobile/src/lib/capabilities.ts` lines 7 to 12 (store profiles stay off). All four are stale against `apps/mobile/eas.json` lines 47 and 61, where `EXPO_PUBLIC_SERVER_FEATURES` is "on" for the preview and production profiles (matches the verified fact in PRD section 17). Code and promise differ, so the promise changes, and it is owned by `legal` with me; see EX-PRV-8.

## What the PRD gets right (so the findings read in proportion)

- The ask is on the parent's tap, after a primer, with equal Not now and Continue, no second ask, no gate on any feature (8.2, 8.4, R70 to R73). That is the design I would have written.
- No library-derived value reaches a server, route, log or analytics event, and a canary test exists (R162). The registry design (R36, R130) fails the build if a library source lists push or email.
- Faces, people, scene inference and pixel reading are out and scanned for (R43, R68, R164). K-SUG is held behind G9.
- The decisions file reuses the ADR 0032 write order (empty temp, set backup exclusion, read back, write, rename, read back), which `apps/mobile/src/lib/days/store-file.ts` already implements. Nothing library-derived goes into `scribe.db`, which is backed up whole (ADR 0032 context, line 9).
- Pictures dated before the birth are never used (F14), which protects ultrasound images and pregnancy loss in the common case.
- Limited access is honoured and a revoke empties the data on the next foreground (R75, R77, R115).

## Findings

### EX-PRV-1
Severity: BLOCKER
Requirement ids: NS-53-R72, R37, R61, R81, section 8.5 (primer row), RV-19
Finding: The primer sentence in 8.5 reads "{app} reads the date and time of your pictures on this phone to show you days. It does not look at what is in them." After RV-19 the module also reads each picture's location, the favourite mark and the burst id, and shows a city name derived from the location. A parent who taps Continue on that sentence has not been told that where their pictures were taken is read and turned into place names. That is consent to less than the build does. R72 requires the purpose string to name "every use", which is right, but the primer, which is the actual consent moment and the thing the parent reads first, is not covered by R72 as worded, and the 8.5 Never column ("not a picture, id, date, album, place or count") says nothing about reading a place at all.
Proposed change:
1. Rewrite the intent of the 8.5 primer row to: reads the date and time of your pictures, and where they were taken, on this phone, to show days and city names; does not look at what is in them; nothing about them is sent anywhere. Counsel and `content` write final words. Keep the D5-F4 ban on "stays on this phone" absolute claims out of the line; say what we do, not a guarantee wider than the build.
2. Add to R72: the primer, the purpose string and the Me row each name the place read by content key, and a test compares the three key sets for the same list of reads (date, kind, favourite, place).
3. Add a Decline line: Not now and Don't Allow leave every feature working (already there) and Turn off removes what the tab holds on the phone at once but does not remove pictures already attached to letters (see EX-PRV-10).
4. G2 counsel read covers the final sentence together with the purpose string.
Evidence: `28-moments-tab.md` line 439 (primer row), line 451 (R72), line 313 (R37), line 106 (RV-19), line 348 (P-A row: "the purpose string and policy say so"). The P-A row says the purpose string and policy say so; the primer row does not. Source read. Whether `asset.location` is readable under Limited access without a separate location permission is UNVERIFIED (PRD line 1181); the text must be written after the spike answers it.

### EX-PRV-2
Severity: BLOCKER
Requirement ids: NS-53-R24, R47, R32, R40, R10, R21, R57, U19, RK-3, RV-18
Finding: R24 and U19 suppress the year-ago letter card and the bright tone when a book is in a hard stretch or quiet state, but they do not mention the library surfaces. The pictures slot of For you (7.3), Recent, place cards, occasion collages and RSN-YEAR for pictures (R47 guards only "not quiet or hidden") are all fed by S7, and R32 says S7 is the same under both books, because the library is per phone, not per child. So in a quiet book, a bereaved or struggling parent can open Moments and be shown "Pictures from this day in 2025", a place card for a hospital city, or the birthday collage of a child who has died, with a warm reason line. The product's own content rule is "legacy is about love and time, never endings". The PRD protects the parent's letters from this and leaves their own pictures, which are the more likely to hurt, unprotected. Expecting-only books have the same gap: R21 stops S3, but nothing says S7 and places are off before the birth, and the library may hold scans and test images from a pregnancy loss.
Harm score: likelihood 2 (a minority of families, certain to include some at scale) times harm 5 (irreversible, cannot be unseen) = 10. The fix is cheap.
Proposed change:
1. New requirement: in a book that is quiet, hidden, in a hard stretch, or expecting-only (no birth date reached), Moments renders no S7 card, no Recent list, no place line, no RSN-YEAR picture card, and no occasion collage; the picker door ("Add pictures") stays. The state function that already gates S4 gates S7.
2. Because the library is per phone and books are per child, the rule is: if any visible book is quiet or hard-stretch, the library surfaces are off on this phone until the parent changes the state. This is the stricter choice and I recommend it; the alternative (per book) leaks a sibling's pictures into a quiet book through the shared library. The CPO may propose per book if the engine can prove no cross-book day appears; I would want that proof as a test.
3. Add a golden to `asha-lib-v1`: a quiet-book case and an expecting-only case, both expecting zero library cards.
4. No analytics, push or log may record that the rule fired.
Evidence: `28-moments-tab.md` line 269 (R24), line 277 (R32), line 323 (R47), line 609 (U19), line 266 (R21), line 249 (F14 never used before birth). Source read. How "hard-stretch" is detected is an existing local state (R24 cites it); I did not read its code and mark its trigger conditions UNVERIFIED.

### EX-PRV-3
Severity: MAJOR
Requirement ids: NS-53-R37, R61, R110, 7a.2 step 1, 10.1 steps 1 and 3a, section 10.2, RV-19
Finding: The design says coordinates are "read only inside the place resolver (`core/moments/place.ts`)" and "dropped as soon as a place id exists". But step 1 of the data-flow table has the native module return "the picture's location coordinates when present" in "columnar typed arrays" to TypeScript, and step 3a resolves in `core`. So full precision latitude and longitude for every asset in the scan window (a 20,000 item library is the test case) cross the native bridge and sit in the JavaScript heap for the life of the scan. "Never persisted, never logged" is then a discipline in TypeScript rather than a property of the module boundary. A coordinate in the JS heap can reach an error boundary payload, a breadcrumb, a dev-tools dump or a future crash SDK through an object that happens to hold it. The firewall wants a type test; the better answer is that the precise value never exists above Swift.
Proposed change:
1. `scribe-library` rounds each coordinate to the place table's grid cell inside Swift and returns a cell index or a place id, never a latitude or longitude. The offline table and its lookup live in the native module, or the cell index is the only thing handed to `core/moments/place.ts`. A TypeScript test fixture can still feed synthetic cells.
2. READ_SET_V1 lists location as "coordinate, rounded in the module to the table's cell, never returned". The source scan of R37 fails on any `CLLocation` member other than `coordinate` (no altitude, speed, course, floor, accuracy or timestamp).
3. The type test of R61 stays, as a second line, and gains: no `number` pair named like a coordinate crosses the bridge type.
4. The home place stays in memory only (7a.2 step 3) and its correction key is a place id, not a coordinate.
Evidence: `28-moments-tab.md` line 517 (step 1 outputs), line 519 (step 3a), line 356 (7a.2 step 1), line 313 (R37), line 388 (R61). Source read. Whether this changes the spike budget is a mobile question (G1); the table size and licence are UNVERIFIED (PRD line 1181).

### EX-PRV-4
Severity: MAJOR
Requirement ids: NS-53-R43, R62, R117, 7a.1 option P-B, flag F3, gate G8, RV-18
Finding: I agree with the PRD default: ship P-A (offline table) and P-C (parent-typed place), keep P-B behind G8. But R43 allows `CLGeocoder` and `MapKit` "outside the gated adapter", and R62 says the adapter "exists only behind a flag that is off". A flag-off adapter still ships in the binary, still links the symbols, and is one config change from sending a precise coordinate to a third party. That contradicts the first release's strongest claim ("nothing library-derived leaves the phone") with dormant code, and App Review reads symbols and strings. The label stance (Location "not collected") depends on Apple's definition of collect, which is transmit off the device; the adapter is exactly that transmit.
Proposed change:
1. In every profile where F3 is off, the adapter module is not compiled in. The binary scan of R169 fails the build on `CLGeocoder`, `MKLocalSearch`, `MKReverseGeocodingRequest` and any URL session in `scribe-library` in those profiles. R43 changes from "outside the gated adapter" to "outside a module that exists only in a profile that has passed G8".
2. When P-B is eventually on: it sends a coarsened coordinate (the table's cell centre), never the picture's own; at most one request per day shown; never for a day inside a quiet or hidden book (EX-PRV-2); never for the home place; the consent names the data and the recipient; it is a separate opt-in off by default (R62 already says this). Counsel must confirm whether this is "collection" for the label and 5.1.2(vi); what Apple logs or keeps about a request is UNVERIFIED and the consent text may not claim anything about it.
3. Venue labels by P-B are the highest sensitive-place risk in the PRD (see EX-PRV-5). My recommendation to the founder on O-31: not before there is parent evidence from the card sort that city names are not enough.
Evidence: `28-moments-tab.md` lines 344 to 352 (7a.1), line 319 (R43), line 389 (R62), line 858 (F3), line 874 (R169). Source read. Apple's `CLGeocoder` network behaviour is the lead's finding (PRD line 344, "VERIFIED by that lead"); I did not re-read Apple's page this session, so I treat it as carried.

### EX-PRV-5
Severity: MAJOR
Requirement ids: NS-53-R63, R64, R65, R58, U23, U24, RK-3, 7a.2 steps 3 to 6
Finding: The PRD answers the sensitive place question for the name of a venue ("the offline table names only a city, never a venue or a street, so a hospital cannot be named", U24). That is true and good. It does not answer the harder cases at city level:
1. A hospital stay in another city (a NICU transfer, a specialist centre, a birth away from home) becomes a place theme: "Boston, 3 to 9 March", a collage of the stay, reason RSN-PLACE, on a card the parent did not ask for (R64). In a small town with one large hospital the town name is the hospital.
2. The child's date of birth is the one day most likely to be at a hospital. K-BIRTH and the birthday collage on that day can carry a place line when the hospital city is not the home city.
3. The only remedy is reactive: "Not this place" lives in the card menu (11, U23) and "Hide this place" after the parent has already seen the card.
4. The home place is the most frequent resolved place in the scanned window and the correction "This is where we live" is stored as a local key. That key is a home city fact: classify it L4, list it in Turn off, and exclude it from every Moments export (R103 already says Moments data is never in an export).
5. "No part-of-day word, no 'trip' word" is the right tone rule but a city name next to a date range reads as an event whatever the label says.
Proposed change:
1. Place themes (runs of days at one away place) appear only in Recent, never in For you, and a first appearance of a place line on a card shows "Not this place" as a visible control on the card, not only in the menu. Whether the PRD wants themes at all in the first release is a product call; as the privacy reviewer I would ship single day place lines first and themes after the card sort (E7).
2. No place line on the child's date of birth, and none on a day with a K-BIRTH occasion reason.
3. The table has a minimum coarseness: city level or larger, no neighbourhood or campus entries, and a population floor set by G1 (no number invented here). A day whose nearest entry is below the floor gets no place line.
4. The place radius and tie rules stay as written; add that a place seen on fewer than a floor of pictures in a day gives no line (data in `rules.ts`, set by the spike).
5. Classify the home-place correction key and hidden-place keys L4 in the table of section 17 (R65 names only the hidden key) and wipe both on Turn off, Erase and sign-out.
6. Add to G4: ask the five parents specifically about a stay away from home, and treat "I did not expect it to know" as a halt for places (R60 already halts the signal).
Evidence: `28-moments-tab.md` lines 358 to 361 (7a.2), line 390 to 392 (R63 to R65), line 613 to 615 (U23 to U25), line 930 (RK-3), line 809 (hidden-place keys row). Source read. The harm score is my judgment (likelihood 2, harm 4), not data.

### EX-PRV-6
Severity: MAJOR
Requirement ids: NS-53-R56, R54, R115, R113, O-13, O-14, G3, section 10.2, section 17
Finding: O-13 asks whether to store a picture identifier for "Leave out this picture". My answer: yes, approve it. Without it a receipt, screenshot-adjacent or sensitive picture cannot be kept out, and "Not this one" removes a whole day. A stored `localIdentifier` is not content, never leaves the phone, and lets the parent narrow what the product shows, which is collecting less in effect. But an identifier file is still a list of the pictures a parent found sensitive, so it needs five controls the PRD only partly states:
1. Same store as the decisions file: reuse the ADR 0032 write order (empty temp, set backup exclusion, read back, write, rename, read back) already built in `apps/mobile/src/lib/days/store-file.ts`. Add a test that the exclusion flag is read back true after every rewrite, because an atomic replace recreates the file.
2. File protection at least the level `DATA_CLASSIFICATION.md` row L4 requires for device files ("iOS Data Protection at least complete until first user authentication"; the release blocks if an L4 store lacks a recorded control). The PRD says "no weaker than `scribe.db`"; I did not read what `scribe.db` uses, so record the actual class in the classification table. UNVERIFIED.
3. Prune: at each scan, identifiers that no longer resolve to an asset are dropped, so the file never keeps a record of a picture the parent has deleted.
4. Never keyed with a date, place or day key in the same record, never logged, never in an error (R110 closed error codes cover this), never in Find or any index (R114).
5. Say plainly in the Me row that left-out pictures are remembered on this phone only. A new phone or a restore starts fresh because local identifiers are not portable and the file is outside backup (U17). The parent will see a left-out picture again on a new phone; that limit is honest, and writing it down is better than a surprise.
O-14 (album identifier, title shown verbatim, full access only): approve on the same controls. An album title is parent-authored text and may name a person or a place; it is shown only to the parent, in Me and on days that album supplies, and is never copied into a letter.
Evidence: `28-moments-tab.md` line 332 (R56), line 307 (7.4), line 533 (10.2), line 809 (17); `apps/mobile/src/lib/days/store-file.ts` lines 1 to 4 and 74 to 81; `docs/adr/0032-on-device-sensitive-store.md` lines 9 and 16; `docs/legal/DATA_CLASSIFICATION.md` line 68. Source read.

### EX-PRV-7
Severity: MAJOR
Requirement ids: NS-53-R167, R87, R36, R130, section 18, RV-16, O-18
Finding: Three problems in the analytics design, which is otherwise the right closed allowlist.
1. Birthday inference. Section 18 says it does not propose "any week-level or timestamp that could mark a Day or birthday", but `ui.moments_card.impressed` and `.tapped` carry `kind` values `occasion` and `age_day`. Those fire only on the child's birthday, a month day, a typed day or a ticked day. An event stream with those kinds and server timestamps marks the child's birth month and day (every month for `age_day`). The child's birth date is L4 (`DATA_CLASSIFICATION.md` line 58, item 6; it must not appear in analytics in any derived form). `year_ago` likewise marks a letter date.
2. Contradiction on `moment`. R87 says no log line or event records that a letter began from a moment, and "`capture_started` with source `moment` sends nothing that says so". Section 18 lists `capture.letter.started` with `source` "now including `moment`" and defers to MT-P4-R4. The rows disagree. Because a moment can only start from a card, the value is not a library fact, but it is provenance, and the PRD itself bans provenance on the wire (13.2 rule 4).
3. Access-state leak. `system.error.raised` with `code: library_unreadable` or `fallback_used` and `area: moments` tells a server that the library is denied or unreadable for this user. That is the permission result by another name, which section 18 and O-18 exclude.
Proposed change:
1. Drop `occasion`, `age_day` and `year_ago` from the `kind` enum. Impression and tap events carry no `kind`, or a single value `dated` that any date-based card shares. Keep `prompt`.
2. Resolve R87 against section 18 in favour of R87: `capture.letter.started` keeps its existing source list without `moment`; the closed source list in `start-capture.ts` may include it locally. Update section 18.
3. Remove `library_unreadable` and `fallback_used` from the analytics `code` list; keep them as local error codes only. `picker_unavailable` can stay.
4. `ui.moments_ask_allow.tapped` is a tap on our own control before Apple's sheet and says nothing about the result. Keep, with the note that no event may follow that varies with the result.
Analytics is off at 1.0 (R167), so nothing leaks today. This is a MAJOR because the registry rows are the thing that becomes hard to remove once analytics is on and a schema is published.
Evidence: `28-moments-tab.md` lines 831 to 839 (section 18), line 485 (R87), line 651 (13.2 rule 4), line 843 (R167). Source read.

### EX-PRV-8
Severity: MAJOR
Requirement ids: NS-53-R81, R166, R169, R175, section 17, RK-9, RK-10, RV-04
Finding: R81 states the right rule (per data type, same build, never "Data Not Collected" for the whole app). Four things need to be made concrete, because this is where a parent's trust and the App Store label are decided.
1. The documents are stale and must not be edited from this PRD. `docs/legal/privacy-policy.md` line 21 says servers are off in "the first App Store build"; `apps/mobile/src/lib/capabilities.ts` lines 7 to 12 say the store profiles stay off; `apps/mobile/eas.json` lines 47 and 61 set `EXPO_PUBLIC_SERVER_FEATURES` to "on" for preview and production. `docs/legal/app-store-privacy-labels.md` line 54 says "Photos or Videos: No photo feature in v1.0" and line 50 says Location is not requested. All four need rewriting for the production profile, as RK-9 says. Owner: `legal` with me, merged by the founder as legal text.
2. Stored copies and iPhone backup. A picture copied into `entry_media` is in the app container and is not excluded from backup (verified fact, PRD line 816; ADR 0032 line 9: `scribe.db` is backed up whole). Those pictures are of the child. The copy lands in the parent's own iCloud or computer backup, held by Apple on the parent's account, not collected by us under Apple's definition (counsel must confirm). The policy needs one plain line saying so, in the same build as the picture attach. I do not recommend excluding `entry_media` from backup: a parent restoring a phone would lose every picture on a letter while the words survive (Variant A syncs no media). Disclosure is the honest answer; the exclusion is a separate decision for the founder if the policy line is not enough.
3. R166 says the answer to an access or deletion request is "that we hold nothing from the library". True for the read. Not true as written for what a parent chose to attach (copies on the phone, which we do not hold under Variant A) or a place label the parent chose to write into a letter (letter text, which syncs under the sensitive-data consent). Reword: "we hold nothing that the library read produced; pictures a parent attaches are copies held on their phone, and words they write sync as letters do."
4. Label per data type, for the production profile (servers on), for the library read ON, P-B off, phase 2 email dark:

| Apple data type | Collected? | Linked | Why |
|---|---|---|---|
| Photos or Videos | No | n/a | Pictures are read and shown on the phone; attached copies stay in the app container; nothing uploaded (verified: no build uploads or stores pictures today; Variant A syncs no media) |
| Precise Location | No | n/a | Coordinates read on the phone only and not returned above Swift (EX-PRV-3); becomes Yes the day P-B is on |
| Coarse Location | No | n/a | A city name derived on the phone is not sent. If the founder later syncs a place label chosen into letter text it is letter text (Other User Content), not a location field |
| Other User Content | Yes | Yes | Letter text, parent-chosen labels written into a letter; already declared |
| Audio Data | No while backup is off | n/a | Yes, linked, when D-100 backup ships; the label of record must change in that build |
| Sensitive Info | Yes | Yes | Due date (pregnancy information); already declared (`app-store-privacy-labels.md` line 49) |
| Contact Info (email) | Yes | Yes | Account; phase 2 email rows add purposes, not a type |
| Identifiers (user id) | Yes | Yes | Account |
| Usage Data, Diagnostics | No | n/a | Analytics and crash reporting are off in v1.0 (D-095); re-answer in the build that turns them on |
| Health and Fitness | Counsel must confirm | | Letter free text may contain health details; the existing answer stands unless counsel changes it |

Counsel must confirm: the "No" for Photos or Videos and Location rests on Apple's definition that data is collected only when it leaves the device; the backup line; and whether a preview or production build that links the geocoder adapter changes the answer (EX-PRV-4 removes the question).
Proposed change: add to R81 the table above as the intent of the label answer; add a row to section 17 that `legal` and `privacy` re-read policy, label, purpose string and in-app disclosures against this table in the build that sets F2 on; add the reworded R166 sentence; keep the founder's decision on excluding `entry_media` from backup as a separate question with my recommendation (disclose, do not exclude).
Evidence: `docs/legal/privacy-policy.md` line 21; `apps/mobile/src/lib/capabilities.ts` lines 7 to 12; `apps/mobile/eas.json` lines 47 and 61; `docs/legal/app-store-privacy-labels.md` lines 49, 50, 54; `28-moments-tab.md` lines 460, 813, 816, 824; `docs/adr/0032-on-device-sensitive-store.md` line 9. Source read. Apple's definitions are carried from the leads and `docs/legal/app-store-privacy-labels.md`; I did not re-read Apple's page this session, so the table is UNVERIFIED against Apple's current wording until `legal` does.

### EX-PRV-9
Severity: MINOR
Requirement ids: NS-53-R44, R56, R112, R102, 7.3, 7.4
Finding: Tiles are chosen from time, hearts and earlier picks with no knowledge of content (the right design). The consequence is that an intimate, medical or other-people's picture in a qualifying day can appear as a thumbnail on a card, on an unlocked phone, before the parent has had any chance to leave it out. "Leave out this picture" is specified for the day sheet (the picker route) and is not stated for the card. R102 covers the app switcher, not a person looking over a shoulder. This is the same exposure as the Photos app's own Memories and the PRD already excludes hidden assets; I rate it MINOR because it is shared with the platform's own behaviour.
Proposed change: make "Leave out this picture" reachable from the card's menu on the tile (one tap, with Undo), not only inside the day sheet; state that the hidden album and Recently Deleted are never read (the fetch does not set `includeHiddenAssets`; whether PhotoKit's default fetch excludes Recently Deleted is UNVERIFIED and goes in the G1 spike).
Evidence: `28-moments-tab.md` lines 297 to 299, 307, 332, 500; line 287 (hidden never read). Source read.

### EX-PRV-10
Severity: MINOR
Requirement ids: NS-53-R78, R115, R97, R93, 8.5, 10.1 step 12
Finding: Turn off removes everything the tab holds on the phone at once, and "kept letters and their copies remain because they are the parent's letter content" (10.1 step 12). That is right, and a parent who turns the feature off may expect their attached pictures to go too. The Decline and withdraw column of 8.5 does not say it. Separately, a place label the parent chooses to write into a letter becomes letter text and syncs with the book under the sensitive-data consent; the Review step should make that visible when a place is the text being added.
Proposed change: add to the Decline column and to the Me row: "Turning this off does not remove pictures already in your letters." Add to R93: when a parent picks a place label as text, Review shows it as their own words like any other text. The placement of that sentence is `content`'s.
Evidence: `28-moments-tab.md` lines 439, 529, 491. Source read.

### EX-PRV-11
Severity: MINOR
Requirement ids: NS-53-R140, R141, R142, R188, 13.1, 13.6, RV-09, O-03, C-4
Finding: Phase 2 and dark, so MINOR. Two points for when it is built. First, a lifecycle email built from the child's date of birth reveals the birthday and month days to the email processor through the send schedule, and the recipient list identifies the parent. That is a child's L4 fact going to a vendor by inference, even with no child name in the body. Second, the one-click unsubscribe must leave a suppression record for the address (CAN-SPAM), which is a retention exception to "hard delete at once" in R140 and to account deletion in R142 and must be stated in the retention promise.
Proposed change: for the first email build, only the parent-chosen occasion date (X6 Tier 2) drives sends; the birth-date-derived emails (`birthday`, `monthAge`, the "dob-email choice") stay off until counsel answers whether the processor inference counts. Name the email processor in `docs/legal/subprocessors.md` before any send and state the suppression record exception. Counsel must confirm CQ-17 (transactional or commercial) as the PRD says.
Evidence: `28-moments-tab.md` lines 640, 672 to 674, 696 to 698. Source read; `docs/legal/subprocessors.md` not re-read this session (the PRD cites it through the privacy skill's vendor screening rule). UNVERIFIED whether the processor is already listed.

### EX-PRV-12
Severity: MINOR
Requirement ids: NS-53-R60, R107, R176, R161, R174, G1, G4, E7, 19.2 preview profile
Finding: The device spike (G1) and the five-parent card sort on "the real-library trial" (E7, R60) put real family libraries in front of a developer or a researcher. The read-out rule "no real data" (H-8, R176) covers files; it does not cover the session. Preview and development builds carry the flag on and the preview profile has server features on (`eas.json` line 47), so a tester's phone with a real library runs a build that can reach a server, even though nothing library-derived is meant to.
Proposed change: card sort and spike protocol (with `user-research`): participant uses their own phone and holds it; no screen recording, no screenshots, no photographing the screen; consent sheet says what is read and shown; the read-out records only x of n and the failing card kind; any distress answer stops the session (R174 already says this). For the founder's own phone spike: read-out carries timings and counts of nothing personal; no place names, no child's name, no real date. Add a preview build test that the canary library produces zero requests to any host during a scan.
Evidence: `28-moments-tab.md` lines 336, 505, 892, 906; `apps/mobile/eas.json` line 47. Source read.

### EX-PRV-13
Severity: MINOR
Requirement ids: NS-53-R110, R72, R81, R169, 10.3
Finding: Two details in the native module that a privacy review should pin. (1) 10.3 skips the scan "when storage is critical", which reads free disk space. Apple's privacy manifest requires a declared reason for the disk space API category, and the manifest's collected data types must match the label (EX-PRV-8). UNVERIFIED: I did not read Apple's current required-reason list this session; `mobile` verifies it against Apple's page. (2) The native module must not write asset identifiers, dates or coordinates to the unified system log, and PhotoKit errors can carry them in their user info; R110 says "closed error code with no path, id or date" and "nothing logs an identifier" but does not name the system log or the error's user info.
Proposed change: add to R110 a source scan that fails on `os_log`, `NSLog`, `print` and `Logger` calls in `scribe-library` that interpolate any asset property, and a rule that error handling maps every PhotoKit error to the closed code and discards user info. Add the privacy manifest entry, and the matching collected-data answers, to the checklist of R169.
Evidence: `28-moments-tab.md` lines 537, 544; line 874 (R169). Source read; Apple's manifest rule UNVERIFIED.

### EX-PRV-14
Severity: MINOR
Requirement ids: NS-53-R162, R104, R103, R93, R88, 17
Finding: The canary test of R162 runs an asset id, album, date, coordinate and filename "through every path (primer, Recent, picker, push, email)". The paths where a library-derived value is most likely to be near a network are attach, Keep, the sync outbox and mapper, and Save a copy and export. Those are not on the list, and the production profile has the sync client on.
Proposed change: extend R162 to the attach pipeline, Keep, the outbox and push mapper (a synthetic attached picture and a synthetic place-label letter must produce a sync payload containing the words only, and no media row, id, coordinate or place key), and export. Add an automated source scan that `scribe-library` imports no networking API (URLSession, NWConnection, CFNetwork) in any profile. The airplane mode check in R118 stays an L5 manual script; this adds an L1 check beside it.
Evidence: `28-moments-tab.md` lines 820, 502, 552; line 502 (R104). Source read.

## READ_SET_V1 recommendation (G3, O-15)

Recommendation to the founder: APPROVE WITH CHANGES. The founder signs; this is my recommendation, and counsel must confirm items 4 to 6.

| Member | Decision | Condition |
|---|---|---|
| Local identifier | Approve | In memory only, except the left-out identifier (EX-PRV-6); never in a route, log, error or analytics |
| Creation date | Approve | In memory; local calendar day via the phone's zone |
| Media type, duration | Approve | Duration as text and a glyph only |
| Subtype flags (screenshot, screen recording, animation, panorama, Live Photo, video variants) | Approve | Used only to exclude and to choose a layout; no pixel is read |
| `isFavorite` (hearts) | Approve | In memory; never exported, never in a notification, never ranked from a count; adds no new data class because it is the parent's own mark on their own phone |
| `burstIdentifier` | Approve | Opaque grouping key, in memory only |
| Location | Approve with conditions | Rounded to the table cell inside Swift and never returned (EX-PRV-3); `coordinate` only, no altitude, speed, course, accuracy or timestamp; behaviour under Limited access and with "share without location" verified in G1; the primer and purpose string name it (EX-PRV-1); no place line in a quiet or expecting-only book (EX-PRV-2) |
| Stored left-out identifier (O-13) | Approve with conditions | The five controls of EX-PRV-6 |
| Album identifier and verbatim title (O-14) | Approve with conditions | Same controls; full access only; parent-facing only; never copied into a letter |

Not in the set and to stay out: filenames and original resource names, EXIF text, captions or titles, faces and people, scene or object labels, cloud identifiers, shared album content, hidden assets, and any `PHAsset` property not named above. The R37 scan on property names stays and is extended to `CLLocation` members.

Why approve rather than reject: the set reads only metadata the parent's own phone already holds, the product shows the result only to that parent, every exit is blocked by design and tested, and the alternative (the out-of-process picker alone) cannot give days or places. The risk is not the read; it is what the cards then say to a person on a bad day, which is EX-PRV-2 and EX-PRV-5.

## Retention and deletion check (answers to the questions I was asked)

| Data | Where | Retention | Removed by | Verdict |
|---|---|---|---|---|
| Decisions file (day keys, parent label, hidden place keys, home correction, left-out and album identifiers) | `moments.json`, outside `scribe.db`, outside backup | Until the parent removes it | Turn off, Erase, sign-out, Delete account; downgrade of access in Settings empties the library-derived part | Acceptable with EX-PRV-5 item 5 and EX-PRV-6 prune and read-back |
| Coordinates, place ids, home place, thumbnails | Memory only | The session | App exit | Acceptable once EX-PRV-3 lands (coordinates never reach JS) |
| Attached picture copies | `entry_media`, app container | With the letter | Letter deletion paths (R97) | Acceptable; the backup line is the disclosure (EX-PRV-8) |
| Place label chosen into a letter | Letter text, synced under consent | With the letter | Letter deletion and account deletion (day 30 purge, existing) | Acceptable; Review states it is the parent's words (EX-PRV-10) |
| Phase 2 occasion rows and consent row | Server | Until the parent deletes; hard delete on request | Parent delete; account deletion (R142) | Acceptable with the suppression record exception stated (EX-PRV-11) |
| Analytics events | None at 1.0 | n/a | n/a | Acceptable; allowlist changes in EX-PRV-7 first |

"Nothing library-derived leaves the phone" is true in every path I traced (scan, thumbnail, place lookup, day sheet, attach, Keep, notification, export) with three exceptions that are controls rather than leaks: the Apple geocoder (EX-PRV-4, off and, with the change, not in the binary), the attach copy in the parent's own phone backup (EX-PRV-8, disclosed), and a place label a parent chooses to write into a letter (EX-PRV-10, their own words under the existing consent). No local reminder, in-app card or pending notification request carries a library fact in its content (R131, R135); phase 2's library-timed reminder stays F4 off, which matches my recommendation on O-02.

## Where the Shown, Records, Never, Decline set (8.5) is incomplete

- Primer row: Shown omits the place read (EX-PRV-1); Decline omits that attached pictures stay (EX-PRV-10).
- Teaching acts row: Records lists "a day key (or an album or picture identifier where 7.4 says OPEN)" and omits the hidden place key and the home correction key, which R65 and 7a.2 add. Add them, labelled L4.
- Nudge opt-in row: add "the time of the reminder is chosen on the phone and never sent".
- No row for the place line itself ("Not this place", "Hide this place"): add one, with the controls of EX-PRV-5.

## Questions I could not close (UNVERIFIED, and who owns each)

- Whether `asset.location` is readable under Limited access without a separate location permission, and how it behaves for pictures shared without location: `mobile`, G1.
- Whether PhotoKit's default fetch excludes Recently Deleted: `mobile`, G1.
- File protection class of `scribe.db` and of the decisions file: `mobile` records it in the classification table.
- Apple's current required-reason list and label wording: `legal` and `mobile`, before the build.
- Offline place table licence, size and coarseness: `mobile`, G1 and RK-5.
- How the hard-stretch state is detected and whether it can be read by the Moments engine in the same call as the library gate: `core`.
- The email processor and whether it is listed in `docs/legal/subprocessors.md`: `legal`.

## For the review log (25.13)

Round 1, 21 Nov 2026, Privacy: ACCEPT-WITH-CHANGES. Rows to change: R24, R32, R37, R43, R47, R56, R61, R62, R63, R64, R65, R72, R81, R87, R93, R104, R110, R162, R166, R167, section 8.5, section 17, section 18, section 21 G3 (record the signed set). Next action: `product` folds EX-PRV-1 to EX-PRV-8 into the rows; I re-read them and sign G3 and the label table before F2 is turned on.

Chief Privacy Officer (a role played by an AI session, not counsel)
